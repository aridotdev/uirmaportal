import { insertNotificationMasterSchema } from '#server/database/schema'
import { notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
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
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOTIFICATION_CODE_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Notification code already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
