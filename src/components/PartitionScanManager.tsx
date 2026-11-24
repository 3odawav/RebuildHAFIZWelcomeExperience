import { useState } from 'react'
import type { AppTranslations } from '../i18n/translations'
import { pickLocalDirectoryOrFile } from '../utils/pathPicker'
import {
  COMMON_WINDOWS_DRIVES,
  addScanPartition,
  normalizeWindowsPath,
  removeScanPartition,
} from '../utils/storageConfig'

interface PartitionScanManagerProps {
  t: AppTranslations
  scanPartitions: string[]
  onScanPartitionsChange: (next: string[]) => void
  inPlaceLinking: boolean
  onInPlaceLinkingChange: (val: boolean) => void
  onNotice?: (message: string) => void
  buttonClass: string
  fieldClass: string
  compact?: boolean
}

/**
 * Reusable Multi-Partition & Folder Scanner configuration panel.
 * Lets users select multiple Windows drives (E:\, D:\, F:\...) or custom folders
 * so HAFIZ automatically scans and indexes existing AI models IN-PLACE without moving or copying files.
 */
export function PartitionScanManager({
  t,
  scanPartitions,
  onScanPartitionsChange,
  inPlaceLinking,
  onInPlaceLinkingChange,
  onNotice,
  buttonClass,
  fieldClass,
  compact = false,
}: PartitionScanManagerProps) {
  const [draftPath, setDraftPath] = useState('')

  const handleAdd = (raw?: string) => {
    const candidate = (raw ?? draftPath).trim()
    if (!candidate) return
    onScanPartitionsChange(addScanPartition(scanPartitions, candidate))
    if (!raw) setDraftPath('')
  }

  const handleBrowse = async () => {
    const res = await pickLocalDirectoryOrFile('directory')
    if (res.cancelled) return
    if (res.pickedName) {
      const suggestion = `E:\\${res.pickedName}`
      setDraftPath(suggestion)
      onScanPartitionsChange(addScanPartition(scanPartitions, suggestion))
      onNotice?.(t.browseSandboxNotice)
    } else if (res.sandboxBlocked) {
      onNotice?.(t.browseSandboxNotice)
    }
  }

  return (
    <div className={`space-y-3 rounded-xl border border-slate-700/80 bg-[#06101c]/80 ${compact ? 'p-3.5' : 'p-4'}`}>
      <div>
        <h3 className="text-sm font-medium text-sky-100">{t.scanPartitionsTitle}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-300">{t.scanPartitionsDesc}</p>
      </div>

      {/* Quick Partition Drive Buttons (C:\, D:\, E:\, F:\, G:\) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">{t.quickDrivesLabel}</span>
        {COMMON_WINDOWS_DRIVES.map(drive => {
          const active = scanPartitions.some(p => normalizeWindowsPath(p).toLowerCase() === drive.toLowerCase())
          return (
            <button
              key={drive}
              type="button"
              dir="ltr"
              aria-pressed={active}
              onClick={() =>
                onScanPartitionsChange(
                  active ? removeScanPartition(scanPartitions, drive) : addScanPartition(scanPartitions, drive),
                )
              }
              className={`min-h-9 rounded-lg border px-3 font-mono text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                active
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-sky-500/70'
              }`}
            >
              {active ? '✓ ' : '+ '}
              {drive}
            </button>
          )
        })}
      </div>

      {/* Custom Partition / Subfolder Path Input + Browse */}
      <form
        onSubmit={e => {
          e.preventDefault()
          handleAdd()
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          dir="ltr"
          aria-label={t.scanPartitionsTitle}
          value={draftPath}
          onChange={e => setDraftPath(e.target.value)}
          placeholder={t.scanPartitionsPlaceholder}
          className={`${fieldClass} min-w-[200px] flex-1 py-2.5 font-mono text-xs text-cyan-100`}
        />
        <button type="submit" className={`${buttonClass} min-h-10 border-cyan-400/60 bg-sky-500/15 text-xs text-cyan-100`}>
          {t.addPartitionBtn}
        </button>
        <button type="button" onClick={() => void handleBrowse()} className={`${buttonClass} min-h-10 text-xs`}>
          {t.browseFolderBtn}
        </button>
      </form>

      {/* Active Multi-Partition / Folder Scan List */}
      <ul className="flex flex-wrap gap-2" aria-label={t.scanPartitionsTitle}>
        {scanPartitions.map(path => (
          <li
            key={path}
            className="inline-flex items-center gap-2 rounded-lg border border-sky-700/70 bg-sky-950/60 px-3 py-1.5 text-xs text-sky-100"
          >
            <span dir="ltr" className="font-mono">{path}</span>
            <button
              type="button"
              aria-label={`${t.removePartitionAria} ${path}`}
              onClick={() => onScanPartitionsChange(removeScanPartition(scanPartitions, path))}
              className="grid h-6 w-6 place-items-center rounded text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {/* Strict In-Place Linking Guarantee Toggle */}
      <label className="flex items-start justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3 text-xs">
        <span>
          <span className="block font-medium text-emerald-200">{t.inPlaceLinkingToggle}</span>
          <span className="mt-1 block leading-5 text-slate-300">{t.inPlaceLinkingDesc}</span>
        </span>
        <input
          type="checkbox"
          checked={inPlaceLinking}
          onChange={e => onInPlaceLinkingChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-400"
        />
      </label>
    </div>
  )
}
