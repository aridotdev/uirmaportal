// server/database/schema/vendor.ts
import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { user } from './auth'
import {
  PHOTO_TYPES,
  FIELD_NAMES,
  type PhotoType,
  type FieldName
} from '../../../shared/utils/constants'

/**
 * VENDOR TABLE
 * Stores vendor master data (MOKA, MTC, SDP)
 * Uses soft delete via isActive flag
 *
 * requiredPhotos: JSON array of PhotoType enum values
 * requiredFields: JSON array of FieldName enum values
 */
export const vendor = sqliteTable('vendor', {
  id: integer().primaryKey({ autoIncrement: true }),
  code: text().notNull(),
  name: text().notNull(),
  requiredPhotos: text({ mode: 'json' }).notNull().default('[]').$type<PhotoType[]>(),
  requiredFields: text({ mode: 'json' }).notNull().default('[]').$type<FieldName[]>(),
  isActive: integer({ mode: 'boolean' }).notNull().default(true),
  createdBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
  updatedBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  uniqueIndex('vendor_code_idx').on(table.code),
  index('vendor_is_active_idx').on(table.isActive),
  index('vendor_created_at_idx').on(table.createdAt)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertVendorSchema = createInsertSchema(vendor, {
  code: z
    .string()
    .min(1, 'Vendor code is required')
    .max(20, 'Vendor code must be less than 20 characters')
    .trim(),
  name: z
    .string()
    .min(1, 'Vendor name is required')
    .max(25, 'Vendor name must be less than 25 characters')
    .trim(),
  requiredPhotos: z.array(z.enum(PHOTO_TYPES)).default([]),
  requiredFields: z.array(z.enum(FIELD_NAMES)).default([]),
  createdBy: z.string().min(1, 'Created by is required'),
  updatedBy: z.string().min(1, 'Updated by is required')
}).omit({
  id: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
})

export const selectVendorSchema = createSelectSchema(vendor)

export const updateVendorSchema = insertVendorSchema.partial().omit({
  createdBy: true
})

export const updateVendorStatusSchema = z.object({
  isActive: z.boolean({ message: 'Must be boolean' }),
  updatedBy: z.string().min(1, 'Updated by is required')
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type Vendor = typeof vendor.$inferSelect
export type InsertVendor = z.infer<typeof insertVendorSchema>
export type UpdateVendor = z.infer<typeof updateVendorSchema>
export type UpdateVendorStatus = z.infer<typeof updateVendorStatusSchema>
