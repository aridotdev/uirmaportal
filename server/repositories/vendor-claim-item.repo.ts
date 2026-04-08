import { and, count, eq } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import {
  claim,
  vendorClaimItem
} from '#server/database/schema'

type DbExecutor = DbTransaction | typeof db
type VendorClaimItemInsert = typeof vendorClaimItem.$inferInsert
type VendorClaimItemUpdate = Partial<VendorClaimItemInsert>

export const vendorClaimItemRepo = {
  async findByVendorClaimId(vendorClaimId: number) {
    return await db
      .select({
        item: vendorClaimItem,
        claim
      })
      .from(vendorClaimItem)
      .innerJoin(claim, eq(vendorClaimItem.claimId, claim.id))
      .where(eq(vendorClaimItem.vendorClaimId, vendorClaimId))
  },

  async findById(id: number) {
    const rows = await db
      .select()
      .from(vendorClaimItem)
      .where(eq(vendorClaimItem.id, id))
      .limit(1)

    return rows[0] ?? null
  },

  async insertMany(data: VendorClaimItemInsert[], tx?: DbTransaction) {
    if (data.length === 0) {
      return []
    }

    const executor: DbExecutor = tx ?? db
    return await executor.insert(vendorClaimItem).values(data).returning()
  },

  async update(id: number, data: VendorClaimItemUpdate, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor
      .update(vendorClaimItem)
      .set(data)
      .where(eq(vendorClaimItem.id, id))
      .returning()

    return rows[0] ?? null
  },

  async countPendingByVendorClaimId(vendorClaimId: number, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor
      .select({ total: count(vendorClaimItem.id) })
      .from(vendorClaimItem)
      .where(and(
        eq(vendorClaimItem.vendorClaimId, vendorClaimId),
        eq(vendorClaimItem.vendorDecision, 'PENDING')
      ))

    return Number(rows[0]?.total ?? 0)
  }
}
