import { z } from 'zod'
import { notificationService } from '#server/services/notification.service'
import { ErrorCode } from '#server/utils/error-codes'

const codeParamSchema = z.object({
  code: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(event, codeParamSchema.parse)

  try {
    const result = await notificationService.lookupByCode(params.code)

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOTIFICATION_NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Notification not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
