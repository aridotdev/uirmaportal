import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { requireRole } from '#server/utils/auth'

const routeParamSchema = z.object({
  id: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])
  const params = await getValidatedRouterParams(event, routeParamSchema.parse)

  try {
    const claimId = await claimService.resolveClaimId(params.id)
    const detail = await claimService.getClaimDetailForCs(claimId, user.id)
    return {
      success: true,
      data: detail
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
