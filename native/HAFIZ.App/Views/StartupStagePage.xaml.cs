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
    private bool _listening;

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
        HeroAvatar.SetState(AvatarLifecycleState.Speaking, ExpressionId.TalkingWideOpen);
        _vm?.TriggerMood(ExpressionId.TalkingWideOpen);
    }

    private void OnMoodLaughingClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarLifecycleState.Idle, ExpressionId.Laughing);
        _vm?.TriggerMood(ExpressionId.Laughing);
    }

    private void OnMoodSeriousClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarLifecycleState.Idle, ExpressionId.Serious);
        _vm?.TriggerMood(ExpressionId.Serious);
    }

    private void OnMoodCalmClick(object sender, RoutedEventArgs e)
    {
        HeroAvatar.SetState(AvatarLifecycleState.Idle, ExpressionId.Neutral);
        _vm?.TriggerMood(ExpressionId.Neutral);
    }

    private void OnMicToggleClick(object sender, RoutedEventArgs e)
    {
        _listening = !_listening;
        HeroAvatar.SetState(_listening ? AvatarLifecycleState.Listening : AvatarLifecycleState.Idle);
        if (_vm is not null)
        {
            _vm.AssistantState = _listening ? AvatarLifecycleState.Listening : AvatarLifecycleState.Idle;
        }
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
        HeroAvatar.SetState(AvatarLifecycleState.Thinking);
        _vm?.HandleVoiceOrTextCommand(input);
        StartupCommandBox.Text = string.Empty;
    }

    private void OnOpenLyricsClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.LyricsStudio);
    private void OnOpenAudioClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.AudioWeb);
    private void OnOpenVoiceClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.VoiceCloneAndStems);
    private void OnOpenSettingsClick(object sender, RoutedEventArgs e) => _vm?.EnterWorkspace(WorkspaceSection.SettingsCenter);
}
