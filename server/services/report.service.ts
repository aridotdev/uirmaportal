import { ErrorCode } from '#server/utils/error-codes'
import { reportRepo } from '#server/repositories/report.repo'
import type { ReportFilter } from '~~/shared/types/database'

export interface ExecutiveKpi {
  totalClaims: number
  submittedClaims: number
  inReviewClaims: number
  needRevisionClaims: number
  approvedClaims: number
  archivedClaims: number
  draftClaims: number
  approvalRate: number
  avgReviewLeadTimeDays: number | null
  vendorPendingItems: number
}

export interface ClaimsByBranchRow {
  branch: string
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  approvalRate: number
}

export interface BranchPerformanceRow {
  branch: string
  totalClaims: number
  approved: number
  needRevision: number
  inReview: number
  approvalRate: number
  avgLeadTimeDays: number | null
}

export interface VendorPerformanceRow {
  vendorId: number
  vendorCode: string
  vendorName: string
  totalClaims: number
  acceptedItems: number
  rejectedItems: number
  acceptanceRate: number
  totalCompensation: number
}

export interface AgingBucket {
  bucket: string
  count: number
}

export const reportService = {
  async getDashboardKpi(filter: ReportFilter): Promise<ExecutiveKpi> {
    const raw = await reportRepo.getDashboardKpi(filter)
    const statusMap: Record<string, number> = {}

    for (const row of raw.statusCounts) {
      statusMap[row.status] = row.count
    }

    const totalClaims = Object.values(statusMap).reduce((a, b) => a + b, 0)
    const approvedClaims = statusMap.APPROVED ?? 0
    const approvalRate = totalClaims > 0
      ? Math.round((approvedClaims / totalClaims) * 10000) / 100
      : 0

    return {
      totalClaims,
      submittedClaims: statusMap.SUBMITTED ?? 0,
      inReviewClaims: statusMap.IN_REVIEW ?? 0,
      needRevisionClaims: statusMap.NEED_REVISION ?? 0,
      approvedClaims,
      archivedClaims: statusMap.ARCHIVED ?? 0,
      draftClaims: statusMap.DRAFT ?? 0,
      approvalRate,
      avgReviewLeadTimeDays: raw.leadTimeAvgRaw == null
        ? null
        : Math.round(raw.leadTimeAvgRaw * 100) / 100,
      vendorPendingItems: raw.vendorPendingCount
    }
  },

  async getClaimsByVendor(filter: ReportFilter) {
    return await reportRepo.getClaimsByVendor(filter)
  },

  async getClaimsByBranch(filter: ReportFilter): Promise<ClaimsByBranchRow[]> {
    const rows = await reportRepo.getClaimsByBranch(filter)

    return rows.map(row => ({
      branch: row.branch,
      totalClaims: row.totalClaims,
      approvedClaims: row.approvedClaims,
      rejectedClaims: row.rejectedClaims,
      approvalRate: row.totalClaims > 0
        ? Math.round((row.approvedClaims / row.totalClaims) * 10000) / 100
        : 0
    }))
  },

  async getTopDefects(filter: ReportFilter) {
    return await reportRepo.getTopDefects(filter)
  },

  async getMonthlyTrend(filter: ReportFilter) {
    return await reportRepo.getMonthlyTrend(filter)
  },

  async getBranchPerformance(filter: ReportFilter): Promise<BranchPerformanceRow[]> {
    const raw = await reportRepo.getBranchPerformance(filter)
    const leadTimeMap: Record<string, number | null> = {}

    for (const row of raw.branchLeadTimes) {
      leadTimeMap[row.branch] = row.avgDays == null
        ? null
        : Math.round(row.avgDays * 100) / 100
    }

    return raw.branchCounts.map(row => ({
      branch: row.branch,
      totalClaims: row.totalClaims,
      approved: row.approved,
      needRevision: row.needRevision,
      inReview: row.inReview,
      approvalRate: row.totalClaims > 0
        ? Math.round((row.approved / row.totalClaims) * 10000) / 100
        : 0,
      avgLeadTimeDays: leadTimeMap[row.branch] ?? null
    }))
  },

  async getVendorPerformance(filter: ReportFilter): Promise<VendorPerformanceRow[]> {
    const raw = await reportRepo.getVendorPerformance(filter)
    const decisionMap: Record<number, { accepted: number, rejected: number, compensation: number }> = {}

    for (const row of raw.vendorDecisions) {
      decisionMap[row.vendorId] = {
        accepted: row.acceptedItems,
        rejected: row.rejectedItems,
        compensation: row.totalCompensation
      }
    }

    return raw.vendorClaims.map((row) => {
      const decisions = decisionMap[row.vendorId] ?? { accepted: 0, rejected: 0, compensation: 0 }
      const totalDecided = decisions.accepted + decisions.rejected

      return {
        vendorId: row.vendorId,
        vendorCode: row.vendorCode,
        vendorName: row.vendorName,
        totalClaims: row.totalClaims,
        acceptedItems: decisions.accepted,
        rejectedItems: decisions.rejected,
        acceptanceRate: totalDecided > 0
          ? Math.round((decisions.accepted / totalDecided) * 10000) / 100
          : 0,
        totalCompensation: decisions.compensation
      }
    })
  },

  async getAgingAnalysis(filter: ReportFilter): Promise<AgingBucket[]> {
    const rows = await reportRepo.getAgingAnalysis(filter)
    const bucketOrder = ['0-7 days', '8-14 days', '15-30 days', '30+ days']
    const bucketMap: Record<string, number> = {}

    for (const row of rows) {
      bucketMap[row.bucket] = row.count
    }

    return bucketOrder.map(bucket => ({
      bucket,
      count: bucketMap[bucket] ?? 0
    }))
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
