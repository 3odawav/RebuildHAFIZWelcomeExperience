import { useEffect, useRef, useState } from 'react'
import {
  advanceSpeechHeartbeat,
  createSpeechHeartbeatTracker,
  sampleAvatarPose,
  type AvatarState,
} from '../utils/avatarAnimation'

interface HafizFaceRigProps {
  state: AvatarState
  /** Live speech boundary timestamp (ms) that triggers a syllable emphasis pulse */
  speechBeatAt: number
  /** Normalized live microphone energy (0..1) */
  micEnergy: number
  /** Whether the portrait is currently visible (pauses rAF work when hidden) */
  visible?: boolean
  /** Compact mode for floating side assistant */
  compact?: boolean
  onError?: () => void
}

const PRIMARY_AVATAR_SRC = '/assets/hafiz-front.png'
const FALLBACK_AVATAR_SRC = '/assets/hafiz-profile.png'

/**
 * Pixel-exact normalized facial landmarks measured on HAFIZ's official 1254×1254 front portrait.
 */
const LANDMARKS = {
  leftEye: { x: 0.402, y: 0.432, rx: 0.072, ry: 0.036 },
  rightEye: { x: 0.598, y: 0.432, rx: 0.072, ry: 0.036 },
  leftBrow: { x: 0.398, y: 0.352, rx: 0.088, ry: 0.032 },
  rightBrow: { x: 0.602, y: 0.352, rx: 0.088, ry: 0.032 },
  mouth: { x: 0.5, y: 0.582, halfW: 0.074 },
  mouthCornerRight: { x: 0.568, y: 0.585, rx: 0.036, ry: 0.024 },
  jaw: { x: 0.5, topY: 0.582, bottomY: 0.742, halfW: 0.165 },
  upperLip: { x: 0.5, y: 0.562, rx: 0.085, ry: 0.024 },
} as const

/**
 * Real-time 2.5D articulated face canvas for HAFIZ's official front-facing portrait.
 * Drives continuous living idle gaze (screen, right, up, left), natural blinking,
 * asymmetric eyebrows, subtle facial expressions, thinking posture, listening attentiveness,
 * and speaking mouth/jaw lip-sync directly from the official portrait pixels.
 */
export function HafizFaceRig({
  state,
  speechBeatAt,
  micEnergy,
  visible = true,
  compact = false,
  onError,
}: HafizFaceRigProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  const propsRef = useRef({ state, speechBeatAt, micEnergy, visible })
  propsRef.current = { state, speechBeatAt, micEnergy, visible }

  const resolution = compact ? 256 : 512

  useEffect(() => {
    let active = true
    let triedFallback = false
    const img = new Image()

    const finishLoad = () => {
      if (!active) return
      const base = document.createElement('canvas')
      base.width = resolution
      base.height = resolution
      const bCtx = base.getContext('2d')
      bCtx?.drawImage(img, 0, 0, resolution, resolution)
      baseCanvasRef.current = base

      const off = document.createElement('canvas')
      off.width = Math.ceil(resolution * 0.42)
      off.height = Math.ceil(resolution * 0.25)
      offscreenRef.current = off
      setLoaded(true)
    }

    img.onload = finishLoad
    img.onerror = () => {
      if (!active) return
      if (!triedFallback) {
        triedFallback = true
        img.src = FALLBACK_AVATAR_SRC
      } else {
        onError?.()
      }
    }
    img.src = PRIMARY_AVATAR_SRC

    return () => {
      active = false
    }
  }, [onError, resolution])

  useEffect(() => {
    if (!loaded) return
    const canvas = canvasRef.current
    const baseImg = baseCanvasRef.current
    const off = offscreenRef.current
    if (!canvas || !baseImg || !off) return

    const ctx = canvas.getContext('2d')
    const offCtx = off.getContext('2d')
    if (!ctx || !offCtx) return

    let rafId = 0
    const startTime = performance.now()
    let lastDraw = 0
    let heartbeatTracker = createSpeechHeartbeatTracker()
    let smoothImpulse = 0
    let smoothMouth = 0
    let smoothLeftBrow = 0
    let smoothRightBrow = 0
    let smoothSmirk = 0
    let smoothLookX = 0
    let smoothLookY = 0
    let smoothYaw = 0
    let smoothPitch = 0
    let smoothNod = 0
    let smoothTilt = 0

    const drawFeatheredSlice = (
      cx: number,
      cy: number,
      rx: number,
      ry: number,
      shiftX: number,
      shiftY: number,
      scaleY = 1,
      extraFeather = 0.62,
    ) => {
      const bw = Math.min(off.width, Math.ceil(rx * 2 + 4))
      const bh = Math.min(off.height, Math.ceil(ry * 2 + 4))
      const sx = Math.max(0, Math.floor(cx - bw / 2))
      const sy = Math.max(0, Math.floor(cy - bh / 2))
      const localCx = cx - sx
      const localCy = cy - sy

      offCtx.clearRect(0, 0, bw, bh)
      offCtx.save()
      offCtx.globalCompositeOperation = 'source-over'
      offCtx.drawImage(baseImg, sx, sy, bw, bh, 0, 0, bw, bh)

      offCtx.globalCompositeOperation = 'destination-in'
      offCtx.save()
      offCtx.translate(localCx, localCy)
      offCtx.scale(rx, ry)
      const grad = offCtx.createRadialGradient(0, 0, extraFeather, 0, 0, 1)
      grad.addColorStop(0, 'rgba(0,0,0,1)')
      grad.addColorStop(0.75, 'rgba(0,0,0,0.85)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      offCtx.fillStyle = grad
      offCtx.beginPath()
      offCtx.arc(0, 0, 1, 0, Math.PI * 2)
      offCtx.fill()
      offCtx.restore()
      offCtx.restore()

      ctx.save()
      ctx.translate(cx + shiftX, cy + shiftY)
      ctx.scale(1, scaleY)
      ctx.drawImage(off, 0, 0, bw, bh, -localCx, -localCy, bw, bh)
      ctx.restore()
    }

    const render = (now: number) => {
      rafId = requestAnimationFrame(render)
      const { state: curState, speechBeatAt: beatAt, micEnergy: energy, visible: isVis } = propsRef.current
      if (!isVis || now - lastDraw < 32) return
      const dtSec = lastDraw > 0 ? Math.min(0.1, (now - lastDraw) / 1000) : 1 / 30
      lastDraw = now

      const t = (now - startTime) / 1000

      // Advance ongoing speech heartbeat inside rAF (locks to speechBeatAt & sustains syllable cadence)
      const heartbeat = advanceSpeechHeartbeat(now, curState, beatAt, heartbeatTracker)
      heartbeatTracker = heartbeat.tracker

      const pose = sampleAvatarPose(curState, t, {
        speechImpulse: heartbeat.impulse,
        speechBeatPhase: heartbeat.phase,
        speechBeatCount: heartbeat.beatCount,
        micEnergy: energy,
      })

      // Frame-rate-independent exponential smoothing tuned for responsive speech heartbeat sync
      const damp = (speed: number) => 1 - Math.exp(-speed * dtSec)
      const mouthRate = curState === 'speaking' ? 19 : 9
      const gazeRate = curState === 'speaking' ? 10.5 : 5.5
      const browRate = curState === 'speaking' ? 12.5 : 7.5

      smoothImpulse += (heartbeat.impulse - smoothImpulse) * damp(16)
      smoothMouth += (pose.mouthOpen - smoothMouth) * damp(mouthRate)
      smoothLeftBrow += (pose.leftBrowLift - smoothLeftBrow) * damp(browRate)
      smoothRightBrow += (pose.rightBrowLift - smoothRightBrow) * damp(browRate)
      smoothSmirk += (pose.smirk - smoothSmirk) * damp(6.5)
      smoothLookX += (pose.lookX - smoothLookX) * damp(gazeRate)
      smoothLookY += (pose.lookY - smoothLookY) * damp(gazeRate)
      smoothYaw += (pose.headYawDeg - smoothYaw) * damp(5.2)
      smoothPitch += (pose.headPitchDeg - smoothPitch) * damp(5.8)
      smoothNod += (pose.headNod - smoothNod) * damp(9.0)
      smoothTilt += (pose.headTiltDeg - smoothTilt) * damp(6.0)

      // Expose lightweight live rAF sync telemetry on the canvas dataset (zero React re-renders)
      canvas.dataset.heartbeatCount = String(heartbeat.beatCount)
      canvas.dataset.speechImpulse = smoothImpulse.toFixed(2)
      canvas.dataset.gazeX = smoothLookX.toFixed(2)
      canvas.dataset.gazeY = smoothLookY.toFixed(2)
      canvas.dataset.browLift = ((smoothLeftBrow + smoothRightBrow) / 2).toFixed(2)
      canvas.dataset.mouthOpen = smoothMouth.toFixed(2)

      // Drive smooth 3D perspective head turn (left/right yaw & up/down pitch) directly on stage ref
      if (stageRef.current) {
        const yawScale = compact ? 0.85 : 1
        const shiftPx = smoothYaw * (compact ? 0.5 : 1.05)
        stageRef.current.style.transform = `perspective(1050px) rotateY(${(smoothYaw * yawScale).toFixed(2)}deg) rotateX(${(smoothPitch * yawScale).toFixed(2)}deg) translateX(${shiftPx.toFixed(2)}px)`
      }

      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // 1. Subtle whole-head breathing, conversational nod & roll tilt
      const breathScale =
        1 +
        Math.sin(t * 1.45) * 0.007 +
        (curState === 'speaking'
          ? smoothMouth * 0.009
          : curState === 'laughing'
            ? 0.012 + Math.sin(t * 8.4) * 0.006
            : curState === 'listening'
              ? 0.014
              : 0)
      const nodPx = smoothNod * H * 0.009
      const tiltRad = (smoothTilt * Math.PI) / 180

      ctx.save()
      ctx.translate(W * 0.5, H * 0.62)
      ctx.rotate(tiltRad)
      ctx.scale(breathScale, breathScale)
      ctx.translate(-W * 0.5, -H * 0.62 + nodPx)

      // Base official front-facing HAFIZ portrait (pre-scaled cache, exact identity preserved)
      ctx.drawImage(baseImg, 0, 0, W, H)

      // Subtle mood lighting accent (serious frontal focus vs speaking neon holographic shimmer)
      if (curState === 'serious') {
        const focusVig = ctx.createRadialGradient(W * 0.5, H * 0.44, W * 0.14, W * 0.5, H * 0.46, W * 0.52)
        focusVig.addColorStop(0, 'rgba(130, 225, 255, 0.09)')
        focusVig.addColorStop(0.65, 'rgba(0, 12, 28, 0.08)')
        focusVig.addColorStop(1, 'rgba(0, 4, 12, 0.28)')
        ctx.fillStyle = focusVig
        ctx.fillRect(0, 0, W, H)
      } else if (curState === 'speaking') {
        const holoFlicker = 0.04 + smoothImpulse * 0.08 + Math.sin(t * 22) * 0.015
        const holoGrad = ctx.createRadialGradient(W * 0.5, H * 0.46, W * 0.1, W * 0.5, H * 0.48, W * 0.5)
        holoGrad.addColorStop(0, `rgba(60, 220, 255, ${holoFlicker.toFixed(3)})`)
        holoGrad.addColorStop(1, 'rgba(0, 140, 255, 0)')
        ctx.fillStyle = holoGrad
        ctx.fillRect(0, 0, W, H)
      }

      // 2. Asymmetric Expressive Eyebrows (curious cocked brow when thinking/looking up, lifted when speaking)
      if (smoothLeftBrow > 0.02) {
        drawFeatheredSlice(
          LANDMARKS.leftBrow.x * W,
          LANDMARKS.leftBrow.y * H,
          LANDMARKS.leftBrow.rx * W,
          LANDMARKS.leftBrow.ry * H,
          -smoothLeftBrow * W * 0.003 + smoothLookX * W * 0.004,
          -smoothLeftBrow * H * 0.017,
          1,
          0.44,
        )
      }
      if (smoothRightBrow > 0.02) {
        drawFeatheredSlice(
          LANDMARKS.rightBrow.x * W,
          LANDMARKS.rightBrow.y * H,
          LANDMARKS.rightBrow.rx * W,
          LANDMARKS.rightBrow.ry * H,
          smoothRightBrow * W * 0.003 + smoothLookX * W * 0.004,
          -smoothRightBrow * H * 0.017,
          1,
          0.44,
        )
      }

      // 3. Subtle Confident Micro-Expression (light mouth-corner lift in idle, attentive & speech phrase peaks)
      if (smoothSmirk > 0.05 && smoothMouth < 0.22) {
        const smirkWeight = smoothSmirk * (1 - smoothMouth * 3.2)
        if (smirkWeight > 0.03) {
          drawFeatheredSlice(
            LANDMARKS.mouthCornerRight.x * W,
            LANDMARKS.mouthCornerRight.y * H,
            LANDMARKS.mouthCornerRight.rx * W,
            LANDMARKS.mouthCornerRight.ry * H,
            smirkWeight * W * 0.0045,
            -smirkWeight * H * 0.0065,
            1,
            0.42,
          )
        }
      }

      // 4. Articulated Speaking Mouth Cavity + Realistic Lower-Lip & Bearded Chin Jaw Drop
      if (smoothMouth > 0.015) {
        const mx = LANDMARKS.mouth.x * W
        const my = LANDMARKS.mouth.y * H
        const openH = smoothMouth * H * 0.044
        const halfW = LANDMARKS.mouth.halfW * W * pose.mouthWidth
        const jawDropPx = smoothMouth * H * 0.036

        // 4a. Articulated lower lip + bearded chin slice shifted downward
        const jawCy = ((LANDMARKS.jaw.topY + LANDMARKS.jaw.bottomY) / 2) * H + H * 0.012
        const jawRy = ((LANDMARKS.jaw.bottomY - LANDMARKS.jaw.topY) / 2) * H
        const jawRx = LANDMARKS.jaw.halfW * W
        drawFeatheredSlice(mx, jawCy, jawRx, jawRy, 0, jawDropPx, 1 - smoothMouth * 0.04, 0.54)

        // 4b. Dark anatomical mouth interior right between parted lips
        const topLipY = my - openH * 0.16
        const bottomLipY = my + openH * 0.92
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(mx - halfW, my + openH * 0.12)
        ctx.bezierCurveTo(
          mx - halfW * 0.52,
          topLipY - openH * 0.22,
          mx + halfW * 0.52,
          topLipY - openH * 0.22,
          mx + halfW,
          my + openH * 0.12,
        )
        ctx.bezierCurveTo(
          mx + halfW * 0.58,
          bottomLipY + openH * 0.22,
          mx - halfW * 0.58,
          bottomLipY + openH * 0.22,
          mx - halfW,
          my + openH * 0.12,
        )
        ctx.closePath()

        const cavityGrad = ctx.createRadialGradient(mx, my + openH * 0.45, openH * 0.1, mx, my + openH * 0.4, halfW * 1.1)
        cavityGrad.addColorStop(0, '#020407')
        cavityGrad.addColorStop(0.7, '#060a10')
        cavityGrad.addColorStop(1, '#121a24')
        ctx.fillStyle = cavityGrad
        ctx.fill()

        ctx.clip()
        if (smoothMouth > 0.14) {
          const teethAlpha = Math.min(0.92, (smoothMouth - 0.1) * 1.3)
          const teethGrad = ctx.createLinearGradient(mx, topLipY, mx, my + openH * 0.36)
          teethGrad.addColorStop(0, `rgba(210, 224, 238, ${teethAlpha * 0.92})`)
          teethGrad.addColorStop(0.55, `rgba(145, 162, 180, ${teethAlpha * 0.65})`)
          teethGrad.addColorStop(1, 'rgba(12, 18, 26, 0)')
          ctx.fillStyle = teethGrad
          ctx.beginPath()
          ctx.ellipse(mx, topLipY + openH * 0.08, halfW * 0.72, openH * 0.3, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        const innerShadow = ctx.createLinearGradient(mx, bottomLipY - openH * 0.25, mx, bottomLipY + openH * 0.25)
        innerShadow.addColorStop(0, 'rgba(0,0,0,0)')
        innerShadow.addColorStop(1, 'rgba(0,0,0,0.65)')
        ctx.fillStyle = innerShadow
        ctx.fillRect(mx - halfW, bottomLipY - openH * 0.25, halfW * 2, openH * 0.55)
        ctx.restore()

        // 4c. Metallic lower-lip rim highlight
        ctx.save()
        ctx.strokeStyle = `rgba(180, 198, 218, ${Math.min(0.42, smoothMouth * 0.5)})`
        ctx.lineWidth = Math.max(1.2, H * 0.0032)
        ctx.beginPath()
        ctx.moveTo(mx - halfW * 0.65, bottomLipY + openH * 0.05)
        ctx.quadraticCurveTo(mx, bottomLipY + openH * 0.28, mx + halfW * 0.65, bottomLipY + openH * 0.05)
        ctx.stroke()
        ctx.restore()

        // 4d. Subtle upper-lip / mustache lift
        drawFeatheredSlice(
          LANDMARKS.upperLip.x * W,
          LANDMARKS.upperLip.y * H,
          LANDMARKS.upperLip.rx * W,
          LANDMARKS.upperLip.ry * H,
          0,
          -smoothMouth * H * 0.007,
          1,
          0.42,
        )
      }

      // 5. Expressive Eyes Behind Sunglasses: Speech-Heartbeat-Synced Gaze Tracking + Blinks + Glint
      const eyes = [LANDMARKS.leftEye, LANDMARKS.rightEye]
      // Subtle lower-lid expression squint synced to smirk & speech emphasis beats
      const expressionSquint = smoothSmirk * 0.14 + smoothImpulse * 0.08
      const eyeOpenScale = Math.max(0.06, 1 - pose.blink * 0.94 - expressionSquint * (1 - pose.blink))
      const eyeGlowStrength =
        curState === 'speaking'
          ? 0.44 + smoothMouth * 0.22 + smoothImpulse * 0.22
          : curState === 'laughing'
            ? 0.66 + Math.sin(t * 9) * 0.14
            : curState === 'serious'
              ? 0.36
              : curState === 'thinking'
                ? 0.52
                : curState === 'listening'
                  ? 0.42 + energy * 0.24
                  : 0.30

      for (const eye of eyes) {
        const ex = eye.x * W
        const ey = eye.y * H
        const erx = eye.rx * W
        const ery = eye.ry * H

        ctx.save()
        ctx.beginPath()
        ctx.roundRect(ex - erx, ey - ery, erx * 2, ery * 2, [ery * 0.35, ery * 0.35, ery * 0.78, ery * 0.78])
        ctx.clip()

        // Directional eye gaze offset inside the smoked lens (tracks speech heartbeat & idle gaze)
        const gazeOffsetX = smoothLookX * erx * 0.36
        const gazeOffsetY = smoothLookY * ery * 0.38
        const irisX = ex + gazeOffsetX
        const irisY = ey + gazeOffsetY

        const irisGrad = ctx.createRadialGradient(irisX, irisY, 1, irisX, irisY, erx * 0.54)
        irisGrad.addColorStop(0, `rgba(135, 238, 255, ${eyeGlowStrength * eyeOpenScale})`)
        irisGrad.addColorStop(0.45, `rgba(24, 172, 255, ${eyeGlowStrength * 0.58 * eyeOpenScale})`)
        irisGrad.addColorStop(1, 'rgba(0, 120, 255, 0)')

        ctx.save()
        ctx.translate(irisX, irisY)
        ctx.scale(1, eyeOpenScale)
        ctx.fillStyle = irisGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, erx * 0.56, ery * 0.54, 0, 0, Math.PI * 2)
        ctx.fill()

        if (eyeOpenScale > 0.28) {
          ctx.fillStyle = `rgba(218, 248, 255, ${Math.min(0.95, eyeGlowStrength * 1.1) * eyeOpenScale})`
          ctx.beginPath()
          ctx.arc(erx * 0.06, -ery * 0.06, Math.max(1.4, erx * 0.1), 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()

        // Animated diagonal cyan glass reflection reacting to head turn & gaze
        const sweepX = ex + (pose.lensGlint * 0.65 + smoothLookX * 0.35) * erx * 0.9
        const glintGrad = ctx.createLinearGradient(sweepX - erx * 0.5, ey - ery, sweepX + erx * 0.5, ey + ery)
        glintGrad.addColorStop(0, 'rgba(56, 200, 255, 0)')
        glintGrad.addColorStop(0.5, `rgba(130, 232, 255, ${curState === 'speaking' || curState === 'thinking' ? 0.24 : 0.15})`)
        glintGrad.addColorStop(1, 'rgba(56, 200, 255, 0)')
        ctx.fillStyle = glintGrad
        ctx.fillRect(ex - erx, ey - ery, erx * 2, ery * 2)

        ctx.restore()
      }

      ctx.restore()
    }

    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [loaded, compact])

  return (
    <div
      ref={stageRef}
      className="flex h-full w-full items-center justify-center"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <canvas
        ref={canvasRef}
        width={resolution}
        height={resolution}
        data-testid={compact ? 'hafiz-floating-rig' : 'hafiz-front-rig'}
        data-avatar-state={state}
        aria-label="Official HAFIZ front-facing animated character"
        className={`h-full w-full object-contain transition-[filter] duration-300 ${
          state === 'serious'
            ? 'contrast-110 drop-shadow-[0_0_24px_#0055aa99]'
            : state === 'laughing'
              ? 'brightness-105 drop-shadow-[0_0_32px_#38e8ffaa]'
              : 'drop-shadow-[0_0_26px_#069cff88]'
        }`}
      />
    </div>
  )
}
