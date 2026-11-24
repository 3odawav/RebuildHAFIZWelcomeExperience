import {
  getCalligraphyGlyphs,
  getFloatingDiacritics,
  type DiacriticKind,
} from '../utils/calligraphyField'

const GLYPHS = getCalligraphyGlyphs()
const DIACRITICS = getFloatingDiacritics()

/**
 * Hand-crafted calligraphic reed-pen (قلم الخط العربي) diacritic paths
 * covering all classical Arabic tashkeel marks so standalone floating marks
 * render authentically without Unicode dotted-circle placeholders.
 */
function DiacriticMark({ kind, color, size }: { kind: DiacriticKind; color: string; size: number }) {
  const paths: Record<DiacriticKind, string> = {
    // فتحة — slanted reed-pen fatha stroke
    fatha: 'M8 31 C19 24 35 16 52 11 L55 17 C38 23 22 30 11 37 Z',
    // ضمة — classic calligraphic damma with tapered tail
    damma:
      'M32 10 C40 10 45 16 44 23 C43 32 33 41 18 46 L16 41 C27 37 35 30 37 23 C33 25 27 25 24 21 C21 17 25 10 32 10 Z M32 15 C29 15 28 18 30 19 C32 21 37 19 37 17 C37 15 35 15 32 15 Z',
    // كسرة — slanted reed-pen kasra stroke
    kasra: 'M10 34 C22 27 36 20 50 15 L53 20 C39 26 25 33 13 39 Z',
    // شدة — calligraphic shadda (w-shaped twin cusp)
    shadda:
      'M9 32 C11 22 16 18 21 21 C24 23 25 28 27 29 C30 28 32 19 38 19 C43 19 47 25 49 31 L44 34 C42 29 40 25 37 25 C34 25 32 34 27 36 C22 36 20 28 18 26 C16 25 15 29 14 34 Z',
    // سكون — Ruqaa sukun (open calligraphic circle)
    sukun:
      'M30 11 C40 11 46 18 46 27 C46 36 39 43 29 43 C20 43 14 36 14 27 C14 19 20 11 30 11 Z M30 17 C24 17 20 22 20 27 C20 33 24 37 29 37 C35 37 40 33 40 27 C40 21 35 17 30 17 Z',
    // تنوين بالفتح — twin parallel upper strokes
    tanween_fath:
      'M9 22 C21 16 36 10 51 6 L53 11 C38 16 23 22 11 27 Z M11 35 C23 29 38 23 53 19 L55 24 C40 29 25 35 13 40 Z',
    // تنوين بالضم — calligraphic twin dammatan (ضمتين متعانقتين)
    tanween_damm:
      'M26 14 C33 14 37 19 36 25 C35 33 26 40 13 45 L11 40 C21 37 28 31 29 25 C26 27 21 27 19 23 C17 19 20 14 26 14 Z M26 18 C24 18 23 20 24 21 C26 22 30 21 30 19 C30 18 28 18 26 18 Z M42 8 C49 8 53 14 51 22 C49 30 41 37 30 41 L28 37 C37 33 44 27 45 21 C44 16 40 13 36 14 L35 10 C37 9 40 8 42 8 Z',
    // تنوين بالكسر — twin parallel lower strokes slightly offset
    tanween_kasr:
      'M10 26 C22 20 36 14 50 10 L52 15 C38 20 24 26 12 31 Z M13 39 C25 33 39 27 53 23 L55 28 C41 33 27 39 15 44 Z',
    // مدة — graceful calligraphic madda wave
    madda:
      'M6 30 C14 16 25 15 34 23 C41 29 48 27 56 16 L59 21 C50 34 40 36 31 28 C24 22 17 23 10 34 Z',
    // شدة وفتحة — shadda crowned with slanted fatha above
    shadda_fatha:
      'M15 16 C25 11 37 6 49 3 L51 8 C39 12 27 16 17 21 Z M11 41 C13 31 18 27 23 30 C26 32 27 36 29 37 C32 36 34 28 40 28 C45 28 49 33 51 39 L46 42 C44 37 42 34 39 34 C36 34 34 42 29 44 C24 44 22 36 20 34 C18 33 17 37 16 42 Z',
    // شدة وضمة — shadda crowned with damma above
    shadda_damma:
      'M33 3 C39 3 43 7 42 13 C41 19 34 24 23 27 L21 23 C29 21 35 17 36 12 C33 13 29 13 27 10 C25 7 28 3 33 3 Z M33 7 C31 7 30 9 31 10 C33 11 36 10 36 8 C36 7 35 7 33 7 Z M11 44 C13 35 18 31 23 34 C26 36 27 40 29 41 C32 40 34 32 40 32 C45 32 49 37 51 43 L46 46 C44 41 42 38 39 38 C36 38 34 46 29 48 C24 48 22 40 20 38 C18 37 17 41 16 46 Z',
    // شدة وكسرة — shadda with kasra underneath
    shadda_kasra:
      'M11 26 C13 17 18 13 23 16 C26 18 27 22 29 23 C32 22 34 14 40 14 C45 14 49 19 51 25 L46 28 C44 23 42 20 39 20 C36 20 34 28 29 30 C24 30 22 22 20 20 C18 19 17 23 16 28 Z M14 44 C25 39 37 34 49 30 L51 35 C39 39 27 44 16 49 Z',
    // همزة — classic calligraphic standalone hamza (ء)
    hamza:
      'M39 11 C31 10 23 14 21 21 C20 26 24 30 30 30 C35 30 41 28 46 25 L47 30 C38 36 25 40 14 43 L12 37 C20 35 28 33 34 30 C26 33 17 30 15 22 C13 13 22 5 35 5 C39 5 43 6 45 8 Z',
    // ألف خنجرية — slender vertical calligraphic dagger alif (ـٰ)
    alif_khanjariyya:
      'M31 6 C35 14 36 28 34 46 L27 44 C29 29 28 17 25 9 Z',
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 54"
      fill={color}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path d={paths[kind]} />
    </svg>
  )
}

export function CalligraphyBackground({
  reduceMotion = false,
  light = false,
}: {
  reduceMotion?: boolean
  light?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      data-testid="calligraphy-background"
      dir="rtl"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden select-none ${light ? 'opacity-25' : ''}`}
    >
      {/* Floating Arabic Ruqaa letters with authentic diacritics */}
      {GLYPHS.map(glyph => (
        <span
          key={glyph.id}
          lang="ar"
          className={`absolute leading-none ${
            reduceMotion ? '' : glyph.drift === 'a' ? 'calligraphy-drift-a' : 'calligraphy-drift-b'
          }`}
          style={
            {
              left: `${glyph.x}%`,
              top: `${glyph.y}%`,
              fontSize: `${glyph.size}px`,
              fontFamily: "'Aref Ruqaa', serif",
              fontWeight: glyph.depth === 0 ? 700 : 400,
              color: light ? '#2b5485' : glyph.color,
              opacity: light ? Math.min(0.28, glyph.opacity) : glyph.opacity,
              transform: reduceMotion ? `translate(-50%, -50%) rotate(${glyph.rotate}deg)` : undefined,
              '--rot': `${glyph.rotate}deg`,
              '--dur': `${glyph.duration}s`,
              '--delay': `${glyph.delay}s`,
              textShadow: light ? 'none' : '0 2px 14px rgba(10, 21, 33, 0.55)',
            } as React.CSSProperties
          }
        >
          {glyph.text}
        </span>
      ))}

      {/* Standalone floating calligraphic diacritic marks (كل أنواع التشكيل) */}
      {DIACRITICS.map(mark => (
        <span
          key={mark.id}
          className={`absolute ${reduceMotion ? '' : 'calligraphy-tashkeel'}`}
          style={
            {
              left: `${mark.x}%`,
              top: `${mark.y}%`,
              opacity: light ? Math.min(0.26, mark.opacity) : mark.opacity,
              transform: reduceMotion ? `translate(-50%, -50%) rotate(${mark.rotate}deg)` : undefined,
              '--rot': `${mark.rotate}deg`,
              '--dur': `${mark.duration}s`,
              '--delay': `${mark.delay}s`,
            } as React.CSSProperties
          }
        >
          <DiacriticMark kind={mark.kind} color={light ? '#2b5485' : mark.color} size={mark.size} />
        </span>
      ))}
    </div>
  )
}
