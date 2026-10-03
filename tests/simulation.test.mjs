import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const exports = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/config/simulation.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports })
const { advanceSimulationDay, ORBIT_DEMO_SPEED, MAX_SIMULATION_SPEED, solarOverviewDistance } = exports

test('现实时间倍率与模拟日期一致，公转演示约 12 秒完成一年', () => {
  assert.equal(advanceSimulationDay(0, 1, 1), 1 / 86400)
  assert.equal(advanceSimulationDay(0, 1, 86400), 1)
  assert.equal(advanceSimulationDay(0, 1, ORBIT_DEMO_SPEED), 30)
  assert.ok(Math.abs(advanceSimulationDay(0, 365.256 / 30, ORBIT_DEMO_SPEED) - 365.256) < 1e-9)
  assert.equal(advanceSimulationDay(0, 1, MAX_SIMULATION_SPEED), 100)
})

test('公转速度在不同帧率下相同', () => {
  for (const fps of [30, 60, 120]) {
    let day = 0
    for (let i = 0; i < fps * 10; i++) day = advanceSimulationDay(day, 1 / fps, ORBIT_DEMO_SPEED)
    assert.ok(Math.abs(day - 300) < 1e-8)
  }
})

test('太阳取景在桌面与竖屏均容纳完整轨道包络', () => {
  for (const aspect of [1.5, 0.47, 1]) {
    const radius = 58.75
    const distance = solarOverviewDistance(radius, 45, aspect)
    const halfFov = Math.atan(Math.tan(45 * Math.PI / 360) * Math.min(aspect, 1))
    assert.ok(distance * Math.sin(halfFov) > radius)
    assert.ok(distance <= 600)
  }
})

test('切换天体保留用户的时间、速度、播放状态和轨道显示设置', async () => {
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const { createPinia, setActivePinia } = require('pinia')
  const storeExports = {}
  const bodies = Object.fromEntries(['earth', 'sun', 'moon'].map(id => [id, { defaultVariantId: 'color', variants: [{ id: 'color' }] }]))
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/stores/universe.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports: storeExports,
    require: id => id === '@/config/bodies' ? { bodyRegistry: { bodies }, DEFAULT_BODY_ID: 'earth' }
      : id === '@/config/lunarLandmarks' ? { lunarLandmarks: [] }
      : id === '@/config/simulation' ? exports : require(id),
  })
  setActivePinia(createPinia())
  const store = storeExports.useUniverseStore()
  for (const playing of [false, true]) {
    store.simulationSpeed = 3600
    store.isTimePlaying = playing
    store.simulationDay = 12345
    store.auxiliaryLinesVisible = false
    for (const id of ['sun', 'moon', 'earth']) {
      store.setSelection(id)
      assert.equal(store.simulationSpeed, 3600)
      assert.equal(store.isTimePlaying, playing)
      assert.equal(store.simulationDay, 12345)
      assert.equal(store.auxiliaryLinesVisible, false)
    }
  }
  store.simulationSpeed = ORBIT_DEMO_SPEED
  store.auxiliaryLinesVisible = true
  store.setSelection('sun')
  store.setSelection('earth')
  assert.equal(store.simulationSpeed, ORBIT_DEMO_SPEED)
  assert.equal(store.auxiliaryLinesVisible, true)
})
