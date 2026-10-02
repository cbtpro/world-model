import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { Starfield } from './Starfield'
import { UniverseAxes } from './UniverseAxes'
import { ModelLoader } from './ModelLoader'
import type { ProgressCallback } from './types'
import { lunarLandmarks, type LunarLandmark } from '@/config/lunarLandmarks'
import { lunarOrbiters } from '@/config/lunarOrbiters'

const LANDMARK_SURFACE_OFFSET = 0.08

interface SurfaceLocation {
  latitude: number
  longitude: number
}

export interface SceneBodyModel {
  id: string
  name: string
  modelUrl: string
  visualDiameter: number
  visualDistanceFromSun: number
  visualDistanceFromPrimary?: number
  primaryId?: string
  rotationPeriodDays: number
  orbitalPeriodDays: number
  tidallyLockedToPrimary?: boolean
  includeLunarLandmarks?: boolean
}

interface LandmarkLabel {
  landmark: LunarLandmark
  label: CSS2DObject
  localPosition: THREE.Vector3
}

interface LunarOrbiterModel {
  pivot: THREE.Group
  spacecraft: THREE.Group
  orbitalPeriodDays: number
  phaseRadians: number
}

// 场景管理器：封装 Three.js 渲染器/场景/相机/控制器/灯光/渲染循环
// 命令式类，不使用 Vue 响应式包装（避免 Three 对象被 Proxy 代理导致性能损耗）
export class SceneManager {
  private container: HTMLElement
  private renderer: THREE.WebGLRenderer
  private cssRenderer: CSS2DRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private starfield: Starfield
  private axes: UniverseAxes
  private sunLight: THREE.DirectionalLight
  private modelLoader: ModelLoader
  private currentModel: THREE.Group | null = null
  private bodyModels = new Map<string, THREE.Group>()
  private bodyAnchors = new Map<string, THREE.Group>()
  private bodyReplacementSequences = new Map<string, number>()
  private bodyOrbitPivots = new Map<string, THREE.Group>()
  private bodyModelUrls = new Map<string, string>()
  private bodyDiameters = new Map<string, number>()
  private bodyRotationPeriods = new Map<string, number>()
  private bodyOrbitalPeriods = new Map<string, number>()
  private tidallyLockedBodies = new Set<string>()
  private activeBodyId = ''
  private isSystemView = false
  private auxiliaryLinesVisible = false
  private simulationDay = 0
  private orbitLines: THREE.LineLoop[] = []
  private focusedBodyWorldPosition: THREE.Vector3 | null = null
  private animationId: number | null = null
  private resizeObserver: ResizeObserver
  private landmarkLabels: LandmarkLabel[] = []
  private lunarSurfaceFeatures: THREE.Group | null = null
  private lunarOrbiterRoot: THREE.Group | null = null
  private lunarOrbiterModels: LunarOrbiterModel[] = []
  private lunarOrbiterLabels: CSS2DObject[] = []
  private lunarOrbiterOrbitLines: THREE.LineLoop[] = []
  private focusedLandmarkId: string | null = null
  private focusedWorldPosition: THREE.Vector3 | null = null
  private surfaceLocation: SurfaceLocation | null = null
  private locationMarker: THREE.Group | null = null
  private locationPulseMaterial: THREE.ShaderMaterial | null = null

  constructor(container: HTMLElement) {
    this.container = container
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight

    // WebGL 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3

    // CSS2D 渲染器（坐标轴文字标签层，不拦截鼠标事件）
    this.cssRenderer = new CSS2DRenderer()
    this.cssRenderer.setSize(width, height)
    this.cssRenderer.domElement.style.position = 'absolute'
    this.cssRenderer.domElement.style.top = '0'
    this.cssRenderer.domElement.style.left = '0'
    this.cssRenderer.domElement.style.pointerEvents = 'none'

    // 场景与相机
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000)
    this.camera.position.set(0, 8, 45)

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.minDistance = 1
    this.controls.maxDistance = 300
    this.controls.rotateSpeed = 0.5

    // 环境光只保留微弱填充光；太阳方向光负责实时昼夜明暗。
    // 提高环境光与太阳光强度，避免贴图在默认曝光下显得过暗、细节难以辨认。
    this.scene.add(new THREE.AmbientLight(0x404060, 0.3))
    this.sunLight = new THREE.DirectionalLight(0xffffff, 4.5)
    this.sunLight.position.set(0, 0, 0)
    this.scene.add(this.sunLight, this.sunLight.target)

    // 星空与坐标系
    this.starfield = new Starfield()
    this.scene.add(this.starfield.points)

    this.axes = new UniverseAxes()
    this.scene.add(this.axes.group)

    // 模型加载器
    this.modelLoader = new ModelLoader()

    // 尺寸监听
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
  }

  // 初始化：挂载 DOM，启动渲染循环
  init(): void {
    this.container.appendChild(this.renderer.domElement)
    this.container.appendChild(this.cssRenderer.domElement)
    this.startRenderLoop()
  }

  async loadSystem(
    bodies: SceneBodyModel[],
    onProgress?: ProgressCallback,
  ): Promise<void> {
    this.clearSystem()
    const pending = [...bodies]
    let loadedCount = 0

    while (pending.length) {
      const index = pending.findIndex(
        ({ primaryId }) => !primaryId || this.bodyModels.has(primaryId),
      )
      if (index < 0) {
        throw new Error('无法加载太阳系模型：主天体关系缺失或存在循环引用')
      }
      const [body] = pending.splice(index, 1)
      const anchor = new THREE.Group()
      const parentAnchor = body.primaryId
        ? this.bodyAnchors.get(body.primaryId)
        : undefined
      if (body.primaryId && !parentAnchor) {
        throw new Error(`找不到主天体「${body.primaryId}」`)
      }
      if (parentAnchor) {
        const orbitPivot = new THREE.Group()
        parentAnchor.add(orbitPivot)
        orbitPivot.add(anchor)
        this.bodyOrbitPivots.set(body.id, orbitPivot)
      } else {
        this.scene.add(anchor)
      }

      const position = new THREE.Vector3(
        body.visualDistanceFromPrimary ?? body.visualDistanceFromSun,
        0,
        0,
      )
      anchor.position.copy(position)
      const model = await this.modelLoader.load(
        body.modelUrl,
        (progress) =>
          onProgress?.(((loadedCount + progress / 100) / bodies.length) * 100),
        body.visualDiameter,
      )
      anchor.add(model)
      this.bodyAnchors.set(body.id, anchor)
      this.bodyModels.set(body.id, model)
      this.bodyModelUrls.set(body.id, body.modelUrl)
      this.bodyDiameters.set(body.id, body.visualDiameter)
      this.bodyRotationPeriods.set(body.id, body.rotationPeriodDays)
      this.bodyOrbitalPeriods.set(body.id, body.orbitalPeriodDays)
      if (body.tidallyLockedToPrimary) {
        this.tidallyLockedBodies.add(body.id)
      }
      if (body.includeLunarLandmarks) {
        this.createLandmarkLabels(model, body.visualDiameter)
        this.createLunarSurfaceProbes(model, body.visualDiameter)
        this.createLunarOrbiters(anchor, body.visualDiameter)
        this.updateLunarFeatureVisibility()
      }
      this.createBodyLabel(model, body.name, body.visualDiameter)
      loadedCount += 1
      onProgress?.((loadedCount / bodies.length) * 100)
    }

    this.createOrbitLines(bodies)
    this.setSimulationTime(this.simulationDay)
    this.updateSunlightDirection()
    this.setSurfaceLocation(this.surfaceLocation)
    onProgress?.(100)
  }

  async replaceBodyModel(
    body: SceneBodyModel,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    const anchor = this.bodyAnchors.get(body.id)
    const previous = this.bodyModels.get(body.id)
    if (!anchor || !previous) {
      throw new Error(`无法替换未加载的天体模型「${body.id}」`)
    }
    if (this.bodyModelUrls.get(body.id) === body.modelUrl) return

    const sequence = (this.bodyReplacementSequences.get(body.id) ?? 0) + 1
    this.bodyReplacementSequences.set(body.id, sequence)

    const model = await this.modelLoader.load(
      body.modelUrl,
      onProgress,
      body.visualDiameter,
    )

    if (this.bodyReplacementSequences.get(body.id) !== sequence) {
      this.modelLoader.dispose(model)
      return
    }

    if (body.id === 'earth') this.clearSurfaceLocationMarker()
    anchor.remove(previous)
    this.modelLoader.dispose(previous)
    if (body.id === 'moon') {
      this.landmarkLabels = []
      this.removeLunarOrbiters()
    }
    anchor.add(model)
    this.bodyModels.set(body.id, model)
    this.bodyModelUrls.set(body.id, body.modelUrl)
    this.bodyDiameters.set(body.id, body.visualDiameter)
    this.bodyRotationPeriods.set(body.id, body.rotationPeriodDays)
    if (body.tidallyLockedToPrimary) {
      this.tidallyLockedBodies.add(body.id)
    } else {
      this.tidallyLockedBodies.delete(body.id)
    }
    if (body.includeLunarLandmarks) {
      this.createLandmarkLabels(model, body.visualDiameter)
      this.createLunarSurfaceProbes(model, body.visualDiameter)
      this.createLunarOrbiters(anchor, body.visualDiameter)
      this.updateLunarFeatureVisibility()
    }
    this.createBodyLabel(model, body.name, body.visualDiameter)
    this.setSimulationTime(this.simulationDay)
    if (body.id === 'earth') this.setSurfaceLocation(this.surfaceLocation)
    if (this.activeBodyId === body.id) {
      this.currentModel = model
      model.updateMatrixWorld(true)
      if (this.focusedLandmarkId) this.focusLandmark(this.focusedLandmarkId)
    }
  }

  getBodyModelUrl(bodyId: string): string | undefined {
    return this.bodyModelUrls.get(bodyId)
  }

  getBodyCoordinates(bodyId: string): THREE.Vector3 | null {
    const model = this.bodyModels.get(bodyId)
    if (!model) return null
    return model.getWorldPosition(new THREE.Vector3())
  }

  setSimulationTime(days: number): void {
    this.simulationDay = days

    // 轨道位置须先于自转计算：地球自转对齐真实 UTC 时间依赖其当前世界坐标。
    for (const [bodyId, anchor] of this.bodyOrbitPivots) {
      const period = this.bodyOrbitalPeriods.get(bodyId)
      anchor.rotation.y = period ? ((days % period) / period) * Math.PI * 2 : 0
    }

    const sunModel = this.bodyModels.get('sun')
    const earthAnchor = this.bodyAnchors.get('earth')
    sunModel?.updateWorldMatrix(true, false)
    earthAnchor?.updateWorldMatrix(true, false)

    for (const [bodyId, model] of this.bodyModels) {
      if (this.tidallyLockedBodies.has(bodyId)) {
        model.rotation.y = -Math.PI / 2
        continue
      }
      if (bodyId === 'earth' && sunModel && earthAnchor) {
        model.rotation.y = this.computeEarthSpin(days, sunModel, earthAnchor)
        continue
      }
      const period = this.bodyRotationPeriods.get(bodyId)
      model.rotation.y = period ? ((days % period) / period) * Math.PI * 2 : 0
    }

    for (const {
      pivot,
      spacecraft,
      orbitalPeriodDays,
      phaseRadians,
    } of this.lunarOrbiterModels) {
      const angle =
        ((days % orbitalPeriodDays) / orbitalPeriodDays) * Math.PI * 2 +
        phaseRadians
      pivot.rotation.y = angle
      spacecraft.rotation.y = -angle
    }
    this.updateSunlightDirection()
  }

  // 计算地球自转角：使真实 UTC 时间对应的太阳下点经度与场景中太阳方向一致，
  // 这样深圳（东八区）等真实经纬度在当地白天时会正确显示为受光面。
  private computeEarthSpin(
    days: number,
    sunModel: THREE.Group,
    earthAnchor: THREE.Group,
  ): number {
    const sunWorldPosition = sunModel.getWorldPosition(new THREE.Vector3())
    const earthWorldPosition = earthAnchor.getWorldPosition(new THREE.Vector3())
    const worldSunDirection = sunWorldPosition.sub(earthWorldPosition)
    if (worldSunDirection.lengthSq() === 0) return 0
    worldSunDirection.normalize()

    // 将太阳方向转换到地球锚点（自转前）的局部坐标系，得到当前轨道位置下
    // 太阳相对于「未自转」地球模型的方位角。
    const anchorRotationInverse = new THREE.Matrix4()
      .copy(earthAnchor.matrixWorld)
      .invert()
    const localSunDirection = worldSunDirection.transformDirection(
      anchorRotationInverse,
    )
    const preSpinBearing = Math.atan2(localSunDirection.x, localSunDirection.z)

    // 真实 UTC 时间对应的太阳下点经度：UTC 12:00 时本初子午线朝向太阳。
    const fractionalDay = days - Math.floor(days)
    const utcHours = fractionalDay * 24
    const subsolarLongitudeRad = THREE.MathUtils.degToRad(
      (12 - utcHours) * 15,
    )

    return preSpinBearing - subsolarLongitudeRad
  }

  setActiveBody(bodyId: string): number {
    const model = this.bodyModels.get(bodyId)
    if (!model) throw new Error(`场景中不存在天体「${bodyId}」`)
    this.isSystemView = false
    this.activeBodyId = bodyId
    this.updateLunarFeatureVisibility()
    this.currentModel = model
    this.currentModel.updateWorldMatrix(true, false)
    const target = model.getWorldPosition(new THREE.Vector3())
    const distance = Math.max(3, (this.bodyDiameters.get(bodyId) ?? 12) * 2.5)
    const offset = new THREE.Vector3(0, 0.2, 1).setLength(distance)
    this.controls.target.copy(target)
    this.camera.position.copy(target).add(offset)
    this.focusedBodyWorldPosition = target
    this.controls.update()
    return distance
  }

  setFocusedLandmark(landmarkId: string | null): void {
    this.focusedLandmarkId = landmarkId
    for (const { landmark, label } of this.landmarkLabels) {
      label.element.classList.toggle('selected', landmark.id === landmarkId)
    }

    if (landmarkId) this.focusLandmark(landmarkId)
    else {
      this.focusedWorldPosition = null
      this.focusedBodyWorldPosition =
        !this.isSystemView && this.currentModel
          ? this.currentModel.getWorldPosition(new THREE.Vector3())
          : null
    }
    if (this.activeBodyId !== 'moon') {
      for (const { label } of this.landmarkLabels) {
        label.element.style.display = 'none'
      }
    }
  }

  setAuxiliaryLinesVisible(visible: boolean): void {
    this.auxiliaryLinesVisible = visible
    this.axes.group.visible = visible
    for (const line of this.orbitLines) {
      line.visible = visible
    }
  }

  setZenMode(enabled: boolean): void {
    this.cssRenderer.domElement.style.visibility = enabled ? 'hidden' : 'visible'
  }

  setSurfaceLocation(location: SurfaceLocation | null): void {
    this.surfaceLocation = location
    this.clearSurfaceLocationMarker()
    if (!location) return

    const earth = this.bodyModels.get('earth')
    if (!earth) return

    const latitude = THREE.MathUtils.degToRad(location.latitude)
    const longitude = THREE.MathUtils.degToRad(location.longitude)
    const direction = new THREE.Vector3(
      Math.cos(latitude) * Math.sin(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.cos(longitude),
    ).normalize()
    const radius = (this.bodyDiameters.get('earth') ?? 4) / 2
    const marker = new THREE.Group()
    marker.position.copy(direction).multiplyScalar(radius + 0.035)
    marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.09, 0.012, 12, 48),
      new THREE.MeshBasicMaterial({
        color: 0x9fffe5,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    )
    marker.add(ring)

    const pulseMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float radius = mod(uTime * 0.22, 0.9);
          float distanceFromCenter = length((vUv - 0.5) * 2.0);
          float edge = abs(distanceFromCenter - radius);
          float alpha = (1.0 - smoothstep(0.012, 0.07, edge))
            * (1.0 - smoothstep(0.55, 0.9, radius))
            * 0.85;
          vec3 color = mix(
            vec3(0.16, 0.95, 0.78),
            vec3(0.7, 0.95, 1.0),
            smoothstep(0.0, 0.9, radius)
          );
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    const pulse = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), pulseMaterial)
    pulse.rotation.x = -Math.PI / 2
    marker.add(pulse)
    marker.visible = this.activeBodyId === 'earth'
    earth.add(marker)
    this.locationMarker = marker
    this.locationPulseMaterial = pulseMaterial
  }

  setCameraDistance(distance: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target)
    if (offset.lengthSq() === 0) offset.set(0, 0, 1)
    offset.setLength(
      THREE.MathUtils.clamp(
        distance,
        this.controls.minDistance,
        this.controls.maxDistance,
      ),
    )
    this.camera.position.copy(this.controls.target).add(offset)
    this.controls.update()
  }

  resetView(): number {
    let minimumX = Infinity
    let maximumX = -Infinity
    let maximumY = 0
    for (const [id, model] of this.bodyModels) {
      model.updateWorldMatrix(true, false)
      const center = model.getWorldPosition(new THREE.Vector3())
      const radius = (this.bodyDiameters.get(id) ?? 0) / 2
      minimumX = Math.min(minimumX, center.x - radius)
      maximumX = Math.max(maximumX, center.x + radius)
      maximumY = Math.max(maximumY, Math.abs(center.y) + radius)
    }

    const target =
      this.bodyModels.size > 0
        ? new THREE.Vector3((minimumX + maximumX) / 2, 0, 0)
        : new THREE.Vector3()
    const horizontalTangent =
      Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) *
      this.camera.aspect
    const distance = Math.min(
      this.controls.maxDistance,
      Math.max(
        40,
        ((maximumX - minimumX) / (2 * horizontalTangent)) * 1.2,
        (maximumY / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) *
          1.2,
      ),
    )
    this.controls.target.copy(target)
    this.camera.position
      .copy(target)
      .add(new THREE.Vector3(0, 0.25, 1).setLength(distance))
    this.focusedLandmarkId = null
    this.focusedWorldPosition = null
    this.focusedBodyWorldPosition = null
    this.isSystemView = true
    this.updateLunarFeatureVisibility()
    this.controls.update()
    return distance
  }

  // 窗口尺寸变化时重设渲染器与相机宽高比
  private resize(): void {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    if (width === 0 || height === 0) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.cssRenderer.setSize(width, height)
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate)
      if (this.locationPulseMaterial) {
        this.locationPulseMaterial.uniforms.uTime.value = performance.now() / 1000
      }
      this.updateSunlightDirection()
      this.updateLandmarkLabels()
      this.updateLunarOrbiterLabels()
      if (this.focusedWorldPosition) this.followFocusedLandmark()
      else this.followFocusedBody()
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.cssRenderer.render(this.scene, this.camera)
    }
    animate()
  }

  private updateSunlightDirection(): void {
    const sun = this.bodyModels.get('sun')
    const earth = this.bodyModels.get('earth')
    if (!sun || !earth) return

    sun.updateWorldMatrix(true, false)
    earth.updateWorldMatrix(true, false)
    sun.getWorldPosition(this.sunLight.position)
    earth.getWorldPosition(this.sunLight.target.position)
    this.sunLight.target.updateMatrixWorld()
  }

  private createLandmarkLabels(model: THREE.Group, diameter: number): void {
    const rootScale = Math.abs(model.scale.x)
    const localRadius =
      (diameter / 2 + LANDMARK_SURFACE_OFFSET) / rootScale

    this.landmarkLabels = lunarLandmarks.map((landmark) => {
      const latitude = THREE.MathUtils.degToRad(landmark.latitude)
      const longitude = THREE.MathUtils.degToRad(landmark.longitude)
      const localPosition = new THREE.Vector3(
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(longitude),
      ).multiplyScalar(localRadius)

      const element = document.createElement('div')
      element.className = `lunar-landmark-label ${landmark.kind}`
      element.setAttribute('aria-hidden', 'true')
      const dot = document.createElement('span')
      dot.className = 'landmark-dot'
      const name = document.createElement('span')
      name.className = 'landmark-name'
      name.textContent = landmark.name
      if (landmark.labelOffsetY) {
        name.style.transform = `translateY(${landmark.labelOffsetY}px)`
      }
      element.append(dot, name)

      const label = new CSS2DObject(element)
      label.position.copy(localPosition)
      model.add(label)
      return { landmark, label, localPosition }
    })
  }

  private createLunarSurfaceProbes(model: THREE.Group, diameter: number): void {
    const radius = diameter / 2
    const rootScale = Math.abs(model.scale.x) || 1
    const features = new THREE.Group()
    model.add(features)
    this.lunarSurfaceFeatures = features

    for (const landmark of lunarLandmarks) {
      const latitude = THREE.MathUtils.degToRad(landmark.latitude)
      const longitude = THREE.MathUtils.degToRad(landmark.longitude)
      const direction = new THREE.Vector3(
        Math.cos(latitude) * Math.sin(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.cos(longitude),
      ).normalize()
      const marker = new THREE.Group()
      marker.position.copy(
        direction.clone().multiplyScalar((radius + 0.002) / rootScale),
      )
      marker.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction,
      )
      features.add(marker)

      if (landmark.kind === 'mission' && landmark.id !== 'luna-2') {
        this.addLanderModel(marker, landmark.id)
        if (
          ['apollo-15', 'apollo-16', 'apollo-17', 'change-3', 'change-4'].includes(
            landmark.id,
          )
        ) {
          const rover = new THREE.Group()
          rover.position.set(0.085 / rootScale, 0, 0.055 / rootScale)
          marker.add(rover)
          this.addLunarRover(rover)
        }
      } else {
        const beacon = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.014, 0.045, 6),
          new THREE.MeshStandardMaterial({
            color: landmark.kind === 'crater' ? 0xffd27a : 0xff9b75,
            emissive: landmark.kind === 'crater' ? 0x5a3300 : 0x5a1c08,
            roughness: 0.55,
          }),
        )
        beacon.position.y = 0.02 / rootScale
        marker.add(beacon)
      }
    }
  }

  private addLanderModel(parent: THREE.Group, landmarkId: string): void {
    const scale = 0.075
    const gold = new THREE.MeshStandardMaterial({
      color: 0xc99a43,
      metalness: 0.72,
      roughness: 0.32,
    })
    const foil = new THREE.MeshStandardMaterial({
      color: 0xead18b,
      metalness: 0.58,
      roughness: 0.38,
    })
    const dark = new THREE.MeshStandardMaterial({
      color: 0x28364a,
      metalness: 0.52,
      roughness: 0.42,
    })
    const blue = new THREE.MeshStandardMaterial({
      color: 0x284d82,
      metalness: 0.32,
      roughness: 0.48,
      side: THREE.DoubleSide,
    })
    const silver = new THREE.MeshStandardMaterial({
      color: 0xc7ced7,
      metalness: 0.8,
      roughness: 0.28,
    })

    const addCylinder = (
      material: THREE.Material,
      topRadius: number,
      bottomRadius: number,
      height: number,
      radialSegments: number,
      position: THREE.Vector3,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          topRadius * scale,
          bottomRadius * scale,
          height * scale,
          radialSegments,
        ),
        material,
      )
      mesh.position.copy(position).multiplyScalar(scale)
      parent.add(mesh)
      return mesh
    }
    const addStrut = (
      start: THREE.Vector3,
      end: THREE.Vector3,
      radius: number,
      material: THREE.Material,
    ) => {
      const direction = end.clone().sub(start)
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radius * scale,
          radius * scale * 1.25,
          direction.length() * scale,
          6,
        ),
        material,
      )
      mesh.position.copy(start).add(end).multiplyScalar(0.5 * scale)
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize(),
      )
      parent.add(mesh)
      return mesh
    }
    const addPanel = (x: number, z: number) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7 * scale, 0.42 * scale),
        blue,
      )
      panel.position.set(x * scale, 0.82 * scale, z * scale)
      panel.rotation.y = z === 0 ? Math.PI / 2 : 0
      parent.add(panel)
      for (let index = -2; index <= 2; index += 1) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.006 * scale,
            0.42 * scale,
            0.006 * scale,
          ),
          silver,
        )
        line.position.set(
          (x + (z === 0 ? 0 : index * 0.11)) * scale,
          0.82 * scale,
          z * scale + (z === 0 ? index * 0.14 : 0) * scale,
        )
        parent.add(line)
      }
    }

    const apollo = landmarkId.startsWith('apollo-')
    if (apollo) {
      // Apollo LM: faceted ascent cabin above a wide octagonal descent stage.
      addCylinder(gold, 0.49, 0.56, 0.43, 8, new THREE.Vector3(0, 0.95, 0))
      addCylinder(foil, 0.35, 0.4, 0.42, 6, new THREE.Vector3(0, 1.38, 0))
      addCylinder(dark, 0.14, 0.22, 0.24, 8, new THREE.Vector3(0, 0.62, 0))
      addCylinder(silver, 0.075, 0.22, 0.24, 8, new THREE.Vector3(0, 0.43, 0))

      for (let index = 0; index < 4; index += 1) {
        const angle = (index / 4) * Math.PI * 2 + Math.PI / 4
        const x = Math.cos(angle)
        const z = Math.sin(angle)
        const joint = new THREE.Vector3(x * 0.36, 0.8, z * 0.36)
        const foot = new THREE.Vector3(x * 0.82, 0.06, z * 0.82)
        addStrut(joint, foot, 0.035, silver)
        addStrut(
          new THREE.Vector3(x * 0.53, 0.52, z * 0.53),
          foot.clone().lerp(joint, 0.28),
          0.018,
          gold,
        )
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.17 * scale, 0.2 * scale, 0.055 * scale, 10),
          silver,
        )
        pad.position.copy(foot).multiplyScalar(scale)
        parent.add(pad)
        const strutCover = new THREE.Mesh(
          new THREE.ConeGeometry(0.07 * scale, 0.17 * scale, 6),
          foil,
        )
        strutCover.position.set(x * 0.61 * scale, 0.68 * scale, z * 0.61 * scale)
        strutCover.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(x, 0.55, z).normalize(),
        )
        parent.add(strutCover)
      }

      const window = new THREE.Mesh(
        new THREE.SphereGeometry(0.13 * scale, 10, 8),
        dark,
      )
      window.position.set(0, 1.42 * scale, 0.34 * scale)
      window.scale.set(1.25, 0.75, 0.35)
      parent.add(window)
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(
          0.25 * scale,
          12,
          8,
          0,
          Math.PI,
          0,
          Math.PI / 2,
        ),
        silver,
      )
      dish.position.set(0.48 * scale, 1.42 * scale, 0)
      dish.rotation.z = -Math.PI / 2
      parent.add(dish)
      addStrut(
        new THREE.Vector3(0.42, 1.4, 0),
        new THREE.Vector3(0.55, 1.4, 0),
        0.018,
        silver,
      )
      return
    }

    // Robotic lander: faceted instrument deck, deployable panels and tripod legs.
    addCylinder(gold, 0.43, 0.5, 0.48, 8, new THREE.Vector3(0, 1.02, 0))
    addCylinder(foil, 0.3, 0.36, 0.3, 6, new THREE.Vector3(0, 1.4, 0))
    addCylinder(dark, 0.12, 0.24, 0.2, 8, new THREE.Vector3(0, 0.68, 0))
    addCylinder(silver, 0.055, 0.22, 0.22, 8, new THREE.Vector3(0, 0.49, 0))
    for (let index = 0; index < 3; index += 1) {
      const angle = (index / 3) * Math.PI * 2 + Math.PI / 2
      const x = Math.cos(angle)
      const z = Math.sin(angle)
      const joint = new THREE.Vector3(x * 0.28, 0.84, z * 0.28)
      const foot = new THREE.Vector3(x * 0.68, 0.055, z * 0.68)
      addStrut(joint, foot, 0.034, silver)
      addStrut(
        new THREE.Vector3(x * 0.45, 0.5, z * 0.45),
        foot.clone().lerp(joint, 0.22),
        0.016,
        gold,
      )
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15 * scale, 0.18 * scale, 0.05 * scale, 8),
        silver,
      )
      pad.position.copy(foot).multiplyScalar(scale)
      parent.add(pad)
    }
    addPanel(-0.62, 0)
    addPanel(0.62, 0)
    const cameraMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018 * scale, 0.024 * scale, 0.55 * scale, 6),
      silver,
    )
    cameraMast.position.set(0, 1.82 * scale, 0)
    parent.add(cameraMast)
    const cameraHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.11 * scale, 8, 6),
      dark,
    )
    cameraHead.position.set(0, 2.1 * scale, 0)
    parent.add(cameraHead)
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(
        0.2 * scale,
        10,
        7,
        0,
        Math.PI,
        0,
        Math.PI / 2,
      ),
      foil,
    )
    dish.position.set(-0.3 * scale, 1.55 * scale, 0)
    dish.rotation.z = Math.PI / 2
    parent.add(dish)

  }

  private addLunarRover(parent: THREE.Group): void {
    const scale = 0.08
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9a251,
      metalness: 0.62,
      roughness: 0.38,
    })
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x35383b,
      metalness: 0.52,
      roughness: 0.62,
    })
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xc9d0d9,
      metalness: 0.8,
      roughness: 0.3,
    })
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x284d82,
      metalness: 0.28,
      roughness: 0.5,
      side: THREE.DoubleSide,
    })
    const chassis = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26 * scale, 0.34 * scale, 0.16 * scale, 8),
      bodyMaterial,
    )
    chassis.position.y = 0.36 * scale
    parent.add(chassis)

    const wheelGeometry = new THREE.CylinderGeometry(
      0.22 * scale,
      0.22 * scale,
      0.1 * scale,
      12,
    )
    for (const side of [-1, 1]) {
      for (const x of [-0.45, 0, 0.45]) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
        wheel.rotation.z = Math.PI / 2
        wheel.position.set(x * scale, 0.22 * scale, side * 0.42 * scale)
        parent.add(wheel)
        const axle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018 * scale, 0.018 * scale, 0.36 * scale, 5),
          metalMaterial,
        )
        axle.rotation.x = Math.PI / 2
        axle.position.set(x * scale, 0.22 * scale, side * 0.2 * scale)
        parent.add(axle)
      }
    }

    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(0.82 * scale, 0.62 * scale),
      panelMaterial,
    )
    deck.rotation.x = -Math.PI / 2
    deck.position.y = 0.49 * scale
    parent.add(deck)
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025 * scale, 0.035 * scale, 0.56 * scale, 6),
      metalMaterial,
    )
    mast.position.set(0, 0.78 * scale, 0)
    parent.add(mast)
    const stereoCamera = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 * scale, 8, 6),
      bodyMaterial,
    )
    stereoCamera.position.set(0, 1.08 * scale, 0)
    parent.add(stereoCamera)
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018 * scale, 0.018 * scale, 0.48 * scale, 5),
        metalMaterial,
      )
      arm.rotation.z = side * Math.PI / 2.8
      arm.position.set(side * 0.28 * scale, 0.37 * scale, 0)
      parent.add(arm)
    }
  }

  private createLunarOrbiters(anchor: THREE.Group, diameter: number): void {
    const moonRadius = diameter / 2
    const orbiterRoot = new THREE.Group()
    anchor.add(orbiterRoot)
    this.lunarOrbiterRoot = orbiterRoot

    for (const orbiter of lunarOrbiters) {
      const orbitalPlane = new THREE.Group()
      orbitalPlane.rotation.z = THREE.MathUtils.degToRad(
        orbiter.inclinationDegrees,
      )
      orbiterRoot.add(orbitalPlane)

      const orbitRadius = moonRadius * orbiter.orbitalRadius
      const pivot = new THREE.Group()
      orbitalPlane.add(pivot)
      const spacecraft = new THREE.Group()
      spacecraft.position.x = orbitRadius
      pivot.add(spacecraft)
      this.addOrbiterSpacecraft(spacecraft, orbiter.id)

      const labelElement = document.createElement('div')
      labelElement.className = 'lunar-orbiter-label'
      labelElement.dataset.orbiterId = orbiter.id
      labelElement.textContent = orbiter.name
      labelElement.setAttribute('aria-hidden', 'true')
      const label = new CSS2DObject(labelElement)
      label.position.set(0, 0.22, 0)
      spacecraft.add(label)
      this.lunarOrbiterLabels.push(label)
      this.lunarOrbiterModels.push({
        pivot,
        spacecraft,
        orbitalPeriodDays: orbiter.orbitalPeriodDays,
        phaseRadians: orbiter.phaseRadians,
      })
      this.lunarOrbiterOrbitLines.push(
        this.addOrbitLine(orbitRadius, orbitalPlane),
      )
    }
  }

  private addOrbiterSpacecraft(parent: THREE.Group, orbiterId: string): void {
    const gold = new THREE.MeshStandardMaterial({
      color: 0xc99a43,
      metalness: 0.72,
      roughness: 0.32,
    })
    const foil = new THREE.MeshStandardMaterial({
      color: 0xe7d39a,
      metalness: 0.58,
      roughness: 0.38,
    })
    const blue = new THREE.MeshStandardMaterial({
      color: 0x28518b,
      metalness: 0.3,
      roughness: 0.48,
      side: THREE.DoubleSide,
    })
    const silver = new THREE.MeshStandardMaterial({
      color: 0xc9d0d9,
      metalness: 0.8,
      roughness: 0.28,
    })
    const dark = new THREE.MeshStandardMaterial({
      color: 0x243142,
      metalness: 0.55,
      roughness: 0.38,
    })

    const addMesh = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position = new THREE.Vector3(),
      rotation = new THREE.Euler(),
    ) => {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      mesh.rotation.copy(rotation)
      parent.add(mesh)
      return mesh
    }
    const addPanel = (
      x: number,
      z: number,
      width: number,
      height: number,
    ) => {
      addMesh(
        new THREE.PlaneGeometry(width, height),
        blue,
        new THREE.Vector3(x, 0, z),
        new THREE.Euler(0, Math.PI / 2, 0),
      )
      for (let index = -1; index <= 1; index += 1) {
        addMesh(
          new THREE.BoxGeometry(0.003, height, 0.002),
          silver,
          new THREE.Vector3(x, 0, z + index * height * 0.25),
        )
      }
      addMesh(
        new THREE.BoxGeometry(0.008, 0.008, height + 0.025),
        foil,
        new THREE.Vector3(x, 0, z),
      )
    }
    const addDish = (position: THREE.Vector3, scale: number) => {
      const dish = addMesh(
        new THREE.SphereGeometry(
          scale,
          12,
          8,
          0,
          Math.PI,
          0,
          Math.PI / 2,
        ),
        silver,
        position,
        new THREE.Euler(0, 0, -Math.PI / 2),
      )
      dish.scale.z = 0.35
      const support = addMesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.065, 5),
        foil,
        position.clone().add(new THREE.Vector3(-scale * 0.8, 0, 0)),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      support.userData.orbiterPart = true
    }

    if (orbiterId === 'lro') {
      addMesh(
        new THREE.CylinderGeometry(0.045, 0.052, 0.14, 8),
        foil,
        new THREE.Vector3(0, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addMesh(
        new THREE.ConeGeometry(0.052, 0.07, 8),
        gold,
        new THREE.Vector3(0.1, 0, 0),
        new THREE.Euler(0, 0, -Math.PI / 2),
      )
      addPanel(-0.03, -0.17, 0.16, 0.12)
      addPanel(-0.03, 0.17, 0.16, 0.12)
      addDish(new THREE.Vector3(0.04, 0.075, 0), 0.058)
      addMesh(
        new THREE.CylinderGeometry(0.009, 0.014, 0.06, 6),
        dark,
        new THREE.Vector3(-0.06, -0.055, 0),
      )
    } else if (orbiterId === 'kaguya') {
      addMesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.12, 10),
        gold,
        new THREE.Vector3(0, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addMesh(
        new THREE.CylinderGeometry(0.035, 0.04, 0.08, 8),
        foil,
        new THREE.Vector3(0.085, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addPanel(-0.015, -0.18, 0.17, 0.1)
      addPanel(-0.015, 0.18, 0.17, 0.1)
      addDish(new THREE.Vector3(0.015, 0.075, 0), 0.045)
      addMesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.23, 5),
        silver,
        new THREE.Vector3(-0.16, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addMesh(
        new THREE.SphereGeometry(0.012, 6, 5),
        dark,
        new THREE.Vector3(-0.28, 0, 0),
      )
    } else {
      addMesh(
        new THREE.CylinderGeometry(0.055, 0.06, 0.09, 8),
        gold,
        new THREE.Vector3(0, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addMesh(
        new THREE.CylinderGeometry(0.038, 0.044, 0.065, 6),
        foil,
        new THREE.Vector3(0.065, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addPanel(-0.01, 0.17, 0.13, 0.16)
      addDish(new THREE.Vector3(0, 0.08, 0), 0.048)
      addMesh(
        new THREE.ConeGeometry(0.02, 0.06, 8),
        dark,
        new THREE.Vector3(-0.08, -0.045, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
      addMesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.1, 5),
        silver,
        new THREE.Vector3(-0.11, 0, 0),
        new THREE.Euler(0, 0, Math.PI / 2),
      )
    }

  }

  private removeLunarOrbiters(): void {
    for (const { pivot } of this.lunarOrbiterModels) {
      pivot.parent?.remove(pivot)
      pivot.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material]
          materials.forEach((material) => material.dispose())
        }
      })
    }
    this.lunarOrbiterModels = []
    this.lunarOrbiterLabels = []
    for (const line of this.lunarOrbiterOrbitLines) {
      line.parent?.remove(line)
      line.geometry.dispose()
      const materials = Array.isArray(line.material)
        ? line.material
        : [line.material]
      materials.forEach((material) => material.dispose())
      const index = this.orbitLines.indexOf(line)
      if (index >= 0) this.orbitLines.splice(index, 1)
    }
    this.lunarOrbiterOrbitLines = []
    this.lunarOrbiterRoot?.parent?.remove(this.lunarOrbiterRoot)
    this.lunarOrbiterRoot = null
  }

  private createBodyLabel(
    model: THREE.Group,
    name: string,
    diameter: number,
  ): void {
    const labelElement = document.createElement('div')
    labelElement.className = 'celestial-body-label'
    labelElement.textContent = name
    labelElement.setAttribute('aria-hidden', 'true')
    const label = new CSS2DObject(labelElement)
    const scale = Math.abs(model.scale.x) || 1
    label.position.set(0, diameter / (2 * scale) + 0.6 / scale, 0)
    model.add(label)
  }

  private createOrbitLines(bodies: SceneBodyModel[]): void {
    for (const body of bodies) {
      const orbitRadius =
        body.visualDistanceFromPrimary ?? body.visualDistanceFromSun
      if (!orbitRadius) continue
      const parent = body.primaryId
        ? this.bodyAnchors.get(body.primaryId)
        : this.scene
      if (parent) {
        this.addOrbitLine(orbitRadius, parent)
      }
    }
  }

  private addOrbitLine(
    radius: number,
    parent: THREE.Object3D,
    center = new THREE.Vector3(),
  ): THREE.LineLoop {
    const points: THREE.Vector3[] = []
    for (let i = 0; i < 128; i += 1) {
      const angle = (i / 128) * Math.PI * 2
      points.push(
        new THREE.Vector3(
          center.x + Math.cos(angle) * radius,
          center.y,
          center.z + Math.sin(angle) * radius,
        ),
      )
    }
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: 0x47658c,
        transparent: true,
        opacity: 0.45,
      }),
    )
    line.visible = this.auxiliaryLinesVisible
    parent.add(line)
    this.orbitLines.push(line)
    return line
  }

  private updateLandmarkLabels(): void {
    if (!this.currentModel || this.activeBodyId !== 'moon') return
    this.currentModel.updateMatrixWorld(true)

    for (const { label, localPosition } of this.landmarkLabels) {
      const normal = localPosition
        .clone()
        .transformDirection(this.currentModel.matrixWorld)
      const worldPosition = localPosition
        .clone()
        .applyMatrix4(this.currentModel.matrixWorld)
      const towardCamera = this.camera.position.clone().sub(worldPosition).normalize()
      label.element.style.display = normal.dot(towardCamera) > 0.08 ? 'flex' : 'none'
    }
  }

  private updateLunarOrbiterLabels(): void {
    for (const label of this.lunarOrbiterLabels) {
      label.element.style.display =
        this.activeBodyId === 'moon' || this.isSystemView ? 'block' : 'none'
    }
  }

  private updateLunarFeatureVisibility(): void {
    const visible = this.activeBodyId === 'moon' || this.isSystemView
    if (this.lunarSurfaceFeatures) {
      this.lunarSurfaceFeatures.visible = visible
    }
    if (this.lunarOrbiterRoot) {
      this.lunarOrbiterRoot.visible = visible
    }
    if (this.locationMarker) {
      this.locationMarker.visible = this.activeBodyId === 'earth'
    }
  }

  private clearSurfaceLocationMarker(): void {
    if (!this.locationMarker) return
    this.locationMarker.parent?.remove(this.locationMarker)
    this.locationMarker.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]
      materials.forEach((material) => material.dispose())
    })
    this.locationMarker = null
    this.locationPulseMaterial = null
  }

  private focusLandmark(landmarkId: string): void {
    const entry = this.landmarkLabels.find(
      ({ landmark }) => landmark.id === landmarkId,
    )
    if (!entry || !this.currentModel) return

    this.currentModel.updateMatrixWorld(true)
    const target = entry.localPosition
      .clone()
      .applyMatrix4(this.currentModel.matrixWorld)
    const offset = this.camera.position.clone().sub(this.controls.target)
    if (offset.lengthSq() === 0) offset.set(0, 0, 1)
    offset.setLength(
      THREE.MathUtils.clamp(
        offset.length(),
        this.controls.minDistance,
        this.controls.maxDistance,
      ),
    )

    this.controls.target.copy(target)
    this.camera.position.copy(target).add(offset)
    this.focusedWorldPosition = target
    this.controls.update()
  }

  private followFocusedLandmark(): void {
    if (!this.focusedWorldPosition || !this.currentModel) return
    const focused = this.landmarkLabels.find(
      ({ landmark }) => landmark.id === this.focusedLandmarkId,
    )
    if (!focused) return

    const nextPosition = focused.localPosition
      .clone()
      .applyMatrix4(this.currentModel.matrixWorld)
    const movement = nextPosition.sub(this.focusedWorldPosition)
    this.camera.position.add(movement)
    this.controls.target.add(movement)
    this.focusedWorldPosition.add(movement)
  }

  private followFocusedBody(): void {
    if (!this.currentModel || !this.focusedBodyWorldPosition) return
    const nextPosition = this.currentModel.getWorldPosition(new THREE.Vector3())
    const movement = nextPosition.sub(this.focusedBodyWorldPosition)
    this.camera.position.add(movement)
    this.controls.target.add(movement)
    this.focusedBodyWorldPosition.add(movement)
  }

  private clearSystem(): void {
    this.clearSurfaceLocationMarker()
    this.removeLunarOrbiters()
    for (const model of this.bodyModels.values()) {
      model.parent?.remove(model)
      this.modelLoader.dispose(model)
    }
    for (const line of this.orbitLines) {
      line.parent?.remove(line)
      line.geometry.dispose()
      const material = line.material
      if (Array.isArray(material)) material.forEach((item) => item.dispose())
      else material.dispose()
    }
    for (const anchor of this.bodyAnchors.values()) {
      anchor.parent?.remove(anchor)
    }
    this.bodyModels.clear()
    this.bodyAnchors.clear()
    this.bodyOrbitPivots.clear()
    this.bodyModelUrls.clear()
    this.bodyDiameters.clear()
    this.bodyRotationPeriods.clear()
    this.bodyOrbitalPeriods.clear()
    this.tidallyLockedBodies.clear()
    this.bodyReplacementSequences.clear()
    this.orbitLines = []
    this.currentModel = null
    this.activeBodyId = ''
    this.isSystemView = false
    this.landmarkLabels = []
    this.lunarSurfaceFeatures = null
    this.lunarOrbiterModels = []
    this.focusedLandmarkId = null
    this.focusedWorldPosition = null
    this.focusedBodyWorldPosition = null
  }

  // 释放所有资源（渲染器、场景对象、监听器）
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }
    this.resizeObserver.disconnect()
    this.clearSystem()
    this.starfield.dispose()
    this.axes.dispose()
    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
    if (this.cssRenderer.domElement.parentNode) {
      this.cssRenderer.domElement.parentNode.removeChild(
        this.cssRenderer.domElement,
      )
    }
  }
}
