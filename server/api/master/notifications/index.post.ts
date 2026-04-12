import { insertNotificationMasterSchema } from '#server/database/schema'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'QRCC'])
  const body = await readValidatedBody(event, insertNotificationMasterSchema.parse)

  try {
    const created = await notificationService.createNotification({
      notificationCode: body.notificationCode,
      notificationDate: body.notificationDate,
      modelId: body.modelId,
      branch: body.branch,
      vendorId: body.vendorId,
      status: body.status,
      createdBy: user.id,
      updatedBy: user.id
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      data: created
    }
  } catch (error: unknown) {
    throw createError(mapNotificationErrorToHttp(error))
  }
})
