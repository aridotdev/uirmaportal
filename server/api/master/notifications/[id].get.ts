import { z } from 'zod'
import { notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)

  try {
    const item = await notificationService.getNotificationById(params.id)
    return {
      success: true,
      data: item
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOTIFICATION_NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
