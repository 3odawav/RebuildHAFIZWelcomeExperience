using HAFIZ.App.ViewModels;
using HAFIZ.Core.Models;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Windows.System;

namespace HAFIZ.App.Controls;

public sealed partial class FloatingHafizOverlay : UserControl
{
    public MainViewModel? ViewModel { get; set; }
    private bool _isExpanded;
    private bool _isListening;

    public FloatingHafizOverlay()
    {
        InitializeComponent();
    }

    public void SyncVisualState(AvatarLifecycleState state, ExpressionId expression, string statusLabel)
    {
        MiniAvatar.SetState(state, expression);
        AssistantStatusText.Text = statusLabel;
    }

    private void OnToggleDockClick(object sender, RoutedEventArgs e)
    {
        ViewModel?.ToggleFloatingDockSide();
    }

    private void OnToggleExpandedClick(object sender, RoutedEventArgs e)
    {
        _isExpanded = !_isExpanded;
        CommandTray.Visibility = _isExpanded ? Visibility.Visible : Visibility.Collapsed;
    }

    private void OnListenToggleClick(object sender, RoutedEventArgs e)
    {
        _isListening = !_isListening;
        var nextState = _isListening ? AvatarLifecycleState.Listening : AvatarLifecycleState.Idle;
        MiniAvatar.SetState(nextState);
        if (ViewModel is not null)
        {
            ViewModel.AssistantState = nextState;
            AssistantStatusText.Text = _isListening
                ? ViewModel.Text("Status.Listening")
                : ViewModel.Text("Status.Ready");
        }
    }

    private void OnReturnHomeClick(object sender, RoutedEventArgs e)
    {
        ViewModel?.ReturnToStartupStage();
    }

    private void OnSendCommandClick(object sender, RoutedEventArgs e)
    {
        SubmitCommand();
    }

    private void OnCommandInputKeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == VirtualKey.Enter)
        {
            SubmitCommand();
            e.Handled = true;
        }
    }

    private void SubmitCommand()
    {
        var text = QuickCommandInput.Text?.Trim();
        if (string.IsNullOrWhiteSpace(text)) return;
        ViewModel?.HandleVoiceOrTextCommand(text);
        QuickCommandInput.Text = string.Empty;
    }
}
