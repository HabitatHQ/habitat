export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return
  if (to.path === '/onboarding') return

  const onboarded = localStorage.getItem('habitat-onboarded')
  if (onboarded) return

  // Existing users who already have saved settings — mark onboarded and skip
  if (localStorage.getItem('habitat-app-settings')) {
    localStorage.setItem('habitat-onboarded', '1')
    return
  }

  return navigateTo('/onboarding')
})
