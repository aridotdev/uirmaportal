import { and, count, desc, eq, like, or } from 'drizzle-orm'
import db from '#server/database'
import {
  defectMaster,
  type InsertDefectMaster,
  type UpdateDefectMaster,
  type UpdateDefectMasterStatus
} from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'

export interface DefectListFilter {
  search?: string
  isActive?: boolean
  page: number
  limit: number
}

function buildWhereClause(filter: Omit<DefectListFilter, 'page' | 'limit'>) {
  const conditions = []

  if (filter.search) {
    const search = `%${filter.search}%`
    conditions.push(or(like(defectMaster.code, search), like(defectMaster.name, search)))
  }

  if (typeof filter.isActive === 'boolean') {
    conditions.push(eq(defectMaster.isActive, filter.isActive))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const defectRepo = {
  async findAll(filter: DefectListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select()
      .from(defectMaster)
      .where(whereClause)
      .orderBy(desc(defectMaster.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(defectMaster)
      .where(eq(defectMaster.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByCode(code: string) {
    const rows = await db
      .select()
      .from(defectMaster)
      .where(eq(defectMaster.code, code))
      .limit(1)

    return rows[0] ?? null
  },

  async insert(data: InsertDefectMaster) {
    const rows = await db.insert(defectMaster).values(data).returning()
    return rows[0] ?? null
  },

  async update(id: number, data: UpdateDefectMaster) {
    const rows = await db
      .update(defectMaster)
      .set(data)
      .where(eq(defectMaster.id, id))
      .returning()

    return rows[0] ?? null
  },

  async updateStatus(id: number, data: UpdateDefectMasterStatus) {
    const rows = await db
      .update(defectMaster)
      .set(data)
      .where(eq(defectMaster.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: Omit<DefectListFilter, 'page' | 'limit'>) {
    const whereClause = buildWhereClause(filter)
    const rows = await db
      .select({ total: count(defectMaster.id) })
      .from(defectMaster)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
