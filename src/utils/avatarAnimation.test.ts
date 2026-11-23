import test from 'node:test'
import assert from 'node:assert/strict'
import { computeBlink, resolveHafizIntent, sampleAvatarPose, sampleIdleChoreography } from './avatarAnimation'

test('idle choreography continuously varies gaze (screen, right, up, left) and expressions', () => {
  const points = Array.from({ length: 16 }, (_, sec) => sampleIdleChoreography(sec))
  const minX = Math.min(...points.map(p => p.lookX))
  const maxX = Math.max(...points.map(p => p.lookX))
  const minY = Math.min(...points.map(p => p.lookY))
  const maxYaw = Math.max(...points.map(p => p.yaw))
  const minYaw = Math.min(...points.map(p => p.yaw))
  const maxSmirk = Math.max(...points.map(p => p.smirk))

  assert.ok(maxX > 0.6, `expected right glance in idle cycle, got ${maxX}`)
  assert.ok(minX < -0.6, `expected left glance in idle cycle, got ${minX}`)
  assert.ok(minY < -0.6, `expected upward look in idle cycle, got ${minY}`)
  assert.ok(maxYaw > 4 && minYaw < -4, 'expected gentle 3D left/right head turns')
  assert.ok(maxSmirk > 0.4, 'expected subtle facial expression during idle')
})

test('idle pose keeps mouth closed and blinks periodically', () => {
  const idlePose = sampleAvatarPose('idle', 1.2)
  assert.equal(idlePose.mouthOpen, 0)
  assert.equal(idlePose.waveBars.length, 16)
  assert.equal(computeBlink(1.2), 0)
  assert.ok(computeBlink(3.71) > 0.7, 'blink should peak inside the blink window')
})

test('thinking pose looks upward with asymmetric raised eyebrow and thoughtful tilt', () => {
  const thinkPose = sampleAvatarPose('thinking', 2.4)
  assert.equal(thinkPose.mouthOpen, 0)
  assert.ok(thinkPose.lookY < -0.5, 'thinking pose should glance upward')
  assert.ok(thinkPose.leftBrowLift > thinkPose.rightBrowLift + 0.3, 'thinking pose should cock one eyebrow')
  assert.ok(thinkPose.headPitchDeg > 2.5, 'thinking pose should pitch head slightly up')
})

test('speaking pose drives realistic mouth opening, eyebrows, head nod, and energetic waveforms', () => {
  const samples = Array.from({ length: 40 }, (_, i) =>
    sampleAvatarPose('speaking', i * 0.09, { speechImpulse: i % 5 === 0 ? 0.8 : 0.1 }),
  )
  const maxMouth = Math.max(...samples.map(s => s.mouthOpen))
  const minMouth = Math.min(...samples.map(s => s.mouthOpen))
  const maxBrow = Math.max(...samples.map(s => s.browLift))
  const maxWave = Math.max(...samples.flatMap(s => s.waveBars))

  assert.ok(maxMouth > 0.55, `expected clear mouth opening peak, got ${maxMouth}`)
  assert.ok(maxMouth - minMouth > 0.35, 'mouth should articulate dynamically across syllables')
  assert.ok(maxBrow > 0.45, 'eyebrows should raise expressively during speech')
  assert.ok(maxWave > 0.5, 'side waveforms should pulse strongly while speaking')
})

test('listening pose keeps lips closed while lifting eyebrows and reacting to mic energy', () => {
  const quiet = sampleAvatarPose('listening', 2.0, { micEnergy: 0.05 })
  const loud = sampleAvatarPose('listening', 2.0, { micEnergy: 0.9 })
  assert.equal(quiet.mouthOpen, 0)
  assert.equal(loud.mouthOpen, 0)
  assert.ok(loud.browLift > quiet.browLift, 'eyebrows should respond attentively to voice energy')
  const loudAvg = loud.waveBars.reduce((a, b) => a + b, 0) / loud.waveBars.length
  const quietAvg = quiet.waveBars.reduce((a, b) => a + b, 0) / quiet.waveBars.length
  assert.ok(loudAvg > quietAvg, 'side waveforms should respond to mic energy')
})

test('resolveHafizIntent routes Egyptian Arabic and English requests to the right workspace', () => {
  assert.equal(resolveHafizIntent('عاوز اكتب أغنية جديدة').route, 'studio/songwriting')
  assert.equal(resolveHafizIntent('افتح التشكيل بالعامية').route, 'studio/diacritics')
  assert.equal(resolveHafizIntent('فصل تراكات').route, 'voice_stems/separation')
  assert.equal(resolveHafizIntent('Open settings center').route, 'setup/general')
  assert.equal(resolveHafizIntent('استنساخ الصوت').route, 'voice_stems/clone')
  assert.equal(resolveHafizIntent('تحليل الصوت والموسيقى').route, 'audio/analysis')
  assert.equal(resolveHafizIntent('مرحبا يا حافظ').route, null)
})
