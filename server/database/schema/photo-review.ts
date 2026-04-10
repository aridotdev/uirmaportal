// server/database/schema/photo-review.ts
// reviewedBy references user.id (UUID from Better-Auth).
import { relations, sql } from 'drizzle-orm'
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { claimPhoto } from './claim-photo'
import { user } from './auth'
import {
  CLAIM_PHOTO_STATUSES,
  type ClaimPhotoStatus
} from '../../../shared/utils/constants'

export const photoReview = sqliteTable('photo_review', {
  id: integer().primaryKey({ autoIncrement: true }),
  claimPhotoId: integer().notNull().references(() => claimPhoto.id, { onDelete: 'restrict' }),
  reviewedBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
  status: text().notNull().$type<ClaimPhotoStatus>(),
  rejectReason: text(),
  reviewedAt: integer({ mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
}, table => [
  index('photo_review_claim_photo_idx').on(table.claimPhotoId),
  index('photo_review_reviewer_idx').on(table.reviewedBy)
])

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const insertPhotoReviewSchema = createInsertSchema(photoReview, {
  claimPhotoId: z.number().int().positive(),
  reviewedBy: z.string().min(1, 'Reviewer ID is required'),
  status: z.enum(CLAIM_PHOTO_STATUSES)
}).omit({
  id: true,
  reviewedAt: true
})

export const selectPhotoReviewSchema = createSelectSchema(photoReview)

export const photoReviewRelations = relations(photoReview, ({ one }) => ({
  claimPhoto: one(claimPhoto, { fields: [photoReview.claimPhotoId], references: [claimPhoto.id] })
}))

// ============================================================
// TYPE EXPORTS
// ============================================================

export type PhotoReview = typeof photoReview.$inferSelect
export type InsertPhotoReview = z.infer<typeof insertPhotoReviewSchema>
