import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bodyRegistry, DEFAULT_BODY_ID } from '@/config/bodies'
import type { CelestialBody, CelestialVariant } from '@/config/bodies/types'
import { lunarLandmarks } from '@/config/lunarLandmarks'

// 加载阶段类型
export type LoadingPhase = 'scene' | 'model' | 'idle'

// Pinia store：管理当前选择的天体/变体 + 加载状态
export const useUniverseStore = defineStore('universe', () => {
  // ---- 选择状态 ----
  const currentBodyId = ref<string>(DEFAULT_BODY_ID)
  const currentVariantId = ref<string>(
    bodyRegistry.bodies[DEFAULT_BODY_ID].defaultVariantId,
  )
  const selectedLandmarkId = ref<string | null>(null)
  const selectedLandmark = computed(
    () => lunarLandmarks.find(({ id }) => id === selectedLandmarkId.value) ?? null,
  )

  // ---- 加载状态 ----
  const sceneReady = ref(false)
  const modelLoading = ref(false)
  const loadingPhase = ref<LoadingPhase>('scene')
  const loadingProgress = ref(0) // 0-100
  const loadingMessage = ref('')

  // ---- 计算属性 ----
  const currentBody = computed<CelestialBody>(
    () => bodyRegistry.bodies[currentBodyId.value],
  )
  const currentVariant = computed<CelestialVariant>(() => {
    const body = currentBody.value
    return (
      body.variants.find((v) => v.id === currentVariantId.value) ??
      body.variants.find((v) => v.id === body.defaultVariantId)!
    )
  })
  const isLoading = computed(
    () => loadingPhase.value !== 'idle' || modelLoading.value,
  )

  // ---- Actions ----
  /** 由路由参数驱动选择 */
  function setSelection(bodyId: string, variantId?: string) {
    const body = bodyRegistry.bodies[bodyId]
    if (!body) return
    currentBodyId.value = bodyId
    currentVariantId.value = variantId ?? body.defaultVariantId
    if (bodyId !== 'moon') selectedLandmarkId.value = null
  }

  function selectLandmark(id: string) {
    if (lunarLandmarks.some((landmark) => landmark.id === id)) {
      selectedLandmarkId.value = id
    }
  }

  function setSceneReady(ready: boolean) {
    sceneReady.value = ready
  }

  function startModelLoading(message: string) {
    modelLoading.value = true
    loadingPhase.value = 'model'
    loadingProgress.value = 0
    loadingMessage.value = message
  }

  function updateLoadingProgress(progress: number) {
    loadingProgress.value = Math.min(100, Math.max(0, progress))
  }

  function finishModelLoading() {
    modelLoading.value = false
    loadingPhase.value = 'idle'
    loadingProgress.value = 100
    loadingMessage.value = ''
  }

  function setScenePhase() {
    loadingPhase.value = 'scene'
    loadingProgress.value = 0
    loadingMessage.value = '初始化宇宙场景'
  }

  return {
    currentBodyId,
    currentVariantId,
    selectedLandmarkId,
    selectedLandmark,
    sceneReady,
    modelLoading,
    loadingPhase,
    loadingProgress,
    loadingMessage,
    currentBody,
    currentVariant,
    isLoading,
    setSelection,
    selectLandmark,
    setSceneReady,
    startModelLoading,
    updateLoadingProgress,
    finishModelLoading,
    setScenePhase,
  }
})
