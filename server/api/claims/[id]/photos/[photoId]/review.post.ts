import { z } from 'zod'
import { CLAIM_PHOTO_STATUSES } from '~~/shared/utils/constants'
import { claimReviewService, mapClaimReviewErrorToHttp } from '#server/services/claim-review.service'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  photoId: z.coerce.number().int().positive()
})

const bodySchema = z.object({
  decision: z.enum(CLAIM_PHOTO_STATUSES),
  rejectReason: z.string().trim().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['QRCC', 'ADMIN'])
  const { id, photoId } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    const reviewed = await claimReviewService.reviewPhoto(id, photoId, body.decision, body.rejectReason ?? null, user)
    return {
      success: true,
      data: reviewed
    }
  } catch (error: unknown) {
    throw createError(mapClaimReviewErrorToHttp(error))
  }
})
