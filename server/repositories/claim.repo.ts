import { and, count, desc, eq, inArray, isNull, like } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import {
  claim,
  claimPhoto,
  claimHistory,
  notificationMaster,
  productModel,
  vendor,
  defectMaster,
  user,
  vendorClaimItem,
  type ClaimStatus,
  type InsertClaim,
  type UpdateClaim
} from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'
import type { FiscalHalf } from '~~/shared/utils/fiscal'

type DbExecutor = DbTransaction | typeof db

export interface ClaimFilter {
  search?: string
  status?: ClaimStatus | ClaimStatus[]
  vendorId?: number
  branch?: string
  submittedBy?: string
  fiscalYear?: number
  fiscalHalf?: FiscalHalf
  fiscalLabel?: string
  calendarYear?: number
  calendarMonth?: number
}

export interface ClaimListFilter extends ClaimFilter {
  page: number
  limit: number
}

function buildWhereClause(filter: ClaimFilter) {
  const conditions: SQL[] = []

  if (filter.search) {
    conditions.push(like(claim.claimNumber, `%${filter.search}%`))
  }

  const statusFilter = filter.status
  if (Array.isArray(statusFilter) && statusFilter.length > 0) {
    conditions.push(inArray(claim.claimStatus, statusFilter))
  } else if (typeof statusFilter === 'string') {
    conditions.push(eq(claim.claimStatus, statusFilter))
  }

  if (typeof filter.vendorId === 'number') {
    conditions.push(eq(claim.vendorId, filter.vendorId))
  }

  if (typeof filter.submittedBy === 'string' && filter.submittedBy.trim().length > 0) {
    conditions.push(eq(claim.submittedBy, filter.submittedBy))
  }

  if (typeof filter.branch === 'string' && filter.branch.trim().length > 0) {
    conditions.push(eq(claim.branch, filter.branch))
  }

  if (typeof filter.fiscalYear === 'number') {
    conditions.push(eq(claim.fiscalYear, filter.fiscalYear))
  }

  if (filter.fiscalHalf) {
    conditions.push(eq(claim.fiscalHalf, filter.fiscalHalf))
  }

  if (typeof filter.fiscalLabel === 'string' && filter.fiscalLabel.trim().length > 0) {
    conditions.push(eq(claim.fiscalLabel, filter.fiscalLabel))
  }

  if (typeof filter.calendarYear === 'number') {
    conditions.push(eq(claim.calendarYear, filter.calendarYear))
  }

  if (typeof filter.calendarMonth === 'number') {
    conditions.push(eq(claim.calendarMonth, filter.calendarMonth))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const claimRepo = {
  async findAll(filter: ClaimListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select({
        claim,
        vendor,
        productModel,
        notificationMaster,
        defectMaster,
        submittedUser: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      })
      .from(claim)
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .innerJoin(productModel, eq(claim.modelId, productModel.id))
      .innerJoin(notificationMaster, eq(claim.notificationId, notificationMaster.id))
      .innerJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .leftJoin(user, eq(claim.submittedBy, user.id))
      .where(whereClause)
      .orderBy(desc(claim.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(claim)
      .where(eq(claim.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByClaimNumber(claimNumber: string) {
    const rows = await db
      .select()
      .from(claim)
      .where(eq(claim.claimNumber, claimNumber))
      .limit(1)

    return rows[0] ?? null
  },

  async findByIdWithRelations(id: number) {
    const rows = await db
      .select({
        claim,
        vendor,
        productModel,
        notificationMaster,
        defectMaster,
        submittedUser: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      })
      .from(claim)
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .innerJoin(productModel, eq(claim.modelId, productModel.id))
      .innerJoin(notificationMaster, eq(claim.notificationId, notificationMaster.id))
      .innerJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .leftJoin(user, eq(claim.submittedBy, user.id))
      .where(eq(claim.id, id))
      .limit(1)

    const base = rows[0] ?? null
    if (!base) {
      return null
    }

    const [photos, history] = await Promise.all([
      db
        .select()
        .from(claimPhoto)
        .where(eq(claimPhoto.claimId, id)),
      db
        .select({
          history: claimHistory,
          user: {
            id: user.id,
            name: user.name,
            role: user.role
          }
        })
        .from(claimHistory)
        .leftJoin(user, eq(claimHistory.userId, user.id))
        .where(eq(claimHistory.claimId, id))
        .orderBy(desc(claimHistory.createdAt))
    ])

    return {
      ...base,
      photos,
      history
    }
  },

  async findBySubmittedBy(userId: string, filter: { status?: ClaimStatus | ClaimStatus[], page: number, limit: number, search?: string }) {
    return await this.findAll({
      page: filter.page,
      limit: filter.limit,
      status: filter.status,
      search: filter.search,
      submittedBy: userId
    })
  },

  async insert(data: InsertClaim, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor.insert(claim).values(data).returning()
    return rows[0] ?? null
  },

  async update(id: number, data: UpdateClaim, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor
      .update(claim)
      .set(data)
      .where(eq(claim.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: ClaimFilter) {
    const whereClause = buildWhereClause(filter)

    const rows = await db
      .select({ total: count(claim.id) })
      .from(claim)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  },

  async findApprovedByVendorNotInBatch(vendorId: number) {
    return await db
      .select({
        claim,
        vendor,
        productModel,
        notificationMaster,
        defectMaster
      })
      .from(claim)
      .innerJoin(vendor, eq(claim.vendorId, vendor.id))
      .innerJoin(productModel, eq(claim.modelId, productModel.id))
      .innerJoin(notificationMaster, eq(claim.notificationId, notificationMaster.id))
      .innerJoin(defectMaster, eq(claim.defectCode, defectMaster.code))
      .leftJoin(vendorClaimItem, eq(vendorClaimItem.claimId, claim.id))
      .where(and(
        eq(claim.vendorId, vendorId),
        eq(claim.claimStatus, 'APPROVED'),
        isNull(vendorClaimItem.id)
      ))
      .orderBy(desc(claim.updatedAt))
  }
}
