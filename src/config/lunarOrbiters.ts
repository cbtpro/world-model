export interface LunarOrbiter {
  /** 探测器唯一标识；显示名称通过 i18n 按此 id 查找 */
  id: string
  orbitalRadius: number
  orbitalPeriodDays: number
  inclinationDegrees: number
  phaseRadians: number
}

export const lunarOrbiters: LunarOrbiter[] = [
  {
    id: 'lro',
    orbitalRadius: 2,
    orbitalPeriodDays: 0.074,
    inclinationDegrees: 72,
    phaseRadians: 0,
  },
  {
    id: 'kaguya',
    orbitalRadius: 2.8,
    orbitalPeriodDays: 0.112,
    inclinationDegrees: 87,
    phaseRadians: Math.PI * 0.7,
  },
  {
    id: 'chandrayaan-1',
    orbitalRadius: 3.6,
    orbitalPeriodDays: 0.15,
    inclinationDegrees: 64,
    phaseRadians: Math.PI * 1.35,
  },
]
