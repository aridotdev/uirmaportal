import { getRouterParam, readBody, createError } from 'h3'
import { claims } from '~~/server/utils/claim-data'
import {
  getPhotosByClaimId,
  updatePhotoStatus,
  addPhotoReview,
  addClaimHistory
} from '~~/server/utils/claim-review-data'
import type { ClaimPhotoStatus } from '~~/shared/utils/constants'

interface ReviewPhotoItem {
  photoId: number
  status: ClaimPhotoStatus
  note?: string
}

interface ReviewBody {
  photos: ReviewPhotoItem[]
}

/**
 * POST /api/claims/:id/review
 *
 * Finalize the QRCC review for a claim.
 * Accepts an array of photo review decisions.
 * Determines final claim status based on outcomes:
 *   - any REJECT -> NEED_REVISION
 *   - all VERIFIED -> APPROVED
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
      statusMessage: `Cannot submit review for claim with status ${claim.claimStatus}. Only IN_REVIEW claims can be reviewed.`
    })
  }

  const body = await readBody<ReviewBody>(event)

  if (!body.photos || !Array.isArray(body.photos) || body.photos.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Review must include photo decisions.'
    })
  }

  const claimPhotos = getPhotosByClaimId(id)

  // Validate all photos are covered
  if (body.photos.length !== claimPhotos.length) {
    throw createError({
      statusCode: 400,
      statusMessage: `Expected ${claimPhotos.length} photo reviews, got ${body.photos.length}.`
    })
  }

  // Validate no PENDING
  for (const item of body.photos) {
    if (item.status === 'PENDING') {
      throw createError({
        statusCode: 400,
        statusMessage: 'All photos must be VERIFIED or REJECT. PENDING is not allowed.'
      })
    }
    if (item.status === 'REJECT' && (!item.note || !item.note.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: `Photo ${item.photoId} is REJECT but has no note. Reject note is required.`
      })
    }
  }

  // Apply photo reviews
  for (const item of body.photos) {
    updatePhotoStatus(item.photoId, item.status, item.status === 'REJECT' ? item.note : null)
    addPhotoReview({
      claimPhotoId: item.photoId,
      status: item.status,
      rejectReason: item.status === 'REJECT' ? (item.note ?? null) : null
    })
  }

  // Determine final status
  const hasReject = body.photos.some(p => p.status === 'REJECT')
  const fromStatus = claim.claimStatus
  const toStatus = hasReject ? 'NEED_REVISION' : 'APPROVED'

  claim.claimStatus = toStatus
  claim.updatedAt = new Date().toISOString()
  claim.updatedBy = 'user-qrcc-001'

  // Create history record
  addClaimHistory({
    claimId: claim.id,
    action: hasReject ? 'REJECT' : 'APPROVE',
    fromStatus,
    toStatus,
    note: hasReject
      ? `Terdapat ${body.photos.filter(p => p.status === 'REJECT').length} foto yang ditolak. Claim memerlukan revisi dari CS.`
      : 'Semua foto diverifikasi. Claim disetujui.'
  })

  return {
    success: true,
    claim,
    finalStatus: toStatus
  }
})
