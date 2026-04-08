import { z } from 'zod'
import { updateProductModelSchema } from '#server/database/schema'
import { productModelService } from '#server/services/product-model.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateProductModelSchema.parse)

  try {
    const updated = await productModelService.updateProductModel(params.id, {
      ...body,
      updatedBy: user.id
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Product model not found' })
    }

    if (message === ErrorCode.MODEL_NAME_VENDOR_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Product model for vendor already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
