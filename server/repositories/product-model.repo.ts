import { and, count, desc, eq, like } from 'drizzle-orm'
import db from '#server/database'
import {
  productModel,
  type InsertProductModel,
  type UpdateProductModel,
  type UpdateProductModelStatus
} from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'

export interface ProductModelListFilter {
  search?: string
  vendorId?: number
  isActive?: boolean
  page: number
  limit: number
}

function buildWhereClause(filter: Omit<ProductModelListFilter, 'page' | 'limit'>) {
  const conditions = []

  if (filter.search) {
    conditions.push(like(productModel.name, `%${filter.search}%`))
  }

  if (typeof filter.vendorId === 'number') {
    conditions.push(eq(productModel.vendorId, filter.vendorId))
  }

  if (typeof filter.isActive === 'boolean') {
    conditions.push(eq(productModel.isActive, filter.isActive))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const productModelRepo = {
  async findAll(filter: ProductModelListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select()
      .from(productModel)
      .where(whereClause)
      .orderBy(desc(productModel.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(productModel)
      .where(eq(productModel.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByNameAndVendor(name: string, vendorId: number) {
    const rows = await db
      .select()
      .from(productModel)
      .where(and(eq(productModel.name, name), eq(productModel.vendorId, vendorId)))
      .limit(1)

    return rows[0] ?? null
  },

  async insert(data: InsertProductModel) {
    const rows = await db.insert(productModel).values(data).returning()
    return rows[0] ?? null
  },

  async update(id: number, data: UpdateProductModel) {
    const rows = await db
      .update(productModel)
      .set(data)
      .where(eq(productModel.id, id))
      .returning()

    return rows[0] ?? null
  },

  async updateStatus(id: number, data: UpdateProductModelStatus) {
    const rows = await db
      .update(productModel)
      .set(data)
      .where(eq(productModel.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: Omit<ProductModelListFilter, 'page' | 'limit'>) {
    const whereClause = buildWhereClause(filter)
    const rows = await db
      .select({ total: count(productModel.id) })
      .from(productModel)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
