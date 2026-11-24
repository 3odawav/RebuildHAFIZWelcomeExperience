using HAFIZ.App.ViewModels;
using HAFIZ.Core.Models;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace HAFIZ.App.Views;

public sealed partial class SettingsCenterPage : UserControl
{
    private MainViewModel? _vm;

    public SettingsCenterPage()
    {
        InitializeComponent();
    }

    public void Bind(MainViewModel viewModel)
    {
        _vm = viewModel;
        LmStudioUrlBox.Text = _vm.LmStudioBaseUrl;
        ProviderHafizRadio.IsChecked = _vm.LlmProvider == LocalInferenceProvider.EmbeddedLlamaCpp;
        ProviderLmStudioRadio.IsChecked = _vm.LlmProvider == LocalInferenceProvider.LmStudioExternal;
        StoragePathSummary.Text = $"Install Root: {_vm.Settings.AppInstallDirectory} • Model Storage: {_vm.Settings.ModelDownloadDirectory} • Idle Unload: {_vm.Settings.IdleUnloadTimeoutSeconds}s";
        UpdateScanRootsLabel();
    }

    private void OnSetArabicClick(object sender, RoutedEventArgs e) => _vm?.SetLanguage(UiLanguage.ArabicEgypt);
    private void OnSetEnglishClick(object sender, RoutedEventArgs e) => _vm?.SetLanguage(UiLanguage.EnglishUs);
    private void OnThemeDayClick(object sender, RoutedEventArgs e) => _vm?.SetTheme(ThemePreset.DayWhiteChromeBlue);
    private void OnThemeNightClick(object sender, RoutedEventArgs e) => _vm?.SetTheme(ThemePreset.NightGraphiteGold);
    private void OnThemeMidnightClick(object sender, RoutedEventArgs e) => _vm?.SetTheme(ThemePreset.MidnightBlueAi);

    private void OnProviderHafizChecked(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        _vm.LlmProvider = LocalInferenceProvider.EmbeddedLlamaCpp;
        _vm.PersistSettings();
    }

    private void OnProviderLmStudioChecked(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        _vm.LlmProvider = LocalInferenceProvider.LmStudioExternal;
        _vm.PersistSettings();
    }

    private async void OnDiscoverLmStudioClick(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        _vm.LmStudioBaseUrl = LmStudioUrlBox.Text.Trim();
        await _vm.DiscoverLmStudioAsync();
        LmStudioStatusText.Text = _vm.StatusBanner;
    }

    private void OnAddScanRootClick(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        var path = CustomScanPathBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(path)) return;
        _vm.AddScanRoot(path);
        CustomScanPathBox.Text = string.Empty;
        UpdateScanRootsLabel();
    }

    private async void OnScanDrivesClick(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        ScanSummaryText.Text = "Scanning selected drives in-place...";
        await _vm.ScanLocalModelsAsync();
        ScanSummaryText.Text = _vm.StatusBanner;
    }

    private async void OnRefreshGpuClick(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        await _vm.RefreshHardwareTelemetryAsync();
        var g = _vm.GpuTelemetry;
        GpuTelemetryDetailText.Text = g.TelemetryAvailable
            ? $"{g.GpuName} (Driver {g.DriverVersion}, SM {g.ComputeCapability}, TuringSM75={g.IsTuringSm75}) • VRAM: {g.UsedVramMb}/{g.TotalVramMb} MB • Free: {g.FreeVramMb} MB • Temp: {g.TemperatureC}°C"
            : $"GPU Telemetry unavailable: {g.UnavailableReason}";
    }

    private async void OnPurgeHafizVramClick(object sender, RoutedEventArgs e)
    {
        if (_vm is null) return;
        await _vm.PurgeHafizVramAsync();
        GpuTelemetryDetailText.Text = _vm.StatusBanner;
    }

    private void OnToggleFloatingSideClick(object sender, RoutedEventArgs e) => _vm?.ToggleFloatingDockSide();

    private void OnSaveAllSettingsClick(object sender, RoutedEventArgs e)
    {
        _vm?.PersistSettings();
        SettingsActionStatus.Text = "Settings persisted atomically.";
    }

    private void UpdateScanRootsLabel()
    {
        if (_vm is null) return;
        ScanSummaryText.Text = $"Scan Roots (In-Place): {string.Join(" | ", _vm.ScanRoots)}";
    }
}
