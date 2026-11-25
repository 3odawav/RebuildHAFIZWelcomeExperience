using HAFIZ.App.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace HAFIZ.App.Views;

public sealed partial class AudioWebPage : UserControl
{
    private MainViewModel? _vm;

    public AudioWebPage()
    {
        InitializeComponent();
    }

    public void Bind(MainViewModel viewModel) => _vm = viewModel;

    private async void OnRunTranscribeClick(object sender, RoutedEventArgs e)
    {
        var path = AudioPathBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            AudioWebStatus.Text = "Select an existing local WAV/MP3/FLAC file before running transcribe.cpp.";
            return;
        }
        if(_vm is null) return;
        var result=await _vm.TranscribeFileAsync(path);
        if(result is not null) TranscriptResultBox.Text=result;
        AudioWebStatus.Text=_vm.StatusBanner;
    }

    private void OnAnalyzeMusicClick(object sender, RoutedEventArgs e)
    {
        AudioWebStatus.Text = _vm?.Localized("محرك تحليل الموسيقى غير موصول بعد.","Music analysis engine is not connected yet.");
    }

    private void OnQueueWebIngestClick(object sender, RoutedEventArgs e)
    {
        var url = WebUrlBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(url))
        {
            AudioWebStatus.Text = "Enter a supported URL first.";
            return;
        }
        AudioWebStatus.Text = _vm?.Localized("محرك استيراد الوسائط غير موصول بعد.","Media ingest engine is not connected yet.");
    }
}
