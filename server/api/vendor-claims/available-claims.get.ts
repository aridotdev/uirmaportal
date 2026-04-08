import { z } from 'zod'
import { vendorClaimService, mapVendorClaimErrorToHttp } from '#server/services/vendor-claim.service'
import { requireRole } from '#server/utils/auth'

const querySchema = z.object({
  vendorId: z.coerce.number().int().positive(),
  fiscalLabel: z.string().trim().optional(),
  fiscalYear: z.coerce.number().int().min(2020).max(2099).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['QRCC', 'ADMIN'])

  const query = await getValidatedQuery(event, querySchema.parse)

  try {
    const data = await vendorClaimService.getAvailableClaimsForBatch(query.vendorId, {
      fiscalLabel: query.fiscalLabel,
      fiscalYear: query.fiscalYear
    })

    return {
      success: true,
      data
    }
  } catch (error: unknown) {
    throw createError(mapVendorClaimErrorToHttp(error))
  }
})
