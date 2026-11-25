using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using HAFIZ.Animation;
using HAFIZ.App.Services;
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

    private readonly LocalAiClient _localAi = new();
    private readonly NativeRecording _recording = new();
    private readonly NativeSpeechPlayback _playback = new();
    private CancellationTokenSource? _operation;
    private bool _recordingTransition;
    private bool _lyricsOwner;
    public bool IsRecording => _recording.IsRecording;
    public bool RecordingForLyrics => IsRecording && _lyricsOwner;
    public bool IsVoiceBusy => _operation is not null || _recordingTransition;
    public string? LastLyricsRecordingPath { get; private set; }
    public event Action<float[],int>? SpeechSamples;
    public string Localized(string ar, string en) => IsRightToLeft ? ar : en;
    private string RecordingDirectory => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"HAFIZ_In_Slang","Recordings");

    private void SetActivity(AvatarActivityState state)
    {
        CurrentExpression = ExpressionId.Neutral;
        AssistantState = state;
    }
    private void ReportError(Exception error)
    {
        SetActivity(AvatarActivityState.Error);
        StatusBanner = Localized("تعذر تنفيذ الطلب: ","Operation failed: ") + error.Message;
    }

    private (string Url,string Model) LlmEndpoint =>
        LlmProvider == LocalInferenceProvider.LmStudioExternal
            ? (LmStudioBaseUrl,SelectedLmStudioModelId)
            : (Settings.LocalLlmBaseUrl,Settings.LocalLlmModelId);

    private Task<string> CompleteAsync(string system,string text,CancellationToken ct)
    {
        var (url,model)=LlmEndpoint;
        return _localAi.ChatAsync(url,model,system,text,ct);
    }
    private Task<string> TranscribeAsync(string path,CancellationToken ct) =>
        _localAi.TranscribeAsync(Settings.LocalAsrBaseUrl,Settings.LocalAsrModelId,path,ct);

    private async Task SpeakInternalAsync(string text,CancellationToken ct)
    {
        SetActivity(AvatarActivityState.Thinking);
        var wav=await _localAi.SpeechAsync(Settings.LocalTtsBaseUrl,Settings.LocalTtsModelId,Settings.LocalTtsVoice,text,ct);
        Directory.CreateDirectory(RecordingDirectory);
        var file=Path.Combine(RecordingDirectory,"speech-"+Guid.NewGuid().ToString("N")+".wav");
        await File.WriteAllBytesAsync(file,wav,ct);
        await _playback.PlayAsync(file,wav,SetActivity,(data,rate)=>SpeechSamples?.Invoke(data,rate),ct);
    }

    public async Task ToggleRecordingAsync(bool lyrics)
    {
        if(_recordingTransition) return;
        if(_operation is not null)
        {
            _operation.Cancel();
            return; // Never overlap playback/inference and a new capture. Press again after cancellation.
        }
        if(IsRecording && _lyricsOwner!=lyrics)
        {
            StatusBanner=Localized("أوقف التسجيل من المساحة اللي بدأته منها.","Stop recording in the workspace where it started.");
            return;
        }
        _recordingTransition=true;
        string? recorded=null;
        try
        {
            if(!IsRecording)
            {
                _lyricsOwner=lyrics;
                await _recording.StartAsync(RecordingDirectory);
                SetActivity(AvatarActivityState.Listening);
                StatusBanner=Localized("الميكروفون بيسجل فعلاً.","Microphone recording is active.");
            }
            else
            {
                recorded=await _recording.StopAsync();
                if(lyrics) LastLyricsRecordingPath=recorded;
                SetActivity(AvatarActivityState.Idle);
                StatusBanner=Localized("تم حفظ التسجيل: ","Recording saved: ")+recorded;
            }
        }
        catch(Exception ex)
        {
            if(lyrics && _recording.PathOnDisk is string preserved && File.Exists(preserved))
                LastLyricsRecordingPath=preserved;
            ReportError(ex);
        }
        finally
        {
            _recordingTransition=false;
            OnPropertyChanged(nameof(IsRecording));
            OnPropertyChanged(nameof(RecordingForLyrics));
        }
        if(recorded is not null && !lyrics)
            await RunOperationAsync(async ct => {
                var text=await TranscribeAsync(recorded,ct);
                await RouteCommandAsync(text,true,ct);
            });
    }

    public void CancelVoiceOperation() => _operation?.Cancel();
    public void ClearLyricsRecording() => LastLyricsRecordingPath=null;

    private async Task RunOperationAsync(Func<CancellationToken,Task> action)
    {
        if(IsRecording || IsVoiceBusy)
        {
            StatusBanner=Localized("في تسجيل أو عملية شغالة بالفعل.","A recording or operation is already active.");
            return;
        }
        using var cts=new CancellationTokenSource();
        _operation=cts;
        OnPropertyChanged(nameof(IsVoiceBusy));
        try { SetActivity(AvatarActivityState.Thinking); await action(cts.Token); SetActivity(AvatarActivityState.Idle); }
        catch(OperationCanceledException) when(cts.IsCancellationRequested)
        { SetActivity(AvatarActivityState.Idle); StatusBanner=Localized("تم إلغاء العملية.","Operation cancelled."); }
        catch(Exception ex) { ReportError(ex); }
        finally { _operation=null; OnPropertyChanged(nameof(IsVoiceBusy)); }
    }

    public async Task<string?> RunLyricsAsync(string input,string mode)
    {
        string? result=null;
        await RunOperationAsync(async ct => {
            var source=LastLyricsRecordingPath is string recording
                ? await TranscribeAsync(recording,ct) : input;
            if(string.IsNullOrWhiteSpace(source)) throw new InvalidOperationException(Localized("سجل صوت أو اكتب نص الأول.","Record audio or enter text first."));
            AssistantTranscript=source;
            var instruction=mode switch {
                "Smart Diacritics"=>"Add natural Egyptian Arabic diacritics only; preserve every word and line.",
                "Suno Phonetic"=>"Apply Egyptian pronunciation-oriented Arabic diacritics suitable for sung lyrics; preserve all words.",
                "Connected Egyptian"=>"Apply natural connected Egyptian colloquial pronunciation and diacritics; retain words and lines.",
                "Proofread"=>"Proofread spelling and diacritics in Egyptian Arabic without changing the intended meaning.",
                "Rhyme"=>"Analyze Egyptian rhyme and meter in Arabic, without rewriting.",
                "Rewrite"=>"Rewrite in natural Egyptian colloquial Arabic, preserving intended meaning.",
                _=>throw new ArgumentException("Unknown lyrics operation.")
            };
            result=await CompleteAsync(instruction+" Return only the requested result, no commentary.",source,ct);
            StatusBanner=Localized("تم استلام نتيجة فعلية من المحرك المحلي.","Received actual local inference output.");
        });
        return result;
    }

    public Task SpeakTextAsync(string text) => RunOperationAsync(ct=>SpeakInternalAsync(text,ct));

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
        if(!string.IsNullOrWhiteSpace(input))
            _ = RunOperationAsync(ct=>RouteCommandAsync(input,false,ct));
    }

    private async Task RouteCommandAsync(string input,bool spoken,CancellationToken ct)
    {
        var intent=_intentRouter.Route(input);
        AssistantTranscript=input;
        string reply=IsRightToLeft?intent.ResponseAr:intent.ResponseEn;
        switch(intent.Action)
        {
            case AssistantActionKind.OpenWorkspace when intent.TargetWorkspace.HasValue:
                EnterWorkspace(intent.TargetWorkspace.Value);
                break;
            case AssistantActionKind.SwitchTheme when intent.TargetTheme.HasValue:
                SetTheme(intent.TargetTheme.Value); break;
            case AssistantActionKind.SwitchLanguage when intent.TargetLanguage.HasValue:
                SetLanguage(intent.TargetLanguage.Value); break;
            case AssistantActionKind.PurgeHafizVram:
                await PurgeHafizVramAsync(); reply=StatusBanner; break;
            case AssistantActionKind.ScanLocalModels:
                EnterWorkspace(WorkspaceSection.SettingsCenter);
                await ScanLocalModelsAsync(); reply=StatusBanner; break;
            default:
                reply=await CompleteAsync("You are HAFIZ, a helpful Egyptian Arabic assistant. Respond in natural Egyptian colloquial Arabic, unless asked for English. Be concise.",input,ct);
                break;
        }
        StatusBanner=reply;
        if(spoken && !string.IsNullOrWhiteSpace(Settings.LocalTtsBaseUrl))
            await SpeakInternalAsync(reply,ct);
        else if(spoken)
            StatusBanner=reply+"\n"+Localized("الصوت غير مضبوط: حدد محرك TTS المحلي في الإعدادات.","Speech is not configured: select the local TTS endpoint in Settings.");
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
