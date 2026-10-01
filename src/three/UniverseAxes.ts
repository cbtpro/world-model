import * as THREE from 'three'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

// 宇宙坐标系：带标签的三轴 + 参考网格
// X 轴（红）、Y 轴（绿）、Z 轴（蓝），标签置于可读距离（不随轴线长度变化）
export class UniverseAxes {
  readonly group: THREE.Group

  constructor(axisLength = 30, labelDistance = 16) {
    this.group = new THREE.Group()
    this.group.name = 'universe-axes'

    this.group.add(this.createAxis('x', 0xff4444, axisLength, labelDistance))
    this.group.add(this.createAxis('y', 0x44ff44, axisLength, labelDistance))
    this.group.add(this.createAxis('z', 0x4488ff, axisLength, labelDistance))
    this.group.add(this.createGrid(axisLength))
  }

  // 创建单根坐标轴 + 可读距离处标签
  private createAxis(
    axis: 'x' | 'y' | 'z',
    color: number,
    length: number,
    labelDistance: number,
  ): THREE.Group {
    const axisGroup = new THREE.Group()

    const points: [THREE.Vector3, THREE.Vector3] = [
      new THREE.Vector3(-length, 0, 0),
      new THREE.Vector3(length, 0, 0),
    ]
    // 按轴方向旋转点位置
    if (axis === 'y') points.forEach((p) => p.set(0, p.x, 0))
    if (axis === 'z') points.forEach((p) => p.set(0, 0, p.x))

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7,
    })
    const line = new THREE.Line(geometry, material)
    axisGroup.add(line)

    // 文字标签置于可读距离（不随轴线末端，确保始终在相机视野内）
    const labelDiv = document.createElement('div')
    labelDiv.className = 'axis-label'
    labelDiv.textContent = axis.toUpperCase()
    labelDiv.style.color = `#${color.toString(16).padStart(6, '0')}`
    const label = new CSS2DObject(labelDiv)
    label.position.set(
      axis === 'x' ? labelDistance : 0,
      axis === 'y' ? labelDistance : 0,
      axis === 'z' ? labelDistance : 0,
    )
    axisGroup.add(label)

    return axisGroup
  }

  // 创建参考网格（XZ 平面）
  private createGrid(size: number): THREE.GridHelper {
    const grid = new THREE.GridHelper(size * 2, 20, 0x2a4a6a, 0x1a2a3a)
    grid.name = 'reference-grid'
    return grid
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Line) {
        obj.geometry.dispose()
        ;(obj.material as THREE.Material).dispose()
      }
      if (obj instanceof CSS2DObject) {
        obj.element.remove()
      }
      if (obj instanceof THREE.GridHelper) {
        obj.geometry.dispose()
        ;(obj.material as THREE.Material).dispose()
      }
    })
  }
}
