import { and, count, desc, eq, like, or } from 'drizzle-orm'
import db from '#server/database'
import {
  notificationMaster,
  productModel,
  vendor,
  type InsertNotificationMaster,
  type UpdateNotificationMaster,
  type UpdateNotificationMasterStatus
} from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'
import type { NotificationStatus } from '~~/shared/utils/constants'

export interface NotificationListFilter {
  search?: string
  vendorId?: number
  status?: NotificationStatus
  branch?: string
  page: number
  limit: number
}

function toNotificationDate(value: Date | number) {
  return value instanceof Date ? value : new Date(value)
}

function buildWhereClause(filter: Omit<NotificationListFilter, 'page' | 'limit'>) {
  const conditions = []

  if (filter.search) {
    const search = `%${filter.search}%`
    conditions.push(or(
      like(notificationMaster.notificationCode, search),
      like(notificationMaster.branch, search)
    ))
  }

  if (typeof filter.vendorId === 'number') {
    conditions.push(eq(notificationMaster.vendorId, filter.vendorId))
  }

  if (filter.status) {
    conditions.push(eq(notificationMaster.status, filter.status))
  }

  if (filter.branch) {
    conditions.push(eq(notificationMaster.branch, filter.branch))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const notificationRepo = {
  async findAll(filter: NotificationListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select()
      .from(notificationMaster)
      .where(whereClause)
      .orderBy(desc(notificationMaster.notificationDate))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(notificationMaster)
      .where(eq(notificationMaster.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByCode(code: string) {
    const rows = await db
      .select()
      .from(notificationMaster)
      .where(eq(notificationMaster.notificationCode, code))
      .limit(1)

    return rows[0] ?? null
  },

  async findByCodeWithRelations(code: string) {
    const rows = await db
      .select({
        notification: notificationMaster,
        productModel,
        vendor
      })
      .from(notificationMaster)
      .innerJoin(productModel, eq(notificationMaster.modelId, productModel.id))
      .innerJoin(vendor, eq(notificationMaster.vendorId, vendor.id))
      .where(eq(notificationMaster.notificationCode, code))
      .limit(1)

    return rows[0] ?? null
  },

  async insert(data: InsertNotificationMaster) {
    const rows = await db
      .insert(notificationMaster)
      .values({
        ...data,
        notificationDate: toNotificationDate(data.notificationDate)
      })
      .returning()

    return rows[0] ?? null
  },

  async insertMany(data: InsertNotificationMaster[]) {
    if (data.length === 0) {
      return []
    }

    return await db
      .insert(notificationMaster)
      .values(
        data.map(item => ({
          ...item,
          notificationDate: toNotificationDate(item.notificationDate)
        }))
      )
      .returning()
  },

  async update(id: number, data: UpdateNotificationMaster) {
    const { notificationDate, ...rest } = data
    const payload = notificationDate !== undefined
      ? { ...rest, notificationDate: toNotificationDate(notificationDate) }
      : rest

    const rows = await db
      .update(notificationMaster)
      .set(payload)
      .where(eq(notificationMaster.id, id))
      .returning()

    return rows[0] ?? null
  },

  async updateStatus(id: number, data: UpdateNotificationMasterStatus) {
    const rows = await db
      .update(notificationMaster)
      .set(data)
      .where(eq(notificationMaster.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: Omit<NotificationListFilter, 'page' | 'limit'>) {
    const whereClause = buildWhereClause(filter)
    const rows = await db
      .select({ total: count(notificationMaster.id) })
      .from(notificationMaster)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
