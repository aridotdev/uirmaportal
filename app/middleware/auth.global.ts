export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/') {
    return
  }

  const { session, status, refreshSession, getLandingPage } = useAuthSession()

  // Tunggu session selesai load jika belum (handle lazy: true race condition)
  if (status.value === 'idle' || status.value === 'pending') {
    await refreshSession()
  }

  if (to.path === '/login') {
    if (session.value) {
      return navigateTo(getLandingPage())
    }
    return
  }

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
