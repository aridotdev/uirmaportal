import type { ClaimPhotoStatus, ClaimHistoryAction, ClaimStatus, PhotoType } from '~~/shared/utils/constants'

// ============================================================
// SEED: Pre-populate histories for claims that already have statuses beyond SUBMITTED
// ============================================================

import { claims } from './claim-data'

// ============================================================
// CLAIM PHOTOS MOCK DATA
// ============================================================

export interface ClaimPhotoRecord {
  id: number
  claimId: number
  photoType: PhotoType
  label: string
  filePath: string
  thumbnailPath: string | null
  status: ClaimPhotoStatus
  rejectReason: string | null
  createdAt: string
  updatedAt: string
}

const photoTemplates: Array<{ photoType: PhotoType, label: string, imageUrl: string }> = [
  {
    photoType: 'CLAIM',
    label: 'Main Claim Photo',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1200'
  },
  {
    photoType: 'CLAIM_ZOOM',
    label: 'Defect Zoom',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'
  },
  {
    photoType: 'PANEL_SN',
    label: 'Panel Part Number',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200'
  },
  {
    photoType: 'ODF',
    label: 'ODF Document',
    imageUrl: 'https://images.unsplash.com/photo-1618044733300-9472154093ee?auto=format&fit=crop&q=80&w=1200'
  }
]

let photoIdCounter = 1

function generatePhotosForClaim(claimId: number, createdAt: string): ClaimPhotoRecord[] {
  return photoTemplates.map(tpl => ({
    id: photoIdCounter++,
    claimId,
    photoType: tpl.photoType,
    label: tpl.label,
    filePath: tpl.imageUrl,
    thumbnailPath: null,
    status: 'PENDING' as ClaimPhotoStatus,
    rejectReason: null,
    createdAt,
    updatedAt: createdAt
  }))
}

// Generate photos for all 25 claims
export const claimPhotos: ClaimPhotoRecord[] = []

for (let claimId = 1; claimId <= 25; claimId++) {
  const baseDate = new Date('2026-03-19T03:03:12.344Z')
  baseDate.setDate(baseDate.getDate() - (claimId - 1))
  claimPhotos.push(...generatePhotosForClaim(claimId, baseDate.toISOString()))
}

export function getPhotosByClaimId(claimId: number): ClaimPhotoRecord[] {
  return claimPhotos.filter(p => p.claimId === claimId)
}

export function getPhotoById(photoId: number): ClaimPhotoRecord | undefined {
  return claimPhotos.find(p => p.id === photoId)
}

export function updatePhotoStatus(photoId: number, status: ClaimPhotoStatus, rejectReason?: string | null): ClaimPhotoRecord | undefined {
  const photo = claimPhotos.find(p => p.id === photoId)
  if (!photo) return undefined
  photo.status = status
  photo.rejectReason = rejectReason ?? null
  photo.updatedAt = new Date().toISOString()
  return photo
}

// ============================================================
// CLAIM HISTORY MOCK DATA
// ============================================================

export interface ClaimHistoryRecord {
  id: number
  claimId: number
  action: ClaimHistoryAction
  fromStatus: ClaimStatus
  toStatus: ClaimStatus
  userId: string
  userName: string
  userRole: string
  note: string | null
  createdAt: string
}

let historyIdCounter = 1

export const claimHistories: ClaimHistoryRecord[] = []

/**
 * Add a history record for a claim.
 */
export function addClaimHistory(params: {
  claimId: number
  action: ClaimHistoryAction
  fromStatus: ClaimStatus
  toStatus: ClaimStatus
  userId?: string
  userName?: string
  userRole?: string
  note?: string | null
}): ClaimHistoryRecord {
  const record: ClaimHistoryRecord = {
    id: historyIdCounter++,
    claimId: params.claimId,
    action: params.action,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
    userId: params.userId ?? 'user-qrcc-001',
    userName: params.userName ?? 'Nadia Putri',
    userRole: params.userRole ?? 'QRCC',
    note: params.note ?? null,
    createdAt: new Date().toISOString()
  }
  claimHistories.push(record)
  return record
}

export function getHistoryByClaimId(claimId: number): ClaimHistoryRecord[] {
  return claimHistories
    .filter(h => h.claimId === claimId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// ============================================================
// PHOTO REVIEW MOCK DATA
// ============================================================

export interface PhotoReviewRecord {
  id: number
  claimPhotoId: number
  reviewedBy: string
  reviewerName: string
  status: ClaimPhotoStatus
  rejectReason: string | null
  reviewedAt: string
}

let reviewIdCounter = 1

export const photoReviews: PhotoReviewRecord[] = []

export function addPhotoReview(params: {
  claimPhotoId: number
  status: ClaimPhotoStatus
  rejectReason?: string | null
  reviewedBy?: string
  reviewerName?: string
}): PhotoReviewRecord {
  const record: PhotoReviewRecord = {
    id: reviewIdCounter++,
    claimPhotoId: params.claimPhotoId,
    reviewedBy: params.reviewedBy ?? 'user-qrcc-001',
    reviewerName: params.reviewerName ?? 'Nadia Putri',
    status: params.status,
    rejectReason: params.rejectReason ?? null,
    reviewedAt: new Date().toISOString()
  }
  photoReviews.push(record)
  return record
}

export function getReviewsByClaimId(claimId: number): PhotoReviewRecord[] {
  const claimPhotoIds = getPhotosByClaimId(claimId).map(p => p.id)
  return photoReviews.filter(r => claimPhotoIds.includes(r.claimPhotoId))
}

function seedHistories() {
  // For claims with statuses beyond DRAFT/SUBMITTED, create plausible history
  for (const claim of claims) {
    const baseDate = new Date(claim.createdAt)

    if (claim.claimStatus === 'DRAFT') {
      // No history needed for drafts
      continue
    }

    // All non-DRAFT claims have a SUBMIT event
    addClaimHistory({
      claimId: claim.id,
      action: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      userId: claim.submittedBy,
      userName: 'CS Staff',
      userRole: 'CS',
      note: `Claim ${claim.claimNumber} diajukan untuk defect ${claim.defectName}.`
    })
    // Overwrite the auto-generated timestamp
    const submitRecord = claimHistories[claimHistories.length - 1]!
    submitRecord.createdAt = new Date(baseDate.getTime() + 1000).toISOString()

    if (claim.claimStatus === 'SUBMITTED') continue

    // IN_REVIEW, NEED_REVISION, APPROVED, ARCHIVED all went through START_REVIEW
    addClaimHistory({
      claimId: claim.id,
      action: 'REVIEW',
      fromStatus: 'SUBMITTED',
      toStatus: 'IN_REVIEW',
      note: 'QRCC memulai review claim.'
    })
    const reviewStartRecord = claimHistories[claimHistories.length - 1]!
    reviewStartRecord.createdAt = new Date(baseDate.getTime() + 60000).toISOString()

    if (claim.claimStatus === 'IN_REVIEW') continue

    if (claim.claimStatus === 'NEED_REVISION') {
      addClaimHistory({
        claimId: claim.id,
        action: 'REJECT',
        fromStatus: 'IN_REVIEW',
        toStatus: 'NEED_REVISION',
        note: 'Terdapat foto yang ditolak. Claim memerlukan revisi dari CS.'
      })
      const rejectRecord = claimHistories[claimHistories.length - 1]!
      rejectRecord.createdAt = new Date(baseDate.getTime() + 120000).toISOString()
    }

    if (claim.claimStatus === 'APPROVED') {
      addClaimHistory({
        claimId: claim.id,
        action: 'APPROVE',
        fromStatus: 'IN_REVIEW',
        toStatus: 'APPROVED',
        note: 'Semua foto diverifikasi. Claim disetujui.'
      })
      const approveRecord = claimHistories[claimHistories.length - 1]!
      approveRecord.createdAt = new Date(baseDate.getTime() + 120000).toISOString()
    }

    if (claim.claimStatus === 'ARCHIVED') {
      addClaimHistory({
        claimId: claim.id,
        action: 'APPROVE',
        fromStatus: 'IN_REVIEW',
        toStatus: 'APPROVED',
        note: 'Semua foto diverifikasi. Claim disetujui.'
      })
      const approveRecord = claimHistories[claimHistories.length - 1]!
      approveRecord.createdAt = new Date(baseDate.getTime() + 120000).toISOString()

      addClaimHistory({
        claimId: claim.id,
        action: 'ARCHIVE',
        fromStatus: 'APPROVED',
        toStatus: 'ARCHIVED',
        note: 'Claim diarsipkan.'
      })
      const archiveRecord = claimHistories[claimHistories.length - 1]!
      archiveRecord.createdAt = new Date(baseDate.getTime() + 240000).toISOString()
    }
  }
}

seedHistories()
