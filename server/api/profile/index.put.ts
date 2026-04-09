import { z } from 'zod'
import { userService } from '#server/services/user.service'
import { requireAuth } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional()
}).refine(value => value.name !== undefined || value.email !== undefined, {
  message: 'At least one field is required'
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, updateProfileSchema.parse)

  try {
    const updated = await userService.updateProfile(user.id, body)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.EMAIL_ALREADY_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
