import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { bodyRegistry, DEFAULT_BODY_ID } from '@/config/bodies'

// 路由表：/body/:bodyId/:variantId? — 支持深度链接
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: `/body/${DEFAULT_BODY_ID}`,
  },
  {
    path: '/body/:bodyId/:variantId?',
    name: 'body',
    component: () => import('@/views/UniverseView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: `/body/${DEFAULT_BODY_ID}`,
  },
]

export const router = createRouter({
  // Hash 路由不要求 GitHub Pages 为深层路径提供服务器端重写
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

// 前置守卫：校验 bodyId / variantId 合法性，非法则重定向到默认天体
router.beforeEach((to) => {
  if (to.name !== 'body') return true

  const bodyId = to.params.bodyId as string
  const body = bodyRegistry.bodies[bodyId]
  if (!body) {
    return { name: 'body', params: { bodyId: DEFAULT_BODY_ID } }
  }

  const variantId = to.params.variantId as string | undefined
  if (variantId) {
    const variant = body.variants.find((v) => v.id === variantId)
    if (!variant) {
      return { name: 'body', params: { bodyId, variantId: body.defaultVariantId } }
    }
  }
  return true
})
