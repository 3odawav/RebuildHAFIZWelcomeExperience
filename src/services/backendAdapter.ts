export type BackendConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'READY'
  | 'BUSY'
  | 'ERROR'
  | 'RECOVERING'

export const BACKEND_CONNECTION_STATES: readonly BackendConnectionState[] = [
  'DISCONNECTED',
  'CONNECTING',
  'READY',
  'BUSY',
  'ERROR',
  'RECOVERING',
] as const

export const VALID_BACKEND_TRANSITIONS: Record<BackendConnectionState, readonly BackendConnectionState[]> = {
  DISCONNECTED: ['CONNECTING'],
  CONNECTING: ['READY', 'DISCONNECTED', 'ERROR'],
  READY: ['BUSY', 'DISCONNECTED', 'ERROR'],
  BUSY: ['READY', 'ERROR', 'DISCONNECTED'],
  ERROR: ['RECOVERING', 'DISCONNECTED', 'CONNECTING'],
  RECOVERING: ['READY', 'DISCONNECTED', 'ERROR'],
}

export function canTransitionBackendState(
  from: BackendConnectionState,
  to: BackendConnectionState,
): boolean {
  return VALID_BACKEND_TRANSITIONS[from].includes(to)
}

export interface BackendActionResult<T = unknown> {
  ok: boolean
  connectionState: BackendConnectionState
  code: 'OK' | 'BACKEND_NOT_CONNECTED' | 'TIMEOUT' | 'HTTP_ERROR' | 'INVALID_INPUT'
  endpoint: string
  data?: T
  detail?: string
}

export interface PartitionScanRequest {
  partitions: string[]
  inPlaceLinking: boolean
  indexSavePath: string
}

export interface PartitionScanResponse {
  discoveredCount: number
  discoveredFiles: { modelId: string; path: string; sizeBytes: number }[]
  indexSavePath: string
}

export interface BackendHealthInfo {
  serviceVersion: string
  gpuName?: string
  vramUsedMb?: number
  vramTotalMb?: number
  activeWorkers: number
}

export const DEFAULT_LOCAL_BACKEND_URL = 'http://127.0.0.1:4891'

/**
 * Typed local Windows companion backend adapter.
 * Performs real HTTP probes against the local orchestrator when explicitly requested,
 * and truthfully reports BACKEND_NOT_CONNECTED (DISCONNECTED) when unavailable —
 * never fabricating LLM responses, GPU readings, scan results, or downloads.
 */
export class HafizBackendAdapter {
  readonly baseUrl: string
  private readonly fetchImpl: typeof fetch
  private state: BackendConnectionState = 'DISCONNECTED'

  constructor(baseUrl = DEFAULT_LOCAL_BACKEND_URL, fetchImpl: typeof fetch = globalThis.fetch) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.fetchImpl = fetchImpl
  }

  getState(): BackendConnectionState {
    return this.state
  }

  private setState(next: BackendConnectionState) {
    this.state = next
  }

  private async requestJson<T>(
    path: string,
    init?: RequestInit,
    timeoutMs = 1800,
  ): Promise<BackendActionResult<T>> {
    const endpoint = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await this.fetchImpl(endpoint, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      })
      if (!response.ok) {
        this.setState('ERROR')
        return {
          ok: false,
          connectionState: this.state,
          code: 'HTTP_ERROR',
          endpoint,
          detail: `HTTP ${response.status}`,
        }
      }
      const data = (await response.json()) as T
      this.setState('READY')
      return {
        ok: true,
        connectionState: this.state,
        code: 'OK',
        endpoint,
        data,
      }
    } catch (err) {
      const isAbort = err instanceof Error && err.name === 'AbortError'
      this.setState('DISCONNECTED')
      return {
        ok: false,
        connectionState: 'DISCONNECTED',
        code: isAbort ? 'TIMEOUT' : 'BACKEND_NOT_CONNECTED',
        endpoint,
        detail: isAbort ? 'Local backend probe timed out' : 'Local Windows companion backend is not running or unreachable',
      }
    } finally {
      clearTimeout(timer)
    }
  }

  async probeHealth(): Promise<BackendActionResult<BackendHealthInfo>> {
    this.setState(this.state === 'ERROR' ? 'RECOVERING' : 'CONNECTING')
    return this.requestJson<BackendHealthInfo>('/api/v1/health', { method: 'GET' }, 1400)
  }

  async scanPartitions(req: PartitionScanRequest): Promise<BackendActionResult<PartitionScanResponse>> {
    if (!req.partitions.length) {
      return {
        ok: false,
        connectionState: this.state,
        code: 'INVALID_INPUT',
        endpoint: `${this.baseUrl}/api/v1/models/scan`,
        detail: 'Select at least one partition or folder to scan.',
      }
    }
    this.setState('BUSY')
    return this.requestJson<PartitionScanResponse>(
      '/api/v1/models/scan',
      { method: 'POST', body: JSON.stringify(req) },
      2500,
    )
  }

  async purgeHafizVram(): Promise<BackendActionResult<{ unloadedModels: string[] }>> {
    this.setState('BUSY')
    return this.requestJson<{ unloadedModels: string[] }>(
      '/api/v1/gpu/purge-hafiz',
      { method: 'POST', body: JSON.stringify({ forceCancelIdleHafizJobs: true }) },
      2000,
    )
  }

  async checkBackendOptimizations(): Promise<BackendActionResult<{ latestVersion: string; upToDate: boolean }>> {
    this.setState('CONNECTING')
    return this.requestJson<{ latestVersion: string; upToDate: boolean }>(
      '/api/v1/system/optimizations',
      { method: 'GET' },
      1400,
    )
  }
}
