import type { CelestialBody } from './types'

// 太阳模型与太阳系教学示意位置
export const sun: CelestialBody = {
  id: 'sun',
  name: '太阳',
  description: '自包含的太阳光球模型，与地球、月球共同展示',
  category: 'star',
  defaultVariantId: 'color',
  radiusKm: 696340,
  distanceFromSunKm: 0,
  visualDiameter: 18,
  visualDistanceFromSun: 0,
  rotationSpeed: 0.0002,
  variants: [
    {
      id: 'color',
      name: '颜色贴图',
      description: '太阳着色球体',
      modelUrl: `${import.meta.env.BASE_URL}models/sun/sun_small.glb`,
      fileSizeMB: 0.3,
    },
  ],
}
