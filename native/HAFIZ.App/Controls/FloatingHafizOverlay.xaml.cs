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
    public void PushAudioSamples(float[] pcm,int rate) => MiniAvatar.PushAudioSamples(pcm,rate);

    public FloatingHafizOverlay()
    {
        InitializeComponent();
    }

    public void SyncVisualState(AvatarActivityState state, ExpressionId expression, string statusLabel)
    {
        MiniAvatar.SetState(state, expression == ExpressionId.Neutral ? null : expression);
        AssistantStatusText.Text = statusLabel;
        if(ViewModel is not null)
        {
            CompanionMicButton.Content=ViewModel.IsRecording?ViewModel.Localized("⏹ إيقاف","Stop"):ViewModel.Localized("🎤 اتكلم","Speak");
            if(ViewModel.IsRecording) CompanionMicButton.Background=new Microsoft.UI.Xaml.Media.SolidColorBrush(Windows.UI.Color.FromArgb(255,190,35,40));
            else CompanionMicButton.ClearValue(Control.BackgroundProperty);
        }
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

    private async void OnListenToggleClick(object sender, RoutedEventArgs e)
    {
        if (ViewModel is not null) await ViewModel.ToggleRecordingAsync(false);
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
