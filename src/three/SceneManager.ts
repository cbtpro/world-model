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

const LANDMARK_SURFACE_OFFSET = 0.08

export interface SceneBodyModel {
  id: string
  name: string
  modelUrl: string
  visualDiameter: number
  visualDistanceFromSun: number
  visualDistanceFromPrimary?: number
  primaryId?: string
  rotationSpeed: number
  orbitalSpeed: number
  includeLunarLandmarks?: boolean
}

interface LandmarkLabel {
  landmark: LunarLandmark
  label: CSS2DObject
  localPosition: THREE.Vector3
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
  private modelLoader: ModelLoader
  private currentModel: THREE.Group | null = null
  private bodyModels = new Map<string, THREE.Group>()
  private bodyAnchors = new Map<string, THREE.Group>()
  private bodyPositions = new Map<string, THREE.Vector3>()
  private bodyModelUrls = new Map<string, string>()
  private bodyDiameters = new Map<string, number>()
  private bodyRotationSpeeds = new Map<string, number>()
  private bodyOrbitalSpeeds = new Map<string, number>()
  private activeBodyId = ''
  private isSystemView = false
  private orbitLines: THREE.LineLoop[] = []
  private focusedBodyWorldPosition: THREE.Vector3 | null = null
  private animationId: number | null = null
  private resizeObserver: ResizeObserver
  private landmarkLabels: LandmarkLabel[] = []
  private focusedLandmarkId: string | null = null
  private focusedWorldPosition: THREE.Vector3 | null = null

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

    // 灯光：环境光（暗面微亮）+ 方向光（模拟阳光）
    this.scene.add(new THREE.AmbientLight(0x404060, 1.2))
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5)
    sunLight.position.set(50, 30, 40)
    this.scene.add(sunLight)

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
        parentAnchor.add(anchor)
        anchor.position.copy(this.bodyPositions.get(body.primaryId!)!)
      } else {
        this.scene.add(anchor)
      }

      const position = new THREE.Vector3(
        body.primaryId
          ? body.visualDistanceFromPrimary ?? 0
          : body.visualDistanceFromSun,
        0,
        0,
      )
      const model = await this.modelLoader.load(
        body.modelUrl,
        (progress) =>
          onProgress?.(((loadedCount + progress / 100) / bodies.length) * 100),
        body.visualDiameter,
      )
      model.position.copy(position)
      anchor.add(model)
      this.bodyAnchors.set(body.id, anchor)
      this.bodyPositions.set(body.id, position)
      this.bodyModels.set(body.id, model)
      this.bodyModelUrls.set(body.id, body.modelUrl)
      this.bodyDiameters.set(body.id, body.visualDiameter)
      this.bodyRotationSpeeds.set(body.id, body.rotationSpeed)
      this.bodyOrbitalSpeeds.set(body.id, body.orbitalSpeed)
      if (body.includeLunarLandmarks) {
        this.createLandmarkLabels(model, body.visualDiameter)
      }
      this.createBodyLabel(model, body.name, body.visualDiameter)
      loadedCount += 1
      onProgress?.((loadedCount / bodies.length) * 100)
    }

    this.createOrbitLines(bodies)
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

    const position = this.bodyPositions.get(body.id)
    if (!position) throw new Error(`找不到天体「${body.id}」的场景坐标`)
    anchor.remove(previous)
    this.modelLoader.dispose(previous)
    if (body.id === 'moon') this.landmarkLabels = []

    const model = await this.modelLoader.load(
      body.modelUrl,
      onProgress,
      body.visualDiameter,
    )
    model.position.copy(position)
    anchor.add(model)
    this.bodyModels.set(body.id, model)
    this.bodyModelUrls.set(body.id, body.modelUrl)
    this.bodyDiameters.set(body.id, body.visualDiameter)
    this.bodyRotationSpeeds.set(body.id, body.rotationSpeed)
    if (body.includeLunarLandmarks) {
      this.createLandmarkLabels(model, body.visualDiameter)
    }
    this.createBodyLabel(model, body.name, body.visualDiameter)
    if (this.activeBodyId === body.id) {
      this.currentModel = model
      model.updateMatrixWorld(true)
      if (this.focusedLandmarkId) this.focusLandmark(this.focusedLandmarkId)
    }
  }

  getBodyModelUrl(bodyId: string): string | undefined {
    return this.bodyModelUrls.get(bodyId)
  }

  setActiveBody(bodyId: string): number {
    const model = this.bodyModels.get(bodyId)
    if (!model) throw new Error(`场景中不存在天体「${bodyId}」`)
    this.isSystemView = false
    this.activeBodyId = bodyId
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

  // 设置当前选中天体的自转速度
  setRotationSpeed(speed: number): void {
    this.bodyRotationSpeeds.set(this.activeBodyId, speed)
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
      for (const [bodyId, model] of this.bodyModels) {
        model.rotation.y += this.bodyRotationSpeeds.get(bodyId) ?? 0
      }
      for (const [bodyId, anchor] of this.bodyAnchors) {
        anchor.rotation.y += this.bodyOrbitalSpeeds.get(bodyId) ?? 0
      }
      this.updateLandmarkLabels()
      if (this.focusedWorldPosition) this.followFocusedLandmark()
      else this.followFocusedBody()
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.cssRenderer.render(this.scene, this.camera)
    }
    animate()
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
      if (body.visualDistanceFromSun > 0) {
        this.addOrbitLine(body.visualDistanceFromSun, this.scene)
      }
      if (body.primaryId && body.visualDistanceFromPrimary) {
        const parentAnchor = this.bodyAnchors.get(body.primaryId)
        const center = this.bodyPositions.get(body.primaryId)
        if (parentAnchor && center) {
          this.addOrbitLine(
            body.visualDistanceFromPrimary,
            parentAnchor,
            center,
          )
        }
      }
    }
  }

  private addOrbitLine(
    radius: number,
    parent: THREE.Object3D,
    center = new THREE.Vector3(),
  ): void {
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
    parent.add(line)
    this.orbitLines.push(line)
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
    this.bodyPositions.clear()
    this.bodyModelUrls.clear()
    this.bodyDiameters.clear()
    this.bodyRotationSpeeds.clear()
    this.bodyOrbitalSpeeds.clear()
    this.orbitLines = []
    this.currentModel = null
    this.activeBodyId = ''
    this.isSystemView = false
    this.landmarkLabels = []
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
