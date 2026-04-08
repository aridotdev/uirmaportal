import { z } from 'zod'
import { claimPhotoRepo } from '#server/repositories/claim-photo.repo'
import { requireRole } from '#server/utils/auth'

const paramsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['QRCC', 'ADMIN'])
  const { id } = await getValidatedRouterParams(event, paramsSchema.parse)

  const photos = await claimPhotoRepo.findByClaimId(id)
  return {
    success: true,
    data: photos
  }
})
