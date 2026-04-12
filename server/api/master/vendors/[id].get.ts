import { z } from 'zod'
import { mapVendorErrorToHttp, vendorService } from '#server/services/vendor.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'QRCC'])

  const params = await getValidatedRouterParams(event, idParamSchema.parse)

  try {
    const item = await vendorService.getVendorById(params.id)
    return {
      success: true,
      data: item
    }
  } catch (error: unknown) {
    throw createError(mapVendorErrorToHttp(error))
  }
})
