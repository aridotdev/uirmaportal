import type { ClaimStatus } from '~~/shared/utils/constants'

/**
 * QRCC claim review state machine and helpers.
 *
 * Rules:
 * - SUBMITTED claims auto-transition to IN_REVIEW when opened by QRCC
 * - Only IN_REVIEW is editable by QRCC
 * - NEED_REVISION, APPROVED, ARCHIVED are read-only for QRCC
 * - Final status is determined by photo review outcomes, not manual buttons
 */

/** Statuses that QRCC can still interact with (edit fields, review photos) */
const REVIEWABLE_STATUSES: ClaimStatus[] = ['IN_REVIEW']

/** Statuses that are completely read-only for QRCC */
const READONLY_STATUSES: ClaimStatus[] = ['NEED_REVISION', 'APPROVED', 'ARCHIVED', 'DRAFT']

/** Fields that are always read-only on the Claim Info tab */
export const READONLY_FIELDS = [
  'notificationCode',
  'notificationDate',
  'modelName',
  'inch',
  'vendorId',
  'branch'
] as const

/** Fields editable by QRCC during IN_REVIEW */
export const EDITABLE_FIELDS = [
  'panelPartNumber',
  'ocSerialNo',
  'defect',
  'odfNumber',
  'version',
  'week'
] as const

export type EditableField = (typeof EDITABLE_FIELDS)[number]

export function useClaimReview() {
  /**
   * Check if the claim status allows QRCC to perform review actions.
   */
  function isReviewable(status: ClaimStatus): boolean {
    return REVIEWABLE_STATUSES.includes(status)
  }

  /**
   * Check if the claim is read-only for QRCC.
   */
  function isReadOnly(status: ClaimStatus): boolean {
    return READONLY_STATUSES.includes(status)
  }

  /**
   * Check if a SUBMITTED claim should auto-transition to IN_REVIEW.
   */
  function shouldAutoStartReview(status: ClaimStatus): boolean {
    return status === 'SUBMITTED'
  }

  /**
   * Determine the final claim status based on photo review outcomes.
   * - Any REJECT -> NEED_REVISION
   * - All VERIFIED -> APPROVED
   */
  function determineFinalStatus(photoStatuses: Array<'PENDING' | 'VERIFIED' | 'REJECT'>): ClaimStatus {
    const hasReject = photoStatuses.some(s => s === 'REJECT')
    if (hasReject) return 'NEED_REVISION'
    return 'APPROVED'
  }

  /**
   * Check if review can be finalized:
   * - No PENDING photos remaining
   * - All REJECT photos have notes
   */
  function canFinalizeReview(
    photos: Array<{ status: 'PENDING' | 'VERIFIED' | 'REJECT', note: string }>
  ): { ready: boolean, reason?: string } {
    const hasPending = photos.some(p => p.status === 'PENDING')
    if (hasPending) {
      return { ready: false, reason: 'Masih ada foto yang belum direview.' }
    }

    const rejectWithoutNote = photos.some(p => p.status === 'REJECT' && !p.note.trim())
    if (rejectWithoutNote) {
      return { ready: false, reason: 'Semua foto REJECT harus memiliki catatan.' }
    }

    return { ready: true }
  }

  /**
   * Check if a field is editable given the current claim status.
   */
  function isFieldEditable(fieldName: string, status: ClaimStatus): boolean {
    if (!isReviewable(status)) return false
    return (EDITABLE_FIELDS as readonly string[]).includes(fieldName)
  }

  return {
    isReviewable,
    isReadOnly,
    shouldAutoStartReview,
    determineFinalStatus,
    canFinalizeReview,
    isFieldEditable,
    READONLY_FIELDS,
    EDITABLE_FIELDS
  }
}
