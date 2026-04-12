import { z } from 'zod'
import { updateNotificationMasterStatusSchema } from '#server/database/schema'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'QRCC'])
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
    throw createError(mapNotificationErrorToHttp(error))
  }
})
