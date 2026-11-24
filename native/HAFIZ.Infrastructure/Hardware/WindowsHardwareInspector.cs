using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using HAFIZ.Core.Models;

namespace HAFIZ.Infrastructure.Hardware;

public interface IHardwareInspector
{
    Task<GpuTelemetrySnapshot> ProbeGpuAsync(CancellationToken ct = default);
}

/// <summary>
/// Read-only hardware telemetry inspector using nvidia-smi on Windows 11 x64.
/// Never fabricates VRAM numbers or driver telemetry; returns TelemetryAvailable=false when unavailable.
/// Detects Turing SM75 (e.g. Quadro RTX 5000 16GB) so workers enforce FP16/INT8/GGUF without BF16.
/// </summary>
public sealed class WindowsHardwareInspector : IHardwareInspector
{
    private static readonly string[] ProtectedProcessMarkers =
    {
        "lmstudio", "lms", "unsloth", "comfyui", "ollama", "python_train", "torchrun"
    };

    public async Task<GpuTelemetrySnapshot> ProbeGpuAsync(CancellationToken ct = default)
    {
        try
        {
            var gpuOutput = await RunHiddenProcessAsync(
                "nvidia-smi",
                "--query-gpu=name,driver_version,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,compute_cap --format=csv,noheader,nounits",
                TimeSpan.FromSeconds(4),
                ct);

            if (string.IsNullOrWhiteSpace(gpuOutput))
            {
                return GpuTelemetrySnapshot.Unavailable("nvidia-smi returned no GPU rows.");
            }

            var firstLine = gpuOutput
                .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault();

            if (string.IsNullOrWhiteSpace(firstLine))
            {
                return GpuTelemetrySnapshot.Unavailable("No NVIDIA GPU detected.");
            }

            var parts = firstLine.Split(',').Select(p => p.Trim()).ToArray();
            if (parts.Length < 8)
            {
                return GpuTelemetrySnapshot.Unavailable($"Unexpected nvidia-smi GPU format ({parts.Length} fields).");
            }

            var gpuName = parts[0];
            var driverVersion = parts[1];
            var totalMb = ParseInt(parts[2]);
            var usedMb = ParseInt(parts[3]);
            var freeMb = ParseInt(parts[4]);
            var utilPct = ParseInt(parts[5]);
            var tempC = ParseInt(parts[6]);
            var computeCap = parts[7];
            var isTuringSm75 = computeCap.StartsWith("7.5", StringComparison.OrdinalIgnoreCase)
                               || gpuName.Contains("RTX 5000", StringComparison.OrdinalIgnoreCase);

            var computeAppsOutput = await RunHiddenProcessAsync(
                "nvidia-smi",
                "--query-compute-apps=pid,process_name,used_gpu_memory --format=csv,noheader,nounits",
                TimeSpan.FromSeconds(4),
                ct);

            var processes = ParseComputeApps(computeAppsOutput);

            return new GpuTelemetrySnapshot
            {
                TelemetryAvailable = true,
                GpuName = gpuName,
                DriverVersion = driverVersion,
                ComputeCapability = computeCap,
                IsTuringSm75 = isTuringSm75,
                SupportsBf16 = !isTuringSm75 && CompareComputeCap(computeCap, 8.0),
                TotalVramMb = totalMb,
                UsedVramMb = usedMb,
                FreeVramMb = freeMb,
                UtilizationPercent = utilPct,
                TemperatureC = tempC,
                ActiveProcesses = processes,
                SampledAtUtc = DateTimeOffset.UtcNow
            };
        }
        catch (Exception ex)
        {
            return GpuTelemetrySnapshot.Unavailable($"GPU probe unavailable on {RuntimeInformation.OSDescription}: {ex.Message}");
        }
    }

    public static IReadOnlyList<GpuProcessInfo> ParseComputeApps(string? rawCsv)
    {
        if (string.IsNullOrWhiteSpace(rawCsv))
        {
            return Array.Empty<GpuProcessInfo>();
        }

        var list = new List<GpuProcessInfo>();
        foreach (var line in rawCsv.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var cols = line.Split(',').Select(c => c.Trim()).ToArray();
            if (cols.Length < 3) continue;

            var pid = ParseInt(cols[0]);
            var procName = cols[1];
            var memMb = ParseInt(cols[2]);
            var isHafizOwned = procName.Contains("hafiz", StringComparison.OrdinalIgnoreCase)
                               || procName.Contains("HAFIZ.", StringComparison.OrdinalIgnoreCase);
            var isProtectedExternal = !isHafizOwned && ProtectedProcessMarkers.Any(
                marker => procName.Contains(marker, StringComparison.OrdinalIgnoreCase));

            list.Add(new GpuProcessInfo
            {
                Pid = pid,
                ProcessName = procName,
                UsedVramMb = memMb,
                IsHafizOwned = isHafizOwned,
                IsExternalProtected = isProtectedExternal || !isHafizOwned
            });
        }

        return list;
    }

    private static async Task<string> RunHiddenProcessAsync(string fileName, string arguments, TimeSpan timeout, CancellationToken ct)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            }
        };

        if (!process.Start())
        {
            return string.Empty;
        }

        using var linked = CancellationTokenSource.CreateLinkedTokenSource(ct);
        linked.CancelAfter(timeout);

        var stdoutTask = process.StandardOutput.ReadToEndAsync(linked.Token);
        await process.WaitForExitAsync(linked.Token);
        return process.ExitCode == 0 ? await stdoutTask : string.Empty;
    }

    private static int ParseInt(string value)
    {
        if (int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed))
        {
            return parsed;
        }

        if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsedDouble))
        {
            return (int)Math.Round(parsedDouble);
        }

        return 0;
    }

    private static bool CompareComputeCap(string cap, double minRequired)
    {
        return double.TryParse(cap, NumberStyles.Float, CultureInfo.InvariantCulture, out var val)
               && val >= minRequired;
    }
}
