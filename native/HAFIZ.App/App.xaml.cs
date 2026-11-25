using HAFIZ.Backend.Gpu;
using HAFIZ.Backend.Orchestration;
using HAFIZ.Backend.Workers;
using HAFIZ.Core.Localization;
using HAFIZ.Core.Routing;
using HAFIZ.Core.Settings;
using HAFIZ.Infrastructure.Downloads;
using HAFIZ.Infrastructure.Hardware;
using HAFIZ.Infrastructure.Models;
using HAFIZ.Infrastructure.Providers;
using HAFIZ.App.ViewModels;
using Microsoft.UI.Xaml;

namespace HAFIZ.App;

public partial class App : Application
{
    public static MainViewModel ViewModel { get; private set; } = null!;
    private MainWindow? _mainWindow;
    private WorkerProcessSupervisor? _workerSupervisor;

    public App()
    {
        InitializeComponent();
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var appDataRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "HAFIZ_New_Generation");
        Directory.CreateDirectory(appDataRoot);

        var settingsStore = new SettingsStore(appDataRoot);
        var settings = settingsStore.Load();
        var localization = new LocalizationService(settings.Language);
        var intentRouter = new EgyptianIntentRouter();
        var hardwareInspector = new WindowsHardwareInspector();
        var modelScanner = new MultiDriveModelScanner();
        var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };
        var lmStudioClient = new LmStudioDiscoveryClient(httpClient);
        var downloadManager = new ResumableDownloadManager(httpClient, Path.Combine(appDataRoot, "downloads.journal.json"));
        var gpuGuard = new GpuMemoryGuard(hardwareInspector)
        {
            SafetyMarginMb = (int)Math.Round(settings.VramSafetyMarginGb * 1024),
            IdleUnloadSeconds = settings.IdleUnloadTimeoutSeconds
        };
        _workerSupervisor = new WorkerProcessSupervisor();
        var orchestrator = new SmartInferenceOrchestrator(gpuGuard, _workerSupervisor, lmStudioClient);

        ViewModel = new MainViewModel(
            settingsStore,
            localization,
            intentRouter,
            hardwareInspector,
            modelScanner,
            lmStudioClient,
            downloadManager,
            orchestrator);

        _mainWindow = new MainWindow(ViewModel);
        _mainWindow.Closed += (_, _) => _workerSupervisor?.Dispose();
        _mainWindow.Activate();
    }
}
