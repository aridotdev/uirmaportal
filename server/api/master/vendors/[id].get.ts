import { z } from 'zod'
import { vendorService } from '#server/services/vendor.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'QRCC'])

  const params = await getValidatedRouterParams(event, idParamSchema.parse)

  try {
    const item = await vendorService.getVendorById(params.id)
    return {
      success: true,
      data: item
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
