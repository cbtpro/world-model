export interface LunarOrbiter {
  id: string
  name: string
  orbitalRadius: number
  orbitalPeriodDays: number
  inclinationDegrees: number
  phaseRadians: number
}

export const lunarOrbiters: LunarOrbiter[] = [
  {
    id: 'lro',
    name: '月球勘测轨道飞行器',
    orbitalRadius: 2,
    orbitalPeriodDays: 0.074,
    inclinationDegrees: 72,
    phaseRadians: 0,
  },
  {
    id: 'kaguya',
    name: '月球女神（SELENE）',
    orbitalRadius: 2.8,
    orbitalPeriodDays: 0.112,
    inclinationDegrees: 87,
    phaseRadians: Math.PI * 0.7,
  },
  {
    id: 'chandrayaan-1',
    name: '月船一号',
    orbitalRadius: 3.6,
    orbitalPeriodDays: 0.15,
    inclinationDegrees: 64,
    phaseRadians: Math.PI * 1.35,
  },
]
