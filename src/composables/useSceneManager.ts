import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUniverseStore } from '@/stores/universe'
import { SceneManager } from '@/three/SceneManager'

// 组合式函数：桥接 Vue 响应式与 SceneManager 命令式对象
// 职责：1) 同步路由参数到 store；2) 挂载/卸载 SceneManager；3) 监听选择变化触发模型加载
export function useSceneManager() {
  // canvas 容器的模板引用，由调用方绑定到 <div ref="containerRef">
  const containerRef = ref<HTMLElement | null>(null)

  const store = useUniverseStore()
  const route = useRoute()

  let sceneManager: SceneManager | null = null
  let loadingPromise: Promise<void> | null = null

  // 初始选择 + 场景初始化 + 初始模型加载
  onMounted(() => {
    // 从路由参数初始化选择（路由守卫已校验合法性）
    const bodyId = route.params.bodyId as string
    const variantId = route.params.variantId as string | undefined
    store.setSelection(bodyId, variantId)

    if (!containerRef.value) return
    // 初始化场景（星空 + 坐标系 + 灯光 + 渲染循环）
    store.setScenePhase()
    sceneManager = new SceneManager(containerRef.value)
    sceneManager.init()
    store.setSceneReady(true)
    // 加载初始模型
    void loadCurrentModel()
  })

  // 后续路由变化 → 同步选择 → 变体 watch 接力触发模型加载
  watch(
    () => route.params,
    (params) => {
      const bodyId = params.bodyId as string
      const variantId = params.variantId as string | undefined
      store.setSelection(bodyId, variantId)
    },
  )

  // 变体变化 → 重新加载模型
  watch(
    () => store.currentVariant,
    () => {
      void loadCurrentModel()
    },
  )

  watch(
    () => store.selectedLandmarkId,
    (landmarkId) => {
      sceneManager?.setFocusedLandmark(landmarkId)
    },
  )

  // 加载当前选中的模型变体
  async function loadCurrentModel(): Promise<void> {
    if (!sceneManager) return

    // 等待上一个加载完成，避免并发加载导致模型叠加
    if (loadingPromise) {
      await loadingPromise
    }

    const variant = store.currentVariant
    store.startModelLoading(`加载「${variant.name}」模型`)
    loadingPromise = sceneManager
      .loadModel(variant.modelUrl, (progress) => {
        store.updateLoadingProgress(progress)
      }, store.currentBodyId === 'moon')
      .then(() => {
        sceneManager?.setRotationSpeed(
          store.currentBody.rotationSpeed ?? 0,
        )
        sceneManager?.setFocusedLandmark(store.selectedLandmarkId)
      })
      .catch((err) => {
        console.error('模型加载失败:', err)
      })
      .finally(() => {
        store.finishModelLoading()
        loadingPromise = null
      })

    return loadingPromise
  }

  onUnmounted(() => {
    sceneManager?.dispose()
    sceneManager = null
  })

  return { containerRef }
}
