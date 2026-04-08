import { z } from 'zod'
import { claimRepo } from '#server/repositories/claim.repo'
import { claimPhotoService, mapPhotoServiceErrorToHttp } from '#server/services/claim-photo.service'
import { requireRole } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

/**
 * GET /api/cs/claims/:id/photos
 *
 * Return all photos for a given claim (CS view — own claims only).
 */
export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.coerce.number().int().positive()
  }).parse)

  // Verify claim ownership
  const existing = await claimRepo.findById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Claim not found' })
  }
  if (existing.submittedBy !== user.id) {
    throw createError({ statusCode: 403, statusMessage: ErrorCode.FORBIDDEN })
  }

  try {
    const photos = await claimPhotoService.getPhotosByClaimId(id)
    return {
      success: true,
      data: photos
    }
  } catch (error: unknown) {
    const mapped = mapPhotoServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
