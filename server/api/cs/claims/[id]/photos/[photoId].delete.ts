import { z } from 'zod'
import { claimPhotoService, mapPhotoServiceErrorToHttp } from '#server/services/claim-photo.service'
import { requireRole } from '#server/utils/auth'

/**
 * DELETE /api/cs/claims/:id/photos/:photoId
 *
 * Delete a specific photo from a claim.
 * Only allowed when claim is in DRAFT or NEED_REVISION status.
 */
export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])

  const params = await getValidatedRouterParams(event, z.object({
    id: z.coerce.number().int().positive(),
    photoId: z.coerce.number().int().positive()
  }).parse)

  try {
    const result = await claimPhotoService.deletePhoto(params.photoId, user)
    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    const mapped = mapPhotoServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
