// server/database/schema/claim.ts
import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { vendor } from './vendor'
import { productModel } from './product-model'
import { notificationMaster } from './notification-master'
import { defectMaster } from './defect-master'
import { user } from './auth'
import {
  CLAIM_STATUSES,
  type ClaimStatus
} from '../../../shared/utils/constants'
import {
  FISCAL_HALVES,
  type FiscalHalf
} from '../../../shared/utils/fiscal'

export const claim = sqliteTable('claim', {
  id: integer().primaryKey({ autoIncrement: true }),
  claimNumber: text().notNull(),
  notificationId: integer().notNull().references(() => notificationMaster.id, { onDelete: 'restrict' }),
  modelId: integer().notNull().references(() => productModel.id, { onDelete: 'restrict' }),
  vendorId: integer().notNull().references(() => vendor.id, { onDelete: 'restrict' }),
  inch: integer().notNull(),
  branch: text().notNull(),
  odfNumber: text(),
  panelPartNumber: text().notNull(),
  ocSerialNo: text().notNull(),
  defectCode: text().notNull().references(() => defectMaster.code, { onDelete: 'restrict' }),
  version: text(),
  week: text(),
  claimStatus: text().notNull().$type<ClaimStatus>(),
  submittedBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
  updatedBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),

  // ── Fiscal period columns (denormalized for query performance) ──
  // Populated at insert time based on createdAt using getFiscalPeriodInfo()
  fiscalYear: integer().notNull(), // e.g. 2025 (FY Apr 2025 – Mar 2026)
  fiscalHalf: text().notNull().$type<FiscalHalf>(), // 'FH' or 'LH'
  fiscalLabel: text().notNull(), // e.g. '2025LH'
  calendarYear: integer().notNull(), // e.g. 2026
  calendarMonth: integer().notNull(), // 1-12

  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  uniqueIndex('claim_number_idx').on(table.claimNumber),
  index('claim_vendor_idx').on(table.vendorId),
  index('claim_status_idx').on(table.claimStatus),
  index('claim_submitted_by_idx').on(table.submittedBy),
  index('claim_vendor_status_idx').on(table.vendorId, table.claimStatus),
  // Fiscal period indexes for report queries
  index('claim_fiscal_label_idx').on(table.fiscalLabel),
  index('claim_fiscal_year_idx').on(table.fiscalYear),
  index('claim_calendar_ym_idx').on(table.calendarYear, table.calendarMonth),
  index('claim_fiscal_year_half_idx').on(table.fiscalYear, table.fiscalHalf)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertClaimSchema = createInsertSchema(claim, {
  claimNumber: z.string().min(1, 'Claim number is required').trim(),
  notificationId: z.number().int('Notification ID must be integer').positive('Invalid notification ID'),
  modelId: z.number().int('Model ID must be integer').positive('Invalid model ID'),
  vendorId: z.number().int('Vendor ID must be integer').positive('Invalid vendor ID'),
  inch: z.number().int().positive('Inch size must be positive'),
  branch: z.string().min(1, 'Branch is required').trim(),
  panelPartNumber: z.string().min(1, 'Panel Part Number is required').trim(),
  ocSerialNo: z.string().min(1, 'OC SN is required').trim(),
  defectCode: z.string().min(1, 'Defect code is required').trim(),
  claimStatus: z.enum(CLAIM_STATUSES),
  submittedBy: z.string().min(1, 'Submitted by is required'),
  updatedBy: z.string().min(1, 'Updated by is required'),
  // Fiscal fields — computed at service layer using getFiscalPeriodInfo()
  fiscalYear: z.number().int().min(2020).max(2099),
  fiscalHalf: z.enum(FISCAL_HALVES),
  fiscalLabel: z.string().regex(/^\d{4}(FH|LH)$/, 'Must be format like 2025FH or 2025LH'),
  calendarYear: z.number().int().min(2020).max(2099),
  calendarMonth: z.number().int().min(1).max(12)
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const selectClaimSchema = createSelectSchema(claim)

export const updateClaimSchema = insertClaimSchema.partial().omit({
  claimNumber: true,
  submittedBy: true
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Claim = typeof claim.$inferSelect
export type InsertClaim = z.infer<typeof insertClaimSchema>
export type UpdateClaim = z.infer<typeof updateClaimSchema>
