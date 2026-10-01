<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUniverseStore } from '@/stores/universe'

// 变体选择器：切换当前天体的不同模型变体
const store = useUniverseStore()
const router = useRouter()

function selectVariant(variantId: string) {
  if (variantId === store.currentVariantId) return
  router.push({
    name: 'body',
    params: {
      bodyId: store.currentBodyId,
      variantId,
    },
  })
}
</script>

<template>
  <div class="variant-selector">
    <span class="title">模型变体</span>
    <div class="btn-group">
      <button
        v-for="variant in store.currentBody.variants"
        :key="variant.id"
        :class="['btn', { active: variant.id === store.currentVariantId }]"
        :title="variant.description"
        @click="selectVariant(variant.id)"
      >
        {{ variant.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.variant-selector {
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
