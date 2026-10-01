// 天体模型变体接口
export interface CelestialVariant {
  /** 变体唯一标识，如 'color' | 'grid' | 'topo' */
  id: string
  /** 变体显示名称 */
  name: string
  /** 变体描述说明 */
  description: string
  /** GLB 模型文件路径（相对于 public 目录） */
  modelUrl: string
  /** 文件大小（MB），用于 UI 提示加载耗时 */
  fileSizeMB: number
}

// 天体分类，便于未来扩展（行星/卫星/恒星/彗星等）
export type CelestialCategory = 'planet' | 'moon' | 'star' | 'comet'

// 天体接口
export interface CelestialBody {
  /** 天体唯一标识，如 'moon' */
  id: string
  /** 天体显示名称 */
  name: string
  /** 天体描述说明 */
  description: string
  /** 天体分类 */
  category: CelestialCategory
  /** 该天体可选的模型变体列表 */
  variants: CelestialVariant[]
  /** 默认变体 id */
  defaultVariantId: string
  /** 模型缩放倍率（可选） */
  scale?: number
  /** 自转速度（可选，弧度/帧） */
  rotationSpeed?: number
  /** 可视化半径（千米，可选，用于相对比例提示） */
  radiusKm?: number
  /** 相对于太阳的平均距离（千米，可选，便于在场景中按比例摆放） */
  distanceFromSunKm?: number
  /** 相对于其主天体的平均距离（千米），例如月球相对于地球 */
  distanceFromPrimaryKm?: number
  /** 主天体 id，例如 moon 的 primaryId 为 'earth' */
  primaryId?: string
  /** 教学示意场景中的模型直径；轨道与天体大小均为示意比例 */
  visualDiameter?: number
  /** 教学示意场景中相对太阳的轨道半径 */
  visualDistanceFromSun?: number
  /** 教学示意场景中相对主天体的轨道半径 */
  visualDistanceFromPrimary?: number
  /** 教学示意场景中的轨道自转速度（弧度/帧） */
  visualOrbitalSpeed?: number
}

// 天体注册表：聚合所有已注册天体
export interface BodyRegistry {
  /** 按 id 索引的天体映射 */
  bodies: Record<string, CelestialBody>
  /** 有序列表，用于 UI 渲染 */
  list: CelestialBody[]
}
