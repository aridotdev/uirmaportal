interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CS' | 'QRCC' | 'MANAGEMENT' | 'ADMIN'
  branch: string
  avatarUrl?: string
}

interface AuthSession {
  user: AuthUser
  token: string
}

// State persisted di cookie agar SSR-safe
export function useAuthSession() {
  const session = useCookie<AuthSession | null>('auth-session', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7 // 7 hari
  })

  function login(username: string, password: string): Promise<AuthSession> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedUsername = username.trim().toLowerCase()
        const mockUsers: Record<string, AuthUser> = {
          cs1: { id: '1', name: 'Andi CS', email: 'andi@rma.id', role: 'CS', branch: 'Jakarta', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix' },
          qrcc1: { id: '2', name: 'Budi QRCC', email: 'budi@rma.id', role: 'QRCC', branch: 'Jakarta', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nadia' },
          mgmt1: { id: '3', name: 'Citra Mgmt', email: 'citra@rma.id', role: 'MANAGEMENT', branch: 'Jakarta', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Budi' },
          admin1: { id: '4', name: 'Dian Admin', email: 'dian@rma.id', role: 'ADMIN', branch: 'Jakarta', avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin' }
        }
        const user = mockUsers[normalizedUsername]
        if (user && password === 'password') {
          const s: AuthSession = { user, token: 'mock-token-' + Date.now() }
          session.value = s
          resolve(s)
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 800)
    })
  }

  function logout() {
    session.value = null
    return navigateTo('/login')
  }

  function getLandingPage(): string {
    if (!session.value) return '/login'
    return session.value.user.role === 'CS' ? '/cs' : '/dashboard'
  }

  return { session, login, logout, getLandingPage }
}
