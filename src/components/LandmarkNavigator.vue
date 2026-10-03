<script setup lang="ts">
import { computed } from 'vue'
import { lunarLandmarks } from '@/config/lunarLandmarks'
import { useUniverseStore } from '@/stores/universe'

const store = useUniverseStore()
const props = withDefaults(defineProps<{ embedded?: boolean }>(), {
  embedded: false,
})
const craters = computed(() => lunarLandmarks.filter(({ kind }) => kind === 'crater'))
const missions = computed(() => lunarLandmarks.filter(({ kind }) => kind === 'mission'))
const moments = computed(() => lunarLandmarks.filter(({ kind }) => kind === 'moment'))

function selectLandmark(id: string) {
  store.selectLandmark(id)
}
</script>

<template>
  <section
    class="landmark-panel"
    :class="{ embedded: props.embedded }"
    aria-label="月球历史地点导航"
  >
    <header v-if="!props.embedded" class="panel-header">
      <div>
        <span class="eyebrow">月球地图</span>
        <h2>历史地点</h2>
      </div>
      <span class="count">{{ lunarLandmarks.length }} 个地点</span>
    </header>

    <div class="landmark-list">
      <section class="landmark-group">
        <h3>著名环形山</h3>
        <button
          v-for="landmark in craters"
          :key="landmark.id"
          type="button"
          :class="['landmark', { active: store.selectedLandmarkId === landmark.id }]"
          :aria-pressed="store.selectedLandmarkId === landmark.id"
          @click="selectLandmark(landmark.id)"
        >
          <span class="marker crater" />
          <span class="landmark-copy">
            <span class="landmark-name">{{ landmark.name }}</span>
            <span class="landmark-coordinates">{{ landmark.coordinates }}</span>
          </span>
        </button>
      </section>

      <section class="landmark-group">
        <h3>历史瞬间</h3>
        <button
          v-for="landmark in moments"
          :key="landmark.id"
          type="button"
          :class="['landmark', { active: store.selectedLandmarkId === landmark.id }]"
          :aria-pressed="store.selectedLandmarkId === landmark.id"
          @click="selectLandmark(landmark.id)"
        >
          <span class="marker moment" />
          <span class="landmark-copy">
            <span class="landmark-name">{{ landmark.name }}</span>
            <span class="landmark-coordinates">{{ landmark.coordinates }}</span>
          </span>
        </button>
      </section>

      <section class="landmark-group">
        <h3>登月与探测</h3>
        <button
          v-for="landmark in missions"
          :key="landmark.id"
          type="button"
          :class="['landmark', { active: store.selectedLandmarkId === landmark.id }]"
          :aria-pressed="store.selectedLandmarkId === landmark.id"
          @click="selectLandmark(landmark.id)"
        >
          <span class="marker mission" />
          <span class="landmark-copy">
            <span class="landmark-name">{{ landmark.name }}</span>
            <span class="landmark-coordinates">{{ landmark.coordinates }}</span>
          </span>
        </button>
      </section>
    </div>

    <p v-if="store.selectedLandmark" class="landmark-detail">
      {{ store.selectedLandmark.detail }}
    </p>
  </section>
</template>

<style scoped>
.landmark-panel {
  display: flex;
  flex-direction: column;
  width: 300px;
  max-height: min(620px, calc(100vh - 170px));
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(12px);
}

.landmark-panel.embedded {
  display: block;
  width: 100%;
  max-height: none;
  background: transparent;
  border: 0;
  backdrop-filter: none;
}

.landmark-panel.embedded .landmark-list {
  overflow: visible;
  padding: 0;
}

.landmark-panel.embedded .landmark-group h3 {
  padding-left: 0;
}

.landmark-panel.embedded .landmark-detail {
  padding: 10px 0 0;
}

.panel-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(80, 120, 200, 0.22);
}

.eyebrow {
  color: var(--color-accent);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h2 {
  margin-top: 3px;
  font-size: 17px;
  font-weight: 600;
}

.count {
  color: var(--color-text-dim);
  font-size: 11px;
}

.landmark-list {
  overflow-y: auto;
  padding: 8px 8px 4px;
}

.landmark-group + .landmark-group {
  margin-top: 9px;
}

.landmark-group h3 {
  padding: 7px 9px 5px;
  color: var(--color-text-dim);
  font-size: 11px;
  font-weight: 500;
}

.landmark {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 8px 10px;
  color: var(--color-text);
  text-align: left;
  background: transparent;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}

.landmark:hover,
.landmark.active {
  background: rgba(74, 158, 255, 0.13);
  border-color: rgba(74, 158, 255, 0.35);
}

.marker {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 9px currentColor;
}

.marker.crater {
  color: #ffd27a;
  background: currentColor;
}

.marker.mission {
  color: #56c8ff;
  background: currentColor;
}

.marker.moment {
  color: #ff9b75;
  background: currentColor;
}

.landmark-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.landmark-name {
  font-size: 13px;
}

.landmark-coordinates {
  color: var(--color-text-dim);
  font-size: 10px;
}

.landmark-detail {
  padding: 11px 17px 13px;
  color: var(--color-text-dim);
  font-size: 11px;
  line-height: 1.6;
  border-top: 1px solid rgba(80, 120, 200, 0.22);
}

@media (max-width: 600px) {
  .landmark-panel {
    width: min(270px, calc(100vw - 32px));
    max-height: min(390px, calc(100vh - 200px));
  }
}
</style>
