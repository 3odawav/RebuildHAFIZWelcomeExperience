using HAFIZ.Core.Models;

namespace HAFIZ.Core.Routing;

/// <summary>
/// Safe, allowlisted Egyptian Arabic and English command router.
/// Translates spoken or typed user requests into validated application actions —
/// never grants unrestricted shell execution to any LLM or user prompt.
/// </summary>
public sealed class EgyptianIntentRouter
{
    public AppCommandIntent Resolve(string? rawInput)
    {
        var query = (rawInput ?? string.Empty).Trim();
        var lower = query.ToLowerInvariant();

        if (ContainsAny(lower, "فضّي", "فضي", "تفريغ", "purge", "unload", "فري vram", "الموديلات اللي مش بنستخدمها"))
        {
            return new AppCommandIntent(
                ActionId: "gpu.purge_idle_hafiz_models",
                TargetWorkspace: "Settings/GpuGuard",
                ReplyAr: "حاضر، هفرّغ موديلات حافظ الخاملة بس من ذاكرة الكارت بدون ما ألمس أي برنامج خارجي.",
                ReplyEn: "Understood — unloading idle HAFIZ-owned models only without touching external GPU workloads.",
                SuggestedExpression: ExpressionId.Serious,
                RequiresBackendInference: false);
        }

        if (ContainsAny(lower, "شوف الموديلات", "الموديلات الموجودة", "فحص البارتيشن", "scan models", "list models", "lm studio"))
        {
            return new AppCommandIntent(
                ActionId: "models.scan_local_in_place",
                TargetWorkspace: "Settings/Models",
                ReplyAr: "ثواني، هفحص المجلدات والبارتيشنات المختارة وأورّيك النماذج الموجودة عندك من غير ما أنقلها.",
                ReplyEn: "Opening your local model library to inspect discovered weights in-place without moving files.",
                SuggestedExpression: ExpressionId.SoftSmile,
                RequiresBackendInference: false);
        }

        if (ContainsAny(lower, "افصل الأغنية", "ست تراكات", "فصل التراكات", "6-stems", "stems", "demucs", "bs-roformer", "فصل الصوت"))
        {
            return new AppCommandIntent(
                ActionId: "audio.separate_six_stems",
                TargetWorkspace: "VoiceStems/Separation",
                ReplyAr: "يلا بينا على قسم فصل التراكات الستة (BS-RoFormer + Demucs htdemucs_6s).",
                ReplyEn: "Opening Six-Stem Separation (BS-RoFormer + Demucs htdemucs_6s).",
                SuggestedExpression: ExpressionId.Serious,
                RequiresBackendInference: true);
        }

        if (ContainsAny(lower, "حوّل الغُنا", "حول الغنا", "الصوت المرجعي", "استنساخ الصوت", "voice clone", "seed-vc", "singing conversion"))
        {
            return new AppCommandIntent(
                ActionId: "audio.convert_authorized_voice",
                TargetWorkspace: "VoiceStems/Clone",
                ReplyAr: "فتحتلك استنساخ وتحويل الغناء (Seed-VC) — اختار العينة المرجعية المصرّح بيها ونبدأ.",
                ReplyEn: "Opening authorized Voice & Singing Conversion (Seed-VC).",
                SuggestedExpression: ExpressionId.SoftSmile,
                RequiresBackendInference: true);
        }

        if (ContainsAny(lower, "شكّل الكلام", "شكل الكلام", "التشكيل", "بالمصري", "diacritics", "tashkeel", "تشكيل"))
        {
            return new AppCommandIntent(
                ActionId: "lyrics.egyptian_diacritics",
                TargetWorkspace: "LyricsStudio/Diacritics",
                ReplyAr: "تمام، هفتحلك التشكيل بالعامية المصرية عشان نظبّط النطق الطبيعي للكلمات.",
                ReplyEn: "Opening Egyptian Diacritics & Phonetic Studio.",
                SuggestedExpression: ExpressionId.SoftSmile,
                RequiresBackendInference: true);
        }

        if (ContainsAny(lower, "اقرالي", "اقرأ", "بصوتك", "read aloud", "speak this", "tts"))
        {
            return new AppCommandIntent(
                ActionId: "tts.read_active_text",
                TargetWorkspace: "LyricsStudio/Editor",
                ReplyAr: "حاضر يا فنان، هقرألك النص ده بصوت مصري طبيعي حالًا.",
                ReplyEn: "Reading the active text aloud using the Egyptian TTS pipeline.",
                SuggestedExpression: ExpressionId.TalkingSlightlyOpen,
                RequiresBackendInference: true);
        }

        if (ContainsAny(lower, "استوديو الكلمات", "اكتب أغنية", "أغنية", "قوافي", "كلمات", "lyrics", "songwriting", "rhyme"))
        {
            return new AppCommandIntent(
                ActionId: "workspace.open_lyrics_studio",
                TargetWorkspace: "LyricsStudio/Editor",
                ReplyAr: "أهلاً بيك في استوديو الكلمات المصرية! قولي الفكرة أو المود ونبدأ نكتب سوا.",
                ReplyEn: "Opening Lyrics Studio — tell me your song concept or mood.",
                SuggestedExpression: ExpressionId.BigSmile,
                RequiresBackendInference: false);
        }

        if (ContainsAny(lower, "تحليل الصوت", "تفريغ", "يوتيوب", "بحث", "transcribe", "bpm", "audio analysis", "youtube"))
        {
            return new AppCommandIntent(
                ActionId: "workspace.open_audio_web",
                TargetWorkspace: "AudioWeb/Analysis",
                ReplyAr: "فتحتلك قسم الصوت والويب للتفريغ بالعامية المصرية وتحليل الـ BPM والمقام.",
                ReplyEn: "Opening Audio & Web for Egyptian ASR transcription and musical analysis.",
                SuggestedExpression: ExpressionId.Neutral,
                RequiresBackendInference: false);
        }

        if (ContainsAny(lower, "الإعدادات", "إعدادات", "gpu", "vram", "settings", "كارت الشاشة", "ثيم"))
        {
            return new AppCommandIntent(
                ActionId: "workspace.open_settings",
                TargetWorkspace: "Settings/General",
                ReplyAr: "فتحتلك مركز الإعدادات الشامل للغة والمظهر والنماذج وحماية كارت الشاشة.",
                ReplyEn: "Opening the centralized Settings Center.",
                SuggestedExpression: ExpressionId.Neutral,
                RequiresBackendInference: false);
        }

        return new AppCommandIntent(
            ActionId: "llm.conversation_reply",
            TargetWorkspace: "Startup",
            ReplyAr: "سامعك كويس يا فنان — خليني أرد عليك من المحرك المحلي.",
            ReplyEn: "I hear you — routing your message to the local LLM.",
            SuggestedExpression: ExpressionId.SoftSmile,
            RequiresBackendInference: true);
    }

    private static bool ContainsAny(string haystack, params string[] needles)
    {
        foreach (var needle in needles)
        {
            if (haystack.Contains(needle, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }
        return false;
    }
}
