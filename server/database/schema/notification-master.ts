// server/database/schema/notification-master.ts
import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { vendor } from './vendor'
import { productModel } from './product-model'
import {
  NOTIFICATION_STATUSES,
  type NotificationStatus
} from '../../../shared/utils/constants'
import {
  FISCAL_HALVES,
  type FiscalHalf
} from '../../../shared/utils/fiscal'

export const notificationMaster = sqliteTable('notification_master', {
  id: integer().primaryKey({ autoIncrement: true }),
  notificationCode: text().notNull(),
  notificationDate: integer({ mode: 'timestamp_ms' }).notNull(),
  modelId: integer().notNull().references(() => productModel.id, { onDelete: 'restrict' }),
  branch: text().notNull(),
  vendorId: integer().notNull().references(() => vendor.id, { onDelete: 'restrict' }),
  status: text().notNull().$type<NotificationStatus>(),
  createdBy: text().notNull(), // references user.id
  updatedBy: text().notNull(), // references user.id

  // ── Fiscal period columns (based on notificationDate) ──
  fiscalYear: integer().notNull(),
  fiscalHalf: text().notNull().$type<FiscalHalf>(),
  fiscalLabel: text().notNull(),
  calendarYear: integer().notNull(),
  calendarMonth: integer().notNull(),

  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  uniqueIndex('notification_master_code_idx').on(table.notificationCode),
  index('notification_master_vendor_idx').on(table.vendorId),
  index('notification_master_date_idx').on(table.notificationDate),
  index('notification_master_status_idx').on(table.status),
  index('notification_master_created_at_idx').on(table.createdAt),
  index('notification_master_vendor_status_idx').on(table.vendorId, table.status),
  index('notification_master_vendor_date_idx').on(table.vendorId, table.notificationDate),
  // Fiscal period indexes
  index('notification_master_fiscal_label_idx').on(table.fiscalLabel),
  index('notification_master_fiscal_year_idx').on(table.fiscalYear)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

/**
 * Accepts a Date or ISO string from the caller, stores as unix ms integer.
 * z.coerce.date handles both Date objects and ISO strings.
 */
const notificationDateSchema = z.coerce
  .date({ message: 'Notification date must be a valid date' })
  .transform(value => value.getTime())

export const insertNotificationMasterSchema = createInsertSchema(notificationMaster, {
  notificationCode: z.string().min(1, 'Notification code is required').trim(),
  notificationDate: notificationDateSchema,
  modelId: z.number().int('Model ID must be an integer').positive('Invalid model ID'),
  branch: z.string().min(1, 'Branch is required').trim(),
  vendorId: z.number().int('Vendor ID must be an integer').positive('Invalid vendor ID'),
  status: z.enum(NOTIFICATION_STATUSES),
  createdBy: z.string().min(1, 'Created by is required'),
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

export const selectNotificationMasterSchema = createSelectSchema(notificationMaster)

export const updateNotificationMasterSchema = insertNotificationMasterSchema.partial().omit({
  createdBy: true,
  notificationCode: true
})

export const updateNotificationMasterStatusSchema = z.object({
  status: z.enum(NOTIFICATION_STATUSES),
  updatedBy: z.string().min(1, 'Updated by is required')
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type NotificationMaster = typeof notificationMaster.$inferSelect
export type InsertNotificationMaster = z.infer<typeof insertNotificationMasterSchema>
export type UpdateNotificationMaster = z.infer<typeof updateNotificationMasterSchema>
export type UpdateNotificationMasterStatus = z.infer<typeof updateNotificationMasterStatusSchema>
