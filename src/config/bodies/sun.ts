import type { CelestialBody } from './types'

// 太阳模型与太阳系教学示意位置
export const sun: CelestialBody = {
  id: 'sun',
  category: 'star',
  defaultVariantId: 'color',
  radiusKm: 696340,
  distanceFromSunKm: 0,
  visualDiameter: 18,
  visualDistanceFromSun: 0,
  rotationPeriodDays: 25,
  variants: [
    {
      id: 'color',
      modelUrl: `${import.meta.env.BASE_URL}models/sun/sun_small.glb`,
      fileSizeMB: 0.3,
    },
  ],
}
