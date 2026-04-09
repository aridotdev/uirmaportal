import { z } from 'zod'
import { settingsService } from '#server/services/settings.service'
import { requireRole } from '#server/utils/auth'

const updateSettingsSchema = z.object({
  general: z.object({
    maintenanceMode: z.boolean().optional()
  }).optional(),
  claim: z.object({
    maxPhotosPerClaim: z.coerce.number().int().min(1).max(20).optional(),
    maxPhotoSizeMb: z.coerce.number().int().min(1).max(20).optional()
  }).optional(),
  auditTrail: z.object({
    defaultSort: z.enum(['asc', 'desc']).optional(),
    defaultPageSize: z.coerce.number().int().min(1).max(100).optional()
  }).optional()
}).refine(value =>
  value.general !== undefined || value.claim !== undefined || value.auditTrail !== undefined,
{ message: 'At least one settings group is required' })

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN'])
  const body = await readValidatedBody(event, updateSettingsSchema.parse)

  const updated = await settingsService.updateSettings(body, user.id)

  return {
    success: true,
    data: updated
  }
})
