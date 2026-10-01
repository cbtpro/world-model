import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Vite 配置：Vue3 + 路径别名 + 大资源不内联
// GitHub Pages 部署时 base 为仓库名，本地开发为 /
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/world-model/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
}))
