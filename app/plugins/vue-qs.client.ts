import { createVueQsPlugin, createVueRouterAdapter } from 'vue-qs'
import type { Router } from 'vue-router'

export default defineNuxtPlugin((nuxtApp) => {
  const router = nuxtApp['$router'] as Router
  const adapter = createVueRouterAdapter(router)
  nuxtApp.vueApp.use(createVueQsPlugin({ queryAdapter: adapter }))
})
