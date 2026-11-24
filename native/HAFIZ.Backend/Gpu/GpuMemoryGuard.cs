using HAFIZ.Core.Models;
using HAFIZ.Infrastructure.Hardware;

namespace HAFIZ.Backend.Gpu;

public sealed record LoadedWorkerLease(
    string WorkerId,
    string DisplayName,
    ModelCapability Capability,
    int EstimatedVramMb,
    bool IsHeavy,
    DateTimeOffset LoadedAtUtc,
    DateTimeOffset LastUsedAtUtc);

public sealed record GpuAdmissionDecision(
    bool Allowed,
    string Reason,
    IReadOnlyList<string> WorkersToUnloadFirst,
    bool ExternalGpuWorkloadDetected);

public sealed record PurgeVramResult(
    bool Success,
    int UnloadedHafizWorkerCount,
    int? VramBeforeMb,
    int? VramAfterMb,
    int? ReclaimedMb,
    bool PreservedExternalWorkloads,
    string Message);

/// <summary>
/// Enforces the 16GB NVIDIA Quadro RTX 5000 (Turing SM75) memory discipline:
/// - Tracks only HAFIZ-owned worker leases.
/// - Enforces SingleHeavyModelLock so two heavy models (e.g. Qwen + Seed-VC or BS-RoFormer) never collide.
/// - Protects external GPU processes (Unsloth, LM Studio, ComfyUI) and NEVER kills or unloads them.
/// - Supports HAFIZ-only Purge VRAM returning real measured before/after VRAM telemetry.
/// </summary>
public sealed class GpuMemoryGuard
{
    private readonly IHardwareInspector _hardwareInspector;
    private readonly Dictionary<string, LoadedWorkerLease> _activeLeases = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _sync = new();

    public int TotalBudgetMb { get; set; } = 16384;
    public int SafetyMarginMb { get; set; } = 1800;
    public int IdleUnloadSeconds { get; set; } = 120;

    public GpuMemoryGuard(IHardwareInspector hardwareInspector)
    {
        _hardwareInspector = hardwareInspector;
    }

    public IReadOnlyList<LoadedWorkerLease> GetActiveLeases()
    {
        lock (_sync)
        {
            return _activeLeases.Values.OrderByDescending(l => l.LastUsedAtUtc).ToList();
        }
    }

    public async Task<GpuAdmissionDecision> EvaluateAdmissionAsync(
        string workerId,
        int requiredVramMb,
        bool isHeavy,
        bool protectExternalGpuWorkloads = true,
        CancellationToken ct = default)
    {
        var telemetry = await _hardwareInspector.ProbeGpuAsync(ct);
        var externalProcesses = telemetry.TelemetryAvailable
            ? telemetry.ActiveProcesses.Where(p => !p.IsHafizOwned).ToList()
            : new List<GpuProcessInfo>();

        var externalVramMb = externalProcesses.Sum(p => p.UsedVramMb);
        var effectiveTotalMb = telemetry.TelemetryAvailable && telemetry.TotalVramMb > 0
            ? telemetry.TotalVramMb
            : TotalBudgetMb;

        var usableCeilingMb = Math.Max(1024, effectiveTotalMb - SafetyMarginMb - externalVramMb);

        lock (_sync)
        {
            if (_activeLeases.ContainsKey(workerId))
            {
                return new GpuAdmissionDecision(true, "Worker already warm in VRAM.", Array.Empty<string>(), externalProcesses.Count > 0);
            }

            if (protectExternalGpuWorkloads && requiredVramMb > usableCeilingMb)
            {
                return new GpuAdmissionDecision(
                    false,
                    $"Insufficient safe VRAM ({usableCeilingMb} MB available after {externalVramMb} MB external GPU usage and {SafetyMarginMb} MB safety margin; need {requiredVramMb} MB). External GPU workloads were preserved.",
                    Array.Empty<string>(),
                    externalProcesses.Count > 0);
            }

            var toUnload = new List<string>();
            var hafizUsedMb = _activeLeases.Values.Sum(l => l.EstimatedVramMb);

            // SingleHeavyModelLock: unload any other heavy HAFIZ worker before admitting a new heavy worker
            if (isHeavy)
            {
                foreach (var lease in _activeLeases.Values.Where(l => l.IsHeavy).OrderBy(l => l.LastUsedAtUtc))
                {
                    toUnload.Add(lease.WorkerId);
                    hafizUsedMb -= lease.EstimatedVramMb;
                }
            }

            // Evict oldest HAFIZ workers until within safe ceiling
            foreach (var lease in _activeLeases.Values.OrderBy(l => l.LastUsedAtUtc))
            {
                if (hafizUsedMb + requiredVramMb <= usableCeilingMb) break;
                if (toUnload.Contains(lease.WorkerId)) continue;
                toUnload.Add(lease.WorkerId);
                hafizUsedMb -= lease.EstimatedVramMb;
            }

            if (hafizUsedMb + requiredVramMb > usableCeilingMb)
            {
                return new GpuAdmissionDecision(
                    false,
                    $"Model requires {requiredVramMb} MB VRAM which exceeds safe budget ({usableCeilingMb} MB).",
                    toUnload,
                    externalProcesses.Count > 0);
            }

            return new GpuAdmissionDecision(true, "Admitted within 16GB RTX 5000 VRAM budget.", toUnload, externalProcesses.Count > 0);
        }
    }

    public void RegisterLease(LoadedWorkerLease lease)
    {
        lock (_sync)
        {
            _activeLeases[lease.WorkerId] = lease;
        }
    }

    public void TouchLease(string workerId)
    {
        lock (_sync)
        {
            if (_activeLeases.TryGetValue(workerId, out var existing))
            {
                _activeLeases[workerId] = existing with { LastUsedAtUtc = DateTimeOffset.UtcNow };
            }
        }
    }

    public void ReleaseLease(string workerId)
    {
        lock (_sync)
        {
            _activeLeases.Remove(workerId);
        }
    }

    public IReadOnlyList<string> FindIdleLeases(DateTimeOffset nowUtc)
    {
        lock (_sync)
        {
            var cutoff = nowUtc - TimeSpan.FromSeconds(IdleUnloadSeconds);
            return _activeLeases.Values
                .Where(l => l.LastUsedAtUtc < cutoff)
                .Select(l => l.WorkerId)
                .ToList();
        }
    }

    /// <summary>
    /// Unloads ONLY HAFIZ-owned worker leases via the provided callback and measures real VRAM before/after.
    /// External processes (Unsloth, LM Studio, ComfyUI) are strictly untouched.
    /// </summary>
    public async Task<PurgeVramResult> PurgeHafizOnlyAsync(
        Func<string, CancellationToken, Task> unloadWorkerAsync,
        CancellationToken ct = default)
    {
        var before = await _hardwareInspector.ProbeGpuAsync(ct);
        List<string> hafizWorkerIds;
        lock (_sync)
        {
            hafizWorkerIds = _activeLeases.Keys.ToList();
        }

        foreach (var id in hafizWorkerIds)
        {
            await unloadWorkerAsync(id, ct);
            ReleaseLease(id);
        }

        var after = await _hardwareInspector.ProbeGpuAsync(ct);
        int? beforeMb = before.TelemetryAvailable ? before.UsedVramMb : null;
        int? afterMb = after.TelemetryAvailable ? after.UsedVramMb : null;
        int? reclaimed = (beforeMb.HasValue && afterMb.HasValue) ? Math.Max(0, beforeMb.Value - afterMb.Value) : null;

        var externalCount = after.TelemetryAvailable
            ? after.ActiveProcesses.Count(p => !p.IsHafizOwned)
            : 0;

        var msg = before.TelemetryAvailable && after.TelemetryAvailable
            ? $"Unloaded {hafizWorkerIds.Count} HAFIZ worker(s). Measured VRAM: {beforeMb} MB -> {afterMb} MB (reclaimed {reclaimed} MB). External GPU processes preserved: {externalCount}."
            : $"Unloaded {hafizWorkerIds.Count} HAFIZ worker(s). Live GPU telemetry unavailable in current environment; no external processes were touched.";

        return new PurgeVramResult(
            true,
            hafizWorkerIds.Count,
            beforeMb,
            afterMb,
            reclaimed,
            PreservedExternalWorkloads: true,
            Message: msg);
    }
}
