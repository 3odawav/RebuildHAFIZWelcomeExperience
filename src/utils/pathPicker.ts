/**
 * Attempts to open a genuine browser directory picker (File System Access API)
 * or falls back cleanly when running inside a sandboxed iframe.
 */
export interface BrowsePickResult {
  pickedName: string | null
  sandboxBlocked: boolean
  cancelled: boolean
}

export async function pickLocalDirectoryOrFile(kind: 'directory' | 'file'): Promise<BrowsePickResult> {
  const win = window as unknown as {
    showDirectoryPicker?: () => Promise<{ name: string }>
    showOpenFilePicker?: (opts?: {
      multiple?: boolean
      types?: { description: string; accept: Record<string, string[]> }[]
    }) => Promise<Array<{ name: string }>>
  }

  try {
    if (kind === 'directory' && typeof win.showDirectoryPicker === 'function') {
      const handle = await win.showDirectoryPicker()
      return { pickedName: handle.name || null, sandboxBlocked: false, cancelled: false }
    }
    if (kind === 'file' && typeof win.showOpenFilePicker === 'function') {
      const handles = await win.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'AI Model Weights & Checkpoints',
            accept: {
              'application/octet-stream': ['.gguf', '.safetensors', '.ckpt', '.pt', '.pth', '.bin', '.th', '.onnx'],
            },
          },
        ],
      })
      return { pickedName: handles[0]?.name || null, sandboxBlocked: false, cancelled: false }
    }
    return { pickedName: null, sandboxBlocked: true, cancelled: false }
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') {
      return { pickedName: null, sandboxBlocked: false, cancelled: true }
    }
    // SecurityError when inside cross-origin iframe
    return { pickedName: null, sandboxBlocked: true, cancelled: false }
  }
}
