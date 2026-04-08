import { z } from 'zod'
import { userService } from '#server/services/user.service'
import { requireAuth, requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const idParamSchema = z.object({
  id: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const user = requireAuth(event)

  if (user.role !== 'ADMIN' && user.id !== params.id) {
    requireRole(event, ['ADMIN'])
  }

  try {
    const data = await userService.getUserById(params.id)
    return {
      success: true,
      data
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
