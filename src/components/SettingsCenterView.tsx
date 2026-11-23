import { useState } from 'react'
import {
  ACTION_CONTRACTS,
  ORCHESTRATOR_STATES,
  TARGET_HARDWARE_SPEC,
  TASK_ROUTING_TABLE,
  VERIFICATION_MATRIX,
  VOICE_LATENCY_STAGES,
} from '../contracts/orchestrator'
import type { AppTranslations, UiLanguage, VoiceLanguage } from '../i18n/translations'
import type { AvatarState } from '../utils/avatarAnimation'
import type { ExecutionProfile, ModelSetupMode, UiThemePreset } from '../utils/storageConfig'
import type { DockSide } from './FloatingHafizAssistant'
import { PartitionScanManager } from './PartitionScanManager'

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
  themePreset: UiThemePreset
  onThemePresetChange: (preset: UiThemePreset) => void
  uiScale: number
  onUiScaleChange: (scale: number) => void
  workspaceDensity: 'comfortable' | 'compact'
  onWorkspaceDensityChange: (density: 'comfortable' | 'compact') => void
  reduceMotion: boolean
  onReduceMotionChange: (val: boolean) => void
  startupMode: 'avatar_first' | 'direct_studio'
  onStartupModeChange: (mode: 'avatar_first' | 'direct_studio') => void
  autosaveSec: number
  onAutosaveSecChange: (sec: number) => void
  dockSide: DockSide
  onDockSideChange: (side: DockSide) => void
  speechEnabled: boolean
  onSpeechEnabledChange: (val: boolean) => void
  speechRate: number
  onSpeechRateChange: (rate: number) => void
  autoGreet: boolean
  onAutoGreetChange: (val: boolean) => void
  bargeIn: boolean
  onBargeInChange: (val: boolean) => void
  micMode: 'push_to_talk' | 'continuous'
  onMicModeChange: (mode: 'push_to_talk' | 'continuous') => void
  executionProfile: ExecutionProfile
  onExecutionProfileChange: (profile: ExecutionProfile) => void
  contextWindow: number
  onContextWindowChange: (tokens: number) => void
  precisionPref: 'auto_turing' | 'fp16' | 'int8' | 'gguf_q4km'
  onPrecisionPrefChange: (pref: 'auto_turing' | 'fp16' | 'int8' | 'gguf_q4km') => void
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
  setupMode: ModelSetupMode
  onSetupModeChange: (mode: ModelSetupMode) => void
  scanPartitions: string[]
  onScanPartitionsChange: (paths: string[]) => void
  inPlaceLinking: boolean
  onInPlaceLinkingChange: (val: boolean) => void
  manualOverridesCount: number
  downloadSpeedLimitMb: number
  onDownloadSpeedLimitMbChange: (mb: number) => void
  autoResumeDownloads: boolean
  onAutoResumeDownloadsChange: (val: boolean) => void
  savedProjectsCount: number
  avatarState: AvatarState
  onToggleMic: () => void
  onPurgeVram: () => void
  onBlocked: () => void
  onNotice: (msg: string) => void
  onExportDiagnostics: () => void
  onOpenWizard: () => void
  onOpenModelLibrary: () => void
  buttonClass: string
  panelClass: string
  fieldClass: string
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

const SETUP_MODE_KEYS: readonly ModelSetupMode[] = [
  'scan_in_place',
  'hybrid_scan_then_download',
  'download_all',
]

const EXECUTION_PROFILE_KEYS: readonly ExecutionProfile[] = [
  'balanced_rtx5000',
  'max_speed',
  'low_vram_coexist',
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
  themePreset,
  onThemePresetChange,
  uiScale,
  onUiScaleChange,
  workspaceDensity,
  onWorkspaceDensityChange,
  reduceMotion,
  onReduceMotionChange,
  startupMode,
  onStartupModeChange,
  autosaveSec,
  onAutosaveSecChange,
  dockSide,
  onDockSideChange,
  speechEnabled,
  onSpeechEnabledChange,
  speechRate,
  onSpeechRateChange,
  autoGreet,
  onAutoGreetChange,
  bargeIn,
  onBargeInChange,
  micMode,
  onMicModeChange,
  executionProfile,
  onExecutionProfileChange,
  contextWindow,
  onContextWindowChange,
  precisionPref,
  onPrecisionPrefChange,
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
  setupMode,
  onSetupModeChange,
  scanPartitions,
  onScanPartitionsChange,
  inPlaceLinking,
  onInPlaceLinkingChange,
  manualOverridesCount,
  downloadSpeedLimitMb,
  onDownloadSpeedLimitMbChange,
  autoResumeDownloads,
  onAutoResumeDownloadsChange,
  savedProjectsCount,
  avatarState,
  onToggleMic,
  onPurgeVram,
  onBlocked,
  onNotice,
  onExportDiagnostics,
  onOpenWizard,
  onOpenModelLibrary,
  buttonClass,
  panelClass,
  fieldClass,
}: SettingsCenterViewProps) {
  const [selectedContractId, setSelectedContractId] = useState(ACTION_CONTRACTS[0].id)
  const selectedContract = ACTION_CONTRACTS.find(c => c.id === selectedContractId) ?? ACTION_CONTRACTS[0]

  const statusBadgeClass = (status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT TESTED') => {
    if (status === 'PASS') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
    if (status === 'FAIL') return 'border-rose-400/40 bg-rose-500/15 text-rose-200'
    if (status === 'BLOCKED') return 'border-amber-400/40 bg-amber-500/15 text-amber-200'
    return 'border-slate-600/70 bg-slate-800/70 text-slate-300'
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Centralized Settings Category Rail */}
      <nav aria-label={t.navSettings} className={`${panelClass} flex flex-row gap-1 overflow-x-auto p-2 lg:flex-col lg:pb-24`}>
        {TAB_ORDER.map(tabId => (
          <button
            key={tabId}
            type="button"
            aria-current={activeTab === tabId ? 'page' : undefined}
            onClick={() => onTabChange(tabId)}
            className={`min-h-11 shrink-0 rounded-lg px-3.5 py-2 text-start text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 lg:w-full ${
              activeTab === tabId
                ? 'border border-sky-500/50 bg-sky-400/15 font-medium text-sky-100'
                : 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            {t.settingsTabs[tabId]}
          </button>
        ))}
      </nav>

      {/* Active Settings Detail Pane */}
      <div className={`${panelClass} min-h-[420px] min-w-0 space-y-6 p-5 sm:p-6`}>
        <h2 className="border-b border-slate-800 pb-3 text-xl font-medium text-sky-100">
          {t.settingsTabs[activeTab]}
        </h2>

        {activeTab === 'general' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-100">
                {t.interfaceLanguageLabel}
                <select
                  aria-label={t.interfaceLanguageLabel}
                  value={language}
                  onChange={e => onLanguageChange(e.target.value as UiLanguage)}
                  className={`${fieldClass} mt-2`}
                >
                  <option value="ar">العربية المصرية (ar-EG · RTL)</option>
                  <option value="en">English (en-US · LTR)</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-100">
                {t.autosaveIntervalLabel}
                <select
                  aria-label={t.autosaveIntervalLabel}
                  value={autosaveSec}
                  onChange={e => onAutosaveSecChange(Number(e.target.value))}
                  className={`${fieldClass} mt-2`}
                >
                  <option value={5}>{ar ? 'فوري (كل 5 ثواني)' : 'Instant (every 5s)'}</option>
                  <option value={15}>{ar ? 'كل 15 ثانية' : 'Every 15 seconds'}</option>
                  <option value={30}>{ar ? 'كل 30 ثانية' : 'Every 30 seconds'}</option>
                  <option value={0}>{ar ? 'يدوي فقط' : 'Manual only'}</option>
                </select>
              </label>
            </div>

            {/* Theme / Eye Comfort Preset */}
            <div>
              <span className="block text-sm font-medium text-slate-100">{t.themePresetLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {([
                  ['midnight_blue', t.themeMidnightBlue],
                  ['graphite_gold', t.themeGraphiteGold],
                  ['light_studio', t.themeLightStudio],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={themePreset === key}
                    onClick={() => onThemePresetChange(key)}
                    className={`${buttonClass} ${themePreset === key ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <span className="block text-sm font-medium text-slate-100">{t.uiScaleLabel}</span>
                <p className="mt-1 text-xs text-slate-300">{t.uiScaleDesc}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[100, 112, 125].map(scale => (
                    <button
                      key={scale}
                      type="button"
                      aria-pressed={uiScale === scale}
                      onClick={() => onUiScaleChange(scale)}
                      className={`${buttonClass} ${uiScale === scale ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                    >
                      <span dir="ltr">{scale}%</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-100">{t.workspaceDensityLabel}</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={workspaceDensity === 'comfortable'}
                    onClick={() => onWorkspaceDensityChange('comfortable')}
                    className={`${buttonClass} ${workspaceDensity === 'comfortable' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {t.densityComfortable}
                  </button>
                  <button
                    type="button"
                    aria-pressed={workspaceDensity === 'compact'}
                    onClick={() => onWorkspaceDensityChange('compact')}
                    className={`${buttonClass} ${workspaceDensity === 'compact' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {t.densityCompact}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <span className="block text-sm font-medium text-slate-100">{t.assistantDockLabel}</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={dockSide === 'right'}
                    onClick={() => onDockSideChange('right')}
                    className={`${buttonClass} ${dockSide === 'right' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {t.dockRight}
                  </button>
                  <button
                    type="button"
                    aria-pressed={dockSide === 'left'}
                    onClick={() => onDockSideChange('left')}
                    className={`${buttonClass} ${dockSide === 'left' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {t.dockLeft}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-100">{t.startupBehaviorLabel}</span>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={startupMode === 'avatar_first'}
                    onClick={() => onStartupModeChange('avatar_first')}
                    className={`${buttonClass} text-xs ${startupMode === 'avatar_first' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {t.startupAvatarFirst}
                  </button>
                  <button
                    type="button"
                    aria-pressed={startupMode === 'direct_studio'}
                    onClick={() => onStartupModeChange('direct_studio')}
                    className={`${buttonClass} text-xs ${startupMode === 'direct_studio' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {t.startupDirectStudio}
                  </button>
                </div>
              </div>
            </div>

            <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
              <span>
                <span className="block font-medium text-slate-100">{t.reduceMotionToggle}</span>
                <span className="mt-1 block text-xs text-slate-300">{t.reduceMotionDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={e => onReduceMotionChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-400"
              />
            </label>
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-100">
                {t.voiceLanguageLabel}
                <p className="mt-1 text-xs font-normal text-slate-300">{t.voiceLanguageDesc}</p>
                <select
                  aria-label={t.voiceLanguageLabel}
                  value={voiceLanguage}
                  onChange={e => onVoiceLanguageChange(e.target.value as VoiceLanguage)}
                  className={`${fieldClass} mt-2`}
                >
                  <option value="ar-EG">العامية المصرية (ar-EG)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </label>

              <label className="rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
                <span className="flex items-center justify-between font-medium text-slate-100">
                  <span>{t.speechRateLabel}</span>
                  <span dir="ltr" className="font-mono text-cyan-200">{speechRate.toFixed(2)}x</span>
                </span>
                <input
                  type="range"
                  min={0.75}
                  max={1.25}
                  step={0.05}
                  value={speechRate}
                  onChange={e => onSpeechRateChange(Number(e.target.value))}
                  className="mt-3 w-full accent-cyan-400"
                />
              </label>
            </div>

            <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
              <span>{t.browserSpeechToggle}</span>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={e => onSpeechEnabledChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-400"
              />
            </label>

            <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
              <span>
                <span className="block font-medium text-slate-100">{t.autoGreetToggle}</span>
                <span className="mt-1 block text-xs text-slate-300">{t.autoGreetDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={autoGreet}
                onChange={e => onAutoGreetChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-400"
              />
            </label>

            <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
              <span>
                <span className="block font-medium text-slate-100">{t.bargeInToggle}</span>
                <span className="mt-1 block text-xs text-slate-300">{t.bargeInDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={bargeIn}
                onChange={e => onBargeInChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-400"
              />
            </label>

            <div>
              <span className="block text-sm font-medium text-slate-100">{t.micModeLabel}</span>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={micMode === 'push_to_talk'}
                  onClick={() => onMicModeChange('push_to_talk')}
                  className={`${buttonClass} ${micMode === 'push_to_talk' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                >
                  {t.micModePtt}
                </button>
                <button
                  type="button"
                  aria-pressed={micMode === 'continuous'}
                  onClick={() => onMicModeChange('continuous')}
                  className={`${buttonClass} ${micMode === 'continuous' ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                >
                  {t.micModeContinuous}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'speechPipeline' && (
          <div className="space-y-5">
            <div className="rounded-xl border border-sky-800/60 bg-[#061221]/90 p-4">
              <h3 className="text-sm font-medium text-sky-200">{t.pipelineTitle}</h3>
              <div dir="ltr" className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs text-cyan-100">
                {['Microphone', 'Silero VAD', 'Streaming ASR (ar-EG)', 'Intent Router / LLM', 'Streaming Egyptian TTS', 'Speaker'].map((step, i, arr) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    <span className="rounded-lg border border-cyan-400/40 bg-sky-950/70 px-2.5 py-1.5">{step}</span>
                    {i < arr.length - 1 && <span className="text-sky-400">→</span>}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <button type="button" className={buttonClass} onClick={onToggleMic}>
                  {avatarState === 'listening' ? t.stopMicBtn : t.testMicBtn}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium text-slate-100">{t.latencyTargetTitle}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-300">{t.latencyTargetDesc}</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#06111e] text-slate-300">
                    <tr>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.stage}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.budget}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.measured}</th>
                      <th className="px-3 py-2.5 text-start font-medium">{t.latencyCols.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {VOICE_LATENCY_STAGES.map(stage => (
                      <tr key={stage.id} className="bg-[#081322]/60">
                        <td className="px-3 py-2.5 text-slate-100">{ar ? stage.stageAr : stage.stageEn}</td>
                        <td dir="ltr" className="px-3 py-2.5 font-mono text-sky-200">{stage.targetBudget}</td>
                        <td dir="ltr" className="px-3 py-2.5 font-mono text-slate-400">{stage.measured}</td>
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
            {/* Execution Profile Presets */}
            <div>
              <h3 className="text-sm font-medium text-sky-200">{t.executionProfileLabel}</h3>
              <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
                {EXECUTION_PROFILE_KEYS.map(key => {
                  const active = executionProfile === key
                  const copy = t.executionProfiles[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onExecutionProfileChange(key)}
                      className={`rounded-xl border p-3.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        active
                          ? 'border-cyan-400 bg-sky-500/20 text-sky-50'
                          : 'border-slate-800 bg-[#06111e]/75 text-slate-300 hover:border-sky-600/60'
                      }`}
                    >
                      <span className="block text-xs font-semibold text-cyan-100">{copy.title}</span>
                      <span className="mt-1.5 block text-xs leading-5 text-slate-300">{copy.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-100">
                {t.contextWindowLabel}
                <select
                  aria-label={t.contextWindowLabel}
                  value={contextWindow}
                  onChange={e => onContextWindowChange(Number(e.target.value))}
                  className={`${fieldClass} mt-2`}
                >
                  <option value={4096}>4,096 tokens ({ar ? 'سريع وخفيف' : 'Fast & low VRAM'})</option>
                  <option value={8192}>8,192 tokens ({ar ? 'متوازن — افتراضي' : 'Balanced — default'})</option>
                  <option value={16384}>16,384 tokens ({ar ? 'أغاني طويلة ومشاريع' : 'Long lyrics & context'})</option>
                  <option value={32768}>32,768 tokens ({ar ? 'سياق موسّع' : 'Extended context'})</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-100">
                {t.precisionPreferenceLabel}
                <select
                  aria-label={t.precisionPreferenceLabel}
                  value={precisionPref}
                  onChange={e => onPrecisionPrefChange(e.target.value as 'auto_turing' | 'fp16' | 'int8' | 'gguf_q4km')}
                  className={`${fieldClass} mt-2`}
                >
                  <option value="auto_turing">Auto Turing SM 7.5 (FP16 / GGUF Q4_K_M)</option>
                  <option value="fp16">FP16 Tensor Cores (No BF16)</option>
                  <option value="int8">INT8 Quantized (Whisper / Audio)</option>
                  <option value="gguf_q4km">GGUF Q4_K_M (llama.cpp)</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#06111e]/85 p-4">
              <h3 className="text-sm font-medium text-sky-200">{t.orchestratorStateTitle}</h3>
              <div dir="ltr" className="mt-3 flex flex-wrap gap-1.5 font-mono text-[11px]">
                {ORCHESTRATOR_STATES.map(st => (
                  <span
                    key={st}
                    className={`rounded-md border px-2 py-1 ${
                      st === 'IDLE'
                        ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-100'
                        : st === 'EXTERNAL_GPU_BUSY' || st === 'FAILED'
                          ? 'border-amber-400/40 bg-amber-500/10 text-amber-200'
                          : 'border-slate-700 bg-slate-900/70 text-slate-300'
                    }`}
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
                <span className="flex items-center justify-between font-medium text-slate-100">
                  <span>{t.idleTimeoutLabel}</span>
                  <span dir="ltr" className="font-mono text-cyan-200">{idleTimeoutSec}s</span>
                </span>
                <input
                  type="range"
                  min={30}
                  max={600}
                  step={30}
                  value={idleTimeoutSec}
                  onChange={e => onIdleTimeoutSecChange(Number(e.target.value))}
                  className="mt-3 w-full accent-cyan-400"
                />
                <span className="mt-1.5 block text-xs text-slate-300">{t.idleTimeoutDesc}</span>
              </label>

              <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
                <span>
                  <span className="block font-medium text-slate-100">{t.routerModeToggle}</span>
                  <span className="mt-1 block text-xs text-slate-300">{t.routerModeDesc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={routerMode}
                  onChange={e => onRouterModeChange(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-cyan-400"
                />
              </label>
            </div>

            <p className="rounded-xl border border-sky-800/50 bg-sky-950/30 p-3.5 text-xs leading-6 text-sky-100">
              {t.lazyInitNote}
            </p>

            <div>
              <h3 className="mb-2.5 text-sm font-medium text-slate-100">{t.orchestratorRoutingTitle}</h3>
              <div className="grid gap-2.5">
                {TASK_ROUTING_TABLE.map(rule => (
                  <div key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#071220]/80 px-4 py-3 text-xs">
                    <span className="font-medium text-slate-100">{ar ? rule.taskAr : rule.taskEn}</span>
                    <span className="text-sky-200">{ar ? rule.enginesAr : rule.enginesEn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gpuGuard' && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#06111e]/85 p-4">
                <h3 className="text-sm font-medium text-sky-200">{t.gpuProfileTitle}</h3>
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
                      <dt className="text-slate-400">{label}</dt>
                      <dd dir="ltr" className="font-mono text-slate-100">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-xl border border-amber-500/35 bg-amber-950/15 p-4">
                <h3 className="text-sm font-medium text-amber-200">{t.gpuLiveTelemetryTitle}</h3>
                <p className="mt-2 text-xs leading-6 text-amber-100/90">{t.gpuLiveOfflineNotice}</p>
                <dl className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{ar ? 'الذاكرة المستخدمة / الكلية' : 'VRAM Used / Total'}</dt>
                    <dd dir="ltr" className="font-mono text-amber-100">— / — ({ar ? 'غير متصل' : 'Companion offline'})</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{ar ? 'عمّال حافظ النشطون' : 'HAFIZ Workers'}</dt>
                    <dd dir="ltr" className="font-mono text-slate-200">0 ({ar ? 'معاينة ويب' : 'Web preview'})</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{ar ? 'فحص العمليات الخارجية على GPU' : 'External GPU Probe'}</dt>
                    <dd className="text-slate-200">{ar ? 'لم يُفحص بعد' : 'Not probed'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
                <span className="flex items-center justify-between font-medium text-slate-100">
                  <span>{t.gpuVramMarginLabel}</span>
                  <span dir="ltr" className="font-mono text-cyan-200">{vramMarginGb.toFixed(1)} GB</span>
                </span>
                <input
                  type="range"
                  min={1.0}
                  max={4.5}
                  step={0.5}
                  value={vramMarginGb}
                  onChange={e => onVramMarginGbChange(Number(e.target.value))}
                  className="mt-3 w-full accent-cyan-400"
                />
                <span className="mt-1.5 block text-xs text-slate-300">{t.gpuVramMarginDesc}</span>
              </label>

              <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
                <span>
                  <span className="block font-medium text-slate-100">{t.singleModelLockToggle}</span>
                  <span className="mt-1 block text-xs text-slate-300">{t.singleModelLockDesc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={singleModelLock}
                  onChange={e => onSingleModelLockChange(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-cyan-400"
                />
              </label>
            </div>

            <div className="rounded-xl border border-sky-800/60 bg-[#061425]/85 p-4">
              <h3 className="text-sm font-medium text-sky-200">{t.externalWorkloadTitle}</h3>
              <p className="mt-1.5 text-xs leading-6 text-slate-300">{t.externalWorkloadDesc}</p>
            </div>

            <div className="rounded-xl border border-cyan-500/40 bg-[#07192d]/85 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-2xl">
                  <h3 className="text-sm font-medium text-cyan-100">{t.purgeVramBtn}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{t.purgeVramDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={onPurgeVram}
                  className={`${buttonClass} border-cyan-400/70 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-400/25`}
                >
                  {t.purgeVramBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modelsCompat' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-sky-200">{t.turingRulesTitle}</h3>
            <ul className="space-y-2.5 text-sm leading-6 text-slate-200">
              {t.turingRules.map((rule, idx) => (
                <li key={idx} className="rounded-xl border border-slate-800 bg-[#06111e]/75 px-4 py-3">
                  {rule}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.verifyCuda}</button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.restoreKnownGood}</button>
            </div>
          </div>
        )}

        {activeTab === 'downloadsStorage' && (
          <div className="space-y-5">
            {/* EXE / First-Run Model Mode Selector */}
            <div>
              <h3 className="text-sm font-medium text-sky-200">{t.setupModeTitle}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-300">{t.setupModeDesc}</p>
              <div className="mt-2.5 grid gap-2.5 md:grid-cols-3">
                {SETUP_MODE_KEYS.map(modeKey => {
                  const active = setupMode === modeKey
                  const copy = t.setupModes[modeKey]
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSetupModeChange(modeKey)}
                      className={`rounded-xl border p-3.5 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                        active
                          ? 'border-cyan-400 bg-sky-500/20 text-sky-50'
                          : 'border-slate-800 bg-[#06111e]/75 text-slate-300 hover:border-sky-600/60'
                      }`}
                    >
                      <span className="block text-xs font-semibold text-cyan-100">{copy.title}</span>
                      <span className="mt-1.5 block text-xs leading-5 text-slate-300">{copy.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-100">
                {t.appInstallDirLabel}
                <input
                  dir="ltr"
                  value={appInstallDir}
                  onChange={e => onAppInstallDirChange(e.target.value)}
                  className={`${fieldClass} mt-2 font-mono text-xs text-cyan-100`}
                  placeholder="E:\HAFIZ_In_Slang"
                />
                <span className="mt-1.5 block text-xs font-normal text-slate-300">{t.appInstallDirHint}</span>
              </label>

              <label className="block text-sm font-medium text-slate-100">
                {t.storageDirLabel}
                <input
                  dir="ltr"
                  value={modelDir}
                  onChange={e => onModelDirChange(e.target.value)}
                  className={`${fieldClass} mt-2 font-mono text-xs text-cyan-100`}
                  placeholder="E:\HAFIZ_Models"
                />
                <span className="mt-1.5 block text-xs font-normal text-slate-300">{t.storageDirHint}</span>
              </label>
            </div>

            {/* Multi-Partition / Multi-Folder Scanner (E:\, D:\...) */}
            <PartitionScanManager
              t={t}
              scanPartitions={scanPartitions}
              onScanPartitionsChange={onScanPartitionsChange}
              inPlaceLinking={inPlaceLinking}
              onInPlaceLinkingChange={onInPlaceLinkingChange}
              onNotice={onNotice}
              buttonClass={buttonClass}
              fieldClass={fieldClass}
            />

            {/* Bandwidth & Auto-Resume Controls */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-100">
                {t.downloadSpeedLimitLabel}
                <select
                  aria-label={t.downloadSpeedLimitLabel}
                  value={downloadSpeedLimitMb}
                  onChange={e => onDownloadSpeedLimitMbChange(Number(e.target.value))}
                  className={`${fieldClass} mt-2`}
                >
                  <option value={0}>{t.downloadSpeedUnlimited}</option>
                  <option value={5}>5 MB/s</option>
                  <option value={15}>15 MB/s</option>
                  <option value={50}>50 MB/s</option>
                </select>
              </label>

              <label className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
                <span>
                  <span className="block font-medium text-slate-100">{t.autoResumeToggle}</span>
                  <span className="mt-1 block text-xs text-slate-300">{t.autoResumeDesc}</span>
                </span>
                <input
                  type="checkbox"
                  checked={autoResumeDownloads}
                  onChange={e => onAutoResumeDownloadsChange(e.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 accent-cyan-400"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" className={`${buttonClass} border-cyan-400/60 bg-sky-500/15 text-cyan-100`} onClick={onOpenWizard}>
                {t.openFirstRunWizard}
              </button>
              <button type="button" className={buttonClass} onClick={onOpenModelLibrary}>
                {t.navModels} {manualOverridesCount > 0 ? `(${manualOverridesCount})` : ''}
              </button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.scanModelLibraries}</button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.continueDownloads}</button>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-4">
            <label className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#06111e]/70 p-4 text-sm">
              <span>{t.browserSpeechToggle}</span>
              <input
                type="checkbox"
                checked={speechEnabled}
                onChange={e => onSpeechEnabledChange(e.target.checked)}
                className="h-5 w-5 shrink-0 accent-cyan-400"
              />
            </label>
            <button type="button" className={buttonClass} onClick={onToggleMic}>
              {avatarState === 'listening' ? t.stopMicBtn : t.testMicBtn}
            </button>
          </div>
        )}

        {activeTab === 'memoryProfiles' && (
          <div className="space-y-4 text-sm text-slate-200">
            <p className="rounded-xl border border-slate-800 bg-[#06111e]/75 p-4 leading-6">
              {ar
                ? `عدد المشاريع والمسودات المحفوظة محليًا في هذا المتصفح: ${savedProjectsCount}. عدد المسارات اليدوية المربوطة في مكانها للموديلات: ${manualOverridesCount}. ملفات الأصوات المرجعية المصرّح بها تُخزّن محليًا فقط عند ربط محرك ويندوز.`
                : `Locally saved lyric projects in this browser: ${savedProjectsCount}. Manual in-place model path overrides configured: ${manualOverridesCount}. Authorized reference voice profiles stay strictly local when connected to the Windows companion.`}
            </p>
          </div>
        )}

        {activeTab === 'updatesHealth' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-sky-200">{t.healthManualTitle}</h3>
            <p className="rounded-xl border border-sky-800/50 bg-sky-950/25 p-3.5 text-xs leading-6 text-sky-100">
              {t.nonBlockingStartupNote}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.checkUpdates}</button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.repairRuntime}</button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.verifyCuda}</button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.scanLibraries}</button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.runDiagnostics}</button>
              <button type="button" className={`${buttonClass} border-cyan-400/60 bg-sky-500/15 text-cyan-100`} onClick={onExportDiagnostics}>
                {t.healthActions.exportReport}
              </button>
              <button type="button" className={buttonClass} onClick={onBlocked}>{t.healthActions.restoreKnownGood}</button>
              <button type="button" className={buttonClass} onClick={onOpenWizard}>{t.openFirstRunWizard}</button>
            </div>
          </div>
        )}

        {activeTab === 'securityPrivacy' && (
          <ul className="space-y-2.5 text-sm leading-6 text-slate-200">
            {t.securityRules.map((rule, idx) => (
              <li key={idx} className="rounded-xl border border-slate-800 bg-[#06111e]/75 px-4 py-3">
                {rule}
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-medium text-sky-100">{t.verificationMatrixTitle}</h3>
                <button
                  type="button"
                  onClick={onExportDiagnostics}
                  className={`${buttonClass} border-cyan-400/60 bg-sky-500/15 text-cyan-100`}
                >
                  {t.healthActions.exportReport}
                </button>
              </div>
              <div className="space-y-2">
                {VERIFICATION_MATRIX.map(item => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#06111e]/75 px-4 py-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-100">{ar ? item.checkAr : item.checkEn}</p>
                      <p className="mt-0.5 text-slate-400">{ar ? item.noteAr : item.noteEn}</p>
                    </div>
                    <span dir="ltr" className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[11px] ${statusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-base font-medium text-sky-100">{t.contractsTitle}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-300">{t.contractsDesc}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {ACTION_CONTRACTS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selectedContract.id === c.id}
                    onClick={() => setSelectedContractId(c.id)}
                    className={`${buttonClass} text-xs ${selectedContract.id === c.id ? 'border-cyan-400 bg-sky-500/20 text-cyan-100' : ''}`}
                  >
                    {ar ? c.labelAr : c.labelEn}
                  </button>
                ))}
              </div>

              <dl className="mt-4 grid gap-2 rounded-xl border border-slate-800 bg-[#050d17]/90 p-4 text-xs">
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Action ID</dt>
                  <dd dir="ltr" className="font-mono text-cyan-200">{selectedContract.id}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">AR / EN</dt>
                  <dd className="text-slate-100">{selectedContract.labelAr} · {selectedContract.labelEn}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">{ar ? 'الإجراء المتوقع' : 'Expected action'}</dt>
                  <dd className="text-slate-200">{ar ? selectedContract.expectedActionAr : selectedContract.expectedActionEn}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">IPC / Endpoint</dt>
                  <dd dir="ltr" className="break-all font-mono text-sky-200">{selectedContract.endpoint}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Service / Model</dt>
                  <dd dir="ltr" className="font-mono text-slate-200">{selectedContract.requiredService}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Input Schema</dt>
                  <dd dir="ltr" className="break-all font-mono text-slate-300">{selectedContract.inputSchema}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Output Schema</dt>
                  <dd dir="ltr" className="break-all font-mono text-slate-300">{selectedContract.outputSchema}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Loading / Cancel</dt>
                  <dd className="text-slate-300">{selectedContract.loadingPolicy} {selectedContract.cancellationPolicy}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Error / Retry</dt>
                  <dd className="text-slate-300">{selectedContract.errorRetryPolicy}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Persistent Keys</dt>
                  <dd dir="ltr" className="font-mono text-slate-300">{selectedContract.persistentConfig}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <dt className="text-slate-400">Verification</dt>
                  <dd className="text-slate-300">{selectedContract.verificationCriteria}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-3 text-sm leading-7 text-slate-200">
            {t.aboutLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
