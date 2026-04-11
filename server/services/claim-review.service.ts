import db from '#server/database'
import type {
  ClaimPhotoStatus,
  ClaimStatus,
  UpdateClaim
} from '#server/database/schema'
import { claimRepo } from '#server/repositories/claim.repo'
import { claimPhotoRepo } from '#server/repositories/claim-photo.repo'
import { claimHistoryRepo } from '#server/repositories/claim-history.repo'
import { photoReviewRepo } from '#server/repositories/photo-review.repo'
import type { AuthUser } from '#server/utils/auth'
import { buildHistory } from '#server/utils/claim-history'
import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'
import { canTransitionClaimStatus } from '#server/utils/status-transitions'

const REVIEWABLE_STATUSES: ClaimStatus[] = ['SUBMITTED', 'IN_REVIEW', 'NEED_REVISION']

function ensureClaimFound<T>(claim: T | null): T {
  if (!claim) {
    throw new Error(ErrorCode.CLAIM_NOT_FOUND)
  }
  return claim
}

export const claimReviewService = {
  async getPhotos(claimId: number, _user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    ensureClaimFound(existing)

    return await claimPhotoRepo.findByClaimId(claimId)
  },

  async getHistory(claimId: number, _user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    ensureClaimFound(existing)

    return await claimHistoryRepo.findByClaimId(claimId)
  },

  async getClaimsForReview(filter: {
    page: number
    limit: number
    status?: ClaimStatus | ClaimStatus[]
    search?: string
    vendorId?: number
    branch?: string
  }) {
    const status = filter.status ?? REVIEWABLE_STATUSES

    const [items, total] = await Promise.all([
      claimRepo.findAll({
        ...filter,
        status
      }),
      claimRepo.countByFilter({
        status,
        search: filter.search,
        vendorId: filter.vendorId,
        branch: filter.branch
      })
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getClaimDetailForReview(claimId: number, user: AuthUser) {
    const detail = await claimRepo.findByIdWithRelations(claimId)
    const found = ensureClaimFound(detail)

    if (found.claim.claimStatus === 'SUBMITTED') {
      await db.transaction(async (tx) => {
        await claimRepo.update(claimId, {
          claimStatus: 'IN_REVIEW',
          updatedBy: user.id
        }, tx)

        await claimHistoryRepo.insert(buildHistory({
          claimId,
          action: 'REVIEW',
          fromStatus: 'SUBMITTED',
          toStatus: 'IN_REVIEW',
          note: 'QRCC opened claim detail and started review',
          user
        }, 'QRCC'), tx)
      })

      const refreshed = await claimRepo.findByIdWithRelations(claimId)
      const detail = ensureClaimFound(refreshed)
      const photoReviews = await photoReviewRepo.findByClaimId(claimId)
      return {
        ...detail,
        photoReviews
      }
    }

    const photoReviews = await photoReviewRepo.findByClaimId(claimId)
    return {
      ...found,
      photoReviews
    }
  },

  async updateClaimFields(claimId: number, data: Partial<UpdateClaim>, user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    const found = ensureClaimFound(existing)

    if (!canTransitionClaimStatus(found.claimStatus, 'APPROVED') && !canTransitionClaimStatus(found.claimStatus, 'NEED_REVISION')) {
      throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
    }

    const payload: Partial<UpdateClaim> = { updatedBy: user.id }

    if (data.panelPartNumber !== undefined) {
      payload.panelPartNumber = data.panelPartNumber
    }
    if (data.ocSerialNo !== undefined) {
      payload.ocSerialNo = data.ocSerialNo
    }
    if (data.defectCode !== undefined) {
      payload.defectCode = data.defectCode
    }
    if (data.odfNumber !== undefined) {
      payload.odfNumber = data.odfNumber
    }
    if (data.version !== undefined) {
      payload.version = data.version
    }
    if (data.week !== undefined) {
      payload.week = data.week
    }

    const updated = await claimRepo.update(claimId, payload)
    if (!updated) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    await claimHistoryRepo.insert(buildHistory({
      claimId,
      action: 'UPDATE',
      fromStatus: 'IN_REVIEW',
      toStatus: 'IN_REVIEW',
      note: 'QRCC updated editable claim fields',
      user
    }, 'QRCC'))

    return updated
  },

  async reviewPhoto(claimId: number, claimPhotoId: number, decision: ClaimPhotoStatus, rejectReason: string | null, user: AuthUser) {
    if (decision === 'PENDING') {
      throw new Error(ErrorCode.VALIDATION_FAILED)
    }

    const photo = await claimPhotoRepo.findById(claimPhotoId)
    if (!photo || photo.claimId !== claimId) {
      throw new Error(ErrorCode.PHOTO_NOT_FOUND)
    }

    const existing = await claimRepo.findById(claimId)
    const found = ensureClaimFound(existing)

    if (!canTransitionClaimStatus(found.claimStatus, 'APPROVED') && !canTransitionClaimStatus(found.claimStatus, 'NEED_REVISION')) {
      throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
    }

    if (photo.status !== 'PENDING') {
      throw new Error(ErrorCode.PHOTO_ALREADY_REVIEWED)
    }

    if (decision === 'REJECT' && (!rejectReason || rejectReason.trim().length === 0)) {
      throw new Error(ErrorCode.VALIDATION_FAILED)
    }

    await db.transaction(async (tx) => {
      await photoReviewRepo.insert({
        claimPhotoId,
        reviewedBy: user.id,
        status: decision,
        rejectReason: decision === 'REJECT' ? rejectReason : null
      }, tx)

      await claimPhotoRepo.update(claimPhotoId, {
        status: decision,
        rejectReason: decision === 'REJECT' ? rejectReason : null
      }, tx)

      await claimHistoryRepo.insert(buildHistory({
        claimId,
        action: 'REVIEW_PHOTO',
        fromStatus: 'IN_REVIEW',
        toStatus: 'IN_REVIEW',
        note: `Photo ${claimPhotoId} reviewed as ${decision}`,
        user
      }, 'QRCC'), tx)
    })

    return await claimPhotoRepo.findById(claimPhotoId)
  },

  async finalizeReview(claimId: number, user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    const found = ensureClaimFound(existing)

    if (found.claimStatus !== 'IN_REVIEW') {
      throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
    }

    const photos = await claimPhotoRepo.findByClaimId(claimId)
    if (photos.length === 0 || photos.some(photo => photo.status === 'PENDING')) {
      throw new Error(ErrorCode.REQUIRED_PHOTOS_MISSING)
    }

    const hasRejected = photos.some(photo => photo.status === 'REJECT')
    const nextStatus: ClaimStatus = hasRejected ? 'NEED_REVISION' : 'APPROVED'

    const updated = await db.transaction(async (tx) => {
      const claimUpdated = await claimRepo.update(claimId, {
        claimStatus: nextStatus,
        updatedBy: user.id
      }, tx)

      await claimHistoryRepo.insert(buildHistory({
        claimId,
        action: hasRejected ? 'REQUEST_REVISION' : 'APPROVE',
        fromStatus: 'IN_REVIEW',
        toStatus: nextStatus,
        note: hasRejected ? 'At least one photo rejected' : 'All photos verified',
        user
      }, 'QRCC'), tx)

      return claimUpdated
    })

    if (!updated) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    return updated
  }
}

export function mapClaimReviewErrorToHttp(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.CLAIM_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Claim not found' }
  }
  if (code === ErrorCode.PHOTO_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Photo not found' }
  }
  if (code === ErrorCode.PHOTO_ALREADY_REVIEWED) {
    return { statusCode: 409, statusMessage: 'Photo has already been reviewed' }
  }
  if (code === ErrorCode.REQUIRED_PHOTOS_MISSING) {
    return { statusCode: 422, statusMessage: 'All claim photos must be reviewed before finalize' }
  }
  if (code === ErrorCode.INVALID_STATUS_TRANSITION) {
    return { statusCode: 422, statusMessage: 'Invalid status transition' }
  }
  if (code === ErrorCode.VALIDATION_FAILED) {
    return { statusCode: 400, statusMessage: 'Validation failed' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
