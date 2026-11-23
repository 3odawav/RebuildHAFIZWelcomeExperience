import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_STORAGE_CONFIG,
  addScanPartition,
  getExecutionProfileDefaults,
  normalizeWindowsPath,
  removeScanPartition,
  resolveEffectiveModelPath,
} from './storageConfig'

test('normalizeWindowsPath normalizes drive roots and subdirectories cleanly', () => {
  assert.equal(normalizeWindowsPath('e:'), 'E:\\')
  assert.equal(normalizeWindowsPath('d:/'), 'D:\\')
  assert.equal(normalizeWindowsPath('e:\\HAFIZ_Models\\'), 'E:\\HAFIZ_Models')
  assert.equal(normalizeWindowsPath('d:/AI//Weights///'), 'D:\\AI\\Weights')
  assert.equal(normalizeWindowsPath('   '), '')
})

test('addScanPartition and removeScanPartition prevent duplicates case-insensitively', () => {
  const base = ['E:\\', 'D:\\']
  assert.deepEqual(addScanPartition(base, 'e:'), ['E:\\', 'D:\\'])
  assert.deepEqual(addScanPartition(base, 'd:/AI_Models/'), ['E:\\', 'D:\\', 'D:\\AI_Models'])
  assert.deepEqual(removeScanPartition(['E:\\', 'D:\\', 'F:\\'], 'd:'), ['E:\\', 'F:\\'])
})

test('resolveEffectiveModelPath prefers manual in-place override without moving files', () => {
  const autoRes = resolveEffectiveModelPath(
    'primary-llm',
    'llm\\qwen2.5-14b-instruct-q4_k_m.gguf',
    'E:\\HAFIZ_Models',
    {},
  )
  assert.equal(autoRes.isManualOverride, false)
  assert.equal(autoRes.path, 'E:\\HAFIZ_Models\\llm\\qwen2.5-14b-instruct-q4_k_m.gguf')

  const manualRes = resolveEffectiveModelPath(
    'primary-llm',
    'llm\\qwen2.5-14b-instruct-q4_k_m.gguf',
    'E:\\HAFIZ_Models',
    { 'primary-llm': 'd:/LMStudio/qwen2.5-14b.gguf' },
  )
  assert.equal(manualRes.isManualOverride, true)
  assert.equal(manualRes.path, 'D:\\LMStudio\\qwen2.5-14b.gguf')
})

test('default storage config targets drive E with multi-partition E and D in-place scanning', () => {
  assert.equal(DEFAULT_STORAGE_CONFIG.appInstallDir, 'E:\\HAFIZ_In_Slang')
  assert.equal(DEFAULT_STORAGE_CONFIG.modelDownloadDir, 'E:\\HAFIZ_Models')
  assert.deepEqual(DEFAULT_STORAGE_CONFIG.scanPartitions, ['E:\\', 'D:\\'])
  assert.equal(DEFAULT_STORAGE_CONFIG.inPlaceLinking, true)
})

test('execution profile presets map to safe RTX 5000 VRAM guard defaults', () => {
  const balanced = getExecutionProfileDefaults('balanced_rtx5000')
  const coexist = getExecutionProfileDefaults('low_vram_coexist')
  const fast = getExecutionProfileDefaults('max_speed')

  assert.equal(balanced.vramMarginGb, 2.0)
  assert.ok(coexist.vramMarginGb > balanced.vramMarginGb)
  assert.ok(fast.idleTimeoutSec > balanced.idleTimeoutSec)
  assert.equal(coexist.singleModelLock, true)
})
