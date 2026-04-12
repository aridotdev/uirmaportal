import { z } from 'zod'
import { mapProductModelErrorToHttp, productModelService } from '#server/services/product-model.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)

  try {
    const item = await productModelService.getProductModelById(params.id)
    return {
      success: true,
      data: item
    }
  } catch (error: unknown) {
    throw createError(mapProductModelErrorToHttp(error))
  }
})
