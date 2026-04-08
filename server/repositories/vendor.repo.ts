import { and, count, desc, eq, like, or } from 'drizzle-orm'
import db from '#server/database'
import { vendor, type InsertVendor, type UpdateVendor, type UpdateVendorStatus } from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'

export interface VendorListFilter {
  search?: string
  isActive?: boolean
  page: number
  limit: number
}

function buildWhereClause(filter: { search?: string, isActive?: boolean }) {
  const conditions = []

  if (filter.search) {
    const search = `%${filter.search}%`
    conditions.push(or(like(vendor.code, search), like(vendor.name, search)))
  }

  if (typeof filter.isActive === 'boolean') {
    conditions.push(eq(vendor.isActive, filter.isActive))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const vendorRepo = {
  async findAll(filter: VendorListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select()
      .from(vendor)
      .where(whereClause)
      .orderBy(desc(vendor.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(vendor)
      .where(eq(vendor.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByCode(code: string) {
    const rows = await db
      .select()
      .from(vendor)
      .where(eq(vendor.code, code))
      .limit(1)

    return rows[0] ?? null
  },

  async insert(data: InsertVendor) {
    const rows = await db.insert(vendor).values(data).returning()
    return rows[0] ?? null
  },

  async update(id: number, data: UpdateVendor) {
    const rows = await db
      .update(vendor)
      .set(data)
      .where(eq(vendor.id, id))
      .returning()

    return rows[0] ?? null
  },

  async updateStatus(id: number, data: UpdateVendorStatus) {
    const rows = await db
      .update(vendor)
      .set(data)
      .where(eq(vendor.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: { search?: string, isActive?: boolean }) {
    const whereClause = buildWhereClause(filter)
    const rows = await db
      .select({ total: count(vendor.id) })
      .from(vendor)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
