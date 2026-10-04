import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as THREE from 'three'

// 使用项目已有的 TypeScript 编译器，无需额外测试依赖。
const modules = new Map()
let now = 0
function load(name) {
  if (modules.has(name)) return modules.get(name)
  const exports = {}
  const source = fs.readFileSync(new URL(`../src/animation/${name}.ts`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, {
    exports, performance: { now: () => now },
    require: (id) => id === 'three' ? THREE : load(id.replace('./', '')),
  })
  modules.set(name, exports)
  return exports
}
const { Motion } = load('Motion')
const { CameraMotion } = load('CameraMotion')
const { easing, cubicBezier } = load('easing')

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`)

test('缓动曲线保持端点、单调性，贝塞尔支持自定义控制点', () => {
  for (const curve of [...Object.values(easing), cubicBezier(0.42, 0, 0.2, 1)]) {
    near(curve(0), 0); near(curve(1), 1)
    let previous = 0
    for (let i = 1; i <= 100; i++) {
      const value = curve(i / 100)
      assert.ok(value >= previous && value <= 1)
      previous = value
    }
  }
  near(cubicBezier(0, 0, 1, 1)(0.37), 0.37)
  assert.throws(() => cubicBezier(-1, 0, 1, 1))
})

test('动画按时间完成，与帧率无关；通道覆盖与取消不执行旧回调', () => {
  now = 0
  const motion = new Motion()
  let value = 0, completions = 0
  motion.start('a', (t) => { value = t }, { duration: 100, complete: () => completions++ })
  motion.update(50); near(value, 0.5)
  motion.start('a', (t) => { value = 10 + t }, { duration: 100 })
  motion.update(100); near(value, 11); assert.equal(completions, 0)
  motion.start('a', () => { throw Error('cancelled callback') })
  motion.cancel('a'); motion.update(200)
  motion.start('b', (t) => { value = t }, { immediate: true, complete: () => completions++ })
  near(value, 1); assert.equal(completions, 1); assert.equal(motion.has('b'), false)
})

test('相机沿球面圆弧转向对侧，不穿过地球，并准确到达移动目标', () => {
  now = 0
  const motion = new Motion(), camera = new THREE.PerspectiveCamera()
  const target = new THREE.Vector3()
  camera.position.set(0, 0, 8)
  const cameraMotion = new CameraMotion(motion, camera, target)
  const destination = new THREE.Vector3()
  cameraMotion.move(() => ({ target: destination.clone(), offset: new THREE.Vector3(0, 0, -8) }), { duration: 100 })
  for (let i = 0; i <= 100; i++) {
    destination.x = i / 100
    motion.update(i)
    near(camera.position.distanceTo(target), 8)
    assert.ok(Number.isFinite(camera.position.x))
  }
  assert.ok(target.distanceTo(destination) < 1e-6)
  assert.ok(camera.position.distanceTo(new THREE.Vector3(1, 0, -8)) < 1e-6)
})

test('快速切换从当前相机位置开始，取消后允许接管，减少动态效果立即完成', () => {
  now = 0
  const motion = new Motion(), camera = new THREE.PerspectiveCamera()
  const target = new THREE.Vector3()
  camera.position.set(0, 0, 10)
  const cameraMotion = new CameraMotion(motion, camera, target)
  const pose = { target: new THREE.Vector3(50, 0, 0), offset: new THREE.Vector3(0, 0, 8) }
  cameraMotion.move(() => pose, { duration: 100 })
  motion.update(40); now = 40
  const before = camera.position.clone(), beforeTarget = target.clone()
  cameraMotion.move(() => ({ target: new THREE.Vector3(-20, 0, 0), offset: new THREE.Vector3(0, 0, 5) }))
  motion.update(40)
  assert.ok(camera.position.distanceTo(before) < 1e-6)
  assert.ok(target.distanceTo(beforeTarget) < 1e-6)
  cameraMotion.cancel(); motion.update(1000)
  assert.ok(camera.position.distanceTo(before) < 1e-6)
  cameraMotion.move(() => pose, { immediate: true })
  assert.ok(camera.position.distanceTo(new THREE.Vector3(50, 0, 8)) < 1e-6)
  assert.equal(cameraMotion.destinationDistance, null)
})

const { createTransitionPath } = load('paths')

for (const algorithm of ['bezier', 'chaikin']) {
  test(`${algorithm} 路径端点准确、推进单调，并保留快速切换与移动目标`, () => {
    const path = createTransitionPath({ algorithm, chaikinIterations: 4 })
    near(path(0).progress, 0); near(path(0).lift, 0)
    near(path(1).progress, 1); near(path(1).lift, 0)
    let previous = 0
    for (let i = 0; i <= 100; i++) {
      const sample = path(i / 100)
      assert.ok(sample.progress >= previous && sample.progress <= 1)
      assert.ok(sample.lift >= 0 && sample.lift <= 1)
      previous = sample.progress
    }
    now = 0
    const motion = new Motion(), camera = new THREE.PerspectiveCamera()
    const target = new THREE.Vector3()
    camera.position.set(0, 0, 8)
    const cameraMotion = new CameraMotion(motion, camera, target)
    const destination = new THREE.Vector3()
    cameraMotion.move(() => ({ target: destination.clone(), offset: new THREE.Vector3(0, 0, -8) }), { algorithm, duration: 100 })
    for (let i = 0; i <= 100; i++) {
      destination.x = i / 100
      motion.update(i)
      near(camera.position.distanceTo(target), 8)
    }
    assert.ok(camera.position.distanceTo(new THREE.Vector3(1, 0, -8)) < 1e-6)
    now = 100
    cameraMotion.move(() => ({ target: new THREE.Vector3(10, 0, 0), offset: new THREE.Vector3(0, 0, 6) }), { algorithm, duration: 100 })
    motion.update(150); now = 150
    const before = camera.position.clone()
    cameraMotion.move(() => ({ target: new THREE.Vector3(), offset: new THREE.Vector3(0, 0, 10) }), { algorithm })
    motion.update(150)
    assert.ok(camera.position.distanceTo(before) < 1e-6)
  })
}

test('Chaikin 切角次数受限，配置可切换且算法产生不同的中途路径', () => {
  const bezier = createTransitionPath({ algorithm: 'bezier' })
  const chaikin = createTransitionPath({ algorithm: 'chaikin' })
  assert.ok(Math.abs(bezier(0.5).lift - chaikin(0.5).lift) > 0.01)
  for (const count of [1, 6, -1, 100, Infinity, NaN]) {
    const path = createTransitionPath({ algorithm: 'chaikin', chaikinIterations: count })
    assert.ok(Number.isFinite(path(0.35).progress))
    near(path(1).progress, 1)
  }
})

const { TimeRecovery } = load('TimeRecovery')

test('后台时间补偿使用平滑曲线，每种倍率都精确补齐且无重复累计', () => {
  for (const speed of [0.1, 1, 3600, 2592000, 8640000]) {
    const correction = 300 * speed / 86400
    const recovery = new TimeRecovery(correction, 1000, 900)
    near(recovery.step(1000), 0)
    let applied = 0
    for (let now = 1015; now <= 1900; now += 15) applied += recovery.step(now)
    assert.ok(Math.abs(applied - correction) < 1e-8)
    assert.equal(recovery.complete, true)
    near(recovery.step(2000), 0)
  }
})

test('补偿中再次置于后台，可将剩余量和新增后台时间一起恢复', () => {
  const first = new TimeRecovery(10, 0, 900)
  const applied = first.step(450)
  near(applied, 5)
  near(first.remaining, 5)
  const second = new TimeRecovery(first.remaining + 20, 1000, 900)
  near(second.step(1900), 25)
  near(applied + 25, 30)
  const paused = new TimeRecovery(0, 0)
  near(paused.step(900), 0)
})

test('场景动画在后台冻结，恢复后继续剩余进度', () => {
  now = 0
  const motion = new Motion()
  let value = 0
  motion.start('camera', t => { value = t }, { duration: 100 })
  motion.update(50); near(value, 0.5)
  motion.resumeAfterPause(50, 5050)
  motion.update(5050); near(value, 0.5)
  motion.update(5100); near(value, 1)
})
