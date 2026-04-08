import { z } from 'zod'
import { auth } from '#server/utils/auth-config'
import { toRequestHeaders } from '#server/utils/request-headers'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  revokeOtherSessions: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, changePasswordSchema.parse)
  const headers = toRequestHeaders(event)

  return auth.api.changePassword({
    body,
    headers,
    asResponse: true
  })
})
