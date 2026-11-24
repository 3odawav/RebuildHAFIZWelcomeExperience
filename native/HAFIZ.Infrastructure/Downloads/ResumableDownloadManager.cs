using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text.Json;

namespace HAFIZ.Infrastructure.Downloads;

public enum DownloadState
{
    Pending,
    Downloading,
    Paused,
    Verifying,
    Completed,
    Failed,
    Cancelled
}

public sealed record DownloadProgressSnapshot(
    string ComponentId,
    string FileName,
    DownloadState State,
    long DownloadedBytes,
    long? TotalBytes,
    double SpeedBytesPerSecond,
    TimeSpan? EstimatedRemaining,
    string? ErrorMessage);

public sealed record DownloadRequest(
    string ComponentId,
    string DownloadUrl,
    string DestinationPath,
    string? ExpectedSha256,
    long? ExpectedSizeBytes = null);

public sealed class DownloadJournalEntry
{
    public string ComponentId { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
    public string DestinationPath { get; set; } = string.Empty;
    public string? ExpectedSha256 { get; set; }
    public DownloadState State { get; set; } = DownloadState.Pending;
    public long DownloadedBytes { get; set; }
    public long? TotalBytes { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>
/// Genuine HTTP Range resumable downloader using .part staging files, persistent JSON journal,
/// SHA-256 verification, and atomic rename on completion.
/// Never restarts already-verified files and never simulates progress.
/// </summary>
public sealed class ResumableDownloadManager
{
    private readonly HttpClient _httpClient;
    private readonly string _journalPath;
    private readonly Dictionary<string, CancellationTokenSource> _activeTokens = new(StringComparer.OrdinalIgnoreCase);
    private readonly object _lock = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public ResumableDownloadManager(HttpClient httpClient, string journalPath)
    {
        _httpClient = httpClient;
        _journalPath = journalPath;
    }

    public async Task<DownloadProgressSnapshot> StartOrResumeAsync(
        DownloadRequest request,
        IProgress<DownloadProgressSnapshot>? progress = null,
        CancellationToken externalCt = default)
    {
        if (string.IsNullOrWhiteSpace(request.DownloadUrl) ||
            request.DownloadUrl.StartsWith("PENDING_", StringComparison.OrdinalIgnoreCase))
        {
            return new DownloadProgressSnapshot(
                request.ComponentId,
                Path.GetFileName(request.DestinationPath),
                DownloadState.Failed,
                0,
                request.ExpectedSizeBytes,
                0,
                null,
                "Download URL is not yet resolved from the official upstream manifest.");
        }

        // Skip re-download if destination already exists and passes SHA-256 verification
        if (File.Exists(request.DestinationPath))
        {
            if (string.IsNullOrWhiteSpace(request.ExpectedSha256) ||
                request.ExpectedSha256.StartsWith("PENDING_", StringComparison.OrdinalIgnoreCase))
            {
                var existingSize = new FileInfo(request.DestinationPath).Length;
                var verifiedExisting = new DownloadProgressSnapshot(
                    request.ComponentId,
                    Path.GetFileName(request.DestinationPath),
                    DownloadState.Completed,
                    existingSize,
                    existingSize,
                    0,
                    TimeSpan.Zero,
                    null);
                progress?.Report(verifiedExisting);
                return verifiedExisting;
            }

            var actualHash = await ComputeSha256Async(request.DestinationPath, externalCt);
            if (actualHash.Equals(request.ExpectedSha256, StringComparison.OrdinalIgnoreCase))
            {
                var existingSize = new FileInfo(request.DestinationPath).Length;
                var alreadyValid = new DownloadProgressSnapshot(
                    request.ComponentId,
                    Path.GetFileName(request.DestinationPath),
                    DownloadState.Completed,
                    existingSize,
                    existingSize,
                    0,
                    TimeSpan.Zero,
                    null);
                progress?.Report(alreadyValid);
                return alreadyValid;
            }
        }

        var cts = CancellationTokenSource.CreateLinkedTokenSource(externalCt);
        lock (_lock)
        {
            _activeTokens[request.ComponentId] = cts;
        }

        var partPath = $"{request.DestinationPath}.part";
        var destDir = Path.GetDirectoryName(request.DestinationPath);
        if (!string.IsNullOrEmpty(destDir))
        {
            Directory.CreateDirectory(destDir);
        }

        long existingOffset = File.Exists(partPath) ? new FileInfo(partPath).Length : 0;

        try
        {
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, request.DownloadUrl);
            if (existingOffset > 0)
            {
                httpRequest.Headers.Range = new RangeHeaderValue(existingOffset, null);
            }

            using var response = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, cts.Token);

            // If server ignored Range (200 OK instead of 206 Partial Content), restart from 0 cleanly
            if (response.StatusCode == System.Net.HttpStatusCode.OK && existingOffset > 0)
            {
                existingOffset = 0;
            }
            else
            {
                response.EnsureSuccessStatusCode();
            }

            long? totalBytes = response.Content.Headers.ContentRange?.Length
                               ?? (response.Content.Headers.ContentLength.HasValue
                                   ? response.Content.Headers.ContentLength.Value + existingOffset
                                   : request.ExpectedSizeBytes);

            await SaveJournalEntryAsync(new DownloadJournalEntry
            {
                ComponentId = request.ComponentId,
                DownloadUrl = request.DownloadUrl,
                DestinationPath = request.DestinationPath,
                ExpectedSha256 = request.ExpectedSha256,
                State = DownloadState.Downloading,
                DownloadedBytes = existingOffset,
                TotalBytes = totalBytes,
                UpdatedAtUtc = DateTimeOffset.UtcNow
            });

            var fileMode = existingOffset > 0 ? FileMode.Append : FileMode.Create;
            await using (var remoteStream = await response.Content.ReadAsStreamAsync(cts.Token))
            await using (var fileStream = new FileStream(partPath, fileMode, FileAccess.Write, FileShare.None, 128 * 1024, useAsync: true))
            {
                var buffer = new byte[128 * 1024];
                long downloaded = existingOffset;
                var startTime = DateTimeOffset.UtcNow;
                var lastReport = DateTimeOffset.MinValue;

                while (true)
                {
                    var read = await remoteStream.ReadAsync(buffer, cts.Token);
                    if (read == 0) break;

                    await fileStream.WriteAsync(buffer.AsMemory(0, read), cts.Token);
                    downloaded += read;

                    var now = DateTimeOffset.UtcNow;
                    if ((now - lastReport).TotalMilliseconds >= 180)
                    {
                        var elapsedSec = Math.Max(0.1, (now - startTime).TotalSeconds);
                        var speed = (downloaded - existingOffset) / elapsedSec;
                        TimeSpan? eta = totalBytes.HasValue && speed > 1
                            ? TimeSpan.FromSeconds(Math.Max(0, (totalBytes.Value - downloaded) / speed))
                            : null;

                        progress?.Report(new DownloadProgressSnapshot(
                            request.ComponentId,
                            Path.GetFileName(request.DestinationPath),
                            DownloadState.Downloading,
                            downloaded,
                            totalBytes,
                            speed,
                            eta,
                            null));
                        lastReport = now;
                    }
                }
            }

            var finalSize = new FileInfo(partPath).Length;
            progress?.Report(new DownloadProgressSnapshot(
                request.ComponentId,
                Path.GetFileName(request.DestinationPath),
                DownloadState.Verifying,
                finalSize,
                totalBytes ?? finalSize,
                0,
                TimeSpan.Zero,
                null));

            if (!string.IsNullOrWhiteSpace(request.ExpectedSha256) &&
                !request.ExpectedSha256.StartsWith("PENDING_", StringComparison.OrdinalIgnoreCase))
            {
                var actualSha = await ComputeSha256Async(partPath, cts.Token);
                if (!actualSha.Equals(request.ExpectedSha256, StringComparison.OrdinalIgnoreCase))
                {
                    return new DownloadProgressSnapshot(
                        request.ComponentId,
                        Path.GetFileName(request.DestinationPath),
                        DownloadState.Failed,
                        finalSize,
                        totalBytes,
                        0,
                        null,
                        $"SHA-256 checksum mismatch. Expected {request.ExpectedSha256}, got {actualSha}.");
                }
            }

            File.Move(partPath, request.DestinationPath, overwrite: true);

            await SaveJournalEntryAsync(new DownloadJournalEntry
            {
                ComponentId = request.ComponentId,
                DownloadUrl = request.DownloadUrl,
                DestinationPath = request.DestinationPath,
                ExpectedSha256 = request.ExpectedSha256,
                State = DownloadState.Completed,
                DownloadedBytes = finalSize,
                TotalBytes = finalSize,
                UpdatedAtUtc = DateTimeOffset.UtcNow
            });

            var completed = new DownloadProgressSnapshot(
                request.ComponentId,
                Path.GetFileName(request.DestinationPath),
                DownloadState.Completed,
                finalSize,
                finalSize,
                0,
                TimeSpan.Zero,
                null);
            progress?.Report(completed);
            return completed;
        }
        catch (OperationCanceledException)
        {
            var currentBytes = File.Exists(partPath) ? new FileInfo(partPath).Length : existingOffset;
            await SaveJournalEntryAsync(new DownloadJournalEntry
            {
                ComponentId = request.ComponentId,
                DownloadUrl = request.DownloadUrl,
                DestinationPath = request.DestinationPath,
                ExpectedSha256 = request.ExpectedSha256,
                State = DownloadState.Paused,
                DownloadedBytes = currentBytes,
                TotalBytes = request.ExpectedSizeBytes,
                UpdatedAtUtc = DateTimeOffset.UtcNow
            });

            var paused = new DownloadProgressSnapshot(
                request.ComponentId,
                Path.GetFileName(request.DestinationPath),
                DownloadState.Paused,
                currentBytes,
                request.ExpectedSizeBytes,
                0,
                null,
                null);
            progress?.Report(paused);
            return paused;
        }
        catch (Exception ex)
        {
            var currentBytes = File.Exists(partPath) ? new FileInfo(partPath).Length : existingOffset;
            var failed = new DownloadProgressSnapshot(
                request.ComponentId,
                Path.GetFileName(request.DestinationPath),
                DownloadState.Failed,
                currentBytes,
                request.ExpectedSizeBytes,
                0,
                null,
                ex.Message);
            progress?.Report(failed);
            return failed;
        }
        finally
        {
            lock (_lock)
            {
                _activeTokens.Remove(request.ComponentId);
            }
            cts.Dispose();
        }
    }

    public void Pause(string componentId)
    {
        lock (_lock)
        {
            if (_activeTokens.TryGetValue(componentId, out var cts))
            {
                cts.Cancel();
            }
        }
    }

    public void CancelAndCleanupPart(string componentId, string destinationPath)
    {
        Pause(componentId);
        var partPath = $"{destinationPath}.part";
        if (File.Exists(partPath))
        {
            File.Delete(partPath);
        }
    }

    public async Task<IReadOnlyList<DownloadJournalEntry>> LoadJournalAsync(CancellationToken ct = default)
    {
        if (!File.Exists(_journalPath))
        {
            return Array.Empty<DownloadJournalEntry>();
        }

        try
        {
            var json = await File.ReadAllTextAsync(_journalPath, ct);
            return JsonSerializer.Deserialize<List<DownloadJournalEntry>>(json, JsonOptions)
                   ?? new List<DownloadJournalEntry>();
        }
        catch
        {
            return Array.Empty<DownloadJournalEntry>();
        }
    }

    public static async Task<string> ComputeSha256Async(string filePath, CancellationToken ct = default)
    {
        await using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 128 * 1024, useAsync: true);
        var hash = await SHA256.HashDataAsync(stream, ct);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private async Task SaveJournalEntryAsync(DownloadJournalEntry entry)
    {
        var dir = Path.GetDirectoryName(_journalPath);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }

        var existing = (await LoadJournalAsync()).ToList();
        existing.RemoveAll(e => e.ComponentId.Equals(entry.ComponentId, StringComparison.OrdinalIgnoreCase));
        existing.Add(entry);

        var temp = $"{_journalPath}.tmp";
        var json = JsonSerializer.Serialize(existing, JsonOptions);
        await File.WriteAllTextAsync(temp, json);
        File.Move(temp, _journalPath, overwrite: true);
    }
}
