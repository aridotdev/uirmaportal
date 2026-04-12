import { z } from 'zod'
import { updateClaimSchema } from '#server/database/schema'
import { claimReviewService, mapClaimReviewErrorToHttp } from '#server/services/claim-review.service'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const bodySchema = updateClaimSchema.pick({
  panelPartNumber: true,
  ocSerialNo: true,
  defectCode: true,
  odfNumber: true,
  version: true,
  week: true
}).partial()

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['QRCC', 'ADMIN'])
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    const updated = await claimReviewService.updateClaimFields(id, body, user)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapClaimReviewErrorToHttp(error))
  }
})
