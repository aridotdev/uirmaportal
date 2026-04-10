// server/database/schema/vendor-claim-item.ts
// vendorDecisionBy references user.id (UUID from Better-Auth).
// Nullable until vendor has reviewed the item.
import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { vendorClaim } from './vendor-claim'
import { claim } from './claim'
import {
  VENDOR_DECISIONS,
  type VendorDecision
} from '../../../shared/utils/constants'

export const vendorClaimItem = sqliteTable('vendor_claim_item', {
  id: integer().primaryKey({ autoIncrement: true }),
  vendorClaimId: integer().notNull().references(() => vendorClaim.id, { onDelete: 'cascade' }),
  claimId: integer().notNull().references(() => claim.id, { onDelete: 'restrict' }),
  vendorDecision: text().notNull().$type<VendorDecision>(),
  compensation: integer(),
  rejectReason: text(),
  vendorDecisionBy: text(), // references user.id; nullable until reviewed
  vendorDecisionAt: integer({ mode: 'timestamp_ms' }),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  index('vendor_claim_item_vendor_claim_idx').on(table.vendorClaimId),
  uniqueIndex('vendor_claim_item_claim_unique_idx').on(table.claimId)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertVendorClaimItemSchema = createInsertSchema(vendorClaimItem, {
  vendorClaimId: z.number().int().positive(),
  claimId: z.number().int().positive(),
  vendorDecision: z.enum(VENDOR_DECISIONS),
  compensation: z.number().int().nonnegative().optional(),
  vendorDecisionBy: z.string().min(1).optional(),
  vendorDecisionAt: z.number().int().positive().optional()
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const selectVendorClaimItemSchema = createSelectSchema(vendorClaimItem)

export const updateVendorClaimItemSchema = insertVendorClaimItemSchema.partial().omit({
  vendorClaimId: true,
  claimId: true
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type VendorClaimItem = typeof vendorClaimItem.$inferSelect
export type InsertVendorClaimItem = z.infer<typeof insertVendorClaimItemSchema>
export type UpdateVendorClaimItem = z.infer<typeof updateVendorClaimItemSchema>
