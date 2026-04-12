import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import 'dotenv/config'
import * as schema from './schema'

const url = process.env.DB_FILE_NAME || 'file:local.db'
const client = createClient({ url })

// Enable foreign key enforcement for SQLite/libSQL local files.
// Wrapped in async IIFE so the PRAGMA is awaited before the first query runs.
if (url.startsWith('file:')) {
  await client.execute('PRAGMA foreign_keys = ON;').catch((err: unknown) => {
    console.error('[db] Failed to enable PRAGMA foreign_keys:', err)
  })
}

const db = drizzle(client, { schema })

export type db = typeof db
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
export default db
