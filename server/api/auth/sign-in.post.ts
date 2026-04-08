import { z } from 'zod'
import { auth } from '#server/utils/auth-config'
import { toRequestHeaders } from '#server/utils/request-headers'

const signInSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, signInSchema.parse)
  const headers = toRequestHeaders(event)

  if (body.identifier.includes('@')) {
    return auth.api.signInEmail({
      body: {
        email: body.identifier,
        password: body.password,
        rememberMe: body.rememberMe
      },
      headers,
      asResponse: true
    })
  }

  return auth.api.signInUsername({
    body: {
      username: body.identifier,
      password: body.password,
      rememberMe: body.rememberMe
    },
    headers,
    asResponse: true
  })
})
