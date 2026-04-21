import { defineNitroPlugin } from 'nitropack/runtime'
import { ensureSqliteForeignKeys } from '../database'

export default defineNitroPlugin(async () => {
  await ensureSqliteForeignKeys()
})
