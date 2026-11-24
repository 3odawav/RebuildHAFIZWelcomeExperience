import { useState } from 'react'
import { MODEL_CATALOG, TARGET_HARDWARE_SPEC } from '../contracts/orchestrator'
import type { AppTranslations } from '../i18n/translations'
import {
  COMMON_WINDOWS_DRIVES,
  normalizeWindowsPath,
  type ModelSetupMode,
  type UiThemePreset,
} from '../utils/storageConfig'
import { getThemeTokens } from '../utils/themeTokens'

interface FirstRunWizardModalProps {
  open: boolean
  ar: boolean
  t: AppTranslations
  theme: UiThemePreset
  appInstallDir: string
  onAppInstallDirChange: (dir: string) => void
  modelDir: string
  onModelDirChange: (dir: string) => void
  setupMode: ModelSetupMode
  onSetupModeChange: (mode: ModelSetupMode) => void
  scanPartitions: string[]
  onTogglePartition: (drive: string) => void
  inPlaceLinking: boolean
  onInPlaceLinkingChange: (val: boolean) => void
  onOpenScanner: () => void
  onClose: () => void
  onComplete: () => void
}

export function FirstRunWizardModal({
  open,
  ar,
  t,
  theme,
  appInstallDir,
  onAppInstallDirChange,
  modelDir,
  onModelDirChange,
  setupMode,
  onSetupModeChange,
  scanPartitions,
  onTogglePartition,
  inPlaceLinking,
  onInPlaceLinkingChange,
  onOpenScanner,
  onClose,
  onComplete,
}: FirstRunWizardModalProps) {
  const [step, setStep] = useState(1)
  const [approved, setApproved] = useState(true)

  if (!open) return null

  const tokens = getThemeTokens(theme)
  const normalizedSet = new Set(scanPartitions.map(p => normalizeWindowsPath(p).toLowerCase()))

  const setupModes: { id: ModelSetupMode; title: string; desc: string }[] = [
    { id: 'scan_in_place', title: t.setupModeScanLabel, desc: t.setupModeScanDesc },
    { id: 'hybrid_scan_then_download', title: t.setupModeHybridLabel, desc: t.setupModeHybridDesc },
    { id: 'download_all', title: t.setupModeDownloadLabel, desc: t.setupModeDownloadDesc },
  ]

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 ${tokens.modalBackdrop}`}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-wizard-title"
        className={`w-full max-w-2xl rounded-2xl border p-6 ${tokens.modalSurface}`}
      >
        <div className={`flex items-start justify-between gap-4 border-b pb-4 ${tokens.borderSubtle}`}>
          <div>
            <h2 id="first-run-wizard-title" className={`text-lg font-medium ${tokens.heading}`}>
              {t.wizardTitle}
            </h2>
            <p className={`mt-1 text-xs leading-5 ${tokens.textMuted}`}>{t.wizardSubtitle}</p>
          </div>
          <button
            type="button"
            aria-label={t.wizardCloseAria}
            onClick={onClose}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${tokens.borderSubtle} ${tokens.textMuted} hover:border-cyan-400`}
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {t.wizardSteps.map((label, idx) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(idx)}
                className={`w-full rounded-lg border px-2.5 py-2 text-center text-xs transition ${
                  idx === step
                    ? tokens.buttonActive
                    : idx < step
                      ? tokens.badgeSuccess
                      : `${tokens.borderSubtle} ${tokens.textMuted}`
                }`}
              >
                {idx + 1}. {label}
              </button>
            </li>
          ))}
        </ol>

        <div className={`${tokens.subCard} mt-5 min-h-[240px] p-4 text-sm`}>
          {step === 0 && (
            <div className="space-y-3">
              <p className={`rounded-lg border p-3 text-xs leading-6 ${tokens.badgeWarn}`}>{t.wizardHardwareNote}</p>
              <dl className="grid gap-1.5 text-xs">
                {([
                  ['os', ar ? 'نظام التشغيل' : 'OS', TARGET_HARDWARE_SPEC.os],
                  ['gpu', ar ? 'كارت الشاشة' : 'GPU', TARGET_HARDWARE_SPEC.gpu],
                  ['vram', ar ? 'ذاكرة الفيديو (VRAM)' : 'VRAM', TARGET_HARDWARE_SPEC.vram],
                  ['arch', ar ? 'المعمارية' : 'Architecture', TARGET_HARDWARE_SPEC.architecture],
                  ['ram', ar ? 'الذاكرة العشوائية' : 'System RAM', TARGET_HARDWARE_SPEC.ram],
                  ['prec', ar ? 'دقة التشغيل' : 'Precision', TARGET_HARDWARE_SPEC.precision],
                ] as const).map(([key, label, value]) => (
                  <div key={key} className={`flex flex-wrap justify-between gap-2 border-b pb-1 ${tokens.borderSubtle}`}>
                    <dt className={tokens.textMuted}>{label}</dt>
                    <dd dir="ltr" className={`font-mono ${tokens.textPrimary}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <p className={`text-xs font-medium ${tokens.heading}`}>{t.setupModeTitle}</p>
                <div className="mt-2 grid gap-2">
                  {setupModes.map(opt => (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition ${
                        setupMode === opt.id ? tokens.buttonActive : `${tokens.borderSubtle} ${tokens.textPrimary}`
                      }`}
                    >
                      <input
                        type="radio"
                        name="hafiz-setup-mode"
                        checked={setupMode === opt.id}
                        onChange={() => onSetupModeChange(opt.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-500"
                      />
                      <span>
                        <span className="block font-medium">{opt.title}</span>
                        <span className={`mt-0.5 block leading-5 ${tokens.textMuted}`}>{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`block text-xs font-medium ${tokens.heading}`}>
                  {t.appInstallDirLabel}
                  <input
                    dir="ltr"
                    value={appInstallDir}
                    onChange={e => onAppInstallDirChange(e.target.value)}
                    className={`${tokens.field} mt-1.5 py-2 font-mono text-xs`}
                    placeholder="E:\HAFIZ_In_Slang"
                  />
                </label>
                <label className={`block text-xs font-medium ${tokens.heading}`}>
                  {t.storageDirLabel}
                  <input
                    dir="ltr"
                    value={modelDir}
                    onChange={e => onModelDirChange(e.target.value)}
                    className={`${tokens.field} mt-1.5 py-2 font-mono text-xs`}
                    placeholder="E:\HAFIZ_Models"
                  />
                </label>
              </div>

              {setupMode !== 'download_all' && (
                <div className={`space-y-2 rounded-xl border p-3 ${tokens.borderSubtle}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`text-xs font-medium ${tokens.textPrimary}`}>{t.scannerSelectDrives}</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        onOpenScanner()
                      }}
                      className={`text-xs underline ${tokens.textAccent}`}
                    >
                      {t.scanPartitionsAction}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_WINDOWS_DRIVES.map(drive => {
                      const active = normalizedSet.has(drive.toLowerCase())
                      return (
                        <button
                          key={drive}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onTogglePartition(drive)}
                          className={`${tokens.button} min-h-9 px-3 font-mono text-xs ${active ? tokens.buttonActive : ''}`}
                        >
                          <span dir="ltr">{drive}</span>
                          {active && <span aria-hidden="true">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                  <label className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span className={tokens.textMuted}>{t.inPlaceLinkingToggle}</span>
                    <input
                      type="checkbox"
                      checked={inPlaceLinking}
                      onChange={e => onInPlaceLinkingChange(e.target.checked)}
                      className="h-4 w-4 shrink-0 accent-cyan-500"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2.5">
              {MODEL_CATALOG.slice(0, 4).map(m => (
                <div key={m.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${tokens.borderSubtle}`}>
                  <span className={`font-medium ${tokens.textPrimary}`}>{ar ? m.friendlyAr : m.friendlyEn}</span>
                  <span dir="ltr" className={`font-mono ${tokens.textAccent}`}>{m.quantization}</span>
                </div>
              ))}
              <label className={`mt-3 flex items-start gap-2.5 pt-2 text-xs ${tokens.textPrimary}`}>
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={e => setApproved(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-500"
                />
                <span>{t.wizardApprovalCheck}</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className={`space-y-3 text-xs leading-6 ${tokens.textPrimary}`}>
              <p>{t.wizardManifestNote}</p>
              <div dir="ltr" className={`rounded-lg border p-3 font-mono text-[11px] ${tokens.badgeInfo}`}>
                manifest: hafiz-win11-turing-sm75.lock.json<br />
                setup_mode: {setupMode}<br />
                app_install_dir: {appInstallDir}<br />
                model_download_dir: {modelDir}<br />
                scan_partitions: [{scanPartitions.join(', ')}]<br />
                in_place_linking: {String(inPlaceLinking)} (zero-move)<br />
                startup_mode: offline-first
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={tokens.button}
          >
            {t.wizardBack}
          </button>
          <div className="flex gap-2">
            {step < 3 ? (
              <button
                type="button"
                disabled={step === 2 && !approved}
                onClick={() => setStep(s => Math.min(3, s + 1))}
                className={`${tokens.button} ${tokens.buttonAccent}`}
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
                className={`${tokens.button} ${tokens.buttonAccent}`}
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
