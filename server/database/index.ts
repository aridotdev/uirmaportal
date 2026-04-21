import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import 'dotenv/config'
import * as schema from './schema'

export const url = process.env.DB_FILE_NAME || 'file:local.db'
export const client = createClient({ url })

let foreignKeysInitPromise: Promise<void> | null = null

export async function ensureSqliteForeignKeys() {
  if (!url.startsWith('file:')) {
    return
  }

  if (!foreignKeysInitPromise) {
    foreignKeysInitPromise = client.execute('PRAGMA foreign_keys = ON;')
      .then(() => undefined)
      .catch((err: unknown) => {
        console.error('[db] Failed to enable PRAGMA foreign_keys:', err)
      })
  }

  await foreignKeysInitPromise
}

const db = drizzle(client, { schema })

export type db = typeof db
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
export default db
