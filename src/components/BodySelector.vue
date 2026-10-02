<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { bodyRegistry } from '@/config/bodies'
import { useUniverseStore } from '@/stores/universe'

// 天体选择器：切换不同星体（月球/地球/太阳/金星/彗星...）
// 数据驱动渲染：未来在 registry 新增天体即自动出现在此列表
const router = useRouter()
const store = useUniverseStore()
const { t } = useI18n()

function selectBody(bodyId: string) {
  if (bodyId === store.currentBodyId) return
  router.push({ name: 'body', params: { bodyId } })
}
</script>

<template>
  <div class="body-selector">
    <span class="title">{{ t('bodySelector.title') }}</span>
    <div class="btn-group">
      <button
        v-for="body in bodyRegistry.list"
        :key="body.id"
        :class="['btn', { active: body.id === store.currentBodyId }]"
        :title="t(`bodies.${body.id}.description`)"
        @click="selectBody(body.id)"
      >
        {{ t(`bodies.${body.id}.name`) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.body-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  font-size: 12px;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.btn-group {
  display: flex;
  gap: 0;
}

.btn {
  padding: 8px 18px;
  background: rgba(20, 28, 44, 0.6);
  color: var(--color-text-dim);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  font-size: 14px;
  transition: all 0.2s;
}

.btn:not(:first-child) {
  border-left: none;
}

.btn:hover {
  background: rgba(40, 60, 90, 0.8);
  color: var(--color-text);
}

.btn.active {
  background: var(--color-accent);
  color: #fff;
  border-color: var(--color-accent);
}
</style>
