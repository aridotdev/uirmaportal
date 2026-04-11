import { and, avg, count, eq, gte, lte, sql } from 'drizzle-orm'
import db from '#server/database'
import { claim, defectMaster, productModel, vendor, vendorClaimItem } from '#server/database/schema'
import { resolvePeriodFilter } from '~~/shared/utils/fiscal'
import type { ReportFilter } from '~~/shared/types/database'

export interface ClaimsByVendorRow {
  vendorId: number
  vendorCode: string
  vendorName: string
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  pendingClaims: number
}

export interface ClaimsByBranchRaw {
  branch: string
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
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

export interface BranchCountsRaw {
  branch: string
  totalClaims: number
  approved: number
  needRevision: number
  inReview: number
}

export interface BranchLeadTimeRaw {
  branch: string
  avgDays: number | null
}

export interface BranchPerformanceRaw {
  branchCounts: BranchCountsRaw[]
  branchLeadTimes: BranchLeadTimeRaw[]
}

export interface VendorClaimsRaw {
  vendorId: number
  vendorCode: string
  vendorName: string
  totalClaims: number
}

export interface VendorDecisionsRaw {
  vendorId: number
  acceptedItems: number
  rejectedItems: number
  totalCompensation: number
}

export interface VendorPerformanceRaw {
  vendorClaims: VendorClaimsRaw[]
  vendorDecisions: VendorDecisionsRaw[]
}

export interface AgingBucketRaw {
  bucket: string
  count: number
}

export interface DashboardKpiRaw {
  statusCounts: {
    status: string
    count: number
  }[]
  leadTimeAvgRaw: number | null
  vendorPendingCount: number
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
  async getDashboardKpi(filter: ReportFilter): Promise<DashboardKpiRaw> {
    const { conditions } = buildDateFilter(filter)

    const statusCounts = await db
      .select({
        status: claim.claimStatus,
        count: count()
      })
      .from(claim)
      .where(and(...conditions))
      .groupBy(claim.claimStatus)

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

    const vendorPendingResult = await db
      .select({ count: count() })
      .from(vendorClaimItem)
      .where(eq(vendorClaimItem.vendorDecision, 'PENDING'))

    const leadTimeAvgValue = leadTimeResult[0]?.avgDays

    return {
      statusCounts: statusCounts.map(row => ({
        status: row.status,
        count: row.count
      })),
      leadTimeAvgRaw: leadTimeAvgValue == null ? null : Number(leadTimeAvgValue),
      vendorPendingCount: vendorPendingResult[0]?.count ?? 0
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

  async getClaimsByBranch(filter: ReportFilter): Promise<ClaimsByBranchRaw[]> {
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
      rejectedClaims: r.rejectedClaims
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

  async getBranchPerformance(filter: ReportFilter): Promise<BranchPerformanceRaw> {
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

    return {
      branchCounts: rows.map(r => ({
        branch: r.branch,
        totalClaims: r.totalClaims,
        approved: r.approved,
        needRevision: r.needRevision,
        inReview: r.inReview
      })),
      branchLeadTimes: branchLeadTimes.map(row => ({
        branch: row.branch,
        avgDays: row.avgDays == null ? null : Number(row.avgDays)
      }))
    }
  },

  async getVendorPerformance(filter: ReportFilter): Promise<VendorPerformanceRaw> {
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

    return {
      vendorClaims: claimRows.map(row => ({
        vendorId: row.vendorId,
        vendorCode: row.vendorCode,
        vendorName: row.vendorName,
        totalClaims: row.totalClaims
      })),
      vendorDecisions: decisionRows.map(row => ({
        vendorId: row.vendorId,
        acceptedItems: row.acceptedItems,
        rejectedItems: row.rejectedItems,
        totalCompensation: Number(row.totalCompensation)
      }))
    }
  },

  async getAgingAnalysis(filter: ReportFilter): Promise<AgingBucketRaw[]> {
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

    return rows.map(row => ({
      bucket: row.bucket,
      count: row.count
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
