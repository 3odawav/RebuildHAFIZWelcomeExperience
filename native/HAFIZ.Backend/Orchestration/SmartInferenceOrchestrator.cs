using HAFIZ.Backend.Gpu;
using HAFIZ.Backend.Workers;
using HAFIZ.Core.Models;
using HAFIZ.Infrastructure.Providers;

namespace HAFIZ.Backend.Orchestration;

public sealed record TaskRoutePlan(
    string TaskKind,
    LocalInferenceProvider SelectedProvider,
    string WorkerId,
    string TargetModelId,
    bool RequiresHeavyVramSlot,
    int EstimatedVramMb,
    string Notes);

/// <summary>
/// Task-aware Smart Inference Orchestrator:
/// - Keeps lightweight conversational stack warm when budget permits.
/// - Supports switching seamlessly between HAFIZ-managed local llama.cpp and external LM Studio (127.0.0.1:1234).
/// - Uses lazy initialization + SingleHeavyModelLock for BS-RoFormer, Demucs, and Seed-VC.
/// - Never unloads external LM Studio models without explicit user permission.
/// </summary>
public sealed class SmartInferenceOrchestrator
{
    private readonly GpuMemoryGuard _gpuGuard;
    private readonly WorkerProcessSupervisor _supervisor;
    private readonly LmStudioDiscoveryClient _lmStudio;

    public SmartInferenceOrchestrator(
        GpuMemoryGuard gpuGuard,
        WorkerProcessSupervisor supervisor,
        LmStudioDiscoveryClient lmStudio)
    {
        _gpuGuard = gpuGuard;
        _supervisor = supervisor;
        _lmStudio = lmStudio;
    }

    public async Task<TaskRoutePlan> PlanTaskRouteAsync(
        ModelCapability capability,
        AppSettings settings,
        CancellationToken ct = default)
    {
        if (capability is ModelCapability.AssistantLlm or ModelCapability.SongwritingLlm or ModelCapability.CodeAndAnalysisLlm)
        {
            if (settings.InferenceProvider == LocalInferenceProvider.LmStudioExternal)
            {
                var discovery = await _lmStudio.DiscoverModelsAsync(settings.LmStudioBaseUrl, ct: ct);
                var chosen = !string.IsNullOrWhiteSpace(settings.LmStudioSelectedModelId)
                    ? settings.LmStudioSelectedModelId
                    : discovery.Models.FirstOrDefault(m => m.State.Equals("loaded", StringComparison.OrdinalIgnoreCase))?.Id
                      ?? discovery.Models.FirstOrDefault()?.Id
                      ?? "lmstudio-unselected";

                return new TaskRoutePlan(
                    capability.ToString(),
                    LocalInferenceProvider.LmStudioExternal,
                    "external-lmstudio",
                    chosen,
                    RequiresHeavyVramSlot: false,
                    EstimatedVramMb: 0,
                    Notes: discovery.Reachable
                        ? $"Routed to live LM Studio at {settings.LmStudioBaseUrl} ({discovery.Models.Count} models discovered)."
                        : $"LM Studio unreachable at {settings.LmStudioBaseUrl}: {discovery.ErrorMessage}");
            }

            var modelId = capability switch
            {
                ModelCapability.CodeAndAnalysisLlm => "qwen2.5-coder-14b-q4_k_m",
                ModelCapability.SongwritingLlm => "qwen3.5-9b-q4_k_m",
                _ => "qwen3.5-9b-q4_k_m"
            };

            return new TaskRoutePlan(
                capability.ToString(),
                LocalInferenceProvider.EmbeddedLlamaCpp,
                "hafiz-llama-server",
                modelId,
                RequiresHeavyVramSlot: true,
                EstimatedVramMb: capability == ModelCapability.CodeAndAnalysisLlm ? 9600 : 6800,
                Notes: "Routed to HAFIZ-managed llama-server.exe with Turing SM75 CUDA offload.");
        }

        return capability switch
        {
            ModelCapability.SpeechToText => new TaskRoutePlan(
                "SpeechToText",
                settings.InferenceProvider,
                "hafiz-transcribe-cpp",
                "cohere-transcribe-03-2026-q4_0.gguf",
                RequiresHeavyVramSlot: false,
                EstimatedVramMb: 2400,
                Notes: "Isolated transcribe.cpp worker (GGUF Cohere Transcribe requires transcribe.cpp, not llama.cpp)."),

            ModelCapability.TextToSpeech => new TaskRoutePlan(
                "TextToSpeech",
                settings.InferenceProvider,
                "hafiz-egyptian-tts",
                "voicetut-egyptian-tashkeel",
                RequiresHeavyVramSlot: false,
                EstimatedVramMb: 2600,
                Notes: "Isolated Egyptian Arabic TTS + diacritics worker (FP16 SM75)."),

            ModelCapability.VoiceConversion => new TaskRoutePlan(
                "VoiceConversion",
                settings.InferenceProvider,
                "hafiz-seed-vc",
                "seed-vc-singing",
                RequiresHeavyVramSlot: true,
                EstimatedVramMb: 4400,
                Notes: "Lazy-loaded Seed-VC singing & voice conversion worker (MiniMax excluded)."),

            ModelCapability.StemSeparation => new TaskRoutePlan(
                "StemSeparation",
                settings.InferenceProvider,
                "hafiz-stems-worker",
                "bs-roformer+htdemucs_6s",
                RequiresHeavyVramSlot: true,
                EstimatedVramMb: 3800,
                Notes: "Lazy-loaded BS-RoFormer vocal isolation + Demucs 6-stems pipeline."),

            _ => new TaskRoutePlan(
                capability.ToString(),
                settings.InferenceProvider,
                "hafiz-vad-onnx",
                "silero-vad-onnx",
                RequiresHeavyVramSlot: false,
                EstimatedVramMb: 128,
                Notes: "Always-ready lightweight Silero VAD ONNX worker.")
        };
    }

    public async Task<GpuAdmissionDecision> PrepareHeavyWorkerAsync(
        TaskRoutePlan plan,
        AppSettings settings,
        CancellationToken ct = default)
    {
        if (plan.SelectedProvider == LocalInferenceProvider.LmStudioExternal && plan.WorkerId == "external-lmstudio")
        {
            return new GpuAdmissionDecision(true, "Managed externally by LM Studio; HAFIZ did not modify external VRAM.", Array.Empty<string>(), true);
        }

        _gpuGuard.SafetyMarginMb = (int)Math.Round(settings.VramSafetyMarginGb * 1024);
        _gpuGuard.IdleUnloadSeconds = settings.IdleUnloadTimeoutSeconds;

        var decision = await _gpuGuard.EvaluateAdmissionAsync(
            plan.WorkerId,
            plan.EstimatedVramMb,
            plan.RequiresHeavyVramSlot,
            true,
            ct);

        if (!decision.Allowed)
        {
            return decision;
        }

        foreach (var workerToUnload in decision.WorkersToUnloadFirst)
        {
            await _supervisor.StopWorkerAsync(workerToUnload, ct);
            _gpuGuard.ReleaseLease(workerToUnload);
        }

        return decision;
    }

    public Task<PurgeVramResult> PurgeHafizVramAsync(CancellationToken ct = default)
    {
        return _gpuGuard.PurgeHafizOnlyAsync((workerId, token) => _supervisor.StopWorkerAsync(workerId, token), ct);
    }
}
