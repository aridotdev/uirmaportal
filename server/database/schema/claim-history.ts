// server/database/schema/claim-history.ts
// Immutable audit log — no update schema needed.
// userId references user.id (UUID from Better-Auth).
// userRole is a snapshot of the role at the time of the action.
import { relations, sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { claim } from './claim'
import { user } from './auth'
import {
  CLAIM_HISTORY_ACTIONS,
  CLAIM_STATUSES,
  USER_ROLES,
  type ClaimHistoryAction,
  type ClaimStatus,
  type UserRole
} from '../../../shared/utils/constants'

export const claimHistory = sqliteTable('claim_history', {
  id: integer().primaryKey({ autoIncrement: true }),
  claimId: integer().notNull().references(() => claim.id, { onDelete: 'restrict' }),
  action: text().notNull().$type<ClaimHistoryAction>(),
  fromStatus: text().notNull().$type<ClaimStatus>(),
  toStatus: text().notNull().$type<ClaimStatus>(),
  userId: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
  userRole: text().notNull().$type<UserRole>(),
  note: text(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
}, table => [
  index('claim_history_claim_idx').on(table.claimId),
  index('claim_history_user_idx').on(table.userId)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertClaimHistorySchema = createInsertSchema(claimHistory, {
  claimId: z.number().int().positive(),
  action: z.enum(CLAIM_HISTORY_ACTIONS),
  fromStatus: z.enum(CLAIM_STATUSES),
  toStatus: z.enum(CLAIM_STATUSES),
  userId: z.string().min(1, 'User ID is required'),
  userRole: z.enum(USER_ROLES)
}).omit({
  id: true,
  createdAt: true
})

export const selectClaimHistorySchema = createSelectSchema(claimHistory)

export const claimHistoryRelations = relations(claimHistory, ({ one }) => ({
  claim: one(claim, { fields: [claimHistory.claimId], references: [claim.id] })
}))

// ============================================================
// TYPE EXPORTS
// ============================================================

export type ClaimHistory = typeof claimHistory.$inferSelect
export type InsertClaimHistory = z.infer<typeof insertClaimHistorySchema>
