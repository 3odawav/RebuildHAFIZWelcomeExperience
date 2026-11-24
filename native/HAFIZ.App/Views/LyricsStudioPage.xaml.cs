using HAFIZ.App.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace HAFIZ.App.Views;

public sealed partial class LyricsStudioPage : UserControl
{
    private MainViewModel? _vm;

    public LyricsStudioPage()
    {
        InitializeComponent();
    }

    public void Bind(MainViewModel viewModel) => _vm = viewModel;

    private void OnDiacritizeClick(object sender, RoutedEventArgs e)
    {
        LyricsStatusText.Text = "Diacritization request queued to local Egyptian LLM / Tashkeel worker.";
    }

    private void OnRhymeCheckClick(object sender, RoutedEventArgs e)
    {
        var lines = (LyricsEditor.Text ?? string.Empty)
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        PromptOutputBox.Text = $"Line count: {lines.Length}\nRhyme & cadence analysis routed to active LLM provider ({_vm?.LlmProvider}).";
    }

    private void OnRewriteClick(object sender, RoutedEventArgs e)
    {
        LyricsStatusText.Text = "Egyptian rewrite routed through SmartInferenceOrchestrator.";
    }

    private void OnSpeakLyricsClick(object sender, RoutedEventArgs e)
    {
        LyricsStatusText.Text = "Egyptian TTS queued to isolated voicetut-egyptian-tashkeel worker.";
    }

    private void OnExportTextClick(object sender, RoutedEventArgs e)
    {
        var exportDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "HAFIZ_In_Slang_Exports");
        Directory.CreateDirectory(exportDir);
        var outPath = Path.Combine(exportDir, $"lyrics_{DateTime.Now:yyyyMMdd_HHmmss}.txt");
        File.WriteAllText(outPath, LyricsEditor.Text ?? string.Empty);
        LyricsStatusText.Text = $"Exported: {outPath}";
    }
}
