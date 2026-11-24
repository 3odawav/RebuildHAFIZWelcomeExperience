import { useEffect, useState } from 'react'
import type { AppTranslations } from '../i18n/translations'
import type { BackendActionResult, BackendConnectionState, PartitionScanResponse } from '../services/backendAdapter'
import { COMMON_WINDOWS_DRIVES, normalizeWindowsPath, type UiThemePreset } from '../utils/storageConfig'
import { getThemeTokens } from '../utils/themeTokens'

interface ModelScannerModalProps {
  open: boolean
  ar: boolean
  t: AppTranslations
  theme: UiThemePreset
  appInstallDir: string
  scanPartitions: string[]
  inPlaceLinking: boolean
  backendState: BackendConnectionState
  onTogglePartition: (drive: string) => void
  onAddPartition: (rawPath: string) => void
  onRemovePartition: (targetPath: string) => void
  onInPlaceLinkingChange: (val: boolean) => void
  onRunScan: (indexSavePath: string) => Promise<BackendActionResult<PartitionScanResponse>>
  onClose: () => void
}

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: () => Promise<{ name: string }>
}

export function ModelScannerModal({
  open,
  ar,
  t,
  theme,
  appInstallDir,
  scanPartitions,
  inPlaceLinking,
  backendState,
  onTogglePartition,
  onAddPartition,
  onRemovePartition,
  onInPlaceLinkingChange,
  onRunScan,
  onClose,
}: ModelScannerModalProps) {
  const [customFolder, setCustomFolder] = useState('')
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [scanResult, setScanResult] = useState<BackendActionResult<PartitionScanResponse> | null>(null)
  const [browseHint, setBrowseHint] = useState('')

  const tokens = getThemeTokens(theme)
  const cleanInstall = (normalizeWindowsPath(appInstallDir) || 'E:\\HAFIZ_In_Slang').replace(/\\+$/, '')
  const indexSavePath = `${cleanInstall}\\data\\model-index.json`

  useEffect(() => {
    if (!open) {
      setScanning(false)
      setProgress(0)
      setBrowseHint('')
    }
  }, [open])

  if (!open) return null

  const normalizedSet = new Set(scanPartitions.map(p => normalizeWindowsPath(p).toLowerCase()))

  const handleAddCustom = () => {
    if (!customFolder.trim()) return
    onAddPartition(customFolder)
    setCustomFolder('')
    setBrowseHint('')
  }

  const handleBrowseFolder = async () => {
    const picker = (window as DirectoryPickerWindow).showDirectoryPicker
    if (typeof picker === 'function') {
      try {
        const handle = await picker()
        if (handle?.name) {
          const suggested = `E:\\${handle.name}`
          setCustomFolder(suggested)
          setBrowseHint(t.browserPickFallbackNote)
        }
        return
      } catch {
        // User cancelled directory picker
        return
      }
    }
    setBrowseHint(t.browserPickFallbackNote)
  }

  const handleStartScan = async () => {
    if (!scanPartitions.length || scanning) return
    setScanning(true)
    setScanResult(null)
    setProgress(22)

    const tick = globalThis.setInterval(() => {
      setProgress(prev => (prev < 78 ? prev + 14 : prev))
    }, 180)

    try {
      const result = await onRunScan(indexSavePath)
      setScanResult(result)
      setProgress(result.ok ? 100 : 100)
    } finally {
      clearInterval(tick)
      setScanning(false)
    }
  }

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
        aria-labelledby="model-scanner-title"
        data-testid="model-scanner-modal"
        className={`w-full max-w-2xl rounded-2xl border p-6 ${tokens.modalSurface}`}
      >
        <div className={`flex items-start justify-between gap-4 border-b pb-4 ${tokens.borderSubtle}`}>
          <div>
            <h2 id="model-scanner-title" className={`text-lg font-medium ${tokens.heading}`}>
              {t.scannerTitle}
            </h2>
            <p className={`mt-1 text-xs leading-5 ${tokens.textMuted}`}>{t.scannerSubtitle}</p>
          </div>
          <button
            type="button"
            aria-label={t.scannerCloseAria}
            onClick={onClose}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border transition ${tokens.borderSubtle} ${tokens.textMuted} hover:border-cyan-400`}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Quick Multi-Drive Windows Partition Selector */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`text-xs font-medium ${tokens.textPrimary}`}>{t.scannerSelectDrives}</span>
              <span className={`rounded-md border px-2 py-0.5 text-[11px] ${tokens.badgeSuccess}`}>
                {t.scannerNoMoveBadge}
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {COMMON_WINDOWS_DRIVES.map(drive => {
                const selected = normalizedSet.has(drive.toLowerCase())
                return (
                  <button
                    key={drive}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onTogglePartition(drive)}
                    className={`${tokens.button} min-h-10 px-3.5 font-mono text-xs ${selected ? tokens.buttonActive : ''}`}
                  >
                    <span dir="ltr">{drive}</span>
                    {selected && <span aria-hidden="true">✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Add Custom Folder Path + Browse */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              dir={customFolder.trim() ? 'ltr' : t.dir}
              value={customFolder}
              onChange={e => setCustomFolder(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustom()
                }
              }}
              placeholder={t.scannerAddFolderPlaceholder}
              aria-label={t.scannerAddFolderPlaceholder}
              className={`${tokens.field} min-w-[200px] flex-1 py-2.5 text-xs ${customFolder.trim() ? 'font-mono' : ''}`}
            />
            <button type="button" onClick={handleAddCustom} className={`${tokens.button} min-h-10 px-3 text-xs`}>
              {t.scannerAddBtn}
            </button>
            <button type="button" onClick={() => void handleBrowseFolder()} className={`${tokens.button} min-h-10 px-3 text-xs`}>
              {t.scannerBrowseBtn}
            </button>
          </div>
          {browseHint && <p className={`text-xs leading-5 ${tokens.textMuted}`}>{browseHint}</p>}

          {/* Active Scan Queue */}
          <div className={`${tokens.subCard} p-3.5`}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={`font-medium ${tokens.textPrimary}`}>
                {ar ? `المسارات المختارة للفحص (${scanPartitions.length})` : `Selected Scan Paths (${scanPartitions.length})`}
              </span>
              <span dir="ltr" className={`font-mono text-[11px] ${tokens.textMuted}`}>
                {t.backendStates[backendState]}
              </span>
            </div>
            {scanPartitions.length === 0 ? (
              <p className={`mt-2 text-xs ${tokens.textMuted}`}>
                {ar ? 'اختر بارتيشن واحد على الأقل (مثل E:\\ أو D:\\) للبدء.' : 'Select at least one partition (e.g. E:\\ or D:\\) to start.'}
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {scanPartitions.map(path => (
                  <span
                    key={path}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs ${tokens.badgeInfo}`}
                  >
                    <span dir="ltr">{path}</span>
                    <button
                      type="button"
                      aria-label={`${t.scannerRemoveAria} ${path}`}
                      onClick={() => onRemovePartition(path)}
                      className="rounded px-1 text-xs opacity-75 hover:opacity-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className={`mt-3 border-t pt-3 ${tokens.borderSubtle}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={tokens.textMuted}>{t.scannerIndexPathLabel}</span>
                <code dir="ltr" className={`break-all font-mono text-[11px] ${tokens.textAccent}`}>
                  {indexSavePath}
                </code>
              </div>
              <label className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                <span className={tokens.textPrimary}>{t.inPlaceLinkingToggle}</span>
                <input
                  type="checkbox"
                  checked={inPlaceLinking}
                  onChange={e => onInPlaceLinkingChange(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-cyan-500"
                />
              </label>
            </div>
          </div>

          {/* Scan Progress Bar */}
          {(scanning || scanResult) && (
            <div className={`${tokens.subCard} space-y-2.5 p-4`}>
              <div className="flex items-center justify-between text-xs">
                <span className={tokens.textPrimary}>
                  {scanning
                    ? t.scannerScanning
                    : scanResult?.ok
                      ? ar
                        ? `تم فحص البارتيشنات وحفظ الفهرس (${scanResult.data?.discoveredCount ?? 0} ملف)`
                        : `Scan complete & index saved (${scanResult.data?.discoveredCount ?? 0} files)`
                      : t.scannerOfflineTitle}
                </span>
                <span dir="ltr" className={`font-mono ${tokens.textAccent}`}>
                  {progress}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className={`h-2 w-full overflow-hidden rounded-full ${tokens.isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
              >
                <div
                  className={`h-full transition-all duration-300 ${
                    scanResult && !scanResult.ok
                      ? 'bg-amber-400'
                      : theme === 'graphite_gold'
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {scanResult && !scanResult.ok && (
                <div className={`rounded-lg border p-3 text-xs leading-6 ${tokens.badgeWarn}`}>
                  <p className="font-medium">{t.scannerOfflineTitle}</p>
                  <p className="mt-1">{t.scannerOfflineBody}</p>
                  <p dir="ltr" className="mt-1.5 font-mono text-[11px] opacity-90">
                    endpoint: {scanResult.endpoint} · code: {scanResult.code}
                  </p>
                </div>
              )}

              {scanResult?.ok && (
                <div className="space-y-1.5 text-xs">
                  {scanResult.data && scanResult.data.discoveredFiles.length > 0 ? (
                    scanResult.data.discoveredFiles.map(file => (
                      <div key={file.path} className={`flex flex-wrap justify-between gap-2 rounded-lg border px-3 py-2 ${tokens.borderSubtle}`}>
                        <span className="font-medium">{file.modelId}</span>
                        <span dir="ltr" className="break-all font-mono text-[11px]">{file.path}</span>
                      </div>
                    ))
                  ) : (
                    <p className={tokens.textMuted}>{t.scannerFoundNone}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onClose} className={tokens.button}>
            {t.floatingHideBtn}
          </button>
          <button
            type="button"
            disabled={scanning || scanPartitions.length === 0}
            onClick={() => void handleStartScan()}
            className={`${tokens.button} ${tokens.buttonAccent}`}
          >
            {scanning ? t.scannerScanning : t.scannerStartBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
