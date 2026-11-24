import { useState } from 'react'
import { MODEL_CATALOG, TARGET_HARDWARE_SPEC } from '../contracts/orchestrator'
import type { AppTranslations } from '../i18n/translations'

interface FirstRunWizardModalProps {
  open: boolean
  ar: boolean
  t: AppTranslations
  modelDir: string
  onModelDirChange: (dir: string) => void
  onClose: () => void
  onComplete: () => void
  buttonClass: string
  fieldClass: string
}

export function FirstRunWizardModal({
  open,
  ar,
  t,
  modelDir,
  onModelDirChange,
  onClose,
  onComplete,
  buttonClass,
  fieldClass,
}: FirstRunWizardModalProps) {
  const [step, setStep] = useState(0)
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
        className="w-full max-w-2xl rounded-2xl border border-cyan-400/45 bg-[#071525] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_32px_rgba(0,160,255,0.2)]"
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

        {/* Stepper */}
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {t.wizardSteps.map((label, idx) => (
            <li
              key={label}
              className={`rounded-lg border px-2.5 py-2 text-center text-xs ${
                idx === step
                  ? 'border-cyan-400 bg-sky-500/20 font-medium text-cyan-100'
                  : idx < step
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-800 bg-[#050d17] text-slate-400'
              }`}
            >
              {idx + 1}. {label}
            </li>
          ))}
        </ol>

        <div className="mt-5 min-h-[200px] rounded-xl border border-slate-800 bg-[#050d17]/90 p-4 text-sm">
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
            <div className="space-y-3">
              <p className="text-xs leading-6 text-slate-300">{t.wizardReuseNote}</p>
              <label className="block text-xs font-medium text-sky-100">
                {t.storageDirLabel}
                <input
                  dir="ltr"
                  value={modelDir}
                  onChange={e => onModelDirChange(e.target.value)}
                  className={`${fieldClass} mt-2 font-mono text-xs text-cyan-100`}
                  placeholder="E:\HAFIZ_Models"
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5">
              {MODEL_CATALOG.slice(0, 4).map(m => (
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
              <div dir="ltr" className="rounded-lg border border-sky-800/60 bg-[#071525] p-3 font-mono text-[11px] text-sky-200">
                manifest: hafiz-win11-turing-sm75.lock.json<br />
                directory: {modelDir}<br />
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
                  setStep(0)
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
