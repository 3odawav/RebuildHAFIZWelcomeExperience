using System.ComponentModel;
using HAFIZ.App.ViewModels;
using HAFIZ.Core.Models;
using Microsoft.UI.Windowing;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using Windows.Graphics;
using Windows.UI;

namespace HAFIZ.App;

public sealed partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;

    public MainWindow(MainViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;

        ExtendsContentIntoTitleBar = true;
        SetTitleBar(AppTitleBar);
        ConfigureInitialWindowSize();
        var iconPath = Path.Combine(AppContext.BaseDirectory, "Assets", "Branding", "HAFIZ.ico");
        if (File.Exists(iconPath)) AppWindow.SetIcon(iconPath);

        StartupStage.Bind(_viewModel);
        LyricsView.Bind(_viewModel);
        AudioView.Bind(_viewModel);
        VoiceView.Bind(_viewModel);
        SettingsView.Bind(_viewModel);
        FloatingAssistant.ViewModel = _viewModel;

        _viewModel.PropertyChanged += OnViewModelPropertyChanged;
        _viewModel.SpeechSamples += (pcm,rate) => { StartupStage.PushAudioSamples(pcm,rate); FloatingAssistant.PushAudioSamples(pcm,rate); };
        Closed += (_,_) => _viewModel.CloseVoiceSession();
        ApplyThemeAndDirection();
        SyncWorkspaceVisibility();
        FloatingAssistant.HorizontalAlignment = _viewModel.FloatingDockSide == AssistantDockSide.Left ? HorizontalAlignment.Left : HorizontalAlignment.Right;

        _ = _viewModel.RefreshHardwareTelemetryAsync();
    }

    private void ConfigureInitialWindowSize()
    {
        if (AppWindow is null) return;
        AppWindow.Resize(new SizeInt32(1380, 860));
    }

    private void OnViewModelPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        DispatcherQueue.TryEnqueue(() =>
        {
            if (e.PropertyName is nameof(MainViewModel.SelectedTheme) or nameof(MainViewModel.SelectedLanguage))
            {
                ApplyThemeAndDirection();
            }

            if (e.PropertyName is nameof(MainViewModel.ShowStartupStage) or nameof(MainViewModel.ActiveWorkspace))
            {
                SyncWorkspaceVisibility();
            }

            if (e.PropertyName == nameof(MainViewModel.FloatingDockSide))
            {
                FloatingAssistant.HorizontalAlignment = _viewModel.FloatingDockSide == AssistantDockSide.Left
                    ? HorizontalAlignment.Left
                    : HorizontalAlignment.Right;
            }

            if (e.PropertyName is nameof(MainViewModel.AssistantState) or nameof(MainViewModel.CurrentExpression) or nameof(MainViewModel.StatusBanner) or nameof(MainViewModel.IsRecording))
            {
                var statusLabel = _viewModel.AssistantState switch
                {
                    AvatarActivityState.Listening => _viewModel.Text("Status.Listening"),
                    AvatarActivityState.Speaking => _viewModel.Text("Status.Speaking"),
                    AvatarActivityState.Thinking => _viewModel.Text("Status.Thinking"),
                    _ => string.IsNullOrWhiteSpace(_viewModel.StatusBanner) ? _viewModel.Text("Status.Ready") : _viewModel.StatusBanner
                };
                FloatingAssistant.SyncVisualState(_viewModel.AssistantState, _viewModel.CurrentExpression, statusLabel);
                StartupStage.SyncVisualState(_viewModel.AssistantState, _viewModel.CurrentExpression, statusLabel);
            }

            if (e.PropertyName == nameof(MainViewModel.GpuTelemetry))
            {
                var gpu = _viewModel.GpuTelemetry;
                GpuStatusTitleText.Text = gpu.TelemetryAvailable
                    ? $"{gpu.GpuName} • {gpu.UsedVramMb}/{gpu.TotalVramMb} MB VRAM • {gpu.TemperatureC}°C"
                    : "GPU Telemetry: Waiting for Windows CUDA Driver";
            }
        });
    }

    private void ApplyThemeAndDirection()
    {
        RootLayout.FlowDirection = _viewModel.IsRightToLeft ? FlowDirection.RightToLeft : FlowDirection.LeftToRight;

        RootLayout.RequestedTheme = _viewModel.SelectedTheme switch
        {
            ThemePreset.DayWhiteChromeBlue => ElementTheme.Light,
            _ => ElementTheme.Dark
        };

        // Apply Midnight Blue override canvas if MidnightBlue is chosen
        if (_viewModel.SelectedTheme == ThemePreset.MidnightBlueAi)
        {
            RootLayout.Background = new SolidColorBrush(Color.FromArgb(255, 7, 16, 30));
        }
        else
        {
            RootLayout.ClearValue(Panel.BackgroundProperty);
        }

        NavLyrics.Content = _viewModel.Text("Nav.LyricsStudio");
        NavAudio.Content = _viewModel.Text("Nav.AudioWeb");
        NavVoice.Content = _viewModel.Text("Nav.VoiceStems");
        NavSettings.Content = _viewModel.Text("Nav.SettingsCenter");
    }

    private void SyncWorkspaceVisibility()
    {
        var showStartup = _viewModel.ShowStartupStage;
        StartupStage.Visibility = showStartup ? Visibility.Visible : Visibility.Collapsed;
        WorkspaceNav.Visibility = showStartup ? Visibility.Collapsed : Visibility.Visible;
        FloatingAssistant.Visibility = showStartup ? Visibility.Collapsed : Visibility.Visible;
        StartupStage.SetSceneRunning(showStartup && !_viewModel.Settings.ReduceMotion);

        LyricsView.Visibility = _viewModel.ActiveWorkspace == WorkspaceSection.LyricsStudio ? Visibility.Visible : Visibility.Collapsed;
        AudioView.Visibility = _viewModel.ActiveWorkspace == WorkspaceSection.AudioWeb ? Visibility.Visible : Visibility.Collapsed;
        VoiceView.Visibility = _viewModel.ActiveWorkspace == WorkspaceSection.VoiceCloneAndStems ? Visibility.Visible : Visibility.Collapsed;
        SettingsView.Visibility = _viewModel.ActiveWorkspace == WorkspaceSection.SettingsCenter ? Visibility.Visible : Visibility.Collapsed;
    }

    private void OnNavSelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.SelectedItemContainer?.Tag is not string tag) return;
        if (Enum.TryParse<WorkspaceSection>(tag, out var section))
        {
            _viewModel.ActiveWorkspace = section;
        }
    }

    private void OnQuickLanguageToggle(object sender, RoutedEventArgs e)
    {
        var next = _viewModel.SelectedLanguage == UiLanguage.ArabicEgypt
            ? UiLanguage.EnglishUs
            : UiLanguage.ArabicEgypt;
        _viewModel.SetLanguage(next);
    }

    private void OnCycleThemeClick(object sender, RoutedEventArgs e)
    {
        var next = _viewModel.SelectedTheme switch
        {
            ThemePreset.DayWhiteChromeBlue => ThemePreset.NightGraphiteGold,
            ThemePreset.NightGraphiteGold => ThemePreset.MidnightBlueAi,
            _ => ThemePreset.DayWhiteChromeBlue
        };
        _viewModel.SetTheme(next);
    }
}
