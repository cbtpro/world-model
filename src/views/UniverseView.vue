<script setup lang="ts">
import { useUniverseStore } from '@/stores/universe'
import UniverseCanvas from '@/components/UniverseCanvas.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import BodySelector from '@/components/BodySelector.vue'
import VariantSelector from '@/components/VariantSelector.vue'

// 主页面：组装画布 + 控制面板 + 加载遮罩
const store = useUniverseStore()
</script>

<template>
  <div class="universe-view">
    <!-- Three.js 渲染层 -->
    <UniverseCanvas />

    <!-- UI 控制层 -->
    <div class="ui-layer">
      <header class="top-bar">
        <BodySelector />
      </header>

      <aside class="info-panel">
        <h2 class="body-name">{{ store.currentBody.name }}</h2>
        <p class="variant-name">{{ store.currentVariant.name }}</p>
        <p class="description">{{ store.currentVariant.description }}</p>
        <p class="source">数据来源：NASA SVS #14959</p>
      </aside>

      <footer class="bottom-bar">
        <VariantSelector />
      </footer>
    </div>

    <!-- 加载遮罩 -->
    <LoadingOverlay />
  </div>
</template>

<style scoped>
.universe-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.top-bar {
  position: absolute;
  top: 24px;
  left: 24px;
  pointer-events: auto;
}

.info-panel {
  position: absolute;
  top: 24px;
  right: 24px;
  max-width: 320px;
  padding: 16px 20px;
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  pointer-events: auto;
}

.body-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.variant-name {
  font-size: 14px;
  color: var(--color-accent);
  margin-top: 4px;
}

.description {
  font-size: 13px;
  color: var(--color-text-dim);
  line-height: 1.6;
  margin-top: 8px;
}

.source {
  font-size: 11px;
  color: var(--color-text-dim);
  opacity: 0.6;
  margin-top: 10px;
}

.bottom-bar {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
}
</style>
