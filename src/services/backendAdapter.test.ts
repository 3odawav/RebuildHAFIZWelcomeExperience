import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BACKEND_CONNECTION_STATES,
  HafizBackendAdapter,
  canTransitionBackendState,
} from './backendAdapter'

test('backend connection state machine covers all 6 required states and valid transitions', () => {
  assert.deepEqual(BACKEND_CONNECTION_STATES, [
    'DISCONNECTED',
    'CONNECTING',
    'READY',
    'BUSY',
    'ERROR',
    'RECOVERING',
  ])
  assert.equal(canTransitionBackendState('DISCONNECTED', 'CONNECTING'), true)
  assert.equal(canTransitionBackendState('CONNECTING', 'READY'), true)
  assert.equal(canTransitionBackendState('READY', 'BUSY'), true)
  assert.equal(canTransitionBackendState('ERROR', 'RECOVERING'), true)
  assert.equal(canTransitionBackendState('DISCONNECTED', 'BUSY'), false)
})

test('HafizBackendAdapter truthfully reports BACKEND_NOT_CONNECTED when local daemon is unreachable', async () => {
  const failingFetch: typeof fetch = async () => {
    throw new TypeError('fetch failed: ECONNREFUSED')
  }
  const adapter = new HafizBackendAdapter('http://127.0.0.1:4891', failingFetch)
  assert.equal(adapter.getState(), 'DISCONNECTED')

  const health = await adapter.probeHealth()
  assert.equal(health.ok, false)
  assert.equal(health.code, 'BACKEND_NOT_CONNECTED')
  assert.equal(health.connectionState, 'DISCONNECTED')

  const scan = await adapter.scanPartitions({
    partitions: ['E:\\', 'D:\\'],
    inPlaceLinking: true,
    indexSavePath: 'E:\\HAFIZ_In_Slang\\data\\model-index.json',
  })
  assert.equal(scan.ok, false)
  assert.equal(scan.code, 'BACKEND_NOT_CONNECTED')
  assert.equal(scan.connectionState, 'DISCONNECTED')
})

test('HafizBackendAdapter rejects empty partition scan requests before network call', async () => {
  let called = false
  const spyFetch: typeof fetch = async () => {
    called = true
    return new Response('{}')
  }
  const adapter = new HafizBackendAdapter('http://127.0.0.1:4891', spyFetch)
  const res = await adapter.scanPartitions({
    partitions: [],
    inPlaceLinking: true,
    indexSavePath: 'E:\\HAFIZ_In_Slang\\data\\model-index.json',
  })
  assert.equal(called, false)
  assert.equal(res.ok, false)
  assert.equal(res.code, 'INVALID_INPUT')
})

test('HafizBackendAdapter transitions to READY when a real local backend responds', async () => {
  const okFetch: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        serviceVersion: '1.0.0',
        gpuName: 'NVIDIA Quadro RTX 5000',
        vramUsedMb: 1200,
        vramTotalMb: 16384,
        activeWorkers: 1,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  const adapter = new HafizBackendAdapter('http://127.0.0.1:4891', okFetch)
  const res = await adapter.probeHealth()
  assert.equal(res.ok, true)
  assert.equal(res.connectionState, 'READY')
  assert.equal(res.data?.gpuName, 'NVIDIA Quadro RTX 5000')
})
