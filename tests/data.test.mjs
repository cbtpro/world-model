import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import path from 'node:path'
import ts from 'typescript'
import * as THREE from 'three'
const modules = new Map()
function load(file) {
  if (modules.has(file)) return modules.get(file)
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(`../src/${file}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports, AbortController, structuredClone, setTimeout, clearTimeout,
    require: id => id === 'three' ? THREE : load(path.posix.normalize(path.posix.join(path.posix.dirname(file), id))),
  })
  modules.set(file, exports)
  return exports
}
const { DataLoader } = load('data/DataLoader')
const { MockSource } = load('data/sources/MockSource')
const { decodeSoftwareUsage } = load('data/softwareUsage/schema')
const { SoftwareUsageLayer } = load('three/layers/SoftwareUsageLayer')
const mock = JSON.parse(fs.readFileSync(new URL('../src/data/softwareUsage/mock.json', import.meta.url), 'utf8'))

test('全球 mock 可加载、可校验，数据源不暴露原始对象', async () => {
  const loader = new DataLoader(new MockSource(mock), decodeSoftwareUsage)
  const result = await loader.load()
  assert.equal(result.isMock, true)
  assert.equal(result.regions.length, 26)
  assert.ok(result.regions.some(row => row.latitude < 0))
  result.regions[0].activeUsers = 0
  assert.ok((await loader.load()).regions[0].activeUsers > 0)
})

test('拒绝非法坐标、重复 id、NaN、无效日期；接受空数据', () => {
  for (const mutate of [d => { d.regions[0].latitude = 91 }, d => { d.regions[0].activeUsers = NaN },
    d => { d.regions[1].id = d.regions[0].id }, d => { d.period = '2026-02-31' }]) {
    const copy = structuredClone(mock); mutate(copy)
    assert.throws(() => decodeSoftwareUsage(copy))
  }
  assert.equal(decodeSoftwareUsage({ ...mock, regions: [] }).regions.length, 0)
})

test('瞬时错误可重试；校验失败不重试', async () => {
  let calls = 0
  const loader = new DataLoader({ load: async () => { if (++calls === 1) throw Error('network'); return mock } }, decodeSoftwareUsage)
  assert.equal((await loader.load()).version, 1)
  assert.equal(calls, 2)
  calls = 0
  const invalid = new DataLoader({ load: async () => { calls++; return {} } }, decodeSoftwareUsage)
  await assert.rejects(invalid.load({ retries: 5 }), e => e.code === 'validation')
  assert.equal(calls, 1)
})

test('即使数据源忽略 signal，加载仍能超时或取消', async () => {
  const loader = new DataLoader({ load: () => new Promise(() => {}) }, decodeSoftwareUsage)
  await assert.rejects(loader.load({ timeoutMs: 10, retries: 0 }), e => e.code === 'timeout')
  const controller = new AbortController()
  const pending = loader.load({ signal: controller.signal, retries: 0 })
  controller.abort()
  await assert.rejects(pending, e => e.code === 'aborted')
  await assert.rejects(loader.load({ signal: controller.signal }), e => e.code === 'aborted')
})

test('热力覆盖贴合坐标、背面不可选择、刷新和销毁释放旧资源', () => {
  const earth = new THREE.Group(), layer = new SoftwareUsageLayer()
  earth.add(layer.group)
  const row = { id: 'front', city: 'Front', country: 'Mock', latitude: 0, longitude: 0, activeUsers: 100, sessions: 200 }
  const dataset = { ...mock, regions: [row] }
  layer.setData(dataset, 2)
  earth.updateMatrixWorld(true)
  const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 8), new THREE.Vector3(0, 0, -1))
  assert.equal(layer.pick(ray), 'front')
  let disposed = 0
  layer.group.children[0].geometry.addEventListener('dispose', () => { disposed++ })
  layer.setData({ ...dataset, regions: [{ ...row, id: 'back', longitude: 180 }] }, 2)
  assert.equal(disposed, 1)
  earth.updateMatrixWorld(true)
  assert.equal(layer.pick(ray), null)
  layer.setData({ ...dataset, regions: [] }, 2)
  assert.equal(layer.group.children.length, 0)
  layer.dispose()
  assert.equal(layer.group.parent, null)
})

const { decodeSimulation } = load('data/simulation/schema')
const { GeoRoutesLayer, routePosition } = load('three/layers/GeoRoutesLayer')
const simulationMock = JSON.parse(fs.readFileSync(new URL('../src/data/simulation/mock.json', import.meta.url), 'utf8'))

test('灾备与航线数据校验引用、唯一 id、坐标和动画时长', async () => {
  const result = await new DataLoader(new MockSource(simulationMock), decodeSimulation).load()
  assert.equal(result.network.nodes.length, 6)
  assert.equal(result.flights.routes.length, 3)
  for (const mutate of [d => { d.network.routes[0].to = 'missing' }, d => { d.flights.nodes[0].longitude = Infinity },
    d => { d.network.nodes[1].id = d.network.nodes[0].id }, d => { d.flights.routes[0].durationSeconds = 0 },
    d => { d.flights.nodes[0].role = 'primary' }, d => { d.network.routes[1].id = d.network.routes[0].id }]) {
    const data = structuredClone(simulationMock); mutate(data)
    assert.throws(() => decodeSimulation(data))
  }
})

test('跨日期变更线与反向航线连续、有限且不穿过球体', () => {
  const direction = lng => new THREE.Vector3(Math.sin(lng * Math.PI / 180), 0, Math.cos(lng * Math.PI / 180))
  for (const [from, to] of [[direction(170), direction(-170)], [direction(0), direction(180)], [direction(0), direction(0)]]) {
    for (let i = 0; i <= 100; i++) {
      const point = routePosition(from, to, i / 100, 2)
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z))
      assert.ok(point.length() >= 2)
    }
    assert.ok(routePosition(from, to, 0, 2).clone().normalize().distanceTo(from) < 1e-6)
    assert.ok(routePosition(from, to, 1, 2).clone().normalize().distanceTo(to) < 1e-6)
  }
  assert.ok(routePosition(direction(170), direction(-170), 0.5, 2).z < -2)
})

test('航线动画按增量推进，隐藏暂停，刷新释放资源', () => {
  const data = decodeSimulation(simulationMock)
  const layer = new GeoRoutesLayer({ color: 0x39d5ce, aircraft: true })
  layer.setData(data.flights, 2)
  const aircraft = layer.group.children.find(child => child.geometry?.type === 'ShapeGeometry')
  const before = aircraft.position.clone()
  layer.update(0.1)
  assert.ok(aircraft.position.distanceTo(before) > 0)
  const paused = aircraft.position.clone()
  layer.group.visible = false
  layer.update(10)
  assert.equal(aircraft.position.distanceTo(paused), 0)
  let disposed = 0
  aircraft.geometry.addEventListener('dispose', () => { disposed++ })
  layer.setData(null, 2)
  assert.equal(disposed, 1)
  assert.equal(layer.group.children.length, 0)
  layer.dispose()
})
