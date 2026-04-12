import { z } from 'zod'
import { vendorClaimService, mapVendorClaimErrorToHttp } from '#server/services/vendor-claim.service'
import { requireRole } from '#server/utils/auth'
import { VENDOR_DECISIONS } from '~~/shared/utils/constants'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive()
})

const bodySchema = z.object({
  vendorDecision: z.enum(VENDOR_DECISIONS),
  compensation: z.coerce.number().int().nonnegative().optional(),
  rejectReason: z.string().trim().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, ['QRCC', 'ADMIN'])

  const { id, itemId } = await getValidatedRouterParams(event, paramsSchema.parse)
  const body = await readValidatedBody(event, bodySchema.parse)

  try {
    const updated = await vendorClaimService.updateVendorDecision(id, itemId, body, user)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    throw createError(mapVendorClaimErrorToHttp(error))
  }
})
