import type { UserRole } from '~~/shared/utils/constants'
import { buildNavigationForRole, ROLE_DISPLAY } from '~/utils/role-navigation'
import type { NavGroup, RoleDisplayConfig } from '~/utils/role-navigation'

interface DashboardUser {
  id: string
  name: string
  email: string
  role: UserRole
  branch: string
  avatarUrl: string
}

export function useDashboardStore() {
  const { user, role } = useAuthSession()

  const currentRole = computed<UserRole>(() => {
    return role.value ?? 'QRCC'
  })

  const currentUser = computed<DashboardUser>(() => {
    const authUser = user.value
    const resolvedRole = authUser?.role ?? currentRole.value
    return {
      id: authUser?.id ?? '',
      name: authUser?.name ?? 'Unknown User',
      email: authUser?.email ?? '',
      role: resolvedRole,
      branch: authUser?.branch ?? '',
      avatarUrl: authUser?.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(authUser?.id ?? resolvedRole)}`
    }
  })

  const roleDisplay = computed<RoleDisplayConfig>(() => ROLE_DISPLAY[currentRole.value])

  const navigation = computed<NavGroup[]>(() => buildNavigationForRole(currentRole.value))

  return {
    currentRole,
    currentUser,
    roleDisplay,
    navigation
  }
}
