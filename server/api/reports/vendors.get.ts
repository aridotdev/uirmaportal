import { z } from 'zod'
import { mapReportErrorToHttp, reportService } from '#server/services/report.service'
import { requireRole } from '#server/utils/auth'
import { PERIOD_FILTER_MODES } from '~~/shared/utils/fiscal'

const reportQuerySchema = z.object({
  mode: z.enum(PERIOD_FILTER_MODES).default('this_fiscal_half'),
  customStartDate: z.string().optional(),
  customEndDate: z.string().optional(),
  branch: z.string().trim().min(1).optional(),
  vendorId: z.coerce.number().int().positive().optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['QRCC', 'MANAGEMENT', 'ADMIN'])

  const query = await getValidatedQuery(event, reportQuerySchema.parse)

  try {
    const result = await reportService.getVendorPerformance(query)

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    throw createError(mapReportErrorToHttp(error))
  }
})
