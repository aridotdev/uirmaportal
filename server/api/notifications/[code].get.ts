import { z } from 'zod'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'
import { requireAuth } from '#server/utils/auth'

const routeParamSchema = z.object({
  code: z.string().trim().min(1)
})

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const params = await getValidatedRouterParams(event, routeParamSchema.parse)

  try {
    const result = await notificationService.lookupByCode(params.code)

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    throw createError(mapNotificationErrorToHttp(error))
  }
})
