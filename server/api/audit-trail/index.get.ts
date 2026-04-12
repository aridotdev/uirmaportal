import { z } from 'zod'
import { claimService, auditTrailActions, auditTrailUserRoles, mapClaimServiceErrorToHttp } from '#server/services/claim.service'
import { requireRole } from '#server/utils/auth'

const auditTrailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  action: z.enum(auditTrailActions).optional(),
  userRole: z.enum(auditTrailUserRoles).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sort: z.enum(['asc', 'desc']).default('desc')
})

export default defineEventHandler(async (event) => {
  await requireRole(event, ['QRCC', 'ADMIN'])

  const query = await getValidatedQuery(event, auditTrailQuerySchema.parse)
  try {
    const result = await claimService.getAuditTrail(query)

    return {
      success: true,
      data: result.items,
      pagination: result.pagination
    }
  } catch (error: unknown) {
    throw createError(mapClaimServiceErrorToHttp(error))
  }
})
