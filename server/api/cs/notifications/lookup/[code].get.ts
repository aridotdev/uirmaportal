import { z } from 'zod'
import { notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const routeParamSchema = z.object({
  code: z.string().trim().min(1)
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['CS'])
  const params = await getValidatedRouterParams(event, routeParamSchema.parse)

  try {
    const result = await notificationService.lookupByCode(params.code)
    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

    if (message === ErrorCode.NOTIFICATION_NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
