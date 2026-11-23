export type UiLanguage = 'ar' | 'en'
export type VoiceLanguage = 'ar-EG' | 'en-US'

export interface AppTranslations {
  langCode: 'ar-EG' | 'en-US'
  dir: 'rtl' | 'ltr'
  // Header & Navigation
  homeAria: string
  enterWorkspace: string
  switchLangLabel: string
  openSettingsAria: string
  navLyricsStudio: string
  navAudioWeb: string
  navVoiceStems: string
  navSettings: string
  navProjects: string
  navDownloads: string
  navModels: string
  navHub: string
  // Screen titles
  screenTitles: Record<string, string>
  groupLabels: Record<string, string>
  // Startup Stage
  startupRegionAria: string
  startupGreeting: string
  statusReady: string
  statusThinking: string
  statusListening: string
  statusSpeaking: string
  micStartAria: string
  micStopAria: string
  commandInputAria: string
  commandPlaceholder: string
  voicePlayLabel: string
  voiceStopLabel: string
  voicePlayAria: string
  voiceStopAria: string
  sendCommandAria: string
  quickCommandsAria: string
  quickChips: { label: string; cmd: string }[]
  // Floating Assistant
  floatingAsideAria: string
  floatingDialogAria: string
  floatingFullStage: string
  floatingMinimizeAria: string
  floatingDefaultReply: string
  floatingAskAria: string
  floatingAskPlaceholder: string
  floatingSendAria: string
  floatingMoveLeftAria: string
  floatingMoveRightAria: string
  floatingMoveLeftTitle: string
  floatingMoveRightTitle: string
  floatingMic: string
  floatingStop: string
  floatingSpeak: string
  floatingMute: string
  floatingAskBtn: string
  floatingHideBtn: string
  floatingReady: string
  floatingQuickChips: { label: string; cmd: string }[]
  // Lyrics Studio
  saveDraft: string
  openTxt: string
  openTxtAria: string
  exportTxt: string
  copyText: string
  readText: string
  clearText: string
  genreLabel: string
  moodLabel: string
  moodPlaceholder: string
  arrangementLabel: string
  arrangementPlaceholder: string
  addressSelectAria: string
  addressOptions: [string, string, string]
  stripDiacriticsLocal: string
  writingSpaceSong: string
  writingSpaceRhymes: string
  writingSpaceDefault: string
  undo: string
  redo: string
  editorAria: string
  editorPlaceholder: string
  editorFooterInfo: string
  wordsLabel: string
  charsLabel: string
  aiActions: Record<string, string>
  // Audio, Web, Voice & Stems
  uploadSourceAudio: string
  uploadReferenceVoice: string
  uploadHint: string
  youtubeUrlLabel: string
  youtubePlaceholder: string
  youtubeNote: string
  processingModeLabel: string
  pitchShiftLabel: string
  pitchShiftRange: string
  startProcessing: string
  noProcessedAudio: string
  sourceUrlLabel: string
  sourceUrlPlaceholder: string
  researchQueryLabel: string
  researchQueryPlaceholder: string
  webAgentOffline: string
  decodingWaveform: string
  waveformUnsupported: string
  // Projects
  searchProjectsAria: string
  searchProjectsPlaceholder: string
  projectsEmptyTitle: string
  projectsEmptyDesc: string
  createFirstProject: string
  projectOpen: string
  projectRename: string
  projectDuplicate: string
  projectExport: string
  projectDelete: string
  projectRenamePrompt: string
  projectDeleteConfirm: string
  projectCopySuffix: string
  // Model Manager & Downloads
  modelsIntroTitle: string
  modelsIntroSubtitle: string
  showTechnicalDetails: string
  hideTechnicalDetails: string
  openFirstRunWizard: string
  storageDirLabel: string
  storageDirHint: string
  useExistingModels: string
  scanModelLibraries: string
  downloadMissing: string
  continueDownloads: string
  verifyInstallation: string
  connectCompanion: string
  downloadsEmptyTitle: string
  downloadsEmptyDesc: string
  modelStatusOffline: string
  modelRepoLabel: string
  modelRevisionLabel: string
  modelLicenseLabel: string
  modelQuantLabel: string
  modelRuntimeLabel: string
  modelCompatLabel: string
  modelPathLabel: string
  modelIntegrityLabel: string
  modelLoadStateLabel: string
  modelVramStateLabel: string
  modelDiscoverAction: string
  modelVerifyAction: string
  // Settings Center Categories (13)
  settingsTabs: {
    general: string
    assistant: string
    speechPipeline: string
    orchestrator: string
    gpuGuard: string
    modelsCompat: string
    downloadsStorage: string
    audio: string
    memoryProfiles: string
    updatesHealth: string
    securityPrivacy: string
    diagnostics: string
    about: string
  }
  // Settings Content
  interfaceLanguageLabel: string
  voiceLanguageLabel: string
  voiceLanguageDesc: string
  uiScaleLabel: string
  uiScaleDesc: string
  assistantDockLabel: string
  dockRight: string
  dockLeft: string
  browserSpeechToggle: string
  bargeInToggle: string
  bargeInDesc: string
  micModeLabel: string
  micModePtt: string
  micModeContinuous: string
  testMicBtn: string
  stopMicBtn: string
  pipelineTitle: string
  latencyTargetTitle: string
  latencyTargetDesc: string
  latencyCols: { stage: string; budget: string; measured: string; status: string }
  orchestratorStateTitle: string
  orchestratorRoutingTitle: string
  idleTimeoutLabel: string
  idleTimeoutDesc: string
  routerModeToggle: string
  routerModeDesc: string
  lazyInitNote: string
  gpuProfileTitle: string
  gpuLiveTelemetryTitle: string
  gpuLiveOfflineNotice: string
  gpuVramMarginLabel: string
  gpuVramMarginDesc: string
  singleModelLockToggle: string
  singleModelLockDesc: string
  externalWorkloadTitle: string
  externalWorkloadDesc: string
  purgeVramBtn: string
  purgeVramDesc: string
  turingRulesTitle: string
  turingRules: string[]
  healthManualTitle: string
  healthActions: {
    checkUpdates: string
    repairRuntime: string
    verifyCuda: string
    scanLibraries: string
    runDiagnostics: string
    exportReport: string
    restoreKnownGood: string
  }
  nonBlockingStartupNote: string
  securityRules: string[]
  verificationMatrixTitle: string
  contractsTitle: string
  contractsDesc: string
  aboutLines: string[]
  // First-Run Wizard
  wizardTitle: string
  wizardSubtitle: string
  wizardSteps: [string, string, string, string]
  wizardNext: string
  wizardBack: string
  wizardFinish: string
  wizardCloseAria: string
  wizardApprovalCheck: string
  wizardHardwareNote: string
  wizardReuseNote: string
  wizardManifestNote: string
  // Footer & Notices
  footerPreviewBadge: string
  footerCompanionOffline: string
  footerTagline: string
  footerSystemLink: string
  dismissNoticeAria: string
  noticeCompanionBlocked: string
  noticeEmptySave: string
  noticeSavedDraft: string
  noticeCopied: string
  noticeClipboardUnavailable: string
  noticeEnterTextSpeech: string
  noticeEnableSpeech: string
  noticeBrowserSpeechActive: string
  noticeVisualSpeechOnly: string
  noticeMicDenied: string
  noticeAudioTooLarge: string
  noticeTxtReadError: string
  noticeUnsupportedFile: string
  noticePurgeBlocked: string
  noticeReportExported: string
  noticeWizardSaved: string
  // Multi-Partition Scanner, EXE/First-Run Choice & Manual Model Paths
  startupSetupPromptText: string
  startupSetupPromptBtn: string
  startupSetupDismissAria: string
  setupModeTitle: string
  setupModeDesc: string
  setupModes: {
    scan_in_place: { title: string; desc: string }
    hybrid_scan_then_download: { title: string; desc: string }
    download_all: { title: string; desc: string }
  }
  appInstallDirLabel: string
  appInstallDirHint: string
  scanPartitionsTitle: string
  scanPartitionsDesc: string
  scanPartitionsPlaceholder: string
  addPartitionBtn: string
  browseFolderBtn: string
  browseModelFileBtn: string
  removePartitionAria: string
  quickDrivesLabel: string
  inPlaceLinkingToggle: string
  inPlaceLinkingDesc: string
  inPlaceBadge: string
  manualPathLabel: string
  manualPathPlaceholder: string
  manualPathActiveBadge: string
  manualPathClearBtn: string
  browseSandboxNotice: string
  downloadSpeedLimitLabel: string
  downloadSpeedUnlimited: string
  autoResumeToggle: string
  autoResumeDesc: string
  // Expanded Comfort, UI & Model Behavior Settings
  themePresetLabel: string
  themeMidnightBlue: string
  themeGraphiteGold: string
  themeLightStudio: string
  workspaceDensityLabel: string
  densityComfortable: string
  densityCompact: string
  reduceMotionToggle: string
  reduceMotionDesc: string
  autosaveIntervalLabel: string
  startupBehaviorLabel: string
  startupAvatarFirst: string
  startupDirectStudio: string
  speechRateLabel: string
  autoGreetToggle: string
  autoGreetDesc: string
  executionProfileLabel: string
  executionProfiles: {
    balanced_rtx5000: { title: string; desc: string }
    max_speed: { title: string; desc: string }
    low_vram_coexist: { title: string; desc: string }
  }
  contextWindowLabel: string
  precisionPreferenceLabel: string
}

export const TRANSLATIONS: Record<UiLanguage, AppTranslations> = {
  ar: {
    langCode: 'ar-EG',
    dir: 'rtl',
    homeAria: 'الرئيسية — حافظ',
    enterWorkspace: 'دخول الاستوديو',
    switchLangLabel: 'English',
    openSettingsAria: 'فتح مركز الإعدادات',
    navLyricsStudio: 'استوديو الكلمات',
    navAudioWeb: 'الصوت والويب',
    navVoiceStems: 'الصوت والفصل',
    navSettings: 'الإعدادات',
    navProjects: 'المشاريع والمحفوظات',
    navDownloads: 'التحميل والتثبيت',
    navModels: 'مكتبة النماذج',
    navHub: 'واجهة حافظ',
    screenTitles: {
      welcome: 'واجهة حافظ الذكية',
      'studio/editor': 'استوديو الكلمات',
      'studio/diacritics': 'التشكيل بالعامية المصرية',
      'studio/songwriting': 'كتابة الأغاني المصرية',
      'studio/rhymes': 'القوافي وإعادة الصياغة',
      'audio/analysis': 'تحليل الصوت والموسيقى',
      'audio/web': 'يوتيوب والبحث الذكي',
      'voice_stems/clone': 'استنساخ وتحويل الصوت',
      'voice_stems/separation': 'فصل التراكات الستة (6-Stems)',
      'setup/models': 'مكتبة نماذج الذكاء الاصطناعي',
      'setup/downloads': 'التحميل والتثبيت المحلي',
      'setup/general': 'مركز الإعدادات والنظام',
      conversation: 'اتكلم مع حافظ',
      projects: 'المشاريع والمحفوظات',
    },
    groupLabels: {
      studio: 'استوديو الكلمات',
      audio: 'الصوت والويب',
      voice_stems: 'الصوت والفصل',
      setup: 'النظام والنماذج',
      '': 'المكتبة',
    },
    startupRegionAria: 'واجهة حافظ الذكية',
    startupGreeting: 'أهلاً بيك.. أنا حافظ. قولي تحب نبدأ بإيه النهارده؟',
    statusReady: 'جاهز',
    statusThinking: 'بيفكر...',
    statusListening: 'بسمعك...',
    statusSpeaking: 'بيتكلم...',
    micStartAria: 'تشغيل الميكروفون',
    micStopAria: 'إيقاف الميكروفون',
    commandInputAria: 'كلم حافظ أو اكتبله يفتحلك إيه',
    commandPlaceholder: 'كلم حافظ أو اكتبله يفتحلك إيه... (مثلاً: اكتب أغنية)',
    voicePlayLabel: 'اسمعني',
    voiceStopLabel: 'إيقاف',
    voicePlayAria: 'تشغيل صوت الترحيب',
    voiceStopAria: 'إيقاف صوت حافظ',
    sendCommandAria: 'إرسال الأمر لحافظ',
    quickCommandsAria: 'أوامر سريعة لحافظ',
    quickChips: [
      { label: 'اكتب أغنية', cmd: 'اكتب أغنية' },
      { label: 'التشكيل بالعامية', cmd: 'التشكيل بالعامية' },
      { label: 'استوديو الكلمات', cmd: 'استوديو الكلمات' },
      { label: 'تحليل الصوت', cmd: 'تحليل الصوت' },
      { label: 'استنساخ الصوت', cmd: 'استنساخ الصوت' },
      { label: 'فصل التراكات', cmd: 'فصل التراكات' },
      { label: 'الإعدادات و GPU', cmd: 'الإعدادات' },
    ],
    floatingAsideAria: 'المساعد العائم حافظ',
    floatingDialogAria: 'محادثة حافظ',
    floatingFullStage: 'واجهة حافظ',
    floatingMinimizeAria: 'تصغير المساعد',
    floatingDefaultReply: 'أنا هنا معاك في الجنب! قولي نفتح إيه أو نشتغل على إيه دلوقتي.',
    floatingAskAria: 'اطلب من حافظ',
    floatingAskPlaceholder: 'قول لحافظ يفتحلك إيه...',
    floatingSendAria: 'إرسال لحافظ',
    floatingMoveLeftAria: 'نقل حافظ إلى اليسار',
    floatingMoveRightAria: 'نقل حافظ إلى اليمين',
    floatingMoveLeftTitle: 'انقل حافظ لليسار',
    floatingMoveRightTitle: 'انقل حافظ لليمين',
    floatingMic: 'مايك',
    floatingStop: 'إيقاف',
    floatingSpeak: 'اتكلم',
    floatingMute: 'اسكت',
    floatingAskBtn: 'شات',
    floatingHideBtn: 'إخفاء',
    floatingReady: 'حافظ جاهز',
    floatingQuickChips: [
      { label: 'كتابة أغنية', cmd: 'اكتب أغنية' },
      { label: 'تشكيل', cmd: 'التشكيل بالعامية' },
      { label: 'فصل تراكات', cmd: 'فصل تراكات' },
      { label: 'الإعدادات', cmd: 'الإعدادات' },
    ],
    saveDraft: 'حفظ المسودة',
    openTxt: 'فتح ملف TXT',
    openTxtAria: 'فتح ملف نصي',
    exportTxt: 'تصدير TXT',
    copyText: 'نسخ النص',
    readText: 'قراءة النص بصوت حافظ',
    clearText: 'مسح',
    genreLabel: 'اللون الموسيقي',
    moodLabel: 'الإحساس والمود',
    moodPlaceholder: 'دافي، شجن، حماسي، رومانسي…',
    arrangementLabel: 'التوزيع والآلات',
    arrangementPlaceholder: 'عود، بيز دافي، إيقاع مقسوم، كمانجات…',
    addressSelectAria: 'صيغة المخاطب',
    addressOptions: ['مخاطب تلقائي', 'مذكر', 'مؤنث'],
    stripDiacriticsLocal: 'إزالة التشكيل محليًا',
    writingSpaceSong: 'فكرة الأغنية والمقاطع',
    writingSpaceRhymes: 'البيت أو الجملة الأصلية',
    writingSpaceDefault: 'مساحة الكتابة المصرية',
    undo: 'تراجع',
    redo: 'إعادة',
    editorAria: 'محرر الكلمات بالعامية المصرية',
    editorPlaceholder: 'ابدأ حكايتك هنا بالعامية المصرية…\n\nاكتب كلمات تعبّر عنك بطريقتك.',
    editorFooterInfo: 'عامية مصرية · UTF-8 · حفظ تلقائي محلي في المتصفح',
    wordsLabel: 'كلمة',
    charsLabel: 'حرف',
    aiActions: {
      'Smart Diacritics': 'تشكيل ذكي بالعامية',
      'Suno Phonetic': 'نطق صوتي لـ Suno',
      'Connected Egyptian': 'وصل العامية المصرية',
      Proofread: 'مراجعة وتدقيق',
      'Compose Song': 'تأليف أغنية كاملة',
      'Write Lyrics': 'كتابة كلمات',
      'Analyze Lyrics': 'تحليل الوزن والمعنى',
      'Generate Suno / Udio Prompts': 'توليد أوامر Suno / Udio',
      'Find Egyptian Rhymes': 'استخراج قوافي مصرية',
      'Rewrite Line': 'إعادة صياغة البيت',
      'Inspect Pronunciation': 'فحص النطق والإيقاع',
      'Check Meaning': 'فحص المعنى والصور',
      'Extract Available Lyrics': 'استخراج الكلمات المتاحة',
      'Research & Generate Prompt': 'بحث وتوليد برومبت',
      'Egyptian Phonetic Processing': 'معالجة صوتية مصرية',
    },
    uploadSourceAudio: 'ارفع ملف الصوت الأساسي',
    uploadReferenceVoice: 'ارفع عينة الصوت المرجعي المصرّح بها',
    uploadHint: 'اسحب ملف WAV أو MP3 أو FLAC أو M4A أو OGG · حتى 150 ميجابايت',
    youtubeUrlLabel: 'رابط يوتيوب مصرّح به',
    youtubePlaceholder: 'https://youtube.com/watch?v=…',
    youtubeNote: 'الاستخراج عن بُعد يتطلب المحرك المحلي على ويندوز وتصريح المصدر.',
    processingModeLabel: 'وضع المعالجة',
    pitchShiftLabel: 'تعديل طبقة الصوت (Pitch)',
    pitchShiftRange: 'من −12 إلى +12 نصف نغمة',
    startProcessing: 'بدء المعالجة',
    noProcessedAudio: 'لا يوجد صوت معالج بعد. محركات كارت الشاشة (GPU) تتطلب المحرك المحلي على ويندوز.',
    sourceUrlLabel: 'رابط المصدر المصرّح به',
    sourceUrlPlaceholder: 'الصق رابط مصدر مصرّح به للبحث',
    researchQueryLabel: 'موضوع البحث',
    researchQueryPlaceholder: 'تحب تبحث عن إيه؟',
    webAgentOffline: 'وكيل البحث المحلي غير متصل. لم يتم الوصول لأي مصدر خارجي.',
    decodingWaveform: 'جاري قراءة الموجة الصوتية…',
    waveformUnsupported: 'تعذر فك تشفير الموجة لهذا الملف. جرّب ملف WAV أو MP3.',
    searchProjectsAria: 'البحث في المشاريع المحفوظة',
    searchProjectsPlaceholder: 'ابحث في مشاريعك المحفوظة…',
    projectsEmptyTitle: 'بداية جديدة لفكرتك الجاية.',
    projectsEmptyDesc: 'كلماتك ومسوداتك المحفوظة هتظهر هنا. محفوظة محليًا على هذا المتصفح فقط.',
    createFirstProject: 'ابدأ أول مشروع',
    projectOpen: 'فتح',
    projectRename: 'إعادة تسمية',
    projectDuplicate: 'نسخ',
    projectExport: 'تصدير',
    projectDelete: 'حذف',
    projectRenamePrompt: 'اسم المشروع الجديد',
    projectDeleteConfirm: 'هل تريد حذف هذا المشروع المحفوظ محليًا؟',
    projectCopySuffix: '(نسخة)',
    modelsIntroTitle: 'مكتبة قدرات الذكاء الاصطناعي المحلية',
    modelsIntroSubtitle: 'تُعرض بأسماء واضحة وسهلة الاستخدام مع إمكانية كشف المسارات التقنية والتراخيص والتوافق مع معمارية NVIDIA Turing (Compute 7.5).',
    showTechnicalDetails: 'إظهار التفاصيل التقنية (متقدم)',
    hideTechnicalDetails: 'إخفاء التفاصيل التقنية',
    openFirstRunWizard: 'معالج الإعداد الأول وفحص الجهاز',
    storageDirLabel: 'مجلد تخزين النماذج المحلي',
    storageDirHint: 'يتم حفظ المسار للربط مع المحرك المحلي على ويندوز بدون تكرار الملفات الموجودة.',
    useExistingModels: 'استخدام النماذج الموجودة محليًا',
    scanModelLibraries: 'فحص مجلدات النماذج',
    downloadMissing: 'تحميل المكونات الناقصة',
    continueDownloads: 'استئناف التحميلات المتوقفة',
    verifyInstallation: 'التحقق من سلامة التثبيت',
    connectCompanion: 'الاتصال بمحرك ويندوز المحلي',
    downloadsEmptyTitle: 'التحميل والتثبيت المحلي في مكان واحد.',
    downloadsEmptyDesc: 'لا توجد مهام تحميل نشطة. التحميل في الخلفية، التحقق من بصمة الملفات (SHA-256)، الاستئناف بعد الانقطاع، واكتشاف النماذج المحلية تتطلب محرك ويندوز المعتمد.',
    modelStatusOffline: 'غير متحقق · المحرك المحلي غير متصل',
    modelRepoLabel: 'المستودع الرسمي',
    modelRevisionLabel: 'الإصدار المثبّت',
    modelLicenseLabel: 'الرخصة',
    modelQuantLabel: 'الدقة والضغط',
    modelRuntimeLabel: 'بيئة التشغيل',
    modelCompatLabel: 'توافق RTX 5000 (Turing)',
    modelPathLabel: 'المسار المحلي',
    modelIntegrityLabel: 'سلامة الملفات',
    modelLoadStateLabel: 'حالة التحميل بالذاكرة',
    modelVramStateLabel: 'ذاكرة GPU',
    modelDiscoverAction: 'اكتشاف محلي',
    modelVerifyAction: 'فحص التوافق',
    settingsTabs: {
      general: 'العامة والمظهر والخطوط',
      assistant: 'المساعد حافظ والصوت',
      speechPipeline: 'مسار الصوت والاستجابة',
      orchestrator: 'منسّق النماذج الذكي',
      gpuGuard: 'حماية ذاكرة GPU (16GB)',
      modelsCompat: 'توافق النماذج و CUDA',
      downloadsStorage: 'التحميل والتخزين',
      audio: 'إعدادات الصوت',
      memoryProfiles: 'الذاكرة والملفات',
      updatesHealth: 'التحديثات والفحص الصحي',
      securityPrivacy: 'الأمان والخصوصية',
      diagnostics: 'التشخيص وعقود الأزرار',
      about: 'عن حافظ والإصدار',
    },
    interfaceLanguageLabel: 'لغة الواجهة والاتجاه',
    voiceLanguageLabel: 'لغة صوت حافظ (مستقلة عن لغة الواجهة)',
    voiceLanguageDesc: 'يمكنك اختيار واجهة إنجليزية مع إبقاء صوت حافظ بالعامية المصرية، أو العكس.',
    uiScaleLabel: 'معاينة مقياس الخطوط والنصوص (Windows DPI)',
    uiScaleDesc: 'اختبر وضوح النصوص العربية والإنجليزية دون قصّ أو تداخل.',
    assistantDockLabel: 'موضع المساعد العائم داخل الاستوديو',
    dockRight: 'اليمين',
    dockLeft: 'اليسار',
    browserSpeechToggle: 'تفعيل صوت المتصفح الاحتياطي في المعاينة',
    bargeInToggle: 'المقاطعة الفورية (Barge-in) أثناء الكلام',
    bargeInDesc: 'يوقف حافظ كلامه فورًا بمجرد أن تبدأ بالتحدث أو الكتابة.',
    micModeLabel: 'وضع التقاط الميكروفون',
    micModePtt: 'اضغط للتحدث (Push-to-Talk)',
    micModeContinuous: 'استماع مستمر مع كشف الصوت (VAD)',
    testMicBtn: 'اختبار إذن الميكروفون',
    stopMicBtn: 'إيقاف اختبار الميكروفون',
    pipelineTitle: 'معمارية خط الصوت المصري السريع',
    latencyTargetTitle: 'هدف زمن الاستجابة الصوتية (≤ 15 ثانية عند P95 في الوضع الدافئ)',
    latencyTargetDesc: 'تُقاس كل مرحلة على حدة على جهاز ويندوز الفعلي — لا تُعرض أي أرقام وهمية قبل القياس الحقيقي.',
    latencyCols: { stage: 'المرحلة', budget: 'الهدف التصميمي', measured: 'القياس الفعلي', status: 'الحالة' },
    orchestratorStateTitle: 'آلة حالات انتقال النماذج (HAFIZ Smart Inference Orchestrator)',
    orchestratorRoutingTitle: 'التوجيه الذكي حسب المهمة وليس التبويب فقط',
    idleTimeoutLabel: 'مهلة التفريغ التلقائي للنماذج الخاملة (بالثواني)',
    idleTimeoutDesc: 'القيمة الافتراضية 120 ثانية لمنع التبديل المتكرر أثناء التنقل السريع بين الأقسام.',
    routerModeToggle: 'استخدام llama.cpp Router Mode لنماذج GGUF المتوافقة',
    routerModeDesc: 'مشاركة نموذج لغوي أساسي واحد بين المهام النصية بدل تحميل نسخ مكررة.',
    lazyInitNote: 'التهيئة الكسولة (Lazy Init): محركات استنساخ الصوت (Seed-VC) وفصل التراكات (BS-RoFormer / Demucs) لا تُحمَّل في الذاكرة إلا عند تشغيل مهمتها فعليًا.',
    gpuProfileTitle: 'ملف العتاد المستهدف (Target Workstation Spec)',
    gpuLiveTelemetryTitle: 'القراءات الحية من كارت الشاشة (Live GPU Probe)',
    gpuLiveOfflineNotice: 'المحرك المحلي على ويندوز غير متصل حاليًا — لا توجد قراءات VRAM حية ولن يتم عرض أرقام مصطنعة.',
    gpuVramMarginLabel: 'هامش أمان ذاكرة كارت الشاشة (VRAM Safety Margin)',
    gpuVramMarginDesc: 'يحجز هذا الهامش لحماية النظام وأي برامج GPU خارجية من أخطاء نفاد الذاكرة (CUDA OOM).',
    singleModelLockToggle: 'قفل النموذج الواحد للمهام الثقيلة (Single-Model Lock)',
    singleModelLockDesc: 'يمنع تحميل محركات ثقيلة متزامنة (مثل استنساخ الصوت + فصل التراكات معًا) ويفرّغ فقط نماذج حافظ الخاملة قبل البدء.',
    externalWorkloadTitle: 'حماية العمليات الخارجية على GPU',
    externalWorkloadDesc: 'يكتشف حافظ أي استخدام خارجي للـ GPU (مثل Unsloth أو LM Studio أو ComfyUI) ويدخل في حالة EXTERNAL_GPU_BUSY أو يؤجّل المهمة — ولا يُغلق أبدًا أي عملية لا يملكها حافظ.',
    purgeVramBtn: 'تفريغ ذاكرة كارت الشاشة الآن (نماذج حافظ فقط)',
    purgeVramDesc: 'يُفرّغ مراجع نماذج حافظ فقط ويُنهي عمّال حافظ الخاملين ثم يعيد قراءة الذاكرة الفعلية — بدون إعادة ضبط عام للـ GPU أو مساس بأي برنامج خارجي.',
    turingRulesTitle: 'قواعد التوافق الصارمة لمعمارية NVIDIA Turing (Compute Capability 7.5)',
    turingRules: [
      'تفضيل دقة FP16 المتحقّق منها وتدعيم INT8 و GGUF الكمي بدون اشتراط BF16 الأصلي.',
      'عدم اختيار حزم PyTorch CUDA بالاعتماد على أعلى رقم في nvidia-smi فقط؛ التحقق الفعلي من قدرات الكارت والنواة (Kernels).',
      'التأكد من تطابق إصدار PyTorch و TorchAudio وكشف تعليمات المعالج غير المدعومة.',
      'الاحتفاظ بملف الإصدارات المستقرة (Known-Good Runtime Manifest) مع إمكانية الاستعادة الفورية بدون ترقية عشوائية.',
    ],
    healthManualTitle: 'أدوات الصيانة والفحص اليدوي (لا تحجب الإقلاع السريع)',
    healthActions: {
      checkUpdates: 'التحقق من التحديثات',
      repairRuntime: 'إصلاح بيئة التشغيل',
      verifyCuda: 'فحص CUDA والتوافق',
      scanLibraries: 'فحص مكتبات النماذج',
      runDiagnostics: 'تشغيل التشخيص الشامل',
      exportReport: 'تصدير تقرير التشخيص (JSON)',
      restoreKnownGood: 'استعادة البيئة المستقرة',
    },
    nonBlockingStartupNote: 'سياسة الإقلاع: يبدأ حافظ فورًا بفحص محلي سريع ويستخدم معلومات النظام الموثّقة المخزّنة، ويسمح بالعمل الكامل بدون إنترنت (Offline-first) دون تعطيل البداية.',
    securityRules: [
      'التشغيل المحلي أولًا (Local-first) وبدون إنترنت بعد تثبيت الأصول المعتمدة.',
      'عدم تنفيذ أي كود برمجي غير مراجَع من مستودعات النماذج تلقائيًا.',
      'طلب موافقة صريحة من المستخدم قبل أي تحميل أو تثبيت أو تحديث لـ CUDA / Torch / FFmpeg.',
      'تقييد استنساخ الصوت بالعينات المصرّح بها فقط وحماية البيانات والملفات المحلية.',
    ],
    verificationMatrixTitle: 'مصفوفة التحقق والأداء (نتائج صادقة بدون تزييف)',
    contractsTitle: 'سجل عقود الأزرار والربط بالخادم المحلي (Backend-Ready Action Contracts)',
    contractsDesc: 'كل زر وإجراء موثّق بمعرّف فريد، نقطة اتصال، نموذج مطلوب، وسياسة إلغاء وأخطاء جاهزة للربط مع WinUI 3 و Named Pipe / Localhost IPC.',
    aboutLines: [
      'حافظ بالعامية — الجيل الجديد (HAFIZ New Generation)',
      'واجهة تصميم ومعاينة ويب بنمط Windows 11 Fluent تمهيدًا للتطبيق الأصلي بـ WinUI 3 / C# .NET.',
      'الهوية البصرية الرسمية محفوظة بالكامل كما زوّدها المالك.',
      'ملاحظة تقنية صادقة: المعاينة الحالية في المتصفح تستخدم تحريك وجه 2.5D طبقي على Canvas وليست محرك 3D أصليًا أو تطبيق EXE مترجمًا بعد.',
    ],
    wizardTitle: 'معالج الإعداد الأول وفحص بيئة ويندوز 11',
    wizardSubtitle: 'خطوات واضحة للتحقق من العتاد، اختيار مجلد النماذج دون تكرار، والموافقة الصريحة قبل أي تحميل.',
    wizardSteps: ['فحص العتاد و GPU', 'مجلد النماذج', 'المكونات المتوافقة', 'تثبيت المانيفست'],
    wizardNext: 'التالي',
    wizardBack: 'السابق',
    wizardFinish: 'حفظ التفضيلات وإغلاق',
    wizardCloseAria: 'إغلاق معالج الإعداد',
    wizardApprovalCheck: 'أوافق على سياسة عدم التحميل أو التحديث التلقائي إلا بعد مراجعة المكونات المتوافقة مع الجهاز.',
    wizardHardwareNote: 'في بيئة المعاينة على المتصفح لا يمكن الوصول المباشر لعتاد ويندوز أو nvidia-smi؛ عند تشغيل المثبّت الأصلي سيتم التحقق الفعلي من المعالج والـ GPU وتعريف NVIDIA والمساحة المتاحة.',
    wizardReuseNote: 'حدد المسار الذي يحتوي على نماذجك المحلية الحالية ليعيد حافظ استخدامها فورًا بدون إعادة تحميل مكرر.',
    wizardManifestNote: 'سيتم حفظ نسخة معروفة الاستقرار (Known-Good Runtime Manifest) مع دعم التشغيل بدون إنترنت وإمكانية الاستعادة في أي وقت.',
    footerPreviewBadge: 'معاينة ويب',
    footerCompanionOffline: 'المحرك المحلي على ويندوز غير متصل',
    footerTagline: 'مصمّم للتعبير المصري الأصيل · أداء محلي ذكي على ويندوز 11',
    footerSystemLink: 'النظام والاتصال',
    dismissNoticeAria: 'إغلاق الإشعار',
    noticeCompanionBlocked: 'محرك ويندوز المحلي غير متصل. هذه العملية تتطلب بيئة الاستدلال المحلية الفعلية؛ لم يتم تزييف أي نتيجة أو تحميل.',
    noticeEmptySave: 'اكتب بعض الكلمات أولًا قبل الحفظ.',
    noticeSavedDraft: 'تم حفظ المسودة محليًا في هذا المتصفح. ستجدها في المشاريع والمحفوظات.',
    noticeCopied: 'تم نسخ النص إلى الحافظة.',
    noticeClipboardUnavailable: 'تعذر الوصول للحافظة تلقائيًا. يمكنك تحديد النص ونسخه يدويًا.',
    noticeEnterTextSpeech: 'اكتب نصًا أولًا قبل بدء القراءة الصوتية.',
    noticeEnableSpeech: 'فعّل صوت المتصفح الاحتياطي من الإعدادات ← المساعد حافظ والصوت.',
    noticeBrowserSpeechActive: 'صوت المتصفح نشط · يتفاعل وجه حافظ مع النطق لحظيًا (جودة الصوت المصري تعتمد على أصوات جهازك).',
    noticeVisualSpeechOnly: 'توليد الصوت غير متاح في هذا المتصفح · يتم تشغيل وضع التفاعل البصري للنطق.',
    noticeMicDenied: 'تم رفض إذن الميكروفون أو لا يوجد ميكروفون متصل.',
    noticeAudioTooLarge: 'اختر ملف صوت أصغر من 150 ميجابايت للمعاينة في المتصفح.',
    noticeTxtReadError: 'تعذر قراءة الملف النصي.',
    noticeUnsupportedFile: 'نوع ملف غير مدعوم. اختر ملف TXT أو ملف صوت مدعوم.',
    noticePurgeBlocked: 'تعذر تنفيذ تفريغ VRAM: المحرك المحلي غير متصل. عند الاتصال سيتم تفريغ نماذج حافظ الخاملة فقط دون المساس بأي عملية خارجية.',
    noticeReportExported: 'تم تصدير تقرير التشخيص (JSON) بالبيانات الحقيقية وحالة كل فحص.',
    noticeWizardSaved: 'تم حفظ إعدادات التثبيت على E: ومسارات فحص البارتيشنات وربط الموديلات في مكانها.',
    startupSetupPromptText: 'إعداد أول تشغيل / ملف التثبيت EXE: تحب حافظ يفحص بارتيشناتك (E: و D:) ويربط الموديلات في مكانها بدون نقل، ولا يحمّلها على E:؟',
    startupSetupPromptBtn: 'اختر طريقة الموديلات والبارتيشنات',
    startupSetupDismissAria: 'إخفاء تذكير الإعداد الأول',
    setupModeTitle: 'طريقة توفير الموديلات أثناء التثبيت (EXE Setup) أو أول تشغيل',
    setupModeDesc: 'اختر الطريقة المريحة ليك: حافظ يقدر يفحص أكتر من بارتيشن ويربط الموديلات أوتوماتيك في مكانها من غير ما ينقلها أو ينسخها، أو يحمّل الناقص بس، أو يحمّل الكل على E:.',
    setupModes: {
      scan_in_place: {
        title: 'فحص البارتيشنات وربط الموديلات الموجودة في مكانها (بدون نقل)',
        desc: 'يفحص البارتيشنات اللي تختارها (مثل E:\\ و D:\\) ويدخّل الموديلات أوتوماتيك في حافظ مع إبقاء كل ملف في مكانه الأصلي بدون نقل أو تكرار.',
      },
      hybrid_scan_then_download: {
        title: 'فحص البارتيشنات أولًا + تحميل الموديلات الناقصة فقط على E:',
        desc: 'يربط الموديلات الموجودة على E: و D: في مكانها، ويحمّل المكونات الناقصة فقط في مجلد التحميل المختار.',
      },
      download_all: {
        title: 'تحميل كل الموديلات المتوافقة من جديد في مكانها على E:',
        desc: 'ينزّل حزمة الموديلات المتوافقة مع كارتك بالكامل مباشرة داخل مجلد النماذج المختار على بارتيشن E:.',
      },
    },
    appInstallDirLabel: 'مسار تثبيت البرنامج (EXE Setup Target)',
    appInstallDirHint: 'يتم تثبيت البرنامج والملفات التشغيلية على بارتيشن E: لتوفير مساحة بارتيشن النظام C:.',
    scanPartitionsTitle: 'البارتيشنات والمجلدات المطلوب فحصها أوتوماتيك (متعدد)',
    scanPartitionsDesc: 'أضف أكثر من بارتيشن أو مجلد (مثل E:\\ و D:\\) ليفحصها حافظ ويربط أي موديل متوافق في مكانه الأصلي بدون نقله.',
    scanPartitionsPlaceholder: 'اكتب مسار بارتيشن أو مجلد مثل D:\\AI_Models أو F:\\',
    addPartitionBtn: 'إضافة للمسح',
    browseFolderBtn: 'استعراض (Browse)',
    browseModelFileBtn: 'اختيار مكان الموديل يدويًا (Browse)',
    removePartitionAria: 'إزالة مسار الفحص',
    quickDrivesLabel: 'إضافة سريعة للبارتيشنات:',
    inPlaceLinkingToggle: 'ربط الموديلات في مكانها الأصلي بدون نقل أو نسخ (In-Place Indexing)',
    inPlaceLinkingDesc: 'يحفظ حافظ عنوان كل موديل في مكانه على E: أو D: كما هو لتجنب استهلاك مساحة مزدوجة أو كسر برامج تانية مثل LM Studio أو ComfyUI.',
    inPlaceBadge: 'مربوط في مكانه · بدون نقل',
    manualPathLabel: 'المسار اليدوي لهذا الموديل (اختياري)',
    manualPathPlaceholder: 'مثلاً: D:\\MyModels\\model.gguf أو E:\\Audio\\weights',
    manualPathActiveBadge: 'مسار يدوي مخصص',
    manualPathClearBtn: 'رجوع للفحص التلقائي',
    browseSandboxNotice: 'متصفح المعاينة يحجب المسار الكامل للبارتيشن لأسباب أمنية؛ يمكنك كتابة أو تعديل المسار الكامل (مثل E:\\ أو D:\\) مباشرة وسيتعرف عليه تطبيق ويندوز الأصلي فورًا بدون نقل الملفات.',
    downloadSpeedLimitLabel: 'الحد الأقصى لسرعة التحميل في الخلفية',
    downloadSpeedUnlimited: 'غير محدود (أقصى سرعة)',
    autoResumeToggle: 'استئناف تلقائي للتحميلات بعد انقطاع الإنترنت أو إعادة التشغيل',
    autoResumeDesc: 'يحفظ حالة كل ملف ويستكمل من آخر بايت بدون إعادة التحميل من الصفر.',
    themePresetLabel: 'مظهر الواجهة وراحة العين',
    themeMidnightBlue: 'الأزرق الليلي الرسمي (Midnight Blue)',
    themeGraphiteGold: 'الجرافيت الداكن والذهبي (Graphite & Gold)',
    themeLightStudio: 'استوديو فاتح (Light White & Blue)',
    workspaceDensityLabel: 'كثافة مساحة العمل والمسافات',
    densityComfortable: 'مريح (Comfortable)',
    densityCompact: 'مضغوط احترافي (Compact)',
    reduceMotionToggle: 'تهدئة حركة الخلفية للتركيز والراحة البصرية',
    reduceMotionDesc: 'يثبّت حركة الخط العربي والمؤثرات الخلفية مع الإبقاء على تفاعل وجه حافظ.',
    autosaveIntervalLabel: 'وتيرة الحفظ التلقائي للمسودات',
    startupBehaviorLabel: 'سلوك فتح البرنامج',
    startupAvatarFirst: 'البدء بواجهة حافظ التفاعلية (الافتراضي الرسمي)',
    startupDirectStudio: 'الدخول المباشر لاستوديو الكلمات',
    speechRateLabel: 'سرعة نطق صوت حافظ',
    autoGreetToggle: 'ترحيب صوتي تلقائي عند فتح البرنامج',
    autoGreetDesc: 'يتكلم حافظ بترحيب مصري عند التشغيل إذا كان الصوت مسموحًا.',
    executionProfileLabel: 'ملف أسلوب عمل الموديلات والأداء',
    executionProfiles: {
      balanced_rtx5000: {
        title: 'متوازن لـ RTX 5000 (16GB) — مُوصى به',
        desc: 'هامش أمان 2GB + تفريغ خامل بعد 120 ثانية + قفل نموذج واحد للمهام الثقيلة.',
      },
      max_speed: {
        title: 'أقصى سرعة استجابة وتبديل',
        desc: 'يبقي النموذج الأساسي دافئًا 300 ثانية مع هامش 1.5GB لتقليل وقت إعادة التحميل.',
      },
      low_vram_coexist: {
        title: 'توفير الذاكرة للعمل جنب برامج GPU أخرى',
        desc: 'هامش أمان 3.5GB + تفريغ سريع بعد 60 ثانية لحماية Unsloth و LM Studio و ComfyUI.',
      },
    },
    contextWindowLabel: 'سعة ذاكرة السياق الافتراضية للنموذج اللغوي (Context Window)',
    precisionPreferenceLabel: 'تفضيل دقة التشغيل (Turing SM 7.5 Safe)',
  },
  en: {
    langCode: 'en-US',
    dir: 'ltr',
    homeAria: 'HAFIZ Home',
    enterWorkspace: 'Enter Workspace',
    switchLangLabel: 'العربية',
    openSettingsAria: 'Open Settings Center',
    navLyricsStudio: 'Lyrics Studio',
    navAudioWeb: 'Audio & Web',
    navVoiceStems: 'Voice & Stems',
    navSettings: 'Settings',
    navProjects: 'Projects & History',
    navDownloads: 'Downloads & Setup',
    navModels: 'AI Model Library',
    navHub: 'HAFIZ Stage',
    screenTitles: {
      welcome: 'HAFIZ Intelligence Stage',
      'studio/editor': 'Lyrics Studio',
      'studio/diacritics': 'Egyptian Diacritics',
      'studio/songwriting': 'Egyptian Songwriting',
      'studio/rhymes': 'Rhymes & Rewriter',
      'audio/analysis': 'Music & Audio Analysis',
      'audio/web': 'YouTube & Research',
      'voice_stems/clone': 'Voice Cloning',
      'voice_stems/separation': 'Six-Stem Separation',
      'setup/models': 'AI Model Library',
      'setup/downloads': 'Downloads & Local Installation',
      'setup/general': 'Settings & System Center',
      conversation: 'Talk to HAFIZ',
      projects: 'Projects & History',
    },
    groupLabels: {
      studio: 'Lyrics Studio',
      audio: 'Audio & Web',
      voice_stems: 'Voice & Stems',
      setup: 'System & Models',
      '': 'Library',
    },
    startupRegionAria: 'HAFIZ Intelligence Stage',
    startupGreeting: 'Welcome. I am HAFIZ — tell me what you want to create today.',
    statusReady: 'Ready',
    statusThinking: 'Thinking...',
    statusListening: 'Listening...',
    statusSpeaking: 'Speaking...',
    micStartAria: 'Start microphone',
    micStopAria: 'Stop microphone',
    commandInputAria: 'Tell HAFIZ which tool to open',
    commandPlaceholder: 'Talk to HAFIZ or type what to open… (e.g., Write a song)',
    voicePlayLabel: 'Voice',
    voiceStopLabel: 'Stop',
    voicePlayAria: 'Play welcome voice',
    voiceStopAria: 'Stop HAFIZ voice',
    sendCommandAria: 'Send command to HAFIZ',
    quickCommandsAria: 'Quick commands for HAFIZ',
    quickChips: [
      { label: 'Songwriting', cmd: 'Songwriting' },
      { label: 'Diacritics', cmd: 'Egyptian Diacritics' },
      { label: 'Lyrics Studio', cmd: 'Lyrics Studio' },
      { label: 'Audio Analysis', cmd: 'Audio Analysis' },
      { label: 'Voice Clone', cmd: 'Voice Clone' },
      { label: '6-Stems', cmd: 'Six-Stem Separation' },
      { label: 'Settings & GPU', cmd: 'Settings' },
    ],
    floatingAsideAria: 'Floating HAFIZ Assistant',
    floatingDialogAria: 'Talk to HAFIZ',
    floatingFullStage: 'Full Stage',
    floatingMinimizeAria: 'Minimize assistant',
    floatingDefaultReply: 'I am right here beside you. Tell me what you want to open or create.',
    floatingAskAria: 'Ask HAFIZ',
    floatingAskPlaceholder: 'Ask HAFIZ to open a tool…',
    floatingSendAria: 'Send to HAFIZ',
    floatingMoveLeftAria: 'Move Hafiz to left side',
    floatingMoveRightAria: 'Move Hafiz to right side',
    floatingMoveLeftTitle: 'Move Hafiz left',
    floatingMoveRightTitle: 'Move Hafiz right',
    floatingMic: 'Mic',
    floatingStop: 'Stop',
    floatingSpeak: 'Speak',
    floatingMute: 'Mute',
    floatingAskBtn: 'Ask',
    floatingHideBtn: 'Hide',
    floatingReady: 'HAFIZ Ready',
    floatingQuickChips: [
      { label: 'Songwriting', cmd: 'Songwriting' },
      { label: 'Diacritics', cmd: 'Diacritics' },
      { label: '6-Stems', cmd: '6-Stems' },
      { label: 'Settings', cmd: 'Settings' },
    ],
    saveDraft: 'Save draft',
    openTxt: 'Open TXT',
    openTxtAria: 'Open text file',
    exportTxt: 'Export TXT',
    copyText: 'Copy',
    readText: 'Read aloud',
    clearText: 'Clear',
    genreLabel: 'Genre',
    moodLabel: 'Mood',
    moodPlaceholder: 'Intimate, hopeful, energetic…',
    arrangementLabel: 'Arrangement',
    arrangementPlaceholder: 'Oud, warm bass, acoustic drums…',
    addressSelectAria: 'Address selection',
    addressOptions: ['Automatic address', 'Masculine', 'Feminine'],
    stripDiacriticsLocal: 'Strip diacritics locally',
    writingSpaceSong: 'Song concept & sections',
    writingSpaceRhymes: 'Source lyric line',
    writingSpaceDefault: 'Your writing space',
    undo: 'Undo',
    redo: 'Redo',
    editorAria: 'Egyptian lyrics editor',
    editorPlaceholder: 'Start your story in Egyptian Arabic…\n\nWrite something only you could write.',
    editorFooterInfo: 'Egyptian Arabic · UTF-8 · Browser-local autosave',
    wordsLabel: 'words',
    charsLabel: 'characters',
    aiActions: {
      'Smart Diacritics': 'Smart Diacritics',
      'Suno Phonetic': 'Suno Phonetic',
      'Connected Egyptian': 'Connected Egyptian',
      Proofread: 'Proofread',
      'Compose Song': 'Compose Song',
      'Write Lyrics': 'Write Lyrics',
      'Analyze Lyrics': 'Analyze Lyrics',
      'Generate Suno / Udio Prompts': 'Generate Suno / Udio Prompts',
      'Find Egyptian Rhymes': 'Find Egyptian Rhymes',
      'Rewrite Line': 'Rewrite Line',
      'Inspect Pronunciation': 'Inspect Pronunciation',
      'Check Meaning': 'Check Meaning',
      'Extract Available Lyrics': 'Extract Available Lyrics',
      'Research & Generate Prompt': 'Research & Generate Prompt',
      'Egyptian Phonetic Processing': 'Egyptian Phonetic Processing',
    },
    uploadSourceAudio: 'Upload source audio',
    uploadReferenceVoice: 'Upload authorized reference voice',
    uploadHint: 'Drop WAV, MP3, FLAC, M4A, OGG · Up to 150 MB',
    youtubeUrlLabel: 'Authorized YouTube URL',
    youtubePlaceholder: 'https://youtube.com/watch?v=…',
    youtubeNote: 'Remote extraction requires the local Windows companion and source permission.',
    processingModeLabel: 'Processing mode',
    pitchShiftLabel: 'Pitch shift',
    pitchShiftRange: '−12 to +12 semitones',
    startProcessing: 'Start processing',
    noProcessedAudio: 'No processed audio yet. Local GPU engines require the Windows companion.',
    sourceUrlLabel: 'Authorized source URL',
    sourceUrlPlaceholder: 'Paste an authorized source URL',
    researchQueryLabel: 'Research query',
    researchQueryPlaceholder: 'What would you like to research?',
    webAgentOffline: 'Local web agent disconnected. No external source has been accessed.',
    decodingWaveform: 'Decoding waveform…',
    waveformUnsupported: 'Waveform decoding is unsupported for this file. Try WAV or MP3.',
    searchProjectsAria: 'Search saved projects',
    searchProjectsPlaceholder: 'Search your saved projects…',
    projectsEmptyTitle: 'A fresh start for your next idea.',
    projectsEmptyDesc: 'Your saved lyrics will appear here. Stored locally in this browser.',
    createFirstProject: 'Create your first project',
    projectOpen: 'Open',
    projectRename: 'Rename',
    projectDuplicate: 'Duplicate',
    projectExport: 'Export',
    projectDelete: 'Delete',
    projectRenamePrompt: 'Project name',
    projectDeleteConfirm: 'Delete this locally saved project?',
    projectCopySuffix: '(copy)',
    modelsIntroTitle: 'Local AI Capability Library',
    modelsIntroSubtitle: 'Friendly capability names by default, with expandable technical metadata, pinned revisions, licenses, and NVIDIA Turing (Compute 7.5) compatibility notes.',
    showTechnicalDetails: 'Show Technical Details (Advanced)',
    hideTechnicalDetails: 'Hide Technical Details',
    openFirstRunWizard: 'First-Run Setup & Hardware Wizard',
    storageDirLabel: 'Local model storage directory',
    storageDirHint: 'Persisted for the native Windows companion to reuse existing local weights without duplication.',
    useExistingModels: 'Use existing local models',
    scanModelLibraries: 'Scan model libraries',
    downloadMissing: 'Download missing components',
    continueDownloads: 'Resume interrupted downloads',
    verifyInstallation: 'Verify installation',
    connectCompanion: 'Connect Windows companion',
    downloadsEmptyTitle: 'Your local installation, in one place.',
    downloadsEmptyDesc: 'No active download jobs. Resumable background transfers, SHA-256 verification, crash recovery, and local library discovery require the authorized Windows companion.',
    modelStatusOffline: 'Not verified · companion offline',
    modelRepoLabel: 'Official source',
    modelRevisionLabel: 'Pinned revision',
    modelLicenseLabel: 'License',
    modelQuantLabel: 'Precision / Quantization',
    modelRuntimeLabel: 'Required runtime',
    modelCompatLabel: 'RTX 5000 (Turing SM 7.5)',
    modelPathLabel: 'Local path',
    modelIntegrityLabel: 'Integrity',
    modelLoadStateLabel: 'Orchestrator state',
    modelVramStateLabel: 'GPU VRAM',
    modelDiscoverAction: 'Discover local',
    modelVerifyAction: 'Check compatibility',
    settingsTabs: {
      general: 'General & Typography',
      assistant: 'HAFIZ Assistant & Voice',
      speechPipeline: 'Voice Pipeline & Latency',
      orchestrator: 'Smart Orchestrator',
      gpuGuard: 'GPU Memory Guard (16GB)',
      modelsCompat: 'Model & CUDA Compatibility',
      downloadsStorage: 'Downloads & Storage',
      audio: 'Audio Settings',
      memoryProfiles: 'Memory & Profiles',
      updatesHealth: 'Updates & Health Checks',
      securityPrivacy: 'Security & Privacy',
      diagnostics: 'Diagnostics & Contracts',
      about: 'About & Credits',
    },
    interfaceLanguageLabel: 'Interface language & layout direction',
    voiceLanguageLabel: 'HAFIZ voice language (independent from UI language)',
    voiceLanguageDesc: 'Keep HAFIZ speaking authentic Egyptian Arabic even while using an English interface, or switch freely.',
    uiScaleLabel: 'Windows DPI / Text scale preview',
    uiScaleDesc: 'Inspect Arabic RTL and English LTR legibility without clipping or horizontal scroll.',
    assistantDockLabel: 'Floating companion side inside workspaces',
    dockRight: 'Right',
    dockLeft: 'Left',
    browserSpeechToggle: 'Enable browser speech fallback in web preview',
    bargeInToggle: 'Immediate speech interruption (Barge-in)',
    bargeInDesc: 'Stops HAFIZ immediately the moment you start speaking or typing.',
    micModeLabel: 'Microphone capture mode',
    micModePtt: 'Push-to-Talk',
    micModeContinuous: 'Continuous listening with VAD',
    testMicBtn: 'Test microphone permission',
    stopMicBtn: 'Stop microphone test',
    pipelineTitle: 'Fast Egyptian Speech Pipeline Architecture',
    latencyTargetTitle: '15-Second Voice Response Target (≤ 15s at P95, warm idle system)',
    latencyTargetDesc: 'Each stage is instrumented separately on the target Windows workstation — zero fabricated timings before live measurement.',
    latencyCols: { stage: 'Pipeline Stage', budget: 'Design Target', measured: 'Measured Value', status: 'Status' },
    orchestratorStateTitle: 'Model Transition State Machine (HAFIZ Smart Inference Orchestrator)',
    orchestratorRoutingTitle: 'Task-Aware Engine Routing (Workspace + User Intent)',
    idleTimeoutLabel: 'Idle model unload timeout (seconds)',
    idleTimeoutDesc: 'Default 120 seconds to prevent repeated model thrashing during rapid tab switches.',
    routerModeToggle: 'Enable llama.cpp Router Mode for compatible GGUF models',
    routerModeDesc: 'Share one capable primary LLM across compatible text workflows instead of loading duplicate models.',
    lazyInitNote: 'Lazy Initialization: Heavy Seed-VC voice cloning and BS-RoFormer / Demucs stem engines load only when their task is explicitly invoked.',
    gpuProfileTitle: 'Target Workstation Hardware Profile',
    gpuLiveTelemetryTitle: 'Live GPU Telemetry Probe',
    gpuLiveOfflineNotice: 'Local Windows companion is offline — live VRAM & GPU utilization are unavailable and never fabricated.',
    gpuVramMarginLabel: 'VRAM Safety Margin',
    gpuVramMarginDesc: 'Reserved headroom to protect Windows desktop stability and external GPU workloads from CUDA OOM.',
    singleModelLockToggle: 'Single-Model Lock for heavy audio/voice engines',
    singleModelLockDesc: 'Prevents uncontrolled concurrent heavy model loads and releases only eligible idle HAFIZ-owned models first.',
    externalWorkloadTitle: 'External GPU Workload Protection',
    externalWorkloadDesc: 'Detects independent GPU processes (Unsloth, LM Studio, ComfyUI) without interfering, transitions to EXTERNAL_GPU_BUSY or queues safely, and never terminates non-HAFIZ processes.',
    purgeVramBtn: 'Purge VRAM Now (HAFIZ-Owned Models Only)',
    purgeVramDesc: 'Releases HAFIZ-owned model references, recycles idle HAFIZ workers, runs allocator cleanup, and re-reads actual VRAM — never resets the GPU globally or touches unrelated processes.',
    turingRulesTitle: 'NVIDIA Turing (Compute Capability 7.5) Compatibility Guardrails',
    turingRules: [
      'Prefer validated FP16 execution alongside INT8 and GGUF quantized inference; never require native BF16 on Turing.',
      'Never pick PyTorch CUDA wheels solely from the max CUDA version shown in nvidia-smi; validate real device capability and kernels.',
      'Verify PyTorch & TorchAudio build pairing and detect unsupported CPU instruction sets.',
      'Maintain a pinned Known-Good Runtime Manifest with instant rollback; never auto-upgrade shared dependencies untested.',
    ],
    healthManualTitle: 'Manual Maintenance & Health Controls (Non-Blocking Startup)',
    healthActions: {
      checkUpdates: 'Check for Updates',
      repairRuntime: 'Repair Runtime',
      verifyCuda: 'Verify CUDA',
      scanLibraries: 'Scan Model Libraries',
      runDiagnostics: 'Run Diagnostics',
      exportReport: 'Export Diagnostic Report (JSON)',
      restoreKnownGood: 'Restore Known-Good Runtime',
    },
    nonBlockingStartupNote: 'Startup Policy: Subsequent launches run a fast local health check, reuse cached verified system info, allow full offline startup, and never block the UI with full disk scans.',
    securityRules: [
      'Local-first and offline-capable after approved assets are installed.',
      'Never execute unreviewed remote model repository code automatically.',
      'Require explicit user confirmation before downloading weights or modifying CUDA / Torch / FFmpeg.',
      'Restrict voice cloning strictly to authorized reference voices and keep user files local.',
    ],
    verificationMatrixTitle: 'Repeatable Windows Verification Matrix (Honest Status)',
    contractsTitle: 'Backend-Ready Action Contracts',
    contractsDesc: 'Every visible control maps to a documented action ID, IPC endpoint, required service, schema, cancellation rule, and retry policy for WinUI 3 integration.',
    aboutLines: [
      'HAFIZ New Generation — Windows 11 Native AI Studio Design',
      'Web preview implementing the bilingual Windows 11 Fluent UX, orchestrator contracts, and living avatar interaction model ahead of the native C# / WinUI 3 desktop build.',
      'Official HAFIZ brand assets preserved without alteration.',
      'Honest technical disclosure: This browser preview uses a layered 2.5D animated face canvas, not a compiled Windows EXE or live local CUDA runtime.',
    ],
    wizardTitle: 'First-Run Setup & Windows 11 Readiness Wizard',
    wizardSubtitle: 'Inspect hardware compatibility, select existing local model folders without duplication, and approve required components.',
    wizardSteps: ['Hardware & GPU', 'Model Directory', 'Compatible Stack', 'Manifest Lock'],
    wizardNext: 'Next',
    wizardBack: 'Back',
    wizardFinish: 'Save Preferences & Close',
    wizardCloseAria: 'Close setup wizard',
    wizardApprovalCheck: 'I confirm that no downloads or dependency changes should begin without explicit approval on the Windows companion.',
    wizardHardwareNote: 'Browser preview cannot directly query Windows drivers or nvidia-smi; the native installer will probe real CPU, GPU, driver, free VRAM, and disk space before recommending versions.',
    wizardReuseNote: 'Point HAFIZ to an existing local model directory so validated weights are reused directly without duplicate downloads.',
    wizardManifestNote: 'Pins a Known-Good Runtime Manifest for fast offline startup and safe rollback if a future update breaks compatibility.',
    footerPreviewBadge: 'Web preview',
    footerCompanionOffline: 'Local Windows companion not connected',
    footerTagline: 'Crafted for Egyptian expression · Local-first Windows 11 AI architecture',
    footerSystemLink: 'System & connection',
    dismissNoticeAria: 'Dismiss message',
    noticeCompanionBlocked: 'Windows companion not connected. This action requires the local AI inference backend; no result or download has been simulated.',
    noticeEmptySave: 'Write something before saving.',
    noticeSavedDraft: 'Draft saved locally in this browser. Find it in Projects & History.',
    noticeCopied: 'Copied to clipboard.',
    noticeClipboardUnavailable: 'Clipboard unavailable. Select and copy the text manually.',
    noticeEnterTextSpeech: 'Enter text before starting speech.',
    noticeEnableSpeech: 'Enable browser speech fallback in Settings → HAFIZ Assistant & Voice.',
    noticeBrowserSpeechActive: 'Browser speech active · HAFIZ articulates in real time (voice availability depends on your device).',
    noticeVisualSpeechOnly: 'Speech synthesis unavailable in this browser · running visual speaking articulation.',
    noticeMicDenied: 'Microphone permission was denied or no microphone is available.',
    noticeAudioTooLarge: 'Choose an audio file under 150 MB for browser preview.',
    noticeTxtReadError: 'The text file could not be read.',
    noticeUnsupportedFile: 'Unsupported file. Choose a TXT document or a supported audio file.',
    noticePurgeBlocked: 'Cannot purge VRAM while offline: Windows companion is not connected. When connected, only idle HAFIZ-owned models are unloaded safely.',
    noticeReportExported: 'Exported honest Diagnostic Report (JSON) with current verification statuses.',
    noticeWizardSaved: 'Saved E: install path, multi-partition scan roots, and in-place model linking preferences.',
    startupSetupPromptText: 'First-Run / EXE Setup choice: scan your partitions (E:, D:) to link existing models in-place without moving them, or download to E:?',
    startupSetupPromptBtn: 'Choose Model & Partition Setup',
    startupSetupDismissAria: 'Dismiss setup choice reminder',
    setupModeTitle: 'Model Acquisition Mode (EXE Installer & First Launch)',
    setupModeDesc: 'Choose what works best for your machine: scan multiple partitions and link models in-place without moving/copying files, scan first and download only missing models, or download all to E:.',
    setupModes: {
      scan_in_place: {
        title: 'Scan selected partitions & link existing models in-place (No move)',
        desc: 'Scans multiple drives/folders (e.g. E:\\, D:\\) and automatically registers compatible weights right where they live without moving or duplicating files.',
      },
      hybrid_scan_then_download: {
        title: 'Scan partitions first + download only missing models to E:',
        desc: 'Links any models already present on E: / D: in-place, then downloads only missing compatible components to your target folder.',
      },
      download_all: {
        title: 'Download full compatible model stack directly to E:',
        desc: 'Downloads all verified Turing-compatible models straight into your chosen model directory on drive E:.',
      },
    },
    appInstallDirLabel: 'Application installation path (EXE Setup Target)',
    appInstallDirHint: 'Installs HAFIZ application binaries and runtimes onto drive E: to keep system drive C: clean.',
    scanPartitionsTitle: 'Partitions & folders to scan automatically (Multi-Drive)',
    scanPartitionsDesc: 'Add one or more partitions or folders (e.g. E:\\, D:\\) so HAFIZ discovers and links compatible models in-place without moving them.',
    scanPartitionsPlaceholder: 'Type a partition or folder path like D:\\AI_Models or F:\\',
    addPartitionBtn: 'Add to scan',
    browseFolderBtn: 'Browse',
    browseModelFileBtn: 'Browse / Locate manually',
    removePartitionAria: 'Remove scan path',
    quickDrivesLabel: 'Quick add partitions:',
    inPlaceLinkingToggle: 'Link models in-place — never move or copy files',
    inPlaceLinkingDesc: 'Indexes each discovered or manually-chosen model at its original path on E: or D: so shared tools like LM Studio or ComfyUI stay intact.',
    inPlaceBadge: 'Linked in-place · No move',
    manualPathLabel: 'Manual local path override (optional)',
    manualPathPlaceholder: 'e.g. D:\\MyModels\\model.gguf or E:\\Audio\\weights',
    manualPathActiveBadge: 'Manual override',
    manualPathClearBtn: 'Reset to auto-scan',
    browseSandboxNotice: 'Browser preview sandboxes full Windows drive letters for security; type or refine the full Windows path (e.g. E:\\ or D:\\) directly so the native Windows companion links it in-place without moving files.',
    downloadSpeedLimitLabel: 'Background download bandwidth cap',
    downloadSpeedUnlimited: 'Unlimited (full speed)',
    autoResumeToggle: 'Auto-resume downloads after disconnect or Windows reboot',
    autoResumeDesc: 'Persists verified chunk checkpoints and resumes cleanly without restarting completed files.',
    themePresetLabel: 'Interface theme & eye comfort',
    themeMidnightBlue: 'Official Midnight Blue',
    themeGraphiteGold: 'Dark Graphite & Gold',
    themeLightStudio: 'Light Studio (White & Blue)',
    workspaceDensityLabel: 'Workspace spacing density',
    densityComfortable: 'Comfortable',
    densityCompact: 'Compact Pro',
    reduceMotionToggle: 'Calm background motion for visual comfort',
    reduceMotionDesc: 'Pauses background calligraphy drift while keeping the living HAFIZ avatar responsive.',
    autosaveIntervalLabel: 'Local draft autosave cadence',
    startupBehaviorLabel: 'Application launch behavior',
    startupAvatarFirst: 'Start with Living HAFIZ Avatar Stage (official default)',
    startupDirectStudio: 'Open directly into Lyrics Studio',
    speechRateLabel: 'HAFIZ speech rate',
    autoGreetToggle: 'Automatic spoken greeting on launch',
    autoGreetDesc: 'Speaks an Egyptian welcome greeting on startup when browser audio allows it.',
    executionProfileLabel: 'Model execution & performance profile',
    executionProfiles: {
      balanced_rtx5000: {
        title: 'Balanced RTX 5000 (16GB) — Recommended',
        desc: '2.0 GB VRAM safety margin · 120s idle unload · Single-Model Lock for heavy audio.',
      },
      max_speed: {
        title: 'Maximum Response Speed',
        desc: 'Keeps primary LLM warm for 300s with 1.5 GB margin to minimize reload latency.',
      },
      low_vram_coexist: {
        title: 'Memory-Friendly (Coexist with External GPU Apps)',
        desc: '3.5 GB VRAM margin · 60s fast unload to protect Unsloth, LM Studio & ComfyUI.',
      },
    },
    contextWindowLabel: 'Default LLM context window',
    precisionPreferenceLabel: 'Runtime precision preference (Turing SM 7.5 Safe)',
  },
}

export function getTranslations(lang: UiLanguage): AppTranslations {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.ar
}
