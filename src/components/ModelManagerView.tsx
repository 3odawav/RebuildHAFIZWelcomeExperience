import { useState } from 'react'
import { MODEL_CATALOG } from '../contracts/orchestrator'
import type { AppTranslations } from '../i18n/translations'

interface ModelManagerViewProps {
  mode: 'models' | 'downloads'
  ar: boolean
  t: AppTranslations
  modelDir: string
  onModelDirChange: (value: string) => void
  onBlocked: (reason?: string) => void
  onOpenWizard: () => void
  buttonClass: string
  panelClass: string
  fieldClass: string
}

export function ModelManagerView({
  mode,
  ar,
  t,
  modelDir,
  onModelDirChange,
  onBlocked,
  onOpenWizard,
  buttonClass,
  panelClass,
  fieldClass,
}: ModelManagerViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  if (mode === 'downloads') {
    return (
      <div className="space-y-5">
        <div className={`${panelClass} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-lg font-medium text-sky-100">{t.downloadsEmptyTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t.downloadsEmptyDesc}</p>
            </div>
            <button type="button" className={`${buttonClass} border-cyan-400/60 bg-sky-500/15 text-cyan-100`} onClick={onOpenWizard}>
              {t.openFirstRunWizard}
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-slate-700/80 bg-[#06101c]/80 p-4">
            <label className="block text-sm font-medium text-sky-100">
              {t.storageDirLabel}
              <input
                dir="ltr"
                value={modelDir}
                onChange={e => onModelDirChange(e.target.value)}
                className={`${fieldClass} mt-2 font-mono text-xs text-cyan-100`}
                placeholder="E:\HAFIZ_Models"
              />
            </label>
            <p className="mt-2 text-xs text-slate-300">{t.storageDirHint}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button type="button" className={`${buttonClass} border-sky-500/60 bg-sky-500/15`} onClick={() => onBlocked()}>
              {t.connectCompanion}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.useExistingModels}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.scanModelLibraries}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.downloadMissing}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.continueDownloads}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.verifyInstallation}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className={`${panelClass} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium text-sky-100">{t.modelsIntroTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-300">{t.modelsIntroSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={showAdvanced}
            onClick={() => setShowAdvanced(v => !v)}
            className={`${buttonClass} ${showAdvanced ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-100' : ''}`}
          >
            {showAdvanced ? t.hideTechnicalDetails : t.showTechnicalDetails}
          </button>
          <button type="button" className={`${buttonClass} border-sky-500/60 bg-sky-500/15`} onClick={onOpenWizard}>
            {t.openFirstRunWizard}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MODEL_CATALOG.map(entry => {
          const fullLocalPath = `${modelDir.replace(/[\\/]+$/, '')}\\${entry.relativePath}`
          return (
            <article key={entry.id} className={`${panelClass} flex flex-col gap-3 p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-medium text-slate-100">
                    {ar ? entry.friendlyAr : entry.friendlyEn}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {ar ? entry.roleSummaryAr : entry.roleSummaryEn}
                  </p>
                </div>
                <span
                  dir="ltr"
                  className="shrink-0 rounded-md border border-sky-700/70 bg-sky-950/60 px-2 py-1 font-mono text-[11px] text-sky-200"
                >
                  {entry.loadState}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-amber-200">
                  {t.modelStatusOffline}
                </span>
                <span className="rounded-md border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">
                  {ar ? entry.turingCompatAr : entry.turingCompatEn}
                </span>
              </div>

              {showAdvanced && (
                <dl className="mt-1 grid gap-1.5 rounded-xl border border-slate-800 bg-[#050d17]/90 p-3.5 text-xs">
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelRepoLabel}</dt>
                    <dd dir="ltr" className="break-all font-mono text-sky-200">{entry.repo}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelRevisionLabel}</dt>
                    <dd dir="ltr" className="font-mono text-slate-200">{entry.modelIdentifier} ({entry.pinnedRevision})</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelLicenseLabel}</dt>
                    <dd dir="ltr" className="font-mono text-slate-200">{entry.license}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelQuantLabel}</dt>
                    <dd dir="ltr" className="font-mono text-cyan-200">{entry.quantization}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelRuntimeLabel}</dt>
                    <dd dir="ltr" className="font-mono text-slate-200">{entry.runtime}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelPathLabel}</dt>
                    <dd dir="ltr" className="break-all font-mono text-slate-300">{fullLocalPath}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelIntegrityLabel}</dt>
                    <dd className="text-amber-200">{t.modelStatusOffline}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className="text-slate-400">{t.modelVramStateLabel}</dt>
                    <dd dir="ltr" className="font-mono text-slate-300">Unallocated · Offline</dd>
                  </div>
                </dl>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <button type="button" className={buttonClass} onClick={() => onBlocked()}>
                  {t.modelDiscoverAction}
                </button>
                <button type="button" className={buttonClass} onClick={() => onBlocked()}>
                  {t.modelVerifyAction}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
