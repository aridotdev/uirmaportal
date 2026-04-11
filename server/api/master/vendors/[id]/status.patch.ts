import { z } from 'zod'
import { updateVendorStatusSchema } from '#server/database/schema'
import { mapVendorErrorToHttp, vendorService } from '#server/services/vendor.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateVendorStatusSchema.parse)

  try {
    const updated = await vendorService.toggleVendorStatus(params.id, {
      ...body,
      updatedBy: user.id
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapVendorErrorToHttp(error))
  }
})
