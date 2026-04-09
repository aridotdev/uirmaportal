import type { ClaimStatus, VendorClaimStatus } from '#server/database/schema'

export const CLAIM_STATUS_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  DRAFT: ['SUBMITTED', 'ARCHIVED'],
  SUBMITTED: ['IN_REVIEW', 'ARCHIVED'],
  IN_REVIEW: ['APPROVED', 'NEED_REVISION'],
  NEED_REVISION: ['SUBMITTED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: []
}

export const VENDOR_CLAIM_STATUS_TRANSITIONS: Record<VendorClaimStatus, VendorClaimStatus[]> = {
  DRAFT: ['CREATED'],
  CREATED: ['PROCESSING', 'COMPLETED'],
  PROCESSING: ['COMPLETED'],
  COMPLETED: []
}

export function canTransitionClaimStatus(from: ClaimStatus, to: ClaimStatus): boolean {
  return CLAIM_STATUS_TRANSITIONS[from].includes(to)
}

export function canTransitionVendorClaimStatus(from: VendorClaimStatus, to: VendorClaimStatus): boolean {
  return VENDOR_CLAIM_STATUS_TRANSITIONS[from].includes(to)
}
