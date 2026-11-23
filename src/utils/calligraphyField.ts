export type DiacriticKind =
  | 'fatha'
  | 'damma'
  | 'kasra'
  | 'shadda'
  | 'sukun'
  | 'tanween_fath'
  | 'tanween_damm'
  | 'tanween_kasr'
  | 'madda'
  | 'shadda_fatha'
  | 'shadda_damma'
  | 'shadda_kasra'
  | 'hamza'
  | 'alif_khanjariyya'

export const ALL_DIACRITIC_KINDS: readonly DiacriticKind[] = [
  'fatha',
  'damma',
  'kasra',
  'shadda',
  'sukun',
  'tanween_fath',
  'tanween_damm',
  'tanween_kasr',
  'madda',
  'shadda_fatha',
  'shadda_damma',
  'shadda_kasra',
  'hamza',
  'alif_khanjariyya',
] as const

export interface CalligraphyGlyph {
  id: string
  text: string
  /** Horizontal position in percent (0..100) */
  x: number
  /** Vertical position in percent (0..100) */
  y: number
  /** Base font size in px */
  size: number
  /** Initial rotation in degrees */
  rotate: number
  /** Depth tier: 0 = deep watermark, 1 = mid, 2 = crisp subtle accent */
  depth: 0 | 1 | 2
  /** Color hex in the #0a1521 muted slate-navy palette */
  color: string
  /** Opacity 0..1 */
  opacity: number
  /** Animation duration in seconds */
  duration: number
  /** Negative animation delay in seconds for immediate distributed motion */
  delay: number
  /** Drift variant */
  drift: 'a' | 'b'
}

export interface FloatingDiacritic {
  id: string
  kind: DiacriticKind
  x: number
  y: number
  size: number
  rotate: number
  color: string
  opacity: number
  duration: number
  delay: number
}

/**
 * Muted slate-navy shades anchored to the user's #0a1521 tab/card swatch,
 * stepped gently so Ruqaa calligraphy and diacritics read clearly on #050b13
 * without competing with foreground UI or neon accents.
 */
export const CALLIGRAPHY_PALETTE = {
  deep: '#0f1f31',
  mid: '#152b42',
  light: '#1d3957',
  tashkeel: '#214264',
} as const

/**
 * Curated classical Arabic letters with authentic Egyptian/Arabic diacritics
 * arranged around the dark navy canvas while keeping the center character stage uncluttered.
 */
const GLYPH_SEEDS: ReadonlyArray<{
  text: string
  x: number
  y: number
  size: number
  rotate: number
  depth: 0 | 1 | 2
}> = [
  // Upper-left & left perimeter
  { text: 'حَ', x: 5, y: 10, size: 112, rotate: -11, depth: 1 },
  { text: 'قَ', x: 16, y: 6, size: 78, rotate: 8, depth: 2 },
  { text: 'عِ', x: 27, y: 12, size: 68, rotate: -6, depth: 0 },
  { text: 'نُ', x: 3, y: 31, size: 96, rotate: 9, depth: 0 },
  { text: 'شِ', x: 21, y: 26, size: 74, rotate: -14, depth: 2 },
  { text: 'غَ', x: 9, y: 50, size: 118, rotate: -7, depth: 1 },
  { text: 'ضُ', x: 26, y: 44, size: 64, rotate: 12, depth: 0 },
  { text: 'صَ', x: 4, y: 71, size: 102, rotate: 7, depth: 1 },
  { text: 'فِ', x: 19, y: 67, size: 72, rotate: -10, depth: 2 },
  { text: 'كِ', x: 11, y: 87, size: 92, rotate: -9, depth: 1 },
  { text: 'لَ', x: 28, y: 83, size: 80, rotate: 11, depth: 2 },

  // Upper-right & right perimeter
  { text: 'مُ', x: 74, y: 9, size: 88, rotate: 10, depth: 1 },
  { text: 'ظَ', x: 87, y: 7, size: 106, rotate: -8, depth: 0 },
  { text: 'وُ', x: 94, y: 24, size: 84, rotate: 14, depth: 2 },
  { text: 'هَ', x: 78, y: 27, size: 76, rotate: -12, depth: 1 },
  { text: 'سَ', x: 91, y: 46, size: 114, rotate: -6, depth: 1 },
  { text: 'يَ', x: 73, y: 48, size: 70, rotate: 9, depth: 0 },
  { text: 'رَ', x: 86, y: 66, size: 94, rotate: -13, depth: 2 },
  { text: 'طَ', x: 95, y: 81, size: 108, rotate: 6, depth: 0 },
  { text: 'ذِ', x: 75, y: 78, size: 78, rotate: -9, depth: 1 },
  { text: 'أَ', x: 83, y: 92, size: 82, rotate: 8, depth: 2 },

  // Soft top & bottom bridge accents (respecting central focal area)
  { text: 'بِ', x: 39, y: 7, size: 66, rotate: -8, depth: 1 },
  { text: 'تُ', x: 61, y: 6, size: 70, rotate: 11, depth: 1 },
  { text: 'دَ', x: 40, y: 89, size: 86, rotate: -7, depth: 1 },
  { text: 'زِ', x: 60, y: 91, size: 76, rotate: 12, depth: 2 },
  { text: 'جَ', x: 50, y: 95, size: 90, rotate: -5, depth: 0 },
]

/**
 * Rich field of ALL classical Arabic diacritics (كل أنواع التشكيل)
 * filling the open dark-navy pockets across top, sides, inner corridors,
 * between cards, and lower spaces.
 */
const DIACRITIC_SEEDS: ReadonlyArray<{
  kind: DiacriticKind
  x: number
  y: number
  size: number
  rotate: number
  depth: 0 | 1 | 2
}> = [
  // Top horizon & empty upper pockets
  { kind: 'tanween_damm', x: 10, y: 4, size: 34, rotate: -8, depth: 2 },
  { kind: 'alif_khanjariyya', x: 22, y: 4, size: 28, rotate: 6, depth: 1 },
  { kind: 'shadda_fatha', x: 33, y: 5, size: 40, rotate: -9, depth: 2 },
  { kind: 'hamza', x: 45, y: 4, size: 30, rotate: 7, depth: 1 },
  { kind: 'fatha', x: 54, y: 5, size: 32, rotate: -10, depth: 2 },
  { kind: 'shadda_damma', x: 68, y: 5, size: 42, rotate: 8, depth: 2 },
  { kind: 'sukun', x: 80, y: 4, size: 26, rotate: 0, depth: 1 },
  { kind: 'madda', x: 93, y: 5, size: 44, rotate: -7, depth: 2 },

  // Upper-mid empty corridors (left & right of headline/brain)
  { kind: 'fatha', x: 12, y: 18, size: 36, rotate: -12, depth: 2 },
  { kind: 'damma', x: 24, y: 19, size: 34, rotate: 8, depth: 2 },
  { kind: 'shadda', x: 34, y: 15, size: 40, rotate: -7, depth: 2 },
  { kind: 'tanween_kasr', x: 42, y: 16, size: 34, rotate: 11, depth: 1 },
  { kind: 'hamza', x: 58, y: 16, size: 32, rotate: -9, depth: 1 },
  { kind: 'shadda_kasra', x: 66, y: 15, size: 40, rotate: 7, depth: 2 },
  { kind: 'madda', x: 81, y: 17, size: 48, rotate: -6, depth: 2 },
  { kind: 'tanween_fath', x: 91, y: 15, size: 36, rotate: 10, depth: 1 },

  // Left empty pockets (around & between left feature cards)
  { kind: 'sukun', x: 14, y: 28, size: 28, rotate: 0, depth: 1 },
  { kind: 'shadda_damma', x: 31, y: 25, size: 40, rotate: -10, depth: 2 },
  { kind: 'tanween_damm', x: 7, y: 39, size: 36, rotate: 12, depth: 2 },
  { kind: 'sukun', x: 16, y: 39, size: 28, rotate: 0, depth: 1 },
  { kind: 'hamza', x: 33, y: 35, size: 34, rotate: -8, depth: 2 },
  { kind: 'alif_khanjariyya', x: 29, y: 53, size: 30, rotate: 5, depth: 1 },
  { kind: 'tanween_fath', x: 6, y: 60, size: 38, rotate: -13, depth: 2 },
  { kind: 'madda', x: 24, y: 58, size: 46, rotate: 6, depth: 2 },
  { kind: 'shadda_fatha', x: 34, y: 63, size: 42, rotate: -6, depth: 2 },
  { kind: 'kasra', x: 15, y: 76, size: 34, rotate: -14, depth: 2 },
  { kind: 'damma', x: 33, y: 74, size: 34, rotate: 10, depth: 2 },
  { kind: 'tanween_kasr', x: 4, y: 84, size: 36, rotate: 8, depth: 1 },

  // Right empty pockets (around & between right feature cards)
  { kind: 'shadda_fatha', x: 69, y: 25, size: 42, rotate: 9, depth: 2 },
  { kind: 'alif_khanjariyya', x: 85, y: 26, size: 28, rotate: -5, depth: 1 },
  { kind: 'fatha', x: 90, y: 34, size: 36, rotate: 9, depth: 2 },
  { kind: 'sukun', x: 72, y: 37, size: 28, rotate: 0, depth: 1 },
  { kind: 'tanween_damm', x: 66, y: 42, size: 36, rotate: -11, depth: 2 },
  { kind: 'hamza', x: 82, y: 41, size: 32, rotate: 7, depth: 1 },
  { kind: 'tanween_fath', x: 82, y: 55, size: 38, rotate: -10, depth: 2 },
  { kind: 'shadda_kasra', x: 67, y: 57, size: 40, rotate: 8, depth: 2 },
  { kind: 'kasra', x: 94, y: 59, size: 34, rotate: 8, depth: 2 },
  { kind: 'damma', x: 68, y: 69, size: 36, rotate: -7, depth: 2 },
  { kind: 'madda', x: 79, y: 68, size: 44, rotate: 5, depth: 1 },
  { kind: 'shadda', x: 89, y: 75, size: 38, rotate: 11, depth: 2 },
  { kind: 'tanween_kasr', x: 96, y: 92, size: 34, rotate: -9, depth: 1 },

  // Subtle inner-halo & center-workspace pockets (low-contrast depth so they never fight character or text)
  { kind: 'fatha', x: 48, y: 12, size: 30, rotate: -8, depth: 1 },
  { kind: 'sukun', x: 39, y: 24, size: 24, rotate: 0, depth: 0 },
  { kind: 'damma', x: 61, y: 24, size: 26, rotate: 9, depth: 0 },
  { kind: 'kasra', x: 38, y: 52, size: 26, rotate: -12, depth: 0 },
  { kind: 'hamza', x: 62, y: 51, size: 26, rotate: 6, depth: 0 },
  { kind: 'alif_khanjariyya', x: 46, y: 77, size: 26, rotate: -4, depth: 1 },
  { kind: 'tanween_damm', x: 56, y: 78, size: 32, rotate: 8, depth: 1 },

  // Bottom open strip
  { kind: 'shadda_damma', x: 20, y: 92, size: 40, rotate: -7, depth: 2 },
  { kind: 'sukun', x: 35, y: 94, size: 28, rotate: 0, depth: 1 },
  { kind: 'madda', x: 51, y: 85, size: 44, rotate: 4, depth: 2 },
  { kind: 'tanween_fath', x: 66, y: 88, size: 36, rotate: -9, depth: 2 },
  { kind: 'shadda_kasra', x: 75, y: 94, size: 38, rotate: 7, depth: 1 },
  { kind: 'fatha', x: 90, y: 89, size: 32, rotate: -11, depth: 2 },
]

export function getCalligraphyGlyphs(): CalligraphyGlyph[] {
  return GLYPH_SEEDS.map((seed, index) => {
    const color =
      seed.depth === 0
        ? CALLIGRAPHY_PALETTE.deep
        : seed.depth === 1
          ? CALLIGRAPHY_PALETTE.mid
          : CALLIGRAPHY_PALETTE.light
    const opacity = seed.depth === 0 ? 0.72 : seed.depth === 1 ? 0.85 : 0.92
    const duration = 7.5 + (index % 6) * 1.1
    const delay = -((index * 1.35) % duration)

    return {
      id: `glyph-${index}`,
      ...seed,
      color,
      opacity,
      duration,
      delay,
      drift: index % 2 === 0 ? 'a' : 'b',
    }
  })
}

export function getFloatingDiacritics(): FloatingDiacritic[] {
  return DIACRITIC_SEEDS.map((seed, index) => {
    const color =
      seed.depth === 0
        ? CALLIGRAPHY_PALETTE.deep
        : seed.depth === 1
          ? CALLIGRAPHY_PALETTE.light
          : CALLIGRAPHY_PALETTE.tashkeel
    const opacity = seed.depth === 0 ? 0.58 : seed.depth === 1 ? 0.74 : 0.88
    const duration = 5.6 + (index % 6) * 0.85
    const delay = -((index * 1.1) % duration)

    return {
      id: `diacritic-${index}`,
      kind: seed.kind,
      x: seed.x,
      y: seed.y,
      size: seed.size,
      rotate: seed.rotate,
      color,
      opacity,
      duration,
      delay,
    }
  })
}
