import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { claimRepo } from '#server/repositories/claim.repo'
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
  const asNumber = Number(params.id)

  try {
    const claim = Number.isInteger(asNumber) && asNumber > 0
      ? await claimRepo.findById(asNumber)
      : await claimRepo.findByClaimNumber(params.id)

    if (!claim) {
      throw new Error('CLAIM_NOT_FOUND')
    }

    const updated = await claimService.saveDraft(claim.id, body, user)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
