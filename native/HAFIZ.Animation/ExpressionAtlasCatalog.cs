using HAFIZ.Core.Models;

namespace HAFIZ.Animation;

public sealed record ExpressionAssetDescriptor(
    ExpressionId Id,
    string FileName,
    string DisplayNameEn,
    string DisplayNameAr,
    string Category,
    string? VisemeCode);

/// <summary>
/// Authoritative catalog of all 18 normalized transparent expressions extracted from the official HAFIZ Character Sheet.
/// </summary>
public static class ExpressionAtlasCatalog
{
    public static readonly IReadOnlyList<ExpressionAssetDescriptor> All =
    [
        new(ExpressionId.Neutral, "neutral.png", "Neutral", "طبيعي / هادي", "idle", "sil"),
        new(ExpressionId.SoftSmile, "soft_smile.png", "Soft Smile", "ابتسامة هادية", "mood", null),
        new(ExpressionId.BigSmile, "big_smile.png", "Big Smile", "ابتسامة كبيرة", "mood", null),
        new(ExpressionId.Laughing, "laughing.png", "Laughing", "بيضحك ومبسوط", "mood", null),
        new(ExpressionId.TalkingClosed, "talking_closed.png", "Talking — Closed Mouth", "نطق — فم مغلق", "viseme", "MBP"),
        new(ExpressionId.TalkingSlightlyOpen, "talking_slightly_open.png", "Talking — Slightly Open", "نطق — فتحة خفيفة", "viseme", "FV"),
        new(ExpressionId.TalkingWideOpen, "talking_wide_open.png", "Talking — Wide Open", "نطق — فتحة واسعة", "viseme", "AA"),
        new(ExpressionId.TalkingO, "talking_o.png", "Talking — O-Shape", "نطق — شكل O", "viseme", "OH"),
        new(ExpressionId.TalkingE, "talking_e.png", "Talking — E-Shape", "نطق — شكل E", "viseme", "EE"),
        new(ExpressionId.TalkingU, "talking_u.png", "Talking — U-Shape", "نطق — شكل U", "viseme", "OO"),
        new(ExpressionId.Smirk, "smirk.png", "Smirk", "ابتسامة جانبية واثقة", "mood", null),
        new(ExpressionId.Angry, "angry.png", "Angry", "غاضب", "mood", null),
        new(ExpressionId.Serious, "serious.png", "Serious / Determined", "جاد ومركّز", "mood", null),
        new(ExpressionId.Surprised, "surprised.png", "Surprised", "متفاجئ", "mood", null),
        new(ExpressionId.Sad, "sad.png", "Sad", "حزين", "mood", null),
        new(ExpressionId.Confused, "confused.png", "Confused / Skeptical", "مستغرب / بيفكر", "thinking", null),
        new(ExpressionId.Shouting, "shouting.png", "Shouting", "حماسي / بينادي", "mood", null),
        new(ExpressionId.Wink, "wink.png", "Wink", "غمزة ودودة", "mood", null),
    ];

    public static ExpressionAssetDescriptor Get(ExpressionId id) =>
        All.First(x => x.Id == id);
}
