<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSoftwareUsageStore } from '@/stores/softwareUsage'
const store = useSoftwareUsageStore()
const { t, locale } = useI18n()
const format = (value: number) => new Intl.NumberFormat(locale.value).format(value)
</script>

<template>
  <details class="control-section usage-panel">
    <summary>{{ t('usage.title') }}</summary>
    <div class="control-section-content usage-content">
      <p v-if="store.dataset?.isMock" class="mock-badge">{{ t('usage.mock') }}</p>
      <p v-if="store.status === 'loading'" role="status">{{ t('usage.loading') }}</p>
      <div v-else-if="store.status === 'error'" role="alert">
        <p>{{ t('usage.error') }}</p>
        <button type="button" @click="store.load">{{ t('usage.retry') }}</button>
      </div>
      <template v-if="store.dataset">
        <p>{{ store.dataset.software }} · {{ store.dataset.period }}</p>
        <label class="usage-toggle">
          <span>{{ t('usage.show') }}</span>
          <input v-model="store.visible" type="checkbox">
        </label>
        <p>{{ t('usage.total', { count: format(store.totalUsers), regions: store.dataset.regions.length }) }}</p>
        <p class="usage-legend"><span />{{ t('usage.legend') }}</p>
        <label class="region-select">
          <span>{{ t('usage.select') }}</span>
          <select v-model="store.selectedId">
            <option :value="null">{{ t('usage.choose') }}</option>
            <option v-for="row in store.dataset.regions" :key="row.id" :value="row.id">
              {{ row.city }} · {{ row.country }}
            </option>
          </select>
        </label>
        <div v-if="store.selected" class="usage-detail" aria-live="polite">
          <strong>{{ store.selected.city }} · {{ store.selected.country }}</strong>
          <p>{{ t('usage.users', { count: format(store.selected.activeUsers) }) }}</p>
          <p>{{ t('usage.sessions', { count: format(store.selected.sessions) }) }}</p>
        </div>
        <p v-if="!store.dataset.regions.length">{{ t('usage.empty') }}</p>
      </template>
    </div>
  </details>
</template>

<style scoped>
.usage-content { display: grid; gap: 7px; padding: 4px 3px 12px; font-size: 11px; line-height: 1.5; color: var(--color-text-dim); }
.mock-badge { color: #ffbd66; }
.usage-toggle { display: flex; align-items: center; justify-content: space-between; }
input { accent-color: var(--color-accent); }
.usage-legend { display: flex; gap: 7px; align-items: center; }
.usage-legend span { width: 50px; height: 6px; border-radius: 3px; background: linear-gradient(90deg, #39d5ce, #ffbd66, #ff634b); }
.region-select { display: grid; gap: 5px; }
select, button { min-height: 32px; padding: 6px; font: inherit; color: var(--color-text); background: var(--color-panel); border: 1px solid var(--color-border); border-radius: 3px; color-scheme: dark; }
select { width: 100%; }
select:focus-visible, button:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.usage-detail { padding: 8px; border: 1px solid var(--color-border); border-radius: 3px; }
strong { color: var(--color-text); }
@media (max-width: 600px) { select, button { min-height: 44px; } }
</style>
