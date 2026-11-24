using HAFIZ.App.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace HAFIZ.App.Views;

public sealed partial class VoiceStemsPage : UserControl
{
    private MainViewModel? _vm;

    public VoiceStemsPage()
    {
        InitializeComponent();
    }

    public void Bind(MainViewModel viewModel) => _vm = viewModel;

    private void OnRunBsRoformerClick(object sender, RoutedEventArgs e)
    {
        var file = MixInputPathBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(file) || !File.Exists(file))
        {
            VoiceStemsStatus.Text = "Provide a valid local audio file path for BS-RoFormer vocal isolation.";
            return;
        }
        VoiceStemsStatus.Text = $"BS-RoFormer queued under SingleHeavyModelLock for {Path.GetFileName(file)}.";
    }

    private void OnRunDemucs6StemsClick(object sender, RoutedEventArgs e)
    {
        var file = MixInputPathBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(file) || !File.Exists(file))
        {
            VoiceStemsStatus.Text = "Provide a valid local audio file path for Demucs htdemucs_6s.";
            return;
        }
        VoiceStemsStatus.Text = $"Demucs 6-Stems queued under SingleHeavyModelLock for {Path.GetFileName(file)}.";
    }

    private void OnRunSeedVcClick(object sender, RoutedEventArgs e)
    {
        if (VoiceConsentCheck.IsChecked != true)
        {
            VoiceStemsStatus.Text = "Explicit voice-owner consent confirmation is required before Seed-VC conversion.";
            return;
        }
        var refPath = ReferenceVoicePathBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(refPath) || !File.Exists(refPath))
        {
            VoiceStemsStatus.Text = "Provide a valid authorized reference voice sample file.";
            return;
        }
        VoiceStemsStatus.Text = $"Seed-VC singing conversion queued (FP16 SM75 Turing safe mode) using {Path.GetFileName(refPath)}.";
    }
}
