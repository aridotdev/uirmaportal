import { z } from 'zod'
import { claimPhotoService, mapPhotoServiceErrorToHttp } from '#server/services/claim-photo.service'
import { requireRole } from '#server/utils/auth'
import { PHOTO_TYPES } from '~~/shared/utils/constants'

/**
 * POST /api/cs/claims/:id/photos
 *
 * Handle multipart form upload for claim photos.
 * Accepts a single file + photoType field.
 *
 * - Max 5MB per file
 * - Only JPG/PNG allowed
 * - Saves to public/uploads/claims/{claimId}/{photoType}.{ext}
 * - Inserts/updates claim_photo record
 * - Logs UPLOAD_PHOTO history entry
 */
export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])

  // Validate route param
  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.coerce.number().int().positive()
  }).parse)

  // Read multipart form data
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No form data provided' })
  }

  // Extract photoType field
  const photoTypeField = formData.find(part => part.name === 'photoType')
  if (!photoTypeField || !photoTypeField.data) {
    throw createError({ statusCode: 400, statusMessage: 'photoType field is required' })
  }

  const photoTypeValue = photoTypeField.data.toString('utf-8').trim()
  const photoTypeParsed = z.enum(PHOTO_TYPES).safeParse(photoTypeValue)
  if (!photoTypeParsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid photoType. Must be one of: ${PHOTO_TYPES.join(', ')}`
    })
  }

  // Extract file
  const filePart = formData.find(part => part.name === 'file' && part.filename)
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createError({ statusCode: 400, statusMessage: 'file field is required' })
  }

  try {
    const photo = await claimPhotoService.uploadPhoto({
      claimId: id,
      photoType: photoTypeParsed.data,
      file: {
        filename: filePart.filename,
        type: filePart.type || 'application/octet-stream',
        data: filePart.data
      }
    }, user)

    setResponseStatus(event, 201)
    return {
      success: true,
      data: photo
    }
  } catch (error: unknown) {
    const mapped = mapPhotoServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
