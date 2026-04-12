import type { H3Event } from 'h3'
import type { AuthUser } from '~~/shared/types/auth'
import type { UserRole } from '~~/shared/utils/constants'

/**
 * Ambil user dari session. Throw 401 jika tidak ada session.
 */
export function requireAuth(event: H3Event): AuthUser {
  const user = event.context.auth?.user as AuthUser | undefined
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

/**
 * Cek apakah user punya salah satu role yang diizinkan.
 */
export function requireRole(event: H3Event, allowedRoles: UserRole[]): AuthUser {
  const user = requireAuth(event)
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
