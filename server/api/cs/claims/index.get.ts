import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { requireRole } from '#server/utils/auth'
import { CLAIM_STATUSES } from '~~/shared/utils/constants'

const listClaimQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  status: z.union([z.enum(CLAIM_STATUSES), z.array(z.enum(CLAIM_STATUSES))]).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['CS'])
  const query = await getValidatedQuery(event, listClaimQuerySchema.parse)

  try {
    const result = await claimService.getClaimsForCs(user.id, query)
    return {
      success: true,
      data: result.items,
      pagination: result.pagination
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
