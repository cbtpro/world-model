import * as THREE from 'three'
import type { GeoNode, RouteDataset } from '@/data/simulation/schema'

/** 沿球面大圆插值，跨越日期变更线时保持连续，反向端点采用稳定的垂直轴。 */
export function routePosition(from: THREE.Vector3, to: THREE.Vector3, progress: number, radius: number): THREE.Vector3 {
  const angle = Math.acos(THREE.MathUtils.clamp(from.dot(to), -1, 1))
  const axis = new THREE.Vector3().crossVectors(from, to)
  if (axis.lengthSq() < 1e-12) axis.crossVectors(from, Math.abs(from.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0))
  return from.clone().applyAxisAngle(axis.normalize(), angle * progress).multiplyScalar(radius * (1.012 + Math.sin(progress * Math.PI) * 0.12))
}

/** 节点与连线共享渲染逻辑，通过样式配置扩展不同地理拓扑。 */
export class GeoRoutesLayer {
  readonly group = new THREE.Group()
  private moving: Array<{ mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; duration: number; phase: number }> = []
  private elapsed = 0
  private radius = 2
  constructor(private style: { color: number; aircraft: boolean }) {}

  setData(dataset: RouteDataset | null, radius: number): void {
    this.clear()
    this.radius = radius
    if (!dataset) return
    const direction = (node: GeoNode) => {
      const lat = THREE.MathUtils.degToRad(node.latitude), lng = THREE.MathUtils.degToRad(node.longitude)
      return new THREE.Vector3(Math.cos(lat) * Math.sin(lng), Math.sin(lat), Math.cos(lat) * Math.cos(lng))
    }
    const nodes = new Map(dataset.nodes.map(node => [node.id, direction(node)]))
    for (const node of dataset.nodes) {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(radius * (node.role === 'primary' ? 0.018 : 0.012), 16, 12),
        new THREE.MeshBasicMaterial({ color: node.role === 'primary' ? 0xffbd66 : this.style.color }))
      marker.position.copy(nodes.get(node.id)!).multiplyScalar(radius * 1.012)
      this.group.add(marker)
    }
    dataset.routes.forEach((route, index) => {
      const from = nodes.get(route.from), to = nodes.get(route.to)
      if (!from || !to) return
      const points = Array.from({ length: 97 }, (_, i) => routePosition(from, to, i / 96, radius))
      const path = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: this.style.color, transparent: true, opacity: 0.65 }))
      this.group.add(path)
      const geometry = this.style.aircraft ? this.aircraftGeometry(radius) : new THREE.SphereGeometry(radius * 0.009, 12, 8)
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: this.style.aircraft ? 0xffffff : this.style.color, side: THREE.DoubleSide }))
      this.group.add(mesh)
      this.moving.push({ mesh, from, to, duration: route.durationSeconds, phase: index * 0.27 })
    })
    this.update(0)
  }

  private aircraftGeometry(radius: number): THREE.BufferGeometry {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0.035); shape.lineTo(0.006, 0.007); shape.lineTo(0.028, -0.006)
    shape.lineTo(0.028, -0.014); shape.lineTo(0.006, -0.008); shape.lineTo(0.006, -0.025)
    shape.lineTo(0.013, -0.033); shape.lineTo(-0.013, -0.033); shape.lineTo(-0.006, -0.025)
    shape.lineTo(-0.006, -0.008); shape.lineTo(-0.028, -0.014); shape.lineTo(-0.028, -0.006)
    shape.lineTo(-0.006, 0.007); shape.closePath()
    return new THREE.ShapeGeometry(shape).scale(radius, radius, radius)
  }

  /** 只累计前台渲染增量，后台及隐藏图层不会推进演示动画。 */
  update(deltaSeconds: number): void {
    if (!this.group.visible) return
    this.elapsed += Math.max(0, Math.min(deltaSeconds, 0.1))
    const basis = new THREE.Matrix4()
    for (const item of this.moving) {
      const t = (this.elapsed / item.duration + item.phase) % 1
      item.mesh.position.copy(routePosition(item.from, item.to, t, this.radius))
      const normal = item.mesh.position.clone().normalize()
      const tangent = routePosition(item.from, item.to, Math.min(t + 0.001, 1), this.radius).sub(item.mesh.position).normalize()
      const right = new THREE.Vector3().crossVectors(tangent, normal).normalize()
      tangent.crossVectors(normal, right).normalize()
      basis.makeBasis(right, tangent, normal)
      item.mesh.quaternion.setFromRotationMatrix(basis)
    }
  }

  private clear(): void {
    for (const child of [...this.group.children]) {
      const drawable = child as THREE.Mesh<THREE.BufferGeometry, THREE.Material>
      drawable.geometry.dispose()
      drawable.material.dispose()
      this.group.remove(child)
    }
    this.moving = []
    this.elapsed = 0
  }
  dispose(): void { this.clear(); this.group.removeFromParent() }
}
