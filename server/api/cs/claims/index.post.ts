import { z } from 'zod'
import { claimService, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { requireRole } from '#server/utils/auth'
import { PHOTO_TYPES } from '~~/shared/utils/constants'

const createClaimBodySchema = z.object({
  notificationCode: z.string().trim().min(1),
  modelName: z.string().trim().min(1, 'Model name is required'),
  inch: z.coerce.number().int().positive(),
  branch: z.string().trim().min(1),
  vendorName: z.string().trim().min(1, 'Vendor code is required'),
  defectCode: z.string().trim().min(1),
  defectName: z.string().trim().min(1),
  panelPartNumber: z.string().trim().min(1),
  ocSerialNo: z.string().trim().min(1),
  odfNumber: z.string().trim().min(1).optional(),
  odfVersion: z.string().trim().min(1).optional(),
  odfWeek: z.string().trim().min(1).optional(),
  photos: z.array(z.object({
    photoType: z.enum(PHOTO_TYPES),
    label: z.string(),
    file: z.unknown()
  })).optional(),
  submitAs: z.enum(['DRAFT', 'SUBMITTED'])
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CS'])
  const body = await readValidatedBody(event, createClaimBodySchema.parse)

  try {
    const created = await claimService.createClaim(body, user)
    setResponseStatus(event, 201)
    return {
      success: true,
      data: created
    }
  } catch (error: unknown) {
    const mapped = mapClaimServiceErrorToHttp(error)
    throw createError(mapped)
  }
})
