import { and, count, desc, eq, like, or } from 'drizzle-orm'
import db from '#server/database'
import { user, type UpdateUserBusiness, type UpdateUserStatus } from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'
import type { UserRole } from '~~/shared/utils/constants'

export interface UserListFilter {
  search?: string
  role?: UserRole
  branch?: string
  isActive?: boolean
  page: number
  limit: number
}

type UpdateProfileData = {
  name?: string
  email?: string
}

function buildWhereClause(filter: Omit<UserListFilter, 'page' | 'limit'>) {
  const conditions = []

  if (filter.search) {
    const search = `%${filter.search}%`
    conditions.push(or(
      like(user.name, search),
      like(user.email, search),
      like(user.username, search)
    ))
  }

  if (filter.role) {
    conditions.push(eq(user.role, filter.role))
  }

  if (filter.branch) {
    conditions.push(eq(user.branch, filter.branch))
  }

  if (typeof filter.isActive === 'boolean') {
    conditions.push(eq(user.isActive, filter.isActive))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const userRepo = {
  async findAll(filter: UserListFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async findById(id: string) {
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async findByEmail(email: string) {
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    return rows[0] ?? null
  },

  async findByUsername(username: string) {
    const rows = await db
      .select()
      .from(user)
      .where(eq(user.username, username))
      .limit(1)

    return rows[0] ?? null
  },

  async update(id: string, data: UpdateUserBusiness) {
    const rows = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning()

    return rows[0] ?? null
  },

  async updateStatus(id: string, data: UpdateUserStatus) {
    const rows = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning()

    return rows[0] ?? null
  },

  async updateProfile(id: string, data: UpdateProfileData) {
    const rows = await db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countByFilter(filter: Omit<UserListFilter, 'page' | 'limit'>) {
    const whereClause = buildWhereClause(filter)
    const rows = await db
      .select({ total: count(user.id) })
      .from(user)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
