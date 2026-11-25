namespace HAFIZ.Core.Models;

/// <summary>
/// All 18 authoritative expressions from the official HAFIZ Character Sheet.
/// </summary>
public enum ExpressionId
{
    Neutral = 0,
    SoftSmile = 1,
    BigSmile = 2,
    Laughing = 3,
    TalkingClosed = 4,
    TalkingSlightlyOpen = 5,
    TalkingWideOpen = 6,
    TalkingO = 7,
    TalkingE = 8,
    TalkingU = 9,
    Smirk = 10,
    Angry = 11,
    Serious = 12,
    Surprised = 13,
    Sad = 14,
    Confused = 15,
    Shouting = 16,
    Wink = 17,
}

public enum AvatarActivityState
{
    Idle,
    Listening,
    Thinking,
    Speaking,
    Laughing,
    Serious,
    Surprised,
    Error,
}

public enum ThemePreset
{
    DayWhiteChromeBlue,
    NightGraphiteGold,
    MidnightBlueAi,
}

public enum WorkspaceDensity
{
    Comfortable,
    Compact,
}

public enum UiLanguage
{
    ArabicEgypt,
    EnglishUs,
}

public enum AssistantDockSide
{
    Left,
    Right,
}

public enum LocalInferenceProvider
{
    EmbeddedLlamaCpp,
    LmStudioExternal,
}

public enum ModelSetupStrategy
{
    UseExistingInPlace,
    DownloadMissingOnly,
    CompleteFreshInstall,
}

public enum ModelTaskRole
{
    PrimaryConversationLlm,
    AlternativeConversationLlm,
    EgyptianSongwriterLlm,
    CodingAssistantLlm,
    PrimaryAsr,
    SecondaryAsr,
    EgyptianTts,
    VoiceCloneSeedVc,
    VocalSeparationBsRoFormer,
    SixStemDemucs,
}

public enum OrchestratorState
{
    Idle,
    CheckingHardware,
    ResolvingDependencies,
    WaitingForExternalGpu,
    LoadingModel,
    WarmReady,
    Inferring,
    StreamingAudio,
    UnloadingIdle,
    PurgingHafizVram,
    RecoveringFromOom,
    Error,
}

public enum BackendConnectionState
{
    Disconnected,
    Connecting,
    Ready,
    Busy,
    Error,
    Recovering,
}

public sealed record ModelRegistryEntry
{
    public required string Id { get; init; }
    public required string DisplayNameAr { get; init; }
    public required string DisplayNameEn { get; init; }
    public required ModelTaskRole Role { get; init; }
    public required string LocalPath { get; init; }
    public required long SizeBytes { get; init; }
    public required string Quantization { get; init; }
    public required string RequiredRuntime { get; init; }
    public bool LinkedInPlace { get; init; } = true;
    public bool IsCustomUserModel { get; init; }
    public bool RequiresQuantizationFor16GbVram { get; init; }
    public bool IsVerifiedOnDisk { get; init; }
    public string? Sha256 { get; init; }
    public string? CompatibilityWarning { get; init; }
}

public sealed record GpuSnapshot
{
    public required bool TelemetryAvailable { get; init; }
    public string? GpuName { get; init; }
    public string? Architecture { get; init; }
    public string? ComputeCapability { get; init; }
    public string? DriverVersion { get; init; }
    public int? VramTotalMb { get; init; }
    public int? VramUsedMb { get; init; }
    public int? VramFreeMb { get; init; }
    public bool SupportsFp16 { get; init; } = true;
    public bool RequiresBf16 { get; init; } = false;
    public IReadOnlyList<ExternalGpuProcess> ExternalProcesses { get; init; } = Array.Empty<ExternalGpuProcess>();
    public IReadOnlyList<int> HafizWorkerPids { get; init; } = Array.Empty<int>();
    public DateTimeOffset MeasuredAtUtc { get; init; } = DateTimeOffset.UtcNow;
}

public sealed record ExternalGpuProcess(int Pid, string ProcessName, int UsedVramMb, bool IsProtectedExternalWorkload);

public sealed record AppSettings
{
    public UiLanguage Language { get; set; } = UiLanguage.ArabicEgypt;
    public string VoiceLocale { get; set; } = "ar-EG";
    public ThemePreset Theme { get; set; } = ThemePreset.MidnightBlueAi;
    public WorkspaceDensity Density { get; set; } = WorkspaceDensity.Comfortable;
    public bool ReduceMotion { get; set; }
    public AssistantDockSide DockSide { get; set; } = AssistantDockSide.Left;
    public LocalInferenceProvider InferenceProvider { get; set; } = LocalInferenceProvider.EmbeddedLlamaCpp;
    public string LmStudioBaseUrl { get; set; } = "http://127.0.0.1:1234";
    public string? LmStudioSelectedModelId { get; set; }
    public string LocalLlmBaseUrl { get; set; } = "http://127.0.0.1:8080";
    public string LocalLlmModelId { get; set; } = "";
    public string LocalAsrBaseUrl { get; set; } = "";
    public string LocalAsrModelId { get; set; } = "";
    public string LocalTtsBaseUrl { get; set; } = "";
    public string LocalTtsModelId { get; set; } = "";
    public string LocalTtsVoice { get; set; } = "";
    public string AppInstallDirectory { get; set; } = @"E:\HAFIZ_New_Generation";
    public string ModelDownloadDirectory { get; set; } = @"E:\HAFIZ_New_Generation_Models";
    public ModelSetupStrategy SetupStrategy { get; set; } = ModelSetupStrategy.UseExistingInPlace;
    public List<string> ScanDirectories { get; set; } =
    [
        @"D:\AI\LMStudio-Models\local",
        @"E:\",
        @"D:\",
    ];
    public bool LinkModelsInPlace { get; set; } = true;
    public Dictionary<string, string> ManualModelOverrides { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public int IdleUnloadTimeoutSeconds { get; set; } = 120;
    public double VramSafetyMarginGb { get; set; } = 2.0;
    public bool SingleHeavyModelLock { get; set; } = true;
    public bool ContinuousMicrophoneMode { get; set; }
    public bool BargeInEnabled { get; set; } = true;
    public double SpeechRate { get; set; } = 0.96;
    public bool AutoCheckUpdatesAsync { get; set; } = true;
}

public sealed record AppCommandIntent(
    string ActionId,
    string TargetWorkspace,
    string ReplyAr,
    string ReplyEn,
    ExpressionId SuggestedExpression,
    bool RequiresBackendInference,
    IReadOnlyDictionary<string, string>? Parameters = null);
