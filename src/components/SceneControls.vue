<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import { useUniverseStore } from '@/stores/universe'
import BodySelector from '@/components/BodySelector.vue'
import LandmarkNavigator from '@/components/LandmarkNavigator.vue'
import VariantSelector from '@/components/VariantSelector.vue'
import { SECONDS_PER_DAY, MAX_SIMULATION_SPEED, ORBIT_DEMO_SPEED, SPEED_PRESETS } from '@/config/simulation'

const store = useUniverseStore()
const { t, locale } = useI18n()
const panel = ref<HTMLElement | null>(null)
let languageAnimation: Animation | null = null
watch(locale, () => {
  languageAnimation?.cancel()
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    languageAnimation = panel.value?.animate(
      [{ opacity: 0.55 }, { opacity: 1 }],
      { duration: 220, easing: 'cubic-bezier(0.42, 0, 0.2, 1)' },
    ) ?? null
  }
}, { flush: 'post' })
onUnmounted(() => languageAnimation?.cancel())
const isCollapsed = ref(false)
const speedExponent = computed({
  get: () => Math.log10(Math.max(0.1, store.simulationSpeed)),
  set: (value: number) => { store.simulationSpeed = Math.min(MAX_SIMULATION_SPEED, Math.round(10 ** value * 10) / 10) },
})
const formatNumber = (value: number) => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(value)
const speedLabel = (speed: number) => speed === ORBIT_DEMO_SPEED
  ? t('controls.orbitDemo')
  : speed >= SECONDS_PER_DAY
    ? t('controls.daysPerSecond', { days: formatNumber(speed / SECONDS_PER_DAY) })
    : speed >= 3600
      ? t('controls.hoursPerSecond', { hours: formatNumber(speed / 3600) })
      : t('controls.speedUnit', { speed: formatNumber(speed) })
function setSpeed(speed: number): void {
  store.simulationSpeed = speed
  store.isTimePlaying = true
}
const dayToDate = (day: number) =>
  new Date(day * 86_400_000).toISOString().replace('T', ' ').slice(0, 16)
const simulationDate = computed(() => {
  return `${dayToDate(store.simulationDay)} UTC`
})
const timelineCenter = computed(() => store.simulationStartDay +
  Math.floor((store.simulationDay - store.simulationStartDay) / 365.25) * 365.25)
const startDate = computed(() =>
  dayToDate(timelineCenter.value - 365.25).slice(0, 10),
)
const endDate = computed(() =>
  dayToDate(timelineCenter.value + 365.25).slice(0, 10),
)

function changeZoom(amount: number) {
  store.cameraDistance = Math.min(
    600,
    Math.max(1, store.cameraDistance + amount),
  )
}

</script>

<template>
  <section
    ref="panel"
    class="scene-controls"
    :class="{ collapsed: isCollapsed }"
    :aria-label="t('controls.panelLabel')"
  >
    <header class="controls-header">
      <div>
        <span class="panel-kicker">{{ t(`bodies.${store.currentBodyId}.name`) }}</span>
        <h2>{{ t('controls.title') }}</h2>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="zen-button"
          :aria-label="store.isZenMode ? t('controls.zenExit') : t('topBar.zenEnter')"
          :aria-pressed="store.isZenMode"
          :title="store.isZenMode ? t('controls.zenExit') : t('topBar.zenEnter')"
          @click="store.isZenMode = !store.isZenMode"
        >
          {{ t('topBar.zenButton') }}
        </button>
        <button
          type="button"
          class="collapse-button"
          :aria-expanded="!isCollapsed"
          :aria-label="isCollapsed ? t('controls.expandAria') : t('controls.collapseAria')"
          @click="isCollapsed = !isCollapsed"
        >
          <svg class="collapse-icon" viewBox="0 0 16 16" aria-hidden="true">
            <path
              :d="isCollapsed ? 'M3.5 6 8 10.5 12.5 6' : 'M3.5 10 8 5.5 12.5 10'"
            />
          </svg>
        </button>
      </div>
    </header>

    <div class="controls-reveal" :class="{ closed: isCollapsed }" :inert="isCollapsed">
    <div class="controls-content">
      <div class="selection-controls">
        <LanguageSwitcher />
        <BodySelector />
        <VariantSelector />
      </div>

      <details class="control-section">
        <summary>{{ t('controls.bodyInfo') }}</summary>
        <div class="control-section-content info-copy">
          <p class="info-variant">{{ t(`bodies.${store.currentBodyId}.variants.${store.currentVariantId}.name`) }}</p>
          <p>
            {{ t(`bodies.${store.currentBodyId}.description`) }} {{ t(`bodies.${store.currentBodyId}.variants.${store.currentVariantId}.description`) }}
          </p>
          <p class="info-source">
            {{ store.currentBodyId === 'moon'
              ? t('infoPanel.moonSource')
              : t('infoPanel.defaultSource') }}
          </p>
        </div>
      </details>

      <div class="control-row brightness-control">
        <div class="speed-label">
          <label for="dark-side-brightness">{{ t('controls.darkSideBrightness') }}</label>
          <output>{{ Math.round(store.darkSideBrightness * 100) }}%</output>
        </div>
        <input
          id="dark-side-brightness"
          v-model.number="store.darkSideBrightness"
          type="range"
          min="0"
          max="1"
          step="0.01"
        >
      </div>

      <div class="control-row">
        <label for="camera-distance">{{ t('controls.distance') }}</label>
        <div class="range-control">
          <button type="button" :aria-label="t('controls.zoomInAria')" @click="changeZoom(-10)">−</button>
          <input
            id="camera-distance"
            v-model.number="store.cameraDistance"
            type="range"
            min="1"
            max="600"
            step="1"
          >
          <button type="button" :aria-label="t('controls.zoomOutAria')" @click="changeZoom(10)">+</button>
        </div>
      </div>

      <details class="control-section">
        <summary>{{ t('controls.timeSection') }}</summary>
        <div class="control-section-content">
          <div class="time-header">
            <label for="simulation-time">{{ t('controls.simulationTime') }}</label>
            <output>{{ simulationDate }}</output>
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
              :min="timelineCenter - 365.25"
              :max="timelineCenter + 365.25"
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
              <output>{{ speedLabel(store.simulationSpeed) }}</output>
            </div>
            <input
              id="simulation-speed"
              v-model.number="speedExponent"
              type="range"
              min="-1"
              :max="Math.log10(MAX_SIMULATION_SPEED)"
              step="0.01"
            >
          </div>
          <p class="simulation-rate">{{ store.simulationSpeed >= SECONDS_PER_DAY
            ? t('controls.daysPerSecond', { days: formatNumber(store.simulationSpeed / SECONDS_PER_DAY) })
            : t('controls.speedUnit', { speed: formatNumber(store.simulationSpeed) }) }}</p>
          <div class="speed-presets">
            <button v-for="speed in SPEED_PRESETS" :key="speed" type="button"
              class="action-button" :aria-pressed="store.simulationSpeed === speed"
              @click="setSpeed(speed)">{{ speedLabel(speed) }}</button>
          </div>
          <button
            type="button"
            class="action-button current-time-button"
            @click="store.simulationDay = store.simulationStartDay"
          >
            {{ t('controls.backToNow') }}
          </button>
        </div>
      </details>

      <details class="control-section">
        <summary>{{ t('controls.viewSection') }}</summary>
        <div class="control-section-content">
          <label class="toggle-row" for="auxiliary-lines">
            <span>{{ t('controls.auxiliaryLines') }}</span>
            <input
              id="auxiliary-lines"
              v-model="store.auxiliaryLinesVisible"
              type="checkbox"
            >
          </label>

          <div class="coordinates" aria-live="polite">
            <span>{{ t('controls.coordinatesLabel', { name: t(`bodies.${store.currentBodyId}.name`) }) }}</span>
            <code>
              X {{ store.simulationCoordinates.x.toFixed(2) }}
              · Y {{ store.simulationCoordinates.y.toFixed(2) }}
              · Z {{ store.simulationCoordinates.z.toFixed(2) }}
            </code>
          </div>

          <button type="button" class="action-button reset-button" @click="store.resetView">
            {{ t('controls.resetView') }}
          </button>
          <div class="location-control">
            <button
              type="button"
              class="action-button location-button"
              :disabled="store.isLocating"
              @click="store.locateCurrentPosition"
            >
              {{ store.isLocating ? t('controls.locating') : t('controls.locateButton') }}
            </button>
            <p v-if="store.locationMessage.key" class="location-message" aria-live="polite">
              {{ t(store.locationMessage.key, store.locationMessage.params ?? {}) }}
            </p>
          </div>
        </div>
      </details>

      <details v-if="store.currentBodyId === 'moon'" class="control-section landmark-section">
        <summary>{{ t('controls.lunarSites') }}</summary>
        <div class="control-section-content">
          <LandmarkNavigator embedded />
        </div>
      </details>
    </div>
    </div>
  </section>
</template>

<style scoped>
.speed-presets {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}
.speed-presets [aria-pressed='true'] {
  background: var(--color-accent-dim);
  border-color: var(--color-accent);
}
.simulation-rate {
  color: var(--color-text-dim);
  font-size: 11px;
}

.scene-controls {
  width: min(320px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 0 12px 10px;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.controls-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 48px;
  background: var(--color-panel);
  border-bottom: 1px solid rgba(80, 120, 200, 0.22);
}

.scene-controls.collapsed {
  padding-bottom: 0;
}

.panel-kicker {
  display: block;
  margin-bottom: 2px;
  color: var(--color-accent);
  font-size: 10px;
}

h2 {
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.zen-button,
.collapse-button {
  display: flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--color-text-dim);
  background: rgba(40, 60, 90, 0.65);
  border: 1px solid var(--color-border);
  font-size: 12px;
  line-height: 1;
}

.collapse-icon {
  display: block;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.zen-button:hover,
.zen-button[aria-pressed='true'],
.collapse-button:hover {
  color: var(--color-text);
  background: var(--color-accent-dim);
}

.controls-reveal {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 280ms cubic-bezier(0.42, 0, 0.2, 1), opacity 220ms ease;
}

.controls-reveal.closed {
  grid-template-rows: 0fr;
  opacity: 0;
}

.controls-reveal > .controls-content {
  min-height: 0;
  overflow: hidden;
}

.controls-content {
  padding-bottom: 4px;
}

.selection-controls {
  display: grid;
  gap: 8px;
  padding: 9px 0 8px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.22);
}

:deep(.body-selector),
:deep(.variant-selector) {
  gap: 5px;
}

:deep(.body-selector .title),
:deep(.variant-selector .title) {
  font-size: 10px;
}

:deep(.btn-group) {
  flex-wrap: wrap;
  gap: 5px;
}

:deep(.btn:not(:first-child)) {
  border-left: 1px solid var(--color-border);
}

:deep(.btn) {
  min-width: 0;
  min-height: 28px;
  flex: 1 1 auto;
  padding: 5px 7px;
  border-radius: 2px;
  font-size: 11px;
  white-space: normal;
}

.control-row {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.brightness-control {
  padding: 8px 0 1px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.22);
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

.control-section {
  margin-top: 9px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.22);
}

.control-section > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  color: var(--color-text-dim);
  font-size: 11px;
  cursor: pointer;
  list-style: none;
}

.control-section > summary::-webkit-details-marker {
  display: none;
}

.control-section > summary::after {
  content: '+';
  color: var(--color-accent);
  font-size: 16px;
}

.control-section[open] > summary::after {
  content: '−';
}

.control-section-content {
  display: grid;
  gap: 6px;
  padding: 1px 0 8px;
}

.control-section-content .control-row {
  margin-top: 4px;
}

.info-copy {
  color: var(--color-text-dim);
  font-size: 11px;
  line-height: 1.5;
}

.info-variant {
  color: var(--color-accent);
}

.info-source {
  opacity: 0.7;
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
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
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
  min-height: 28px;
  padding: 4px 7px;
  color: var(--color-text);
  background: rgba(40, 60, 90, 0.65);
  border: 1px solid var(--color-border);
  font-size: 11px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.current-time-button {
  width: 100%;
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

.location-control {
  margin-top: 0;
}

.landmark-section .control-section-content {
  display: block;
}

@media (max-width: 600px) {
  .scene-controls {
    padding: 0 12px 10px;
  }

  .controls-header {
    min-height: 52px;
  }

  .zen-button,
  .collapse-button {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
  }

  .collapse-icon {
    width: 18px;
    height: 18px;
    flex-basis: 18px;
  }

  :deep(.btn) {
    min-height: 44px;
  }

  .control-section > summary {
    min-height: 44px;
  }

  .playback-button {
    width: 44px;
    height: 44px;
    flex-basis: 44px;
  }

  .range-control button,
  .action-button {
    min-width: 44px;
    min-height: 44px;
  }

  input[type='range'] {
    height: 36px;
  }

  input[type='checkbox'] {
    width: 20px;
    height: 20px;
  }
}
</style>
