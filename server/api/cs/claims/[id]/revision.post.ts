import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
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
  const user = await requireRole(event, ['CS'])
  const params = await getValidatedRouterParams(event, routeParamSchema.parse)
  const body = await readValidatedBody(event, revisionBodySchema.parse)

  try {
    const claimId = await claimService.resolveClaimId(params.id)
    const updated = await claimService.submitRevision(claimId, body, user)
    return {
      success: true,
      data: updated
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
