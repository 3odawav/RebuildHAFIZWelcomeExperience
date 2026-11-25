using System.Text.Json;
using System.Text.Json.Serialization;
using HAFIZ.Core.Models;

namespace HAFIZ.Core.Settings;

/// <summary>
/// Persists all HAFIZ Windows 11 desktop settings cleanly across restarts without losing user preferences.
/// </summary>
public sealed class SettingsStore
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly string _settingsFilePath;

    public SettingsStore(string? customDirectory = null)
    {
        var baseDir = string.IsNullOrWhiteSpace(customDirectory)
            ? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "HAFIZ_New_Generation")
            : customDirectory;
        Directory.CreateDirectory(baseDir);
        _settingsFilePath = Path.Combine(baseDir, "hafiz-settings.json");
    }

    public string SettingsFilePath => _settingsFilePath;

    public AppSettings Load()
    {
        if (!File.Exists(_settingsFilePath))
        {
            var initial = new AppSettings();
            var bootstrap = Path.Combine(Path.GetDirectoryName(_settingsFilePath)!, "installer-bootstrap.json");
            if (File.Exists(bootstrap))
            {
                try
                {
                    using var json = JsonDocument.Parse(File.ReadAllText(bootstrap));
                    var root = json.RootElement;
                    if(root.TryGetProperty("installRootPath",out var install) && install.GetString() is string installPath)
                        initial.AppInstallDirectory=installPath;
                    if(root.TryGetProperty("modelStoragePath",out var models) && models.GetString() is string modelPath)
                        initial.ModelDownloadDirectory=modelPath;
                    if(root.TryGetProperty("scanRootsRaw",out var scan) && scan.GetString() is string roots)
                        initial.ScanDirectories=roots.Split(';',StringSplitOptions.TrimEntries|StringSplitOptions.RemoveEmptyEntries).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                    if(root.TryGetProperty("modelSetupStrategy",out var strategy))
                        initial.SetupStrategy=strategy.GetString() switch {
                            "download_all"=>ModelSetupStrategy.CompleteFreshInstall,
                            "hybrid"=>ModelSetupStrategy.DownloadMissingOnly,
                            _=>ModelSetupStrategy.UseExistingInPlace
                        };
                    Save(initial);
                }
                catch (JsonException) { /* A malformed bootstrap does not overwrite existing files. */ }
                catch (IOException) { }
            }
            return initial;
        }

        try
        {
            var json = File.ReadAllText(_settingsFilePath);
            return JsonSerializer.Deserialize<AppSettings>(json, SerializerOptions) ?? new AppSettings();
        }
        catch
        {
            return new AppSettings();
        }
    }

    public void Save(AppSettings settings)
    {
        var dir = Path.GetDirectoryName(_settingsFilePath);
        if (!string.IsNullOrWhiteSpace(dir))
        {
            Directory.CreateDirectory(dir);
        }

        var tmpPath = _settingsFilePath + ".tmp";
        var json = JsonSerializer.Serialize(settings, SerializerOptions);
        File.WriteAllText(tmpPath, json);
        File.Move(tmpPath, _settingsFilePath, overwrite: true);
    }
}
