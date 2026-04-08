import { z } from 'zod'
import { vendorClaimService, mapVendorClaimErrorToHttp } from '#server/services/vendor-claim.service'
import { requireRole } from '#server/utils/auth'

const bodySchema = z.object({
  vendorId: z.coerce.number().int().positive(),
  claimIds: z.array(z.coerce.number().int().positive()).min(1)
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['QRCC', 'ADMIN'])

  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    const created = await vendorClaimService.generateVendorClaim(body, user)
    setResponseStatus(event, 201)
    return {
      success: true,
      data: created
    }
  } catch (error: unknown) {
    throw createError(mapVendorClaimErrorToHttp(error))
  }
})
