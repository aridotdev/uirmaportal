import { z } from 'zod'
import { updateNotificationMasterSchema } from '#server/database/schema'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateNotificationMasterSchema.parse)

  try {
    const updated = await notificationService.updateNotification(params.id, {
      ...body,
      updatedBy: user.id
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapNotificationErrorToHttp(error))
  }
})
