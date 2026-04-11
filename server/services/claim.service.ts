import db from '#server/database'
import {
  CLAIM_HISTORY_ACTIONS,
  USER_ROLES,
  type ClaimHistoryAction,
  type ClaimStatus,
  type InsertClaim,
  type InsertClaimPhoto,
  type PhotoType,
  type UpdateClaim,
  type UserRole
} from '#server/database/schema'
import { claimRepo } from '#server/repositories/claim.repo'
import { claimPhotoRepo } from '#server/repositories/claim-photo.repo'
import { claimHistoryRepo } from '#server/repositories/claim-history.repo'
import { notificationRepo } from '#server/repositories/notification.repo'
import { sequenceService } from '#server/services/sequence.service'
import { buildHistory } from '#server/utils/claim-history'
import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'
import { canTransitionClaimStatus } from '#server/utils/status-transitions'
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'

type AuthUser = {
  id: string
  role?: UserRole
  branch: string | null
}

type CreateClaimPayload = {
  notificationCode: string
  modelName: string
  inch: number
  branch: string
  vendorName: string
  defectCode: string
  defectName: string
  panelPartNumber: string
  ocSerialNo: string
  odfNumber?: string
  odfVersion?: string
  odfWeek?: string
  photos?: Array<{
    photoType: PhotoType
    label: string
    file: unknown
  }>
  submitAs: 'DRAFT' | 'SUBMITTED'
}

type RevisionPayload = {
  revisedFields: Record<string, string>
  replacedPhotos: Array<{
    photoType: PhotoType
    file: unknown
  }>
  revisionNote: string
}

type AuditTrailQuery = {
  page: number
  limit: number
  search?: string
  action?: ClaimHistoryAction
  userRole?: UserRole
  dateFrom?: Date
  dateTo?: Date
  sort?: 'asc' | 'desc'
}

export const auditTrailActions = CLAIM_HISTORY_ACTIONS
export const auditTrailUserRoles = USER_ROLES

export const claimService = {
  async resolveClaimId(idParam: string): Promise<number> {
    const asNumber = Number(idParam)
    const claim = Number.isInteger(asNumber) && asNumber > 0
      ? await claimRepo.findById(asNumber)
      : await claimRepo.findByClaimNumber(idParam)

    if (!claim) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    return claim.id
  },

  async getClaimsForCs(userId: string, filter: { page: number, limit: number, status?: ClaimStatus | ClaimStatus[], search?: string }) {
    const [items, total] = await Promise.all([
      claimRepo.findBySubmittedBy(userId, filter),
      claimRepo.countByFilter({
        submittedBy: userId,
        status: filter.status,
        search: filter.search
      })
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getClaimDetailForCs(claimId: number, userId: string) {
    const detail = await claimRepo.findByIdWithRelations(claimId)
    if (!detail) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    if (detail.claim.submittedBy !== userId) {
      throw new Error(ErrorCode.FORBIDDEN)
    }

    return detail
  },

  async createClaim(data: CreateClaimPayload, user: AuthUser) {
    const now = new Date()
    const fiscal = getFiscalPeriodInfo(now)
    const claimNumber = await sequenceService.generateClaimNumber()

    const existingNotification = await notificationRepo.findByCode(data.notificationCode)
    if (existingNotification?.status === 'USED') {
      throw new Error(ErrorCode.NOTIFICATION_ALREADY_USED)
    }

    return await db.transaction(async (tx) => {
      let notificationId = existingNotification?.id ?? 0

      if (!existingNotification) {
        const createdNotification = await notificationRepo.insert({
          notificationCode: data.notificationCode,
          notificationDate: now.getTime(),
          modelId: 1,
          branch: data.branch,
          vendorId: 1,
          status: 'USED',
          fiscalYear: fiscal.fiscalYear,
          fiscalHalf: fiscal.fiscalHalf,
          fiscalLabel: fiscal.fiscalLabel,
          calendarYear: fiscal.calendarYear,
          calendarMonth: fiscal.calendarMonth,
          createdBy: user.id,
          updatedBy: user.id
        }, tx)

        if (!createdNotification) {
          throw new Error(ErrorCode.INTERNAL_ERROR)
        }

        notificationId = createdNotification.id
      } else if (existingNotification.status === 'NEW') {
        await notificationRepo.updateStatus(existingNotification.id, {
          status: 'USED',
          updatedBy: user.id
        }, tx)
      }

      const claimPayload: InsertClaim = {
        claimNumber,
        notificationId,
        modelId: existingNotification?.modelId ?? 1,
        vendorId: existingNotification?.vendorId ?? 1,
        inch: data.inch,
        branch: data.branch,
        odfNumber: data.odfNumber,
        panelPartNumber: data.panelPartNumber,
        ocSerialNo: data.ocSerialNo,
        defectCode: data.defectCode,
        version: data.odfVersion,
        week: data.odfWeek,
        claimStatus: data.submitAs,
        submittedBy: user.id,
        updatedBy: user.id,
        fiscalYear: fiscal.fiscalYear,
        fiscalHalf: fiscal.fiscalHalf,
        fiscalLabel: fiscal.fiscalLabel,
        calendarYear: fiscal.calendarYear,
        calendarMonth: fiscal.calendarMonth
      }

      const createdClaim = await claimRepo.insert(claimPayload, tx)
      if (!createdClaim) {
        throw new Error(ErrorCode.INTERNAL_ERROR)
      }

      const photoPayload: InsertClaimPhoto[] = (data.photos ?? []).map(item => ({
        claimId: createdClaim.id,
        photoType: item.photoType,
        filePath: `uploads/claims/${createdClaim.id}/${item.photoType}.jpg`,
        status: 'PENDING'
      }))
      await claimPhotoRepo.insertMany(photoPayload, tx)

      await claimHistoryRepo.insert(buildHistory({
        claimId: createdClaim.id,
        action: 'CREATE',
        fromStatus: data.submitAs,
        toStatus: data.submitAs,
        user
      }, 'CS'), tx)

      if (data.submitAs === 'SUBMITTED') {
        await claimHistoryRepo.insert(buildHistory({
          claimId: createdClaim.id,
          action: 'SUBMIT',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          user
        }, 'CS'), tx)
      }

      return createdClaim
    })
  },

  async saveDraft(claimId: number, data: Partial<UpdateClaim>, user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    if (existing.submittedBy !== user.id) {
      throw new Error(ErrorCode.FORBIDDEN)
    }

    if (existing.claimStatus !== 'DRAFT') {
      throw new Error(ErrorCode.CLAIM_NOT_EDITABLE)
    }

    const updated = await claimRepo.update(claimId, {
      ...data,
      updatedBy: user.id
    })

    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    await claimHistoryRepo.insert(buildHistory({
      claimId,
      action: 'UPDATE',
      fromStatus: 'DRAFT',
      toStatus: 'DRAFT',
      user
    }, 'CS'))

    return updated
  },

  async submitClaim(claimId: number, user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    if (existing.submittedBy !== user.id) {
      throw new Error(ErrorCode.FORBIDDEN)
    }

    if (!canTransitionClaimStatus(existing.claimStatus, 'SUBMITTED')) {
      throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
    }

    const photos = await claimPhotoRepo.findByClaimId(claimId)
    if (photos.length === 0) {
      throw new Error(ErrorCode.REQUIRED_PHOTOS_MISSING)
    }

    return await db.transaction(async (tx) => {
      const updated = await claimRepo.update(claimId, {
        claimStatus: 'SUBMITTED',
        updatedBy: user.id
      }, tx)

      if (!updated) {
        throw new Error(ErrorCode.INTERNAL_ERROR)
      }

      await claimHistoryRepo.insert(buildHistory({
        claimId,
        action: 'SUBMIT',
        fromStatus: existing.claimStatus,
        toStatus: 'SUBMITTED',
        user
      }, 'CS'), tx)

      return updated
    })
  },

  async submitRevision(claimId: number, revisionData: RevisionPayload, user: AuthUser) {
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    if (existing.submittedBy !== user.id) {
      throw new Error(ErrorCode.FORBIDDEN)
    }

    if (!canTransitionClaimStatus(existing.claimStatus, 'SUBMITTED')) {
      throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
    }

    return await db.transaction(async (tx) => {
      const changed: Partial<UpdateClaim> = {
        updatedBy: user.id
      }

      if (revisionData.revisedFields.panelPartNumber) {
        changed.panelPartNumber = revisionData.revisedFields.panelPartNumber
      }
      if (revisionData.revisedFields.ocSerialNo) {
        changed.ocSerialNo = revisionData.revisedFields.ocSerialNo
      }
      if (revisionData.revisedFields.defectCode) {
        changed.defectCode = revisionData.revisedFields.defectCode
      }
      if (revisionData.revisedFields.odfNumber) {
        changed.odfNumber = revisionData.revisedFields.odfNumber
      }
      if (revisionData.revisedFields.version) {
        changed.version = revisionData.revisedFields.version
      }
      if (revisionData.revisedFields.week) {
        changed.week = revisionData.revisedFields.week
      }

      const photoTypes = revisionData.replacedPhotos.map(item => item.photoType)
      if (photoTypes.length > 0) {
        await claimPhotoRepo.deleteByClaimIdAndTypes(claimId, photoTypes, tx)

        const newPhotos: InsertClaimPhoto[] = revisionData.replacedPhotos.map(item => ({
          claimId,
          photoType: item.photoType,
          filePath: `uploads/claims/${claimId}/${item.photoType}-revision.jpg`,
          status: 'PENDING'
        }))

        await claimPhotoRepo.insertMany(newPhotos, tx)
      }

      const updated = await claimRepo.update(claimId, {
        ...changed,
        claimStatus: 'SUBMITTED'
      }, tx)

      if (!updated) {
        throw new Error(ErrorCode.INTERNAL_ERROR)
      }

      await claimHistoryRepo.insert(buildHistory({
        claimId,
        action: 'SUBMIT',
        fromStatus: 'NEED_REVISION',
        toStatus: 'SUBMITTED',
        note: revisionData.revisionNote,
        user
      }, 'CS'), tx)

      return updated
    })
  },

  async getAuditTrail(filter: AuditTrailQuery) {
    const [items, total] = await Promise.all([
      claimHistoryRepo.findAllWithUserInfo(filter),
      claimHistoryRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  }
}

export function mapClaimServiceErrorToHttp(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.CLAIM_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Claim not found' }
  }
  if (code === ErrorCode.NOTIFICATION_ALREADY_USED) {
    return { statusCode: 409, statusMessage: 'Notification already used' }
  }
  if (code === ErrorCode.REQUIRED_PHOTOS_MISSING) {
    return { statusCode: 422, statusMessage: 'Required photos are missing' }
  }
  if (code === ErrorCode.CLAIM_NOT_EDITABLE) {
    return { statusCode: 422, statusMessage: 'Claim is not editable' }
  }
  if (code === ErrorCode.INVALID_STATUS_TRANSITION) {
    return { statusCode: 422, statusMessage: 'Invalid status transition' }
  }
  if (code === ErrorCode.FORBIDDEN) {
    return { statusCode: 403, statusMessage: 'Forbidden' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
