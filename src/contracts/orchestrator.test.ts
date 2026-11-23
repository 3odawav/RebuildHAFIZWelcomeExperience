import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACTION_CONTRACTS,
  MODEL_CATALOG,
  ORCHESTRATOR_STATES,
  TASK_ROUTING_TABLE,
  VERIFICATION_MATRIX,
  VOICE_LATENCY_STAGES,
  canTransitionOrchestrator,
  resolveRequiredRoutingRule,
} from './orchestrator'

test('orchestrator state machine includes all 14 required states and enforces valid lifecycle transitions', () => {
  assert.equal(ORCHESTRATOR_STATES.length, 14)
  assert.equal(canTransitionOrchestrator('IDLE', 'REQUESTED'), true)
  assert.equal(canTransitionOrchestrator('REQUESTED', 'CHECK_RESOURCES'), true)
  assert.equal(canTransitionOrchestrator('CHECK_RESOURCES', 'EXTERNAL_GPU_BUSY'), true)
  assert.equal(canTransitionOrchestrator('LOADING', 'READY'), true)
  assert.equal(canTransitionOrchestrator('READY', 'RUNNING'), true)
  assert.equal(canTransitionOrchestrator('RUNNING', 'IDLE_WARM'), true)
  assert.equal(canTransitionOrchestrator('IDLE_WARM', 'UNLOADING'), true)
  assert.equal(canTransitionOrchestrator('UNLOADING', 'RELEASED'), true)
  // Cannot jump straight from IDLE to RUNNING without checking resources/loading
  assert.equal(canTransitionOrchestrator('IDLE', 'RUNNING'), false)
})

test('task-aware routing avoids loading large LLM for settings and enforces Single-Model Lock on heavy audio', () => {
  const settingsRoute = resolveRequiredRoutingRule('setup/general')
  assert.equal(settingsRoute.reusesPrimaryLlm, false)
  assert.equal(settingsRoute.singleModelLock, false)

  const lyricsRoute = resolveRequiredRoutingRule('studio/songwriting')
  assert.equal(lyricsRoute.reusesPrimaryLlm, true)

  const stemsRoute = resolveRequiredRoutingRule('voice_stems/separation')
  assert.equal(stemsRoute.singleModelLock, true)
  assert.equal(stemsRoute.lazyInit, true)

  const cloneRoute = resolveRequiredRoutingRule('voice_stems/clone')
  assert.equal(cloneRoute.singleModelLock, true)
  assert.equal(cloneRoute.lazyInit, true)
})

test('every model catalog entry and backend action contract is complete and Turing-safe', () => {
  assert.ok(MODEL_CATALOG.length >= 6)
  for (const m of MODEL_CATALOG) {
    assert.ok(m.friendlyAr && m.friendlyEn && m.repo && m.license && m.relativePath)
  }

  assert.ok(ACTION_CONTRACTS.length >= 6)
  for (const c of ACTION_CONTRACTS) {
    assert.ok(c.id && c.labelAr && c.labelEn && c.endpoint && c.requiredService && c.inputSchema && c.outputSchema)
  }
})

test('voice latency stages and Windows-native checks never report fabricated PASS results', () => {
  assert.equal(VOICE_LATENCY_STAGES.length, 8)
  for (const stage of VOICE_LATENCY_STAGES) {
    assert.equal(stage.status, 'NOT TESTED')
    assert.equal(stage.measured, '—')
  }

  const nativeChecks = VERIFICATION_MATRIX.filter(v => v.scope === 'windows-native')
  assert.ok(nativeChecks.length >= 8)
  for (const item of nativeChecks) {
    assert.notEqual(item.status, 'PASS', `Native Windows check ${item.id} must not claim PASS in web preview`)
  }
  assert.ok(TASK_ROUTING_TABLE.length >= 7)
})
