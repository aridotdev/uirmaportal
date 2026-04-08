import { auth } from '#server/utils/auth-config'
import { toRequestHeaders } from '#server/utils/request-headers'
import type { UserRole } from '~~/shared/utils/constants'

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api/')) {
    return
  }

  if (event.path.startsWith('/api/auth/')) {
    return
  }

  const headers = toRequestHeaders(event)
  const session = await auth.api.getSession({ headers })

  if (!session) {
    event.context.auth = null
    return
  }

  const role = typeof session.user.role === 'string'
    ? session.user.role as UserRole
    : undefined

  const userRecord = session.user as Record<string, unknown>
  const branch = typeof userRecord.branch === 'string'
    ? userRecord.branch
    : null

  event.context.auth = {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role,
      branch
    },
    session: session.session
  }
})
