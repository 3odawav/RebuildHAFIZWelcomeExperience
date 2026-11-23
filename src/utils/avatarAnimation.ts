export type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking'

export interface AvatarPose {
  /** 0 = closed lips, 1 = wide open speaking mouth */
  mouthOpen: number
  /** Horizontal mouth shape factor (0.78 rounded 'o/u' .. 1.12 wide 'a/e') */
  mouthWidth: number
  /** 0 = neutral, 1 = subtle confident half-smirk / expression */
  smirk: number
  /** 0 = neutral left eyebrow, 1 = raised expressive left eyebrow */
  leftBrowLift: number
  /** 0 = neutral right eyebrow, 1 = raised expressive right eyebrow */
  rightBrowLift: number
  /** Average brow lift for convenience */
  browLift: number
  /** 0 = eyes open, 1 = fully blinked closed */
  blink: number
  /** Gaze horizontal direction (-1 = left, 0 = straight at user, +1 = right) */
  lookX: number
  /** Gaze vertical direction (-1 = looking up, 0 = eye level, +1 = looking down) */
  lookY: number
  /** 3D horizontal head turn in degrees (-8..+8) */
  headYawDeg: number
  /** 3D vertical head pitch in degrees (-6..+6, positive = looking up) */
  headPitchDeg: number
  /** Subtle head vertical nod offset in normalized units (-1..1) */
  headNod: number
  /** Subtle head roll/tilt in degrees (-3.5..3.5) */
  headTiltDeg: number
  /** Subtle horizontal reflection glint shift across sunglasses (-1..1) */
  lensGlint: number
  /** Symmetrical side waveform heights (0..1) for 16 bars per side */
  waveBars: number[]
}

export interface HafizIntentResult {
  route: string | null
  replyAr: string
  replyEn: string
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Computes a smooth periodic natural eye blink factor (0 = open, 1 = closed)
 * with occasional natural double-blinks so the avatar feels alive.
 */
export function computeBlink(timeSec: number): number {
  const period = 4.1
  const phase = ((timeSec % period) + period) % period
  // Primary blink around 3.65s
  if (phase >= 3.62 && phase <= 3.80) {
    return Math.sin(((phase - 3.62) / 0.18) * Math.PI)
  }
  // Occasional gentle secondary blink on alternate cycles
  const cycle = Math.floor(timeSec / period)
  if (cycle % 3 === 1 && phase >= 3.88 && phase <= 4.04) {
    return Math.sin(((phase - 3.88) / 0.16) * Math.PI) * 0.85
  }
  return 0
}

interface IdleKeyframe {
  duration: number
  lookX: number
  lookY: number
  yaw: number
  pitch: number
  tilt: number
  leftBrow: number
  rightBrow: number
  smirk: number
}

/**
 * Natural human idle choreography cycle (~16s loop):
 * looks straight at you -> glances right -> looks up thoughtfully ->
 * returns with subtle confident expression -> glances left -> returns to center.
 */
const IDLE_KEYFRAMES: readonly IdleKeyframe[] = [
  // 0: Calm eye contact with user
  { duration: 2.6, lookX: 0, lookY: 0, yaw: 0, pitch: 0.4, tilt: 0.3, leftBrow: 0.08, rightBrow: 0.08, smirk: 0.12 },
  // 1: Glances slightly right with subtle head turn
  { duration: 2.5, lookX: 0.78, lookY: -0.08, yaw: 6.4, pitch: 0.8, tilt: 1.6, leftBrow: 0.14, rightBrow: 0.28, smirk: 0.08 },
  // 2: Looks upward thoughtfully with cocked eyebrow
  { duration: 2.6, lookX: 0.24, lookY: -0.82, yaw: 2.2, pitch: 4.8, tilt: -1.8, leftBrow: 0.56, rightBrow: 0.18, smirk: 0.04 },
  // 3: Returns directly to user with confident micro-smile
  { duration: 2.8, lookX: 0, lookY: 0.04, yaw: -0.4, pitch: -0.3, tilt: 0.6, leftBrow: 0.22, rightBrow: 0.22, smirk: 0.62 },
  // 4: Glances gently left & slightly down
  { duration: 2.5, lookX: -0.76, lookY: 0.22, yaw: -6.2, pitch: -2.2, tilt: -1.7, leftBrow: 0.12, rightBrow: 0.42, smirk: 0.16 },
  // 5: Thoughtful brief look up-left before centering again
  { duration: 2.4, lookX: -0.28, lookY: -0.58, yaw: -2.5, pitch: 3.4, tilt: 1.2, leftBrow: 0.34, rightBrow: 0.14, smirk: 0.2 },
]

const TOTAL_IDLE_CYCLE = IDLE_KEYFRAMES.reduce((sum, kf) => sum + kf.duration, 0)

export function sampleIdleChoreography(timeSec: number) {
  const t = ((timeSec % TOTAL_IDLE_CYCLE) + TOTAL_IDLE_CYCLE) % TOTAL_IDLE_CYCLE
  let acc = 0
  let currentIdx = 0
  for (let i = 0; i < IDLE_KEYFRAMES.length; i++) {
    if (t < acc + IDLE_KEYFRAMES[i].duration) {
      currentIdx = i
      break
    }
    acc += IDLE_KEYFRAMES[i].duration
  }
  const cur = IDLE_KEYFRAMES[currentIdx]
  const next = IDLE_KEYFRAMES[(currentIdx + 1) % IDLE_KEYFRAMES.length]
  const localT = t - acc
  // Hold the pose gently for the first 58% of the segment, then smoothly glide into the next pose
  const blend = smoothstep(cur.duration * 0.58, cur.duration, localT)

  return {
    lookX: lerp(cur.lookX, next.lookX, blend),
    lookY: lerp(cur.lookY, next.lookY, blend),
    yaw: lerp(cur.yaw, next.yaw, blend),
    pitch: lerp(cur.pitch, next.pitch, blend),
    tilt: lerp(cur.tilt, next.tilt, blend),
    leftBrow: lerp(cur.leftBrow, next.leftBrow, blend),
    rightBrow: lerp(cur.rightBrow, next.rightBrow, blend),
    smirk: lerp(cur.smirk, next.smirk, blend),
  }
}

/**
 * Deterministic real-time facial rig pose calculator for HAFIZ across
 * idle, listening, thinking, and speaking states.
 */
export function sampleAvatarPose(
  state: AvatarState,
  timeSec: number,
  options?: {
    /** Recent word/syllable boundary impulse (0..1) */
    speechImpulse?: number
    /** Average live mic energy (0..1) */
    micEnergy?: number
  },
): AvatarPose {
  const speechImpulse = Math.max(0, Math.min(1, options?.speechImpulse ?? 0))
  const micEnergy = Math.max(0, Math.min(1, options?.micEnergy ?? 0))
  const blink = computeBlink(timeSec)

  if (state === 'speaking') {
    const phraseGate = Math.sin(timeSec * 1.15) > -0.78 ? 1 : 0.12
    const syllableA = Math.max(0, Math.sin(timeSec * 11.4))
    const syllableB = Math.max(0, Math.sin(timeSec * 7.3 + 1.1))
    const syllableC = 0.5 + 0.5 * Math.sin(timeSec * 16.8 + 0.4)
    const rawOpen = (syllableA * 0.55 + syllableB * 0.35 + syllableC * 0.25) * phraseGate
    const mouthOpen = Math.min(1, Math.max(0.05, rawOpen * 0.85 + speechImpulse * 0.42))

    const vowelShape = Math.sin(timeSec * 5.2 + 0.7)
    const mouthWidth = 0.95 + vowelShape * 0.16

    const baseBrow = Math.min(1, 0.24 + mouthOpen * 0.54 + speechImpulse * 0.24)
    const asym = Math.sin(timeSec * 2.1) * 0.12
    const leftBrowLift = Math.max(0, Math.min(1, baseBrow + asym))
    const rightBrowLift = Math.max(0, Math.min(1, baseBrow - asym))

    const headNod = Math.sin(timeSec * 3.4) * 0.36 + mouthOpen * 0.44
    const headYawDeg = Math.sin(timeSec * 1.35) * 3.2
    const headPitchDeg = Math.sin(timeSec * 2.6) * 1.8 + mouthOpen * 1.4
    const headTiltDeg = Math.sin(timeSec * 1.9) * 2.2 + Math.sin(timeSec * 4.7) * 0.5
    const lookX = Math.sin(timeSec * 1.1) * 0.18
    const lookY = -0.05 + Math.sin(timeSec * 1.7) * 0.1
    const lensGlint = Math.sin(timeSec * 2.4)

    const waveBars = Array.from({ length: 16 }, (_, i) => {
      const centerWeight = 1 - Math.abs(i - 6.5) / 8.5
      const ripple = 0.5 + 0.5 * Math.sin(timeSec * 14 - i * 0.65)
      const harmonic = 0.5 + 0.5 * Math.cos(timeSec * 9.5 + i * 0.9)
      return Math.min(
        1,
        Math.max(0.08, centerWeight * (0.28 + mouthOpen * 0.68) * (0.45 + ripple * 0.35 + harmonic * 0.2)),
      )
    })

    return {
      mouthOpen,
      mouthWidth,
      smirk: 0.15,
      leftBrowLift,
      rightBrowLift,
      browLift: (leftBrowLift + rightBrowLift) / 2,
      blink,
      lookX,
      lookY,
      headYawDeg,
      headPitchDeg,
      headNod,
      headTiltDeg,
      lensGlint,
      waveBars,
    }
  }

  if (state === 'listening') {
    const attentive = Math.min(1, 0.32 + micEnergy * 0.65)
    const waveBars = Array.from({ length: 16 }, (_, i) => {
      const centerWeight = 1 - Math.abs(i - 6.5) / 8.5
      const shimmer = 0.5 + 0.5 * Math.sin(timeSec * 7.5 - i * 0.55)
      return Math.min(1, Math.max(0.06, centerWeight * (0.16 + micEnergy * 0.78) * (0.55 + shimmer * 0.45)))
    })
    return {
      mouthOpen: 0,
      mouthWidth: 0.98,
      smirk: 0.28 + micEnergy * 0.18,
      leftBrowLift: attentive * 0.68,
      rightBrowLift: attentive * 0.62,
      browLift: attentive * 0.65,
      blink,
      lookX: Math.sin(timeSec * 0.9) * 0.14,
      lookY: -0.06,
      headYawDeg: Math.sin(timeSec * 0.85) * 2.1,
      headPitchDeg: 1.2 + Math.sin(timeSec * 1.6) * 0.9,
      headNod: Math.sin(timeSec * 1.8) * 0.22,
      headTiltDeg: 1.8 + Math.sin(timeSec * 1.1) * 0.8,
      lensGlint: Math.sin(timeSec * 1.6) * 0.8,
      waveBars,
    }
  }

  if (state === 'thinking') {
    const scan = Math.sin(timeSec * 2.2)
    const waveBars = Array.from({ length: 16 }, (_, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(timeSec * 6.5 - i * 0.45)
      return 0.08 + pulse * 0.3
    })
    const leftBrowLift = 0.68 + 0.14 * Math.sin(timeSec * 2.6)
    const rightBrowLift = 0.16 + 0.08 * Math.cos(timeSec * 2.1)
    return {
      mouthOpen: 0,
      mouthWidth: 0.91,
      smirk: 0.08,
      leftBrowLift,
      rightBrowLift,
      browLift: (leftBrowLift + rightBrowLift) / 2,
      blink,
      lookX: 0.42 + scan * 0.36,
      lookY: -0.72 + Math.cos(timeSec * 1.7) * 0.12,
      headYawDeg: 3.4 + scan * 2.4,
      headPitchDeg: 4.2 + Math.sin(timeSec * 1.8) * 1.1,
      headNod: Math.sin(timeSec * 1.4) * 0.15,
      headTiltDeg: -2.4 + Math.sin(timeSec * 1.1) * 0.9,
      lensGlint: Math.sin(timeSec * 3.4),
      waveBars,
    }
  }

  // Continuous living idle motion: looking at screen, glancing right/left/up, micro-expressions
  const choreo = sampleIdleChoreography(timeSec)
  const microBreath = Math.sin(timeSec * 1.25)

  return {
    mouthOpen: 0,
    mouthWidth: 1,
    smirk: choreo.smirk,
    leftBrowLift: choreo.leftBrow,
    rightBrowLift: choreo.rightBrow,
    browLift: (choreo.leftBrow + choreo.rightBrow) / 2,
    blink,
    lookX: choreo.lookX,
    lookY: choreo.lookY,
    headYawDeg: choreo.yaw + Math.sin(timeSec * 0.65) * 0.8,
    headPitchDeg: choreo.pitch + microBreath * 0.55,
    headNod: microBreath * 0.14,
    headTiltDeg: choreo.tilt + Math.sin(timeSec * 0.55) * 0.45,
    lensGlint: choreo.lookX * 0.75 + Math.sin(timeSec * 0.9) * 0.25,
    waveBars: Array(16).fill(0.06),
  }
}

/**
 * Natural Egyptian Arabic & English conversational intent resolver for HAFIZ.
 */
export function resolveHafizIntent(rawInput: string): HafizIntentResult {
  const value = rawInput.trim().toLowerCase()
  if (!value) {
    return {
      route: null,
      replyAr: 'أنا سامعك يا فنان.. قولي تحب نبدأ بإيه النهارده؟',
      replyEn: 'I am right here. Tell me what you want to create today.',
    }
  }

  if (/تشكيل|diacritic|tashkeel|مظبوط/.test(value)) {
    return {
      route: 'studio/diacritics',
      replyAr: 'تمام، هفتحلك التشكيل بالعامية المصرية حالاً.',
      replyEn: 'Opening Egyptian Diacritics Studio for you right now.',
    }
  }
  if (/قاف|قوافي|rhyme|rewrite|صياغة/.test(value)) {
    return {
      route: 'studio/rhymes',
      replyAr: 'يلا بينا على القوافي وإعادة الصياغة.',
      replyEn: 'Opening Rhymes and Rewriter.',
    }
  }
  if (/أغنية|اغنية|اغاني|أغاني|song|compose|اكتب/.test(value)) {
    return {
      route: 'studio/songwriting',
      replyAr: 'حلو أوي! هفتحلك استوديو كتابة الأغاني المصرية دلوقتي.',
      replyEn: 'Great choice. Opening Egyptian Songwriting Studio now.',
    }
  }
  if (/كلمات|استوديو|lyrics|studio|editor|workspace/.test(value)) {
    return {
      route: 'studio/editor',
      replyAr: 'تمام يا فنان، داخلين على استوديو الكلمات حالاً.',
      replyEn: 'Opening Lyrics Studio for you.',
    }
  }
  if (/فصل|تراكات|ستيم|stem|demucs|roformer|separation/.test(value)) {
    return {
      route: 'voice_stems/separation',
      replyAr: 'جاهز، هفتحلك فصل التراكات الستة دلوقتي.',
      replyEn: 'Opening Six-Stem Separation workspace.',
    }
  }
  if (/استنساخ|clone|voice|صوتي/.test(value)) {
    return {
      route: 'voice_stems/clone',
      replyAr: 'تمام، هفتحلك استوديو استنساخ الصوت.',
      replyEn: 'Opening Voice Cloning Studio.',
    }
  }
  if (/يوتيوب|بحث|youtube|research|web/.test(value)) {
    return {
      route: 'audio/web',
      replyAr: 'هفتحلك يوتيوب والبحث دلوقتي.',
      replyEn: 'Opening YouTube and Web Research.',
    }
  }
  if (/تحليل|موسيقى|مزيكا|صوت|audio|music|analysis|transcri/.test(value)) {
    return {
      route: 'audio/analysis',
      replyAr: 'تمام، هفتحلك تحليل الصوت والموسيقى.',
      replyEn: 'Opening Music and Audio Analysis.',
    }
  }
  if (/موديل|نماذج|model|library/.test(value)) {
    return {
      route: 'setup/models',
      replyAr: 'هفتحلك مكتبة نماذج الذكاء الاصطناعي.',
      replyEn: 'Opening AI Model Library.',
    }
  }
  if (/تحميل|تنزيل|تثبيت|download|install/.test(value)) {
    return {
      route: 'setup/downloads',
      replyAr: 'هفتحلك مركز التحميل والتثبيت.',
      replyEn: 'Opening Downloads and Installation.',
    }
  }
  if (/إعدادات|اعدادات|setting|config|ضبط|gpu|vram|ذاكرة|كارت|تشخيص|diagnostic|orchestrator|منسق/.test(value)) {
    return {
      route: 'setup/general',
      replyAr: 'تمام، هفتحلك مركز الإعدادات والنظام.',
      replyEn: 'Opening Settings and System Center.',
    }
  }
  if (/مشاريع|محفوظ|project|history/.test(value)) {
    return {
      route: 'projects',
      replyAr: 'هفتحلك المشاريع والمحفوظات بتاعتك.',
      replyEn: 'Opening your Projects and History.',
    }
  }
  if (/الرئيسية|البداية|home|welcome|رجع/.test(value)) {
    return {
      route: 'welcome',
      replyAr: 'رجعنا للبداية يا فنان، أنا معاك هنا.',
      replyEn: 'Back to the HAFIZ startup hub.',
    }
  }

  return {
    route: null,
    replyAr: 'أهلاً بيك يا فنان! قولي تفتح استوديو الكلمات، التشكيل، تحليل الصوت، فصل التراكات، أو الإعدادات وأنا أفتحلك حالاً.',
    replyEn: 'I heard you! Ask me to open Lyrics Studio, Diacritics, Audio Analysis, Voice Cloning, Six-Stem Separation, or Settings.',
  }
}
