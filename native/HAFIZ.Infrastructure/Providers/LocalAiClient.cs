using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;

namespace HAFIZ.Infrastructure.Providers;

/// <summary>Real, opt-in OpenAI-compatible localhost inference. Does not start, stop or modify external servers.</summary>
public sealed class LocalAiClient : IDisposable
{
    private readonly HttpClient _http;
    public LocalAiClient(HttpMessageHandler? handler = null)
    {
        _http = new HttpClient(handler ?? new HttpClientHandler { AllowAutoRedirect = false })
        { Timeout = TimeSpan.FromMinutes(3) };
    }

    public static Uri Endpoint(string baseUrl, string path)
    {
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttp || !uri.IsLoopback ||
            !string.IsNullOrEmpty(uri.UserInfo) || !string.IsNullOrEmpty(uri.Query) ||
            !string.IsNullOrEmpty(uri.Fragment) ||
            (uri.AbsolutePath.TrimEnd('/') != "" && uri.AbsolutePath.TrimEnd('/') != "/v1"))
            throw new InvalidOperationException("Configure a localhost HTTP server URL in Settings (e.g. http://127.0.0.1:8080).");
        return new Uri(uri.GetLeftPart(UriPartial.Authority) + "/v1/" + path);
    }

    private async Task<string> ResolveModelAsync(string url, string model, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(model)) return model.Trim();
        using var response = await _http.GetAsync(Endpoint(url, "models"), ct);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        var models = json.RootElement.GetProperty("data").EnumerateArray()
            .Select(m => m.GetProperty("id").GetString()).Where(m => !string.IsNullOrWhiteSpace(m)).Distinct().ToArray();
        if (models.Length != 1) throw new InvalidOperationException("Select the exact local model ID in Settings.");
        return models[0]!;
    }

    public async Task<string> ChatAsync(string url, string model, string system, string text, CancellationToken ct)
    {
        model = await ResolveModelAsync(url, model, ct);
        using var response = await _http.PostAsJsonAsync(Endpoint(url,"chat/completions"),
            new { model, messages = new[] { new { role="system", content=system }, new { role="user", content=text } },
                  temperature=0.2, max_tokens=2048, stream=false }, ct);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        var result = json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        if (string.IsNullOrWhiteSpace(result)) throw new InvalidDataException("Local LLM returned no text.");
        return result;
    }

    public async Task<string> TranscribeAsync(string url, string model, string filePath, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model)) throw new InvalidOperationException("Set the ASR model ID in Settings.");
        using var form = new MultipartFormDataContent();
        using var audio = new StreamContent(File.OpenRead(filePath));
        audio.Headers.ContentType = new MediaTypeHeaderValue(Path.GetExtension(filePath).ToLowerInvariant() switch
        { ".wav"=>"audio/wav", ".mp3"=>"audio/mpeg", ".flac"=>"audio/flac", _=>"application/octet-stream" });
        form.Add(audio,"file",Path.GetFileName(filePath));
        form.Add(new StringContent(model),"model");
        form.Add(new StringContent("ar"),"language");
        form.Add(new StringContent("json"),"response_format");
        using var response = await _http.PostAsync(Endpoint(url,"audio/transcriptions"),form,ct);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
        var result = json.RootElement.GetProperty("text").GetString();
        if (string.IsNullOrWhiteSpace(result)) throw new InvalidDataException("Local ASR returned no transcript.");
        return result;
    }

    public async Task<byte[]> SpeechAsync(string url, string model, string voice, string text, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(model) || string.IsNullOrWhiteSpace(voice))
            throw new InvalidOperationException("Set the Egyptian TTS model and voice in Settings.");
        using var response = await _http.PostAsJsonAsync(Endpoint(url,"audio/speech"),
            new { model, voice, input=text, response_format="wav" },ct);
        response.EnsureSuccessStatusCode();
        var bytes = await response.Content.ReadAsByteArrayAsync(ct);
        if (bytes.Length < 44 || !bytes.AsSpan(0,4).SequenceEqual("RIFF"u8) ||
            !bytes.AsSpan(8,4).SequenceEqual("WAVE"u8))
            throw new InvalidDataException("TTS did not return a valid WAV container.");
        return bytes;
    }

    public void Dispose() => _http.Dispose();
}
