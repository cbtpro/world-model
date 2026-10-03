<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale, type SupportedLocale } from '@/i18n'

// 语言切换器：下拉选择当前界面语言，并持久化到 localStorage
const { t, locale } = useI18n()

function onChange(event: Event): void {
  setLocale((event.target as HTMLSelectElement).value as SupportedLocale)
}
</script>

<template>
  <label class="language-switcher">
    <span class="sr-only">{{ t('language.label') }}</span>
    <select :value="locale" @change="onChange">
      <option
        v-for="option in SUPPORTED_LOCALES"
        :key="option.code"
        :value="option.code"
      >
        {{ option.label }}
      </option>
    </select>
    <svg class="dropdown-icon" viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  </label>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-flex;
  justify-self: start;
  max-width: 100%;
  padding: 3px;
}

.language-switcher select {
  appearance: none;
  -webkit-appearance: none;
  color-scheme: dark;
  max-width: 100%;
  min-height: 32px;
  padding: 7px 32px 7px 10px;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.language-switcher select:hover {
  border-color: var(--color-accent);
  background: var(--color-accent-dim);
}

.language-switcher select:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
  border-color: var(--color-accent);
}

.dropdown-icon {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 14px;
  height: 14px;
  transform: translateY(-50%);
  fill: none;
  stroke: var(--color-text-dim);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  pointer-events: none;
}

@media (max-width: 600px) {
  .language-switcher select {
    min-height: 44px;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
