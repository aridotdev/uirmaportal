import { z } from 'zod'
import { updateNotificationMasterStatusSchema } from '#server/database/schema'
import { notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateNotificationMasterStatusSchema.parse)

  try {
    const updated = await notificationService.updateNotificationStatus(params.id, {
      ...body,
      updatedBy: user.id
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOTIFICATION_NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
