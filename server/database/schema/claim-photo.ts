import { relations, sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { claim } from './claim'
import { photoReview } from './photo-review'
import {
  PHOTO_TYPES,
  CLAIM_PHOTO_STATUSES,
  type PhotoType,
  type ClaimPhotoStatus
} from '../../../shared/utils/constants'

export const claimPhoto = sqliteTable('claim_photo', {
  id: integer().primaryKey({ autoIncrement: true }),
  claimId: integer().notNull().references(() => claim.id, { onDelete: 'restrict' }),
  photoType: text().notNull().$type<PhotoType>(),
  filePath: text().notNull(),
  thumbnailPath: text(),
  status: text().notNull().default(CLAIM_PHOTO_STATUSES[0]).$type<ClaimPhotoStatus>(),
  rejectReason: text(),
  createdAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date())
}, table => [
  uniqueIndex('claim_photo_claim_type_idx').on(table.claimId, table.photoType),
  index('claim_photo_claim_idx').on(table.claimId)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertClaimPhotoSchema = createInsertSchema(claimPhoto, {
  claimId: z.number().int().positive(),
  photoType: z.enum(PHOTO_TYPES),
  filePath: z.string().min(1, 'File path is required'),
  status: z.enum(CLAIM_PHOTO_STATUSES).default(CLAIM_PHOTO_STATUSES[0])
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export const selectClaimPhotoSchema = createSelectSchema(claimPhoto)

export const updateClaimPhotoSchema = insertClaimPhotoSchema.partial().omit({
  claimId: true,
  photoType: true
})

export const claimPhotoRelations = relations(claimPhoto, ({ one, many }) => ({
  claim: one(claim, { fields: [claimPhoto.claimId], references: [claim.id] }),
  reviews: many(photoReview)
}))

// ============================================================
// TYPE EXPORTS
// ============================================================

export type ClaimPhoto = typeof claimPhoto.$inferSelect
export type InsertClaimPhoto = z.infer<typeof insertClaimPhotoSchema>
export type UpdateClaimPhoto = z.infer<typeof updateClaimPhotoSchema>
