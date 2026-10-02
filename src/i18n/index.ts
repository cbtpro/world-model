import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import zhTW from './locales/zh-TW'
import en from './locales/en'
import ja from './locales/ja'
import ru from './locales/ru'

// 支持的语言列表：代码 + 本地化自称名称（用于语言切换器显示）
export const SUPPORTED_LOCALES = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ru', label: 'Русский' },
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]['code']

const STORAGE_KEY = 'world-model-locale'

function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.some(({ code }) => code === value)
}

// 根据本地存储的偏好或浏览器语言猜测初始语言，找不到匹配时回退到简体中文
function detectLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && isSupportedLocale(stored)) return stored

  const browserLocales = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]
  for (const browserLocale of browserLocales) {
    const normalized = browserLocale.toLowerCase()
    if (normalized.startsWith('zh')) {
      return normalized.includes('tw') ||
        normalized.includes('hk') ||
        normalized.includes('hant')
        ? 'zh-TW'
        : 'zh-CN'
    }
    if (normalized.startsWith('ja')) return 'ja'
    if (normalized.startsWith('ru')) return 'ru'
    if (normalized.startsWith('en')) return 'en'
  }
  return 'zh-CN'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    en,
    ja,
    ru,
  },
})

// 切换语言：更新 i18n 当前语言、持久化偏好、同步 <html lang>
export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

export function getLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}
