using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace HAFIZ.App.Services;

/// <summary>Switches actual native UI labels in place. Never replaces user text or live result data.</summary>
internal static class NativeUiLocalization
{
    private sealed record Label(string Page,string Name,string Property,string Ar,string En,bool Dynamic);
    private static readonly Label[] Labels =
    [
        new("MainWindow","TitleBarBrandText","Text","حافظ بالعامية","HAFIZ In Slang",false),
        new("MainWindow","GpuStatusTitleText","Text","فحص كارت الشاشة…","Checking GPU…",true),
        new("MainWindow","HafizLoc1","Content","اللغة","Language",false),
        new("MainWindow","HafizLoc2","Content","المظهر","Theme",false),
        new("MainWindow","NavLyrics","Content","استوديو الكلمات","Lyrics Studio",false),
        new("MainWindow","NavAudio","Content","الصوت والويب","Audio & Web",false),
        new("MainWindow","NavVoice","Content","استنساخ الصوت والستيمز","Voice Clone & Stems",false),
        new("MainWindow","NavSettings","Content","مركز الإعدادات","Settings Center",false),
        new("Startup","GreetingTitle","Text","أهلاً بيك في حافظ بالعامية","Welcome to HAFIZ In Slang",true),
        new("Startup","GreetingSubtitle","Text","قولي نبدأ بأغنية جديدة ولا تحليل صوت ولا فصل ستيمز؟","Shall we start a song, analyze audio, or separate stems?",true),
        new("Startup","HafizLoc1","Text","معاينة التعبيرات","Expression preview",false),
        new("Startup","HafizLoc2","Content","🗣️ بيتكلم","🗣️ Speaking",false),
        new("Startup","HafizLoc3","Content","😄 مبسوط","😄 Happy",false),
        new("Startup","HafizLoc4","Content","🕶️ مركّز","🕶️ Focused",false),
        new("Startup","HafizLoc5","Content","✨ هادي","✨ Calm",false),
        new("Startup","MicTriggerButton","Content","🎤 اتكلم مع حافظ","🎤 Speak to HAFIZ",true),
        new("Startup","StartupCommandBox","PlaceholderText","اكتب أو قول: افتح استوديو الكلمات، افحص الموديلات، فضّي الرام...","Type or say: open Lyrics Studio, scan models, free VRAM…",false),
        new("Startup","HafizLoc6","Content","نفّذ","Run",false),
        new("Startup","HafizLoc7","Content","استوديو الكلمات","Lyrics Studio",false),
        new("Startup","HafizLoc8","Content","الصوت والويب","Audio & Web",false),
        new("Startup","HafizLoc9","Content","استنساخ الصوت وفصل 6 تراكات","Voice Clone & 6 Stems",false),
        new("Startup","HafizLoc10","Content","مركز الإعدادات","Settings Center",false),
        new("Companion","AssistantNameText","Text","حافظ","HAFIZ",false),
        new("Companion","AssistantStatusText","Text","جاهز أساعدك","Ready to help",true),
        new("Companion","DockSideButton","ToolTipService.ToolTip","تحريك يمين أو يسار","Move Left / Right",false),
        new("Companion","CollapseButton","ToolTipService.ToolTip","توسيع أو تصغير","Expand / Collapse",false),
        new("Companion","QuickCommandInput","PlaceholderText","قول لحافظ عايز إيه...","Tell HAFIZ what you need…",false),
        new("Companion","HafizLoc1","Content","إرسال","Send",false),
        new("Companion","CompanionMicButton","Content","🎤 اتكلم","🎤 Speak",true),
        new("Companion","HafizLoc2","Content","تكبير حافظ","Expand HAFIZ",false),
        new("Lyrics","HafizLoc1","Text","استوديو الكلمات","Lyrics Studio",false),
        new("Lyrics","HafizLoc2","Text","تشكيل عامي مصري، كتابة أغاني، ضبط القوافي، إعادة الصياغة، الإملاء، والنطق المصري","Egyptian diacritics, songwriting, rhymes, rewriting, spelling and Egyptian pronunciation",false),
        new("Lyrics","RecordButton","Content","🎤 تسجيل","🎤 Record",true),
        new("Lyrics","HafizLoc3","Content","استخدام النص المكتوب","Use typed text",false),
        new("Lyrics","HafizLoc4","Content","إلغاء","Cancel",false),
        new("Lyrics","HafizLoc5","Content","تشكيل ذكي بالعامية","Smart Diacritics",false),
        new("Lyrics","HafizLoc6","Content","تشكيل للنطق في Suno","Suno Phonetic",false),
        new("Lyrics","HafizLoc7","Content","نطق مصري متصل","Connected Egyptian",false),
        new("Lyrics","HafizLoc8","Content","تدقيق","Proofread",false),
        new("Lyrics","HafizLoc9","Content","تشكيل عامي مصري","Egyptian Diacritics",false),
        new("Lyrics","HafizLoc10","Content","فحص القافية والوزن","Check rhyme & meter",false),
        new("Lyrics","HafizLoc11","Content","إعادة صياغة","Rewrite",false),
        new("Lyrics","HafizLoc12","Content","🔊 نطق مصري","🔊 Egyptian speech",false),
        new("Lyrics","LyricsEditor","PlaceholderText","اكتب كلمات الأغنية بالعامية المصرية هنا...","Write Egyptian Arabic lyrics here…",false),
        new("Lyrics","LyricsStatusText","Text","جاهز للكتابة والتشكيل المحلي","Ready for local writing and diacritics",true),
        new("Lyrics","HafizLoc13","Text","إخراج وتصدير","Prompt & Export",false),
        new("Lyrics","PromptOutputBox","PlaceholderText","المخرجات والبرومبت الموسيقي ستظهر هنا...","Results and music prompts appear here…",false),
        new("Lyrics","HafizLoc14","Content","حفظ كملف نصي (.txt)","Save as text (.txt)",false),
        new("Audio","HafizLoc1","Text","الصوت والويب","Audio & Web",false),
        new("Audio","HafizLoc2","Text","تفريغ صوتي محلي (Cohere Transcribe / transcribe.cpp)، تحليل موسيقي، واستيراد الصوتيات","Local speech transcription, music analysis and media import",false),
        new("Audio","HafizLoc3","Text","التفريغ الصوتي المحلي","Local Transcription",false),
        new("Audio","AudioPathBox","PlaceholderText","مسار ملف الصوت (WAV / MP3 / FLAC)...","Audio file path (WAV / MP3 / FLAC)…",false),
        new("Audio","HafizLoc4","Content","ابدأ التفريغ","Transcribe",false),
        new("Audio","HafizLoc5","Content","تحليل الإيقاع والمقام","Analyze tempo & key",false),
        new("Audio","TranscriptResultBox","PlaceholderText","نص التفريغ الصوتي سيظهر هنا...","Transcription appears here…",false),
        new("Audio","HafizLoc6","Text","البحث المدعوم ويوتيوب","Supported Web & YouTube",false),
        new("Audio","WebUrlBox","PlaceholderText","رابط فيديو أو مصدر بحثي مدعوم...","Supported video or research URL…",false),
        new("Audio","HafizLoc7","Content","تحليل الرابط واستخراج الصوت","Analyze link & extract audio",false),
        new("Audio","AudioWebStatus","Text","جاهز لاستقبال ملفات الصوت أو الروابط المدعومة.","Ready for audio files or supported links.",true),
        new("Voice","HafizLoc1","Text","استنساخ الصوت وفصل 6 تراكات","Voice Clone & 6 Stems",false),
        new("Voice","HafizLoc2","Text","عزل الغناء BS-RoFormer، فصل 6 تراكات Demucs، وتحويل غنائي محلي Seed-VC","BS-RoFormer vocal isolation, Demucs six-stem separation and local Seed-VC singing conversion",false),
        new("Voice","HafizLoc3","Text","فصل التراكات — BS-RoFormer وDemucs","Stem separation — BS-RoFormer & Demucs",false),
        new("Voice","MixInputPathBox","PlaceholderText","مسار الأغنية الأصلية (WAV / FLAC / MP3)...","Original song path (WAV / FLAC / MP3)…",false),
        new("Voice","HafizLoc4","Content","عزل غنائي BS-RoFormer","BS-RoFormer vocal isolation",false),
        new("Voice","HafizLoc5","Content","فصل 6 تراكات (Demucs)","Separate 6 stems (Demucs)",false),
        new("Voice","HafizLoc6","Text","التراكات: الغناء، الدرامز، الباص، الجيتار، البيانو، وأخرى. حماية GPU للمحركات المملوكة لحافظ فقط.","Stems: vocals, drums, bass, guitar, piano, other. GPU guard applies only to HAFIZ-owned engines.",false),
        new("Voice","HafizLoc7","Text","تحويل الصوت والغناء المعتمد — Seed-VC","Authorized voice & singing conversion — Seed-VC",false),
        new("Voice","ReferenceVoicePathBox","PlaceholderText","مسار العينة الصوتية المرخصة (10–30 ثانية WAV)...","Authorized reference sample path (10–30 seconds WAV)…",false),
        new("Voice","VoiceConsentCheck","Content","أؤكد أنني أملك الإذن الكامل لاستخدام هذه العينة الصوتية","I confirm I have full permission to use this voice sample",false),
        new("Voice","HafizLoc8","Content","تحويل غنائي عبر Seed-VC (FP16 SM75)","Seed-VC singing conversion (FP16 SM75)",false),
        new("Voice","VoiceStemsStatus","Text","حالة المحركات تظهر بعد الاتصال الفعلي.","Engine status appears after a real connection.",true),
        new("Settings","HafizLoc1","Text","مركز الإعدادات الشامل","Centralized Settings Center",false),
        new("Settings","HafizLoc2","Text","إعدادات الواجهة واللغات والثيمات، LM Studio، فحص الموديلات بدون نقل، كارت الشاشة والتحميلات","Interface, languages, themes, LM Studio, in-place model scanning, GPU and downloads",false),
        new("Settings","HafizLoc3","Text","1. العام والواجهة","1. General, language & themes",false),
        new("Settings","HafizLoc4","Content","العربية (مصر — RTL)","العربية (Egypt — RTL)",false),
        new("Settings","HafizLoc5","Content","الإنجليزية (LTR)","English (US — LTR)",false),
        new("Settings","HafizLoc6","Content","نهاري: أبيض / أزرق كروم","Day: White / Chrome Blue",false),
        new("Settings","HafizLoc7","Content","ليلي: جرافيت / ذهبي","Night: Graphite / Gold",false),
        new("Settings","HafizLoc8","Content","أزرق ليلي","Midnight Blue",false),
        new("Settings","HafizLoc9","Text","2. مزوّد نماذج الذكاء الاصطناعي","2. AI models & provider",false),
        new("Settings","ProviderHafizRadio","Content","محرك حافظ المحلي llama.cpp","HAFIZ local llama.cpp",false),
        new("Settings","ProviderLmStudioRadio","Content","واجهة LM Studio المحلية (127.0.0.1:1234)","LM Studio local API (127.0.0.1:1234)",false),
        new("Settings","LmStudioUrlBox","PlaceholderText","LM Studio — عنوان الخادم المحلي","LM Studio local base URL",false),
        new("Settings","HafizLoc10","Content","فحص نماذج LM Studio","Discover LM Studio models",false),
        new("Settings","LmStudioStatusText","Text","يتم اكتشاف نماذج LM Studio بدون تغيير الموديلات المحملة خارجيًا.","LM Studio models are discovered without modifying external loaded models.",true),
        new("Settings","HafizLoc11","Text","محركات حافظ المحلية","Local AI endpoints",false),
        new("Settings","HafizLoc12","Text","اتصال محلي متوافق مع OpenAI فقط. حدد الخادم ومعرّفات الموديلات. لا اتصال سحابي أو تحكم تلقائي في برامج خارجية.","Loopback OpenAI-compatible API only. Configure the server and model IDs; no cloud or automatic external process control.",false),
        new("Settings","LocalLlmUrl","Header","عنوان llama-server","llama-server URL",false),
        new("Settings","LocalLlmModel","Header","معرّف نموذج اللغة (اختياري لو نموذج واحد)","LLM model ID (optional for a single model)",false),
        new("Settings","LocalAsrUrl","Header","عنوان خادم التفريغ الصوتي","ASR server URL",false),
        new("Settings","LocalAsrModel","Header","معرّف نموذج التفريغ الصوتي","ASR model ID",false),
        new("Settings","LocalTtsUrl","Header","عنوان خادم النطق الصوتي","TTS server URL",false),
        new("Settings","LocalTtsModel","Header","معرّف نموذج النطق الصوتي","TTS model ID",false),
        new("Settings","LocalTtsVoice","Header","معرّف الصوت المصري","Egyptian TTS voice ID",false),
        new("Settings","HafizLoc13","Content","حفظ المحركات المحلية","Save local endpoints",false),
        new("Settings","HafizLoc14","Text","3. فحص البارتيشنات بدون نقل الموديلات","3. Multi-drive in-place model scanner",false),
        new("Settings","HafizLoc15","Text","حافظ يفهرس الموديلات في مساراتك المختارة بدون نسخ أو نقل أو حذف أي ملف.","HAFIZ indexes models in selected directories without copying, moving or deleting files.",false),
        new("Settings","CustomScanPathBox","PlaceholderText","أضف مسار بارتيشن أو مجلد...","Add a drive or directory path…",false),
        new("Settings","HafizLoc16","Content","إضافة مسار","Add path",false),
        new("Settings","HafizLoc17","Content","ابدأ الفحص الآن","Scan now",false),
        new("Settings","ScanSummaryText","Text","مسارات الفحص المختارة","Selected scan roots",true),
        new("Settings","HafizLoc18","Text","4. كارت الشاشة وحماية ذاكرة VRAM","4. GPU & VRAM guard",false),
        new("Settings","GpuTelemetryDetailText","Text","جاري فحص كارت الشاشة…","Probing hardware telemetry…",true),
        new("Settings","HafizLoc19","Content","تحديث قراءة كارت الشاشة","Refresh GPU telemetry",false),
        new("Settings","HafizLoc20","Content","تفريغ ذاكرة حافظ فقط","Purge HAFIZ VRAM only",false),
        new("Settings","HafizLoc21","Text","حافظ لا يوقف أو يفرّغ عمليات Unsloth وLM Studio وComfyUI الخارجية.","HAFIZ never terminates or unloads external Unsloth, LM Studio or ComfyUI processes.",false),
        new("Settings","HafizLoc22","Text","5. المساعد والصوت والميكروفون والتحميلات والتخزين والتحديثات والأمان","5. Assistant, audio, microphone, downloads, storage, updates & security",false),
        new("Settings","StoragePathSummary","Text","مسارات التطبيق والموديلات","Application and model paths",true),
        new("Settings","HafizLoc23","Content","تبديل مكان حافظ العائم (يمين / يسار)","Switch companion position (left / right)",false),
        new("Settings","HafizLoc24","Content","حفظ الإعدادات نهائيًا","Save settings",false),
    ];

    public static void Apply(FrameworkElement root,string page,bool arabic)
    {
        foreach(var label in Labels)
        {
            if(label.Page!=page || root.FindName(label.Name) is not FrameworkElement element) continue;
            string value=arabic?label.Ar:label.En;
            bool MayReplace(object? old) => !label.Dynamic || old is string s && (s==label.Ar || s==label.En);
            switch(label.Property)
            {
                case "Text" when element is TextBlock t && MayReplace(t.Text): t.Text=value;break;
                case "Content" when element is ContentControl c && MayReplace(c.Content): c.Content=value;break;
                case "Header" when element is TextBox h: h.Header=value;break;
                case "PlaceholderText" when element is TextBox b: b.PlaceholderText=value;break;
                case "ToolTipService.ToolTip": ToolTipService.SetToolTip(element,value);break;
            }
        }
    }
}
