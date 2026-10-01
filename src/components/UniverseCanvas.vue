<script setup lang="ts">
import { useSceneManager } from '@/composables/useSceneManager'

// Three.js 画布容器：通过 composable 桥接 SceneManager
// SceneManager 在 onMounted 时初始化，onUnmounted 时释放
const { containerRef } = useSceneManager()
</script>

<template>
  <div ref="containerRef" class="universe-canvas" />
</template>

<style scoped>
.universe-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
</style>
