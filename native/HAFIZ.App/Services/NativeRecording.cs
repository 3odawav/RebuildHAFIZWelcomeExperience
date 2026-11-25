using Windows.Media.Capture;
using Windows.Media.MediaProperties;
using Windows.Storage;

namespace HAFIZ.App.Services;

internal sealed class NativeRecording : IDisposable
{
    private MediaCapture? _capture;
    public string? PathOnDisk { get; private set; }
    public bool IsRecording => _capture is not null;
    public async Task StartAsync(string directory)
    {
        if (IsRecording) throw new InvalidOperationException("Recording already active.");
        Directory.CreateDirectory(directory);
        var folder = await StorageFolder.GetFolderFromPathAsync(directory);
        var file = await folder.CreateFileAsync("recording-" + Guid.NewGuid().ToString("N") + ".wav");
        PathOnDisk = file.Path;
        var capture = new MediaCapture();
        try
        {
            await capture.InitializeAsync(new MediaCaptureInitializationSettings
                { StreamingCaptureMode = StreamingCaptureMode.Audio });
            await capture.StartRecordToStorageFileAsync(MediaEncodingProfile.CreateWav(AudioEncodingQuality.High),file);
            _capture = capture;
        }
        catch { capture.Dispose(); throw; }
    }
    public async Task<string> StopAsync()
    {
        var capture = _capture ?? throw new InvalidOperationException("No active recording.");
        try
        {
            await capture.StopRecordAsync();
            return PathOnDisk!;
        }
        finally { _capture = null; capture.Dispose(); }
    }
    public void Dispose() { _capture?.Dispose(); _capture = null; }
}
