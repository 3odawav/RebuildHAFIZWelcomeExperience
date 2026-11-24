import { useState } from 'react'
import {
  ACTION_CONTRACTS,
  HEALTH_ACTION_CONTRACT_IDS,
  ORCHESTRATOR_STATES,
  TARGET_HARDWARE_SPEC,
  TASK_ROUTING_TABLE,
  VERIFICATION_MATRIX,
  VOICE_LATENCY_STAGES,
} from '../contracts/orchestrator'
import type { AppTranslations, UiLanguage, VoiceLanguage } from '../i18n/translations'
import { BACKEND_CONNECTION_STATES, type BackendConnectionState } from '../services/backendAdapter'
import type { AvatarState } from '../utils/avatarAnimation'
import {
  COMMON_WINDOWS_DRIVES,
  normalizeWindowsPath,
  type ExecutionProfile,
  type UiThemePreset,
} from '../utils/storageConfig'
import { getThemeTokens } from '../utils/themeTokens'
import type { DockSide } from './FloatingHafizAssistant'

export type SettingsTabId = keyof AppTranslations['settingsTabs']

interface SettingsCenterViewProps {
  ar: boolean
  t: AppTranslations
  activeTab: SettingsTabId
  onTabChange: (tab: SettingsTabId) => void
  language: UiLanguage
  onLanguageChange: (lang: UiLanguage) => void
  voiceLanguage: VoiceLanguage
  onVoiceLanguageChange: (lang: VoiceLanguage) => void
  theme: UiThemePreset
  onThemeChange: (theme: UiThemePreset) => void
  density: 'comfortable' | 'compact'
  onDensityChange: (density: 'comfortable' | 'compact') => void
  reduceMotion: boolean
  onReduceMotionChange: (val: boolean) => void
  uiScale: number
  onUiScaleChange: (scale: number) => void
  dockSide: DockSide
  onDockSideChange: (side: DockSide) => void
  speechEnabled: boolean
  onSpeechEnabledChange: (val: boolean) => void
  speechRate: number
  onSpeechRateChange: (rate: number) => void
  bargeIn: boolean
  onBargeInChange: (val: boolean) => void
  micMode: 'push_to_talk' | 'continuous'
  onMicModeChange: (mode: 'push_to_talk' | 'continuous') => void
  executionProfile: ExecutionProfile
  onExecutionProfileChange: (profile: ExecutionProfile) => void
  idleTimeoutSec: number
  onIdleTimeoutSecChange: (sec: number) => void
  routerMode: boolean
  onRouterModeChange: (val: boolean) => void
  vramMarginGb: number
  onVramMarginGbChange: (gb: number) => void
  singleModelLock: boolean
  onSingleModelLockChange: (val: boolean) => void
  appInstallDir: string
  onAppInstallDirChange: (dir: string) => void
  modelDir: string
  onModelDirChange: (dir: string) => void
  scanPartitions: string[]
  onTogglePartition: (drive: string) => void
  inPlaceLinking: boolean
  onInPlaceLinkingChange: (val: boolean) => void
  downloadSpeedLimitMb: number
  onDownloadSpeedLimitChange: (mb: number) => void
  autoResumeDownloads: boolean
  onAutoResumeDownloadsChange: (val: boolean) => void
  manualOverridesCount: number
  autoCheckBackend: boolean
  onAutoCheckBackendChange: (val: boolean) => void
  backendState: BackendConnectionState
  onProbeBackend: () => void
  onOpenScanner: () => void
  savedProjectsCount: number
  avatarState: AvatarState
  onToggleMic: () => void
  onPurgeVram: () => void
  onBlocked: (message?: string) => void
  onExportDiagnostics: () => void
  onOpenWizard: () => void
}

const TAB_ORDER: SettingsTabId[] = [
  'general',
  'assistant',
  'speechPipeline',
  'orchestrator',
  'gpuGuard',
  'modelsCompat',
  'downloadsStorage',
  'audio',
  'memoryProfiles',
  'updatesHealth',
  'securityPrivacy',
  'diagnostics',
  'about',
]

export function SettingsCenterView({
  ar,
  t,
  activeTab,
  onTabChange,
  language,
  onLanguageChange,
  voiceLanguage,
  onVoiceLanguageChange,
  theme,
  onThemeChange,
  density,
  onDensityChange,
  reduceMotion,
  onReduceMotionChange,
  uiScale,
  onUiScaleChange,
  dockSide,
  onDockSideChange,
  speechEnabled,
  onSpeechEnabledChange,
  speechRate,
  onSpeechRateChange,
  bargeIn,
  onBargeInChange,
  micMode,
  onMicModeChange,
  executionProfile,
  onExecutionProfileChange,
  idleTimeoutSec,
  onIdleTimeoutSecChange,
  routerMode,
  onRouterModeChange,
  vramMarginGb,
  onVramMarginGbChange,
  singleModelLock,
  onSingleModelLockChange,
  appInstallDir,
  onAppInstallDirChange,
  modelDir,
  onModelDirChange,
  scanPartitions,
  onTogglePartition,
  inPlaceLinking,
  onInPlaceLinkingChange,
  downloadSpeedLimitMb,
  onDownloadSpeedLimitChange,
  autoResumeDownloads,
  onAutoResumeDownloadsChange,
  manualOverridesCount,
  autoCheckBackend,
  onAutoCheckBackendChange,
  backendState,
  onProbeBackend,
  onOpenScanner,
  savedProjectsCount,
  avatarState,
  onToggleMic,
  onPurgeVram,
  onBlocked,
  onExportDiagnostics,
  onOpenWizard,
}: SettingsCenterViewProps) {
  const [selectedContractId, setSelectedContractId] = useState(ACTION_CONTRACTS[0].id)
  const selectedContract = ACTION_CONTRACTS.find(c => c.id === selectedContractId) ?? ACTION_CONTRACTS[0]
  const blockedWithContract = (key: keyof typeof HEALTH_ACTION_CONTRACT_IDS) => () => {
    const id = HEALTH_ACTION_CONTRACT_IDS[key]
    setSelectedContractId(id)
    onBlocked(`${t.noticeCompanionBlocked} · ${id}`)
  }
  const tokens = getThemeTokens(theme)
  const compactPad = density === 'compact' ? 'p-4' : 'p-5 sm:p-6'
  const normalizedPartitions = new Set(scanPartitions.map(p => normalizeWindowsPath(p).toLowerCase()))

  const statusBadgeClass = (status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT TESTED') => {
    if (status === 'PASS') return tokens.badgeSuccess
    if (status === 'FAIL') return 'border-rose-400/50 bg-rose-500/15 text-rose-600 dark:text-rose-200'
    if (status === 'BLOCKED') return tokens.badgeWarn
    return `${tokens.borderSubtle} ${tokens.textMuted}`
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Centralized Settings Category Rail */}
      <nav aria-label={t.navSettings} className={`${tokens.panel} flex flex-row gap-1 overflow-x-auto p-2 lg:flex-col lg:pb-24`}>
        {TAB_ORDER.map(tabId => (
          <button
            key={tabId}
            type="button"
            aria-current={activeTab === tabId ? 'page' : undefined}
            onClick={() => onTabChange(tabId)}
            className={`min-h-11 shrink-0 rounded-lg px-3.5 py-2 text-start text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:w-full ${
              activeTab === tabId
                ? `border ${tokens.buttonActive}`
                : `border border-transparent ${tokens.textMuted} hover:bg-sky-500/10`
            }`}
          >
            {t.settingsTabs[tabId]}
          </button>
        ))}
      </nav>

      {/* Active Settings Detail Pane */}
      <div className={`${tokens.panel} min-h-[420px] min-w-0 space-y-6 ${compactPad}`}>
        <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${tokens.borderSubtle}`}>
          <h2 className={`text-xl font-medium ${tokens.heading}`}>
            {t.settingsTabs[activeTab]}
          </h2>
          <span
            dir="ltr"
            data-testid="backend-state-pill"
            className={`rounded-md border px-2.5 py-1 font-mono text-[11px] ${
              backendState === 'READY' ? tokens.badgeSuccess : tokens.badgeWarn
            }`}
          >
            {t.backendStates[backendState]}
          </span>
        </div>

        {activeTab === 'general' && (
          <div className="space-y-5">
            <label className={`block text-sm font-medium ${tokens.textPrimary}`}>
              {t.interfaceLanguageLabel}
              <select
                aria-label={t.interfaceLanguageLabel}
                value={language}
                onChange={e => onLanguageChange(e.target.value as UiLanguage)}
                className={`${tokens.field} mt-2 max-w-md`}
              >
                <option value="ar">العربية المصرية (ar-EG · RTL)</option>
                <option value="en">English (en-US · LTR)</option>
              </select>
            </label>

            <div>
              <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.themeLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {([
                  ['midnight_blue', t.themeMidnightBlue],
                  ['graphite_gold', t.themeGraphiteGold],
                  ['light_studio', t.themeLightStudio],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    data-testid={`theme-btn-${id}`}
                    aria-pressed={theme === id}
                    onClick={() => onThemeChange(id)}
                    className={`${tokens.button} ${theme === id ? tokens.buttonActive : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.densityLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {([
                  ['comfortable', t.densityComfortable],
                  ['compact', t.densityCompact],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={density === id}
                    onClick={() => onDensityChange(id)}
                    className={`${tokens.button} ${density === id ? tokens.buttonActive : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.uiScaleLabel}</span>
              <p className={`mt-1 text-xs ${tokens.textMuted}`}>{t.uiScaleDesc}</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {[100, 112, 125].map(scale => (
                  <button
                    key={scale}
                    type="button"
                    aria-pressed={uiScale === scale}
                    onClick={() => onUiScaleChange(scale)}
                    className={`${tokens.button} ${uiScale === scale ? tokens.buttonActive : ''}`}
                  >
                    <span dir="ltr">{scale}%</span>
                  </button>
                ))}
              </div>
            </div>

            <label className={`${tokens.subCard} flex min-h-11 items-center justify-between gap-4 p-4 text-sm`}>
              <span>
                <span className={`block font-medium ${tokens.textPrimary}`}>{t.reduceMotionToggle}</span>
                <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.reduceMotionDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={e => onReduceMotionChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>

            <div>
              <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.assistantDockLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={dockSide === 'right'}
                  onClick={() => onDockSideChange('right')}
                  className={`${tokens.button} ${dockSide === 'right' ? tokens.buttonActive : ''}`}
                >
                  {t.dockRight}
                </button>
                <button
                  type="button"
                  aria-pressed={dockSide === 'left'}
                  onClick={() => onDockSideChange('left')}
                  className={`${tokens.button} ${dockSide === 'left' ? tokens.buttonActive : ''}`}
                >
                  {t.dockLeft}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="space-y-5">
            <label className={`block text-sm font-medium ${tokens.textPrimary}`}>
              {t.voiceLanguageLabel}
              <p className={`mt-1 text-xs font-normal ${tokens.textMuted}`}>{t.voiceLanguageDesc}</p>
              <select
                aria-label={t.voiceLanguageLabel}
                value={voiceLanguage}
                onChange={e => onVoiceLanguageChange(e.target.value as VoiceLanguage)}
                className={`${tokens.field} mt-2 max-w-md`}
              >
                <option value="ar-EG">العامية المصرية (ar-EG)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </label>

            <label className={`${tokens.subCard} block p-4 text-sm`}>
              <span className={`flex items-center justify-between font-medium ${tokens.textPrimary}`}>
                <span>{t.speechRateLabel}</span>
                <span dir="ltr" className={`font-mono ${tokens.textAccent}`}>{speechRate.toFixed(2)}x</span>
              </span>
              <input
                type="range"
                min={0.75}
                max={1.25}
                step={0.05}
                value={speechRate}
                onChange={e => onSpeechRateChange(Number(e.target.value))}
                className="mt-3 w-full accent-cyan-500"
              />
            </label>

            <label className={`${tokens.subCard} flex min-h-11 items-center justify-between gap-4 p-4 text-sm`}>
              <span>{t.browserSpeechToggle}</span>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={e => onSpeechEnabledChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>

            <label className={`${tokens.subCard} flex min-h-11 items-center justify-between gap-4 p-4 text-sm`}>
              <span>
                <span className={`block font-medium ${tokens.textPrimary}`}>{t.bargeInToggle}</span>
                <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.bargeInDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={bargeIn}
                onChange={e => onBargeInChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>

            <div>
              <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.micModeLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={micMode === 'push_to_talk'}
                  onClick={() => onMicModeChange('push_to_talk')}
                  className={`${tokens.button} ${micMode === 'push_to_talk' ? tokens.buttonActive : ''}`}
                >
                  {t.micModePtt}
                </button>
                <button
                  type="button"
                  aria-pressed={micMode === 'continuous'}
                  onClick={() => onMicModeChange('continuous')}
                  className={`${tokens.button} ${micMode === 'continuous' ? tokens.buttonActive : ''}`}
                >
                  {t.micModeContinuous}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'speechPipeline' && (
          <div className="space-y-5">
            <div className={`${tokens.subCardAlt} p-4`}>
              <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.pipelineTitle}</h3>
              <div dir="ltr" className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs">
                {['Microphone', 'Silero VAD', 'Streaming ASR (ar-EG)', 'Intent Router / LLM', 'Streaming Egyptian TTS', 'Speaker'].map((step, i, arr) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    <span className={`rounded-lg border px-2.5 py-1.5 ${tokens.badgeInfo}`}>{step}</span>
                    {i < arr.length - 1 && <span className={tokens.textAccent}>→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <button type="button" className={tokens.button} onClick={onToggleMic}>
                  {avatarState === 'listening' ? t.stopMicBtn : t.testMicBtn}
                </button>
              </div>
            </div>

            <div>
              <h3 className={`text-base font-medium ${tokens.textPrimary}`}>{t.latencyTargetTitle}</h3>
              <p className={`mt-1 text-xs leading-5 ${tokens.textMuted}`}>{t.latencyTargetDesc}</p>
              <div className={`mt-3 overflow-x-auto rounded-xl border ${tokens.borderSubtle}`}>
                <table className="w-full text-start text-xs">
                  <thead className={tokens.isLight ? 'bg-slate-100 text-slate-700' : 'bg-[#06111e] text-slate-300'}>
                    <tr>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.stage}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.budget}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.measured}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.status}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${tokens.borderSubtle}`}>
                    {VOICE_LATENCY_STAGES.map(stage => (
                      <tr key={stage.id}>
                        <td className={`px-3 py-2.5 ${tokens.textPrimary}`}>{ar ? stage.stageAr : stage.stageEn}</td>
                        <td dir="ltr" className={`px-3 py-2.5 font-mono ${tokens.textAccent}`}>{stage.targetBudget}</td>
                        <td dir="ltr" className={`px-3 py-2.5 font-mono ${tokens.textMuted}`}>{stage.measured}</td>
                        <td className="px-3 py-2.5">
                          <span dir="ltr" className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] ${statusBadgeClass(stage.status)}`}>
                            {stage.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orchestrator' && (
          <div className="space-y-5">
            <div>
              <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.executionProfileLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {([
                  ['balanced_rtx5000', t.profileBalanced],
                  ['max_speed', t.profileFast],
                  ['low_vram_coexist', t.profileCoexist],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={executionProfile === id}
                    onClick={() => onExecutionProfileChange(id)}
                    className={`${tokens.button} ${executionProfile === id ? tokens.buttonActive : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${tokens.subCard} p-4`}>
              <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.orchestratorStateTitle}</h3>
              <div dir="ltr" className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
                {ORCHESTRATOR_STATES.map(st => (
                  <span
                    key={st}
                    className={`rounded-md border px-2 py-1 ${
                      st === 'IDLE'
                        ? tokens.badgeInfo
                        : st === 'EXTERNAL_GPU_BUSY' || st === 'FAILED'
                          ? tokens.badgeWarn
                          : `${tokens.borderSubtle} ${tokens.textMuted}`
                    }`}
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={`${tokens.subCard} p-4 text-sm`}>
                <span className={`flex items-center justify-between font-medium ${tokens.textPrimary}`}>
                  <span>{t.idleTimeoutLabel}</span>
                  <span dir="ltr" className={`font-mono ${tokens.textAccent}`}>{idleTimeoutSec}s</span>
                </span>
                <input
                  type="range"
                  min={30}
                  max={600}
                  step={30}
                  value={idleTimeoutSec}
                  onChange={e => onIdleTimeoutSecChange(Number(e.target.value))}
                  className="mt-3 w-full accent-cyan-500"
                />
                <span className={`mt-1.5 block text-xs ${tokens.textMuted}`}>{t.idleTimeoutDesc}</span>
              </label>

              <label className={`${tokens.subCard} flex items-start justify-between gap-3 p-4 text-sm`}>
                <span>
                  <span className={`block font-medium ${tokens.textPrimary}`}>{t.routerModeToggle}</span>
                  <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.routerModeDesc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={routerMode}
                  onChange={e => onRouterModeChange(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-cyan-500"
                />
              </label>
            </div>

            <p className={`${tokens.subCardAlt} p-3.5 text-xs leading-6`}>
              {t.lazyInitNote}
            </p>

            <div>
              <h3 className={`mb-2.5 text-sm font-medium ${tokens.textPrimary}`}>{t.orchestratorRoutingTitle}</h3>
              <div className="grid gap-2.5">
                {TASK_ROUTING_TABLE.map(rule => (
                  <div key={rule.id} className={`${tokens.subCard} flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs`}>
                    <span className={`font-medium ${tokens.textPrimary}`}>{ar ? rule.taskAr : rule.taskEn}</span>
                    <span className={tokens.textAccent}>{ar ? rule.enginesAr : rule.enginesEn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gpuGuard' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${tokens.subCard} p-4`}>
                <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.gpuProfileTitle}</h3>
                <dl className="mt-3 space-y-1.5 text-xs">
                  {([
                    ['os', ar ? 'نظام التشغيل' : 'OS', TARGET_HARDWARE_SPEC.os],
                    ['gpu', ar ? 'كارت الشاشة' : 'GPU', TARGET_HARDWARE_SPEC.gpu],
                    ['vram', ar ? 'ذاكرة الفيديو (VRAM)' : 'VRAM', TARGET_HARDWARE_SPEC.vram],
                    ['arch', ar ? 'المعمارية' : 'Architecture', TARGET_HARDWARE_SPEC.architecture],
                    ['ram', ar ? 'الذاكرة العشوائية' : 'System RAM', TARGET_HARDWARE_SPEC.ram],
                    ['prec', ar ? 'دقة التشغيل' : 'Precision', TARGET_HARDWARE_SPEC.precision],
                  ] as const).map(([key, label, value]) => (
                    <div key={key} className="flex flex-wrap justify-between gap-2">
                      <dt className={tokens.textMuted}>{label}</dt>
                      <dd dir="ltr" className={`font-mono ${tokens.textPrimary}`}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className={`rounded-xl border p-4 ${tokens.badgeWarn}`}>
                <h3 className="text-sm font-medium">{t.gpuLiveTelemetryTitle}</h3>
                <p className="mt-2 text-xs leading-6">{t.gpuLiveOfflineNotice}</p>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="opacity-80">{ar ? 'الذاكرة المستخدمة / الكلية' : 'VRAM Used / Total'}</dt>
                    <dd dir="ltr" className="font-mono">— / — ({t.backendNotConnectedShort})</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="opacity-80">{ar ? 'عمّال حافظ النشطون' : 'HAFIZ Workers'}</dt>
                    <dd dir="ltr" className="font-mono">0 ({ar ? 'معاينة ويب' : 'Web preview'})</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="opacity-80">{ar ? 'فحص العمليات الخارجية على GPU' : 'External GPU Probe'}</dt>
                    <dd>{ar ? 'لم يُفحص بعد' : 'Not probed'}</dd>
                  </div>
                </dl>
                <button type="button" onClick={onProbeBackend} className={`${tokens.button} mt-3 min-h-9 px-3 text-xs`}>
                  {t.backendProbeBtn}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className={`${tokens.subCard} p-4 text-sm`}>
                <span className={`flex items-center justify-between font-medium ${tokens.textPrimary}`}>
                  <span>{t.gpuVramMarginLabel}</span>
                  <span dir="ltr" className={`font-mono ${tokens.textAccent}`}>{vramMarginGb.toFixed(1)} GB</span>
                </span>
                <input
                  type="range"
                  min={1.0}
                  max={4.5}
                  step={0.5}
                  value={vramMarginGb}
                  onChange={e => onVramMarginGbChange(Number(e.target.value))}
                  className="mt-3 w-full accent-cyan-500"
                />
                <span className={`mt-1.5 block text-xs ${tokens.textMuted}`}>{t.gpuVramMarginDesc}</span>
              </label>

              <label className={`${tokens.subCard} flex items-start justify-between gap-3 p-4 text-sm`}>
                <span>
                  <span className={`block font-medium ${tokens.textPrimary}`}>{t.singleModelLockToggle}</span>
                  <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.singleModelLockDesc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={singleModelLock}
                  onChange={e => onSingleModelLockChange(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-cyan-500"
                />
              </label>
            </div>

            <div className={`${tokens.subCardAlt} p-4`}>
              <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.externalWorkloadTitle}</h3>
              <p className={`mt-1.5 text-xs leading-6 ${tokens.textMuted}`}>{t.externalWorkloadDesc}</p>
            </div>

            <div className={`${tokens.subCard} p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.purgeVramBtn}</h3>
                  <p className={`mt-1 text-xs leading-5 ${tokens.textMuted}`}>{t.purgeVramDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={onPurgeVram}
                  className={`${tokens.button} ${tokens.buttonAccent}`}
                >
                  {t.purgeVramBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modelsCompat' && (
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.turingRulesTitle}</h3>
            <ul className="space-y-2.5 text-sm leading-6">
              {t.turingRules.map((rule, idx) => (
                <li key={idx} className={`${tokens.subCard} px-4 py-3`}>
                  {rule}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button type="button" className={tokens.button} onClick={blockedWithContract('verifyCuda')}>{t.healthActions.verifyCuda}</button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('restoreKnownGood')}>{t.healthActions.restoreKnownGood}</button>
            </div>
          </div>
        )}

        {activeTab === 'downloadsStorage' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className={`block text-sm font-medium ${tokens.textPrimary}`}>
                {t.appInstallDirLabel}
                <input
                  dir="ltr"
                  value={appInstallDir}
                  onChange={e => onAppInstallDirChange(e.target.value)}
                  className={`${tokens.field} mt-2 font-mono text-xs`}
                />
              </label>

              <label className={`block text-sm font-medium ${tokens.textPrimary}`}>
                {t.storageDirLabel}
                <input
                  dir="ltr"
                  value={modelDir}
                  onChange={e => onModelDirChange(e.target.value)}
                  className={`${tokens.field} mt-2 font-mono text-xs`}
                />
              </label>
            </div>

            <div className={`${tokens.subCard} space-y-3 p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-sm font-medium ${tokens.textPrimary}`}>{t.scannerSelectDrives}</span>
                <button type="button" onClick={onOpenScanner} className={`${tokens.button} min-h-9 px-3 text-xs ${tokens.buttonAccent}`}>
                  {t.scanPartitionsAction}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {COMMON_WINDOWS_DRIVES.map(drive => {
                  const selected = normalizedPartitions.has(drive.toLowerCase())
                  return (
                    <button
                      key={drive}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onTogglePartition(drive)}
                      className={`${tokens.button} min-h-9 px-3 font-mono text-xs ${selected ? tokens.buttonActive : ''}`}
                    >
                      <span dir="ltr">{drive}</span>
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  )
                })}
              </div>
              <p className={`text-xs ${tokens.textMuted}`}>
                {ar
                  ? `المسارات اليدوية المخصّصة للنماذج المحفوظة محليًا: ${manualOverridesCount}`
                  : `Saved manual per-model path overrides: ${manualOverridesCount}`}
              </p>
            </div>

            <label className={`${tokens.subCard} flex min-h-11 items-center justify-between gap-4 p-4 text-sm`}>
              <span>
                <span className={`block font-medium ${tokens.textPrimary}`}>{t.inPlaceLinkingToggle}</span>
                <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.inPlaceLinkingDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={inPlaceLinking}
                onChange={e => onInPlaceLinkingChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${tokens.subCard} p-4`}>
                <span className={`block text-sm font-medium ${tokens.textPrimary}`}>{t.downloadSpeedLimitLabel}</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[0, 5, 15, 50].map(limit => (
                    <button
                      key={limit}
                      type="button"
                      aria-pressed={downloadSpeedLimitMb === limit}
                      onClick={() => onDownloadSpeedLimitChange(limit)}
                      className={`${tokens.button} min-h-9 px-3 text-xs ${downloadSpeedLimitMb === limit ? tokens.buttonActive : ''}`}
                    >
                      {limit === 0 ? t.speedUnlimited : <span dir="ltr">{limit} MB/s</span>}
                    </button>
                  ))}
                </div>
              </div>

              <label className={`${tokens.subCard} flex items-center justify-between gap-4 p-4 text-sm`}>
                <span className={tokens.textPrimary}>{t.autoResumeToggle}</span>
                <input
                  type="checkbox"
                  checked={autoResumeDownloads}
                  onChange={e => onAutoResumeDownloadsChange(e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-cyan-500"
                />
              </label>
            </div>

            <p className={`text-xs leading-6 ${tokens.textMuted}`}>{t.storageDirHint}</p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={tokens.button} onClick={onOpenWizard}>{t.openFirstRunWizard}</button>
              <button type="button" className={tokens.button} onClick={onOpenScanner}>{t.scanModelLibraries}</button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('continueDownloads')}>{t.continueDownloads}</button>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <label className={`${tokens.subCard} flex min-h-11 items-center justify-between gap-4 p-4 text-sm`}>
              <span>{t.browserSpeechToggle}</span>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={e => onSpeechEnabledChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>
            <button type="button" className={tokens.button} onClick={onToggleMic}>
              {avatarState === 'listening' ? t.stopMicBtn : t.testMicBtn}
            </button>
          </div>
        )}

        {activeTab === 'memoryProfiles' && (
          <div className="space-y-4 text-sm">
            <p className={`${tokens.subCard} p-4 leading-6`}>
              {ar
                ? `عدد المشاريع والمسودات المحفوظة محليًا في هذا المتصفح: ${savedProjectsCount}. ملفات الأصوات المرجعية المصرّح بها تُخزّن محليًا فقط عند ربط محرك ويندوز.`
                : `Locally saved lyric projects in this browser: ${savedProjectsCount}. Authorized reference voice profiles stay strictly local when connected to the Windows companion.`}
            </p>
          </div>
        )}

        {activeTab === 'updatesHealth' && (
          <div className="space-y-4">
            <h3 className={`text-sm font-medium ${tokens.heading}`}>{t.healthManualTitle}</h3>
            <label className={`${tokens.subCard} flex min-h-11 items-center justify-between gap-4 p-4 text-sm`}>
              <span>
                <span className={`block font-medium ${tokens.textPrimary}`}>{t.autoCheckBackendToggle}</span>
                <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.autoCheckBackendDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={autoCheckBackend}
                onChange={e => onAutoCheckBackendChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>
            <p className={`${tokens.subCardAlt} p-3.5 text-xs leading-6`}>
              {t.nonBlockingStartupNote}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={`${tokens.button} ${tokens.buttonActive}`} onClick={onProbeBackend}>
                {t.backendProbeBtn}
              </button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('checkUpdates')}>{t.healthActions.checkUpdates}</button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('repairRuntime')}>{t.healthActions.repairRuntime}</button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('verifyCuda')}>{t.healthActions.verifyCuda}</button>
              <button type="button" className={tokens.button} onClick={onOpenScanner}>{t.healthActions.scanLibraries}</button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('runDiagnostics')}>{t.healthActions.runDiagnostics}</button>
              <button type="button" className={`${tokens.button} ${tokens.buttonAccent}`} onClick={onExportDiagnostics}>
                {t.healthActions.exportReport}
              </button>
              <button type="button" className={tokens.button} onClick={blockedWithContract('restoreKnownGood')}>{t.healthActions.restoreKnownGood}</button>
              <button type="button" className={tokens.button} onClick={onOpenWizard}>{t.openFirstRunWizard}</button>
            </div>
          </div>
        )}

        {activeTab === 'securityPrivacy' && (
          <ul className="space-y-2.5 text-sm leading-6">
            {t.securityRules.map((rule, idx) => (
              <li key={idx} className={`${tokens.subCard} px-4 py-3`}>
                {rule}
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <div className={`${tokens.subCard} space-y-2.5 p-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-sm font-medium ${tokens.heading}`}>{t.backendStatusLabel}</span>
                <button type="button" onClick={onProbeBackend} className={`${tokens.button} min-h-9 px-3 text-xs`}>
                  {t.backendProbeBtn}
                </button>
              </div>
              <div dir="ltr" className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                {BACKEND_CONNECTION_STATES.map(st => (
                  <span
                    key={st}
                    className={`rounded-md border px-2 py-1 ${
                      st === backendState ? tokens.buttonActive : `${tokens.borderSubtle} ${tokens.textMuted}`
                    }`}
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className={`text-base font-medium ${tokens.heading}`}>{t.verificationMatrixTitle}</h3>
                <button
                  type="button"
                  onClick={onExportDiagnostics}
                  className={`${tokens.button} ${tokens.buttonAccent}`}
                >
                  {t.healthActions.exportReport}
                </button>
              </div>
              <div className="space-y-2">
                {VERIFICATION_MATRIX.map(item => (
                  <div key={item.id} className={`${tokens.subCard} flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs`}>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${tokens.textPrimary}`}>{ar ? item.checkAr : item.checkEn}</p>
                      <p className={`mt-0.5 ${tokens.textMuted}`}>{ar ? item.noteAr : item.noteEn}</p>
                    </div>
                    <span dir="ltr" className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[11px] ${statusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border-t pt-5 ${tokens.borderSubtle}`}>
              <h3 className={`text-base font-medium ${tokens.heading}`}>{t.contractsTitle}</h3>
              <p className={`mt-1 text-xs leading-5 ${tokens.textMuted}`}>{t.contractsDesc}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ACTION_CONTRACTS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selectedContract.id === c.id}
                    onClick={() => setSelectedContractId(c.id)}
                    className={`${tokens.button} text-xs ${selectedContract.id === c.id ? tokens.buttonActive : ''}`}
                  >
                    {ar ? c.labelAr : c.labelEn}
                  </button>
                ))}
              </div>

              <dl className={`${tokens.subCard} mt-4 grid gap-2 p-4 text-xs`}>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Action ID</dt>
                  <dd dir="ltr" className={`font-mono ${tokens.textAccent}`}>{selectedContract.id}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>AR / EN</dt>
                  <dd className={tokens.textPrimary}>{selectedContract.labelAr} · {selectedContract.labelEn}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>{ar ? 'الإجراء المتوقع' : 'Expected action'}</dt>
                  <dd className={tokens.textPrimary}>{ar ? selectedContract.expectedActionAr : selectedContract.expectedActionEn}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>IPC / Endpoint</dt>
                  <dd dir="ltr" className={`break-all font-mono ${tokens.textAccent}`}>{selectedContract.endpoint}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Service / Model</dt>
                  <dd dir="ltr" className={`font-mono ${tokens.textPrimary}`}>{selectedContract.requiredService}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Input Schema</dt>
                  <dd dir="ltr" className={`break-all font-mono ${tokens.textMuted}`}>{selectedContract.inputSchema}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Output Schema</dt>
                  <dd dir="ltr" className={`break-all font-mono ${tokens.textMuted}`}>{selectedContract.outputSchema}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Loading / Cancel</dt>
                  <dd className={tokens.textMuted}>{selectedContract.loadingPolicy} {selectedContract.cancellationPolicy}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Error / Retry</dt>
                  <dd className={tokens.textMuted}>{selectedContract.errorRetryPolicy}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Persistent Keys</dt>
                  <dd dir="ltr" className={`font-mono ${tokens.textMuted}`}>{selectedContract.persistentConfig}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className={tokens.textMuted}>Verification</dt>
                  <dd className={tokens.textMuted}>{selectedContract.verificationCriteria}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-3 text-sm leading-7">
            {t.aboutLines.map((line, i) => (
              <p key={i} className={tokens.textPrimary}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
