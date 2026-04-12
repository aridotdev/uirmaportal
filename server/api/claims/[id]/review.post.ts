import { z } from 'zod'
import { CLAIM_PHOTO_STATUSES } from '~~/shared/utils/constants'
import { claimReviewService, mapClaimReviewErrorToHttp } from '#server/services/claim-review.service'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const bodySchema = z.object({
  photos: z.array(z.object({
    photoId: z.coerce.number().int().positive(),
    status: z.enum(CLAIM_PHOTO_STATUSES),
    note: z.string().trim().optional()
  })).min(1)
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['QRCC', 'ADMIN'])
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    for (const item of body.photos) {
      await claimReviewService.reviewPhoto(
        id,
        item.photoId,
        item.status,
        item.status === 'REJECT' ? (item.note ?? null) : null,
        user
      )
    }

    const finalized = await claimReviewService.finalizeReview(id, user)
    return {
      success: true,
      data: finalized
    }
  } catch (error: unknown) {
    throw createError(mapClaimReviewErrorToHttp(error))
  }
})
