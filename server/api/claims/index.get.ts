// server/api/claims.get.ts
import { CLAIM_STATUSES } from '~~/shared/utils/constants'

export default defineEventHandler(async () => {
  const dummyClaims = Array.from({ length: 25 }, (_, i) => {
    const id = i + 1
    const statusIndex = i % CLAIM_STATUSES.length
    const claimStatus = CLAIM_STATUSES[statusIndex]

    // Realistic dummy data
    const date = new Date()
    date.setDate(date.getDate() - i) // Different dates

    return {
      id,
      claimNumber: `CLM-${2024}${String(id).padStart(4, '0')}`,
      notificationId: Math.floor(Math.random() * 100) + 1,
      modelId: Math.floor(Math.random() * 50) + 1,
      vendorId: (i % 3) + 1, // Cycling through 1, 2, 3 (MOKA, MTC, SDP)
      inch: [32, 43, 50, 55, 65, 75][i % 6],
      branch: ['JAKARTA', 'SURABAYA', 'MEDAN', 'BANDUNG', 'MAKASSAR'][i % 5],
      odfNumber: i % 2 === 0 ? `ODF-${Math.random().toString(36).substring(7).toUpperCase()}` : null,
      panelSerialNo: `PNL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      ocSerialNo: `OC${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      defectCode: `DEF-${['A', 'B', 'C', 'D'][i % 4]}${Math.floor(Math.random() * 100)}`,
      version: i % 3 === 0 ? `V${(i % 5) + 1}.0` : null,
      week: i % 4 === 0 ? `W${(i % 52) + 1}` : null,
      claimStatus,
      submittedBy: 'user-uuid-dummy-1',
      updatedBy: 'user-uuid-dummy-1',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    }
  })

  return dummyClaims
})
