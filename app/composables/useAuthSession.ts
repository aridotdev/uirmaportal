import type { AuthUser } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/utils/constants'

interface SessionResponse {
  success: boolean
  data: {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      role?: string
      branch?: string | null
    }
  }
}

export function useAuthSession() {
  const user = useState<AuthUser | null>('auth-user', () => null)

  const {
    data: sessionData,
    refresh: refreshSession,
    status
  } = useAsyncData<SessionResponse | null>('auth-session', async () => {
    try {
      return await $fetch<SessionResponse>('/api/auth/session')
    } catch {
      return null
    }
  }, {
    lazy: true,
    default: () => null
  })

  watchEffect(() => {
    const response = sessionData.value
    if (!response?.data?.user) {
      user.value = null
      return
    }

    const role = typeof response.data.user.role === 'string'
      ? response.data.user.role as UserRole
      : undefined

    const branch = typeof response.data.user.branch === 'string'
      ? response.data.user.branch
      : null

    user.value = {
      id: response.data.user.id,
      name: response.data.user.name,
      email: response.data.user.email,
      role,
      branch,
      avatarUrl: response.data.user.image ?? undefined
    }
  })

  const session = computed(() => {
    if (!user.value) {
      return null
    }

    return {
      user: user.value
    }
  })

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role)
  const branch = computed(() => user.value?.branch ?? null)
  const userName = computed(() => user.value?.name ?? '')

  async function login(username: string, password: string): Promise<boolean> {
    try {
      await $fetch('/api/auth/sign-in', {
        method: 'POST',
        body: {
          identifier: username,
          password
        }
      })
      await refreshSession()
      return !!user.value
    } catch {
      user.value = null
      return false
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/sign-out', {
        method: 'POST'
      })
    } finally {
      user.value = null
      await refreshSession()
    }

    return navigateTo('/login')
  }

  function getLandingPage(): string {
    if (!user.value) return '/login'
    return user.value.role === 'CS' ? '/cs' : '/dashboard'
  }

  return {
    session,
    user,
    status,
    refreshSession,
    isAuthenticated,
    role,
    branch,
    userName,
    login,
    logout,
    getLandingPage
  }
}
