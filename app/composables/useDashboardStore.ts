import type { UserRole } from '~~/shared/utils/constants'
import { buildNavigationForRole, ROLE_DISPLAY } from '~/utils/role-navigation'
import type { NavGroup, RoleDisplayConfig } from '~/utils/role-navigation'

// ──────────────────────────────────────────────
// Mock current user (akan diganti auth session nanti)
// ──────────────────────────────────────────────

interface DashboardUser {
  id: string
  name: string
  email: string
  role: UserRole
  branch: string
  avatarUrl: string
}

// State disimpan di luar composable supaya shared antar komponen (singleton)
const _currentRole = ref<UserRole>('QRCC')

const _mockUsers: Record<UserRole, DashboardUser> = {
  ADMIN: {
    id: 'USR-002',
    name: 'Administrator',
    email: 'admin@admin.id',
    role: 'ADMIN',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin'
  },
  QRCC: {
    id: 'USR-003',
    name: 'QRCC',
    email: 'qrcc@qrcc.id',
    role: 'QRCC',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nadia'
  },
  MANAGEMENT: {
    id: 'USR-004',
    name: 'Management',
    email: 'management@management.id',
    role: 'MANAGEMENT',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Budi'
  },
  CS: {
    id: 'USR-001',
    name: 'CS Jakarta',
    email: 'cs_jkt@cs.id',
    role: 'CS',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix'
  }
}

export function useDashboardStore() {
  const currentRole = computed<UserRole>({
    get: () => _currentRole.value,
    set: (val: UserRole) => { _currentRole.value = val }
  })

  const currentUser = computed<DashboardUser>(() => _mockUsers[_currentRole.value])

  const roleDisplay = computed<RoleDisplayConfig>(() => ROLE_DISPLAY[_currentRole.value])

  const navigation = computed<NavGroup[]>(() => buildNavigationForRole(_currentRole.value))

  /**
   * Ganti role aktif (untuk development/testing).
   * Nanti akan diganti dengan session auth.
   */
  function switchRole(role: UserRole) {
    _currentRole.value = role
  }

  return {
    currentRole,
    currentUser,
    roleDisplay,
    navigation,
    switchRole
  }
}
