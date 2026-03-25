// server/database/schema/vendor-claim.ts
import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { vendor } from './vendor'
import {
  VENDOR_CLAIM_STATUSES,
  type VendorClaimStatus
} from '../../../shared/utils/constants'

export const vendorClaim = sqliteTable('vendor_claim', {
  id: integer().primaryKey({ autoIncrement: true }),
  vendorClaimNo: text().notNull().unique(),
  vendorId: integer().notNull().references(() => vendor.id, { onDelete: 'restrict' }),
  submittedAt: integer({ mode: 'timestamp_ms' }).notNull(),
  reportSnapshot: text({ mode: 'json' }).notNull().$type<Record<string, unknown>>(),
  status: text().notNull().$type<VendorClaimStatus>(),
  createdBy: text().notNull(), // references user.id
  updatedBy: text().notNull(), // references user.id
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  uniqueIndex('vendor_claim_no_idx').on(table.vendorClaimNo),
  index('vendor_claim_vendor_idx').on(table.vendorId),
  index('vendor_claim_status_idx').on(table.status),
  index('vendor_claim_created_at_idx').on(table.createdAt)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertVendorClaimSchema = createInsertSchema(vendorClaim, {
  vendorClaimNo: z.string().min(1, 'Vendor claim number is required').trim(),
  vendorId: z.number().int().positive('Invalid vendor ID'),
  submittedAt: z.number().int().positive('Submitted at must be a valid timestamp'),
  reportSnapshot: z.record(z.string(), z.unknown()),
  status: z.enum(VENDOR_CLAIM_STATUSES),
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().min(1, 'Updated by is required')
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const selectVendorClaimSchema = createSelectSchema(vendorClaim)

export const updateVendorClaimSchema = insertVendorClaimSchema.partial().omit({
  createdBy: true,
  vendorClaimNo: true
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type VendorClaim = typeof vendorClaim.$inferSelect
export type InsertVendorClaim = z.infer<typeof insertVendorClaimSchema>
export type UpdateVendorClaim = z.infer<typeof updateVendorClaimSchema>
