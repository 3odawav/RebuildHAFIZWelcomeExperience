import test from 'node:test'
import assert from 'node:assert/strict'
import { TRANSLATIONS, getTranslations } from './translations'

function collectLeafKeys(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj)) {
    return [`${prefix}[]#${obj.length}`]
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => collectLeafKeys(v, prefix ? `${prefix}.${k}` : k))
  }
  return [prefix]
}

test('ar-EG and en-US dictionaries have 100% matching key structure and non-empty labels', () => {
  const arKeys = collectLeafKeys(TRANSLATIONS.ar).sort()
  const enKeys = collectLeafKeys(TRANSLATIONS.en).sort()
  assert.deepEqual(arKeys, enKeys)

  assert.equal(getTranslations('ar').dir, 'rtl')
  assert.equal(getTranslations('ar').langCode, 'ar-EG')
  assert.equal(getTranslations('en').dir, 'ltr')
  assert.equal(getTranslations('en').langCode, 'en-US')

  // Spot check that Arabic UI actually contains Arabic script and no blank strings
  assert.match(TRANSLATIONS.ar.navLyricsStudio, /[\u0600-\u06FF]/)
  assert.match(TRANSLATIONS.ar.purgeVramBtn, /[\u0600-\u06FF]/)
  assert.match(TRANSLATIONS.ar.settingsTabs.gpuGuard, /[\u0600-\u06FF]/)
  assert.ok(TRANSLATIONS.en.purgeVramBtn.length > 5)
})

test('all screen titles and AI actions are translated in both languages', () => {
  for (const key of Object.keys(TRANSLATIONS.en.screenTitles)) {
    assert.ok(TRANSLATIONS.ar.screenTitles[key]?.trim(), `Missing Arabic screenTitle for ${key}`)
    assert.ok(TRANSLATIONS.en.screenTitles[key]?.trim(), `Missing English screenTitle for ${key}`)
  }
  for (const key of Object.keys(TRANSLATIONS.en.aiActions)) {
    assert.ok(TRANSLATIONS.ar.aiActions[key]?.trim(), `Missing Arabic aiAction for ${key}`)
    assert.ok(TRANSLATIONS.en.aiActions[key]?.trim(), `Missing English aiAction for ${key}`)
  }
})
