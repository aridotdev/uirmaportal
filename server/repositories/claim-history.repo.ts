import { and, count, desc, eq } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import { claimHistory, user, type InsertClaimHistory } from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'

type DbExecutor = DbTransaction | typeof db

type ClaimHistoryFilter = {
  claimId?: number
  userId?: string
  action?: string
  page: number
  limit: number
}

function buildWhereClause(filter: Omit<ClaimHistoryFilter, 'page' | 'limit'>) {
  const conditions = []

  if (typeof filter.claimId === 'number') {
    conditions.push(eq(claimHistory.claimId, filter.claimId))
  }

  if (typeof filter.userId === 'string' && filter.userId.trim().length > 0) {
    conditions.push(eq(claimHistory.userId, filter.userId))
  }

  if (typeof filter.action === 'string' && filter.action.trim().length > 0) {
    conditions.push(eq(claimHistory.action, filter.action as never))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const claimHistoryRepo = {
  async findByClaimId(claimId: number) {
    return await db
      .select()
      .from(claimHistory)
      .where(eq(claimHistory.claimId, claimId))
      .orderBy(desc(claimHistory.createdAt))
  },

  async insert(data: InsertClaimHistory, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor.insert(claimHistory).values(data).returning()
    return rows[0] ?? null
  },

  async findAllWithUserInfo(filter: ClaimHistoryFilter) {
    const whereClause = buildWhereClause(filter)

    return await db
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
      .where(whereClause)
      .orderBy(desc(claimHistory.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async countByFilter(filter: Omit<ClaimHistoryFilter, 'page' | 'limit'>) {
    const whereClause = buildWhereClause(filter)
    const rows = await db
      .select({ total: count(claimHistory.id) })
      .from(claimHistory)
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
