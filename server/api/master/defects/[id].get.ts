import { z } from 'zod'
import { defectService, mapDefectErrorToHttp } from '#server/services/defect.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)

  try {
    const item = await defectService.getDefectById(params.id)
    return {
      success: true,
      data: item
    }
  } catch (error: unknown) {
    throw createError(mapDefectErrorToHttp(error))
  }
})
