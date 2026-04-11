import { insertVendorSchema } from '#server/database/schema'
import { mapVendorErrorToHttp, vendorService } from '#server/services/vendor.service'
import { requireRole } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const body = await readValidatedBody(event, insertVendorSchema.parse)

  try {
    const created = await vendorService.createVendor({
      ...body,
      createdBy: user.id,
      updatedBy: user.id
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      data: created
    }
  } catch (error: unknown) {
    throw createError(mapVendorErrorToHttp(error))
  }
})
