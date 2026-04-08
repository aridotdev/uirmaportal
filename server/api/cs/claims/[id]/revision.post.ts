import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { claimRepo } from '#server/repositories/claim.repo'
import { requireRole } from '#server/utils/auth'
import { PHOTO_TYPES } from '~~/shared/utils/constants'

const routeParamSchema = z.object({
  id: z.string().min(1)
})

const revisionBodySchema = z.object({
  revisedFields: z.record(z.string(), z.string()).default({}),
  replacedPhotos: z.array(z.object({
    photoType: z.enum(PHOTO_TYPES),
    file: z.unknown()
  })).default([]),
  revisionNote: z.string().trim().min(1)
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])
  const params = await getValidatedRouterParams(event, routeParamSchema.parse)
  const body = await readValidatedBody(event, revisionBodySchema.parse)
  const asNumber = Number(params.id)

  try {
    const claim = Number.isInteger(asNumber) && asNumber > 0
      ? await claimRepo.findById(asNumber)
      : await claimRepo.findByClaimNumber(params.id)

    if (!claim) {
      throw new Error('CLAIM_NOT_FOUND')
    }

    const updated = await claimService.submitRevision(claim.id, body, user)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
