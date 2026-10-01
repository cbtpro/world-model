import type { CelestialBody } from './types'

// 月球 3D 模型定义（数据来源：NASA SVS #14959）
// 三种变体对应 NASA 提供的 COLOR MAP ONLY / GRID / HEIGHT MAP
export const moon: CelestialBody = {
  id: 'moon',
  name: '月球',
  description: 'NASA Lunar Reconnaissance Orbiter (LRO) 月球 3D 模型',
  category: 'moon',
  defaultVariantId: 'color',
  rotationSpeed: 0.0008,
  variants: [
    {
      id: 'color',
      name: '颜色贴图',
      description: 'COLOR MAP ONLY — 月球颜色贴图包裹于球面，无地形起伏',
      modelUrl: `${import.meta.env.BASE_URL}models/moon/moon_small.glb`,
      fileSizeMB: 13.2,
    },
    {
      id: 'grid',
      name: '颜色 + 网格',
      description: 'COLOR MAP AND GRID — 颜色贴图叠加经纬度网格线',
      modelUrl: `${import.meta.env.BASE_URL}models/moon/Moon_NASA_LRO_15k_Grid_Small.glb`,
      fileSizeMB: 6.9,
    },
    {
      id: 'topo',
      name: '颜色 + 地形',
      description: 'COLOR MAP AND HEIGHT MAP — 颜色贴图叠加高度图，可见月球地形起伏',
      modelUrl: `${import.meta.env.BASE_URL}models/moon/Moon_NASA_LRO_8k_Topo_Small.glb`,
      fileSizeMB: 77.7,
    },
  ],
}
