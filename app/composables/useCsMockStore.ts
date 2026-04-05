import { computed, ref } from 'vue'
import type {
  CsActivityStats,
  CsClaimDetail,
  CsClaimListItem,
  CsCreateClaimPayload,
  CsNotificationLookupResult,
  CsNotificationRecord,
  CsReferenceData,
  CsRevisionPayload,
  CsUserProfile
} from '~/utils/cs-mock-data'
import {
  cloneClaims,
  CS_MOCK_BRANCHES,
  CS_MOCK_CLAIMS,
  CS_MOCK_CURRENT_USER,
  CS_MOCK_DEFECTS,
  CS_MOCK_NOTIFICATIONS,
  CS_MOCK_PRODUCT_MODELS,
  CS_MOCK_QRCC_REVIEWER,
  CS_MOCK_VENDORS,
  generateClaimNumber,
  getMaxHistoryId,
  getMaxPhotoId,
  PHOTO_LABEL_MAP
} from '~/utils/cs-mock-data'

const _claims = ref<CsClaimDetail[]>(cloneClaims(CS_MOCK_CLAIMS))
const _notifications = ref<CsNotificationRecord[]>(CS_MOCK_NOTIFICATIONS.map(item => ({ ...item })))

function sortByUpdatedAtDesc<T extends { updatedAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function mapToClaimListItem(item: CsClaimDetail): CsClaimListItem {
  return {
    id: item.claimNumber,
    claimNumber: item.claimNumber,
    notificationCode: item.notificationCode,
    modelName: item.modelName,
    inch: item.inch,
    vendorName: item.vendorName,
    branch: item.branch,
    defectName: item.defectName,
    claimStatus: item.claimStatus,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }
}

function toObjectUrl(file: File): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(file)
  }
  return ''
}

export function useCsMockStore() {
  const currentUser: CsUserProfile = CS_MOCK_CURRENT_USER

  const claims = computed<CsClaimListItem[]>(() => {
    return sortByUpdatedAtDesc(_claims.value).map(mapToClaimListItem)
  })

  function getClaimDetail(claimId: string): CsClaimDetail | null {
    return _claims.value.find(c => c.claimNumber === claimId) ?? null
  }

  function lookupNotification(code: string): CsNotificationLookupResult | null {
    const normalizedCode = code.trim().toUpperCase()
    const notification = _notifications.value.find(n => n.notificationCode === normalizedCode)
    if (!notification) return null

    const productModel = CS_MOCK_PRODUCT_MODELS.find(model => model.id === notification.modelId) ?? null
    const vendor = CS_MOCK_VENDORS.find(item => item.id === notification.vendorId) ?? null

    return {
      notification: {
        id: notification.id,
        notificationCode: notification.notificationCode,
        notificationDate: new Date(notification.notificationDate).getTime(),
        branch: notification.branch,
        status: notification.status
      },
      productModel,
      vendor,
      defects: CS_MOCK_DEFECTS.map(item => ({ ...item }))
    }
  }

  const notifications = computed(() => {
    return _notifications.value.map(item => ({ ...item }))
  })

  const activityStats = computed<CsActivityStats>(() => {
    const all = _claims.value
    return {
      totalClaims: all.length,
      approved: all.filter(c => c.claimStatus === 'APPROVED').length,
      pending: all.filter(c => c.claimStatus === 'SUBMITTED' || c.claimStatus === 'IN_REVIEW').length,
      revision: all.filter(c => c.claimStatus === 'NEED_REVISION').length,
      draft: all.filter(c => c.claimStatus === 'DRAFT').length
    }
  })

  const referenceData: CsReferenceData = {
    vendors: CS_MOCK_VENDORS.map(item => ({ ...item })),
    productModels: CS_MOCK_PRODUCT_MODELS.map(item => ({ ...item })),
    defects: CS_MOCK_DEFECTS.map(item => ({ ...item })),
    branches: [...CS_MOCK_BRANCHES],
    photoLabelMap: PHOTO_LABEL_MAP,
    vendorRules: CS_MOCK_VENDORS.reduce((acc, vendor) => {
      acc[vendor.code] = {
        requiredPhotos: [...vendor.requiredPhotos],
        requiredFields: [...vendor.requiredFields]
      }
      return acc
    }, {} as CsReferenceData['vendorRules'])
  }

  function createClaim(payload: CsCreateClaimPayload): CsClaimDetail {
    const claimNumber = generateClaimNumber(_claims.value)
    const now = new Date().toISOString()
    let nextPhotoId = getMaxPhotoId(_claims.value) + 1
    let nextHistoryId = getMaxHistoryId(_claims.value) + 1

    const nextClaim: CsClaimDetail = {
      id: claimNumber,
      claimNumber,
      notificationCode: payload.notificationCode.trim().toUpperCase(),
      modelName: payload.modelName,
      inch: payload.inch,
      vendorName: payload.vendorName,
      branch: payload.branch,
      defectName: payload.defectName,
      claimStatus: payload.submitAs,
      panelPartNumber: payload.panelPartNumber,
      ocSerialNo: payload.ocSerialNo,
      odfNumber: payload.odfNumber ?? null,
      odfVersion: payload.odfVersion ?? null,
      odfWeek: payload.odfWeek ?? null,
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      reviewedBy: null,
      reviewedByName: null,
      revisionNote: null,
      createdAt: now,
      updatedAt: now,
      evidences: payload.photos.map(photo => ({
        id: nextPhotoId++,
        claimId: claimNumber,
        photoType: photo.photoType,
        label: photo.label,
        status: 'PENDING',
        filePath: toObjectUrl(photo.file),
        thumbnailPath: null,
        rejectReason: null,
        createdAt: now,
        updatedAt: now
      })),
      history: [
        {
          id: nextHistoryId++,
          claimId: claimNumber,
          action: 'CREATE',
          fromStatus: '-',
          toStatus: 'DRAFT',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: 'CS',
          note: 'Draft klaim dibuat.',
          createdAt: now
        },
        ...(payload.submitAs === 'SUBMITTED'
          ? [
              {
                id: nextHistoryId++,
                claimId: claimNumber,
                action: 'SUBMIT' as const,
                fromStatus: 'DRAFT' as const,
                toStatus: 'SUBMITTED' as const,
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: 'CS' as const,
                note: 'Klaim diajukan untuk review.',
                createdAt: now
              }
            ]
          : [])
      ]
    }

    _claims.value.unshift(nextClaim)

    const notification = _notifications.value.find(n => n.notificationCode === nextClaim.notificationCode)
    if (notification) {
      notification.status = 'USED'
    }

    return nextClaim
  }

  function submitClaim(claimId: string): boolean {
    const claim = _claims.value.find(item => item.claimNumber === claimId)
    if (!claim || claim.claimStatus !== 'DRAFT') {
      return false
    }

    const now = new Date().toISOString()
    claim.claimStatus = 'SUBMITTED'
    claim.updatedAt = now
    claim.history.push({
      id: getMaxHistoryId(_claims.value) + 1,
      claimId,
      action: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'CS',
      note: 'Klaim diajukan untuk review.',
      createdAt: now
    })

    return true
  }

  function submitRevision(payload: CsRevisionPayload): boolean {
    const claim = _claims.value.find(item => item.claimNumber === payload.claimId)
    if (!claim || claim.claimStatus !== 'NEED_REVISION') {
      return false
    }

    const now = new Date().toISOString()

    for (const [key, value] of Object.entries(payload.revisedFields)) {
      if (Object.hasOwn(claim, key)) {
        ;(claim as Record<string, unknown>)[key] = value
      }
    }

    for (const nextPhoto of payload.replacedPhotos) {
      const existing = claim.evidences.find(photo => photo.photoType === nextPhoto.photoType)
      if (existing) {
        existing.status = 'PENDING'
        existing.rejectReason = null
        existing.filePath = toObjectUrl(nextPhoto.file)
        existing.updatedAt = now
      }
    }

    claim.claimStatus = 'SUBMITTED'
    claim.revisionNote = null
    claim.reviewedBy = CS_MOCK_QRCC_REVIEWER.id
    claim.reviewedByName = CS_MOCK_QRCC_REVIEWER.name
    claim.updatedAt = now
    claim.history.push({
      id: getMaxHistoryId(_claims.value) + 1,
      claimId: payload.claimId,
      action: 'SUBMIT',
      fromStatus: 'NEED_REVISION',
      toStatus: 'SUBMITTED',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'CS',
      note: payload.revisionNote || 'Revisi diajukan ulang.',
      createdAt: now
    })

    return true
  }

  return {
    claims,
    getClaimDetail,
    lookupNotification,
    notifications,
    currentUser,
    activityStats,
    referenceData,
    createClaim,
    submitClaim,
    submitRevision
  }
}
