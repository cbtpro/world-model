import type { CelestialBody } from './types'

// 月球 3D 模型定义（数据来源：NASA SVS #14959）
// 三种变体对应 NASA 提供的 COLOR MAP ONLY / GRID / HEIGHT MAP
export const moon: CelestialBody = {
  id: 'moon',
  category: 'moon',
  defaultVariantId: 'color',
  radiusKm: 1737.4,
  distanceFromPrimaryKm: 384400,
  primaryId: 'earth',
  visualDiameter: 1.5,
  visualDistanceFromPrimary: 8,
  orbitalPeriodDays: 27.3217,
  rotationPeriodDays: 27.3217,
  tidallyLockedToPrimary: true,
  variants: [
    {
      id: 'color',
      modelUrl: `${import.meta.env.BASE_URL}models/moon/moon_small.glb`,
      fileSizeMB: 13.2,
    },
    {
      id: 'grid',
      modelUrl: `${import.meta.env.BASE_URL}models/moon/Moon_NASA_LRO_15k_Grid_Small.glb`,
      fileSizeMB: 6.9,
    },
    {
      id: 'topo',
      modelUrl: `${import.meta.env.BASE_URL}models/moon/Moon_NASA_LRO_8k_Topo_Small.glb`,
      fileSizeMB: 77.7,
    },
  ],
}
