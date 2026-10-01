import type { CelestialBody } from './types'

// 地球模型与太阳系教学示意位置
export const earth: CelestialBody = {
  id: 'earth',
  name: '地球',
  description: 'NASA Blue Marble 地球模型，与太阳、月球共同展示',
  category: 'planet',
  defaultVariantId: 'color',
  radiusKm: 6371,
  distanceFromSunKm: 149600000, // 平均日地距离 ~ 1 AU
  visualDiameter: 4,
  visualDistanceFromSun: 50,
  visualOrbitalSpeed: 0.00015,
  rotationSpeed: 0.0012,
  variants: [
    {
      id: 'color',
      name: '颜色贴图',
      description: '地球颜色贴图',
      modelUrl: `${import.meta.env.BASE_URL}models/earth/earth_small.glb`,
      fileSizeMB: 0.4,
    },
  ],
}
