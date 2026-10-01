import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import type { ProgressCallback } from './types'

export const NORMALIZED_MODEL_DIAMETER = 12

// 模型加载器（单一职责）：负责 GLB 加载与旧模型资源释放
export class ModelLoader {
  private gltfLoader: GLTFLoader

  constructor() {
    this.gltfLoader = new GLTFLoader()
    // 预设 DRACO 解码器路径（NASA GLB 可能使用 Draco 压缩）
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
    this.gltfLoader.setDRACOLoader(dracoLoader)
  }

  // 加载 GLB 并在可移动的外层 Group 内标准化，保留模型中心偏移。
  async load(
    url: string,
    onProgress?: ProgressCallback,
    targetDiameter = NORMALIZED_MODEL_DIAMETER,
  ): Promise<THREE.Group> {
    const gltf = await this.gltfLoader.loadAsync(url, (event) => {
      if (onProgress && event.total) {
        const percent = (event.loaded / event.total) * 100
        onProgress(percent)
      }
    })

    const root = gltf.scene
    this.normalizeModel(root, targetDiameter)
    const model = new THREE.Group()
    model.add(root)
    return model
  }

  // 标准化模型：居中 + 等比缩放至目标直径
  private normalizeModel(model: THREE.Group, targetDiameter: number): void {
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = targetDiameter / maxDim

    model.position.sub(center)
    model.scale.setScalar(scale)
  }

  // 释放指定模型的几何体/材质/纹理，防止内存泄漏
  dispose(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose()
        const material = child.material
        if (Array.isArray(material)) {
          material.forEach((m) => this.disposeMaterial(m))
        } else if (material) {
          this.disposeMaterial(material)
        }
      }
    })
  }

  private disposeMaterial(material: THREE.Material): void {
    // 释放材质关联的纹理
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) {
        value.dispose()
      }
    }
    material.dispose()
  }
}
