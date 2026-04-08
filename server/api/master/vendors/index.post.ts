import { insertVendorSchema } from '#server/database/schema'
import { vendorService } from '#server/services/vendor.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

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
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.VENDOR_CODE_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Vendor code already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
