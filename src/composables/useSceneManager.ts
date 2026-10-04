import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUniverseStore } from '@/stores/universe'
import { SceneManager, type SceneBodyModel } from '@/three/SceneManager'
import { bodyRegistry } from '@/config/bodies'
import type { TransitionOptions } from '@/animation/paths'

import { advanceSimulationDay } from '@/config/simulation'
import { TimeRecovery } from '@/animation/TimeRecovery'

export function useSceneManager(getTransitionOptions: () => TransitionOptions = () => ({})) {
  const containerRef = ref<HTMLElement | null>(null)
  const store = useUniverseStore()
  const route = useRoute()
  const router = useRouter()
  const { t, locale } = useI18n()

  let sceneManager: SceneManager | null = null
  let loadingPromise: Promise<void> | null = null
  let navigationSequence = 0
  let animationFrameId: number | null = null
  let previousFrameTime: number | null = null
  let hiddenAt: number | null = null
  let hiddenTargetDay = store.simulationDay
  let hiddenSpeed = store.simulationSpeed
  let hiddenRunning = false
  let recovery: TimeRecovery | null = null

  function updateSelectedCoordinates(): void {
    const coordinates = sceneManager?.getBodyCoordinates(store.currentBodyId)
    if (!coordinates) return
    store.simulationCoordinates = {
      x: coordinates.x,
      y: coordinates.y,
      z: coordinates.z,
    }
  }

  function advanceVisibleTime(timestamp: number): void {
    if (previousFrameTime !== null && store.isTimePlaying && !loadingPromise) {
      const elapsedSeconds = Math.max(0, (timestamp - previousFrameTime) / 1000)
      store.simulationDay = advanceSimulationDay(store.simulationDay, elapsedSeconds, store.simulationSpeed)
    }
    if (recovery) {
      store.simulationDay += recovery.step(timestamp)
      if (recovery.complete) recovery = null
    }
    previousFrameTime = timestamp
  }

  function animateTime(): void {
    if (document.hidden) {
      handleVisibilityChange()
      return
    }
    advanceVisibleTime(Date.now())
    animationFrameId = requestAnimationFrame(animateTime)
  }

  function accumulateHiddenTime(now: number): void {
    if (hiddenAt !== null && hiddenRunning) {
      hiddenTargetDay = advanceSimulationDay(hiddenTargetDay, Math.max(0, now - hiddenAt) / 1000, hiddenSpeed)
    }
    hiddenAt = now
  }

  function handleVisibilityChange(): void {
    const now = Date.now()
    if (document.hidden) {
      if (hiddenAt !== null) return
      advanceVisibleTime(now)
      hiddenTargetDay = store.simulationDay + (recovery?.remaining ?? 0)
      recovery = null
      hiddenAt = now
      hiddenSpeed = store.simulationSpeed
      hiddenRunning = store.isTimePlaying && !store.modelLoading
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      animationFrameId = null
      sceneManager?.pauseRendering()
    } else {
      if (hiddenAt === null) return
      accumulateHiddenTime(now)
      const correction = hiddenTargetDay - store.simulationDay
      hiddenAt = null
      previousFrameTime = now
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        store.simulationDay = hiddenTargetDay
      } else {
        recovery = new TimeRecovery(correction, now)
      }
      sceneManager?.resumeRendering()
      animationFrameId = requestAnimationFrame(animateTime)
    }
  }

  watch(
    [() => store.isTimePlaying, () => store.simulationSpeed, () => store.modelLoading],
    () => {
      const now = Date.now()
      if (hiddenAt !== null) {
        accumulateHiddenTime(now)
        hiddenSpeed = store.simulationSpeed
        hiddenRunning = store.isTimePlaying && !store.modelLoading
      } else {
        previousFrameTime = now
        recovery = null
      }
    },
    { flush: 'sync' },
  )

  function createSceneBody(
    bodyId: string,
    modelUrl = bodyRegistry.bodies[bodyId].variants.find(
      ({ id }) => id === bodyRegistry.bodies[bodyId].defaultVariantId,
    )!.modelUrl,
  ): SceneBodyModel {
    const body = bodyRegistry.bodies[bodyId]
    return {
      id: body.id,
      modelUrl,
      visualDiameter: body.visualDiameter ?? 12,
      visualDistanceFromSun: body.visualDistanceFromSun ?? 0,
      visualDistanceFromPrimary: body.visualDistanceFromPrimary,
      primaryId: body.primaryId,
      rotationPeriodDays: body.rotationPeriodDays ?? 1,
      orbitalPeriodDays: body.orbitalPeriodDays ?? 0,
      orbitalEccentricity: body.orbitalEccentricity ?? 0,
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
    sceneManager.setTransitionOptions(getTransitionOptions())
    sceneManager.setDarkSideBrightness(store.darkSideBrightness)
    sceneManager.init()
    sceneManager.setAuxiliaryLinesVisible(store.auxiliaryLinesVisible)
    sceneManager.setZenMode(store.isZenMode)
    store.setSceneReady(true)
    store.startModelLoading('loading.initialLoad')

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
        store.cameraDistance = sceneManager.setActiveBody(store.currentBodyId, true)
        sceneManager.setSurfaceLocation(store.surfaceLocation)
        sceneManager.setFocusedLandmark(store.selectedLandmarkId)
        updateSelectedCoordinates()
        store.isTimePlaying = true
        store.locateCurrentPosition()
      })
      .catch((err) => {
        console.error('天体场景加载失败:', err)
      })
      .finally(() => {
        store.finishModelLoading()
        if (loadingPromise === initialLoad) loadingPromise = null
      })
    loadingPromise = initialLoad
    document.addEventListener('visibilitychange', handleVisibilityChange)
    if (document.hidden) handleVisibilityChange()
    else animationFrameId = requestAnimationFrame(animateTime)
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
    () => store.darkSideBrightness,
    (brightness) => sceneManager?.setDarkSideBrightness(brightness),
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
    () => store.locationFocusKey,
    async () => {
      if (loadingPromise) await loadingPromise
      if (!sceneManager) return
      store.isZenMode = false
      await router.push({ name: 'body', params: { bodyId: 'earth' } })
      await navigateToSelection()
      if (!sceneManager || store.currentBodyId !== 'earth') return
      sceneManager.setSurfaceLocation(store.surfaceLocation)
      const distance = sceneManager.focusSurfaceLocation()
      if (distance !== null) store.cameraDistance = distance
    },
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

  watch(locale, () => sceneManager?.refreshLocaleLabels())
  watch(getTransitionOptions, (options) => sceneManager?.setTransitionOptions(options), { deep: true })

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

    store.startModelLoading('loading.modelLoad', {
      name: t(`bodies.${body.id}.variants.${variant.id}.name`),
    })
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
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    recovery = null
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
    }
    sceneManager?.dispose()
    sceneManager = null
  })

  return { containerRef }
}
