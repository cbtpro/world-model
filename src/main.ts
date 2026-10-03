import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { i18n, getLocale } from './i18n'
import './style.css'

// 应用入口：挂载 Vue + Pinia + Router + i18n
document.documentElement.lang = getLocale()
createApp(App).use(createPinia()).use(router).use(i18n).mount('#app')
