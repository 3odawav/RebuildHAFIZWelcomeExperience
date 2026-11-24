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
    DateTimeOffset LastUsedAtUtc,
    bool IsBusy = false);

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
    int SkippedBusyWorkerCount,
    IReadOnlyList<string> FailedWorkerIds,
    string Message);

/// <summary>
/// Read-only GPU admission and HAFIZ-owned worker accounting.
/// Uses measured free VRAM, never inferred "used by model" values, and only proposes
/// idle HAFIZ-owned workers for release. A busy worker is never an eviction candidate.
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

    public void SetLeaseBusy(string workerId, bool isBusy)
    {
        lock (_sync)
        {
            if (_activeLeases.TryGetValue(workerId, out var existing))
            {
                _activeLeases[workerId] = existing with
                {
                    IsBusy = isBusy,
                    LastUsedAtUtc = isBusy ? DateTimeOffset.UtcNow : existing.LastUsedAtUtc
                };
            }
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
        var externalDetected = telemetry.TelemetryAvailable &&
                               telemetry.ActiveProcesses.Any(p => !p.IsHafizOwned);

        lock (_sync)
        {
            if (_activeLeases.ContainsKey(workerId))
            {
                return new GpuAdmissionDecision(true, "Worker already warm in VRAM.", Array.Empty<string>(), externalDetected);
            }

            if (requiredVramMb <= 0)
            {
                return new GpuAdmissionDecision(true, "No GPU memory reservation requested.", Array.Empty<string>(), externalDetected);
            }

            // Without a real free-VRAM sample, a heavy GPU admission cannot be made safely.
            // The configured 16 GB target is not a substitute for live telemetry.
            if (!telemetry.TelemetryAvailable && protectExternalGpuWorkloads)
            {
                return new GpuAdmissionDecision(
                    false,
                    "GPU telemetry is unavailable. The operation was not admitted because external GPU usage and free VRAM cannot be verified.",
                    Array.Empty<string>(),
                    ExternalGpuWorkloadDetected: false);
            }

            var availableMb = telemetry.TelemetryAvailable
                ? Math.Max(0, telemetry.FreeVramMb - Math.Max(0, SafetyMarginMb))
                : Math.Max(0, TotalBudgetMb - Math.Max(0, SafetyMarginMb) - _activeLeases.Values.Sum(l => l.EstimatedVramMb));

            var existing = _activeLeases.Values
                .Where(l => !l.WorkerId.Equals(workerId, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (isHeavy && existing.Any(l => l.IsHeavy && l.IsBusy))
            {
                return new GpuAdmissionDecision(
                    false,
                    "Another HAFIZ heavy worker is busy. Single-Model VRAM Guard will wait rather than interrupt active inference.",
                    Array.Empty<string>(),
                    externalDetected);
            }

            var toUnload = new List<LoadedWorkerLease>();

            // Heavy tasks first release other idle heavy HAFIZ workers.
            if (isHeavy)
            {
                foreach (var lease in existing
                             .Where(l => l.IsHeavy && !l.IsBusy)
                             .OrderBy(l => l.LastUsedAtUtc))
                {
                    toUnload.Add(lease);
                    availableMb += Math.Max(0, lease.EstimatedVramMb);
                }
            }

            // If still short, consider other idle HAFIZ-owned workers, oldest first.
            foreach (var lease in existing.OrderBy(l => l.LastUsedAtUtc))
            {
                if (availableMb >= requiredVramMb) break;
                if (lease.IsBusy || toUnload.Any(x => x.WorkerId.Equals(lease.WorkerId, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                toUnload.Add(lease);
                availableMb += Math.Max(0, lease.EstimatedVramMb);
            }

            if (availableMb < requiredVramMb)
            {
                var busyCount = existing.Count(l => l.IsBusy);
                return new GpuAdmissionDecision(
                    false,
                    $"Insufficient safe VRAM. Measured free VRAM after safety margin and eligible idle HAFIZ releases: {availableMb} MB; required estimate: {requiredVramMb} MB. Busy HAFIZ workers: {busyCount}. No worker was unloaded.",
                    Array.Empty<string>(),
                    externalDetected);
            }

            return new GpuAdmissionDecision(
                true,
                $"Admitted using measured free VRAM plus {toUnload.Count} eligible idle HAFIZ worker(s). External workloads remain untouched.",
                toUnload.Select(l => l.WorkerId).ToList(),
                externalDetected);
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
                .Where(l => !l.IsBusy && l.LastUsedAtUtc < cutoff)
                .Select(l => l.WorkerId)
                .ToList();
        }
    }

    /// <summary>
    /// Unloads only idle HAFIZ-owned workers confirmed stopped by the supervisor.
    /// Busy workers are skipped; failed stops remain registered and are reported.
    /// VRAM before/after values are measured independently and may not equal model allocation.
    /// </summary>
    public async Task<PurgeVramResult> PurgeHafizOnlyAsync(
        Func<string, CancellationToken, Task<bool>> unloadWorkerAsync,
        CancellationToken ct = default)
    {
        var before = await _hardwareInspector.ProbeGpuAsync(ct);
        var leases = GetActiveLeases();
        var busy = leases.Where(l => l.IsBusy).Select(l => l.WorkerId).ToList();
        var eligible = leases.Where(l => !l.IsBusy).Select(l => l.WorkerId).ToList();
        var unloaded = new List<string>();
        var failed = new List<string>();

        foreach (var id in eligible)
        {
            ct.ThrowIfCancellationRequested();
            bool stopped;
            try
            {
                stopped = await unloadWorkerAsync(id, ct);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch
            {
                stopped = false;
            }

            if (stopped)
            {
                ReleaseLease(id);
                unloaded.Add(id);
            }
            else
            {
                failed.Add(id);
            }
        }

        var after = await _hardwareInspector.ProbeGpuAsync(ct);
        int? beforeMb = before.TelemetryAvailable ? before.UsedVramMb : null;
        int? afterMb = after.TelemetryAvailable ? after.UsedVramMb : null;
        int? reclaimed = beforeMb.HasValue && afterMb.HasValue
            ? Math.Max(0, beforeMb.Value - afterMb.Value)
            : null;

        var success = busy.Count == 0 && failed.Count == 0;
        var externalCount = after.TelemetryAvailable
            ? after.ActiveProcesses.Count(p => !p.IsHafizOwned)
            : 0;

        string message;
        if (leases.Count == 0)
        {
            message = "No HAFIZ-owned workers are registered. No process was stopped.";
        }
        else if (success && before.TelemetryAvailable && after.TelemetryAvailable)
        {
            message = $"Stopped {unloaded.Count} idle HAFIZ worker(s). Measured total VRAM: {beforeMb} MB -> {afterMb} MB (change {reclaimed} MB). External GPU processes preserved: {externalCount}.";
        }
        else
        {
            message = $"Stopped {unloaded.Count} idle HAFIZ worker(s); skipped {busy.Count} busy worker(s); failed to stop {failed.Count}. External GPU processes were not targeted. Live VRAM telemetry: {(before.TelemetryAvailable && after.TelemetryAvailable ? "available" : "unavailable")}.";
        }

        return new PurgeVramResult(
            Success: success,
            UnloadedHafizWorkerCount: unloaded.Count,
            VramBeforeMb: beforeMb,
            VramAfterMb: afterMb,
            ReclaimedMb: reclaimed,
            PreservedExternalWorkloads: true,
            SkippedBusyWorkerCount: busy.Count,
            FailedWorkerIds: failed,
            Message: message);
    }
}
