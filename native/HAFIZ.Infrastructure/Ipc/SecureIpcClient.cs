using System.Text;
using System.Text.Json;

namespace HAFIZ.Infrastructure.Ipc;

/// <summary>
/// Loopback-only IPC client communicating with the local HAFIZ backend daemon on 127.0.0.1:4891.
/// Never binds externally or executes raw shell commands.
/// </summary>
public sealed class SecureIpcClient
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly string? _sessionToken;

    public SecureIpcClient(HttpClient httpClient, string baseUrl = "http://127.0.0.1:4891", string? sessionToken = null)
    {
        var uri = new Uri(baseUrl);
        if (!uri.IsLoopback)
        {
            throw new InvalidOperationException("HAFIZ IPC client only allows loopback (127.0.0.1 / localhost) endpoints.");
        }

        _httpClient = httpClient;
        _baseUrl = baseUrl.TrimEnd('/');
        _sessionToken = sessionToken;
    }

    public async Task<JsonDocument?> GetJsonAsync(string relativePath, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}{relativePath}");
        AttachToken(req);

        using var resp = await _httpClient.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var content = await resp.Content.ReadAsStringAsync(ct);
        return JsonDocument.Parse(content);
    }

    public async Task<JsonDocument?> PostJsonAsync(string relativePath, object payload, CancellationToken ct = default)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}{relativePath}")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        AttachToken(req);

        using var resp = await _httpClient.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var content = await resp.Content.ReadAsStringAsync(ct);
        return JsonDocument.Parse(content);
    }

    private void AttachToken(HttpRequestMessage req)
    {
        if (!string.IsNullOrWhiteSpace(_sessionToken))
        {
            req.Headers.Add("X-Hafiz-Token", _sessionToken);
        }
    }
}
