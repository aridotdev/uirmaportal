import { and, eq, sql } from 'drizzle-orm'
import db, { type DbTransaction } from '#server/database'
import { sequenceGenerator, type SequenceType } from '#server/database/schema'

type DbExecutor = DbTransaction | typeof db

export const sequenceRepo = {
  async findByTypeAndDate(type: SequenceType, currentDate: string, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db
    const rows = await executor
      .select()
      .from(sequenceGenerator)
      .where(and(
        eq(sequenceGenerator.type, type),
        eq(sequenceGenerator.currentDate, currentDate)
      ))
      .limit(1)

    return rows[0] ?? null
  },

  async upsertAndIncrement(type: SequenceType, currentDate: string, tx?: DbTransaction) {
    const executor: DbExecutor = tx ?? db

    const rows = await executor
      .insert(sequenceGenerator)
      .values({
        type,
        currentDate,
        lastSequence: 1
      })
      .onConflictDoUpdate({
        target: [sequenceGenerator.type, sequenceGenerator.currentDate],
        set: {
          lastSequence: sql`${sequenceGenerator.lastSequence} + 1`
        }
      })
      .returning({
        lastSequence: sequenceGenerator.lastSequence
      })

    return Number(rows[0]?.lastSequence ?? 0)
  }
}
