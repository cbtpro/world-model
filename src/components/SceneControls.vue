<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUniverseStore } from '@/stores/universe'

const store = useUniverseStore()
const isCollapsed = ref(false)
const simulationDate = computed(() => {
  const timestamp =
    Date.UTC(2026, 0, 1) + store.simulationDay * 24 * 60 * 60 * 1000
  return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
})

function changeZoom(amount: number) {
  store.cameraDistance = Math.min(
    300,
    Math.max(1, store.cameraDistance + amount),
  )
}
</script>

<template>
  <section
    class="scene-controls"
    :class="{ collapsed: isCollapsed }"
    aria-label="场景控制面板"
  >
    <header class="controls-header">
      <h2>场景控制</h2>
      <button
        type="button"
        class="collapse-button"
        :aria-expanded="!isCollapsed"
        :aria-label="isCollapsed ? '展开场景控制' : '折叠场景控制'"
        @click="isCollapsed = !isCollapsed"
      >
        <span aria-hidden="true">{{ isCollapsed ? '展开' : '折叠' }}</span>
        <span class="collapse-icon" aria-hidden="true">
          {{ isCollapsed ? '⌃' : '⌄' }}
        </span>
      </button>
    </header>

    <div v-show="!isCollapsed" class="controls-content">
    <div class="control-row">
      <label for="camera-distance">视距</label>
      <div class="range-control">
        <button type="button" aria-label="拉近视角" @click="changeZoom(-10)">−</button>
        <input
          id="camera-distance"
          v-model.number="store.cameraDistance"
          type="range"
          min="1"
          max="300"
          step="1"
        >
        <button type="button" aria-label="拉远视角" @click="changeZoom(10)">+</button>
      </div>
    </div>

    <div class="time-header">
      <div>
        <label for="simulation-time">模拟时间</label>
        <output>{{ simulationDate }}</output>
      </div>
      <button
        type="button"
        class="action-button playback-button"
        :aria-pressed="store.isTimePlaying"
        @click="store.isTimePlaying = !store.isTimePlaying"
      >
        {{ store.isTimePlaying ? '暂停时间' : '继续时间' }}
      </button>
    </div>

    <div class="control-row">
      <input
        id="simulation-time"
        v-model.number="store.simulationDay"
        type="range"
        min="0"
        max="365.25"
        step="0.1"
        aria-label="模拟时间轴"
        @input="store.isTimePlaying = false"
      >
      <div class="timeline-range">
        <span>2026-01-01</span>
        <span>2027-01-01</span>
      </div>
    </div>

    <div class="control-row">
      <label for="simulation-speed">时间流速（地球日/秒）</label>
      <input
        id="simulation-speed"
        v-model.number="store.simulationSpeed"
        type="range"
        min="0.01"
        max="10"
        step="0.01"
      >
    </div>

    <div class="coordinates" aria-live="polite">
      <span>{{ store.currentBody.name }}实时坐标（示意单位）</span>
      <code>
        X {{ store.simulationCoordinates.x.toFixed(2) }}
        · Y {{ store.simulationCoordinates.y.toFixed(2) }}
        · Z {{ store.simulationCoordinates.z.toFixed(2) }}
      </code>
    </div>

    <label class="toggle-row" for="auxiliary-lines">
      <span>显示辅助线</span>
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
        @click="store.simulationDay = 0"
      >
        回到时间起点
      </button>
      <button type="button" class="action-button reset-button" @click="store.resetView">
        重置视角
      </button>
    </div>
    </div>
  </section>
</template>

<style scoped>
.scene-controls {
  width: 260px;
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

output,
.timeline-range,
.coordinates {
  color: var(--color-text-dim);
  font-size: 11px;
}

.playback-button {
  flex: 0 0 auto;
}

.timeline-range {
  display: flex;
  justify-content: space-between;
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
