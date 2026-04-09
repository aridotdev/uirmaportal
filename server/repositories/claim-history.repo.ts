import { and, asc, count, desc, eq, gte, like, lte, or, type SQL } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import {
  claim,
  claimHistory,
  user,
  type ClaimHistoryAction,
  type InsertClaimHistory,
  type UserRole
} from '#server/database/schema'
import { calcOffset } from '#server/utils/pagination'

type DbExecutor = DbTransaction | typeof db

type ClaimHistoryFilter = {
  search?: string
  action?: ClaimHistoryAction
  userRole?: UserRole
  dateFrom?: Date
  dateTo?: Date
  sort?: 'asc' | 'desc'
  page: number
  limit: number
}

function buildWhereClause(filter: Omit<ClaimHistoryFilter, 'page' | 'limit'>) {
  const conditions: SQL[] = []

  if (typeof filter.search === 'string' && filter.search.trim().length > 0) {
    const searchTerm = `%${filter.search.trim()}%`
    conditions.push(or(
      like(claim.claimNumber, searchTerm),
      like(user.name, searchTerm),
      like(claimHistory.note, searchTerm)
    ) as SQL)
  }

  if (typeof filter.action === 'string') {
    conditions.push(eq(claimHistory.action, filter.action))
  }

  if (typeof filter.userRole === 'string') {
    conditions.push(eq(claimHistory.userRole, filter.userRole))
  }

  if (filter.dateFrom instanceof Date) {
    conditions.push(gte(claimHistory.createdAt, filter.dateFrom))
  }

  if (filter.dateTo instanceof Date) {
    conditions.push(lte(claimHistory.createdAt, filter.dateTo))
  }

  if (conditions.length === 0) {
    return undefined
  }

  return and(...conditions)
}

export const claimHistoryRepo = {
  async findByClaimId(claimId: number, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db

    return await executor
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

  async findAllWithUserInfo(filter: ClaimHistoryFilter, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const whereClause = buildWhereClause(filter)

    return await executor
      .select({
        history: claimHistory,
        claim: {
          id: claim.id,
          claimNumber: claim.claimNumber
        },
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      })
      .from(claimHistory)
      .innerJoin(claim, eq(claimHistory.claimId, claim.id))
      .leftJoin(user, eq(claimHistory.userId, user.id))
      .where(whereClause)
      .orderBy(filter.sort === 'asc' ? asc(claimHistory.createdAt) : desc(claimHistory.createdAt))
      .limit(filter.limit)
      .offset(calcOffset(filter.page, filter.limit))
  },

  async countByFilter(filter: Omit<ClaimHistoryFilter, 'page' | 'limit'>, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const whereClause = buildWhereClause(filter)
    const rows = await executor
      .select({ total: count(claimHistory.id) })
      .from(claimHistory)
      .innerJoin(claim, eq(claimHistory.claimId, claim.id))
      .leftJoin(user, eq(claimHistory.userId, user.id))
      .where(whereClause)

    return Number(rows[0]?.total ?? 0)
  }
}
