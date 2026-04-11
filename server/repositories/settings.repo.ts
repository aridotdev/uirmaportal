import { eq } from 'drizzle-orm'
import db from '#server/database'
import { appSettings } from '#server/database/schema'

export const settingsRepo = {
  async findByKey(key: string) {
    const rows = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .limit(1)

    return rows[0] ?? null
  },

  async upsert(key: string, value: unknown, updatedBy: string) {
    const rows = await db
      .insert(appSettings)
      .values({
        key,
        value,
        updatedBy
      })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: {
          value,
          updatedBy,
          updatedAt: new Date()
        }
      })
      .returning()

    return rows[0] ?? null
  },

  async findAll() {
    return await db
      .select()
      .from(appSettings)
  }
}
