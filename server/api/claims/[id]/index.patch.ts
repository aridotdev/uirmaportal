import { getRouterParam, readBody, createError } from 'h3'
import { claims } from '~~/server/utils/claim-data'

interface UpdateClaimBody {
  panelPartNumber?: string
  ocSerialNo?: string
  defectName?: string
  odfNumber?: string | null
  version?: string | null
  week?: string | null
}

const ALLOWED_FIELDS: (keyof UpdateClaimBody)[] = [
  'panelPartNumber',
  'ocSerialNo',
  'defectName',
  'odfNumber',
  'version',
  'week'
]

/**
 * PATCH /api/claims/:id
 *
 * Update editable fields of a claim during QRCC review.
 * Only allowed when claim is IN_REVIEW.
 * Only specific fields are editable.
 */
export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid claim id' })
  }

  const claim = claims.find(item => item.id === id)
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: 'Claim not found' })
  }

  if (claim.claimStatus !== 'IN_REVIEW') {
    throw createError({
      statusCode: 422,
      statusMessage: `Cannot update claim with status ${claim.claimStatus}. Only IN_REVIEW claims can be edited.`
    })
  }

  const body = await readBody<UpdateClaimBody>(event)

  // Apply only allowed fields
  let changed = false
  for (const field of ALLOWED_FIELDS) {
    if (field in body && body[field] !== undefined) {
      (claim as unknown as Record<string, unknown>)[field] = body[field]
      changed = true
    }
  }

  if (changed) {
    claim.updatedAt = new Date().toISOString()
    claim.updatedBy = 'user-qrcc-001'
  }

  return {
    success: true,
    claim
  }
})
