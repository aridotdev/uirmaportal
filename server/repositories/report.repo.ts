import { and, avg, count, eq, gte, lte, sql } from 'drizzle-orm'
import db from '#server/database'
import { claim, defectMaster, productModel, vendor, vendorClaimItem } from '#server/database/schema'
import { resolvePeriodFilter } from '~~/shared/utils/fiscal'
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

export interface ClaimsByVendorRow {
  vendorId: number
  vendorCode: string
  vendorName: string
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  pendingClaims: number
}

export interface ClaimsByBranchRow {
  branch: string
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  approvalRate: number
}

export interface TopDefectRow {
  defectCode: string
  defectName: string
  totalClaims: number
}

export interface MonthlyTrendRow {
  calendarYear: number
  calendarMonth: number
  inflow: number
  closure: number
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

export interface DefectAnalysisRow {
  defectCode: string
  defectName: string
  vendorCode: string
  vendorName: string
  modelName: string
  totalClaims: number
}

function buildDateFilter(filter: ReportFilter) {
  const range = resolvePeriodFilter(
    filter.mode ?? 'this_fiscal_half',
    undefined,
    filter.customStartDate && filter.customEndDate
      ? { startDate: filter.customStartDate, endDate: filter.customEndDate }
      : undefined
  )
  const conditions = [
    gte(claim.createdAt, range.startDate),
    lte(claim.createdAt, range.endDate)
  ]

  if (filter.branch) {
    conditions.push(eq(claim.branch, filter.branch))
  }
  if (filter.vendorId) {
    conditions.push(eq(claim.vendorId, filter.vendorId))
  }

  return { conditions }
}

export const reportRepo = {
  async getDashboardKpi(filter: ReportFilter): Promise<ExecutiveKpi> {
    const { conditions } = buildDateFilter(filter)

    const statusCounts = await db
      .select({
        status: claim.claimStatus,
        count: count()
      })
      .from(claim)
      .where(and(...conditions))
      .groupBy(claim.claimStatus)

    const statusMap: Record<string, number> = {}
    for (const row of statusCounts) {
      statusMap[row.status] = row.count
    }

    const totalClaims = Object.values(statusMap).reduce((a, b) => a + b, 0)
    const approvedClaims = statusMap.APPROVED ?? 0
    const approvalRate = totalClaims > 0
      ? Math.round((approvedClaims / totalClaims) * 10000) / 100
      : 0

    const leadTimeResult = await db
      .select({
        avgDays: avg(
          sql<number>`(
            SELECT (ch2.created_at - ch1.created_at) / 86400000.0
            FROM claim_history ch1
            INNER JOIN claim_history ch2 ON ch1.claim_id = ch2.claim_id
            WHERE ch1.action = 'SUBMIT'
              AND ch2.action = 'APPROVE'
              AND ch1.claim_id = ${claim.id}
            LIMIT 1
          )`
        ).as('avgDays')
      })
      .from(claim)
      .where(and(
        ...conditions,
        eq(claim.claimStatus, 'APPROVED')
      ))

    const avgReviewLeadTimeDays = leadTimeResult[0]?.avgDays
      ? Math.round(Number(leadTimeResult[0].avgDays) * 100) / 100
      : null

    const vendorPendingResult = await db
      .select({ count: count() })
      .from(vendorClaimItem)
      .where(eq(vendorClaimItem.vendorDecision, 'PENDING'))

    return {
      totalClaims,
      submittedClaims: statusMap.SUBMITTED ?? 0,
      inReviewClaims: statusMap.IN_REVIEW ?? 0,
      needRevisionClaims: statusMap.NEED_REVISION ?? 0,
      approvedClaims,
      archivedClaims: statusMap.ARCHIVED ?? 0,
      draftClaims: statusMap.DRAFT ?? 0,
      approvalRate,
      avgReviewLeadTimeDays,
      vendorPendingItems: vendorPendingResult[0]?.count ?? 0
    }
  },

  async getClaimsByVendor(filter: ReportFilter): Promise<ClaimsByVendorRow[]> {
    const { conditions } = buildDateFilter(filter)

    const rows = await db
      .select({
        vendorId: claim.vendorId,
        vendorCode: vendor.code,
        vendorName: vendor.name,
        totalClaims: count(),
        approvedClaims: count(
          sql`CASE WHEN ${claim.claimStatus} = 'APPROVED' THEN 1 END`
        ),
        rejectedClaims: count(
          sql`CASE WHEN ${claim.claimStatus} = 'NEED_REVISION' THEN 1 END`
        ),
        pendingClaims: count(
          sql`CASE WHEN ${claim.claimStatus} IN ('SUBMITTED', 'IN_REVIEW', 'DRAFT') THEN 1 END`
        )
      })
      .from(claim)
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .where(and(...conditions))
      .groupBy(claim.vendorId, vendor.code, vendor.name)
      .orderBy(sql`count(*) DESC`)

    return rows.map(r => ({
      vendorId: r.vendorId,
      vendorCode: r.vendorCode,
      vendorName: r.vendorName,
      totalClaims: r.totalClaims,
      approvedClaims: r.approvedClaims,
      rejectedClaims: r.rejectedClaims,
      pendingClaims: r.pendingClaims
    }))
  },

  async getClaimsByBranch(filter: ReportFilter): Promise<ClaimsByBranchRow[]> {
    const { conditions } = buildDateFilter(filter)

    const rows = await db
      .select({
        branch: claim.branch,
        totalClaims: count(),
        approvedClaims: count(
          sql`CASE WHEN ${claim.claimStatus} = 'APPROVED' THEN 1 END`
        ),
        rejectedClaims: count(
          sql`CASE WHEN ${claim.claimStatus} = 'NEED_REVISION' THEN 1 END`
        )
      })
      .from(claim)
      .where(and(...conditions))
      .groupBy(claim.branch)
      .orderBy(sql`count(*) DESC`)

    return rows.map(r => ({
      branch: r.branch,
      totalClaims: r.totalClaims,
      approvedClaims: r.approvedClaims,
      rejectedClaims: r.rejectedClaims,
      approvalRate: r.totalClaims > 0
        ? Math.round((r.approvedClaims / r.totalClaims) * 10000) / 100
        : 0
    }))
  },

  async getTopDefects(filter: ReportFilter): Promise<TopDefectRow[]> {
    const { conditions } = buildDateFilter(filter)

    const rows = await db
      .select({
        defectCode: claim.defectCode,
        defectName: defectMaster.name,
        totalClaims: count()
      })
      .from(claim)
      .innerJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .where(and(...conditions))
      .groupBy(claim.defectCode, defectMaster.name)
      .orderBy(sql`count(*) DESC`)
      .limit(10)

    return rows.map(r => ({
      defectCode: r.defectCode,
      defectName: r.defectName,
      totalClaims: r.totalClaims
    }))
  },

  async getMonthlyTrend(filter: ReportFilter): Promise<MonthlyTrendRow[]> {
    const { conditions } = buildDateFilter(filter)

    const rows = await db
      .select({
        calendarYear: claim.calendarYear,
        calendarMonth: claim.calendarMonth,
        inflow: count(),
        closure: count(
          sql`CASE WHEN ${claim.claimStatus} = 'APPROVED' THEN 1 END`
        )
      })
      .from(claim)
      .where(and(...conditions))
      .groupBy(claim.calendarYear, claim.calendarMonth)
      .orderBy(claim.calendarYear, claim.calendarMonth)

    return rows.map(r => ({
      calendarYear: r.calendarYear,
      calendarMonth: r.calendarMonth,
      inflow: r.inflow,
      closure: r.closure
    }))
  },

  async getBranchPerformance(filter: ReportFilter): Promise<BranchPerformanceRow[]> {
    const { conditions } = buildDateFilter(filter)

    const rows = await db
      .select({
        branch: claim.branch,
        totalClaims: count(),
        approved: count(
          sql`CASE WHEN ${claim.claimStatus} = 'APPROVED' THEN 1 END`
        ),
        needRevision: count(
          sql`CASE WHEN ${claim.claimStatus} = 'NEED_REVISION' THEN 1 END`
        ),
        inReview: count(
          sql`CASE WHEN ${claim.claimStatus} IN ('SUBMITTED', 'IN_REVIEW') THEN 1 END`
        )
      })
      .from(claim)
      .where(and(...conditions))
      .groupBy(claim.branch)
      .orderBy(sql`count(*) DESC`)

    const branchLeadTimes = await db
      .select({
        branch: claim.branch,
        avgDays: avg(
          sql<number>`(
            SELECT (ch2.created_at - ch1.created_at) / 86400000.0
            FROM claim_history ch1
            INNER JOIN claim_history ch2 ON ch1.claim_id = ch2.claim_id
            WHERE ch1.action = 'SUBMIT'
              AND ch2.action = 'APPROVE'
              AND ch1.claim_id = ${claim.id}
            LIMIT 1
          )`
        ).as('avgDays')
      })
      .from(claim)
      .where(and(
        ...conditions,
        eq(claim.claimStatus, 'APPROVED')
      ))
      .groupBy(claim.branch)

    const leadTimeMap: Record<string, number | null> = {}
    for (const lt of branchLeadTimes) {
      leadTimeMap[lt.branch] = lt.avgDays
        ? Math.round(Number(lt.avgDays) * 100) / 100
        : null
    }

    return rows.map(r => ({
      branch: r.branch,
      totalClaims: r.totalClaims,
      approved: r.approved,
      needRevision: r.needRevision,
      inReview: r.inReview,
      approvalRate: r.totalClaims > 0
        ? Math.round((r.approved / r.totalClaims) * 10000) / 100
        : 0,
      avgLeadTimeDays: leadTimeMap[r.branch] ?? null
    }))
  },

  async getVendorPerformance(filter: ReportFilter): Promise<VendorPerformanceRow[]> {
    const { conditions } = buildDateFilter(filter)

    const claimRows = await db
      .select({
        vendorId: claim.vendorId,
        vendorCode: vendor.code,
        vendorName: vendor.name,
        totalClaims: count()
      })
      .from(claim)
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .where(and(...conditions))
      .groupBy(claim.vendorId, vendor.code, vendor.name)
      .orderBy(sql`count(*) DESC`)

    const decisionRows = await db
      .select({
        vendorId: claim.vendorId,
        acceptedItems: count(
          sql`CASE WHEN ${vendorClaimItem.vendorDecision} = 'ACCEPTED' THEN 1 END`
        ),
        rejectedItems: count(
          sql`CASE WHEN ${vendorClaimItem.vendorDecision} = 'REJECTED' THEN 1 END`
        ),
        totalCompensation: sql<number>`COALESCE(SUM(${vendorClaimItem.compensation}), 0)`.as('totalCompensation')
      })
      .from(vendorClaimItem)
      .innerJoin(claim, eq(vendorClaimItem.claimId, claim.id))
      .where(and(...conditions))
      .groupBy(claim.vendorId)

    const decisionMap: Record<number, { accepted: number, rejected: number, compensation: number }> = {}
    for (const row of decisionRows) {
      decisionMap[row.vendorId] = {
        accepted: row.acceptedItems,
        rejected: row.rejectedItems,
        compensation: Number(row.totalCompensation)
      }
    }

    return claimRows.map((row) => {
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
    const { conditions } = buildDateFilter(filter)
    const nowMs = Date.now()

    const rows = await db
      .select({
        bucket: sql<string>`
          CASE
            WHEN (${nowMs} - ${claim.createdAt}) / 86400000 <= 7 THEN '0-7 days'
            WHEN (${nowMs} - ${claim.createdAt}) / 86400000 <= 14 THEN '8-14 days'
            WHEN (${nowMs} - ${claim.createdAt}) / 86400000 <= 30 THEN '15-30 days'
            ELSE '30+ days'
          END
        `.as('bucket'),
        count: count()
      })
      .from(claim)
      .where(and(
        ...conditions,
        sql`${claim.claimStatus} NOT IN ('APPROVED', 'ARCHIVED')`
      ))
      .groupBy(sql`bucket`)
      .orderBy(sql`
        CASE bucket
          WHEN '0-7 days' THEN 1
          WHEN '8-14 days' THEN 2
          WHEN '15-30 days' THEN 3
          WHEN '30+ days' THEN 4
        END
      `)

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

  async getDefectAnalysis(filter: ReportFilter): Promise<DefectAnalysisRow[]> {
    const { conditions } = buildDateFilter(filter)

    const rows = await db
      .select({
        defectCode: claim.defectCode,
        defectName: defectMaster.name,
        vendorCode: vendor.code,
        vendorName: vendor.name,
        modelName: productModel.name,
        totalClaims: count()
      })
      .from(claim)
      .innerJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .innerJoin(productModel, eq(claim.modelId, productModel.id))
      .where(and(...conditions))
      .groupBy(
        claim.defectCode,
        defectMaster.name,
        vendor.code,
        vendor.name,
        productModel.name
      )
      .orderBy(sql`count(*) DESC`)

    return rows.map(r => ({
      defectCode: r.defectCode,
      defectName: r.defectName,
      vendorCode: r.vendorCode,
      vendorName: r.vendorName,
      modelName: r.modelName,
      totalClaims: r.totalClaims
    }))
  }
}
