<script setup lang="ts">
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

// 根组件：仅承载路由出口；同步文档标题与 meta 描述至当前语言
const { t } = useI18n()

watchEffect(() => {
  document.title = t('meta.title')
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', t('meta.description'))
})
</script>

<template>
  <router-view />
</template>
