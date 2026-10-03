<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useUniverseStore } from '@/stores/universe'
import UniverseCanvas from '@/components/UniverseCanvas.vue'
import LoadingOverlay from '@/components/LoadingOverlay.vue'
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
      <aside class="scene-control-panel">
        <SceneControls />
      </aside>
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

.scene-control-panel {
  position: absolute;
  top: 24px;
  left: 24px;
  pointer-events: auto;
}

@media (max-width: 900px) {
  .scene-control-panel {
    top: auto;
    bottom: 12px;
    left: 12px;
  }

  :deep(.scene-controls) {
    width: min(320px, calc(100vw - 24px));
    max-height: min(58vh, 520px);
  }
}

@media (max-width: 600px) {
  .scene-control-panel {
    top: auto;
    right: 12px;
    bottom: 12px;
    left: 12px;
  }

  :deep(.scene-controls) {
    width: min(360px, calc(100vw - 24px));
    max-height: min(58vh, 520px);
  }

}
</style>
