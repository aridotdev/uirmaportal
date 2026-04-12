import { z } from 'zod'
import { updateUserStatusSchema } from '#server/database/schema'
import { mapUserErrorToHttp, userService } from '#server/services/user.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateUserStatusSchema.parse)

  try {
    const updated = await userService.toggleUserStatus(params.id, body)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapUserErrorToHttp(error))
  }
})
