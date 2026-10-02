<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUniverseStore } from '@/stores/universe'
import UniverseCanvas from '@/components/UniverseCanvas.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
import BodySelector from '@/components/BodySelector.vue'
import VariantSelector from '@/components/VariantSelector.vue'
import LandmarkNavigator from '@/components/LandmarkNavigator.vue'
import SceneControls from '@/components/SceneControls.vue'

// 主页面：组装画布 + 控制面板 + 加载遮罩
const store = useUniverseStore()

// 轻触退出禅模式所用的阈值：区分「点击」与「拖拽旋转视角」的手势
const TAP_MOVEMENT_THRESHOLD = 10
const TAP_DURATION_THRESHOLD = 500

let tapStartX = 0
let tapStartY = 0
let tapStartTime = 0

function exitZenMode(): void {
  if (store.isZenMode) store.isZenMode = false
}

function handleZenPointerDown(event: PointerEvent): void {
  if (!store.isZenMode) return
  tapStartX = event.clientX
  tapStartY = event.clientY
  tapStartTime = Date.now()
}

function handleZenPointerUp(event: PointerEvent): void {
  if (!store.isZenMode) return
  const movement = Math.hypot(
    event.clientX - tapStartX,
    event.clientY - tapStartY,
  )
  const duration = Date.now() - tapStartTime
  // 仅在短促、几乎无移动的点击/轻触时退出，避免拖拽旋转视角被误判
  if (movement < TAP_MOVEMENT_THRESHOLD && duration < TAP_DURATION_THRESHOLD) {
    exitZenMode()
  }
}

onMounted(() => window.addEventListener('keydown', exitZenMode))
onUnmounted(() => window.removeEventListener('keydown', exitZenMode))
</script>

<template>
  <div
    class="universe-view"
    @pointerdown="handleZenPointerDown"
    @pointerup="handleZenPointerUp"
  >
    <!-- Three.js 渲染层 -->
    <UniverseCanvas />

    <!-- UI 控制层 -->
    <div v-if="!store.isZenMode" class="ui-layer">
      <header class="top-bar">
        <BodySelector />
        <button
          type="button"
          class="zen-button"
          aria-label="开启禅模式"
          @click="store.isZenMode = true"
        >
          禅
        </button>
      </header>

      <aside v-if="store.currentBodyId === 'moon'" class="landmark-navigation">
        <LandmarkNavigator />
      </aside>

      <aside class="info-panel">
        <h2 class="body-name">{{ store.currentBody.name }}</h2>
        <p class="variant-name">{{ store.currentVariant.name }}</p>
        <p class="description">
          {{ store.currentBody.description }}。{{ store.currentVariant.description }}
        </p>
        <p class="source">
          {{ store.currentBodyId === 'moon' ? '月球数据来源：NASA SVS #14959' : '太阳、地球与月球同场景展示；轨道距离与模型大小为教学示意比例' }}
        </p>
      </aside>

      <aside class="scene-control-panel">
        <SceneControls />
      </aside>

      <footer class="bottom-bar">
        <VariantSelector />
      </footer>
    </div>

    <!-- 加载遮罩 -->
    <LoadingOverlay v-if="!store.isZenMode" />
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
  display: flex;
  align-items: flex-end;
  gap: 12px;
  pointer-events: auto;
}

.zen-button {
  min-height: 32px;
  padding: 6px 12px;
  color: var(--color-text);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.zen-button:hover {
  background: var(--color-accent-dim);
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

.landmark-navigation {
  position: absolute;
  top: 110px;
  left: 24px;
  pointer-events: auto;
}

.scene-control-panel {
  position: absolute;
  right: 24px;
  bottom: 28px;
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

@media (max-width: 600px) {
  .landmark-navigation {
    top: 100px;
    left: 12px;
  }

  .info-panel {
    top: 12px;
    right: 12px;
    max-width: 190px;
    padding: 11px 12px;
  }

  .scene-control-panel {
    right: 12px;
    bottom: 82px;
  }

  :deep(.scene-controls) {
    width: 190px;
    padding: 11px 12px;
  }

  .description,
  .source {
    display: none;
  }
}
</style>
