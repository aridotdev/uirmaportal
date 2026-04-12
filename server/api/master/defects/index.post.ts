import { insertDefectMasterSchema } from '#server/database/schema'
import { defectService, mapDefectErrorToHttp } from '#server/services/defect.service'
import { requireRole } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['ADMIN', 'QRCC'])
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
    throw createError(mapDefectErrorToHttp(error))
  }
})
