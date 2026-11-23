export type ModelSetupMode = 'scan_in_place' | 'hybrid_scan_then_download' | 'download_all'
export type UiThemePreset = 'midnight_blue' | 'graphite_gold' | 'light_studio'
export type ExecutionProfile = 'balanced_rtx5000' | 'max_speed' | 'low_vram_coexist'

export interface StorageScanConfig {
  /** Target Windows application installation directory (e.g. E:\HAFIZ_In_Slang) */
  appInstallDir: string
  /** Target folder where newly downloaded models will be stored (e.g. E:\HAFIZ_Models) */
  modelDownloadDir: string
  /** Setup choice chosen during EXE installer or first launch */
  setupMode: ModelSetupMode
  /** Multiple partitions or folders scanned automatically without moving files */
  scanPartitions: string[]
  /** When true, discovered & manually-selected models are indexed in-place (never moved or copied) */
  inPlaceLinking: boolean
  /** Optional manual per-model file/folder path overrides keyed by model ID */
  perModelPaths: Record<string, string>
  /** Bandwidth cap in MB/s (0 = unlimited) */
  downloadSpeedLimitMb: number
  /** Resume interrupted downloads automatically after reboot or reconnect */
  autoResumeDownloads: boolean
}

export const COMMON_WINDOWS_DRIVES = ['C:\\', 'D:\\', 'E:\\', 'F:\\', 'G:\\'] as const

export const DEFAULT_STORAGE_CONFIG: StorageScanConfig = {
  appInstallDir: 'E:\\HAFIZ_In_Slang',
  modelDownloadDir: 'E:\\HAFIZ_Models',
  setupMode: 'scan_in_place',
  scanPartitions: ['E:\\', 'D:\\'],
  inPlaceLinking: true,
  perModelPaths: {},
  downloadSpeedLimitMb: 0,
  autoResumeDownloads: true,
}

/**
 * Normalizes a Windows partition or folder path cleanly (e.g. "e:" -> "E:\", "d:/Models/" -> "D:\Models").
 */
export function normalizeWindowsPath(raw: string): string {
  const trimmed = raw.trim().replace(/\//g, '\\')
  if (!trimmed) return ''

  // Drive root like "e", "e:", "e:\" or "e:\\"
  const driveOnly = trimmed.match(/^([a-zA-Z]):?\\*$/)
  if (driveOnly) {
    return `${driveOnly[1].toUpperCase()}:\\`
  }

  // Drive-prefixed path like "d:\AI\Models\" -> "D:\AI\Models"
  const drivePath = trimmed.match(/^([a-zA-Z]):\\(.*)$/)
  if (drivePath) {
    const rest = drivePath[2].replace(/\\+/g, '\\').replace(/\\+$/, '')
    return rest ? `${drivePath[1].toUpperCase()}:\\${rest}` : `${drivePath[1].toUpperCase()}:\\`
  }

  // UNC or relative path fallback
  return trimmed.replace(/\\+$/, '')
}

/**
 * Adds a partition or folder path to the scan list without case-insensitive duplicates.
 */
export function addScanPartition(list: readonly string[], rawPath: string): string[] {
  const normalized = normalizeWindowsPath(rawPath)
  if (!normalized) return [...list]
  const lower = normalized.toLowerCase()
  if (list.some(item => normalizeWindowsPath(item).toLowerCase() === lower)) {
    return [...list]
  }
  return [...list, normalized]
}

/**
 * Removes a partition or folder path from the scan list (case-insensitive match).
 */
export function removeScanPartition(list: readonly string[], targetPath: string): string[] {
  const lower = normalizeWindowsPath(targetPath).toLowerCase()
  return list.filter(item => normalizeWindowsPath(item).toLowerCase() !== lower)
}

/**
 * Resolves the effective display path for a model: prefers a user's manual in-place override,
 * otherwise falls back to `<modelDownloadDir>\<relativePath>`.
 */
export function resolveEffectiveModelPath(
  modelId: string,
  relativePath: string,
  modelDownloadDir: string,
  perModelPaths: Record<string, string>,
): { path: string; isManualOverride: boolean } {
  const manual = perModelPaths[modelId]?.trim()
  if (manual) {
    return { path: normalizeWindowsPath(manual), isManualOverride: true }
  }
  const base = normalizeWindowsPath(modelDownloadDir) || 'E:\\HAFIZ_Models'
  const cleanBase = base.endsWith('\\') ? base.slice(0, -1) : base
  return { path: `${cleanBase}\\${relativePath}`, isManualOverride: false }
}

/**
 * Maps an execution comfort profile to recommended GPU Guard & Orchestrator defaults.
 */
export function getExecutionProfileDefaults(profile: ExecutionProfile): {
  vramMarginGb: number
  idleTimeoutSec: number
  singleModelLock: boolean
  routerMode: boolean
} {
  if (profile === 'max_speed') {
    return { vramMarginGb: 1.5, idleTimeoutSec: 300, singleModelLock: true, routerMode: true }
  }
  if (profile === 'low_vram_coexist') {
    return { vramMarginGb: 3.5, idleTimeoutSec: 60, singleModelLock: true, routerMode: true }
  }
  return { vramMarginGb: 2.0, idleTimeoutSec: 120, singleModelLock: true, routerMode: true }
}
