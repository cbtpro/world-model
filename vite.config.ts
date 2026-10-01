import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Vite 配置：Vue3 + 路径别名 + 大资源不内联
// GitHub Pages 部署时 base 为仓库名，本地开发为 /
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/world-model/' : '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        id: '/world-model/',
        name: '宇宙星体模型演示',
        short_name: 'World Model',
        description: '探索月球等天体的交互式 3D 模型与历史地点。',
        lang: 'zh-CN',
        theme_color: '#080f1e',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/world-model/',
        scope: '/world-model/',
        icons: [
          {
            src: '/world-model/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /\.glb$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'lunar-models',
              expiration: {
                maxEntries: 3,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
}))
