import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { Starfield } from './Starfield'
import { UniverseAxes } from './UniverseAxes'
import { ModelLoader } from './ModelLoader'
import type { ProgressCallback } from './types'

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
  private rotationSpeed = 0
  private animationId: number | null = null
  private resizeObserver: ResizeObserver

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
    this.controls.minDistance = 12
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

  // 加载模型并添加到场景（先释放旧模型）
  async loadModel(
    url: string,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    this.removeCurrentModel()
    const model = await this.modelLoader.load(url, onProgress)
    this.currentModel = model
    this.scene.add(model)
  }

  // 设置模型自转速度
  setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed
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
      if (this.currentModel && this.rotationSpeed) {
        this.currentModel.rotation.y += this.rotationSpeed
      }
      this.controls.update()
      this.renderer.render(this.scene, this.camera)
      this.cssRenderer.render(this.scene, this.camera)
    }
    animate()
  }

  private removeCurrentModel(): void {
    if (this.currentModel) {
      this.scene.remove(this.currentModel)
      this.modelLoader.disposeCurrent()
      this.currentModel = null
    }
  }

  // 释放所有资源（渲染器、场景对象、监听器）
  dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
    }
    this.resizeObserver.disconnect()
    this.removeCurrentModel()
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
