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
/// Task-aware route planning and safe HAFIZ-owned worker admission.
/// This component plans and protects resources; it does not claim to load a model
/// unless a concrete worker launch and readiness handshake have completed.
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
                Notes: "Planned embedded llama-server route. A real worker path and ready handshake are still required before inference.");
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
                Notes: "Planned transcribe.cpp route; readiness must be confirmed by the installed executable and model."),

            ModelCapability.TextToSpeech => new TaskRoutePlan(
                "TextToSpeech",
                settings.InferenceProvider,
                "hafiz-egyptian-tts",
                "voicetut-egyptian-tashkeel",
                RequiresHeavyVramSlot: false,
                EstimatedVramMb: 2600,
                Notes: "Planned Egyptian TTS route; no audio is produced until the configured worker returns a real output."),

            ModelCapability.VoiceConversion => new TaskRoutePlan(
                "VoiceConversion",
                settings.InferenceProvider,
                "hafiz-seed-vc",
                "seed-vc-singing",
                RequiresHeavyVramSlot: true,
                EstimatedVramMb: 4400,
                Notes: "Lazy-loaded Seed-VC worker plan (MiniMax excluded)."),

            ModelCapability.StemSeparation => new TaskRoutePlan(
                "StemSeparation",
                settings.InferenceProvider,
                "hafiz-stems-worker",
                "bs-roformer+htdemucs_6s",
                RequiresHeavyVramSlot: true,
                EstimatedVramMb: 3800,
                Notes: "Lazy-loaded BS-RoFormer + Demucs worker plan; readiness and output files must be verified."),

            _ => new TaskRoutePlan(
                capability.ToString(),
                settings.InferenceProvider,
                "hafiz-vad-onnx",
                "silero-vad-onnx",
                RequiresHeavyVramSlot: false,
                EstimatedVramMb: 128,
                Notes: "Planned lightweight VAD worker.")
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
            var stopped = await _supervisor.StopWorkerAsync(workerToUnload, ct);
            if (!stopped)
            {
                return new GpuAdmissionDecision(
                    false,
                    $"HAFIZ worker '{workerToUnload}' could not be confirmed stopped. The new operation was not admitted.",
                    Array.Empty<string>(),
                    decision.ExternalGpuWorkloadDetected);
            }

            _gpuGuard.ReleaseLease(workerToUnload);
        }

        return decision;
    }

    public Task<PurgeVramResult> PurgeHafizVramAsync(CancellationToken ct = default)
    {
        return _gpuGuard.PurgeHafizOnlyAsync(
            (workerId, token) => _supervisor.StopWorkerAsync(workerId, token),
            ct);
    }
}
