import { z } from 'zod'
import { vendorClaimService, mapVendorClaimErrorToHttp } from '#server/services/vendor-claim.service'
import { requireRole } from '#server/utils/auth'
import { VENDOR_CLAIM_STATUSES } from '~~/shared/utils/constants'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  status: z.union([
    z.enum(VENDOR_CLAIM_STATUSES),
    z.array(z.enum(VENDOR_CLAIM_STATUSES))
  ]).optional(),
  fiscalLabel: z.string().trim().optional(),
  fiscalYear: z.coerce.number().int().min(2020).max(2099).optional()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['QRCC', 'ADMIN'])

  const query = await getValidatedQuery(event, querySchema.parse)

  try {
    const result = await vendorClaimService.getVendorClaims(query)

    return {
      success: true,
      data: result.items,
      pagination: result.pagination
    }
  } catch (error: unknown) {
    throw createError(mapVendorClaimErrorToHttp(error))
  }
})
