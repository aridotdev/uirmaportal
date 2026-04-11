import { z } from 'zod'
import { updateUserBusinessSchema } from '#server/database/schema'
import { mapUserErrorToHttp, userService } from '#server/services/user.service'
import { requireRole } from '#server/utils/auth'

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
    throw createError(mapUserErrorToHttp(error))
  }
})
