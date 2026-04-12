import type { UserRole } from '~~/shared/utils/constants'

export interface AuthUser {
  id: string
  name: string
  email: string
  role?: UserRole
  branch: string | null
  avatarUrl?: string
}
