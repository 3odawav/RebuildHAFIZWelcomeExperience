import { useRef, useState } from 'react'
import { MODEL_CATALOG } from '../contracts/orchestrator'
import type { AppTranslations } from '../i18n/translations'
import type { BackendConnectionState } from '../services/backendAdapter'
import {
  normalizeWindowsPath,
  resolveEffectiveModelPath,
  type UiThemePreset,
} from '../utils/storageConfig'
import { getThemeTokens } from '../utils/themeTokens'

interface ModelManagerViewProps {
  mode: 'models' | 'downloads'
  ar: boolean
  t: AppTranslations
  theme: UiThemePreset
  appInstallDir: string
  onAppInstallDirChange: (value: string) => void
  modelDir: string
  onModelDirChange: (value: string) => void
  scanPartitions: string[]
  inPlaceLinking: boolean
  onInPlaceLinkingChange: (val: boolean) => void
  perModelPaths: Record<string, string>
  onSetModelPath: (modelId: string, path: string) => void
  onResetModelPath: (modelId: string) => void
  backendState: BackendConnectionState
  onProbeBackend: () => void
  onOpenScanner: () => void
  onBlocked: (reason?: string) => void
  onOpenWizard: () => void
}

type FilePickerWindow = Window & {
  showDirectoryPicker?: () => Promise<{ name: string }>
}

export function ModelManagerView({
  mode,
  ar,
  t,
  theme,
  appInstallDir,
  onAppInstallDirChange,
  modelDir,
  onModelDirChange,
  scanPartitions,
  inPlaceLinking,
  onInPlaceLinkingChange,
  perModelPaths,
  onSetModelPath,
  onResetModelPath,
  backendState,
  onProbeBackend,
  onOpenScanner,
  onBlocked,
  onOpenWizard,
}: ModelManagerViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [draftPaths, setDraftPaths] = useState<Record<string, string>>({})
  const [pickHintId, setPickHintId] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const tokens = getThemeTokens(theme)

  const handleBrowseModel = async (modelId: string) => {
    const picker = (window as FilePickerWindow).showDirectoryPicker
    if (typeof picker === 'function') {
      try {
        const handle = await picker()
        if (handle?.name) {
          const base = (normalizeWindowsPath(modelDir) || 'E:\\HAFIZ_Models').replace(/\\+$/, '')
          const suggested = `${base}\\${handle.name}`
          setDraftPaths(prev => ({ ...prev, [modelId]: suggested }))
          setPickHintId(modelId)
        }
        return
      } catch {
        return
      }
    }
    fileInputRefs.current[modelId]?.click()
  }

  const handleFallbackFilePick = (modelId: string, selected?: File) => {
    if (!selected) return
    const base = (normalizeWindowsPath(modelDir) || 'E:\\HAFIZ_Models').replace(/\\+$/, '')
    const suggested = `${base}\\${selected.name}`
    setDraftPaths(prev => ({ ...prev, [modelId]: suggested }))
    setPickHintId(modelId)
  }

  const handleSaveManualPath = (modelId: string) => {
    const raw = (draftPaths[modelId] ?? perModelPaths[modelId] ?? '').trim()
    if (!raw) {
      onResetModelPath(modelId)
      return
    }
    const normalized = normalizeWindowsPath(raw)
    onSetModelPath(modelId, normalized)
    setDraftPaths(prev => ({ ...prev, [modelId]: normalized }))
  }

  if (mode === 'downloads') {
    return (
      <div className="space-y-5">
        <div className={`${tokens.panel} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={`text-lg font-medium ${tokens.heading}`}>{t.downloadsEmptyTitle}</h2>
                <span dir="ltr" className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${tokens.badgeWarn}`}>
                  {t.backendStates[backendState]}
                </span>
              </div>
              <p className={`mt-2 text-sm leading-6 ${tokens.textMuted}`}>{t.downloadsEmptyDesc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={`${tokens.button} ${tokens.buttonAccent}`} onClick={onOpenScanner}>
                {t.scanPartitionsAction}
              </button>
              <button type="button" className={tokens.button} onClick={onOpenWizard}>
                {t.openFirstRunWizard}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`${tokens.subCard} p-4`}>
              <label className={`block text-sm font-medium ${tokens.heading}`}>
                {t.appInstallDirLabel}
                <input
                  dir="ltr"
                  value={appInstallDir}
                  onChange={e => onAppInstallDirChange(e.target.value)}
                  className={`${tokens.field} mt-2 font-mono text-xs`}
                  placeholder="E:\HAFIZ_In_Slang"
                />
              </label>
            </div>

            <div className={`${tokens.subCard} p-4`}>
              <label className={`block text-sm font-medium ${tokens.heading}`}>
                {t.storageDirLabel}
                <input
                  dir="ltr"
                  value={modelDir}
                  onChange={e => onModelDirChange(e.target.value)}
                  className={`${tokens.field} mt-2 font-mono text-xs`}
                  placeholder="E:\HAFIZ_Models"
                />
              </label>
            </div>
          </div>

          <div className={`${tokens.subCard} mt-4 space-y-3 p-4`}>
            <label className="flex items-start justify-between gap-4 text-sm">
              <span>
                <span className={`block font-medium ${tokens.textPrimary}`}>{t.inPlaceLinkingToggle}</span>
                <span className={`mt-1 block text-xs ${tokens.textMuted}`}>{t.inPlaceLinkingDesc}</span>
              </span>
              <input
                type="checkbox"
                checked={inPlaceLinking}
                onChange={e => onInPlaceLinkingChange(e.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-cyan-500"
              />
            </label>
            <div className={`flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs ${tokens.borderSubtle}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={tokens.textMuted}>{t.scannerSelectDrives}:</span>
                {scanPartitions.map(p => (
                  <span key={p} dir="ltr" className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${tokens.badgeInfo}`}>
                    {p}
                  </span>
                ))}
              </div>
              <button type="button" onClick={onOpenScanner} className={`${tokens.button} min-h-9 px-3 text-xs`}>
                {t.scanPartitionsAction}
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button type="button" className={`${tokens.button} ${tokens.buttonActive}`} onClick={onProbeBackend}>
              {t.backendProbeBtn}
            </button>
            <button type="button" className={tokens.button} onClick={onOpenScanner}>
              {t.useExistingModels}
            </button>
            <button type="button" className={tokens.button} onClick={onOpenScanner}>
              {t.scanModelLibraries}
            </button>
            <button type="button" className={tokens.button} onClick={() => onBlocked()}>
              {t.downloadMissing}
            </button>
            <button type="button" className={tokens.button} onClick={() => onBlocked()}>
              {t.continueDownloads}
            </button>
            <button type="button" className={tokens.button} onClick={() => onBlocked()}>
              {t.verifyInstallation}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className={`${tokens.panel} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="min-w-0 flex-1">
          <h2 className={`text-lg font-medium ${tokens.heading}`}>{t.modelsIntroTitle}</h2>
          <p className={`mt-1 text-sm leading-6 ${tokens.textMuted}`}>{t.modelsIntroSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenScanner}
            className={`${tokens.button} ${tokens.buttonAccent}`}
          >
            {t.scanPartitionsAction}
          </button>
          <button
            type="button"
            aria-pressed={showAdvanced}
            onClick={() => setShowAdvanced(v => !v)}
            className={`${tokens.button} ${showAdvanced ? tokens.buttonActive : ''}`}
          >
            {showAdvanced ? t.hideTechnicalDetails : t.showTechnicalDetails}
          </button>
          <button type="button" className={tokens.button} onClick={onOpenWizard}>
            {t.openFirstRunWizard}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {MODEL_CATALOG.map(entry => {
          const effective = resolveEffectiveModelPath(entry.id, entry.relativePath, modelDir, perModelPaths)
          const draftVal = draftPaths[entry.id] ?? perModelPaths[entry.id] ?? ''

          return (
            <article key={entry.id} data-testid={`model-card-${entry.id}`} className={`${tokens.panel} flex flex-col gap-3 p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className={`text-base font-medium ${tokens.textPrimary}`}>
                    {ar ? entry.friendlyAr : entry.friendlyEn}
                  </h3>
                  <p className={`mt-1 text-xs leading-5 ${tokens.textMuted}`}>
                    {ar ? entry.roleSummaryAr : entry.roleSummaryEn}
                  </p>
                </div>
                <span
                  dir="ltr"
                  className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[11px] ${tokens.badgeInfo}`}
                >
                  {entry.loadState}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-md border px-2.5 py-1 ${tokens.badgeWarn}`}>
                  {t.modelStatusOffline}
                </span>
                <span className={`rounded-md border px-2.5 py-1 ${tokens.badgeInfo}`}>
                  {ar ? entry.turingCompatAr : entry.turingCompatEn}
                </span>
                <span
                  className={`rounded-md border px-2.5 py-1 ${
                    effective.isManualOverride ? tokens.badgeSuccess : tokens.badgeInfo
                  }`}
                >
                  {effective.isManualOverride ? t.manualOverrideBadge : t.autoLocationBadge}
                </span>
                {inPlaceLinking && (
                  <span className={`rounded-md border px-2.5 py-1 ${tokens.badgeSuccess}`}>
                    {t.inPlaceNoMoveTag}
                  </span>
                )}
              </div>

              {/* Advanced Location — Per-Model Manual Path Override */}
              <div className={`${tokens.subCard} space-y-2.5 p-3.5 text-xs`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`font-medium ${tokens.heading}`}>{t.advancedLocationTitle}</span>
                  {effective.isManualOverride && (
                    <button
                      type="button"
                      onClick={() => {
                        onResetModelPath(entry.id)
                        setDraftPaths(prev => {
                          const next = { ...prev }
                          delete next[entry.id]
                          return next
                        })
                      }}
                      className={`text-xs underline ${tokens.textAccent}`}
                    >
                      {t.resetLocationBtn}
                    </button>
                  )}
                </div>
                <p className={`text-[11px] leading-5 ${tokens.textMuted}`}>{t.advancedLocationDesc}</p>
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className={tokens.textMuted}>{t.modelPathLabel}:</span>
                  <code dir="ltr" className={`break-all font-mono ${tokens.textAccent}`}>
                    {effective.path}
                  </code>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    dir={draftVal.trim() ? 'ltr' : t.dir}
                    aria-label={`${t.advancedLocationTitle} — ${ar ? entry.friendlyAr : entry.friendlyEn}`}
                    value={draftVal}
                    onChange={e => setDraftPaths(prev => ({ ...prev, [entry.id]: e.target.value }))}
                    placeholder={t.manualPathPlaceholder}
                    className={`${tokens.field} min-w-[170px] flex-1 py-2 text-xs ${draftVal.trim() ? 'font-mono' : ''}`}
                  />
                  <input
                    ref={el => { fileInputRefs.current[entry.id] = el }}
                    type="file"
                    className="hidden"
                    onChange={e => handleFallbackFilePick(entry.id, e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => void handleBrowseModel(entry.id)}
                    className={`${tokens.button} min-h-9 px-3 text-xs`}
                  >
                    {t.browseLocationBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveManualPath(entry.id)}
                    className={`${tokens.button} min-h-9 px-3 text-xs ${tokens.buttonActive}`}
                  >
                    {t.saveLocationBtn}
                  </button>
                </div>
                {pickHintId === entry.id && (
                  <p className={`text-[11px] leading-5 ${tokens.textMuted}`}>{t.browserPickFallbackNote}</p>
                )}
              </div>

              {showAdvanced && (
                <dl className={`${tokens.subCard} mt-1 grid gap-1.5 p-3.5 text-xs`}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelRepoLabel}</dt>
                    <dd dir="ltr" className={`break-all font-mono ${tokens.textAccent}`}>{entry.repo}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelRevisionLabel}</dt>
                    <dd dir="ltr" className={`font-mono ${tokens.textPrimary}`}>{entry.modelIdentifier} ({entry.pinnedRevision})</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelLicenseLabel}</dt>
                    <dd dir="ltr" className={`font-mono ${tokens.textPrimary}`}>{entry.license}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelQuantLabel}</dt>
                    <dd dir="ltr" className={`font-mono ${tokens.textAccent}`}>{entry.quantization}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelRuntimeLabel}</dt>
                    <dd dir="ltr" className={`font-mono ${tokens.textPrimary}`}>{entry.runtime}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelPathLabel}</dt>
                    <dd dir="ltr" className={`break-all font-mono ${tokens.textMuted}`}>{effective.path}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelIntegrityLabel}</dt>
                    <dd className={tokens.textPrimary}>{t.modelStatusOffline}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2">
                    <dt className={tokens.textMuted}>{t.modelVramStateLabel}</dt>
                    <dd dir="ltr" className={`font-mono ${tokens.textMuted}`}>Unallocated · Offline</dd>
                  </div>
                </dl>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <button type="button" className={tokens.button} onClick={onOpenScanner}>
                  {t.modelDiscoverAction}
                </button>
                <button type="button" className={tokens.button} onClick={() => onBlocked()}>
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
