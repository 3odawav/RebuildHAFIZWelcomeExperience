import { useEffect, useRef } from 'react'
import type { AvatarState } from '../utils/avatarAnimation'

interface AiMatrixHaloProps {
  state: AvatarState
  compact?: boolean
}

const SYMBOLS = [
  '0', '1', '∑', 'λ', 'Δ', 'π', '∫', 'Ω', '∇', 'θ', 'α', 'β', '∞',
  'f(x)', '0xF4', 'Hz', 'dB', '98%', '∂t', 'e^iπ', 'Σn', '44k', '101', '010',
  'حَ', 'فِ', 'ظْ',
]

interface RainStream {
  /** Normalized x (0..1) */
  x: number
  /** Normalized y (0..1) */
  y: number
  speed: number
  length: number
  seed: number
  fontSize: number
}

interface SynapseNode {
  angle: number
  radiusX: number
  radiusY: number
  speed: number
  phase: number
  size: number
}

/**
 * Clean futuristic electric-blue AI atmosphere around HAFIZ's head and face:
 * - Falling blue Matrix-style symbols, numbers & equations around his head
 * - Pulsing blue LED telemetry ring segments
 * - Subtle neural thinking synapses accelerating when HAFIZ is thinking or speaking
 */
export function AiMatrixHalo({ state, compact = false }: AiMatrixHaloProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<AvatarState>(state)
  stateRef.current = state

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const cx = W * 0.5
    const cy = H * 0.45

    // Deterministic Matrix rain columns framing left, top, and right of HAFIZ's head (clear center face window)
    const streamCount = compact ? 14 : 26
    const streams: RainStream[] = Array.from({ length: streamCount }, (_, i) => {
      const frac = (i + 0.5) / streamCount
      return {
        x: 0.05 + frac * 0.9,
        y: ((i * 0.37) % 1),
        speed: 0.08 + (i % 5) * 0.025,
        length: compact ? 5 : 6 + (i % 4),
        seed: i * 17,
        fontSize: compact ? 10 : i % 3 === 0 ? 13 : 11,
      }
    })

    // Neural thinking nodes orbiting the crown/head
    const nodes: SynapseNode[] = Array.from({ length: compact ? 10 : 18 }, (_, i) => ({
      angle: (i / (compact ? 10 : 18)) * Math.PI * 2,
      radiusX: W * (compact ? 0.39 : 0.34 + (i % 3) * 0.055),
      radiusY: H * (compact ? 0.39 : 0.35 + ((i + 1) % 3) * 0.045),
      speed: (i % 2 === 0 ? 1 : -1) * (0.14 + (i % 4) * 0.04),
      phase: i * 0.9,
      size: i % 3 === 0 ? 3.2 : 2,
    }))

    let rafId = 0
    let lastNow = performance.now()
    let lastDraw = 0
    let elapsed = 0

    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw)
      if (now - lastDraw < 32) return
      lastDraw = now

      const dt = Math.min(0.06, (now - lastNow) / 1000)
      lastNow = now
      const curState = stateRef.current
      const energyBoost = curState === 'thinking' ? 2.15 : curState === 'speaking' ? 1.55 : curState === 'listening' ? 1.3 : 1.0
      elapsed += dt * energyBoost

      ctx.clearRect(0, 0, W, H)

      // 1. Falling blue Matrix-style symbols, numbers & equations around his head
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let s = 0; s < streams.length; s++) {
        const st = streams[s]
        st.y = (st.y + dt * st.speed * energyBoost) % 1.25
        const px = st.x * W

        // Soft circular exclusion around center face so equations frame his head/shoulders without obscuring facial features
        const dxCenter = (px - cx) / (W * 0.24)
        for (let k = 0; k < st.length; k++) {
          const py = (st.y - k * 0.055) * H
          if (py < -20 || py > H + 20) continue

          const dyCenter = (py - cy) / (H * 0.28)
          const distSq = dxCenter * dxCenter + dyCenter * dyCenter
          if (distSq < 0.85) continue
          const edgeFade = Math.min(1, (distSq - 0.85) * 1.4)

          const outerDist = Math.hypot((px - cx) / (W * 0.5), (py - cy) / (H * 0.52))
          if (outerDist > 1.05) continue
          const outerFade = Math.max(0, 1 - Math.max(0, outerDist - 0.65) / 0.4)

          const headFactor = k === 0 ? 1 : Math.max(0.14, 1 - k / st.length)
          const baseAlpha = (curState === 'thinking' ? 0.88 : curState === 'speaking' ? 0.68 : 0.5) * headFactor * edgeFade * outerFade
          if (baseAlpha < 0.03) continue

          const symIdx = (st.seed + k * 3 + Math.floor(elapsed * (k === 0 ? 3.5 : 1.2))) % SYMBOLS.length
          const glyph = SYMBOLS[symIdx]

          if (k === 0) {
            // Fast soft halo behind leading Matrix glyph (no software shadowBlur)
            ctx.fillStyle = `rgba(0, 196, 255, ${baseAlpha * 0.24})`
            ctx.beginPath()
            ctx.arc(px, py, st.fontSize * 0.72, 0, Math.PI * 2)
            ctx.fill()
            ctx.font = `600 ${st.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
            ctx.fillStyle = `rgba(170, 245, 255, ${Math.min(1, baseAlpha * 1.2)})`
          } else {
            ctx.font = `400 ${st.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
            ctx.fillStyle = `rgba(36, 178, 255, ${baseAlpha})`
          }
          ctx.fillText(glyph, px, py)
        }
      }
      ctx.restore()

      // 2. Blue LED circular telemetry segments around his head
      ctx.save()
      ctx.translate(cx, cy)
      const ledCount = compact ? 28 : 44
      const ringR = Math.min(W, H) * (compact ? 0.43 : 0.41)
      const rotOffset = elapsed * (curState === 'thinking' ? 0.42 : 0.14)

      for (let i = 0; i < ledCount; i++) {
        const a = (i / ledCount) * Math.PI * 2 + rotOffset
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(elapsed * 3.2 - i * 0.45))
        const alpha = (curState === 'thinking' ? 0.92 : curState === 'speaking' ? 0.78 : 0.48) * pulse
        const lx = Math.cos(a) * ringR
        const ly = Math.sin(a) * ringR * 0.96
        const isMajor = i % 4 === 0
        const rad = isMajor ? (compact ? 2.1 : 2.6) : (compact ? 1.2 : 1.5)

        if (isMajor) {
          ctx.fillStyle = `rgba(0, 185, 255, ${alpha * 0.28})`
          ctx.beginPath()
          ctx.arc(lx, ly, rad * 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = isMajor ? `rgba(155, 245, 255, ${alpha})` : `rgba(34, 178, 255, ${alpha * 0.78})`
        ctx.beginPath()
        ctx.arc(lx, ly, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      // Thin orbital blue light arcs
      ctx.strokeStyle = curState === 'thinking' ? 'rgba(92, 232, 255, 0.58)' : 'rgba(34, 184, 255, 0.34)'
      ctx.lineWidth = compact ? 1.2 : 1.7
      ctx.beginPath()
      ctx.arc(0, 0, ringR * 0.92, rotOffset, rotOffset + Math.PI * 0.55)
      ctx.stroke()

      ctx.strokeStyle = 'rgba(56, 200, 255, 0.28)'
      ctx.beginPath()
      ctx.arc(0, 0, ringR * 1.07, -rotOffset * 0.8, -rotOffset * 0.8 + Math.PI * 0.45)
      ctx.stroke()
      ctx.restore()

      // 3. Thinking neural synapses (nodes + electric connections around crown)
      ctx.save()
      const pts = nodes.map(n => {
        const a = n.angle + elapsed * n.speed
        return {
          x: cx + Math.cos(a) * n.radiusX,
          y: cy + Math.sin(a) * n.radiusY,
          pulse: 0.5 + 0.5 * Math.sin(elapsed * 3.8 + n.phase),
          size: n.size,
        }
      })

      const maxLinkDist = compact ? 64 : 112
      ctx.lineWidth = 1
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
          if (d < maxLinkDist) {
            const lineAlpha = (1 - d / maxLinkDist) * (curState === 'thinking' ? 0.52 : 0.22)
            ctx.strokeStyle = `rgba(64, 210, 255, ${lineAlpha})`
            ctx.beginPath()
            ctx.moveTo(pts[i].x, pts[i].y)
            ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }

      for (const p of pts) {
        const alpha = (curState === 'thinking' ? 0.92 : 0.56) * (0.45 + p.pulse * 0.55)
        ctx.fillStyle = `rgba(0, 200, 255, ${alpha * 0.26})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2.6, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = `rgba(165, 245, 255, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [compact])

  return (
    <canvas
      ref={canvasRef}
      width={compact ? 220 : 640}
      height={compact ? 220 : 520}
      data-testid={compact ? 'ai-matrix-halo-compact' : 'ai-matrix-halo'}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
