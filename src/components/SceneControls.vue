<script setup lang="ts">
import { computed } from 'vue'
import { useUniverseStore } from '@/stores/universe'

const store = useUniverseStore()
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
  <section class="scene-controls" aria-label="场景控制面板">
    <h2>场景控制</h2>

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
  </section>
</template>

<style scoped>
.scene-controls {
  width: 260px;
  padding: 14px 16px;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  pointer-events: auto;
}

h2 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
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
