<script setup lang="ts">
import { useUniverseStore } from '@/stores/universe'

const store = useUniverseStore()

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

    <div class="control-row">
      <label for="rotation-speed">自转速度</label>
      <input
        id="rotation-speed"
        v-model.number="store.rotationSpeed"
        type="range"
        min="0"
        max="0.005"
        step="0.0001"
      >
    </div>

    <div class="actions">
      <button
        type="button"
        class="action-button"
        :aria-pressed="store.rotationPaused"
        @click="store.rotationPaused = !store.rotationPaused"
      >
        {{ store.rotationPaused ? '继续自转' : '暂停自转' }}
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

label {
  color: var(--color-text-dim);
  font-size: 12px;
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
