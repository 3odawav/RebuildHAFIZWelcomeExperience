import { useState } from 'react'
import { MODEL_CATALOG, TARGET_HARDWARE_SPEC } from '../contracts/orchestrator'
import type { AppTranslations } from '../i18n/translations'
import type { ModelSetupMode } from '../utils/storageConfig'
import { PartitionScanManager } from './PartitionScanManager'

interface FirstRunWizardModalProps {
  open: boolean
  ar: boolean
  t: AppTranslations
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
  onNotice?: (message: string) => void
  onClose: () => void
  onComplete: () => void
  buttonClass: string
  fieldClass: string
}

const SETUP_MODE_KEYS: readonly ModelSetupMode[] = [
  'scan_in_place',
  'hybrid_scan_then_download',
  'download_all',
]

export function FirstRunWizardModal({
  open,
  ar,
  t,
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
  onNotice,
  onClose,
  onComplete,
  buttonClass,
  fieldClass,
}: FirstRunWizardModalProps) {
  const [step, setStep] = useState(1)
  const [approved, setApproved] = useState(true)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#020814cc] p-4 backdrop-blur-md"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-wizard-title"
        className="my-auto flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-cyan-400/45 bg-[#071525] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_32px_rgba(0,160,255,0.2)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 id="first-run-wizard-title" className="text-lg font-medium text-sky-100">
              {t.wizardTitle}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-300">{t.wizardSubtitle}</p>
          </div>
          <button
            type="button"
            aria-label={t.wizardCloseAria}
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-200 hover:border-cyan-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Clickable Stepper */}
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {t.wizardSteps.map((label, idx) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(idx)}
                className={`w-full rounded-lg border px-2.5 py-2 text-center text-xs transition ${
                  idx === step
                    ? 'border-cyan-400 bg-sky-500/20 font-medium text-cyan-100'
                    : idx < step
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-slate-800 bg-[#050d17] text-slate-400 hover:border-slate-600'
                }`}
              >
                {idx + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-[#050d17]/90 p-4 text-sm">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-xs leading-6 text-amber-200">{t.wizardHardwareNote}</p>
              <dl className="grid gap-1.5 text-xs">
                {([
                  ['os', ar ? 'نظام التشغيل' : 'OS', TARGET_HARDWARE_SPEC.os],
                  ['gpu', ar ? 'كارت الشاشة' : 'GPU', TARGET_HARDWARE_SPEC.gpu],
                  ['vram', ar ? 'ذاكرة الفيديو (VRAM)' : 'VRAM', TARGET_HARDWARE_SPEC.vram],
                  ['arch', ar ? 'المعمارية' : 'Architecture', TARGET_HARDWARE_SPEC.architecture],
                  ['ram', ar ? 'الذاكرة العشوائية' : 'System RAM', TARGET_HARDWARE_SPEC.ram],
                  ['prec', ar ? 'دقة التشغيل' : 'Precision', TARGET_HARDWARE_SPEC.precision],
                ] as const).map(([key, label, value]) => (
                  <div key={key} className="flex flex-wrap justify-between gap-2 border-b border-slate-800/70 pb-1">
                    <dt className="text-slate-400">{label}</dt>
                    <dd dir="ltr" className="font-mono text-slate-100">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {/* EXE Setup Choice: Download vs Scan Partitions In-Place */}
              <div>
                <h3 className="text-sm font-medium text-cyan-100">{t.setupModeTitle}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-300">{t.setupModeDesc}</p>
                <div className="mt-2.5 grid gap-2">
                  {SETUP_MODE_KEYS.map(modeKey => {
                    const active = setupMode === modeKey
                    const copy = t.setupModes[modeKey]
                    return (
                      <button
                        key={modeKey}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onSetupModeChange(modeKey)}
                        className={`rounded-xl border p-3 text-start transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                          active
                            ? 'border-cyan-400 bg-sky-500/20 text-sky-50'
                            : 'border-slate-800 bg-[#071322]/70 text-slate-300 hover:border-sky-600/60'
                        }`}
                      >
                        <span className="block text-xs font-semibold text-cyan-100">{copy.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-300">{copy.desc}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Target App Install Path (E:\HAFIZ_In_Slang) & Model Download Folder (E:\HAFIZ_Models) */}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-sky-100">
                  {t.appInstallDirLabel}
                  <input
                    dir="ltr"
                    value={appInstallDir}
                    onChange={e => onAppInstallDirChange(e.target.value)}
                    className={`${fieldClass} mt-1.5 py-2.5 font-mono text-xs text-cyan-100`}
                    placeholder="E:\HAFIZ_In_Slang"
                  />
                </label>
                <label className="block text-xs font-medium text-sky-100">
                  {t.storageDirLabel}
                  <input
                    dir="ltr"
                    value={modelDir}
                    onChange={e => onModelDirChange(e.target.value)}
                    className={`${fieldClass} mt-1.5 py-2.5 font-mono text-xs text-cyan-100`}
                    placeholder="E:\HAFIZ_Models"
                  />
                </label>
              </div>

              {/* Multi-Partition / Multi-Folder Scanner (E:\, D:\...) */}
              {setupMode !== 'download_all' && (
                <PartitionScanManager
                  t={t}
                  scanPartitions={scanPartitions}
                  onScanPartitionsChange={onScanPartitionsChange}
                  inPlaceLinking={inPlaceLinking}
                  onInPlaceLinkingChange={onInPlaceLinkingChange}
                  onNotice={onNotice}
                  buttonClass={buttonClass}
                  fieldClass={fieldClass}
                  compact
                />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5">
              {MODEL_CATALOG.map(m => (
                <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#071322] px-3 py-2 text-xs">
                  <span className="font-medium text-slate-100">{ar ? m.friendlyAr : m.friendlyEn}</span>
                  <span dir="ltr" className="font-mono text-cyan-200">{m.quantization}</span>
                </div>
              ))}
              <label className="mt-3 flex items-start gap-2.5 pt-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={e => setApproved(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-400"
                />
                <span>{t.wizardApprovalCheck}</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-xs leading-6 text-slate-200">
              <p>{t.wizardManifestNote}</p>
              <div dir="ltr" className="rounded-lg border border-sky-800/60 bg-[#071525] p-3 font-mono text-[11px] leading-6 text-sky-200">
                manifest: hafiz-win11-turing-sm75.lock.json<br />
                exe_install_target: {appInstallDir}<br />
                model_setup_mode: {setupMode}<br />
                model_download_dir: {modelDir}<br />
                scan_partitions: [{scanPartitions.join(', ')}]<br />
                in_place_linking: {String(inPlaceLinking)} (zero-move / zero-copy)<br />
                startup_mode: offline-first (cached health probe)
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={buttonClass}
          >
            {t.wizardBack}
          </button>
          <div className="flex gap-2">
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 2 && !approved}
                onClick={() => setStep(s => Math.min(3, s + 1))}
                className={`${buttonClass} border-cyan-400/70 bg-sky-500/20 text-cyan-100`}
              >
                {t.wizardNext}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onComplete()
                  setStep(1)
                }}
                className={`${buttonClass} border-cyan-400/70 bg-cyan-500/25 text-cyan-100`}
              >
                {t.wizardFinish}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
