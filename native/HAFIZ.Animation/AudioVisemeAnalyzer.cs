using HAFIZ.Core.Models;

namespace HAFIZ.Animation;

public sealed record VisemeFrame(
    ExpressionId PrimaryExpression,
    ExpressionId SecondaryExpression,
    double BlendWeight,
    double RmsEnergy,
    double ZeroCrossingRate);

/// <summary>
/// Audio-driven viseme analyzer for PCM playback buffers (16-bit mono or float32).
/// Selects genuine official Character Sheet viseme expressions (TalkingClosed, TalkingSlightlyOpen,
/// TalkingWideOpen, TalkingO, TalkingE, TalkingU) without distorting or stretching facial pixels.
/// Immediately returns Neutral/Closed when playback ends or is interrupted.
/// </summary>
public sealed class AudioVisemeAnalyzer
{
    public const double SilenceThreshold = 0.015;

    public VisemeFrame AnalyzePcmFrame(ReadOnlySpan<float> samples, bool isPlaybackActive, string? explicitPhonemeHint = null)
    {
        if (!isPlaybackActive || samples.IsEmpty)
        {
            return new VisemeFrame(ExpressionId.Neutral, ExpressionId.Neutral, 0.0, 0.0, 0.0);
        }

        double sumSq = 0;
        int zeroCrossings = 0;
        for (int i = 0; i < samples.Length; i++)
        {
            float s = samples[i];
            sumSq += s * s;
            if (i > 0 && ((samples[i - 1] >= 0 && s < 0) || (samples[i - 1] < 0 && s >= 0)))
            {
                zeroCrossings++;
            }
        }

        double rms = Math.Sqrt(sumSq / samples.Length);
        double zcr = samples.Length > 1 ? (double)zeroCrossings / (samples.Length - 1) : 0.0;

        if (rms < SilenceThreshold)
        {
            return new VisemeFrame(ExpressionId.TalkingClosed, ExpressionId.Neutral, 0.25, rms, zcr);
        }

        if (!string.IsNullOrWhiteSpace(explicitPhonemeHint))
        {
            var mapped = MapPhonemeToViseme(explicitPhonemeHint);
            return new VisemeFrame(mapped, ExpressionId.TalkingSlightlyOpen, Math.Clamp(rms * 3.0, 0.2, 1.0), rms, zcr);
        }

        // Acoustic approximation when phoneme timestamps are unavailable:
        // - High RMS + mid ZCR => wide open vowel (AA)
        // - Mid RMS + high ZCR => sibilant / front vowel (E-shape)
        // - Mid RMS + low ZCR => rounded vowel (O-shape / U-shape)
        // - Soft RMS => slightly open consonant/vowel
        ExpressionId target = (rms, zcr) switch
        {
            ( >= 0.26, _ ) => ExpressionId.TalkingWideOpen,
            ( >= 0.14, >= 0.16 ) => ExpressionId.TalkingE,
            ( >= 0.14, <= 0.07 ) => ExpressionId.TalkingO,
            ( >= 0.08, <= 0.08 ) => ExpressionId.TalkingU,
            _ => ExpressionId.TalkingSlightlyOpen,
        };

        double blend = Math.Clamp((rms - SilenceThreshold) / 0.28, 0.15, 1.0);
        return new VisemeFrame(target, ExpressionId.TalkingSlightlyOpen, blend, rms, zcr);
    }

    public static ExpressionId MapPhonemeToViseme(string phoneme)
    {
        var p = phoneme.Trim().ToUpperInvariant();
        return p switch
        {
            "M" or "B" or "P" or "م" or "ب" => ExpressionId.TalkingClosed,
            "O" or "OH" or "AW" or "و" => ExpressionId.TalkingO,
            "U" or "OO" or "UW" => ExpressionId.TalkingU,
            "E" or "EE" or "IY" or "I" or "ي" => ExpressionId.TalkingE,
            "A" or "AA" or "AE" or "ا" or "ع" or "ح" => ExpressionId.TalkingWideOpen,
            _ => ExpressionId.TalkingSlightlyOpen,
        };
    }
}
