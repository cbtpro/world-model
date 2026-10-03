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
  </label>
</template>

<style scoped>
.language-switcher select {
  min-height: 32px;
  padding: 6px 8px;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.language-switcher select:hover {
  background: var(--color-accent-dim);
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
