import { z } from 'zod'
import { mapProductModelErrorToHttp, productModelService } from '#server/services/product-model.service'
import { requireRole } from '#server/utils/auth'

const listProductModelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'QRCC'])

  const query = await getValidatedQuery(event, listProductModelQuerySchema.parse)

  try {
    const result = await productModelService.getProductModels(query)

    return {
      success: true,
      data: result.items,
      pagination: result.pagination
    }
  } catch (error: unknown) {
    throw createError(mapProductModelErrorToHttp(error))
  }
})
