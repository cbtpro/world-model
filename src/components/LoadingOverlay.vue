<script setup lang="ts">
import { computed } from 'vue'
import { useUniverseStore } from '@/stores/universe'

// 加载遮罩：双阶段（场景初始化 + 模型加载进度）
const store = useUniverseStore()

const progressText = computed(() =>
  Math.round(store.loadingProgress),
)

const fileSizeHint = computed(() =>
  `${store.currentVariant.fileSizeMB.toFixed(1)} MB`,
)
</script>

<template>
  <Transition name="fade">
    <div v-if="store.isLoading" class="overlay">
      <div class="card">
        <!-- 场景初始化阶段 -->
        <template v-if="store.loadingPhase === 'scene'">
          <div class="spinner" />
          <p class="label">初始化宇宙场景</p>
        </template>

        <!-- 模型加载阶段 -->
        <template v-else-if="store.loadingPhase === 'model'">
          <p class="label">{{ store.loadingMessage }}</p>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: progressText + '%' }"
            />
          </div>
          <div class="progress-meta">
            <span>{{ progressText }}%</span>
            <span class="dim">{{ fileSizeHint }}</span>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 36px 48px;
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  min-width: 340px;
}

.label {
  font-size: 15px;
  color: var(--color-text);
  text-align: center;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--color-accent-dim);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.progress-track {
  width: 320px;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-accent-dim), var(--color-accent));
  transition: width 0.2s ease;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  width: 320px;
  font-size: 13px;
  color: var(--color-text-dim);
}

.dim {
  color: var(--color-text-dim);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
