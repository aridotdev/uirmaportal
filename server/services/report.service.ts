import { ErrorCode } from '#server/utils/error-codes'
import { reportRepo } from '#server/repositories/report.repo'
import type { ReportFilter } from '~~/shared/types/database'

export const reportService = {
  async getDashboardKpi(filter: ReportFilter) {
    return await reportRepo.getDashboardKpi(filter)
  },

  async getClaimsByVendor(filter: ReportFilter) {
    return await reportRepo.getClaimsByVendor(filter)
  },

  async getClaimsByBranch(filter: ReportFilter) {
    return await reportRepo.getClaimsByBranch(filter)
  },

  async getTopDefects(filter: ReportFilter) {
    return await reportRepo.getTopDefects(filter)
  },

  async getMonthlyTrend(filter: ReportFilter) {
    return await reportRepo.getMonthlyTrend(filter)
  },

  async getBranchPerformance(filter: ReportFilter) {
    return await reportRepo.getBranchPerformance(filter)
  },

  async getVendorPerformance(filter: ReportFilter) {
    return await reportRepo.getVendorPerformance(filter)
  },

  async getAgingAnalysis(filter: ReportFilter) {
    return await reportRepo.getAgingAnalysis(filter)
  },

  async getDefectAnalysis(filter: ReportFilter) {
    return await reportRepo.getDefectAnalysis(filter)
  }
}

export function mapReportErrorToHttp(error: unknown): { statusCode: number, statusMessage: string } {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.VALIDATION_FAILED) {
    return { statusCode: 400, statusMessage: 'Invalid report parameters' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
