import * as THREE from 'three'
import type { SoftwareUsageDataset } from '@/data/softwareUsage/schema'

/** 将使用量绘制成球面高斯热力覆盖层，保持地形可见。 */
export class SoftwareUsageLayer {
  readonly group = new THREE.Group()
  private surface: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> | null = null
  private regions: Array<{ id: string; direction: THREE.Vector3 }> = []

  setData(dataset: SoftwareUsageDataset | null, radius: number): void {
    this.clear()
    if (!dataset?.regions.length || radius <= 0) return
    const maximum = Math.max(1, ...dataset.regions.map(row => row.activeUsers))
    const points = dataset.regions.map(row => {
      const lat = THREE.MathUtils.degToRad(row.latitude)
      const lng = THREE.MathUtils.degToRad(row.longitude)
      return { id: row.id, weight: Math.sqrt(row.activeUsers / maximum),
        direction: new THREE.Vector3(Math.cos(lat) * Math.sin(lng), Math.sin(lat), Math.cos(lat) * Math.cos(lng)) }
    })
    this.regions = points
    const width = 512, height = 256
    const pixels = new Uint8Array(width * height * 4)
    const low = new THREE.Color('#39d5ce'), middle = new THREE.Color('#ffbd66'), high = new THREE.Color('#ff634b')
    const direction = new THREE.Vector3(), color = new THREE.Color()
    for (let y = 0; y < height; y++) {
      const lat = ((y + 0.5) / height - 0.5) * Math.PI
      for (let x = 0; x < width; x++) {
        const lng = ((x + 0.5) / width - 0.5) * Math.PI * 2
        direction.set(Math.cos(lat) * Math.sin(lng), Math.sin(lat), Math.cos(lat) * Math.cos(lng))
        let density = 0
        for (const point of points) density += point.weight * Math.exp((direction.dot(point.direction) - 1) / 0.0032)
        const intensity = Math.min(1, density)
        color.copy(intensity < 0.5 ? low : middle).lerp(intensity < 0.5 ? middle : high, intensity < 0.5 ? intensity * 2 : (intensity - 0.5) * 2)
        const offset = (y * width + x) * 4
        pixels[offset] = Math.round(color.r * 255)
        pixels[offset + 1] = Math.round(color.g * 255)
        pixels[offset + 2] = Math.round(color.b * 255)
        pixels[offset + 3] = Math.round(190 * THREE.MathUtils.smoothstep(density, 0.015, 0.65))
      }
    }
    const texture = new THREE.DataTexture(pixels, width, height)
    texture.wrapS = THREE.RepeatWrapping
    texture.minFilter = texture.magFilter = THREE.LinearFilter
    texture.needsUpdate = true
    const material = new THREE.ShaderMaterial({
      uniforms: { heatmap: { value: texture } }, transparent: true, depthWrite: false,
      vertexShader: `varying vec3 surfaceDirection;
        void main() { surfaceDirection = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform sampler2D heatmap; varying vec3 surfaceDirection;
        void main() { vec3 n = normalize(surfaceDirection);
          vec2 uv = vec2(atan(n.x, n.z) / 6.28318530718 + 0.5, asin(clamp(n.y, -1.0, 1.0)) / 3.14159265359 + 0.5);
          gl_FragColor = texture2D(heatmap, uv);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    })
    this.surface = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.003, 128, 64), material)
    this.group.add(this.surface)
  }

  /** 根据可见球面的交点，选择热区中距离最近的地区。 */
  pick(raycaster: THREE.Raycaster): string | null {
    if (!this.surface || !this.group.visible) return null
    const hit = raycaster.intersectObject(this.surface)[0]
    if (!hit) return null
    const direction = this.surface.worldToLocal(hit.point.clone()).normalize()
    let closest: string | null = null, similarity = Math.cos(0.16)
    for (const region of this.regions) {
      const dot = direction.dot(region.direction)
      if (dot > similarity) { similarity = dot; closest = region.id }
    }
    return closest
  }

  private clear(): void {
    if (this.surface) {
      this.group.remove(this.surface)
      this.surface.geometry.dispose()
      this.surface.material.uniforms.heatmap.value.dispose()
      this.surface.material.dispose()
    }
    this.surface = null
    this.regions = []
  }
  dispose(): void { this.clear(); this.group.removeFromParent() }
}
