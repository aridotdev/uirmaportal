import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { requireRole } from '#server/utils/auth'

const routeParamSchema = z.object({
  id: z.string().min(1)
})

const updateDraftBodySchema = z.object({
  panelPartNumber: z.string().trim().min(1).optional(),
  ocSerialNo: z.string().trim().min(1).optional(),
  defectCode: z.string().trim().min(1).optional(),
  odfNumber: z.string().trim().min(1).optional(),
  version: z.string().trim().min(1).optional(),
  week: z.string().trim().min(1).optional()
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])
  const params = await getValidatedRouterParams(event, routeParamSchema.parse)
  const body = await readValidatedBody(event, updateDraftBodySchema.parse)

  try {
    const claimId = await claimService.resolveClaimId(params.id)
    const updated = await claimService.saveDraft(claimId, body, user)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
