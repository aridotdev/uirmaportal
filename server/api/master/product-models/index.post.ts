import { insertProductModelSchema } from '#server/database/schema'
import { productModelService } from '#server/services/product-model.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const body = await readValidatedBody(event, insertProductModelSchema.parse)

  try {
    const created = await productModelService.createProductModel({
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

    if (message === ErrorCode.MODEL_NAME_VENDOR_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Product model for vendor already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
