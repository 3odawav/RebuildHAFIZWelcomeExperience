using System.Diagnostics;

namespace HAFIZ.Backend.Workers;

public sealed record WorkerLaunchSpec(
    string WorkerId,
    string ExecutablePath,
    string Arguments,
    string WorkingDirectory,
    IReadOnlyDictionary<string, string>? EnvironmentOverrides = null);

public sealed record WorkerStatus(
    string WorkerId,
    bool IsRunning,
    int? ProcessId,
    DateTimeOffset? StartedAtUtc,
    string? LastError);

/// <summary>
/// Manages isolated child AI workers (llama-server.exe, transcribe.cpp, Python audio/daemon workers).
/// Always launches with CreateNoWindow=true so zero black console windows flash on Windows 11.
/// Crashes in a worker are isolated and never crash the WinUI 3 shell.
/// </summary>
public sealed class WorkerProcessSupervisor : IDisposable
{
    private readonly Dictionary<string, (Process Process, DateTimeOffset StartedAtUtc)> _running = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, string> _lastErrors = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _sync = new();

    public WorkerStatus StartWorker(WorkerLaunchSpec spec)
    {
        if (!File.Exists(spec.ExecutablePath))
        {
            var err = $"Worker executable not found: {spec.ExecutablePath}";
            lock (_sync) _lastErrors[spec.WorkerId] = err;
            return new WorkerStatus(spec.WorkerId, false, null, null, err);
        }

        lock (_sync)
        {
            if (_running.TryGetValue(spec.WorkerId, out var existing) && !existing.Process.HasExited)
            {
                return new WorkerStatus(spec.WorkerId, true, existing.Process.Id, existing.StartedAtUtc, null);
            }
        }

        var psi = new ProcessStartInfo
        {
            FileName = spec.ExecutablePath,
            Arguments = spec.Arguments,
            WorkingDirectory = string.IsNullOrWhiteSpace(spec.WorkingDirectory)
                ? Path.GetDirectoryName(spec.ExecutablePath) ?? Environment.CurrentDirectory
                : spec.WorkingDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        // Enforce Turing SM75 safety defaults for isolated Python/CUDA workers
        psi.Environment["HAFIZ_WORKER_ID"] = spec.WorkerId;
        psi.Environment["TORCH_CUDNN_V8_API_ENABLED"] = "1";
        psi.Environment["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True,max_split_size_mb:256";

        if (spec.EnvironmentOverrides is not null)
        {
            foreach (var (key, value) in spec.EnvironmentOverrides)
            {
                psi.Environment[key] = value;
            }
        }

        try
        {
            var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
            if (!process.Start())
            {
                return new WorkerStatus(spec.WorkerId, false, null, null, "OS failed to start worker process.");
            }

            var started = DateTimeOffset.UtcNow;
            lock (_sync)
            {
                _running[spec.WorkerId] = (process, started);
                _lastErrors.Remove(spec.WorkerId);
            }

            return new WorkerStatus(spec.WorkerId, true, process.Id, started, null);
        }
        catch (Exception ex)
        {
            lock (_sync) _lastErrors[spec.WorkerId] = ex.Message;
            return new WorkerStatus(spec.WorkerId, false, null, null, ex.Message);
        }
    }

    public async Task StopWorkerAsync(string workerId, CancellationToken ct = default)
    {
        Process? proc = null;
        lock (_sync)
        {
            if (_running.TryGetValue(workerId, out var entry))
            {
                proc = entry.Process;
                _running.Remove(workerId);
            }
        }

        if (proc is null) return;

        try
        {
            if (!proc.HasExited)
            {
                proc.Kill(entireProcessTree: true);
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
                timeout.CancelAfter(TimeSpan.FromSeconds(5));
                await proc.WaitForExitAsync(timeout.Token);
            }
        }
        catch
        {
            // Ignore race if process already exited cleanly
        }
        finally
        {
            proc.Dispose();
        }
    }

    public WorkerStatus GetStatus(string workerId)
    {
        lock (_sync)
        {
            if (_running.TryGetValue(workerId, out var entry) && !entry.Process.HasExited)
            {
                return new WorkerStatus(workerId, true, entry.Process.Id, entry.StartedAtUtc, null);
            }

            _lastErrors.TryGetValue(workerId, out var err);
            return new WorkerStatus(workerId, false, null, null, err);
        }
    }

    public void Dispose()
    {
        List<Process> toKill;
        lock (_sync)
        {
            toKill = _running.Values.Select(v => v.Process).ToList();
            _running.Clear();
        }

        foreach (var proc in toKill)
        {
            try
            {
                if (!proc.HasExited) proc.Kill(entireProcessTree: true);
                proc.Dispose();
            }
            catch
            {
                // Best-effort cleanup on app shutdown
            }
        }
    }
}
