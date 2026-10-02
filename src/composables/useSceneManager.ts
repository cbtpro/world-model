import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUniverseStore } from '@/stores/universe'
import { SceneManager, type SceneBodyModel } from '@/three/SceneManager'
import { bodyRegistry } from '@/config/bodies'

const SECONDS_PER_DAY = 86_400

export function useSceneManager() {
  const containerRef = ref<HTMLElement | null>(null)
  const store = useUniverseStore()
  const route = useRoute()

  let sceneManager: SceneManager | null = null
  let loadingPromise: Promise<void> | null = null
  let navigationSequence = 0
  let animationFrameId: number | null = null
  let previousFrameTime: number | null = null

  function updateSelectedCoordinates(): void {
    const coordinates = sceneManager?.getBodyCoordinates(store.currentBodyId)
    if (!coordinates) return
    store.simulationCoordinates = {
      x: coordinates.x,
      y: coordinates.y,
      z: coordinates.z,
    }
  }

  function animateTime(timestamp: number): void {
    if (previousFrameTime !== null && store.isTimePlaying && !loadingPromise) {
      const elapsedSeconds = (timestamp - previousFrameTime) / 1000
      store.simulationDay +=
        (elapsedSeconds * store.simulationSpeed) / SECONDS_PER_DAY
    }
    previousFrameTime = timestamp
    animationFrameId = requestAnimationFrame(animateTime)
  }

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
      rotationPeriodDays: body.rotationPeriodDays ?? 1,
      orbitalPeriodDays: body.orbitalPeriodDays ?? 0,
      tidallyLockedToPrimary: body.tidallyLockedToPrimary,
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
    sceneManager.setAuxiliaryLinesVisible(store.auxiliaryLinesVisible)
    sceneManager.setZenMode(store.isZenMode)
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
        sceneManager.setSimulationTime(store.simulationDay)
        store.cameraDistance = sceneManager.setActiveBody(store.currentBodyId)
        sceneManager.setSurfaceLocation(store.surfaceLocation)
        sceneManager.setFocusedLandmark(store.selectedLandmarkId)
        updateSelectedCoordinates()
        store.isTimePlaying = true
      })
      .catch((err) => {
        console.error('天体场景加载失败:', err)
      })
      .finally(() => {
        store.finishModelLoading()
        if (loadingPromise === initialLoad) loadingPromise = null
      })
    loadingPromise = initialLoad
    animationFrameId = requestAnimationFrame(animateTime)
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
    () => store.simulationDay,
    (day) => {
      sceneManager?.setSimulationTime(day)
      updateSelectedCoordinates()
    },
  )

  watch(
    () => store.currentBodyId,
    updateSelectedCoordinates,
  )

  watch(
    () => store.cameraDistance,
    (distance) => sceneManager?.setCameraDistance(distance),
  )

  watch(
    () => store.auxiliaryLinesVisible,
    (visible) => sceneManager?.setAuxiliaryLinesVisible(visible),
  )

  watch(
    () => store.isZenMode,
    (enabled) => sceneManager?.setZenMode(enabled),
  )

  watch(
    () => store.surfaceLocation,
    (location) => sceneManager?.setSurfaceLocation(location),
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
    sceneManager.setSimulationTime(store.simulationDay)
    sceneManager.setFocusedLandmark(store.selectedLandmarkId)
    updateSelectedCoordinates()
    if (sceneManager.getBodyModelUrl(body.id) === variant.modelUrl) return

    store.startModelLoading(`加载「${variant.name}」模型`)
    const modelLoad = sceneManager
      .replaceBodyModel(
        createSceneBody(body.id, variant.modelUrl),
        (progress) => store.updateLoadingProgress(progress),
      )
      .then(() => {
        if (sequence === navigationSequence) {
          sceneManager?.setSimulationTime(store.simulationDay)
          sceneManager?.setFocusedLandmark(store.selectedLandmarkId)
          updateSelectedCoordinates()
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
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
    sceneManager?.dispose()
    sceneManager = null
  })

  return { containerRef }
}
