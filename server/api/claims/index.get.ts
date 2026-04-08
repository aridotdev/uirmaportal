import { z } from 'zod'
import { claimReviewService, mapClaimReviewErrorToHttp } from '#server/services/claim-review.service'
import { requireRole } from '#server/utils/auth'
import { CLAIM_STATUSES } from '~~/shared/utils/constants'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  branch: z.string().trim().optional(),
  status: z.union([
    z.enum(CLAIM_STATUSES),
    z.array(z.enum(CLAIM_STATUSES))
  ]).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['QRCC', 'ADMIN'])

  const query = await getValidatedQuery(event, querySchema.parse)

  try {
    const result = await claimReviewService.getClaimsForReview(query)
    return {
      success: true,
      data: result.items,
      pagination: result.pagination
    }
  } catch (error: unknown) {
    throw createError(mapClaimReviewErrorToHttp(error))
  }
})
