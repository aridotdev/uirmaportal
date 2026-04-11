import { z } from 'zod'
import { mapUserErrorToHttp, userService } from '#server/services/user.service'
import { requireAuth, requireRole } from '#server/utils/auth'

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
    throw createError(mapUserErrorToHttp(error))
  }
})
