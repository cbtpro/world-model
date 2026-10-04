<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSimulationStore } from '@/stores/simulation'
import SoftwareUsagePanel from './SoftwareUsagePanel.vue'
const store = useSimulationStore()
const { t } = useI18n()
const nodeName = (kind: 'network' | 'flights', id: string) => store.dataset?.[kind].nodes.find(node => node.id === id)?.name ?? id
</script>

<template>
  <details class="control-section simulation-panel">
    <summary>{{ t('simulation.title') }}</summary>
    <div class="control-section-content">
      <p class="notice">{{ t('usage.mock') }}</p>
      <SoftwareUsagePanel />
      <p v-if="store.status === 'loading'" role="status">{{ t('simulation.loading') }}</p>
      <div v-if="store.status === 'error'" role="alert">
        <p>{{ t('simulation.error') }}</p>
        <button type="button" @click="store.load">{{ t('usage.retry') }}</button>
      </div>
      <details v-if="store.dataset" class="control-section layer-panel">
        <summary>{{ t('simulation.network') }}</summary>
        <div class="control-section-content">
        <label><span>{{ t('simulation.showNetwork') }}</span><input v-model="store.networkVisible" type="checkbox"></label>
        <p class="legend">{{ t('simulation.networkLegend') }}</p>
        <ul>
          <li v-for="route in store.dataset.network.routes" :key="route.id">
            {{ nodeName('network', route.from) }} → {{ nodeName('network', route.to) }}
            <small>{{ route.latencyMs }} ms · {{ t('simulation.replication') }}</small>
          </li>
        </ul>
        </div>
      </details>
      <details v-if="store.dataset" class="control-section layer-panel">
        <summary>{{ t('simulation.flights') }}</summary>
        <div class="control-section-content">
        <label><span>{{ t('simulation.showFlights') }}</span><input v-model="store.flightsVisible" type="checkbox"></label>
        <p class="legend">{{ t('simulation.flightLegend') }}</p>
        <ul>
          <li v-for="route in store.dataset.flights.routes" :key="route.id">
            {{ nodeName('flights', route.from) }} → {{ nodeName('flights', route.to) }}
            <small>{{ route.label }} · {{ route.from }} → {{ route.to }}</small>
          </li>
        </ul>
        </div>
      </details>
    </div>
  </details>
</template>

<style scoped>
.simulation-panel { font-size: 11px; color: var(--color-text-dim); }
.notice { color: #ffbd66; font-size: 10px; }
.layer-panel { padding-bottom: 8px; }
label { display: flex; justify-content: space-between; align-items: center; min-height: 32px; gap: 8px; }
input { accent-color: var(--color-accent); }
.legend { line-height: 1.6; font-size: 10px; }
ul { list-style: none; padding: 0; display: grid; gap: 8px; margin-top: 8px; }
li { padding: 6px 8px; border-left: 2px solid var(--color-accent); line-height: 1.5; }
small { display: block; opacity: .7; font-size: 10px; }
button { background: var(--color-panel); color: var(--color-text); border: 1px solid var(--color-border); padding: 6px 10px; }
input:focus-visible, button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
@media (max-width: 600px) { label, button { min-height: 44px; } }
</style>
