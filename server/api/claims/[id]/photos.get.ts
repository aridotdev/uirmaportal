import { z } from 'zod'
import { claimPhotoRepo } from '#server/repositories/claim-photo.repo'
import { mapClaimReviewErrorToHttp } from '#server/services/claim-review.service'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['QRCC', 'ADMIN'])
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  try {
    const photos = await claimPhotoRepo.findByClaimId(id)
    return {
      success: true,
      data: photos
    }
  } catch (error: unknown) {
    throw createError(mapClaimReviewErrorToHttp(error))
  }
})
