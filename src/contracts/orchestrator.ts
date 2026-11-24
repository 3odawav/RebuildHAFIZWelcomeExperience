export type OrchestratorState =
  | 'IDLE'
  | 'REQUESTED'
  | 'CHECK_RESOURCES'
  | 'QUEUED'
  | 'LOADING'
  | 'READY'
  | 'RUNNING'
  | 'IDLE_WARM'
  | 'UNLOADING'
  | 'RELEASED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RECOVERING'
  | 'EXTERNAL_GPU_BUSY'

export const ORCHESTRATOR_STATES: readonly OrchestratorState[] = [
  'IDLE',
  'REQUESTED',
  'CHECK_RESOURCES',
  'QUEUED',
  'LOADING',
  'READY',
  'RUNNING',
  'IDLE_WARM',
  'UNLOADING',
  'RELEASED',
  'FAILED',
  'CANCELLED',
  'RECOVERING',
  'EXTERNAL_GPU_BUSY',
] as const

export const VALID_TRANSITIONS: Record<OrchestratorState, readonly OrchestratorState[]> = {
  IDLE: ['REQUESTED'],
  REQUESTED: ['CHECK_RESOURCES', 'CANCELLED'],
  CHECK_RESOURCES: ['QUEUED', 'LOADING', 'READY', 'EXTERNAL_GPU_BUSY', 'FAILED', 'CANCELLED'],
  QUEUED: ['CHECK_RESOURCES', 'LOADING', 'CANCELLED', 'EXTERNAL_GPU_BUSY'],
  LOADING: ['READY', 'FAILED', 'CANCELLED'],
  READY: ['RUNNING', 'IDLE_WARM', 'UNLOADING'],
  RUNNING: ['IDLE_WARM', 'FAILED', 'CANCELLED', 'RECOVERING'],
  IDLE_WARM: ['RUNNING', 'UNLOADING', 'REQUESTED'],
  UNLOADING: ['RELEASED', 'FAILED'],
  RELEASED: ['IDLE', 'REQUESTED'],
  FAILED: ['RECOVERING', 'IDLE', 'RELEASED'],
  CANCELLED: ['IDLE', 'IDLE_WARM', 'RELEASED'],
  RECOVERING: ['IDLE', 'CHECK_RESOURCES', 'FAILED'],
  EXTERNAL_GPU_BUSY: ['QUEUED', 'CHECK_RESOURCES', 'CANCELLED', 'IDLE'],
}

export function canTransitionOrchestrator(from: OrchestratorState, to: OrchestratorState): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export interface TaskRoutingRule {
  id: string
  workspaceKey: string
  taskAr: string
  taskEn: string
  enginesAr: string
  enginesEn: string
  singleModelLock: boolean
  lazyInit: boolean
  reusesPrimaryLlm: boolean
}

export const TASK_ROUTING_TABLE: readonly TaskRoutingRule[] = [
  {
    id: 'route.conversation',
    workspaceKey: 'welcome',
    taskAr: 'محادثة عامة مع حافظ',
    taskEn: 'General conversation with HAFIZ',
    enginesAr: 'VAD + ASR + النموذج اللغوي الأساسي + TTS مصري',
    enginesEn: 'VAD + ASR + Primary LLM + Egyptian TTS',
    singleModelLock: false,
    lazyInit: false,
    reusesPrimaryLlm: true,
  },
  {
    id: 'route.lyrics',
    workspaceKey: 'studio/editor',
    taskAr: 'استوديو الكلمات والتشكيل والكتابة',
    taskEn: 'Lyrics Studio, Diacritics & Songwriting',
    enginesAr: 'النموذج اللغوي الأساسي + تشكيل ونطق مصري اختياري',
    enginesEn: 'Primary LLM + optional Egyptian Diacritics & Pronunciation',
    singleModelLock: false,
    lazyInit: false,
    reusesPrimaryLlm: true,
  },
  {
    id: 'route.transcription',
    workspaceKey: 'audio/analysis',
    taskAr: 'تفريغ الصوت بالعامية المصرية',
    taskEn: 'Egyptian Audio Transcription',
    enginesAr: 'VAD / ASR + تحسين نصي اختياري',
    enginesEn: 'VAD / ASR + optional text refinement',
    singleModelLock: false,
    lazyInit: true,
    reusesPrimaryLlm: true,
  },
  {
    id: 'route.music_analysis',
    workspaceKey: 'audio/analysis',
    taskAr: 'تحليل الموسيقى والملفات الصوتية',
    taskEn: 'Music & Audio Feature Analysis',
    enginesAr: 'استخراج الخصائص الصوتية + شرح اختياري بالنموذج اللغوي',
    enginesEn: 'Audio feature extraction + optional LLM explanation',
    singleModelLock: false,
    lazyInit: true,
    reusesPrimaryLlm: true,
  },
  {
    id: 'route.voice_clone',
    workspaceKey: 'voice_stems/clone',
    taskAr: 'استنساخ وتحويل الصوت والغناء',
    taskEn: 'Voice Cloning & Singing Conversion',
    enginesAr: 'محرك Seed-VC المتوافق + معالجة أولية اختيارية',
    enginesEn: 'Compatible Seed-VC runtime + optional preprocessing',
    singleModelLock: true,
    lazyInit: true,
    reusesPrimaryLlm: false,
  },
  {
    id: 'route.stems',
    workspaceKey: 'voice_stems/separation',
    taskAr: 'فصل التراكات الستة (6-Stems)',
    taskEn: 'Six-Stem Separation',
    enginesAr: 'BS-RoFormer و/أو Demucs (حجز حصري للذاكرة)',
    enginesEn: 'BS-RoFormer and/or Demucs (Single-Model Lock)',
    singleModelLock: true,
    lazyInit: true,
    reusesPrimaryLlm: false,
  },
  {
    id: 'route.settings_nav',
    workspaceKey: 'setup/general',
    taskAr: 'التنقل والإعدادات ومراقبة GPU',
    taskEn: 'Navigation, Settings & GPU Monitoring',
    enginesAr: 'فاحصات نظام خفيفة وحتمية — بدون تحميل نموذج لغوي كبير',
    enginesEn: 'Lightweight deterministic handlers & probes — no large LLM allocated',
    singleModelLock: false,
    lazyInit: false,
    reusesPrimaryLlm: false,
  },
]

export function resolveRequiredRoutingRule(route: string): TaskRoutingRule {
  if (route === 'welcome' || route === 'conversation') return TASK_ROUTING_TABLE[0]
  if (route.startsWith('studio/')) return TASK_ROUTING_TABLE[1]
  if (route === 'audio/analysis' || route === 'audio/web') return TASK_ROUTING_TABLE[2]
  if (route === 'voice_stems/clone') return TASK_ROUTING_TABLE[4]
  if (route === 'voice_stems/separation') return TASK_ROUTING_TABLE[5]
  return TASK_ROUTING_TABLE[6]
}

export interface ModelCatalogEntry {
  id: string
  friendlyAr: string
  friendlyEn: string
  roleSummaryAr: string
  roleSummaryEn: string
  repo: string
  modelIdentifier: string
  pinnedRevision: string
  license: string
  architecture: string
  quantization: string
  runtime: string
  turingCompatAr: string
  turingCompatEn: string
  relativePath: string
  singleModelLock: boolean
  loadState: OrchestratorState
}

export const MODEL_CATALOG: readonly ModelCatalogEntry[] = [
  {
    id: 'primary-llm',
    friendlyAr: 'العقل الأساسي والكتابة بالعامية المصرية',
    friendlyEn: 'Primary Reasoning & Egyptian Songwriting LLM',
    roleSummaryAr: 'نموذج لغوي واحد مشترك للمحادثة، التشكيل، القوافي، وكتابة الأغاني.',
    roleSummaryEn: 'Shared primary LLM for conversation, diacritics, rhymes, and Egyptian songwriting.',
    repo: 'huggingface.co/Qwen/Qwen2.5-14B-Instruct-GGUF',
    modelIdentifier: 'qwen2.5-14b-instruct-q4_k_m.gguf',
    pinnedRevision: 'pinned-by-manifest',
    license: 'Apache-2.0',
    architecture: 'Transformer Decoder (GGUF)',
    quantization: 'GGUF Q4_K_M / FP16 KV (No BF16 required)',
    runtime: 'llama.cpp (Router Mode · CUDA SM 7.5)',
    turingCompatAr: 'متوافق مع RTX 5000 (Turing 7.5) · GGUF / FP16',
    turingCompatEn: 'Validated for RTX 5000 (Turing 7.5) · GGUF / FP16',
    relativePath: 'llm\\qwen2.5-14b-instruct-q4_k_m.gguf',
    singleModelLock: false,
    loadState: 'IDLE',
  },
  {
    id: 'egyptian-asr',
    friendlyAr: 'التعرف على الكلام بالعامية المصرية',
    friendlyEn: 'Egyptian Arabic Speech Recognition (ASR)',
    roleSummaryAr: 'تفريغ فوري للكلام المصري مع دعم خلط العربي والإنجليزي.',
    roleSummaryEn: 'Streaming Egyptian Arabic transcription with English code-switching.',
    repo: 'huggingface.co/Systran/faster-whisper-large-v3',
    modelIdentifier: 'faster-whisper-large-v3-ct2',
    pinnedRevision: 'pinned-by-manifest',
    license: 'MIT',
    architecture: 'Whisper Encoder-Decoder (CTranslate2)',
    quantization: 'FP16 / INT8_FLOAT16',
    runtime: 'faster-whisper + Silero VAD',
    turingCompatAr: 'متوافق مع Turing 7.5 · FP16 / INT8',
    turingCompatEn: 'Validated for Turing 7.5 · FP16 / INT8',
    relativePath: 'asr\\faster-whisper-large-v3',
    singleModelLock: false,
    loadState: 'IDLE',
  },
  {
    id: 'egyptian-tts',
    friendlyAr: 'توليد الصوت المصري الطبيعي (حافظ)',
    friendlyEn: 'Natural Egyptian Arabic Voice Synthesis (TTS)',
    roleSummaryAr: 'توليد صوت حافظ بالعامية المصرية بنطق طبيعي وبث مجزأ منخفض التأخير.',
    roleSummaryEn: 'Low-latency chunked Egyptian Arabic speech synthesis preserving HAFIZ voice identity.',
    repo: 'huggingface.co/coqui/XTTS-v2 (or validated local Egyptian TTS)',
    modelIdentifier: 'hafiz-egyptian-tts-fp16',
    pinnedRevision: 'pinned-by-manifest',
    license: 'CPML / Verified Local License',
    architecture: 'Neural Acoustic + Vocoder',
    quantization: 'FP16 (Turing Tensor Cores)',
    runtime: 'Isolated Python Worker (PyTorch CUDA verified)',
    turingCompatAr: 'متوافق مع Turing 7.5 · FP16 بدون BF16',
    turingCompatEn: 'Validated for Turing 7.5 · FP16 (no BF16)',
    relativePath: 'tts\\hafiz-egyptian-tts',
    singleModelLock: false,
    loadState: 'IDLE',
  },
  {
    id: 'voice-clone',
    friendlyAr: 'استنساخ الصوت وتحويل الغناء',
    friendlyEn: 'Voice Cloning & Singing Conversion',
    roleSummaryAr: 'تحويل الكلام والغناء بالعينات المصرّح بها مع قفل الذاكرة الأحادي.',
    roleSummaryEn: 'Authorized speech & singing conversion with Single-Model VRAM Lock.',
    repo: 'huggingface.co/Plachta/Seed-VC',
    modelIdentifier: 'seed-vc-singing-v1 / speech-v2',
    pinnedRevision: 'pinned-by-manifest',
    license: 'GPL-3.0 / Verified Repo License',
    architecture: 'Diffusion Voice Conversion (Seed-VC)',
    quantization: 'FP16 (Lazy Load · Single-Model Lock)',
    runtime: 'Isolated Python Worker (PyTorch + TorchAudio paired)',
    turingCompatAr: 'تهيئة كسولة · يُفرّغ نماذج حافظ الخاملة أولًا',
    turingCompatEn: 'Lazy init · releases idle HAFIZ models first',
    relativePath: 'voice\\seed-vc',
    singleModelLock: true,
    loadState: 'IDLE',
  },
  {
    id: 'vocal-separation',
    friendlyAr: 'عزل الصوت البشري عالي النقاء',
    friendlyEn: 'Studio Vocal Isolation (BS-RoFormer)',
    roleSummaryAr: 'عزل الفوكال عن المزيكا بدقة استوديو.',
    roleSummaryEn: 'High-precision studio vocal vs. instrumental separation.',
    repo: 'huggingface.co/pcunwa/BS-RoFormer-Revive',
    modelIdentifier: 'bs_roformer_2stems.ckpt',
    pinnedRevision: 'pinned-by-manifest',
    license: 'MIT',
    architecture: 'Band-Split RoFormer',
    quantization: 'FP16 (Lazy Load · Single-Model Lock)',
    runtime: 'Audio Processing Worker (PyTorch CUDA)',
    turingCompatAr: 'متوافق مع Turing 7.5 · FP16 · قفل ذاكرة أحادي',
    turingCompatEn: 'Validated for Turing 7.5 · FP16 · Single-Model Lock',
    relativePath: 'stems\\bs_roformer',
    singleModelLock: true,
    loadState: 'IDLE',
  },
  {
    id: 'six-stems',
    friendlyAr: 'فصل التراكات الستة الكامل',
    friendlyEn: 'Six-Stem Musical Separation (Demucs)',
    roleSummaryAr: 'فصل الفوكال والدرامز والبيز والجيتار والبيانو وباقي الآلات.',
    roleSummaryEn: 'Separates vocals, drums, bass, guitar, piano, and other stems.',
    repo: 'huggingface.co/facebook/htdemucs_6s',
    modelIdentifier: 'htdemucs_6s.th',
    pinnedRevision: 'pinned-by-manifest',
    license: 'MIT',
    architecture: 'Hybrid Transformer Demucs (6-Stem)',
    quantization: 'FP16 / FP32 fallback (Single-Model Lock)',
    runtime: 'Audio Processing Worker (TorchAudio + FFmpeg)',
    turingCompatAr: 'متوافق مع Turing 7.5 · تهيئة كسولة',
    turingCompatEn: 'Validated for Turing 7.5 · Lazy init',
    relativePath: 'stems\\htdemucs_6s',
    singleModelLock: true,
    loadState: 'IDLE',
  },
]

export interface ActionContract {
  id: string
  labelAr: string
  labelEn: string
  expectedActionAr: string
  expectedActionEn: string
  endpoint: string
  requiredService: string
  inputSchema: string
  outputSchema: string
  loadingPolicy: string
  cancellationPolicy: string
  errorRetryPolicy: string
  persistentConfig: string
  verificationCriteria: string
}

export const ACTION_CONTRACTS: readonly ActionContract[] = [
  {
    id: 'hafiz.voice.toggle_mic',
    labelAr: 'تشغيل / إيقاف الميكروفون',
    labelEn: 'Toggle Microphone & VAD Capture',
    expectedActionAr: 'التقاط الصوت الفعلي وتمريره لـ VAD و ASR مع مقاطعة كلام حافظ فورًا.',
    expectedActionEn: 'Capture real microphone audio into VAD + ASR and immediately barge-in active speech.',
    endpoint: 'IPC pipe://hafiz-orchestrator -> voice.capture.toggle',
    requiredService: 'Audio Capture + Silero VAD + Egyptian ASR',
    inputSchema: '{ mode: "push_to_talk" | "continuous", voiceLang: "ar-EG" | "en-US" }',
    outputSchema: '{ capturing: boolean, rmsDb: number, partialTranscript?: string }',
    loadingPolicy: 'Instant local device open; button shows aria-pressed & live levels.',
    cancellationPolicy: 'Immediate track stop & stream close on second click or barge-in.',
    errorRetryPolicy: 'Surface exact audio device / permission error with one-click retry.',
    persistentConfig: 'hafiz-mic-mode, hafiz-voice-lang',
    verificationCriteria: 'Real mic permission prompt, level meter response, clean stream release.',
  },
  {
    id: 'hafiz.orchestrator.command',
    labelAr: 'إرسال أمر أو سؤال لحافظ',
    labelEn: 'Submit Conversational Command / Prompt',
    expectedActionAr: 'توجيه حتمي خفيف لأوامر التنقل، أو توجيه للنموذج اللغوي الأساسي للأسئلة الإبداعية.',
    expectedActionEn: 'Deterministic routing for navigation/settings; shared primary LLM for creative prompts.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/orchestrator/route',
    requiredService: 'Task/Intent Router (+ Primary LLM only when needed)',
    inputSchema: '{ text: string, activeRoute: string, voiceLang: "ar-EG" | "en-US" }',
    outputSchema: '{ state: OrchestratorState, targetRoute?: string, replyText: string, ttsStreamId?: string }',
    loadingPolicy: 'Transitions avatar IDLE -> THINKING -> SPEAKING without blocking typing.',
    cancellationPolicy: 'AbortController cancels in-flight generation and stops TTS immediately.',
    errorRetryPolicy: 'Return truthful offline/OOM error with retry button; never fabricate text.',
    persistentConfig: 'None (stateless command routing)',
    verificationCriteria: 'Arabic & English navigation intents resolve in <50ms without LLM reload.',
  },
  {
    id: 'hafiz.gpu.purge_vram',
    labelAr: 'تفريغ ذاكرة كارت الشاشة الآن',
    labelEn: 'Purge VRAM Now (HAFIZ-Owned Only)',
    expectedActionAr: 'إطلاق نماذج حافظ الخاملة فقط وإعادة تدوير عمّال حافظ وقراءة VRAM الفعلية.',
    expectedActionEn: 'Release idle HAFIZ-owned model references, recycle HAFIZ workers, re-read actual VRAM.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/gpu/purge-hafiz',
    requiredService: 'GPU Memory Guard + Inference Worker Manager',
    inputSchema: '{ forceCancelIdleHafizJobs: boolean }',
    outputSchema: '{ unloadedModels: string[], vramBeforeMb: number, vramAfterMb: number, externalProcessesTouched: 0 }',
    loadingPolicy: 'Disable button during UNLOADING -> RELEASED; display real before/after delta.',
    cancellationPolicy: 'Non-destructive; waits for safe checkpoint before recycling worker.',
    errorRetryPolicy: 'If EXTERNAL_GPU_BUSY or active job running, refuse safely and report reason.',
    persistentConfig: 'None',
    verificationCriteria: 'Verified on RTX 5000: frees HAFIZ VRAM while external Unsloth/LM Studio remains intact.',
  },
  {
    id: 'hafiz.models.scan_local',
    labelAr: 'فحص مكتبات النماذج المحلية',
    labelEn: 'Scan Local Model Libraries',
    expectedActionAr: 'اكتشاف الأوزان المحلية المتوافقة في المجلد المختار بدون إعادة تحميل مكرر.',
    expectedActionEn: 'Discover existing compatible weights in user-selected paths without duplicating files.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/models/scan',
    requiredService: 'Model Registry + Integrity Verifier',
    inputSchema: '{ directories: string[], verifySha256: boolean }',
    outputSchema: '{ discovered: ModelEntry[], missing: string[], incompatible: string[] }',
    loadingPolicy: 'Asynchronous background job; UI remains responsive.',
    cancellationPolicy: 'Cancellable scan token; preserves partial discovery cache.',
    errorRetryPolicy: 'Reports unreadable paths or hash mismatches without deleting user files.',
    persistentConfig: 'hafiz-model-dir',
    verificationCriteria: 'Detects pre-existing GGUF/Whisper/Demucs files and skips re-downloading.',
  },
  {
    id: 'hafiz.stems.separate',
    labelAr: 'فصل التراكات الستة (6-Stems)',
    labelEn: 'Run Six-Stem Separation (BS-RoFormer / Demucs)',
    expectedActionAr: 'التحقق من VRAM الحرة، تفعيل Single-Model Lock، وتشغيل فصل التراكات محليًا.',
    expectedActionEn: 'Check real free VRAM, acquire Single-Model Lock, and separate stems locally.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/audio/stems',
    requiredService: 'GPU Memory Guard + BS-RoFormer / Demucs Worker',
    inputSchema: '{ sourcePath: string, mode: "hybrid_6stems" | "bs_roformer_2stems" | "demucs_6s_fast" }',
    outputSchema: '{ jobId: string, state: OrchestratorState, stemFiles?: Record<string, string> }',
    loadingPolicy: 'Shows QUEUED -> CHECK_RESOURCES -> LOADING -> RUNNING progress.',
    cancellationPolicy: 'Graceful worker termination + HAFIZ VRAM release on cancel.',
    errorRetryPolicy: 'Defers on EXTERNAL_GPU_BUSY; recovers cleanly from CUDA OOM.',
    persistentConfig: 'hafiz-single-model-lock, hafiz-vram-margin',
    verificationCriteria: 'Produces verified WAV stems on RTX 5000 within 16 GB VRAM budget.',
  },
  {
    id: 'hafiz.diagnostics.export',
    labelAr: 'تصدير تقرير التشخيص (JSON)',
    labelEn: 'Export Diagnostic Report (JSON)',
    expectedActionAr: 'توليد ملف JSON منظم بحالة البيئة والإعدادات ومصفوفة التحقق الفعلية.',
    expectedActionEn: 'Export structured JSON containing configuration, contracts, and truthful test matrix.',
    endpoint: 'Local Browser Download / GET http://127.0.0.1:4891/api/v1/diagnostics/report',
    requiredService: 'Diagnostics & Recovery Manager',
    inputSchema: '{ includeContracts: boolean, includeVerificationMatrix: boolean }',
    outputSchema: 'application/json (HAFIZ-diagnostic-report.json)',
    loadingPolicy: 'Immediate client-side export in web preview; full hardware dump when companion connected.',
    cancellationPolicy: 'Synchronous download trigger.',
    errorRetryPolicy: 'Shows clear notice if filesystem export fails.',
    persistentConfig: 'None (read-only export)',
    verificationCriteria: 'Valid JSON file downloads cleanly with zero fabricated GPU values.',
  },
  {
    id: 'hafiz.runtime.check_updates',
    labelAr: 'التحقق من التحديثات',
    labelEn: 'Check for Updates',
    expectedActionAr: 'فحص غير متزامن للتحديثات المتاحة وعرضها فقط، بدون تثبيت أي إصدار غير متوافق تلقائيًا.',
    expectedActionEn: 'Asynchronously list available updates; never auto-install incompatible versions.',
    endpoint: 'GET http://127.0.0.1:4891/api/v1/runtime/updates',
    requiredService: 'Diagnostics & Recovery Manager + Runtime Manifest',
    inputSchema: '{ channel: "stable", includeModels: boolean }',
    outputSchema: '{ available: { component: string, current: string, candidate: string, compatible: boolean }[] }',
    loadingPolicy: 'Background request; startup and UI never blocked; works offline with "no connection" result.',
    cancellationPolicy: 'AbortController cancels the request; no partial state written.',
    errorRetryPolicy: 'Offline or registry errors reported verbatim with retry.',
    persistentConfig: 'hafiz-last-update-check',
    verificationCriteria: 'No dependency (CUDA, Torch, FFmpeg) changes without explicit user approval.',
  },
  {
    id: 'hafiz.runtime.repair',
    labelAr: 'إصلاح بيئة التشغيل',
    labelEn: 'Repair Runtime',
    expectedActionAr: 'مقارنة البيئة الحالية بملف الإصدارات المستقرة وإعادة تثبيت المكونات التالفة فقط بعد موافقة المستخدم.',
    expectedActionEn: 'Diff runtime against the Known-Good manifest and reinstall only broken components after approval.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/runtime/repair',
    requiredService: 'Diagnostics & Recovery Manager',
    inputSchema: '{ dryRun: boolean, approvedComponents: string[] }',
    outputSchema: '{ plan: RepairStep[], applied: string[], failed: { component: string, error: string }[] }',
    loadingPolicy: 'Dry-run plan shown first; apply step shows per-component progress.',
    cancellationPolicy: 'Cancellable between components; never leaves a half-replaced package.',
    errorRetryPolicy: 'Auto-rollback to Known-Good on failure; exact error surfaced.',
    persistentConfig: 'runtime-manifest.lock.json',
    verificationCriteria: 'Corrupted worker venv repaired on target workstation without touching global Python.',
  },
  {
    id: 'hafiz.runtime.verify_cuda',
    labelAr: 'فحص CUDA والتوافق',
    labelEn: 'Verify CUDA',
    expectedActionAr: 'التحقق الفعلي من قدرة الكارت (SM 7.5)، والتعريف، وتوافق PyTorch/TorchAudio، بدون الاعتماد على nvidia-smi فقط.',
    expectedActionEn: 'Verify real device capability (SM 7.5), driver, and PyTorch/TorchAudio kernels — not nvidia-smi alone.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/runtime/verify-cuda',
    requiredService: 'Capability & Hardware Detector + Model Compatibility Validator',
    inputSchema: '{ runKernelSmokeTest: boolean }',
    outputSchema: '{ device: string, computeCapability: string, driver: string, torch: string, fp16: boolean, bf16Native: boolean, issues: string[] }',
    loadingPolicy: 'Lightweight probe in isolated worker; never loads a large LLM.',
    cancellationPolicy: 'Worker terminated on cancel; no GPU state left allocated.',
    errorRetryPolicy: 'Incompatible wheels reported with the known-good version to restore.',
    persistentConfig: 'hafiz-hardware-cache',
    verificationCriteria: 'Reports Turing 7.5, FP16 OK, BF16 native false on RTX 5000.',
  },
  {
    id: 'hafiz.diagnostics.run',
    labelAr: 'تشغيل التشخيص الشامل',
    labelEn: 'Run Diagnostics',
    expectedActionAr: 'تشغيل مصفوفة التحقق (صوت، نماذج، VRAM، عمّال) وتسجيل النتائج PASS / FAIL / BLOCKED / NOT TESTED فقط.',
    expectedActionEn: 'Execute the verification matrix and record only PASS / FAIL / BLOCKED / NOT TESTED results.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/diagnostics/run',
    requiredService: 'Diagnostics & Recovery Manager',
    inputSchema: '{ suites: ("audio" | "models" | "gpu" | "workers" | "ui")[] }',
    outputSchema: '{ results: { id: string, status: "PASS" | "FAIL" | "BLOCKED" | "NOT TESTED", evidence?: string }[] }',
    loadingPolicy: 'Background job with per-suite progress; UI stays interactive.',
    cancellationPolicy: 'Remaining suites marked NOT TESTED on cancel.',
    errorRetryPolicy: 'Suite crash recorded as FAIL with stack trace; never hidden.',
    persistentConfig: 'hafiz-last-diagnostics',
    verificationCriteria: 'No result marked PASS without captured evidence.',
  },
  {
    id: 'hafiz.runtime.restore_known_good',
    labelAr: 'استعادة البيئة المستقرة',
    labelEn: 'Restore Known-Good Runtime',
    expectedActionAr: 'إرجاع عمّال حافظ للإصدارات المثبتة في ملف الإصدارات المستقرة بعد تفريغ نماذج حافظ بأمان.',
    expectedActionEn: 'Roll HAFIZ workers back to the pinned Known-Good manifest after safely unloading HAFIZ models.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/runtime/restore-known-good',
    requiredService: 'Diagnostics & Recovery Manager + Inference Worker Manager',
    inputSchema: '{ manifestId: string, confirm: true }',
    outputSchema: '{ restored: string[], manifestId: string, restartRequired: boolean }',
    loadingPolicy: 'Requires explicit confirmation dialog; disabled while any HAFIZ job is RUNNING.',
    cancellationPolicy: 'Cancellable before swap; swap step is atomic.',
    errorRetryPolicy: 'Previous environment kept until new one validates.',
    persistentConfig: 'runtime-manifest.lock.json',
    verificationCriteria: 'Restored workers pass Verify CUDA and load the primary LLM.',
  },
  {
    id: 'hafiz.models.continue_downloads',
    labelAr: 'متابعة التحميلات',
    labelEn: 'Continue Downloads',
    expectedActionAr: 'استكمال تحميل النماذج الناقصة المعتمدة فقط من مصادرها الرسمية مع تثبيت المراجعة والتحقق من السلامة.',
    expectedActionEn: 'Resume approved missing model downloads from official sources with pinned revisions and integrity checks.',
    endpoint: 'POST http://127.0.0.1:4891/api/v1/models/downloads/resume',
    requiredService: 'Model Registry + Download Manager + Integrity Verifier',
    inputSchema: '{ modelIds: string[], targetDir: string }',
    outputSchema: '{ jobs: { modelId: string, bytesDone: number, bytesTotal: number, sha256Ok?: boolean }[] }',
    loadingPolicy: 'Resumable HTTP ranges; real byte progress only.',
    cancellationPolicy: 'Pause keeps partial file for later resume.',
    errorRetryPolicy: 'Hash mismatch quarantines file; never executes repository code.',
    persistentConfig: 'hafiz-model-dir, hafiz-download-queue',
    verificationCriteria: 'Existing weights detected and skipped; SHA-256 verified before READY.',
  },
]

export const HEALTH_ACTION_CONTRACT_IDS = {
  checkUpdates: 'hafiz.runtime.check_updates',
  repairRuntime: 'hafiz.runtime.repair',
  verifyCuda: 'hafiz.runtime.verify_cuda',
  runDiagnostics: 'hafiz.diagnostics.run',
  restoreKnownGood: 'hafiz.runtime.restore_known_good',
  continueDownloads: 'hafiz.models.continue_downloads',
} as const

export interface LatencyStageSpec {
  id: string
  stageAr: string
  stageEn: string
  targetBudget: string
  measured: string
  status: 'NOT TESTED' | 'PASS' | 'FAIL' | 'BLOCKED'
}

export const VOICE_LATENCY_STAGES: readonly LatencyStageSpec[] = [
  { id: 'mic', stageAr: 'التقاط الميكروفون (Mic Capture)', stageEn: 'Time to Microphone Capture', targetBudget: '< 120 ms', measured: '—', status: 'NOT TESTED' },
  { id: 'vad', stageAr: 'كشف نهاية الكلام (End-of-Speech VAD)', stageEn: 'End-of-Speech VAD Latency', targetBudget: '< 450 ms', measured: '—', status: 'NOT TESTED' },
  { id: 'asr', stageAr: 'إتمام التفريغ المصري (ASR Finalization)', stageEn: 'Egyptian ASR Finalization', targetBudget: '< 1.8 s', measured: '—', status: 'NOT TESTED' },
  { id: 'route', stageAr: 'توجيه النية والقرار (Intent Routing)', stageEn: 'Task / Intent Routing Latency', targetBudget: '< 50 ms', measured: '—', status: 'NOT TESTED' },
  { id: 'llm_ttft', stageAr: 'أول رمز من النموذج اللغوي (LLM TTFT)', stageEn: 'LLM Time to First Token (TTFT)', targetBudget: '< 2.5 s', measured: '—', status: 'NOT TESTED' },
  { id: 'tts_first', stageAr: 'أول مقطع صوتي مصري (TTS First Audio)', stageEn: 'Egyptian TTS Time to First Audio', targetBudget: '< 1.8 s', measured: '—', status: 'NOT TESTED' },
  { id: 'first_audible', stageAr: 'إجمالي الزمن حتى أول صوت مسموع (P95)', stageEn: 'Total Time to First Audible Response (P95)', targetBudget: '≤ 15.0 s (warm)', measured: '—', status: 'NOT TESTED' },
  { id: 'complete', stageAr: 'إجمالي الزمن حتى اكتمال الرد', stageEn: 'Total Time to Complete Response', targetBudget: 'Measured per length', measured: '—', status: 'NOT TESTED' },
]

export interface VerificationItem {
  id: string
  checkAr: string
  checkEn: string
  scope: 'web-preview' | 'windows-native'
  status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT TESTED'
  noteAr: string
  noteEn: string
}

export const VERIFICATION_MATRIX: readonly VerificationItem[] = [
  { id: 'v1', checkAr: 'ترجمة 100% للواجهة (العربية ar-EG / الإنجليزية en-US)', checkEn: 'Complete UI localization (ar-EG / en-US)', scope: 'web-preview', status: 'PASS', noteAr: 'مفحوص باختبارات الوحدة والتبديل الحي', noteEn: 'Verified via unit tests & live switching' },
  { id: 'v2', checkAr: 'تخطيط RTL و LTR الصحيح وحماية المسارات التقنية بـ LTR', checkEn: 'RTL & LTR layout rules + LTR-protected technical IDs', scope: 'web-preview', status: 'PASS', noteAr: 'مفحوص على سطح المكتب والموبايل', noteEn: 'Verified on desktop & mobile viewports' },
  { id: 'v3', checkAr: 'مقياس الخطوط واستجابة النافذة بدون قصّ أو تمرير أفقي', checkEn: 'Font scaling & responsive layout without clipping/overflow', scope: 'web-preview', status: 'PASS', noteAr: 'مفحوص عند 1440×900 و 390×844 ومقياس 100–150%', noteEn: 'Verified at 1440×900, 390×844 & 100–150% scale' },
  { id: 'v4', checkAr: 'استعادة حالة التطبيق والإعدادات بعد إعادة التشغيل', checkEn: 'Restored application state & preferences after restart', scope: 'web-preview', status: 'PASS', noteAr: 'اللغة، لغة الصوت، المسودات، وموضع المساعد محفوظة محليًا', noteEn: 'Language, voice lang, drafts & dock side persisted' },
  { id: 'v5', checkAr: 'الإقلاع البارد والدافئ على ويندوز 11 (WinUI 3)', checkEn: 'Cold & warm native Windows 11 startup (WinUI 3)', scope: 'windows-native', status: 'BLOCKED', noteAr: 'يتطلب بناء WinUI 3 على جهاز ويندوز 11 فعلي', noteEn: 'Requires WinUI 3 build on target Windows 11 host' },
  { id: 'v6', checkAr: 'التقاط الميكروفون الفعلي و VAD على ويندوز', checkEn: 'Real Windows microphone capture & VAD latency', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'بانتظار اختبار الميكروفون على محطة ويندوز', noteEn: 'Pending real mic benchmark on Windows workstation' },
  { id: 'v7', checkAr: 'مخرجات التعرف على العامية المصرية (Egyptian ASR)', checkEn: 'Egyptian Arabic ASR accuracy & latency', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'يتطلب محرك faster-whisper المحلي', noteEn: 'Requires local faster-whisper worker' },
  { id: 'v8', checkAr: 'مخرجات الصوت المصري الطبيعي (Egyptian TTS)', checkEn: 'Natural Egyptian TTS voice output & streaming', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'يتطلب محرك TTS المصري المحلي', noteEn: 'Requires local Egyptian TTS worker' },
  { id: 'v9', checkAr: 'توليد LLM المحلي وتوجيه الأدوات (RTX 5000 · Turing 7.5)', checkEn: 'Local LLM generation & tool routing (RTX 5000 · SM 7.5)', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'يتطلب llama.cpp Router Mode المحلي', noteEn: 'Requires local llama.cpp Router Mode' },
  { id: 'v10', checkAr: 'استرداد VRAM الحقيقي بعد التفريغ (Purge VRAM Now)', checkEn: 'Real VRAM recovery after HAFIZ-only unload', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'يتطلب قياس NVML الحقيقي على RTX 5000', noteEn: 'Requires real NVML measurement on RTX 5000' },
  { id: 'v11', checkAr: 'حماية عمليات GPU الخارجية (Unsloth / LM Studio / ComfyUI)', checkEn: 'External GPU workload detection & zero interruption', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'يتطلب اختبار تنافس GPU حقيقي على ويندوز', noteEn: 'Requires real concurrent GPU test on Windows' },
  { id: 'v12', checkAr: 'إلغاء مهام الصوت والفصل بدون تسريب عمليات خفية', checkEn: 'Audio task cancellation & zero background process leaks', scope: 'windows-native', status: 'NOT TESTED', noteAr: 'يتطلب اختبار عمّال Python المعزولين', noteEn: 'Requires isolated Python worker test' },
  { id: 'v13', checkAr: 'إصلاح وإزالة المثبّت (Installer Repair & Uninstall)', checkEn: 'Windows installer, repair & clean uninstall behavior', scope: 'windows-native', status: 'BLOCKED', noteAr: 'يتطلب حزمة تثبيت ويندوز مترجمة', noteEn: 'Requires compiled Windows installer build' },
]

export const TARGET_HARDWARE_SPEC = {
  os: 'Windows 11 x64',
  gpu: 'NVIDIA Quadro RTX 5000',
  vram: '16 GB GDDR6',
  architecture: 'NVIDIA Turing (Compute Capability 7.5)',
  ram: '64 GB System RAM',
  precision: 'Validated FP16 · INT8 · GGUF (No native BF16 required)',
} as const
