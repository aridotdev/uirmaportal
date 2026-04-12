import { z } from 'zod'
import { vendorClaimService, mapVendorClaimErrorToHttp } from '#server/services/vendor-claim.service'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['QRCC', 'ADMIN'])

  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  try {
    const exported = await vendorClaimService.exportToExcel(id)
    return {
      success: true,
      data: exported
    }
  } catch (error: unknown) {
    throw createError(mapVendorClaimErrorToHttp(error))
  }
})
