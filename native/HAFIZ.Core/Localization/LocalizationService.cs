using HAFIZ.Core.Models;

namespace HAFIZ.Core.Localization;

/// <summary>
/// Complete ar-EG (RTL) and en-US (LTR) localization provider for HAFIZ Native Windows 11.
/// Keeps technical paths and model identifiers formatted cleanly in LTR.
/// </summary>
public sealed class LocalizationService
{
    private static readonly IReadOnlyDictionary<string, (string Ar, string En)> Strings =
        new Dictionary<string, (string Ar, string En)>(StringComparer.Ordinal)
        {
            ["AppTitle"] = ("حافظ بالعامية — استوديو الذكاء الاصطناعي المحلي", "HAFIZ In Slang — Native Windows 11 AI Studio"),
            ["WelcomeGreeting"] = ("أهلاً بيك يا فنان.. أنا حافظ. قولي تحب نبدأ بإيه النهارده؟", "Welcome. I am HAFIZ — tell me what you want to create today."),
            ["NavStartup"] = ("واجهة حافظ", "HAFIZ Stage"),
            ["NavLyricsStudio"] = ("استوديو الكلمات", "Lyrics Studio"),
            ["NavAudioWeb"] = ("الصوت والويب", "Audio & Web"),
            ["NavVoiceStems"] = ("الصوت والفصل (6-Stems)", "Voice Clone & 6-Stems"),
            ["NavSettings"] = ("مركز الإعدادات", "Settings Center"),
            ["ThemeDay"] = ("الوضع النهاري — أبيض وأزرق كروم", "Day Mode — White & Chrome Blue"),
            ["ThemeGraphiteGold"] = ("الوضع الليلي — جرافيت وذهبي", "Night Mode — Graphite & Gold"),
            ["ThemeMidnightBlue"] = ("أزرق ليلي ذكي (Midnight Blue)", "Midnight Blue — Futuristic AI"),
            ["DensityComfortable"] = ("مريح وواسع", "Comfortable"),
            ["DensityCompact"] = ("مضغوط (Compact)", "Compact"),
            ["ReduceMotion"] = ("تقليل الحركة والأنيميشن", "Reduce Motion"),
            ["ProviderEmbedded"] = ("محرك حافظ المدمج (llama.cpp CUDA)", "Embedded HAFIZ Runtime (llama.cpp CUDA)"),
            ["ProviderLmStudio"] = ("الربط مع LM Studio المحلي (127.0.0.1:1234)", "Existing LM Studio Server (127.0.0.1:1234)"),
            ["PurgeVram"] = ("تفريغ نماذج حافظ الخاملة من VRAM", "Purge Idle HAFIZ Models from VRAM"),
            ["ScanPartitions"] = ("فحص البارتيشنات وربط النماذج في مكانها", "Scan Partitions & Link Models In-Place"),
            ["StatusDisconnected"] = ("المحرك المحلي غير متصل", "Local backend disconnected"),
            ["StatusReady"] = ("جاهز", "Ready"),
            ["StatusListening"] = ("بسمعك...", "Listening..."),
            ["StatusThinking"] = ("بيفكر...", "Thinking..."),
            ["StatusSpeaking"] = ("بيتكلم...", "Speaking..."),
            ["StatusLaughing"] = ("بيضحك ومبسوط", "Laughing & Cheerful"),
            ["StatusSerious"] = ("جاد ومركّز", "Serious & Focused"),
        };

    private UiLanguage _language;
    public LocalizationService(UiLanguage language = UiLanguage.ArabicEgypt) => _language = language;
    public void SetLanguage(UiLanguage language) => _language = language;
    public bool IsRightToLeft => _language == UiLanguage.ArabicEgypt;
    public string Get(string key) => Get(key switch
    {
        "App.Title" => "AppTitle",
        "Startup.Greeting" => "WelcomeGreeting",
        "Nav.SettingsCenter" => "NavSettings",
        _ => key.Replace(".", "")
    }, _language);

    public string Get(string key, UiLanguage language)
    {
        if (!Strings.TryGetValue(key, out var pair))
        {
            return key;
        }
        return language == UiLanguage.ArabicEgypt ? pair.Ar : pair.En;
    }



    public IReadOnlyCollection<string> AllKeys => Strings.Keys.ToList();
}
