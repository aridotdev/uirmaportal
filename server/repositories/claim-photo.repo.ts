import { eq } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import {
  claimPhoto,
  type InsertClaimPhoto,
  type UpdateClaimPhoto
} from '#server/database/schema'

type DbExecutor = DbTransaction | typeof db

export const claimPhotoRepo = {
  async findByClaimId(claimId: number) {
    return await db
      .select()
      .from(claimPhoto)
      .where(eq(claimPhoto.claimId, claimId))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(claimPhoto)
      .where(eq(claimPhoto.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async insert(data: InsertClaimPhoto, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor.insert(claimPhoto).values(data).returning()
    return rows[0] ?? null
  },

  async insertMany(data: InsertClaimPhoto[], tx?: DbTransaction) {
    if (data.length === 0) {
      return []
    }

    const executor: DbExecutor = tx ?? db
    return await executor.insert(claimPhoto).values(data).returning()
  },

  async update(id: number, data: UpdateClaimPhoto, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor
      .update(claimPhoto)
      .set(data)
      .where(eq(claimPhoto.id, id))
      .returning()

    return rows[0] ?? null
  },

  async deleteById(id: number, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    return await executor
      .delete(claimPhoto)
      .where(eq(claimPhoto.id, id))
      .returning()
  },

  async deleteByClaimId(claimId: number, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    return await executor
      .delete(claimPhoto)
      .where(eq(claimPhoto.claimId, claimId))
      .returning()
  }
}
