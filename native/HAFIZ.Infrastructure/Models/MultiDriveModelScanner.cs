using System.Text.Json;
using HAFIZ.Core.Models;

namespace HAFIZ.Infrastructure.Models;

public sealed record ModelScanProgress(
    string CurrentRoot,
    string CurrentPath,
    int FilesScanned,
    int ModelsDiscovered,
    bool IsCompleted);

/// <summary>
/// Scans user-selected drives and folders (e.g. D:\AI\LMStudio-Models\local, E:\, D:\) in-place.
/// STRICT SAFETY GUARANTEE: Never moves, copies, renames, or deletes any discovered model file.
/// Detects >12GB F16 custom songwriting exports (e.g. Qwen3-8B-Egyptian-Songwriter-30Step-Merged-F16.gguf)
/// and marks them as requiring Q4_K_M/Q5_K_M quantization before direct loading on a 16GB RTX 5000.
/// </summary>
public sealed class MultiDriveModelScanner
{
    private static readonly HashSet<string> ModelExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".gguf", ".safetensors", ".onnx", ".ckpt", ".pth", ".pt", ".bin", ".th"
    };

    private static readonly HashSet<string> SkippedDirectories = new(StringComparer.OrdinalIgnoreCase)
    {
        "$Recycle.Bin", "System Volume Information", "Windows", "Program Files",
        "Program Files (x86)", "ProgramData", "node_modules", ".git", "__pycache__",
        ".venv", "venv", "AppData"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<IReadOnlyList<DiscoveredModelEntry>> ScanInPlaceAsync(
        IEnumerable<string> scanRoots,
        string? indexOutputPath = null,
        IProgress<ModelScanProgress>? progress = null,
        CancellationToken ct = default)
    {
        var roots = scanRoots
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var discovered = new List<DiscoveredModelEntry>();
        var seenPaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var filesScanned = 0;

        await Task.Run(() =>
        {
            foreach (var root in roots)
            {
                ct.ThrowIfCancellationRequested();
                if (!Directory.Exists(root))
                {
                    continue;
                }

                var stack = new Stack<(string Dir, int Depth)>();
                stack.Push((root, 0));

                while (stack.Count > 0)
                {
                    ct.ThrowIfCancellationRequested();
                    var (currentDir, depth) = stack.Pop();
                    if (depth > 8) continue;

                    IEnumerable<string> files;
                    try
                    {
                        files = Directory.EnumerateFiles(currentDir);
                    }
                    catch
                    {
                        continue;
                    }

                    foreach (var file in files)
                    {
                        ct.ThrowIfCancellationRequested();
                        filesScanned++;

                        var ext = Path.GetExtension(file);
                        if (!ModelExtensions.Contains(ext)) continue;

                        FileInfo info;
                        try
                        {
                            info = new FileInfo(file);
                        }
                        catch
                        {
                            continue;
                        }

                        // Ignore tiny metadata .bin/.pt files (< 5 MB) unless specifically named for VAD/audio
                        var fileName = info.Name;
                        var isSmallKnownAudio = fileName.Contains("silero", StringComparison.OrdinalIgnoreCase)
                                                || fileName.Contains("tashkeel", StringComparison.OrdinalIgnoreCase);
                        if (info.Length < 5L * 1024 * 1024 && !isSmallKnownAudio)
                        {
                            continue;
                        }

                        if (!seenPaths.Add(info.FullName)) continue;

                        var entry = ClassifyModelFile(info);
                        if (entry is not null)
                        {
                            discovered.Add(entry);
                        }

                        if (filesScanned % 25 == 0)
                        {
                            progress?.Report(new ModelScanProgress(root, currentDir, filesScanned, discovered.Count, false));
                        }
                    }

                    IEnumerable<string> subDirs;
                    try
                    {
                        subDirs = Directory.EnumerateDirectories(currentDir);
                    }
                    catch
                    {
                        continue;
                    }

                    foreach (var sub in subDirs)
                    {
                        var folderName = Path.GetFileName(sub);
                        if (SkippedDirectories.Contains(folderName)) continue;
                        stack.Push((sub, depth + 1));
                    }
                }
            }
        }, ct);

        progress?.Report(new ModelScanProgress(string.Empty, string.Empty, filesScanned, discovered.Count, true));

        if (!string.IsNullOrWhiteSpace(indexOutputPath))
        {
            var dir = Path.GetDirectoryName(indexOutputPath);
            if (!string.IsNullOrEmpty(dir))
            {
                Directory.CreateDirectory(dir);
            }

            var tempPath = $"{indexOutputPath}.tmp";
            var json = JsonSerializer.Serialize(discovered, JsonOptions);
            await File.WriteAllTextAsync(tempPath, json, ct);
            File.Move(tempPath, indexOutputPath, overwrite: true);
        }

        return discovered;
    }

    public static DiscoveredModelEntry? ClassifyModelFile(FileInfo file)
    {
        var name = file.Name;
        var lower = name.ToLowerInvariant();
        var fullLower = file.FullName.ToLowerInvariant();
        var sizeMb = file.Length / (1024.0 * 1024.0);

        // 1. Cohere Transcribe GGUF (requires transcribe.cpp, NOT llama.cpp)
        if (lower.Contains("cohere-transcribe"))
        {
            return new DiscoveredModelEntry
            {
                Id = $"local-asr-{SanitizeId(name)}",
                FriendlyNameAr = lower.Contains("arabic") ? "نموذج النسخ العربي (Cohere Transcribe Arabic)" : "نموذج النسخ الصوتي (Cohere Transcribe)",
                FriendlyNameEn = lower.Contains("arabic") ? "Cohere Transcribe Arabic (GGUF)" : "Cohere Transcribe Speech-to-Text (GGUF)",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.SpeechToText,
                RequiredEngine = ModelRuntimeEngine.TranscribeCpp,
                SizeBytes = file.Length,
                EstimatedVramMb = (int)Math.Ceiling(sizeMb * 1.25),
                Quantization = ExtractQuantization(name),
                InPlaceLinked = true,
                CompatibilityWarning = "Requires transcribe.cpp runtime (not standard llama.cpp).",
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        // 2. Songwriting custom merged F16 export check (>12GB F16 guard on 16GB RTX 5000)
        if ((lower.Contains("songwriter") || lower.Contains("egyptian")) && lower.EndsWith(".gguf"))
        {
            var isOversizedF16 = (lower.Contains("f16") || lower.Contains("fp16")) && file.Length > 12L * 1024 * 1024 * 1024;
            return new DiscoveredModelEntry
            {
                Id = $"local-song-{SanitizeId(name)}",
                FriendlyNameAr = "نموذج كتابة الأغاني المصرية المخصص",
                FriendlyNameEn = "Custom Egyptian Songwriter LLM",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.SongwritingLlm,
                RequiredEngine = ModelRuntimeEngine.LlamaCpp,
                SizeBytes = file.Length,
                EstimatedVramMb = (int)Math.Ceiling(sizeMb * 1.15),
                Quantization = ExtractQuantization(name),
                InPlaceLinked = true,
                ExceedsSafe16GbVramBudget = isOversizedF16,
                CompatibilityWarning = isOversizedF16
                    ? "F16 checkpoint exceeds 16GB RTX 5000 safe VRAM budget. Convert to Q4_K_M or Q5_K_M before GPU loading."
                    : null,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        // 3. Qwen 3.5 / Qwen 3 / Qwen 2.5 Coder / general GGUF LLMs
        if (lower.EndsWith(".gguf"))
        {
            var isCoder = lower.Contains("coder") || lower.Contains("2.5-coder");
            var isOversized = file.Length > 13_500_000_000L;
            return new DiscoveredModelEntry
            {
                Id = $"local-llm-{SanitizeId(name)}",
                FriendlyNameAr = isCoder ? "نموذج الكود والتحليل التقني" : "نموذج المحادثة وكتابة الكلمات الذكي",
                FriendlyNameEn = isCoder ? "Code & Analysis Model (GGUF)" : "Assistant & Songwriting Model (GGUF)",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = isCoder ? ModelCapability.CodeAndAnalysisLlm : ModelCapability.AssistantLlm,
                RequiredEngine = ModelRuntimeEngine.LlamaCpp,
                SizeBytes = file.Length,
                EstimatedVramMb = (int)Math.Ceiling(sizeMb * 1.18),
                Quantization = ExtractQuantization(name),
                InPlaceLinked = true,
                ExceedsSafe16GbVramBudget = isOversized,
                CompatibilityWarning = isOversized
                    ? "Model footprint approaches or exceeds 16GB VRAM limit; use partial GPU offload or Q4_K_M quantization."
                    : null,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        // 4. Audio separation: BS-RoFormer & Demucs
        if (lower.Contains("roformer") || fullLower.Contains("roformer") || lower.Contains("mel_band"))
        {
            return new DiscoveredModelEntry
            {
                Id = $"local-sep-{SanitizeId(name)}",
                FriendlyNameAr = "محرك عزل الصوت الغنائي الفائق (BS-RoFormer)",
                FriendlyNameEn = "Vocal Isolation Engine (BS-RoFormer)",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.StemSeparation,
                RequiredEngine = ModelRuntimeEngine.PythonAudioSeparator,
                SizeBytes = file.Length,
                EstimatedVramMb = 3600,
                Quantization = "FP16 (SM75)",
                InPlaceLinked = true,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        if (lower.Contains("htdemucs") || fullLower.Contains("demucs"))
        {
            return new DiscoveredModelEntry
            {
                Id = $"local-demucs-{SanitizeId(name)}",
                FriendlyNameAr = "محرك فصل التراكات الستة (Demucs 6-Stems)",
                FriendlyNameEn = "6-Stem Music Separator (Demucs htdemucs_6s)",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.StemSeparation,
                RequiredEngine = ModelRuntimeEngine.PythonDemucs,
                SizeBytes = file.Length,
                EstimatedVramMb = 3200,
                Quantization = "FP16 (SM75)",
                InPlaceLinked = true,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        // 5. Voice Conversion (Seed-VC)
        if (lower.Contains("seed-vc") || fullLower.Contains("seed-vc") || fullLower.Contains("seed_vc"))
        {
            return new DiscoveredModelEntry
            {
                Id = $"local-vc-{SanitizeId(name)}",
                FriendlyNameAr = "محرك تحويل الصوت والغناء (Seed-VC)",
                FriendlyNameEn = "Voice & Singing Conversion (Seed-VC)",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.VoiceConversion,
                RequiredEngine = ModelRuntimeEngine.PythonSeedVc,
                SizeBytes = file.Length,
                EstimatedVramMb = 4400,
                Quantization = "FP16 (SM75)",
                InPlaceLinked = true,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        // 6. Egyptian TTS / Tashkeel / Qwen3-TTS / Silero VAD
        if (lower.Contains("tashkeel") || lower.Contains("voicetut") || lower.Contains("qwen3-tts") || fullLower.Contains("qwen3-tts"))
        {
            return new DiscoveredModelEntry
            {
                Id = $"local-tts-{SanitizeId(name)}",
                FriendlyNameAr = "محرك النطق المصري والتشكيل",
                FriendlyNameEn = "Egyptian Arabic Speech Synthesis",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.TextToSpeech,
                RequiredEngine = ModelRuntimeEngine.PythonTts,
                SizeBytes = file.Length,
                EstimatedVramMb = 2600,
                Quantization = "FP16 (SM75)",
                InPlaceLinked = true,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        if (lower.Contains("silero"))
        {
            return new DiscoveredModelEntry
            {
                Id = $"local-vad-{SanitizeId(name)}",
                FriendlyNameAr = "كاشف النشاط الصوتي (Silero VAD)",
                FriendlyNameEn = "Voice Activity Detector (Silero VAD)",
                TechnicalFileName = name,
                FullPath = file.FullName,
                Capability = ModelCapability.VoiceActivityDetection,
                RequiredEngine = ModelRuntimeEngine.OnnxRuntime,
                SizeBytes = file.Length,
                EstimatedVramMb = 128,
                Quantization = "ONNX",
                InPlaceLinked = true,
                DiscoveredAtUtc = DateTimeOffset.UtcNow
            };
        }

        return null;
    }

    private static string ExtractQuantization(string fileName)
    {
        var tokens = new[] { "Q4_K_M", "Q5_K_M", "Q6_K", "Q8_0", "Q4_0", "F16", "FP16", "BF16", "INT8" };
        foreach (var token in tokens)
        {
            if (fileName.Contains(token, StringComparison.OrdinalIgnoreCase))
            {
                return token;
            }
        }
        return "Unknown";
    }

    private static string SanitizeId(string input)
    {
        return new string(input.ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : '-').ToArray());
    }
}
