import * as THREE from 'three'

// 星空背景：在大球壳内随机分布的发光点，模拟宇宙星空
export class Starfield {
  readonly points: THREE.Points

  constructor(starCount = 6000, radius = 800) {
    const geometry = this.createGeometry(starCount, radius)
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.points = new THREE.Points(geometry, material)
    this.points.name = 'starfield'
  }

  // 在球壳上随机生成星点位置
  private createGeometry(count: number, radius: number): THREE.BufferGeometry {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // 球面均匀采样（避免极点聚集）
      const u = Math.random()
      const v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(2 * v - 1)
      const r = radius * (0.7 + Math.random() * 0.3)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }

  dispose(): void {
    this.points.geometry.dispose()
    ;(this.points.material as THREE.Material).dispose()
  }
}
