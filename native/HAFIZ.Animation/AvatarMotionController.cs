using HAFIZ.Core.Models;

namespace HAFIZ.Animation;

public sealed record AvatarTransformState(
    ExpressionId ActiveExpression,
    ExpressionId PreviousExpression,
    double CrossfadeProgress,
    double TranslateX,
    double TranslateY,
    double RotationDegrees,
    double Scale,
    double HaloIntensity,
    bool NeuralGlowActive);

/// <summary>
/// 60 FPS organic motion and crossfade controller for the official 18-expression transparent HAFIZ avatar.
/// Operates via clean sprite crossfading + subtle rigid head/collar transforms (breathing, nod, sway),
/// eliminating unnatural pixel stretching or distorted facial warps.
/// Note: This is a transparent 2D/2.5D multi-expression composition controller, not a 3D skeletal mesh rig.
/// </summary>
public sealed class AvatarMotionController
{
    private ExpressionId _activeExpression = ExpressionId.Neutral;
    private ExpressionId _previousExpression = ExpressionId.Neutral;
    private double _crossfade = 1.0;

    private AvatarActivityState _activity;
    private ExpressionId? _explicitMood;
    private VisemeFrame? _viseme;
    private double _elapsed;
    private readonly AudioVisemeAnalyzer _analyzer = new();
    public void SetState(AvatarActivityState state, ExpressionId? explicitMood = null)
    {
        _activity = state;
        _explicitMood = explicitMood;
        if (state != AvatarActivityState.Speaking) _viseme = null;
    }
    public void PushAudioSamples(ReadOnlySpan<float> samples, int sampleRate = 16000)
    {
        _viseme = _analyzer.AnalyzePcmFrame(samples, _activity == AvatarActivityState.Speaking);
    }
    public void StopSpeakingImmediately()
    {
        SetState(AvatarActivityState.Idle, ExpressionId.Neutral);
        _activeExpression = _previousExpression = ExpressionId.Neutral;
        _crossfade = 1;
    }
    public AvatarTransformState Step(double deltaSeconds)
    {
        _elapsed += Math.Max(0, deltaSeconds);
        return Step(_elapsed, deltaSeconds, _activity, _viseme, false);
    }

    public AvatarTransformState Step(
        double elapsedSeconds,
        double deltaSeconds,
        AvatarActivityState activity,
        VisemeFrame? liveViseme,
        bool reduceMotion)
    {
        var desired = activity == AvatarActivityState.Speaking && liveViseme is not null ? liveViseme.PrimaryExpression : _explicitMood ?? ResolveDesiredExpression(elapsedSeconds, activity, liveViseme);
        if (desired != _activeExpression)
        {
            _previousExpression = _activeExpression;
            _activeExpression = desired;
            _crossfade = 0.0;
        }

        double fadeSpeed = activity == AvatarActivityState.Speaking ? 16.0 : 7.0;
        _crossfade = Math.Min(1.0, _crossfade + Math.Max(0.0, deltaSeconds) * fadeSpeed);

        if (reduceMotion)
        {
            return new AvatarTransformState(
                _activeExpression,
                _previousExpression,
                _crossfade,
                TranslateX: 0,
                TranslateY: 0,
                RotationDegrees: 0,
                Scale: 1.0,
                HaloIntensity: activity is AvatarActivityState.Speaking or AvatarActivityState.Thinking ? 0.85 : 0.45,
                NeuralGlowActive: activity == AvatarActivityState.Thinking);
        }

        double energy = liveViseme?.RmsEnergy ?? 0.0;
        double breatheY = Math.Sin(elapsedSeconds * 1.45) * 3.2;
        double swayX = Math.Sin(elapsedSeconds * 0.72) * 2.4;
        double tiltDeg = Math.Sin(elapsedSeconds * 0.85) * 1.1;

        double speakNod = activity == AvatarActivityState.Speaking
            ? Math.Sin(elapsedSeconds * 5.8) * (1.5 + energy * 5.0)
            : 0;
        double laughBounce = activity == AvatarActivityState.Laughing
            ? Math.Abs(Math.Sin(elapsedSeconds * 7.5)) * -5.0
            : 0;
        double seriousDamp = activity == AvatarActivityState.Serious ? 0.35 : 1.0;

        double halo = activity switch
        {
            AvatarActivityState.Speaking => Math.Clamp(0.65 + energy * 1.2, 0.65, 1.0),
            AvatarActivityState.Listening => 0.82,
            AvatarActivityState.Thinking => 0.90,
            AvatarActivityState.Laughing => 0.88,
            AvatarActivityState.Serious => 0.55,
            _ => 0.45 + 0.10 * Math.Sin(elapsedSeconds * 1.8),
        };

        return new AvatarTransformState(
            ActiveExpression: _activeExpression,
            PreviousExpression: _previousExpression,
            CrossfadeProgress: _crossfade,
            TranslateX: swayX * seriousDamp,
            TranslateY: (breatheY + speakNod + laughBounce) * seriousDamp,
            RotationDegrees: (tiltDeg + (activity == AvatarActivityState.Thinking ? -2.2 : 0)) * seriousDamp,
            Scale: 1.0 + (activity == AvatarActivityState.Laughing ? 0.015 : 0.004 * Math.Sin(elapsedSeconds * 1.45)),
            HaloIntensity: halo,
            NeuralGlowActive: activity == AvatarActivityState.Thinking);
    }

    private static ExpressionId ResolveDesiredExpression(double elapsedSeconds, AvatarActivityState activity, VisemeFrame? viseme)
    {
        return activity switch
        {
            AvatarActivityState.Speaking => viseme?.PrimaryExpression ?? ExpressionId.TalkingSlightlyOpen,
            AvatarActivityState.Thinking => ExpressionId.Confused,
            AvatarActivityState.Listening => ExpressionId.SoftSmile,
            AvatarActivityState.Laughing => ((int)(elapsedSeconds * 2.4) % 2 == 0) ? ExpressionId.Laughing : ExpressionId.BigSmile,
            AvatarActivityState.Serious => ExpressionId.Serious,
            AvatarActivityState.Surprised => ExpressionId.Surprised,
            _ => ((int)(elapsedSeconds / 6.0) % 5 == 4) ? ExpressionId.SoftSmile : ExpressionId.Neutral,
        };
    }
}
