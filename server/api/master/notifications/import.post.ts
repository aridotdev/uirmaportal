import { z } from 'zod'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'

const importBodySchema = z.object({
  rows: z.array(z.unknown()).min(1)
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const body = await readValidatedBody(event, importBodySchema.parse)

  try {
    const result = await notificationService.importFromExcel(body.rows, user.id)

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    throw createError(mapNotificationErrorToHttp(error))
  }
})
