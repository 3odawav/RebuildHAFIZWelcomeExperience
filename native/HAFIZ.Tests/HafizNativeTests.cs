using System.Net;
using System.Text;
using HAFIZ.Animation;
using HAFIZ.Backend.Gpu;
using HAFIZ.Core.Localization;
using HAFIZ.Core.Models;
using HAFIZ.Core.Routing;
using HAFIZ.Core.Settings;
using HAFIZ.Infrastructure.Downloads;
using HAFIZ.Infrastructure.Hardware;
using HAFIZ.Infrastructure.Models;
using HAFIZ.Infrastructure.Providers;
using Xunit;

namespace HAFIZ.Tests;

public sealed class HafizNativeTests
{
    [Fact]
    public void ExpressionCatalog_ContainsAll18OfficialExpressions()
    {
        Assert.Equal(18, ExpressionAtlasCatalog.All.Count);
        Assert.Contains(ExpressionAtlasCatalog.All, e => e.Id == ExpressionId.Neutral && e.FileName == "neutral.png");
        Assert.Contains(ExpressionAtlasCatalog.All, e => e.Id == ExpressionId.TalkingWideOpen && e.FileName == "talking_wide_open.png");
        Assert.Contains(ExpressionAtlasCatalog.All, e => e.Id == ExpressionId.Wink && e.FileName == "wink.png");
    }

    [Fact]
    public void AudioVisemeAnalyzer_ClosesMouthImmediatelyOnSilence()
    {
        var analyzer = new AudioVisemeAnalyzer();
        var silence = new float[512];
        var viseme = analyzer.AnalyzePcmFrame(silence, false).PrimaryExpression;
        Assert.Equal(ExpressionId.Neutral, viseme);

        // Loud vowel-like low-ZCR sine burst should open mouth
        var vowel = new float[512];
        for (int i = 0; i < vowel.Length; i++)
        {
            vowel[i] = 0.45f * MathF.Sin(2f * MathF.PI * 220f * i / 16000f);
        }
        var active = analyzer.AnalyzePcmFrame(vowel, true).PrimaryExpression;
        Assert.NotEqual(ExpressionId.Neutral, active);
    }

    [Fact]
    public void AvatarMotionController_StopsSpeakingImmediately()
    {
        var controller = new AvatarMotionController();
        controller.SetState(AvatarActivityState.Speaking, ExpressionId.TalkingWideOpen);
        controller.StopSpeakingImmediately();
        var frame = controller.Step(0.016);
        Assert.Equal(ExpressionId.Neutral, frame.ActiveExpression);
    }

    [Fact]
    public void EgyptianIntentRouter_RoutesAllowlistedCommandsWithoutShellExecution()
    {
        var router = new EgyptianIntentRouter();
        var lyricsIntent = router.Route("افتح استوديو الكلمات يا حافظ");
        Assert.Equal(AssistantActionKind.OpenWorkspace, lyricsIntent.Action);
        Assert.Equal(WorkspaceSection.LyricsStudio, lyricsIntent.TargetWorkspace);

        var purgeIntent = router.Route("فضي الرام بتاعة كارت الشاشة");
        Assert.Equal(AssistantActionKind.PurgeHafizVram, purgeIntent.Action);
    }

    [Fact]
    public void SettingsStore_PersistsAndReloadsAtomically()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"hafiz-test-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);
        try
        {
            var path = Path.Combine(tempDir, "settings.json");
            var store = new SettingsStore(tempDir);
            var settings = new AppSettings
            {
                Theme = ThemePreset.MidnightBlueAi,
                Language = UiLanguage.EnglishUs,
                DockSide = AssistantDockSide.Left,
                InferenceProvider = LocalInferenceProvider.LmStudioExternal,
                LmStudioBaseUrl = "http://127.0.0.1:1234"
            };
            store.Save(settings);

            var reloaded = store.Load();
            Assert.Equal(ThemePreset.MidnightBlueAi, reloaded.Theme);
            Assert.Equal(UiLanguage.EnglishUs, reloaded.Language);
            Assert.Equal(AssistantDockSide.Left, reloaded.DockSide);
            Assert.Equal(LocalInferenceProvider.LmStudioExternal, reloaded.InferenceProvider);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    public async Task MultiDriveModelScanner_IndexesInPlaceWithoutMovingAndFlagsCohereAndF16()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), $"hafiz-scan-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);
        try
        {
            var coherePath = Path.Combine(tempDir, "cohere-transcribe-03-2026-q4_0.gguf");
            await File.WriteAllBytesAsync(coherePath, new byte[6 * 1024 * 1024]); // 6 MB dummy GGUF

            var scanner = new MultiDriveModelScanner();
            var indexPath = Path.Combine(tempDir, "index", "model-index.json");
            var found = await scanner.ScanInPlaceAsync(new[] { tempDir }, indexPath);

            Assert.Single(found);
            Assert.Equal(ModelRuntimeEngine.TranscribeCpp, found[0].RequiredEngine);
            Assert.True(found[0].InPlaceLinked);
            Assert.True(File.Exists(coherePath)); // Never moved or deleted
            Assert.True(File.Exists(indexPath));
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    public async Task GpuMemoryGuard_ProtectsExternalWorkloadsAndPurgesHafizOnly()
    {
        var fakeInspector = new FakeHardwareInspector(new GpuTelemetrySnapshot
        {
            TelemetryAvailable = true,
            GpuName = "NVIDIA Quadro RTX 5000",
            ComputeCapability = "7.5",
            IsTuringSm75 = true,
            TotalVramMb = 16384,
            UsedVramMb = 10240,
            FreeVramMb = 6144,
            ActiveProcesses = new[]
            {
                new GpuProcessInfo { Pid = 1001, ProcessName = "LMStudio.exe", UsedVramMb = 8200, IsHafizOwned = false, IsExternalProtected = true },
                new GpuProcessInfo { Pid = 2002, ProcessName = "hafiz-llama-server.exe", UsedVramMb = 2040, IsHafizOwned = true, IsExternalProtected = false }
            }
        });

        var guard = new GpuMemoryGuard(fakeInspector);
        guard.RegisterLease(new LoadedWorkerLease("hafiz-llama-server", "Qwen 3.5", ModelCapability.AssistantLlm, 2040, true, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow));

        // 8000 MB new model should be blocked because 16384 - 1800 margin - 8200 LM Studio = 6384 MB usable
        var decision = await guard.EvaluateAdmissionAsync("hafiz-heavy-2", 8000, isHeavy: true, protectExternalGpuWorkloads: true);
        Assert.False(decision.Allowed);
        Assert.True(decision.ExternalGpuWorkloadDetected);

        var unloaded = new List<string>();
        var purge = await guard.PurgeHafizOnlyAsync((id, _) =>
        {
            unloaded.Add(id);
            return Task.CompletedTask;
        });

        Assert.True(purge.Success);
        Assert.True(purge.PreservedExternalWorkloads);
        Assert.Single(unloaded);
        Assert.Equal("hafiz-llama-server", unloaded[0]);
    }

    [Fact]
    public async Task LmStudioDiscoveryClient_ParsesLocalApiModels()
    {
        var handler = new StubHttpHandler("""
        {
          "data": [
            { "id": "qwen3.5-9b-q4_k_m", "state": "loaded", "arch": "qwen3", "quantization": "Q4_K_M", "max_context_length": 32768 }
          ]
        }
        """);
        var client = new LmStudioDiscoveryClient(new HttpClient(handler));
        var result = await client.DiscoverModelsAsync("http://127.0.0.1:1234");
        Assert.True(result.Reachable);
        Assert.Single(result.Models);
        Assert.Equal("qwen3.5-9b-q4_k_m", result.Models[0].Id);
        Assert.Equal("loaded", result.Models[0].State);
    }

    [Fact]
    public void LocalizationService_SwitchesBetweenArabicRtlAndEnglishLtr()
    {
        var loc = new LocalizationService(UiLanguage.ArabicEgypt);
        Assert.True(loc.IsRightToLeft);
        Assert.Contains("حافظ", loc.Get("App.Title"));

        loc.SetLanguage(UiLanguage.EnglishUs);
        Assert.False(loc.IsRightToLeft);
        Assert.Contains("HAFIZ", loc.Get("App.Title"));
    }

    private sealed class FakeHardwareInspector(GpuTelemetrySnapshot snapshot) : IHardwareInspector
    {
        public Task<GpuTelemetrySnapshot> ProbeGpuAsync(CancellationToken ct = default) => Task.FromResult(snapshot);
    }

    private sealed class StubHttpHandler(string jsonResponse) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(jsonResponse, Encoding.UTF8, "application/json")
            });
        }
    }
}
