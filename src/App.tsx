import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AiMatrixHalo } from './components/AiMatrixHalo'
import { CalligraphyBackground } from './components/CalligraphyBackground'
import { FirstRunWizardModal } from './components/FirstRunWizardModal'
import { FloatingHafizAssistant, type DockSide } from './components/FloatingHafizAssistant'
import { HafizFaceRig } from './components/HafizFaceRig'
import { ModelManagerView } from './components/ModelManagerView'
import { ModelScannerModal } from './components/ModelScannerModal'
import { SettingsCenterView, type SettingsTabId } from './components/SettingsCenterView'
import { SpeakingWaveAura } from './components/SpeakingWaveAura'
import {
  ACTION_CONTRACTS,
  MODEL_CATALOG,
  TARGET_HARDWARE_SPEC,
  VERIFICATION_MATRIX,
  VOICE_LATENCY_STAGES,
  resolveRequiredRoutingRule,
} from './contracts/orchestrator'
import { getTranslations, type AppTranslations, type UiLanguage, type VoiceLanguage } from './i18n/translations'
import {
  HafizBackendAdapter,
  type BackendConnectionState,
} from './services/backendAdapter'
import { resolveHafizIntent, type AvatarState } from './utils/avatarAnimation'
import {
  DEFAULT_STORAGE_CONFIG,
  addScanPartition,
  getExecutionProfileDefaults,
  normalizeWindowsPath,
  removeScanPartition,
  type ExecutionProfile,
  type ModelSetupMode,
  type UiThemePreset,
} from './utils/storageConfig'
import { getThemeTokens } from './utils/themeTokens'

type IconName = 'home' | 'pen' | 'audio' | 'mic' | 'settings' | 'folder' | 'download' | 'arrow' | 'spark' | 'layers' | 'globe' | 'close' | 'play'
function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
    pen: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z" /><path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14" /></>,
    audio: <path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4" />,
    mic: <><rect x="8" y="2" width="8" height="13" rx="4" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    settings: <><path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 3-3-2-2 1-3-3-2-1-3Z" /><circle cx="11" cy="11" r="3" /></>,
    folder: <path d="M3 6h7l2 3h9v11H3Zm0 3V4h7l2 2h8v3" />,
    download: <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v5m-2-2h5" /></>,
    layers: <><path d="m12 3 10 6-10 6L2 9Zm-10 11 10 6 10-6M2 19l10 5 10-5" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    close: <path d="m5 5 14 14M19 5 5 19" />,
    play: <path d="m8 4 13 8-13 8Z" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 shrink-0 ${className}`} aria-hidden="true">{paths[name]}</svg>
}

const screens: { path: string; icon: IconName; group: string }[] = [
  { path: 'welcome', icon: 'home', group: '' },
  { path: 'studio/editor', icon: 'pen', group: 'studio' },
  { path: 'studio/diacritics', icon: 'spark', group: 'studio' },
  { path: 'studio/songwriting', icon: 'pen', group: 'studio' },
  { path: 'studio/rhymes', icon: 'spark', group: 'studio' },
  { path: 'audio/analysis', icon: 'audio', group: 'audio' },
  { path: 'audio/web', icon: 'globe', group: 'audio' },
  { path: 'voice_stems/clone', icon: 'mic', group: 'voice_stems' },
  { path: 'voice_stems/separation', icon: 'layers', group: 'voice_stems' },
  { path: 'setup/models', icon: 'layers', group: 'setup' },
  { path: 'setup/downloads', icon: 'download', group: 'setup' },
  { path: 'setup/general', icon: 'settings', group: 'setup' },
  { path: 'conversation', icon: 'mic', group: '' },
  { path: 'projects', icon: 'folder', group: '' },
]

function load<T,>(key: string, fallback: T): T { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback } }
function persist(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ } }
function downloadFile(content: string, name = 'HAFIZ-lyrics.txt', mime = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}

function AudioPreview({ url, name, t, ar, panelClass, textAccentClass }: { url: string; name: string; t: AppTranslations; ar: boolean; panelClass: string; textAccentClass: string }) {
  const [peaks, setPeaks] = useState<number[]>([])
  const [status, setStatus] = useState(t.decodingWaveform)
  const [duration, setDuration] = useState(0)
  useEffect(() => {
    let disposed = false
    const decoder = new AudioContext()
    setPeaks([]); setStatus(t.decodingWaveform)
    void fetch(url).then(r => r.arrayBuffer()).then(bytes => decoder.decodeAudioData(bytes)).then(buffer => {
      if (disposed) return
      const samples = buffer.getChannelData(0)
      const size = Math.max(1, Math.floor(samples.length / 180))
      const result = Array.from({ length: 180 }, (_, i) => {
        let peak = 0
        for (let j = i * size; j < Math.min((i + 1) * size, samples.length); j++) peak = Math.max(peak, Math.abs(samples[j]))
        return peak
      })
      setPeaks(result); setDuration(buffer.duration)
      setStatus(`${buffer.numberOfChannels} ch · ${buffer.sampleRate.toLocaleString()} Hz · ${buffer.duration.toFixed(2)} s`)
    }).catch(() => { if (!disposed) setStatus(t.waveformUnsupported) }).finally(() => void decoder.close())
    return () => { disposed = true }
  }, [url, t.decodingWaveform, t.waveformUnsupported])
  return <div className={`${panelClass} mt-5 p-5`}>
    <div className="mb-4 flex flex-wrap justify-between gap-2">
      <h3 dir="ltr" className="break-all font-mono text-sm">{name}</h3>
      <p dir="ltr" className={`text-xs ${textAccentClass}`} role="status">{status}</p>
    </div>
    {peaks.length > 0 && <svg viewBox="0 0 720 100" preserveAspectRatio="none" role="img" aria-label={ar ? `الموجة الصوتية، المدة ${duration.toFixed(2)} ثانية` : `Decoded source waveform, ${duration.toFixed(2)} seconds`} className="mb-4 h-28 w-full rounded-lg bg-[#030b15] text-sky-400">
      <path d="M0 50H720" stroke="#1c3a50" />
      {peaks.map((value, i) => <line key={i} x1={i * 4 + 2} x2={i * 4 + 2} y1={50 - Math.max(1, value * 46)} y2={50 + Math.max(1, value * 46)} stroke="currentColor" strokeWidth="2" />)}
    </svg>}
    <audio aria-label={ar ? `تشغيل ${name}` : `Play ${name}`} src={url} controls className="w-full" />
  </div>
}

function HafizAvatarStage({
  state,
  speechBeatAt,
  micEnergy,
  ar,
  t,
}: {
  state: AvatarState
  speechBeatAt: number
  micEnergy: number
  ar: boolean
  t: AppTranslations
}) {
  const [failed, setFailed] = useState(false)

  const statusText =
    state === 'thinking'
      ? t.statusThinking
      : state === 'listening'
        ? t.statusListening
        : state === 'speaking'
          ? t.statusSpeaking
          : state === 'laughing'
            ? t.statusLaughing
            : state === 'serious'
              ? t.statusSerious
              : t.statusReady

  return (
    <div
      data-testid="hafiz-startup-stage"
      data-avatar-state={state}
      className="relative isolate mx-auto flex h-[340px] w-full max-w-[700px] items-center justify-center sm:h-[410px] md:h-[470px]"
    >
      {/* Clean electric-blue ambient halo behind HAFIZ — intensifies on speaking/laughing, tightens on serious */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-[10%] top-[4%] bottom-[8%] rounded-full blur-3xl transition-all duration-700 ${
          state === 'thinking'
            ? 'scale-105 bg-[radial-gradient(ellipse,#00b7ff66_0%,#0052b444_50%,transparent_72%)]'
            : state === 'speaking' || state === 'listening' || state === 'laughing'
              ? 'scale-105 bg-[radial-gradient(ellipse,#00a6ff78_0%,#004ea845_50%,transparent_72%)]'
              : state === 'serious'
                ? 'scale-95 bg-[radial-gradient(ellipse,#0066cc48_0%,#00224a24_45%,transparent_70%)]'
                : 'bg-[radial-gradient(ellipse,#007bff4a_0%,#003b7a2c_48%,transparent_72%)]'
        }`}
      />

      {/* Falling blue Matrix numbers, equations, LED telemetry & neural thinking synapses */}
      <AiMatrixHalo state={state} />

      {/* Symmetrical glowing blue audio waveforms beside HAFIZ */}
      <SpeakingWaveAura state={state} speechBeatAt={speechBeatAt} micEnergy={micEnergy} />

      {/* Subtle holographic floor light arc grounding his leather jacket */}
      <svg
        viewBox="0 0 600 120"
        className="pointer-events-none absolute bottom-1 left-1/2 h-24 w-[94%] -translate-x-1/2 overflow-visible"
        aria-hidden="true"
      >
        <ellipse
          cx="300"
          cy="62"
          rx="215"
          ry="30"
          fill="none"
          stroke="#26c6ff"
          strokeWidth="1.8"
          strokeOpacity="0.55"
          strokeDasharray="150 42 22 24"
          className="drop-shadow-[0_0_8px_#00a6ff]"
        />
        <ellipse cx="300" cy="62" rx="172" ry="20" fill="none" stroke="#7aeaff" strokeOpacity="0.45" />
      </svg>

      {/* Large Centered Official Front-Facing HAFIZ Avatar */}
      {failed ? (
        <div className="relative z-10 grid place-items-center text-center">
          <Icon name="mic" className="h-24 w-24 text-cyan-300" />
          <p className="mt-2 text-sm text-sky-200">{ar ? 'تعذر تحميل صورة الشخصية الرسمية' : 'Official character unavailable'}</p>
        </div>
      ) : (
        <div className="relative z-10 flex h-[92%] w-[86%] max-w-[460px] items-center justify-center pb-5">
          <HafizFaceRig
            state={state}
            speechBeatAt={speechBeatAt}
            micEnergy={micEnergy}
            visible
            onError={() => setFailed(true)}
          />
        </div>
      )}

      {/* Sleek Live Status Pill */}
      <div
        role="status"
        className="pointer-events-none absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-cyan-400/55 bg-[#051428]/88 px-3.5 py-1.5 text-xs shadow-[0_0_26px_rgba(0,166,255,0.38),inset_0_1px_0_rgba(156,238,255,0.3)] backdrop-blur-md sm:gap-2.5 sm:px-4"
      >
        <span
          className={`h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#4ae8ff] ${
            state === 'speaking' || state === 'listening' || state === 'laughing'
              ? 'motion-safe:animate-ping'
              : state === 'thinking' || state === 'serious'
                ? 'motion-safe:animate-pulse'
                : ''
          }`}
        />
        <span dir="ltr" className="font-semibold tracking-[.16em] text-white">HAFIZ</span>
        <span className="text-sky-400/60">|</span>
        <span className="text-sm font-semibold text-cyan-200">
          {ar ? `حافظ · ${statusText}` : statusText}
        </span>
      </div>
    </div>
  )
}

export default function App() {
  const [route, setRoute] = useState(() => {
    if (new URLSearchParams(location.search).get('autostart') === '1') return 'studio/editor'
    return location.hash.slice(1) || 'welcome'
  })
  const [language, setLanguage] = useState<UiLanguage>(() => {
    const saved = load<string>('hafiz-language', 'ar')
    return saved === 'en' ? 'en' : 'ar'
  })
  const [voiceLanguage, setVoiceLanguage] = useState<VoiceLanguage>(() => {
    const saved = load<string>('hafiz-voice-lang', 'ar-EG')
    return saved === 'en-US' ? 'en-US' : 'ar-EG'
  })
  const [theme, setTheme] = useState<UiThemePreset>(() => {
    const saved = load<string>('hafiz-theme', 'midnight_blue')
    if (saved === 'graphite_gold' || saved === 'light_studio') return saved
    return 'midnight_blue'
  })
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    const saved = load<string>('hafiz-density', 'comfortable')
    return saved === 'compact' ? 'compact' : 'comfortable'
  })
  const [reduceMotion, setReduceMotion] = useState<boolean>(() => load('hafiz-reduce-motion', false))
  const [uiScale, setUiScale] = useState<number>(() => {
    const saved = load<number>('hafiz-ui-scale', 100)
    return saved === 112 || saved === 125 ? saved : 100
  })
  const [dockSide, setDockSide] = useState<DockSide>(() => load('hafiz-dock-side', language === 'ar' ? 'left' : 'right'))
  const [text, setText] = useState(() => load('hafiz-draft', ''))
  const [projects, setProjects] = useState<{ id: number; text: string; title: string }[]>(() => load('hafiz-projects', []))
  const [notice, setNotice] = useState('')
  const [lastReply, setLastReply] = useState('')
  const [state, setState] = useState<AvatarState>('idle')
  const [speechBeatAt, setSpeechBeatAt] = useState(0)
  const [levels, setLevels] = useState<number[]>(Array(40).fill(3))
  const [message, setMessage] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioName, setAudioName] = useState('')
  const [reference, setReference] = useState({ url: '', name: '' })
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>(() => load('hafiz-settings-tab', 'general'))
  const [speechEnabled, setSpeechEnabled] = useState(() => load('hafiz-speech', true))
  const [speechRate, setSpeechRate] = useState<number>(() => {
    const saved = load<number>('hafiz-speech-rate', 0.95)
    return typeof saved === 'number' && saved >= 0.75 && saved <= 1.25 ? saved : 0.95
  })
  const [bargeIn, setBargeIn] = useState(() => load('hafiz-barge-in', true))
  const [micMode, setMicMode] = useState<'push_to_talk' | 'continuous'>(() => load('hafiz-mic-mode', 'push_to_talk'))
  const [executionProfile, setExecutionProfile] = useState<ExecutionProfile>(() => {
    const saved = load<string>('hafiz-exec-profile', 'balanced_rtx5000')
    if (saved === 'max_speed' || saved === 'low_vram_coexist') return saved
    return 'balanced_rtx5000'
  })
  const [idleTimeoutSec, setIdleTimeoutSec] = useState<number>(() => load('hafiz-idle-timeout', 120))
  const [routerMode, setRouterMode] = useState<boolean>(() => load('hafiz-router-mode', true))
  const [vramMarginGb, setVramMarginGb] = useState<number>(() => load('hafiz-vram-margin', 2.0))
  const [singleModelLock, setSingleModelLock] = useState<boolean>(() => load('hafiz-single-model-lock', true))
  const [appInstallDir, setAppInstallDir] = useState<string>(() => load('hafiz-app-install-dir', DEFAULT_STORAGE_CONFIG.appInstallDir))
  const [modelDir, setModelDir] = useState<string>(() => load('hafiz-model-dir', DEFAULT_STORAGE_CONFIG.modelDownloadDir))
  const [setupMode, setSetupMode] = useState<ModelSetupMode>(() => {
    const saved = load<string>('hafiz-setup-mode', DEFAULT_STORAGE_CONFIG.setupMode)
    if (saved === 'hybrid_scan_then_download' || saved === 'download_all') return saved
    return 'scan_in_place'
  })
  const [scanPartitions, setScanPartitions] = useState<string[]>(() => load('hafiz-scan-partitions', DEFAULT_STORAGE_CONFIG.scanPartitions))
  const [inPlaceLinking, setInPlaceLinking] = useState<boolean>(() => load('hafiz-in-place-linking', DEFAULT_STORAGE_CONFIG.inPlaceLinking))
  const [perModelPaths, setPerModelPaths] = useState<Record<string, string>>(() => load('hafiz-per-model-paths', {}))
  const [downloadSpeedLimitMb, setDownloadSpeedLimitMb] = useState<number>(() => load('hafiz-dl-speed-limit', 0))
  const [autoResumeDownloads, setAutoResumeDownloads] = useState<boolean>(() => load('hafiz-auto-resume-dl', true))
  const [autoCheckBackend, setAutoCheckBackend] = useState<boolean>(() => load('hafiz-auto-check-backend', true))
  const [setupBannerDismissed, setSetupBannerDismissed] = useState<boolean>(() => load('hafiz-setup-banner-dismissed', false))
  const [backendState, setBackendState] = useState<BackendConnectionState>('DISCONNECTED')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [undo, setUndo] = useState<string[]>([])
  const [redo, setRedo] = useState<string[]>([])

  const backendRef = useRef<HafizBackendAdapter | null>(null)
  if (!backendRef.current) {
    backendRef.current = new HafizBackendAdapter()
  }

  const stream = useRef<MediaStream | null>(null)
  const context = useRef<AudioContext | null>(null)
  const frame = useRef(0)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestingMic = useRef(false)

  const isStartup = route === 'welcome' || route === 'conversation'
  const current = screens.find(s => s.path === route) || screens[0]
  const ar = language === 'ar'
  const t = getTranslations(language)
  const tokens = getThemeTokens(theme)
  const routingRule = resolveRequiredRoutingRule(route)
  const micEnergy = state === 'listening'
    ? Math.min(1, Math.max(0, (levels.reduce((sum, v) => sum + v, 0) / levels.length - 3) / 36))
    : 0

  useEffect(() => {
    document.title = ar ? 'حافظ بالعامية | HAFIZ New Generation' : 'HAFIZ In Slang | Windows 11 AI Studio'
    document.documentElement.lang = t.langCode
    document.documentElement.dir = t.dir
  }, [ar, t.langCode, t.dir])
  useEffect(() => {
    document.documentElement.style.fontSize = `${uiScale}%`
    return () => { document.documentElement.style.fontSize = '' }
  }, [uiScale])
  useEffect(() => {
    const fn = () => {
      setRoute(location.hash.slice(1) || 'welcome')
      setNotice('')
      setScannerOpen(false)
      setWizardOpen(false)
    }
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [])
  useEffect(() => { persist('hafiz-draft', text) }, [text])
  useEffect(() => { persist('hafiz-projects', projects) }, [projects])
  useEffect(() => { persist('hafiz-language', language) }, [language])
  useEffect(() => { persist('hafiz-voice-lang', voiceLanguage) }, [voiceLanguage])
  useEffect(() => { persist('hafiz-theme', theme) }, [theme])
  useEffect(() => { persist('hafiz-density', density) }, [density])
  useEffect(() => { persist('hafiz-reduce-motion', reduceMotion) }, [reduceMotion])
  useEffect(() => { persist('hafiz-ui-scale', uiScale) }, [uiScale])
  useEffect(() => { persist('hafiz-speech', speechEnabled) }, [speechEnabled])
  useEffect(() => { persist('hafiz-speech-rate', speechRate) }, [speechRate])
  useEffect(() => { persist('hafiz-barge-in', bargeIn) }, [bargeIn])
  useEffect(() => { persist('hafiz-mic-mode', micMode) }, [micMode])
  useEffect(() => { persist('hafiz-exec-profile', executionProfile) }, [executionProfile])
  useEffect(() => { persist('hafiz-idle-timeout', idleTimeoutSec) }, [idleTimeoutSec])
  useEffect(() => { persist('hafiz-router-mode', routerMode) }, [routerMode])
  useEffect(() => { persist('hafiz-vram-margin', vramMarginGb) }, [vramMarginGb])
  useEffect(() => { persist('hafiz-single-model-lock', singleModelLock) }, [singleModelLock])
  useEffect(() => { persist('hafiz-app-install-dir', appInstallDir) }, [appInstallDir])
  useEffect(() => { persist('hafiz-model-dir', modelDir) }, [modelDir])
  useEffect(() => { persist('hafiz-setup-mode', setupMode) }, [setupMode])
  useEffect(() => { persist('hafiz-scan-partitions', scanPartitions) }, [scanPartitions])
  useEffect(() => { persist('hafiz-in-place-linking', inPlaceLinking) }, [inPlaceLinking])
  useEffect(() => { persist('hafiz-per-model-paths', perModelPaths) }, [perModelPaths])
  useEffect(() => { persist('hafiz-dl-speed-limit', downloadSpeedLimitMb) }, [downloadSpeedLimitMb])
  useEffect(() => { persist('hafiz-auto-resume-dl', autoResumeDownloads) }, [autoResumeDownloads])
  useEffect(() => { persist('hafiz-auto-check-backend', autoCheckBackend) }, [autoCheckBackend])
  useEffect(() => { persist('hafiz-setup-banner-dismissed', setupBannerDismissed) }, [setupBannerDismissed])
  useEffect(() => { persist('hafiz-settings-tab', settingsTab) }, [settingsTab])
  useEffect(() => { persist('hafiz-dock-side', dockSide) }, [dockSide])
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])
  useEffect(() => () => { if (reference.url) URL.revokeObjectURL(reference.url) }, [reference.url])
  useEffect(() => () => {
    stream.current?.getTracks().forEach(track => track.stop())
    cancelAnimationFrame(frame.current)
    if (speechTimer.current) clearTimeout(speechTimer.current)
    if (thinkingTimer.current) clearTimeout(thinkingTimer.current)
    if (navTimer.current) clearTimeout(navTimer.current)
    void context.current?.close()
    if ('speechSynthesis' in window) speechSynthesis.cancel()
  }, [])

  function go(path: string) {
    if (navTimer.current) { clearTimeout(navTimer.current); navTimer.current = null }
    location.hash = path
    setRoute(path)
    setNotice('')
  }
  function edit(value: string) { setUndo(u => [...u.slice(-39), text]); setRedo([]); setText(value) }
  function blocked(customMessage?: string) { setNotice(customMessage || t.noticeCompanionBlocked) }
  function save() {
    if (!text.trim()) return setNotice(t.noticeEmptySave)
    setProjects(p => [{ id: Date.now(), title: text.trim().slice(0, 48), text }, ...p])
    setNotice(t.noticeSavedDraft)
  }
  function stopSpeaking() {
    if (speechTimer.current) { clearTimeout(speechTimer.current); speechTimer.current = null }
    if (thinkingTimer.current) { clearTimeout(thinkingTimer.current); thinkingTimer.current = null }
    if ('speechSynthesis' in window) speechSynthesis.cancel()
    setState('idle')
  }
  function handleCommandInputChange(nextValue: string) {
    if (bargeIn && state === 'speaking' && nextValue.length > message.length) {
      stopSpeaking()
    }
    setMessage(nextValue)
  }
  function handleExecutionProfileChange(nextProfile: ExecutionProfile) {
    setExecutionProfile(nextProfile)
    const defaults = getExecutionProfileDefaults(nextProfile)
    setVramMarginGb(defaults.vramMarginGb)
    setIdleTimeoutSec(defaults.idleTimeoutSec)
    setSingleModelLock(defaults.singleModelLock)
    setRouterMode(defaults.routerMode)
  }
  function handleTogglePartition(drive: string) {
    const normalized = normalizeWindowsPath(drive).toLowerCase()
    const exists = scanPartitions.some(p => normalizeWindowsPath(p).toLowerCase() === normalized)
    setScanPartitions(prev => (exists ? removeScanPartition(prev, drive) : addScanPartition(prev, drive)))
  }
  function handleAddPartition(rawPath: string) {
    setScanPartitions(prev => addScanPartition(prev, rawPath))
  }
  function handleRemovePartition(targetPath: string) {
    setScanPartitions(prev => removeScanPartition(prev, targetPath))
  }
  function handleSetModelPath(modelId: string, path: string) {
    setPerModelPaths(prev => ({ ...prev, [modelId]: normalizeWindowsPath(path) }))
  }
  function handleResetModelPath(modelId: string) {
    setPerModelPaths(prev => {
      const next = { ...prev }
      delete next[modelId]
      return next
    })
  }
  async function handleProbeBackend() {
    const adapter = backendRef.current!
    setBackendState('CONNECTING')
    const result = await adapter.probeHealth()
    setBackendState(result.connectionState)
    if (result.ok) {
      setNotice(ar ? `تم الاتصال بمحرك ويندوز المحلي (${result.data?.serviceVersion ?? 'ready'}).` : `Connected to local Windows backend (${result.data?.serviceVersion ?? 'ready'}).`)
    } else {
      setNotice(t.noticeCompanionBlocked)
    }
  }
  async function handlePurgeVram() {
    const adapter = backendRef.current!
    setBackendState('BUSY')
    const result = await adapter.purgeHafizVram()
    setBackendState(result.connectionState)
    if (result.ok) {
      setNotice(ar ? 'تم تفريغ نماذج حافظ الخاملة من ذاكرة GPU بأمان.' : 'Safely unloaded idle HAFIZ models from GPU memory.')
    } else {
      setNotice(t.noticePurgeBlocked)
    }
  }
  async function handleRunPartitionScan(indexSavePath: string) {
    const adapter = backendRef.current!
    setBackendState('BUSY')
    const result = await adapter.scanPartitions({
      partitions: scanPartitions,
      inPlaceLinking,
      indexSavePath,
    })
    setBackendState(result.connectionState)
    return result
  }

  function speak(value: string, options?: { silentNotice?: boolean }) {
    if (!value.trim()) return setNotice(t.noticeEnterTextSpeech)
    if (!speechEnabled) return setNotice(t.noticeEnableSpeech)
    stopSpeaking()
    setState('speaking')
    setSpeechBeatAt(performance.now())

    const estimatedMs = Math.max(3600, Math.min(9500, value.trim().length * 85))

    if ('speechSynthesis' in window) {
      let started = false
      const u = new SpeechSynthesisUtterance(value)
      u.lang = voiceLanguage
      u.rate = speechRate
      const voices = speechSynthesis.getVoices()
      const langPrefix = voiceLanguage.slice(0, 2)
      const matchedVoice =
        voices.find(v => v.lang.toLowerCase().replace('_', '-') === voiceLanguage.toLowerCase()) ||
        voices.find(v => v.lang.toLowerCase().startsWith(langPrefix))
      if (matchedVoice) u.voice = matchedVoice

      u.onstart = () => {
        started = true
        if (speechTimer.current) { clearTimeout(speechTimer.current); speechTimer.current = null }
        setState('speaking')
        setSpeechBeatAt(performance.now())
      }
      u.onboundary = () => setSpeechBeatAt(performance.now())
      u.onend = () => {
        if (speechTimer.current) { clearTimeout(speechTimer.current); speechTimer.current = null }
        setState('idle')
      }
      u.onerror = () => {
        if (!started && !speechTimer.current) {
          speechTimer.current = globalThis.setTimeout(() => { speechTimer.current = null; setState('idle') }, estimatedMs)
        } else if (started) {
          setState('idle')
        }
      }
      speechSynthesis.speak(u)
      speechTimer.current = globalThis.setTimeout(() => {
        if (!started) {
          speechTimer.current = globalThis.setTimeout(() => { speechTimer.current = null; setState('idle') }, estimatedMs)
        }
      }, 450)
      if (!options?.silentNotice) {
        setNotice(t.noticeBrowserSpeechActive)
      }
    } else {
      speechTimer.current = globalThis.setTimeout(() => { speechTimer.current = null; setState('idle') }, estimatedMs)
      if (!options?.silentNotice) {
        setNotice(t.noticeVisualSpeechOnly)
      }
    }
  }
  function triggerMood(mood: 'idle' | 'speaking' | 'laughing' | 'serious') {
    if (speechTimer.current) { clearTimeout(speechTimer.current); speechTimer.current = null }
    if (thinkingTimer.current) { clearTimeout(thinkingTimer.current); thinkingTimer.current = null }
    if ('speechSynthesis' in window) speechSynthesis.cancel()

    if (mood === 'speaking') {
      if (speechEnabled) {
        speak(welcomeVoiceLine, { silentNotice: true })
      } else {
        setState('speaking')
        setSpeechBeatAt(performance.now())
      }
      return
    }
    setState(mood)
    if (mood === 'laughing') {
      setSpeechBeatAt(performance.now())
    }
  }
  async function mic() {
    if (requestingMic.current) return
    if (bargeIn && state === 'speaking') stopSpeaking()
    if (stream.current) { stream.current.getTracks().forEach(track => track.stop()); stream.current = null; cancelAnimationFrame(frame.current); await context.current?.close(); setState('idle'); setLevels(Array(40).fill(3)); return }
    requestingMic.current = true
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      context.current = new AudioContext(); const analyser = context.current.createAnalyser(); analyser.fftSize = 128
      context.current.createMediaStreamSource(stream.current).connect(analyser); setState('listening')
      const values = new Uint8Array(analyser.frequencyBinCount)
      const update = () => { analyser.getByteFrequencyData(values); setLevels(Array.from(values.slice(0, 40), v => Math.max(3, v / 5))); frame.current = requestAnimationFrame(update) }; update()
    } catch { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; void context.current?.close(); setNotice(t.noticeMicDenied); setState('idle') }
    finally { requestingMic.current = false }
  }
  function askHafiz(rawInput?: string) {
    const query = (rawInput ?? message).trim()
    const intent = resolveHafizIntent(query)
    setMessage('')
    setNotice('')
    if (thinkingTimer.current) { clearTimeout(thinkingTimer.current); thinkingTimer.current = null }
    if (navTimer.current) { clearTimeout(navTimer.current); navTimer.current = null }
    if (speechTimer.current) { clearTimeout(speechTimer.current); speechTimer.current = null }
    if ('speechSynthesis' in window) speechSynthesis.cancel()

    const qLower = query.toLowerCase()
    if (/gpu|vram|ذاكرة|كارت/.test(qLower)) setSettingsTab('gpuGuard')
    else if (/تشخيص|diagnostic/.test(qLower)) setSettingsTab('diagnostics')
    else if (/orchestrator|منسق/.test(qLower)) setSettingsTab('orchestrator')

    setState('thinking')
    thinkingTimer.current = globalThis.setTimeout(() => {
      thinkingTimer.current = null
      const reply = ar ? intent.replyAr : intent.replyEn
      setLastReply(reply)
      const spokenLine = voiceLanguage === 'ar-EG' ? intent.replyAr : intent.replyEn
      if (speechEnabled) {
        speak(spokenLine, { silentNotice: true })
      } else {
        setState('speaking')
        setSpeechBeatAt(performance.now())
        speechTimer.current = globalThis.setTimeout(() => {
          speechTimer.current = null
          setState('idle')
        }, 3200)
      }
      if (intent.route && intent.route !== route) {
        navTimer.current = globalThis.setTimeout(() => {
          navTimer.current = null
          location.hash = intent.route!
          setRoute(intent.route!)
        }, 850)
      }
    }, 520)
  }
  function exportDiagnostics() {
    const payload = {
      generatedAt: new Date().toISOString(),
      environment: 'web-preview',
      backendConnectionState: backendState,
      companionConnected: backendState === 'READY',
      liveGpuTelemetry: null,
      targetHardwareSpec: TARGET_HARDWARE_SPEC,
      preferences: {
        uiLanguage: t.langCode,
        voiceLanguage,
        theme,
        density,
        reduceMotion,
        uiScalePercent: uiScale,
        dockSide,
        speechRate,
        micMode,
        bargeIn,
        executionProfile,
        idleUnloadTimeoutSec: idleTimeoutSec,
        llamaCppRouterMode: routerMode,
        vramSafetyMarginGb: vramMarginGb,
        singleModelLock,
        appInstallDir,
        modelDownloadDir: modelDir,
        setupMode,
        scanPartitions,
        inPlaceLinking,
        perModelPaths,
        downloadSpeedLimitMb,
        autoResumeDownloads,
        autoCheckBackend,
        savedBrowserProjects: projects.length,
      },
      voiceLatencyStages: VOICE_LATENCY_STAGES,
      verificationMatrix: VERIFICATION_MATRIX,
      modelCatalog: MODEL_CATALOG,
      actionContracts: ACTION_CONTRACTS,
    }
    downloadFile(JSON.stringify(payload, null, 2), 'HAFIZ-diagnostic-report.json', 'application/json;charset=utf-8')
    setNotice(t.noticeReportExported)
  }
  function file(selected?: File, target: 'source' | 'reference' = 'source') {
    if (!selected) return
    if (selected.type.startsWith('audio/') || /\.(mp3|wav|flac|m4a|ogg|webm)$/i.test(selected.name)) {
      if (selected.size > 150 * 1024 * 1024) return setNotice(t.noticeAudioTooLarge)
      if (target === 'reference') setReference({ url: URL.createObjectURL(selected), name: selected.name })
      else { setAudioUrl(URL.createObjectURL(selected)); setAudioName(selected.name) }
    } else if (/\.txt$/i.test(selected.name)) void selected.text().then(edit).catch(() => setNotice(t.noticeTxtReadError))
    else setNotice(t.noticeUnsupportedFile)
  }

  const aiAction = (key: string) => (
    <button key={key} type="button" className={tokens.button} onClick={() => blocked()}>
      <Icon name="spark" />{t.aiActions[key] || key}
    </button>
  )
  const upload = (label: string, target: 'source' | 'reference') => (
    <label
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); file(e.dataTransfer.files[0], target) }}
      className={`${tokens.panel} flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-5 text-center text-sm hover:border-cyan-400`}
    >
      <Icon name="download" className={`h-8 w-8 ${tokens.textAccent}`} />
      <span>{label}</span>
      <span className={`text-xs ${tokens.textMuted}`}>{t.uploadHint}</span>
      <input aria-label={label} type="file" accept="audio/*" className="max-w-full text-sm" onChange={e => file(e.target.files?.[0], target)} />
    </label>
  )
  const editor = (
    <textarea
      aria-label={t.editorAria}
      dir={text.trim() ? 'auto' : t.dir}
      value={text}
      onChange={e => edit(e.target.value)}
      placeholder={t.editorPlaceholder}
      className={`${tokens.field} min-h-[330px] resize-y text-lg leading-9`}
    />
  )

  const welcomeVoiceLine =
    voiceLanguage === 'ar-EG'
      ? 'أهلاً بيك يا فنان، أنا حافظ. قولي تحب نبدأ بإيه النهارده؟'
      : 'Welcome. I am HAFIZ — tell me what you want to create today.'

  const processingModes = route.endsWith('clone')
    ? (ar
      ? ['تحويل الكلام — speech_v2', 'تحويل الغناء — singing_v1', 'تحويل النص المصري لصوت — text_omnivoice']
      : ['Speech Conversion — speech_v2', 'Singing Conversion — singing_v1', 'Egyptian Text-to-Voice — text_omnivoice'])
    : route.endsWith('separation')
      ? (ar
        ? ['فصل هجين 6 تراكات — hybrid_6stems', 'فوكال + مزيكا — bs_roformer_2stems', 'فصل سريع 6 تراكات — demucs_6s_fast']
        : ['Hybrid 6-Stems — hybrid_6stems', 'Vocal + Instrumental — bs_roformer_2stems', 'Fast 6-Stems — demucs_6s_fast'])
      : (ar
        ? ['تفريغ بالعامية المصرية', 'تفريغ عام متعدد اللغات', 'تفريغ منقّى بدون تشويش', 'تفريغ + توليد برومبت موسيقي', 'تحليل موسيقي شامل']
        : ['Egyptian transcription', 'General transcription', 'Clean transcription', 'Transcription + music prompt', 'Comprehensive musical analysis'])

  const genreOptions: { value: string; arLabel: string; enLabel: string }[] = [
    { value: 'mahraganat', arLabel: 'مهرجانات (Mahraganat)', enLabel: 'Mahraganat' },
    { value: 'shaabi', arLabel: 'شعبي مصري (Shaabi)', enLabel: 'Egyptian Shaabi' },
    { value: 'trap_shaabi', arLabel: 'تراب شعبي (Trap Shaabi)', enLabel: 'Trap Shaabi' },
    { value: 'rap_egy', arLabel: 'راب مصري (Egyptian Rap)', enLabel: 'Egyptian Rap' },
    { value: 'pop_egy', arLabel: 'بوب مصري (Egyptian Pop)', enLabel: 'Egyptian Pop' },
    { value: 'romantic', arLabel: 'رومانسي (Romantic)', enLabel: 'Romantic' },
    { value: 'afrobeat', arLabel: 'أفروبيت (Afrobeat)', enLabel: 'Afrobeat' },
    { value: 'rnb', arLabel: 'آر أند بي (R&B)', enLabel: 'R&B' },
    { value: 'hiphop', arLabel: 'هيب هوب (Hip-Hop)', enLabel: 'Hip-Hop' },
    { value: 'pop', arLabel: 'بوب (Pop)', enLabel: 'Pop' },
    { value: 'rock', arLabel: 'روك (Rock)', enLabel: 'Rock' },
    { value: 'jazz', arLabel: 'جاز (Jazz)', enLabel: 'Jazz' },
    { value: 'lofi', arLabel: 'لوفاي (Lo-Fi)', enLabel: 'Lo-Fi' },
    { value: 'indie', arLabel: 'إندي (Indie)', enLabel: 'Indie' },
    { value: 'classical', arLabel: 'طربي / كلاسيكي (Classical)', enLabel: 'Classical / Tarab' },
  ]

  const topNavItems: { path: string; label: string; icon: IconName }[] = [
    { path: 'studio/editor', label: t.navLyricsStudio, icon: 'pen' },
    { path: 'audio/analysis', label: t.navAudioWeb, icon: 'audio' },
    { path: 'voice_stems/clone', label: t.navVoiceStems, icon: 'mic' },
    { path: 'setup/general', label: t.navSettings, icon: 'settings' },
  ]

  const workspacePad = density === 'compact' ? 'p-4 pb-32 md:p-6 md:pb-32' : 'p-5 pb-36 md:p-9 md:pb-36'

  function handleLanguageSwitch(nextLang: UiLanguage) {
    setLanguage(nextLang)
    setDockSide(nextLang === 'ar' ? 'left' : 'right')
  }

  return (
    <div
      dir={t.dir}
      data-theme={theme}
      className={`flex min-h-screen flex-col overflow-x-hidden ${isStartup ? 'bg-[#050b13] text-slate-100 selection:bg-cyan-700' : tokens.rootBg}`}
      style={{ fontFamily: ar ? 'var(--font-ui-rtl)' : 'var(--font-ui-ltr)' }}
    >
      {isStartup ? (
        <header className="relative z-30 flex min-h-16 items-center justify-between gap-4 px-5 py-2 md:px-9">
          <button
            type="button"
            className="flex min-h-11 shrink-0 items-center rounded-lg py-1 text-start transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={() => go('welcome')}
            aria-label={t.homeAria}
          >
            <img src="/assets/aistudio/image_caee2680.png" alt="HAFIZ BEL 3AMEYA" className="h-12 w-auto max-w-[210px] object-contain sm:h-14 sm:max-w-[250px]" />
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-800/70 bg-[#071525]/70 px-3 text-xs text-slate-100 transition hover:border-cyan-400/60 hover:bg-cyan-400/10"
              onClick={() => handleLanguageSwitch(ar ? 'en' : 'ar')}
            >
              {t.switchLangLabel}
            </button>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-sky-700/60 bg-sky-500/10 px-3 text-xs text-sky-100 transition hover:border-cyan-400/70 hover:bg-sky-400/20 sm:px-3.5"
              onClick={() => go('studio/editor')}
            >
              <span>{t.enterWorkspace}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </header>
      ) : (
        <header className={`relative z-30 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b px-5 md:px-8 ${tokens.headerBar}`}>
          <button
            type="button"
            className="flex min-h-11 shrink-0 items-center rounded-lg py-1.5 text-start transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            onClick={() => go('welcome')}
            aria-label={t.homeAria}
          >
            <img src="/assets/aistudio/image_caee2680.png" alt="HAFIZ BEL 3AMEYA" className="h-14 w-auto max-w-[230px] object-contain sm:h-16 sm:max-w-[270px]" />
          </button>
          <nav aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'} className="order-3 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {topNavItems.map(item => (
              <button
                key={item.path}
                type="button"
                onClick={() => go(item.path)}
                className={`${tokens.button} shrink-0 border-transparent bg-transparent px-3 ${
                  current.group === item.path.split('/')[0] ? tokens.buttonActive : tokens.textMuted
                }`}
              >
                <Icon name={item.icon} />{item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button type="button" className={`${tokens.button} px-3`} onClick={() => handleLanguageSwitch(ar ? 'en' : 'ar')}>
              {t.switchLangLabel}
            </button>
            <span className={`hidden h-5 w-px lg:block ${tokens.isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
            <button type="button" aria-label={t.openSettingsAria} className={`${tokens.button} border-transparent px-2`} onClick={() => go('setup/general')}>
              <Icon name="settings" />
            </button>
          </div>
        </header>
      )}

      <div className="flex flex-1">
        {!isStartup && (
          <aside className={`z-20 hidden w-[76px] shrink-0 flex-col items-center gap-4 border-e py-7 lg:flex ${tokens.sidebar}`}>
            {(['welcome', 'studio/editor', 'audio/analysis', 'voice_stems/clone', 'projects'] as const).map(path => {
              const s = screens.find(item => item.path === path)!
              const label = t.screenTitles[path] || path
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => go(path)}
                  aria-label={label}
                  title={label}
                  className={`grid h-12 w-12 place-items-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    route === path ? `border ${tokens.buttonActive}` : `${tokens.textMuted} hover:bg-sky-500/10`
                  }`}
                >
                  <Icon name={s.icon} />
                </button>
              )
            })}
            <div className="mt-auto flex flex-col gap-3">
              {(['setup/models', 'setup/downloads', 'setup/general'] as const).map(path => {
                const label = t.screenTitles[path]
                const iconName: IconName = path === 'setup/general' ? 'settings' : path === 'setup/downloads' ? 'download' : 'layers'
                return (
                  <button
                    key={path}
                    type="button"
                    aria-label={label}
                    title={label}
                    onClick={() => go(path)}
                    className={`grid h-11 w-11 place-items-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                      route === path ? `border ${tokens.buttonActive}` : `${tokens.textMuted} hover:bg-sky-500/10`
                    }`}
                  >
                    <Icon name={iconName} />
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        <main className="relative isolate flex min-w-0 flex-1 flex-col overflow-hidden">
          <CalligraphyBackground reduceMotion={reduceMotion} light={!isStartup && tokens.isLight} />

          {isStartup ? (
            <section
              aria-label={t.startupRegionAria}
              className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-2 sm:px-6"
            >
              {/* Large Centered Living HAFIZ Avatar with Clean Futuristic Blue AI Atmosphere */}
              <HafizAvatarStage state={state} speechBeatAt={speechBeatAt} micEnergy={micEnergy} ar={ar} t={t} />

              {/* Clean Conversational Interaction Console directly below HAFIZ */}
              <div className="relative z-20 mt-4 w-full max-w-[760px] text-center">
                <h1 className="text-lg font-medium text-sky-100 sm:text-xl" aria-live="polite">
                  {lastReply || t.startupGreeting}
                </h1>

                {/* Unified Voice + Text + Facial Expression Capsule */}
                <div className="mx-auto mt-4 max-w-[650px] rounded-2xl border border-sky-500/40 bg-[#061528]/80 p-2.5 shadow-[0_12px_40px_rgba(0,12,28,0.65),0_0_26px_rgba(0,148,255,0.16),inset_0_1px_0_rgba(125,220,255,0.2)] backdrop-blur-xl">
                  <form
                    onSubmit={e => { e.preventDefault(); askHafiz() }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      aria-label={state === 'listening' ? t.micStopAria : t.micStartAria}
                      aria-pressed={state === 'listening'}
                      onClick={() => void mic()}
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                        state === 'listening'
                          ? 'border-cyan-300 bg-cyan-400/25 text-cyan-100 shadow-[0_0_24px_#00b7ff88] motion-safe:animate-pulse'
                          : 'border-cyan-400/50 bg-sky-500/15 text-cyan-200 hover:border-cyan-300 hover:bg-sky-400/25'
                      }`}
                    >
                      <Icon name="mic" className="h-5 w-5" />
                    </button>

                    <input
                      aria-label={t.commandInputAria}
                      value={message}
                      onChange={e => handleCommandInputChange(e.target.value)}
                      placeholder={t.commandPlaceholder}
                      className="min-h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-slate-100 outline-none placeholder:text-slate-400"
                    />

                    <button
                      type="button"
                      onClick={() => (state === 'speaking' ? stopSpeaking() : speak(welcomeVoiceLine, { silentNotice: true }))}
                      aria-label={state === 'speaking' ? t.voiceStopAria : t.voicePlayAria}
                      title={state === 'speaking' ? t.voiceStopAria : t.voicePlayAria}
                      className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                        state === 'speaking'
                          ? 'border-cyan-300 bg-cyan-400/25 text-cyan-100'
                          : 'border-sky-700/60 bg-sky-950/50 text-sky-200 hover:border-cyan-400/70'
                      }`}
                    >
                      <Icon name="audio" className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {state === 'speaking' ? t.voiceStopLabel : t.voicePlayLabel}
                      </span>
                    </button>

                    <button
                      type="submit"
                      aria-label={t.sendCommandAria}
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-cyan-400/60 bg-sky-500/25 text-cyan-100 transition hover:bg-sky-400/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <Icon name="arrow" className={`h-5 w-5 ${ar ? 'rotate-180' : ''}`} />
                    </button>
                  </form>

                  {/* Interactive Facial Expression Quick Controls (Speaking / Laughing / Serious / Calm) */}
                  <div
                    role="group"
                    aria-label={t.moodGroupAria}
                    className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 border-t border-sky-900/70 pt-2.5"
                  >
                    {([
                      ['speaking', t.moodSpeaking],
                      ['laughing', t.moodLaughing],
                      ['serious', t.moodSerious],
                      ['idle', t.moodCalm],
                    ] as const).map(([moodId, label]) => {
                      const active = state === moodId
                      return (
                        <button
                          key={moodId}
                          type="button"
                          data-testid={`mood-btn-${moodId}`}
                          aria-pressed={active}
                          onClick={() => triggerMood(moodId)}
                          className={`min-h-8 rounded-lg border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                            active
                              ? 'border-cyan-300 bg-cyan-400/25 font-medium text-cyan-100 shadow-[0_0_16px_rgba(0,183,255,0.28)]'
                              : 'border-sky-800/70 bg-sky-950/50 text-sky-200 hover:border-cyan-400/70 hover:bg-sky-500/15'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {state === 'listening' && (
                    <div className="mt-2.5 flex h-7 items-center justify-center gap-[3px] px-4" aria-label={ar ? 'مستوى الميكروفون المباشر' : 'Live microphone levels'}>
                      {levels.slice(0, 32).map((v, i) => (
                        <span key={i} className="w-[3px] rounded-full bg-cyan-300/90" style={{ height: `${Math.min(24, v)}px` }} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Minimal Conversational Quick Intents — HAFIZ responds & opens the requested section */}
                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2" role="group" aria-label={t.quickCommandsAria}>
                  {t.quickChips.map(item => (
                    <button
                      key={item.cmd}
                      type="button"
                      onClick={() => askHafiz(item.cmd)}
                      className="min-h-9 rounded-full border border-sky-700/55 bg-[#071525]/75 px-3.5 py-1.5 text-xs text-sky-100 transition hover:border-cyan-300/80 hover:bg-sky-500/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Subtle Non-Blocking First-Run Setup Choice Strip (never covers HAFIZ's face) */}
                {!setupBannerDismissed && (
                  <div
                    data-testid="startup-setup-banner"
                    className="mx-auto mt-3.5 flex max-w-[650px] flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-800/60 bg-[#071525]/75 px-3.5 py-2 text-xs text-sky-200"
                  >
                    <span className="text-start">{t.startupSetupBanner}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setScannerOpen(true)}
                        className="rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-2.5 py-1 text-[11px] text-cyan-100 transition hover:bg-cyan-400/25"
                      >
                        {t.scanPartitionsAction}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardOpen(true)}
                        className="rounded-lg border border-sky-700/70 bg-sky-500/15 px-2.5 py-1 text-[11px] text-sky-100 transition hover:border-cyan-400"
                      >
                        {t.startupSetupCta}
                      </button>
                      <button
                        type="button"
                        aria-label={t.dismissNoticeAria}
                        onClick={() => setSetupBannerDismissed(true)}
                        className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <section className={`relative z-10 mx-auto w-full max-w-[1500px] flex-1 ${workspacePad}`}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className={`mb-1.5 text-xs tracking-[.12em] ${tokens.titleAccent}`}>
                    {ar ? 'حافظ' : 'HAFIZ'} / {t.groupLabels[current.group] || t.groupLabels['']}
                  </p>
                  <h1 className={`text-2xl font-medium sm:text-3xl ${tokens.textPrimary}`}>{t.screenTitles[current.path]}</h1>
                  <p className={`mt-1.5 text-xs ${tokens.textMuted}`}>
                    <span className={tokens.titleAccent}>{ar ? 'منسّق المهام:' : 'Task Orchestrator:'}</span>{' '}
                    {ar ? routingRule.enginesAr : routingRule.enginesEn}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={tokens.button} onClick={() => go('projects')}>
                    <Icon name="folder" />{t.navProjects}
                  </button>
                </div>
              </div>

              <nav aria-label={ar ? 'أدوات مساحة العمل' : 'Workspace tools'} className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {screens.filter(s => s.group && s.group === current.group).map(s => (
                  <button
                    key={s.path}
                    type="button"
                    onClick={() => go(s.path)}
                    className={`${tokens.button} shrink-0 ${s.path === route ? tokens.buttonActive : ''}`}
                  >
                    {t.screenTitles[s.path]}
                  </button>
                ))}
              </nav>

              {route.startsWith('studio/') && (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button type="button" className={tokens.button} onClick={save}>{t.saveDraft}</button>
                    <label className={`${tokens.button} cursor-pointer`}>
                      {t.openTxt}
                      <input aria-label={t.openTxtAria} type="file" accept=".txt" className="hidden" onChange={e => file(e.target.files?.[0])} />
                    </label>
                    <button type="button" className={tokens.button} onClick={() => downloadFile(text)}>{t.exportTxt}</button>
                    <button
                      type="button"
                      className={tokens.button}
                      onClick={() => void navigator.clipboard.writeText(text).then(() => setNotice(t.noticeCopied), () => setNotice(t.noticeClipboardUnavailable))}
                    >
                      {t.copyText}
                    </button>
                    <button type="button" className={tokens.button} onClick={() => speak(text)}>{t.readText}</button>
                    <button type="button" className={tokens.button} onClick={() => edit('')}>{t.clearText}</button>
                  </div>

                  {route === 'studio/songwriting' && (
                    <div className={`${tokens.panel} mb-4 grid gap-4 p-5 md:grid-cols-3`}>
                      <label className="text-sm">
                        {t.genreLabel}
                        <select aria-label={t.genreLabel} className={`${tokens.field} mt-2`}>
                          {genreOptions.map(g => (
                            <option key={g.value} value={g.value}>{ar ? g.arLabel : g.enLabel}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm">
                        {t.moodLabel}
                        <input className={`${tokens.field} mt-2`} placeholder={t.moodPlaceholder} />
                      </label>
                      <label className="text-sm">
                        {t.arrangementLabel}
                        <input className={`${tokens.field} mt-2`} placeholder={t.arrangementPlaceholder} />
                      </label>
                    </div>
                  )}

                  {route === 'studio/diacritics' && (
                    <div className="mb-4 flex flex-wrap gap-3">
                      <select aria-label={t.addressSelectAria} className={`${tokens.field} max-w-52`}>
                        {t.addressOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                      {['Smart Diacritics', 'Suno Phonetic', 'Connected Egyptian', 'Proofread'].map(aiAction)}
                      <button type="button" className={tokens.button} onClick={() => edit(text.replace(/[\u064B-\u065F\u0670]/g, ''))}>
                        {t.stripDiacriticsLocal}
                      </button>
                    </div>
                  )}

                  <div className={`${tokens.panel} p-4`}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-sm ${tokens.textMuted}`}>
                        {route === 'studio/songwriting' ? t.writingSpaceSong : route === 'studio/rhymes' ? t.writingSpaceRhymes : t.writingSpaceDefault}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={tokens.button}
                          disabled={!undo.length}
                          onClick={() => { setRedo(r => [...r, text]); setText(undo[undo.length - 1]); setUndo(u => u.slice(0, -1)) }}
                        >
                          {t.undo}
                        </button>
                        <button
                          type="button"
                          className={tokens.button}
                          disabled={!redo.length}
                          onClick={() => { setUndo(u => [...u, text]); setText(redo[redo.length - 1]); setRedo(r => r.slice(0, -1)) }}
                        >
                          {t.redo}
                        </button>
                      </div>
                    </div>
                    {editor}
                    <div className={`mt-3 flex flex-wrap justify-between gap-2 text-xs ${tokens.textMuted}`}>
                      <span>{t.editorFooterInfo}</span>
                      <span>
                        {text.trim() ? text.trim().split(/\s+/).length : 0} {t.wordsLabel} · {text.length} {t.charsLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(route === 'studio/songwriting'
                      ? ['Compose Song', 'Write Lyrics', 'Analyze Lyrics', 'Generate Suno / Udio Prompts']
                      : route === 'studio/rhymes'
                        ? ['Find Egyptian Rhymes', 'Rewrite Line', 'Inspect Pronunciation', 'Check Meaning']
                        : ['Smart Diacritics', 'Analyze Lyrics']
                    ).map(aiAction)}
                  </div>
                </>
              )}

              {(route === 'audio/analysis' || route.startsWith('voice_stems/')) && (
                <>
                  <div className="grid gap-5 md:grid-cols-2">
                    {upload(t.uploadSourceAudio, 'source')}
                    {route.endsWith('clone') ? (
                      upload(t.uploadReferenceVoice, 'reference')
                    ) : (
                      <div className={`${tokens.panel} p-5`}>
                        <label className="text-sm">
                          {t.youtubeUrlLabel}
                          <input dir="ltr" aria-label={t.youtubeUrlLabel} className={`${tokens.field} mt-3 font-mono text-xs`} placeholder={t.youtubePlaceholder} />
                        </label>
                        <p className={`mt-4 text-sm ${tokens.textMuted}`}>{t.youtubeNote}</p>
                      </div>
                    )}
                  </div>
                  <div className={route.endsWith('clone') ? 'grid gap-5 md:grid-cols-2' : ''}>
                    {audioUrl && <AudioPreview url={audioUrl} name={audioName} t={t} ar={ar} panelClass={tokens.panel} textAccentClass={tokens.textAccent} />}
                    {route.endsWith('clone') && reference.url && <AudioPreview url={reference.url} name={reference.name} t={t} ar={ar} panelClass={tokens.panel} textAccentClass={tokens.textAccent} />}
                  </div>
                  <div className={`${tokens.panel} mt-5 space-y-5 p-5`}>
                    <label className="block text-sm">
                      {t.processingModeLabel}
                      <select aria-label={t.processingModeLabel} className={`${tokens.field} mt-2`}>
                        {processingModes.map(x => <option key={x}>{x}</option>)}
                      </select>
                    </label>
                    {route.endsWith('clone') && (
                      <label className="block text-sm">
                        {t.pitchShiftLabel}
                        <input aria-label={t.pitchShiftLabel} type="range" min="-12" max="12" defaultValue="0" className="mx-3 align-middle accent-sky-500" />
                        <span className={`text-xs ${tokens.textMuted}`}>{t.pitchShiftRange}</span>
                      </label>
                    )}
                    <button type="button" className={`${tokens.button} ${tokens.buttonAccent}`} onClick={() => blocked()}>
                      <Icon name="play" />{t.startProcessing}
                    </button>
                    <p className={`text-sm ${tokens.textMuted}`}>{t.noProcessedAudio}</p>
                  </div>
                </>
              )}

              {route === 'audio/web' && (
                <div className={`${tokens.panel} space-y-5 p-6`}>
                  <label className="block text-sm">
                    {t.sourceUrlLabel}
                    <input dir="ltr" className={`${tokens.field} mt-2 font-mono text-xs`} placeholder={t.sourceUrlPlaceholder} />
                  </label>
                  <label className="block text-sm">
                    {t.researchQueryLabel}
                    <input className={`${tokens.field} mt-2`} placeholder={t.researchQueryPlaceholder} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Extract Available Lyrics', 'Research & Generate Prompt', 'Egyptian Phonetic Processing'].map(aiAction)}
                  </div>
                  <p className={`text-sm ${tokens.textMuted}`}>{t.webAgentOffline}</p>
                </div>
              )}

              {(route === 'setup/models' || route === 'setup/downloads') && (
                <ModelManagerView
                  mode={route === 'setup/models' ? 'models' : 'downloads'}
                  ar={ar}
                  t={t}
                  theme={theme}
                  appInstallDir={appInstallDir}
                  onAppInstallDirChange={setAppInstallDir}
                  modelDir={modelDir}
                  onModelDirChange={setModelDir}
                  scanPartitions={scanPartitions}
                  inPlaceLinking={inPlaceLinking}
                  onInPlaceLinkingChange={setInPlaceLinking}
                  perModelPaths={perModelPaths}
                  onSetModelPath={handleSetModelPath}
                  onResetModelPath={handleResetModelPath}
                  backendState={backendState}
                  onProbeBackend={() => void handleProbeBackend()}
                  onOpenScanner={() => setScannerOpen(true)}
                  onBlocked={blocked}
                  onOpenWizard={() => setWizardOpen(true)}
                />
              )}

              {route === 'setup/general' && (
                <SettingsCenterView
                  ar={ar}
                  t={t}
                  activeTab={settingsTab}
                  onTabChange={setSettingsTab}
                  language={language}
                  onLanguageChange={handleLanguageSwitch}
                  voiceLanguage={voiceLanguage}
                  onVoiceLanguageChange={setVoiceLanguage}
                  theme={theme}
                  onThemeChange={setTheme}
                  density={density}
                  onDensityChange={setDensity}
                  reduceMotion={reduceMotion}
                  onReduceMotionChange={setReduceMotion}
                  uiScale={uiScale}
                  onUiScaleChange={setUiScale}
                  dockSide={dockSide}
                  onDockSideChange={setDockSide}
                  speechEnabled={speechEnabled}
                  onSpeechEnabledChange={setSpeechEnabled}
                  speechRate={speechRate}
                  onSpeechRateChange={setSpeechRate}
                  bargeIn={bargeIn}
                  onBargeInChange={setBargeIn}
                  micMode={micMode}
                  onMicModeChange={setMicMode}
                  executionProfile={executionProfile}
                  onExecutionProfileChange={handleExecutionProfileChange}
                  idleTimeoutSec={idleTimeoutSec}
                  onIdleTimeoutSecChange={setIdleTimeoutSec}
                  routerMode={routerMode}
                  onRouterModeChange={setRouterMode}
                  vramMarginGb={vramMarginGb}
                  onVramMarginGbChange={setVramMarginGb}
                  singleModelLock={singleModelLock}
                  onSingleModelLockChange={setSingleModelLock}
                  appInstallDir={appInstallDir}
                  onAppInstallDirChange={setAppInstallDir}
                  modelDir={modelDir}
                  onModelDirChange={setModelDir}
                  scanPartitions={scanPartitions}
                  onTogglePartition={handleTogglePartition}
                  inPlaceLinking={inPlaceLinking}
                  onInPlaceLinkingChange={setInPlaceLinking}
                  downloadSpeedLimitMb={downloadSpeedLimitMb}
                  onDownloadSpeedLimitChange={setDownloadSpeedLimitMb}
                  autoResumeDownloads={autoResumeDownloads}
                  onAutoResumeDownloadsChange={setAutoResumeDownloads}
                  manualOverridesCount={Object.keys(perModelPaths).length}
                  autoCheckBackend={autoCheckBackend}
                  onAutoCheckBackendChange={setAutoCheckBackend}
                  backendState={backendState}
                  onProbeBackend={() => void handleProbeBackend()}
                  onOpenScanner={() => setScannerOpen(true)}
                  savedProjectsCount={projects.length}
                  avatarState={state}
                  onToggleMic={() => void mic()}
                  onPurgeVram={() => void handlePurgeVram()}
                  onBlocked={() => blocked()}
                  onExportDiagnostics={exportDiagnostics}
                  onOpenWizard={() => setWizardOpen(true)}
                />
              )}

              {route === 'projects' && (
                <>
                  <input
                    aria-label={t.searchProjectsAria}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={`${tokens.field} mb-5`}
                    placeholder={t.searchProjectsPlaceholder}
                  />
                  {projects.length === 0 ? (
                    <div className={`${tokens.panel} py-20 text-center`}>
                      <Icon name="folder" className={`mx-auto mb-5 h-10 w-10 ${tokens.textAccent}`} />
                      <h2 className="text-xl">{t.projectsEmptyTitle}</h2>
                      <p className={`my-4 text-sm ${tokens.textMuted}`}>{t.projectsEmptyDesc}</p>
                      <button type="button" className={tokens.button} onClick={() => go('studio/editor')}>
                        {t.createFirstProject}
                      </button>
                    </div>
                  ) : (
                    projects
                      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
                      .map(p => (
                        <div key={p.id} className={`${tokens.panel} mb-3 flex flex-wrap items-center gap-3 p-5`}>
                          {renamingId === p.id ? (
                            <form
                              className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                              onSubmit={e => {
                                e.preventDefault()
                                if (renameDraft.trim()) {
                                  setProjects(ps => ps.map(x => x.id === p.id ? { ...x, title: renameDraft.trim() } : x))
                                }
                                setRenamingId(null)
                              }}
                            >
                              <input
                                aria-label={t.projectRenamePrompt}
                                value={renameDraft}
                                onChange={e => setRenameDraft(e.target.value)}
                                className={`${tokens.field} max-w-sm py-2`}
                                autoFocus
                              />
                              <button type="submit" className={`${tokens.button} ${tokens.buttonAccent}`}>
                                {t.saveDraft}
                              </button>
                              <button type="button" className={tokens.button} onClick={() => setRenamingId(null)}>
                                {t.floatingHideBtn}
                              </button>
                            </form>
                          ) : (
                            <span className="min-w-0 flex-1 truncate">{p.title}</span>
                          )}
                          <button type="button" className={tokens.button} onClick={() => { edit(p.text); go('studio/editor') }}>
                            {t.projectOpen}
                          </button>
                          <button
                            type="button"
                            className={tokens.button}
                            onClick={() => { setRenamingId(p.id); setRenameDraft(p.title) }}
                          >
                            {t.projectRename}
                          </button>
                          <button
                            type="button"
                            className={tokens.button}
                            onClick={() => setProjects(ps => [{ ...p, id: Date.now(), title: `${p.title} ${t.projectCopySuffix}` }, ...ps])}
                          >
                            {t.projectDuplicate}
                          </button>
                          <button type="button" className={tokens.button} onClick={() => downloadFile(p.text)}>
                            {t.projectExport}
                          </button>
                          {confirmDeleteId === p.id ? (
                            <button
                              type="button"
                              className={`${tokens.button} border-rose-400/70 bg-rose-500/20 text-rose-600 dark:text-rose-100`}
                              onClick={() => {
                                setProjects(ps => ps.filter(x => x.id !== p.id))
                                setConfirmDeleteId(null)
                              }}
                            >
                              {t.projectDeleteConfirm}
                            </button>
                          ) : (
                            <button type="button" className={tokens.button} onClick={() => setConfirmDeleteId(p.id)}>
                              {t.projectDelete}
                            </button>
                          )}
                        </div>
                      ))
                  )}
                </>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Top-center non-overlapping status notice toast (never collides with Floating Assistant) */}
      {notice && (
        <div role="status" className={`fixed inset-x-4 top-24 z-50 mx-auto flex max-w-2xl items-start gap-3 rounded-xl border p-4 text-sm leading-6 backdrop-blur-md ${tokens.toast}`}>
          <span className="flex-1">{notice}</span>
          <button
            type="button"
            aria-label={t.dismissNoticeAria}
            onClick={() => setNotice('')}
            className="grid min-h-10 min-w-10 shrink-0 place-items-center rounded-lg hover:bg-sky-500/10 focus-visible:ring-2"
          >
            <Icon name="close" />
          </button>
        </div>
      )}

      {/* Persistent Always-Alive Floating Side Assistant inside Workspaces (Movable Left <-> Right) */}
      {!isStartup && (
        <FloatingHafizAssistant
          dockSide={dockSide}
          onDockSideChange={setDockSide}
          state={state}
          speechBeatAt={speechBeatAt}
          micEnergy={micEnergy}
          ar={ar}
          t={t}
          theme={theme}
          lastReply={lastReply}
          message={message}
          onMessageChange={handleCommandInputChange}
          onSubmitCommand={askHafiz}
          onToggleMic={() => void mic()}
          onToggleSpeak={() => (state === 'speaking' ? stopSpeaking() : speak(welcomeVoiceLine, { silentNotice: true }))}
          onGoStartup={() => go('welcome')}
        />
      )}

      {/* Multi-Drive Partition Scanner Modal (E:, D:, custom folders — In-Place Zero-Move) */}
      <ModelScannerModal
        open={scannerOpen}
        ar={ar}
        t={t}
        theme={theme}
        appInstallDir={appInstallDir}
        scanPartitions={scanPartitions}
        inPlaceLinking={inPlaceLinking}
        backendState={backendState}
        onTogglePartition={handleTogglePartition}
        onAddPartition={handleAddPartition}
        onRemovePartition={handleRemovePartition}
        onInPlaceLinkingChange={setInPlaceLinking}
        onRunScan={handleRunPartitionScan}
        onClose={() => setScannerOpen(false)}
      />

      {/* Non-intrusive First-Run Setup & Hardware Wizard Modal */}
      <FirstRunWizardModal
        open={wizardOpen}
        ar={ar}
        t={t}
        theme={theme}
        appInstallDir={appInstallDir}
        onAppInstallDirChange={setAppInstallDir}
        modelDir={modelDir}
        onModelDirChange={setModelDir}
        setupMode={setupMode}
        onSetupModeChange={setSetupMode}
        scanPartitions={scanPartitions}
        onTogglePartition={handleTogglePartition}
        inPlaceLinking={inPlaceLinking}
        onInPlaceLinkingChange={setInPlaceLinking}
        onOpenScanner={() => setScannerOpen(true)}
        onClose={() => setWizardOpen(false)}
        onComplete={() => {
          setWizardOpen(false)
          setSetupBannerDismissed(true)
          setNotice(t.noticeWizardSaved)
        }}
      />

      <footer className={`relative z-20 flex min-h-10 flex-wrap items-center justify-between gap-2 border-t px-6 py-2 text-xs ${isStartup ? 'border-slate-800/80 bg-[#080f19]/90 text-slate-300' : tokens.footer}`}>
        <span className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${backendState === 'READY' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {t.footerPreviewBadge}
          <span className="mx-1.5 opacity-40">|</span>
          {t.backendStates[backendState]}
        </span>
        <span className="hidden md:block">{t.footerTagline}</span>
        <button type="button" className={`min-h-9 hover:underline ${isStartup ? 'text-sky-200' : tokens.textAccent}`} onClick={() => go('setup/general')}>
          {t.footerSystemLink} <span className="ms-1">↗</span>
        </button>
      </footer>
    </div>
  )
}
