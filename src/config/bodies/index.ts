import type { BodyRegistry, CelestialBody } from './types'
import { moon } from './moon'
import { earth } from './earth'
import { sun } from './sun'

// 天体注册表（OCP 扩展点）
// 新增天体时：1) 在此目录新建 body 文件；2) 在下方数组添加一行 import 引用。
// 无需修改既有文件逻辑，符合开闭原则。
const bodyDefinitions: CelestialBody[] = [
  sun,
  earth,
  moon,
  // venus,   // 未来：金星
  // comet,   // 未来：彗星
]

// 构建注册表：以 id 为键的映射 + 有序列表
export const bodyRegistry: BodyRegistry = {
  bodies: Object.fromEntries(bodyDefinitions.map((b) => [b.id, b])),
  list: bodyDefinitions,
}

// 默认天体 id（用于路由守卫回退）；新增天体不应改变既有默认页
export const DEFAULT_BODY_ID =
  bodyDefinitions.find(({ id }) => id === 'earth')?.id ??
  bodyDefinitions[0]?.id ??
  'earth'
