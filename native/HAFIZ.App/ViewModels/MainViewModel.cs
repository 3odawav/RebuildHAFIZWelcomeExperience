using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using HAFIZ.Animation;
using HAFIZ.Backend.Orchestration;
using HAFIZ.Core.Localization;
using HAFIZ.Core.Models;
using HAFIZ.Core.Routing;
using HAFIZ.Core.Settings;
using HAFIZ.Infrastructure.Downloads;
using HAFIZ.Infrastructure.Hardware;
using HAFIZ.Infrastructure.Models;
using HAFIZ.Infrastructure.Providers;

namespace HAFIZ.App.ViewModels;

public sealed partial class MainViewModel : ObservableObject
{
    private readonly SettingsStore _settingsStore;
    private readonly LocalizationService _localization;
    private readonly EgyptianIntentRouter _intentRouter;
    private readonly IHardwareInspector _hardwareInspector;
    private readonly MultiDriveModelScanner _modelScanner;
    private readonly LmStudioDiscoveryClient _lmStudioClient;
    private readonly ResumableDownloadManager _downloadManager;
    private readonly SmartInferenceOrchestrator _orchestrator;

    public MainViewModel(
        SettingsStore settingsStore,
        LocalizationService localization,
        EgyptianIntentRouter intentRouter,
        IHardwareInspector hardwareInspector,
        MultiDriveModelScanner modelScanner,
        LmStudioDiscoveryClient lmStudioClient,
        ResumableDownloadManager downloadManager,
        SmartInferenceOrchestrator orchestrator)
    {
        _settingsStore = settingsStore;
        _localization = localization;
        _intentRouter = intentRouter;
        _hardwareInspector = hardwareInspector;
        _modelScanner = modelScanner;
        _lmStudioClient = lmStudioClient;
        _downloadManager = downloadManager;
        _orchestrator = orchestrator;

        Settings = _settingsStore.Load();
        _localization.SetLanguage(Settings.Language);
        SelectedTheme = Settings.Theme;
        SelectedLanguage = Settings.Language;
        FloatingDockSide = Settings.DockSide;
        LlmProvider = Settings.InferenceProvider;
        LmStudioBaseUrl = Settings.LmStudioBaseUrl;
        SelectedLmStudioModelId = Settings.LmStudioSelectedModelId ?? string.Empty;
        ShowStartupStage = true;
        ActiveWorkspace = WorkspaceSection.LyricsStudio;
        AssistantState = AvatarActivityState.Idle;
        CurrentExpression = ExpressionId.Neutral;
        AssistantTranscript = string.Empty;
        StatusBanner = string.Empty;
        IsScanningModels = false;
        ScanFilesCount = 0;
        GpuTelemetry = GpuTelemetrySnapshot.Unavailable("Not probed yet.");
        LmStudioConnected = false;

        foreach (var root in Settings.ScanDirectories)
        {
            ScanRoots.Add(root);
        }
    }

    public AppSettings Settings { get; private set; }
    public LocalizationService Localization => _localization;

    [ObservableProperty] public partial bool ShowStartupStage { get; set; }
    [ObservableProperty] public partial WorkspaceSection ActiveWorkspace { get; set; }
    [ObservableProperty] public partial ThemePreset SelectedTheme { get; set; }
    [ObservableProperty] public partial UiLanguage SelectedLanguage { get; set; }
    [ObservableProperty] public partial AssistantDockSide FloatingDockSide { get; set; }
    [ObservableProperty] public partial AvatarActivityState AssistantState { get; set; }
    [ObservableProperty] public partial ExpressionId CurrentExpression { get; set; }
    [ObservableProperty] public partial string AssistantTranscript { get; set; }
    [ObservableProperty] public partial string StatusBanner { get; set; }
    [ObservableProperty] public partial bool IsScanningModels { get; set; }
    [ObservableProperty] public partial int ScanFilesCount { get; set; }
    [ObservableProperty] public partial GpuTelemetrySnapshot GpuTelemetry { get; set; }
    [ObservableProperty] public partial LocalInferenceProvider LlmProvider { get; set; }
    [ObservableProperty] public partial string LmStudioBaseUrl { get; set; }
    [ObservableProperty] public partial string SelectedLmStudioModelId { get; set; }
    [ObservableProperty] public partial bool LmStudioConnected { get; set; }

    public ObservableCollection<string> ScanRoots { get; } = new();
    public ObservableCollection<DiscoveredModelEntry> DiscoveredModels { get; } = new();
    public ObservableCollection<LmStudioModelInfo> LmStudioModels { get; } = new();
    public ObservableCollection<DownloadProgressSnapshot> ActiveDownloads { get; } = new();

    public bool IsRightToLeft => SelectedLanguage == UiLanguage.ArabicEgypt;
    public string Text(string key) => _localization.Get(key);

    [RelayCommand]
    public void EnterWorkspace(WorkspaceSection section)
    {
        ActiveWorkspace = section;
        ShowStartupStage = false;
        AssistantState = AvatarActivityState.Idle;
    }

    [RelayCommand]
    public void ReturnToStartupStage()
    {
        ShowStartupStage = true;
        AssistantState = AvatarActivityState.Idle;
    }

    [RelayCommand]
    public void SetTheme(ThemePreset theme)
    {
        SelectedTheme = theme;
        Settings.Theme = theme;
        PersistSettings();
    }

    [RelayCommand]
    public void SetLanguage(UiLanguage language)
    {
        SelectedLanguage = language;
        Settings.Language = language;
        _localization.SetLanguage(language);
        OnPropertyChanged(nameof(IsRightToLeft));
        PersistSettings();
    }

    [RelayCommand]
    public void ToggleFloatingDockSide()
    {
        FloatingDockSide = FloatingDockSide == AssistantDockSide.Right
            ? AssistantDockSide.Left
            : AssistantDockSide.Right;
        Settings.DockSide = FloatingDockSide;
        PersistSettings();
    }

    [RelayCommand]
    public void TriggerMood(ExpressionId expression)
    {
        CurrentExpression = expression;
        AssistantState = expression switch
        {
            ExpressionId.TalkingWideOpen or ExpressionId.TalkingSlightlyOpen => AvatarActivityState.Speaking,
            ExpressionId.Confused => AvatarActivityState.Thinking,
            _ => AvatarActivityState.Idle
        };
    }

    [RelayCommand]
    public void HandleVoiceOrTextCommand(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return;
        var intent = _intentRouter.Route(input);
        AssistantTranscript = input;

        switch (intent.Action)
        {
            case AssistantActionKind.OpenWorkspace when intent.TargetWorkspace.HasValue:
                EnterWorkspace(intent.TargetWorkspace.Value);
                StatusBanner = intent.ResponseAr;
                break;
            case AssistantActionKind.SwitchTheme when intent.TargetTheme.HasValue:
                SetTheme(intent.TargetTheme.Value);
                StatusBanner = intent.ResponseAr;
                break;
            case AssistantActionKind.SwitchLanguage when intent.TargetLanguage.HasValue:
                SetLanguage(intent.TargetLanguage.Value);
                StatusBanner = intent.ResponseAr;
                break;
            case AssistantActionKind.PurgeHafizVram:
                _ = PurgeHafizVramCommand.ExecuteAsync(null);
                break;
            case AssistantActionKind.ScanLocalModels:
                _ = ScanLocalModelsCommand.ExecuteAsync(null);
                break;
            default:
                AssistantState = AvatarActivityState.Thinking;
                StatusBanner = intent.ResponseAr;
                break;
        }
    }

    [RelayCommand]
    public async Task RefreshHardwareTelemetryAsync()
    {
        GpuTelemetry = await _hardwareInspector.ProbeGpuAsync();
    }

    [RelayCommand]
    public async Task ScanLocalModelsAsync()
    {
        if (IsScanningModels) return;
        IsScanningModels = true;
        DiscoveredModels.Clear();

        try
        {
            var indexPath = Path.Combine(Settings.ModelDownloadDirectory, "model-index.json");
            var progress = new Progress<ModelScanProgress>(p => ScanFilesCount = p.FilesScanned);
            var results = await _modelScanner.ScanInPlaceAsync(ScanRoots, indexPath, progress);
            foreach (var item in results)
            {
                DiscoveredModels.Add(item);
            }
            StatusBanner = SelectedLanguage == UiLanguage.ArabicEgypt
                ? $"تم فحص {ScanFilesCount} ملف وتم ربط {DiscoveredModels.Count} موديل في مكانهم بدون نقل."
                : $"Scanned {ScanFilesCount} files and indexed {DiscoveredModels.Count} models in-place.";
        }
        finally
        {
            IsScanningModels = false;
        }
    }

    [RelayCommand]
    public async Task DiscoverLmStudioAsync()
    {
        Settings.LmStudioBaseUrl = LmStudioBaseUrl;
        Settings.InferenceProvider = LlmProvider;
        PersistSettings();

        var result = await _lmStudioClient.DiscoverModelsAsync(LmStudioBaseUrl);
        LmStudioConnected = result.Reachable;
        LmStudioModels.Clear();
        foreach (var model in result.Models)
        {
            LmStudioModels.Add(model);
        }

        if (string.IsNullOrWhiteSpace(SelectedLmStudioModelId) && result.Models.Count > 0)
        {
            SelectedLmStudioModelId = result.Models[0].Id;
            Settings.LmStudioSelectedModelId = SelectedLmStudioModelId;
            PersistSettings();
        }

        StatusBanner = result.Reachable
            ? $"LM Studio connected at {result.BaseUrl} ({result.Models.Count} models)."
            : $"LM Studio not reachable at {result.BaseUrl}: {result.ErrorMessage}";
    }

    [RelayCommand]
    public async Task PurgeHafizVramAsync()
    {
        var result = await _orchestrator.PurgeHafizVramAsync();
        StatusBanner = result.Message;
        await RefreshHardwareTelemetryAsync();
    }

    public void AddScanRoot(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;
        if (ScanRoots.Any(r => r.Equals(path, StringComparison.OrdinalIgnoreCase))) return;
        ScanRoots.Add(path);
        Settings.ScanDirectories = ScanRoots.ToList();
        PersistSettings();
    }

    public void RemoveScanRoot(string path)
    {
        var match = ScanRoots.FirstOrDefault(r => r.Equals(path, StringComparison.OrdinalIgnoreCase));
        if (match is null) return;
        ScanRoots.Remove(match);
        Settings.ScanDirectories = ScanRoots.ToList();
        PersistSettings();
    }

    public void PersistSettings()
    {
        Settings.InferenceProvider = LlmProvider;
        Settings.LmStudioBaseUrl = LmStudioBaseUrl;
        Settings.LmStudioSelectedModelId = SelectedLmStudioModelId;
        Settings.Theme = SelectedTheme;
        Settings.Language = SelectedLanguage;
        Settings.DockSide = FloatingDockSide;
        _settingsStore.Save(Settings);
    }
}
