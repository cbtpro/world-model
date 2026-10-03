import type { CelestialBody } from './types'

// 地球模型与太阳系教学示意位置
export const earth: CelestialBody = {
  id: 'earth',
  category: 'planet',
  defaultVariantId: 'color',
  radiusKm: 6371,
  distanceFromSunKm: 149600000, // 平均日地距离 ~ 1 AU
  primaryId: 'sun',
  visualDiameter: 4,
  visualDistanceFromSun: 0,
  visualDistanceFromPrimary: 50,
  orbitalPeriodDays: 365.256,
  // NASA Earth Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
  orbitalEccentricity: 0.0167,
  rotationPeriodDays: 0.99727,
  variants: [
    {
      id: 'color',
      modelUrl: `${import.meta.env.BASE_URL}models/earth/earth_small.glb`,
      fileSizeMB: 0.4,
    },
  ],
}
