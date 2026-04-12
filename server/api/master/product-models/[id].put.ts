import { z } from 'zod'
import { updateProductModelSchema } from '#server/database/schema'
import { mapProductModelErrorToHttp, productModelService } from '#server/services/product-model.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'QRCC'])
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
    throw createError(mapProductModelErrorToHttp(error))
  }
})
