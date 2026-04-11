import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { user } from './auth'

export const appSettings = sqliteTable('app_settings', {
  id: integer().primaryKey({ autoIncrement: true }),
  key: text().notNull(),
  value: text({ mode: 'json' }).notNull().$type<unknown>(),
  updatedBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date()),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
}, table => [
  uniqueIndex('app_settings_key_idx').on(table.key)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertAppSettingsSchema = createInsertSchema(appSettings, {
  key: z.string().min(1, 'Settings key is required').trim(),
  value: z.unknown(),
  updatedBy: z.string().min(1, 'Updated by is required')
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const selectAppSettingsSchema = createSelectSchema(appSettings)

export const updateAppSettingsSchema = insertAppSettingsSchema.partial().omit({
  key: true
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type AppSettingsRecord = typeof appSettings.$inferSelect
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>
export type UpdateAppSettings = z.infer<typeof updateAppSettingsSchema>
