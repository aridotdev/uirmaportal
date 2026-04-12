import { z } from 'zod'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'
import { requireRole } from '#server/utils/auth'
import { NOTIFICATION_STATUSES } from '~~/shared/utils/constants'

const listNotificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  branch: z.string().trim().min(1).optional()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'QRCC'])
  const query = await getValidatedQuery(event, listNotificationQuerySchema.parse)

  try {
    const result = await notificationService.getNotifications(query)

    return {
      success: true,
      data: result.items,
      pagination: result.pagination
    }
  } catch (error: unknown) {
    throw createError(mapNotificationErrorToHttp(error))
  }
})
