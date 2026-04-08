import { auth } from '#server/utils/auth-config'
import { toRequestHeaders } from '#server/utils/request-headers'

export default defineEventHandler(async (event) => {
  const headers = toRequestHeaders(event)
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return {
    success: true,
    data: session
  }
})
