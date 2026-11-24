namespace HAFIZ.Core.Models;

public enum ModelCapability { AssistantLlm, SongwritingLlm, CodeAndAnalysisLlm, SpeechToText, TextToSpeech, VoiceConversion, StemSeparation, VoiceActivityDetection }
public enum ModelRuntimeEngine { LlamaCpp, TranscribeCpp, PythonAudioSeparator, PythonDemucs, PythonSeedVc, PythonTts, OnnxRuntime }
public enum WorkspaceSection { LyricsStudio, AudioWeb, VoiceCloneAndStems, SettingsCenter }
public enum AssistantActionKind { Conversation, OpenWorkspace, SwitchTheme, SwitchLanguage, PurgeHafizVram, ScanLocalModels }
public sealed record RoutedAssistantIntent(AssistantActionKind Action, string ResponseAr, string ResponseEn, WorkspaceSection? TargetWorkspace = null, ThemePreset? TargetTheme = null, UiLanguage? TargetLanguage = null);
public sealed record GpuProcessInfo
{
    public int Pid { get; init; }
    public string ProcessName { get; init; } = "";
    public int UsedVramMb { get; init; }
    public bool IsHafizOwned { get; init; }
    public bool IsExternalProtected { get; init; }
}
public sealed record GpuTelemetrySnapshot
{
    public bool TelemetryAvailable { get; init; }
    public string? GpuName { get; init; }
    public string? DriverVersion { get; init; }
    public string? ComputeCapability { get; init; }
    public bool IsTuringSm75 { get; init; }
    public bool SupportsBf16 { get; init; }
    public int TotalVramMb { get; init; }
    public int UsedVramMb { get; init; }
    public int FreeVramMb { get; init; }
    public int UtilizationPercent { get; init; }
    public int TemperatureC { get; init; }
    public IReadOnlyList<GpuProcessInfo> ActiveProcesses { get; init; } = Array.Empty<GpuProcessInfo>();
    public DateTimeOffset SampledAtUtc { get; init; } = DateTimeOffset.UtcNow;
    public string? UnavailableReason { get; init; }
    public static GpuTelemetrySnapshot Unavailable(string reason) => new() { UnavailableReason = reason };
}
public sealed record DiscoveredModelEntry
{
    public required string Id { get; init; }
    public required string FriendlyNameAr { get; init; }
    public required string FriendlyNameEn { get; init; }
    public required string TechnicalFileName { get; init; }
    public required string FullPath { get; init; }
    public ModelCapability Capability { get; init; }
    public ModelRuntimeEngine RequiredEngine { get; init; }
    public long SizeBytes { get; init; }
    public int EstimatedVramMb { get; init; }
    public string Quantization { get; init; } = "Unknown";
    public bool InPlaceLinked { get; init; }
    public bool ExceedsSafe16GbVramBudget { get; init; }
    public string? CompatibilityWarning { get; init; }
    public DateTimeOffset DiscoveredAtUtc { get; init; }
}
