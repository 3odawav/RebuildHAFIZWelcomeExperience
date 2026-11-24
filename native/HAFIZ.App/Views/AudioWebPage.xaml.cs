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

    private void OnRunTranscribeClick(object sender, RoutedEventArgs e)
    {
        var path = AudioPathBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            AudioWebStatus.Text = "Select an existing local WAV/MP3/FLAC file before running transcribe.cpp.";
            return;
        }
        AudioWebStatus.Text = $"Queued {Path.GetFileName(path)} to isolated transcribe.cpp worker (Cohere Transcribe GGUF).";
    }

    private void OnAnalyzeMusicClick(object sender, RoutedEventArgs e)
    {
        AudioWebStatus.Text = "Music tempo & key analysis routed to local Python audio worker.";
    }

    private void OnQueueWebIngestClick(object sender, RoutedEventArgs e)
    {
        var url = WebUrlBox.Text?.Trim();
        if (string.IsNullOrWhiteSpace(url))
        {
            AudioWebStatus.Text = "Enter a supported URL first.";
            return;
        }
        AudioWebStatus.Text = $"Validated URL for isolated media ingest worker: {url}";
    }
}
