export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/', '/login']
  if (publicRoutes.includes(to.path)) {
    return
  }

  const { session, status, refreshSession } = useAuthSession()

  // Tunggu session selesai load jika belum (handle lazy: true race condition)
  if (status.value === 'idle' || status.value === 'pending') {
    await refreshSession()
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
