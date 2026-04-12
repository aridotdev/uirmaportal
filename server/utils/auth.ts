import type { H3Event } from 'h3'
import { userRepo } from '#server/repositories/user.repo'
import type { AuthUser } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/utils/constants'

/**
 * Ambil user dari session. Throw 401 jika tidak ada session.
 */
export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = event.context.auth?.user as AuthUser | undefined
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const dbUser = await userRepo.findById(user.id)
  if (!dbUser || !dbUser.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Account deactivated' })
  }

  return user
}

/**
 * Cek apakah user punya salah satu role yang diizinkan.
 */
export async function requireRole(event: H3Event, allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth(event)
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
