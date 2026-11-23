import { useState } from 'react'
import { MODEL_CATALOG } from '../contracts/orchestrator'
import type { AppTranslations } from '../i18n/translations'
import { pickLocalDirectoryOrFile } from '../utils/pathPicker'
import {
  normalizeWindowsPath,
  resolveEffectiveModelPath,
  type ModelSetupMode,
} from '../utils/storageConfig'
import { PartitionScanManager } from './PartitionScanManager'

interface ModelManagerViewProps {
  mode: 'models' | 'downloads'
  ar: boolean
  t: AppTranslations
  appInstallDir: string
  onAppInstallDirChange: (value: string) => void
  modelDir: string
  onModelDirChange: (value: string) => void
  setupMode: ModelSetupMode
  onSetupModeChange: (mode: ModelSetupMode) => void
  scanPartitions: string[]
  onScanPartitionsChange: (paths: string[]) => void
  inPlaceLinking: boolean
  onInPlaceLinkingChange: (val: boolean) => void
  perModelPaths: Record<string, string>
  onSetModelManualPath: (modelId: string, path: string) => void
  onNotice: (message: string) => void
  onBlocked: (reason?: string) => void
  onOpenWizard: () => void
  buttonClass: string
  panelClass: string
  fieldClass: string
}

const SETUP_MODE_KEYS: readonly ModelSetupMode[] = [
  'scan_in_place',
  'hybrid_scan_then_download',
  'download_all',
]

export function ModelManagerView({
  mode,
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
  perModelPaths,
  onSetModelManualPath,
  onNotice,
  onBlocked,
  onOpenWizard,
  buttonClass,
  panelClass,
  fieldClass,
}: ModelManagerViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [editingModelId, setEditingModelId] = useState<string | null>(null)
  const [draftModelPath, setDraftModelPath] = useState('')

  const openManualEditor = (modelId: string, currentPath: string) => {
    setEditingModelId(modelId)
    setDraftModelPath(perModelPaths[modelId] || currentPath)
  }

  const handleBrowseModelFile = async (modelId: string, currentPath: string) => {
    const res = await pickLocalDirectoryOrFile('file')
    if (res.cancelled) return
    if (res.pickedName) {
      const folderPrefix = currentPath.includes('\\')
        ? currentPath.slice(0, currentPath.lastIndexOf('\\'))
        : modelDir.replace(/[\\/]+$/, '')
      const suggested = `${folderPrefix}\\${res.pickedName}`
      setDraftModelPath(suggested)
      onSetModelManualPath(modelId, normalizeWindowsPath(suggested))
      onNotice(t.browseSandboxNotice)
      return
    }
    if (res.sandboxBlocked) {
      onNotice(t.browseSandboxNotice)
    }
  }

  if (mode === 'downloads') {
    return (
      <div className="space-y-5">
        <div className={`${panelClass} space-y-5 p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-lg font-medium text-sky-100">{t.downloadsEmptyTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{t.downloadsEmptyDesc}</p>
            </div>
            <button type="button" className={`${buttonClass} border-cyan-400/60 bg-sky-500/15 text-cyan-100`} onClick={onOpenWizard}>
              {t.openFirstRunWizard}
            </button>
          </div>

          {/* EXE Install & Download Choice */}
          <div>
            <h3 className="text-sm font-medium text-sky-100">{t.setupModeTitle}</h3>
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
                        : 'border-slate-800 bg-[#06101c]/70 text-slate-300 hover:border-sky-600/60'
                    }`}
                  >
                    <span className="block text-xs font-semibold text-cyan-100">{copy.title}</span>
                    <span className="mt-1.5 block text-xs leading-5 text-slate-300">{copy.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* App Install Directory (E:) + Download Storage Directory (E:) */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-700/80 bg-[#06101c]/80 p-4">
              <label className="block text-sm font-medium text-sky-100">
                {t.appInstallDirLabel}
                <input
                  dir="ltr"
                  value={appInstallDir}
                  onChange={e => onAppInstallDirChange(e.target.value)}
                  className={`${fieldClass} mt-2 font-mono text-xs text-cyan-100`}
                  placeholder="E:\HAFIZ_In_Slang"
                />
              </label>
              <p className="mt-2 text-xs text-slate-300">{t.appInstallDirHint}</p>
            </div>

            <div className="rounded-xl border border-slate-700/80 bg-[#06101c]/80 p-4">
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
          </div>

          {/* Multi-Partition Auto-Scan Manager */}
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

          <div className="flex flex-wrap gap-2.5">
            <button type="button" className={`${buttonClass} border-sky-500/60 bg-sky-500/15`} onClick={() => onBlocked()}>
              {t.connectCompanion}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.scanModelLibraries}
            </button>
            <button type="button" className={buttonClass} onClick={() => onBlocked()}>
              {t.useExistingModels}
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
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="text-sky-200">{t.scanPartitionsTitle}:</span>
            {scanPartitions.map(p => (
              <span key={p} dir="ltr" className="rounded border border-sky-800/80 bg-sky-950/60 px-2 py-0.5 font-mono text-[11px] text-cyan-200">
                {p}
              </span>
            ))}
            {inPlaceLinking && (
              <span className="rounded border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                {t.inPlaceBadge}
              </span>
            )}
          </div>
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
          const resolved = resolveEffectiveModelPath(entry.id, entry.relativePath, modelDir, perModelPaths)
          const isEditing = editingModelId === entry.id
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
                {resolved.isManualOverride && (
                  <span className="rounded-md border border-emerald-400/45 bg-emerald-500/15 px-2.5 py-1 text-emerald-200">
                    {t.manualPathActiveBadge} · {t.inPlaceBadge}
                  </span>
                )}
              </div>

              {/* Active Resolved / Manual Location Display */}
              <div className="rounded-lg border border-slate-800 bg-[#050d17]/75 px-3 py-2 text-xs">
                <span className="text-slate-400">{t.modelPathLabel}: </span>
                <span dir="ltr" className="break-all font-mono text-cyan-100">{resolved.path}</span>
              </div>

              {/* Manual Per-Model Location Editor (Browse / Type without moving files) */}
              {isEditing && (
                <form
                  onSubmit={e => {
                    e.preventDefault()
                    onSetModelManualPath(entry.id, normalizeWindowsPath(draftModelPath))
                    setEditingModelId(null)
                  }}
                  className="space-y-2 rounded-xl border border-cyan-500/40 bg-[#061324] p-3"
                >
                  <label className="block text-xs font-medium text-sky-100">
                    {t.manualPathLabel}
                    <input
                      dir="ltr"
                      value={draftModelPath}
                      onChange={e => setDraftModelPath(e.target.value)}
                      placeholder={t.manualPathPlaceholder}
                      className={`${fieldClass} mt-1.5 py-2 font-mono text-xs text-cyan-100`}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" className={`${buttonClass} min-h-9 border-cyan-400/60 bg-sky-500/20 text-xs text-cyan-100`}>
                      {t.saveDraft}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleBrowseModelFile(entry.id, resolved.path)}
                      className={`${buttonClass} min-h-9 text-xs`}
                    >
                      {t.browseFolderBtn}
                    </button>
                    {resolved.isManualOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          onSetModelManualPath(entry.id, '')
                          setEditingModelId(null)
                        }}
                        className={`${buttonClass} min-h-9 text-xs`}
                      >
                        {t.manualPathClearBtn}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingModelId(null)}
                      className={`${buttonClass} min-h-9 text-xs`}
                    >
                      {t.floatingHideBtn}
                    </button>
                  </div>
                </form>
              )}

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
                <button
                  type="button"
                  className={`${buttonClass} border-cyan-500/45 bg-sky-500/10 text-cyan-100`}
                  onClick={() => openManualEditor(entry.id, resolved.path)}
                >
                  {t.browseModelFileBtn}
                </button>
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
