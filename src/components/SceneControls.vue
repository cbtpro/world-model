<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useUniverseStore } from '@/stores/universe'

const store = useUniverseStore()
const router = useRouter()
const { t } = useI18n()
const isCollapsed = ref(false)
const isLocating = ref(false)
const locationMessage = ref('')
const dayToDate = (day: number) =>
  new Date(day * 86_400_000).toISOString().replace('T', ' ').slice(0, 16)
const simulationDate = computed(() => {
  return `${dayToDate(store.simulationDay)} UTC`
})
const startDate = computed(() =>
  dayToDate(store.simulationStartDay - 365.25).slice(0, 10),
)
const endDate = computed(() =>
  dayToDate(store.simulationStartDay + 365.25).slice(0, 10),
)

function changeZoom(amount: number) {
  store.cameraDistance = Math.min(
    300,
    Math.max(1, store.cameraDistance + amount),
  )
}

function locateCurrentPosition(): void {
  locationMessage.value = ''
  if (!window.isSecureContext) {
    locationMessage.value = t('controls.locateNeedsHttps')
    return
  }
  if (!navigator.geolocation) {
    locationMessage.value = t('controls.locateUnsupported')
    return
  }

  isLocating.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      store.surfaceLocation = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
      locationMessage.value = t('controls.locateSuccess', {
        lat: coords.latitude.toFixed(4),
        lng: coords.longitude.toFixed(4),
      })
      isLocating.value = false
      void router.push({ name: 'body', params: { bodyId: 'earth' } })
    },
    (error) => {
      locationMessage.value =
        error.code === error.PERMISSION_DENIED
          ? t('controls.locateDenied')
          : error.code === error.TIMEOUT
            ? t('controls.locateTimeout')
            : t('controls.locateFailed')
      isLocating.value = false
    },
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
  )
}
</script>

<template>
  <section
    class="scene-controls"
    :class="{ collapsed: isCollapsed }"
    :aria-label="t('controls.panelLabel')"
  >
    <header class="controls-header">
      <h2>{{ t('controls.title') }}</h2>
      <button
        type="button"
        class="collapse-button"
        :aria-expanded="!isCollapsed"
        :aria-label="isCollapsed ? t('controls.expandAria') : t('controls.collapseAria')"
        @click="isCollapsed = !isCollapsed"
      >
        <span aria-hidden="true">{{ isCollapsed ? t('controls.expand') : t('controls.collapse') }}</span>
        <span class="collapse-icon" aria-hidden="true">
          {{ isCollapsed ? '⌃' : '⌄' }}
        </span>
      </button>
    </header>

    <div v-show="!isCollapsed" class="controls-content">
    <div class="control-row">
      <label for="camera-distance">{{ t('controls.distance') }}</label>
      <div class="range-control">
        <button type="button" :aria-label="t('controls.zoomInAria')" @click="changeZoom(-10)">−</button>
        <input
          id="camera-distance"
          v-model.number="store.cameraDistance"
          type="range"
          min="1"
          max="300"
          step="1"
        >
        <button type="button" :aria-label="t('controls.zoomOutAria')" @click="changeZoom(10)">+</button>
      </div>
    </div>

    <div class="time-header">
      <div>
        <label for="simulation-time">{{ t('controls.simulationTime') }}</label>
        <output>{{ simulationDate }}</output>
      </div>
    </div>

    <div class="timeline-player">
      <button
        type="button"
        class="playback-button"
        :aria-label="store.isTimePlaying ? t('controls.pauseTime') : t('controls.playTime')"
        :title="store.isTimePlaying ? t('controls.pauseTime') : t('controls.playTime')"
        :aria-pressed="store.isTimePlaying"
        @click="store.isTimePlaying = !store.isTimePlaying"
      >
        <svg v-if="store.isTimePlaying" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 4.5v15l12-7.5z" />
        </svg>
      </button>
      <input
        id="simulation-time"
        v-model.number="store.simulationDay"
        type="range"
        :min="store.simulationStartDay - 365.25"
        :max="store.simulationStartDay + 365.25"
        step="0.00001"
        :aria-label="t('controls.timelineAria')"
        @input="store.isTimePlaying = false"
      >
    </div>
    <div class="timeline-range">
      <span>{{ startDate }}</span>
      <span>{{ endDate }}</span>
    </div>

    <div class="control-row">
      <div class="speed-label">
        <label for="simulation-speed">{{ t('controls.speed') }}</label>
        <output>{{ t('controls.speedUnit', { speed: store.simulationSpeed }) }}</output>
      </div>
      <input
        id="simulation-speed"
        v-model.number="store.simulationSpeed"
        type="range"
        min="0.1"
        max="1000"
        step="0.1"
      >
    </div>

    <div class="coordinates" aria-live="polite">
      <span>{{ t('controls.coordinatesLabel', { name: t(`bodies.${store.currentBodyId}.name`) }) }}</span>
      <code>
        X {{ store.simulationCoordinates.x.toFixed(2) }}
        · Y {{ store.simulationCoordinates.y.toFixed(2) }}
        · Z {{ store.simulationCoordinates.z.toFixed(2) }}
      </code>
    </div>

    <label class="toggle-row" for="auxiliary-lines">
      <span>{{ t('controls.auxiliaryLines') }}</span>
      <input
        id="auxiliary-lines"
        v-model="store.auxiliaryLinesVisible"
        type="checkbox"
      >
    </label>

    <div class="actions">
      <button
        type="button"
        class="action-button"
        @click="store.simulationDay = store.simulationStartDay"
      >
        {{ t('controls.backToNow') }}
      </button>
      <button type="button" class="action-button reset-button" @click="store.resetView">
        {{ t('controls.resetView') }}
      </button>
    </div>
    <div class="location-control">
      <button
        type="button"
        class="action-button location-button"
        :disabled="isLocating"
        @click="locateCurrentPosition"
      >
        {{ isLocating ? t('controls.locating') : t('controls.locateButton') }}
      </button>
      <p v-if="locationMessage" class="location-message" aria-live="polite">
        {{ locationMessage }}
      </p>
    </div>
    </div>
  </section>
</template>

<style scoped>
.scene-controls {
  width: 260px;
  max-height: calc(100vh - 56px);
  overflow-y: auto;
  padding: 0 16px 14px;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  pointer-events: auto;
}

.controls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
}

.scene-controls.collapsed {
  padding-bottom: 0;
}

.controls-content {
  padding-bottom: 1px;
}

h2 {
  font-size: 14px;
  font-weight: 600;
}

.collapse-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 7px;
  color: var(--color-text-dim);
  background: rgba(40, 60, 90, 0.65);
  border: 1px solid var(--color-border);
  font-size: 11px;
}

.collapse-button:hover {
  color: var(--color-text);
  background: var(--color-accent-dim);
}

.collapse-icon {
  font-size: 14px;
  line-height: 1;
}

.control-row {
  display: grid;
  gap: 7px;
  margin-top: 12px;
}

.time-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.time-header > div {
  display: grid;
  gap: 4px;
}

.timeline-player {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.timeline-player input {
  flex: 1;
  min-width: 0;
}

.playback-button {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  color: #fff;
  background: var(--color-accent-dim);
  border: 1px solid var(--color-border);
}

.playback-button:hover {
  background: var(--color-accent);
}

.playback-button svg {
  width: 17px;
  height: 17px;
  fill: currentColor;
}

output,
.timeline-range,
.coordinates {
  color: var(--color-text-dim);
  font-size: 11px;
}

.timeline-range {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.speed-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.coordinates {
  display: grid;
  gap: 5px;
  margin-top: 12px;
  line-height: 1.5;
}

.coordinates code {
  color: var(--color-text);
  font-size: 10px;
}

label {
  color: var(--color-text-dim);
  font-size: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  cursor: pointer;
}

input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
}

input[type='range'] {
  width: 100%;
  accent-color: var(--color-accent);
}

.range-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-control input {
  flex: 1;
}

.range-control button,
.action-button {
  min-height: 30px;
  padding: 5px 9px;
  color: var(--color-text);
  background: rgba(40, 60, 90, 0.65);
  border: 1px solid var(--color-border);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.location-control {
  margin-top: 10px;
}

.location-button {
  width: 100%;
}

.location-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.location-message {
  margin-top: 6px;
  color: var(--color-text-dim);
  font-size: 10px;
  line-height: 1.4;
}

.action-button {
  flex: 1;
}

.action-button:hover,
.range-control button:hover {
  background: var(--color-accent-dim);
}

.reset-button {
  color: #fff;
  background: var(--color-accent-dim);
}
</style>
