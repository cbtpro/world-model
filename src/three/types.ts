import type * as THREE from 'three'

// 加载进度回调
export type ProgressCallback = (progress: number) => void

// 场景渲染上下文（供各模块访问公共对象）
export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}
