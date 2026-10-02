<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { lunarLandmarks } from '@/config/lunarLandmarks'
import { useUniverseStore } from '@/stores/universe'

const store = useUniverseStore()
const { t } = useI18n()
const craters = computed(() => lunarLandmarks.filter(({ kind }) => kind === 'crater'))
const missions = computed(() => lunarLandmarks.filter(({ kind }) => kind === 'mission'))
const moments = computed(() => lunarLandmarks.filter(({ kind }) => kind === 'moment'))

function selectLandmark(id: string) {
  store.selectLandmark(id)
}
</script>

<template>
  <section class="landmark-panel" :aria-label="t('landmarkNavigator.panelLabel')">
    <header class="panel-header">
      <div>
        <span class="eyebrow">{{ t('landmarkNavigator.eyebrow') }}</span>
        <h2>{{ t('landmarkNavigator.title') }}</h2>
      </div>
      <span class="count">{{ t('landmarkNavigator.count', { count: lunarLandmarks.length }) }}</span>
    </header>

    <div class="landmark-list">
      <section class="landmark-group">
        <h3>{{ t('landmarkNavigator.craterGroup') }}</h3>
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
            <span class="landmark-name">{{ t(`landmarks.${landmark.id}.name`) }}</span>
            <span class="landmark-coordinates">{{ t(`landmarks.${landmark.id}.coordinates`) }}</span>
          </span>
        </button>
      </section>

      <section class="landmark-group">
        <h3>{{ t('landmarkNavigator.momentGroup') }}</h3>
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
            <span class="landmark-name">{{ t(`landmarks.${landmark.id}.name`) }}</span>
            <span class="landmark-coordinates">{{ t(`landmarks.${landmark.id}.coordinates`) }}</span>
          </span>
        </button>
      </section>

      <section class="landmark-group">
        <h3>{{ t('landmarkNavigator.missionGroup') }}</h3>
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
            <span class="landmark-name">{{ t(`landmarks.${landmark.id}.name`) }}</span>
            <span class="landmark-coordinates">{{ t(`landmarks.${landmark.id}.coordinates`) }}</span>
          </span>
        </button>
      </section>
    </div>

    <p v-if="store.selectedLandmark" class="landmark-detail">
      {{ t(`landmarks.${store.selectedLandmark.id}.detail`) }}
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
