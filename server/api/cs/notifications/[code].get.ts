import { z } from 'zod'
import { mapNotificationErrorToHttp, notificationService } from '#server/services/notification.service'

const codeParamSchema = z.object({
  code: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, codeParamSchema.parse)

  try {
    return await notificationService.lookupByCode(params.code)
  } catch (error: unknown) {
    const mapped = mapNotificationErrorToHttp(error)
    if (mapped.statusCode === 404) {
      return null
    }

    throw createError(mapped)
  }
})
