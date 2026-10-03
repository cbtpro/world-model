import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
const exports = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/three/orbits.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports })
const { orbitPoint, solveEccentricAnomaly } = exports
const near = (a,b) => assert.ok(Math.abs(a-b) < 1e-9)

test('太阳位于焦点，近日点和远日点距离符合椭圆轨道', () => {
  const a=50, e=0.0167, b=a*Math.sqrt(1-e*e)
  near(orbitPoint(a,e,0).x,a*(1-e))
  near(orbitPoint(a,e,Math.PI).x,-a*(1+e))
  for(let i=0;i<100;i++) {
    const p=orbitPoint(a,e,i*Math.PI*2/100)
    near((p.x+a*e)**2/a**2+p.z**2/b**2,1)
    const distance1=Math.hypot(p.x,p.z), distance2=Math.hypot(p.x+2*a*e,p.z)
    near(distance1+distance2,2*a)
  }
})

test('开普勒方程支持负日期和高离心率，近日点角速度更快', () => {
  for (const e of [0,0.0167,0.5,0.95]) {
    for(const mean of [-100,-1,0,0.1,Math.PI,100]) {
      const anomaly=solveEccentricAnomaly(mean,e)
      const normalized=((mean%(2*Math.PI))+2*Math.PI)%(2*Math.PI)
      near(anomaly-e*Math.sin(anomaly),normalized)
    }
  }
  const angle=m=>{const p=orbitPoint(50,0.0167,solveEccentricAnomaly(m,0.0167));return Math.atan2(-p.z,p.x)}
  assert.ok(angle(0.01)-angle(0) > Math.abs(angle(Math.PI+0.01)+Math.PI))
})
