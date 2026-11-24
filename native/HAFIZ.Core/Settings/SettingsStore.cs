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
                "HAFIZ_In_Slang")
            : customDirectory;
        Directory.CreateDirectory(baseDir);
        _settingsFilePath = Path.Combine(baseDir, "hafiz-settings.json");
    }

    public string SettingsFilePath => _settingsFilePath;

    public AppSettings Load()
    {
        if (!File.Exists(_settingsFilePath))
        {
            return new AppSettings();
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
