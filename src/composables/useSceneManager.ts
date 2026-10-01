import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUniverseStore } from '@/stores/universe'
import { SceneManager, type SceneBodyModel } from '@/three/SceneManager'
import { bodyRegistry } from '@/config/bodies'

export function useSceneManager() {
  const containerRef = ref<HTMLElement | null>(null)
  const store = useUniverseStore()
  const route = useRoute()

  let sceneManager: SceneManager | null = null
  let loadingPromise: Promise<void> | null = null
  let navigationSequence = 0

  function createSceneBody(
    bodyId: string,
    modelUrl = bodyRegistry.bodies[bodyId].variants.find(
      ({ id }) => id === bodyRegistry.bodies[bodyId].defaultVariantId,
    )!.modelUrl,
  ): SceneBodyModel {
    const body = bodyRegistry.bodies[bodyId]
    return {
      id: body.id,
      name: body.name,
      modelUrl,
      visualDiameter: body.visualDiameter ?? 12,
      visualDistanceFromSun: body.visualDistanceFromSun ?? 0,
      visualDistanceFromPrimary: body.visualDistanceFromPrimary,
      primaryId: body.primaryId,
      rotationSpeed: body.rotationSpeed ?? 0,
      orbitalSpeed: body.visualOrbitalSpeed ?? 0,
      includeLunarLandmarks: body.id === 'moon',
    }
  }

  onMounted(() => {
    const bodyId = route.params.bodyId as string
    const variantId = route.params.variantId as string | undefined
    store.setSelection(bodyId, variantId)

    if (!containerRef.value) return
    store.setScenePhase()
    sceneManager = new SceneManager(containerRef.value)
    sceneManager.init()
    store.setSceneReady(true)
    store.startModelLoading('加载太阳、地球与月球')

    const bodies = bodyRegistry.list.map((body) =>
      createSceneBody(
        body.id,
        body.id === store.currentBodyId
          ? store.currentVariant.modelUrl
          : undefined,
      ),
    )
    const initialLoad = sceneManager
      .loadSystem(bodies, (progress) => {
        store.updateLoadingProgress(progress)
      })
      .then(() => {
        if (!sceneManager) return
        sceneManager.setActiveBody(store.currentBodyId)
        store.cameraDistance = sceneManager.resetView()
        sceneManager.setFocusedLandmark(store.selectedLandmarkId)
        sceneManager.setRotationSpeed(
          store.rotationPaused ? 0 : store.rotationSpeed,
        )
      })
      .catch((err) => {
        console.error('天体场景加载失败:', err)
      })
      .finally(() => {
        store.finishModelLoading()
        if (loadingPromise === initialLoad) loadingPromise = null
      })
    loadingPromise = initialLoad
  })

  watch(
    () => [route.params.bodyId, route.params.variantId],
    ([bodyId, variantId]) => {
      if (typeof bodyId !== 'string') return
      store.setSelection(
        bodyId,
        typeof variantId === 'string' ? variantId : undefined,
      )
      void navigateToSelection()
    },
  )

  watch(
    () => store.cameraDistance,
    (distance) => sceneManager?.setCameraDistance(distance),
  )

  watch(
    () => store.rotationSpeed,
    (speed) => sceneManager?.setRotationSpeed(store.rotationPaused ? 0 : speed),
  )

  watch(
    () => store.rotationPaused,
    (paused) =>
      sceneManager?.setRotationSpeed(paused ? 0 : store.rotationSpeed),
  )

  watch(
    () => store.viewResetKey,
    () => {
      const distance = sceneManager?.resetView()
      if (distance !== undefined) store.cameraDistance = distance
    },
  )

  watch(
    () => store.selectedLandmarkId,
    (landmarkId) => sceneManager?.setFocusedLandmark(landmarkId),
  )

  async function navigateToSelection(): Promise<void> {
    const sequence = ++navigationSequence
    if (loadingPromise) await loadingPromise
    if (sequence !== navigationSequence || !sceneManager) return

    const body = store.currentBody
    const variant = store.currentVariant
    store.cameraDistance = sceneManager.setActiveBody(body.id)
    sceneManager.setRotationSpeed(
      store.rotationPaused ? 0 : store.rotationSpeed,
    )
    sceneManager.setFocusedLandmark(store.selectedLandmarkId)
    if (sceneManager.getBodyModelUrl(body.id) === variant.modelUrl) return

    store.startModelLoading(`加载「${variant.name}」模型`)
    const modelLoad = sceneManager
      .replaceBodyModel(
        createSceneBody(body.id, variant.modelUrl),
        (progress) => store.updateLoadingProgress(progress),
      )
      .then(() => {
        if (sequence === navigationSequence) {
          sceneManager?.setFocusedLandmark(store.selectedLandmarkId)
        }
      })
      .catch((err) => {
        console.error('模型加载失败:', err)
      })
      .finally(() => {
        if (loadingPromise === modelLoad) {
          loadingPromise = null
          store.finishModelLoading()
        }
      })
    loadingPromise = modelLoad
    await modelLoad
  }

  onUnmounted(() => {
    sceneManager?.dispose()
    sceneManager = null
  })

  return { containerRef }
}
