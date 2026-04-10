// server/database/schema/sequence-generator.ts
import { sql } from 'drizzle-orm'
import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  SEQUENCE_TYPES,
  type SequenceType
} from '../../../shared/utils/constants'

export const sequenceGenerator = sqliteTable('sequence_generator', {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text().notNull().$type<SequenceType>(),
  currentDate: text().notNull(), // Format YYYYMMDD
  lastSequence: integer().notNull().default(0),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  uniqueIndex('sequence_generator_type_date_idx').on(table.type, table.currentDate)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertSequenceGeneratorSchema = createInsertSchema(sequenceGenerator, {
  type: z.enum(SEQUENCE_TYPES),
  currentDate: z.string().length(8, 'Date must be in YYYYMMDD format'),
  lastSequence: z.number().int().nonnegative().default(0)
}).omit({
  id: true
})

export const selectSequenceGeneratorSchema = createSelectSchema(sequenceGenerator)

// ============================================================
// TYPE EXPORTS
// ============================================================

export type SequenceGenerator = typeof sequenceGenerator.$inferSelect
export type InsertSequenceGenerator = z.infer<typeof insertSequenceGeneratorSchema>
