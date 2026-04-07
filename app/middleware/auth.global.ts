export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = ['/', '/login']
  if (publicRoutes.includes(to.path)) {
    return
  }

  const { session } = useAuthSession()

  if (!session.value) {
    return navigateTo('/login')
  }

  const role = session.value.user.role

  if (to.path.startsWith('/cs') && role !== 'CS') {
    return navigateTo('/dashboard')
  }

  if (to.path.startsWith('/dashboard') && role === 'CS') {
    return navigateTo('/cs')
  }
})
