import { and, count, desc, eq, inArray, like } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import {
  claim,
  vendorClaim,
  vendorClaimItem,
  vendor,
  type VendorClaimStatus
} from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'

type DbExecutor = DbTransaction | typeof db
type VendorClaimInsert = typeof vendorClaim.$inferInsert
type VendorClaimUpdate = Partial<VendorClaimInsert>

export interface VendorClaimFilter {
  search?: string
  vendorId?: number
  status?: VendorClaimStatus | VendorClaimStatus[]
  fiscalLabel?: string
  fiscalYear?: number
}

export interface VendorClaimListFilter extends VendorClaimFilter {
  page: number
  limit: number
}

function buildWhereClause(filter: VendorClaimFilter) {
  const conditions: SQL[] = []

  if (filter.search) {
    conditions.push(like(vendorClaim.vendorClaimNo, `%${filter.search}%`))
  }

  if (typeof filter.vendorId === 'number') {
    conditions.push(eq(vendorClaim.vendorId, filter.vendorId))
  }

  const statusFilter = filter.status
  if (Array.isArray(statusFilter) && statusFilter.length > 0) {
    conditions.push(inArray(vendorClaim.status, statusFilter))
  } else if (typeof statusFilter === 'string') {
    conditions.push(eq(vendorClaim.status, statusFilter))
  }

  if (typeof filter.fiscalLabel === 'string' && filter.fiscalLabel.trim().length > 0) {
    conditions.push(eq(vendorClaim.fiscalLabel, filter.fiscalLabel))
  }

  if (typeof filter.fiscalYear === 'number') {
    conditions.push(eq(vendorClaim.fiscalYear, filter.fiscalYear))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const vendorClaimRepo = {
  async findAll(filter: VendorClaimListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select({
        vendorClaim,
        vendor
      })
      .from(vendorClaim)
      .innerJoin(vendor, eq(vendorClaim.vendorId, vendor.id))
      .where(whereClause)
      .orderBy(desc(vendorClaim.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(vendorClaim)
      .where(eq(vendorClaim.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByIdWithVendor(id: number) {
    const rows = await db
      .select({
        vendorClaim,
        vendor
      })
      .from(vendorClaim)
      .innerJoin(vendor, eq(vendorClaim.vendorId, vendor.id))
      .where(eq(vendorClaim.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByIdWithItems(id: number) {
    const rows = await db
      .select({
        vendorClaim,
        vendor,
        item: vendorClaimItem,
        claim
      })
      .from(vendorClaim)
      .innerJoin(vendor, eq(vendorClaim.vendorId, vendor.id))
      .leftJoin(vendorClaimItem, eq(vendorClaimItem.vendorClaimId, vendorClaim.id))
      .leftJoin(claim, eq(vendorClaimItem.claimId, claim.id))
      .where(eq(vendorClaim.id, id))
      .orderBy(desc(vendorClaimItem.createdAt))

    if (rows.length === 0) {
      return null
    }

    const first = rows[0]
    const items = rows
      .filter(row => row.item !== null && row.claim !== null)
      .map(row => ({
        item: row.item!,
        claim: row.claim!
      }))

    return {
      vendorClaim: first!.vendorClaim,
      vendor: first!.vendor,
      items
    }
  },

  async insert(data: VendorClaimInsert, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor.insert(vendorClaim).values(data).returning()
    return rows[0] ?? null
  },

  async update(id: number, data: VendorClaimUpdate, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor
      .update(vendorClaim)
      .set(data)
      .where(eq(vendorClaim.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: VendorClaimFilter) {
    const whereClause = buildWhereClause(filter)

    const rows = await db
      .select({ total: count(vendorClaim.id) })
      .from(vendorClaim)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
