import { eq } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import {
  photoReview,
  claimPhoto,
  type InsertPhotoReview
} from '#server/database/schema'

type DbExecutor = DbTransaction | typeof db

export const photoReviewRepo = {
  async findByClaimPhotoId(claimPhotoId: number) {
    return await db
      .select()
      .from(photoReview)
      .where(eq(photoReview.claimPhotoId, claimPhotoId))
  },

  async findByClaimId(claimId: number) {
    return await db
      .select({
        review: photoReview,
        photo: claimPhoto
      })
      .from(photoReview)
      .innerJoin(claimPhoto, eq(photoReview.claimPhotoId, claimPhoto.id))
      .where(eq(claimPhoto.claimId, claimId))
  },

  async insert(data: InsertPhotoReview, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor.insert(photoReview).values(data).returning()
    return rows[0] ?? null
  }
}
