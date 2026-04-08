import { z } from 'zod'
import { claimHistoryRepo } from '#server/repositories/claim-history.repo'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['QRCC', 'ADMIN'])
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  const history = await claimHistoryRepo.findByClaimId(id)
  return {
    success: true,
    data: history
  }
})
