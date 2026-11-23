import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALL_DIACRITIC_KINDS,
  CALLIGRAPHY_PALETTE,
  getCalligraphyGlyphs,
  getFloatingDiacritics,
} from './calligraphyField'

const ARABIC_DIACRITIC_RE = /[\u064B-\u065F\u0670]/
const ARABIC_LETTER_RE = /[\u0621-\u064A]/

test('every Ruqaa calligraphy glyph has an Arabic letter paired with diacritics', () => {
  const glyphs = getCalligraphyGlyphs()
  assert.ok(glyphs.length >= 20, 'should provide rich ambient density')
  for (const glyph of glyphs) {
    assert.match(glyph.text, ARABIC_LETTER_RE, `${glyph.id} should contain an Arabic letter`)
    assert.match(glyph.text, ARABIC_DIACRITIC_RE, `${glyph.id} should contain an Arabic diacritic`)
    assert.ok(glyph.x >= 0 && glyph.x <= 100, `${glyph.id} x in bounds`)
    assert.ok(glyph.y >= 0 && glyph.y <= 100, `${glyph.id} y in bounds`)
    assert.ok(glyph.duration > 0, `${glyph.id} has positive animation duration`)
  }
})

test('glyphs leave the central character focal zone uncluttered', () => {
  const glyphs = getCalligraphyGlyphs()
  const overlappingCenter = glyphs.filter(
    g => g.x > 33 && g.x < 67 && g.y > 22 && g.y < 76,
  )
  assert.equal(overlappingCenter.length, 0, 'no large glyph should crowd the center portrait area')
})

test('floating diacritics cover all 14 classical Arabic tashkeel types across all quadrants', () => {
  const diacritics = getFloatingDiacritics()
  assert.ok(diacritics.length >= 50, 'should generously populate open background pockets')
  const kinds = new Set(diacritics.map(d => d.kind))
  for (const kind of ALL_DIACRITIC_KINDS) {
    assert.ok(kinds.has(kind), `missing diacritic kind: ${kind}`)
  }

  // Verify coverage across all 4 quadrants of the canvas
  const q1 = diacritics.filter(d => d.x < 50 && d.y < 50).length
  const q2 = diacritics.filter(d => d.x >= 50 && d.y < 50).length
  const q3 = diacritics.filter(d => d.x < 50 && d.y >= 50).length
  const q4 = diacritics.filter(d => d.x >= 50 && d.y >= 50).length
  assert.ok(q1 >= 10 && q2 >= 10 && q3 >= 10 && q4 >= 10, `expected balanced quadrants, got ${q1}/${q2}/${q3}/${q4}`)
})

test('all colors stay inside the muted slate-navy palette derived from #0a1521', () => {
  const allowed = new Set<string>(Object.values(CALLIGRAPHY_PALETTE))
  for (const glyph of getCalligraphyGlyphs()) {
    assert.ok(allowed.has(glyph.color), `unexpected glyph color ${glyph.color}`)
  }
  for (const mark of getFloatingDiacritics()) {
    assert.ok(allowed.has(mark.color), `unexpected diacritic color ${mark.color}`)
  }
})
