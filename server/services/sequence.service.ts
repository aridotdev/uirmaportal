import db from '#server/database'
import { sequenceRepo } from '#server/repositories/sequence.repo'

const CLAIM_PREFIX = 'CLM'
const VENDOR_CLAIM_PREFIX = 'VC'

function getDateStamp(date: Date): string {
  const yyyy = String(date.getUTCFullYear())
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

export const sequenceService = {
  async generateClaimNumber(): Promise<string> {
    const now = new Date()
    const year = now.getUTCFullYear()
    const dateStamp = getDateStamp(now)

    return await db.transaction(async (tx) => {
      const sequence = await sequenceRepo.upsertAndIncrement('CLAIM', dateStamp, tx)
      const padded = String(sequence).padStart(4, '0')
      return `${CLAIM_PREFIX}-${year}-${padded}`
    })
  },

  async generateVendorClaimNumber(): Promise<string> {
    const now = new Date()
    const dateStamp = getDateStamp(now)

    return await db.transaction(async (tx) => {
      const sequence = await sequenceRepo.upsertAndIncrement('VENDOR_CLAIM', dateStamp, tx)
      const padded = String(sequence).padStart(3, '0')
      return `${VENDOR_CLAIM_PREFIX}-${dateStamp}-${padded}`
    })
  }
}
