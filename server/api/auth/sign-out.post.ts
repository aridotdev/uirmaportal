import { auth } from '#server/utils/auth-config'
import { toRequestHeaders } from '#server/utils/request-headers'

export default defineEventHandler(async (event) => {
  const headers = toRequestHeaders(event)

  return auth.api.signOut({
    headers,
    asResponse: true
  })
})
