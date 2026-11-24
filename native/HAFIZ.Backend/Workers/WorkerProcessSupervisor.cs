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
    bool IsBusy,
    string? LastError);

/// <summary>
/// Owns only processes started by this supervisor. Output streams are drained to prevent
/// pipe back-pressure. A busy worker cannot be stopped by a VRAM purge request.
/// </summary>
public sealed class WorkerProcessSupervisor : IDisposable
{
    private readonly Dictionary<string, (Process Process, DateTimeOffset StartedAtUtc)> _running = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, string> _lastErrors = new(StringComparer.OrdinalIgnoreCase);
    private readonly HashSet<string> _busyWorkers = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _sync = new();

    public WorkerStatus StartWorker(WorkerLaunchSpec spec)
    {
        if (!File.Exists(spec.ExecutablePath))
        {
            var err = $"Worker executable not found: {spec.ExecutablePath}";
            lock (_sync) _lastErrors[spec.WorkerId] = err;
            return new WorkerStatus(spec.WorkerId, false, null, null, false, err);
        }

        lock (_sync)
        {
            if (_running.TryGetValue(spec.WorkerId, out var existing) && !existing.Process.HasExited)
            {
                return new WorkerStatus(spec.WorkerId, true, existing.Process.Id, existing.StartedAtUtc, _busyWorkers.Contains(spec.WorkerId), null);
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
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true
        };

        // These are allocator hints only; actual precision is selected by each verified worker.
        psi.Environment["HAFIZ_WORKER_ID"] = spec.WorkerId;
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
                return new WorkerStatus(spec.WorkerId, false, null, null, false, "OS failed to start worker process.");
            }

            // Drain both redirected streams even when the UI is not displaying worker logs.
            process.OutputDataReceived += (_, _) => { };
            process.ErrorDataReceived += (_, args) =>
            {
                if (string.IsNullOrWhiteSpace(args.Data)) return;
                lock (_sync) _lastErrors[spec.WorkerId] = args.Data;
            };
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            var started = DateTimeOffset.UtcNow;
            lock (_sync)
            {
                _running[spec.WorkerId] = (process, started);
                _busyWorkers.Remove(spec.WorkerId);
                _lastErrors.Remove(spec.WorkerId);
            }

            return new WorkerStatus(spec.WorkerId, true, process.Id, started, false, null);
        }
        catch (Exception ex)
        {
            lock (_sync) _lastErrors[spec.WorkerId] = ex.Message;
            return new WorkerStatus(spec.WorkerId, false, null, null, false, ex.Message);
        }
    }

    public bool MarkBusy(string workerId)
    {
        lock (_sync)
        {
            if (!_running.TryGetValue(workerId, out var entry) || entry.Process.HasExited)
            {
                return false;
            }

            _busyWorkers.Add(workerId);
            return true;
        }
    }

    public void MarkIdle(string workerId)
    {
        lock (_sync)
        {
            _busyWorkers.Remove(workerId);
        }
    }

    public bool IsBusy(string workerId)
    {
        lock (_sync)
        {
            return _busyWorkers.Contains(workerId);
        }
    }

    /// <summary>
    /// Stops only a process started by this supervisor and only while it is marked idle.
    /// Returns false when the worker is busy or the process did not exit successfully.
    /// </summary>
    public async Task<bool> StopWorkerAsync(string workerId, CancellationToken ct = default)
    {
        Process? proc;
        lock (_sync)
        {
            if (_busyWorkers.Contains(workerId))
            {
                return false;
            }

            if (!_running.TryGetValue(workerId, out var entry))
            {
                return true; // No owned process remains for this worker ID.
            }

            proc = entry.Process;
            _running.Remove(workerId);
        }

        try
        {
            if (!proc.HasExited)
            {
                proc.Kill(entireProcessTree: true);
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
                timeout.CancelAfter(TimeSpan.FromSeconds(5));
                await proc.WaitForExitAsync(timeout.Token);
            }

            return proc.HasExited;
        }
        catch (OperationCanceledException)
        {
            return false;
        }
        catch (Exception ex)
        {
            lock (_sync) _lastErrors[workerId] = ex.Message;
            return false;
        }
        finally
        {
            if (proc.HasExited)
            {
                lock (_sync) _busyWorkers.Remove(workerId);
                proc.Dispose();
            }
            else
            {
                lock (_sync)
                {
                    _running[workerId] = (proc, DateTimeOffset.UtcNow);
                }
            }
        }
    }

    public WorkerStatus GetStatus(string workerId)
    {
        lock (_sync)
        {
            if (_running.TryGetValue(workerId, out var entry) && !entry.Process.HasExited)
            {
                return new WorkerStatus(workerId, true, entry.Process.Id, entry.StartedAtUtc, _busyWorkers.Contains(workerId), null);
            }

            _lastErrors.TryGetValue(workerId, out var err);
            return new WorkerStatus(workerId, false, null, null, false, err);
        }
    }

    public void Dispose()
    {
        List<(string Id, Process Process)> idle;
        List<Process> busy;
        lock (_sync)
        {
            idle = _running
                .Where(entry => !_busyWorkers.Contains(entry.Key))
                .Select(entry => (entry.Key, entry.Value.Process))
                .ToList();
            busy = _running
                .Where(entry => _busyWorkers.Contains(entry.Key))
                .Select(entry => entry.Value.Process)
                .ToList();

            foreach (var entry in idle)
            {
                _running.Remove(entry.Id);
            }

            // Active inference is deliberately not force-killed during shell shutdown.
            foreach (var entry in _running.Where(entry => _busyWorkers.Contains(entry.Key)).ToList())
            {
                _running.Remove(entry.Key);
            }
            _busyWorkers.Clear();
        }

        foreach (var entry in idle)
        {
            try
            {
                if (!entry.Process.HasExited) entry.Process.Kill(entireProcessTree: true);
            }
            catch { }
            finally { entry.Process.Dispose(); }
        }

        // Close only our local process handles. The active worker is allowed to finish.
        foreach (var process in busy)
        {
            try { process.Dispose(); } catch { }
        }
    }
}
