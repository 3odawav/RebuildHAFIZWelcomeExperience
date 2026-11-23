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
  uiScale: number
  onUiScaleChange: (scale: number) => void
  dockSide: DockSide
  onDockSideChange: (side: DockSide) => void
  speechEnabled: boolean
  onSpeechEnabledChange: (val: boolean) => void
  bargeIn: boolean
  onBargeInChange: (val: boolean) => void
  micMode: 'push_to_talk' | 'continuous'
  onMicModeChange: (mode: 'push_to_talk' | 'continuous') => void
  idleTimeoutSec: number
  onIdleTimeoutSecChange: (sec: number) => void
  routerMode: boolean
  onRouterModeChange: (val: boolean) => void
  vramMarginGb: number
  onVramMarginGbChange: (gb: number) => void
  singleModelLock: boolean
  onSingleModelLockChange: (val: boolean) => void
  modelDir: string
  onModelDirChange: (dir: string) => void
  savedProjectsCount: number
  avatarState: AvatarState
  onToggleMic: () => void
  onPurgeVram: () => void
  onBlocked: () => void
  onExportDiagnostics: () => void
  onOpenWizard: () => void
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

export function SettingsCenterView({
  ar,
  t,
  activeTab,
  onTabChange,
  language,
  onLanguageChange,
  voiceLanguage,
  onVoiceLanguageChange,
  uiScale,
  onUiScaleChange,
  dockSide,
  onDockSideChange,
  speechEnabled,
  onSpeechEnabledChange,
  bargeIn,
  onBargeInChange,
  micMode,
  onMicModeChange,
  idleTimeoutSec,
  onIdleTimeoutSecChange,
  routerMode,
  onRouterModeChange,
  vramMarginGb,
  onVramMarginGbChange,
  singleModelLock,
  onSingleModelLockChange,
  modelDir,
  onModelDirChange,
  savedProjectsCount,
  avatarState,
  onToggleMic,
  onPurgeVram,
  onBlocked,
  onExportDiagnostics,
  onOpenWizard,
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
            <label className="block text-sm font-medium text-slate-100">
              {t.interfaceLanguageLabel}
              <select
                aria-label={t.interfaceLanguageLabel}
                value={language}
                onChange={e => onLanguageChange(e.target.value as UiLanguage)}
                className={`${fieldClass} mt-2 max-w-md`}
              >
                <option value="ar">العربية المصرية (ar-EG · RTL)</option>
                <option value="en">English (en-US · LTR)</option>
              </select>
            </label>

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
          </div>
        )}

        {activeTab === 'assistant' && (
          <div className="space-y-5">
            <label className="block text-sm font-medium text-slate-100">
              {t.voiceLanguageLabel}
              <p className="mt-1 text-xs font-normal text-slate-300">{t.voiceLanguageDesc}</p>
              <select
                aria-label={t.voiceLanguageLabel}
                value={voiceLanguage}
                onChange={e => onVoiceLanguageChange(e.target.value as VoiceLanguage)}
                className={`${fieldClass} mt-2 max-w-md`}
              >
                <option value="ar-EG">العامية المصرية (ar-EG)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </label>

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
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-100">
              {t.storageDirLabel}
              <input
                dir="ltr"
                value={modelDir}
                onChange={e => onModelDirChange(e.target.value)}
                className={`${fieldClass} mt-2 max-w-xl font-mono text-xs text-cyan-100`}
              />
            </label>
            <p className="text-xs leading-6 text-slate-300">{t.storageDirHint}</p>
            <div className="flex flex-wrap gap-2.5">
              <button type="button" className={buttonClass} onClick={onOpenWizard}>{t.openFirstRunWizard}</button>
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
                ? `عدد المشاريع والمسودات المحفوظة محليًا في هذا المتصفح: ${savedProjectsCount}. ملفات الأصوات المرجعية المصرّح بها تُخزّن محليًا فقط عند ربط محرك ويندوز.`
                : `Locally saved lyric projects in this browser: ${savedProjectsCount}. Authorized reference voice profiles stay strictly local when connected to the Windows companion.`}
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
