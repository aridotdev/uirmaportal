import { insertProductModelSchema } from '#server/database/schema'
import { mapProductModelErrorToHttp, productModelService } from '#server/services/product-model.service'
import { requireRole } from '#server/utils/auth'

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
    throw createError(mapProductModelErrorToHttp(error))
  }
})
