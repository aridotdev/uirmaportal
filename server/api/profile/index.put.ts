import { z } from 'zod'
import { mapProfileErrorToHttp, userService } from '#server/services/user.service'
import { requireAuth } from '#server/utils/auth'

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().email().optional()
}).refine(value => value.name !== undefined || value.email !== undefined, {
  message: 'At least one field is required'
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readValidatedBody(event, updateProfileSchema.parse)

  try {
    const updated = await userService.updateProfile(user.id, body)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapProfileErrorToHttp(error))
  }
})
