import { z } from 'zod'
import { updateUserBusinessSchema } from '#server/database/schema'
import { userService } from '#server/services/user.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const idParamSchema = z.object({
  id: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateUserBusinessSchema.parse)

  try {
    const updated = await userService.updateUserBusiness(params.id, body)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
