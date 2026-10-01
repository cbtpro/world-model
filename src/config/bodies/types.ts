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
}

// 天体注册表：聚合所有已注册天体
export interface BodyRegistry {
  /** 按 id 索引的天体映射 */
  bodies: Record<string, CelestialBody>
  /** 有序列表，用于 UI 渲染 */
  list: CelestialBody[]
}
