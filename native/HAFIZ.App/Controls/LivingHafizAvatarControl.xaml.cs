using HAFIZ.Animation;
using HAFIZ.Core.Models;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media.Imaging;

namespace HAFIZ.App.Controls;

public sealed partial class LivingHafizAvatarControl : UserControl
{
    private readonly AvatarMotionController _controller = new();
    private readonly Dictionary<ExpressionId, BitmapImage> _bitmapCache = new();
    private readonly DispatcherTimer _frameTimer;
    private DateTimeOffset _lastTick = DateTimeOffset.UtcNow;
    private ExpressionId _baseLoaded = ExpressionId.Neutral;
    private ExpressionId _overlayLoaded = ExpressionId.Neutral;

    public static readonly DependencyProperty AvatarSizeProperty =
        DependencyProperty.Register(nameof(AvatarSize), typeof(double), typeof(LivingHafizAvatarControl),
            new PropertyMetadata(316.0, OnAvatarSizeChanged));

    public double AvatarSize
    {
        get => (double)GetValue(AvatarSizeProperty);
        set => SetValue(AvatarSizeProperty, value);
    }

    public LivingHafizAvatarControl()
    {
        InitializeComponent();
        PreloadAllOfficialExpressions();
        BaseExpressionImage.Source = GetBitmap(ExpressionId.Neutral);
        OverlayExpressionImage.Source = GetBitmap(ExpressionId.Neutral);

        _frameTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromMilliseconds(16) // ~60 FPS native Composition loop
        };
        _frameTimer.Tick += OnFrameTick;

        Loaded += (_, _) =>
        {
            _lastTick = DateTimeOffset.UtcNow;
            _frameTimer.Start();
        };
        Unloaded += (_, _) => _frameTimer.Stop();
    }

    public void SetState(AvatarLifecycleState state, ExpressionId? explicitMood = null)
    {
        _controller.SetState(state, explicitMood);
    }

    public void PushAudioSamples(ReadOnlySpan<float> pcmMono, int sampleRate = 16000)
    {
        _controller.PushAudioSamples(pcmMono, sampleRate);
    }

    public void StopSpeakingImmediately()
    {
        _controller.StopSpeakingImmediately();
    }

    private void OnFrameTick(object? sender, object e)
    {
        var now = DateTimeOffset.UtcNow;
        var dt = (now - _lastTick).TotalSeconds;
        _lastTick = now;

        var frame = _controller.Step(dt);

        if (_baseLoaded != frame.BaseExpression)
        {
            BaseExpressionImage.Source = GetBitmap(frame.BaseExpression);
            _baseLoaded = frame.BaseExpression;
        }

        if (_overlayLoaded != frame.OverlayExpression)
        {
            OverlayExpressionImage.Source = GetBitmap(frame.OverlayExpression);
            _overlayLoaded = frame.OverlayExpression;
        }

        OverlayExpressionImage.Opacity = frame.OverlayOpacity;
        RigTransform.TranslateX = frame.HeadTranslateX;
        RigTransform.TranslateY = frame.HeadTranslateY;
        RigTransform.Rotation = frame.HeadRotationDeg;
        RigTransform.ScaleX = frame.BreathingScale;
        RigTransform.ScaleY = frame.BreathingScale;

        OuterFrequencyHalo.Opacity = 0.28 + frame.HaloIntensity * 0.55;
        ThinkingPulseRing.Opacity = frame.NeuralThinkingGlow > 0.05 ? 0.25 + frame.NeuralThinkingGlow * 0.65 : 0.14;
        HaloRotation.Angle = (HaloRotation.Angle + (frame.NeuralThinkingGlow > 0.05 ? 0.9 : 0.22)) % 360.0;
    }

    private void PreloadAllOfficialExpressions()
    {
        var baseDir = Path.Combine(AppContext.BaseDirectory, "Assets", "Expressions");
        foreach (var entry in ExpressionAtlasCatalog.All)
        {
            var fullPath = Path.Combine(baseDir, entry.FileName);
            var uri = File.Exists(fullPath)
                ? new Uri(fullPath)
                : new Uri($"ms-appx:///Assets/Expressions/{entry.FileName}");
            _bitmapCache[entry.Id] = new BitmapImage(uri);
        }
    }

    private BitmapImage GetBitmap(ExpressionId id)
    {
        return _bitmapCache.TryGetValue(id, out var img)
            ? img
            : _bitmapCache[ExpressionId.Neutral];
    }

    private static void OnAvatarSizeChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        if (d is not LivingHafizAvatarControl ctrl || e.NewValue is not double size) return;
        ctrl.PortraitRigContainer.Width = size;
        ctrl.PortraitRigContainer.Height = size;
        ctrl.OuterFrequencyHalo.Width = size * 1.13;
        ctrl.OuterFrequencyHalo.Height = size * 1.13;
        ctrl.ThinkingPulseRing.Width = size * 1.05;
        ctrl.ThinkingPulseRing.Height = size * 1.05;
    }
}
