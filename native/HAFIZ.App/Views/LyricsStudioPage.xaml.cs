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

    private async void OnRecordClick(object sender,RoutedEventArgs e)
    {
        if(_vm is null) return;
        await _vm.ToggleRecordingAsync(true);
        RecordButton.Content=_vm.RecordingForLyrics?_vm.Localized("⏹ إيقاف التسجيل","Stop recording"):_vm.Localized("🎤 تسجيل","Record");
        RecordButton.Background=_vm.RecordingForLyrics?new Microsoft.UI.Xaml.Media.SolidColorBrush(Windows.UI.Color.FromArgb(255,190,35,40)):null;
        LyricsStatusText.Text=_vm.StatusBanner;
    }
    private void OnClearRecordingClick(object sender,RoutedEventArgs e)
    {
        _vm?.ClearLyricsRecording();
        LyricsStatusText.Text=_vm?.Localized("النص المكتوب هو المصدر الآن. التسجيل محفوظ.","Using typed text. Recording remains on disk.");
    }
    private void OnCancelClick(object sender,RoutedEventArgs e)=>_vm?.CancelVoiceOperation();

    private async Task RunModeAsync(string mode)
    {
        if(_vm is null) return;
        var result=await _vm.RunLyricsAsync(LyricsEditor.Text??"",mode);
        if(result is not null)
        {
            if(_vm.LastLyricsRecordingPath is not null) LyricsEditor.Text=_vm.AssistantTranscript;
            PromptOutputBox.Text=result;
        }
        LyricsStatusText.Text=_vm.StatusBanner;
    }
    private async void OnDiacritizeClick(object sender,RoutedEventArgs e)
        =>await RunModeAsync((DiacriticsMode.SelectedItem as ComboBoxItem)?.Tag as string??"Smart Diacritics");
    private async void OnRhymeCheckClick(object sender,RoutedEventArgs e)=>await RunModeAsync("Rhyme");
    private async void OnRewriteClick(object sender,RoutedEventArgs e)=>await RunModeAsync("Rewrite");
    private async void OnSpeakLyricsClick(object sender,RoutedEventArgs e)
    {
        if(_vm is null) return;
        var text=string.IsNullOrWhiteSpace(PromptOutputBox.Text)?LyricsEditor.Text:PromptOutputBox.Text;
        if(!string.IsNullOrWhiteSpace(text)) await _vm.SpeakTextAsync(text);
        LyricsStatusText.Text=_vm.StatusBanner;
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
