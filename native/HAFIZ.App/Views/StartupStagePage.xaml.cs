using HAFIZ.App.ViewModels;
using HAFIZ.Core.Models;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Windows.System;

namespace HAFIZ.App.Views;

public sealed partial class StartupStagePage : UserControl
{
    private MainViewModel? _vm;
    public void SyncVisualState(AvatarActivityState state, ExpressionId expression, string status)
    {
        HeroAvatar.SetState(state, expression == ExpressionId.Neutral ? null : expression);
        GreetingSubtitle.Text = status;
        MicTriggerButton.Content = _vm?.IsRecording == true ? _vm.Localized("⏹ إيقاف التسجيل", "Stop recording") : _vm?.Localized("🎤 اتكلم مع حافظ", "Speak to HAFIZ");
    }
    public void PushAudioSamples(float[] pcm,int rate) => HeroAvatar.PushAudioSamples(pcm,rate);

    public StartupStagePage()
    {
        InitializeComponent();
    }

    public void Bind(MainViewModel viewModel)
    {
        _vm = viewModel;
        GreetingTitle.Text = _vm.Text("Startup.Greeting");
    }

    private void OnMoodSpeakingClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarActivityState.Speaking, ExpressionId.TalkingWideOpen);
        _vm?.TriggerMood(ExpressionId.TalkingWideOpen);
    }

    private void OnMoodLaughingClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarActivityState.Idle, ExpressionId.Laughing);
        _vm?.TriggerMood(ExpressionId.Laughing);
    }

    private void OnMoodSeriousClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarActivityState.Idle, ExpressionId.Serious);
        _vm?.TriggerMood(ExpressionId.Serious);
    }

    private void OnMoodCalmClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarActivityState.Idle, ExpressionId.Neutral);
        _vm?.TriggerMood(ExpressionId.Neutral);
    }

    private async void OnMicToggleClick(object sender, RoutedEventArgs e)
    {
        if (_vm is not null) await _vm.ToggleRecordingAsync(false);
    }

    private void OnSubmitStartupCommand(object sender, RoutedEventArgs e) => SubmitCommand();

    private void OnCommandKeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == VirtualKey.Enter)
        {
            SubmitCommand();
            e.Handled = true;
        }
    }

    private void SubmitCommand()
    {
        var input = StartupCommandBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(input)) return;
        _vm?.HandleVoiceOrTextCommand(input);
        StartupCommandBox.Text = string.Empty;
    }

    private void OnOpenLyricsClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.LyricsStudio);
    private void OnOpenAudioClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.AudioWeb);
    private void OnOpenVoiceClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.VoiceCloneAndStems);
    private void OnOpenSettingsClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.SettingsCenter);
}
