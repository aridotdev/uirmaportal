import { insertDefectMasterSchema } from '#server/database/schema'
import { defectService } from '#server/services/defect.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const body = await readValidatedBody(event, insertDefectMasterSchema.parse)

  try {
    const created = await defectService.createDefect({
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

    if (message === ErrorCode.DEFECT_CODE_EXISTS) {
      throw createError({ statusCode: 409, statusMessage: 'Defect code already exists' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
