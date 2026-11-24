using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace HAFIZ.Infrastructure.Providers;

public sealed record LmStudioModelInfo(
    string Id,
    string State,
    string Architecture,
    string Quantization,
    int? MaxContextLength);

public sealed record LmStudioDiscoveryResult(
    bool Reachable,
    string BaseUrl,
    IReadOnlyList<LmStudioModelInfo> Models,
    string? ErrorMessage = null);

/// <summary>
/// Real local REST client for LM Studio (default http://127.0.0.1:1234).
/// Queries /api/v0/models (rich loaded/downloaded state) with automatic fallback to OpenAI-compatible /v1/models.
/// Never unloads external LM Studio models unless explicitly authorized by the user.
/// </summary>
public sealed class LmStudioDiscoveryClient
{
    private readonly HttpClient _httpClient;

    public LmStudioDiscoveryClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<LmStudioDiscoveryResult> DiscoverModelsAsync(
        string baseUrl = "http://127.0.0.1:1234",
        string? apiToken = null,
        CancellationToken ct = default)
    {
        var normalized = baseUrl.TrimEnd('/');
        try
        {
            var v0Result = await TryQueryAsync($"{normalized}/api/v0/models", apiToken, ct);
            if (v0Result is not null)
            {
                return new LmStudioDiscoveryResult(true, normalized, v0Result);
            }

            var v1Result = await TryQueryAsync($"{normalized}/v1/models", apiToken, ct);
            if (v1Result is not null)
            {
                return new LmStudioDiscoveryResult(true, normalized, v1Result);
            }

            return new LmStudioDiscoveryResult(false, normalized, Array.Empty<LmStudioModelInfo>(), "LM Studio endpoint did not return a valid model list.");
        }
        catch (Exception ex)
        {
            return new LmStudioDiscoveryResult(false, normalized, Array.Empty<LmStudioModelInfo>(), ex.Message);
        }
    }

    public async Task<string> SendChatCompletionAsync(
        string baseUrl,
        string modelId,
        string systemPrompt,
        string userPrompt,
        string? apiToken = null,
        CancellationToken ct = default)
    {
        var normalized = baseUrl.TrimEnd('/');
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{normalized}/v1/chat/completions");
        if (!string.IsNullOrWhiteSpace(apiToken))
        {
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);
        }

        var payload = new
        {
            model = modelId,
            temperature = 0.7,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
        using var resp = await _httpClient.SendAsync(req, ct);
        resp.EnsureSuccessStatusCode();

        var body = await resp.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(body);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;
    }

    private async Task<IReadOnlyList<LmStudioModelInfo>?> TryQueryAsync(string url, string? apiToken, CancellationToken ct)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        if (!string.IsNullOrWhiteSpace(apiToken))
        {
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);
        }

        using var resp = await _httpClient.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
        {
            return null;
        }

        var json = await resp.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var list = new List<LmStudioModelInfo>();
        foreach (var item in data.EnumerateArray())
        {
            var id = item.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? string.Empty : string.Empty;
            if (string.IsNullOrWhiteSpace(id)) continue;

            var state = item.TryGetProperty("state", out var stateEl) ? stateEl.GetString() ?? "available" : "available";
            var arch = item.TryGetProperty("arch", out var archEl) ? archEl.GetString() ?? "gguf" : "gguf";
            var quant = item.TryGetProperty("quantization", out var qEl) ? qEl.GetString() ?? "unknown" : "unknown";
            int? maxCtx = item.TryGetProperty("max_context_length", out var cEl) && cEl.TryGetInt32(out var ctxVal) ? ctxVal : null;

            list.Add(new LmStudioModelInfo(id, state, arch, quant, maxCtx));
        }

        return list;
    }
}
