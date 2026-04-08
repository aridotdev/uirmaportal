import { z } from 'zod'
import { updateDefectMasterSchema } from '#server/database/schema'
import { defectService } from '#server/services/defect.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

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
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'Defect not found' })
    }

    if (message === ErrorCode.DEFECT_CODE_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Defect code already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
