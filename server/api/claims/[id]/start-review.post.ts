import { getRouterParam, createError } from 'h3'
import { claims } from '~~/server/utils/claim-data'
import { addClaimHistory, getPhotosByClaimId } from '~~/server/utils/claim-review-data'

/**
 * POST /api/claims/:id/start-review
 *
 * Auto-transitions a SUBMITTED claim to IN_REVIEW.
 * Creates a START_REVIEW history record.
 * If already IN_REVIEW, returns current state without duplicate history.
 */
export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid claim id' })
  }

  const claim = claims.find(item => item.id === id)
  if (!claim) {
    throw createError({ statusCode: 404, statusMessage: 'Claim not found' })
  }

  // Already in review — return current state without creating duplicate history
  if (claim.claimStatus === 'IN_REVIEW') {
    return {
      success: true,
      claim,
      photos: getPhotosByClaimId(id),
      alreadyInReview: true
    }
  }

  // Only SUBMITTED claims can start review
  if (claim.claimStatus !== 'SUBMITTED') {
    throw createError({
      statusCode: 422,
      statusMessage: `Cannot start review for claim with status ${claim.claimStatus}. Only SUBMITTED claims can be reviewed.`
    })
  }

  const fromStatus = claim.claimStatus
  claim.claimStatus = 'IN_REVIEW'
  claim.updatedAt = new Date().toISOString()
  claim.updatedBy = 'user-qrcc-001'

  addClaimHistory({
    claimId: claim.id,
    action: 'REVIEW',
    fromStatus,
    toStatus: 'IN_REVIEW',
    note: 'QRCC memulai review claim.'
  })

  return {
    success: true,
    claim,
    photos: getPhotosByClaimId(id),
    alreadyInReview: false
  }
})
