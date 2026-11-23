import { useEffect, useRef } from 'react'
import { sampleAvatarPose, type AvatarState } from '../utils/avatarAnimation'

interface SpeakingWaveAuraProps {
  state: AvatarState
  speechBeatAt: number
  micEnergy: number
}

/**
 * Symmetrical glowing cyan audio waveforms radiating from both sides of HAFIZ's
 * front-facing portrait when speaking or listening, inspired by the official voice HUD reference.
 */
export function SpeakingWaveAura({ state, speechBeatAt, micEnergy }: SpeakingWaveAuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef({ state, speechBeatAt, micEnergy })
  propsRef.current = { state, speechBeatAt, micEnergy }

  const active = state === 'speaking' || state === 'listening'

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    const start = performance.now()
    let lastDraw = 0

    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw)
      if (now - lastDraw < 32) return
      lastDraw = now

      const { state: curState, speechBeatAt: beatAt, micEnergy: energy } = propsRef.current
      const t = (now - start) / 1000
      const msSinceBeat = now - beatAt
      const speechImpulse = msSinceBeat >= 0 && msSinceBeat < 260 ? 1 - msSinceBeat / 260 : 0
      const pose = sampleAvatarPose(curState, t, { speechImpulse, micEnergy: energy })

      const W = canvas.width
      const H = canvas.height
      const midY = H * 0.56
      ctx.clearRect(0, 0, W, H)

      const drawSide = (startX: number, dir: 1 | -1) => {
        ctx.save()
        const lineGrad = ctx.createLinearGradient(startX, midY, startX + dir * 185, midY)
        lineGrad.addColorStop(0, 'rgba(38, 210, 255, 0.75)')
        lineGrad.addColorStop(0.75, 'rgba(0, 150, 255, 0.4)')
        lineGrad.addColorStop(1, 'rgba(0, 150, 255, 0)')
        ctx.strokeStyle = lineGrad
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(startX, midY)
        ctx.lineTo(startX + dir * 185, midY)
        ctx.stroke()

        // 16 vertical glowing equalizer bars (layered soft glow + crisp core, zero shadowBlur)
        pose.waveBars.forEach((amp, i) => {
          const x = startX + dir * (14 + i * 10.6)
          const halfH = Math.max(4, amp * 76)

          ctx.fillStyle = 'rgba(0, 190, 255, 0.24)'
          ctx.beginPath()
          ctx.roundRect(x - 4.5, midY - halfH - 2, 9, halfH * 2 + 4, 4)
          ctx.fill()

          const barGrad = ctx.createLinearGradient(x, midY - halfH, x, midY + halfH)
          barGrad.addColorStop(0, 'rgba(125, 240, 255, 0.16)')
          barGrad.addColorStop(0.5, 'rgba(120, 242, 255, 1)')
          barGrad.addColorStop(1, 'rgba(125, 240, 255, 0.16)')

          ctx.fillStyle = barGrad
          ctx.beginPath()
          ctx.roundRect(x - 2, midY - halfH, 4, halfH * 2, 2)
          ctx.fill()
        })
        ctx.restore()
      }

      drawSide(W * 0.30, -1)
      drawSide(W * 0.70, 1)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      width={720}
      height={320}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-[-6%] top-[24%] h-[54%] w-[112%] transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
