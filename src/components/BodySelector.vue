<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { bodyRegistry } from '@/config/bodies'
import { useUniverseStore } from '@/stores/universe'

// 天体选择器：切换不同星体（月球/地球/太阳/金星/彗星...）
// 数据驱动渲染：未来在 registry 新增天体即自动出现在此列表
const router = useRouter()
const store = useUniverseStore()
const isCollapsed = ref(false)

function selectBody(bodyId: string) {
  if (bodyId === store.currentBodyId) return
  router.push({ name: 'body', params: { bodyId } })
}
</script>

<template>
  <div class="body-selector">
    <div class="selector-header">
      <span class="title">天体</span>
      <button
        type="button"
        class="collapse-button"
        :aria-expanded="!isCollapsed"
        :aria-label="isCollapsed ? '展开天体选择' : '折叠天体选择'"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? '展开' : '折叠' }}
        <span aria-hidden="true">{{ isCollapsed ? '⌄' : '⌃' }}</span>
      </button>
    </div>
    <div v-if="!isCollapsed" class="btn-group">
      <button
        v-for="body in bodyRegistry.list"
        :key="body.id"
        :class="['btn', { active: body.id === store.currentBodyId }]"
        :title="body.description"
        @click="selectBody(body.id)"
      >
        {{ body.name }}
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

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.collapse-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  color: var(--color-text-dim);
  background: rgba(20, 28, 44, 0.75);
  border: 1px solid var(--color-border);
  font-size: 11px;
}

.collapse-button:hover {
  color: var(--color-text);
  background: var(--color-accent-dim);
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
