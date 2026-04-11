import { z } from 'zod'
import { updateDefectMasterSchema } from '#server/database/schema'
import { defectService, mapDefectErrorToHttp } from '#server/services/defect.service'
import { requireRole } from '#server/utils/auth'

const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const params = await getValidatedRouterParams(event, idParamSchema.parse)
  const body = await readValidatedBody(event, updateDefectMasterSchema.parse)

  try {
    const updated = await defectService.updateDefect(params.id, {
      ...body,
      updatedBy: user.id
    })

    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapDefectErrorToHttp(error))
  }
})
