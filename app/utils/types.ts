import type { ClaimStatus, ClaimPhotoStatus, VendorClaimStatus, ClaimHistoryAction, UserRole } from '~~/shared/utils/constants'

// ──────────────────────────────────────────────
// Claim Types (frontend view models)
// ──────────────────────────────────────────────

export interface ClaimListItem {
  id: string
  claimNumber: string
  notificationId: number
  modelName: string
  vendorName: string
  branch: string
  defectName: string
  inch: number
  claimStatus: ClaimStatus
  panelSerialNo: string
  ocSerialNo: string
  submittedBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

export interface ClaimDetail extends ClaimListItem {
  odfNumber: string | null
  version: string | null
  week: string | null
  revisionNote?: string
  evidences: ClaimPhoto[]
  history: ClaimHistoryItem[]
}

// ──────────────────────────────────────────────
// Claim Photos
// ──────────────────────────────────────────────

export interface ClaimPhoto {
  id: number
  claimId: number
  photoType: string
  label: string
  status: ClaimPhotoStatus
  filePath: string
  rejectReason: string | null
  note: string
}

// ──────────────────────────────────────────────
// Claim History
// ──────────────────────────────────────────────

export interface ClaimHistoryItem {
  id: number
  claimId: number
  action: string
  fromStatus: string
  toStatus: string
  userId: string
  userName: string
  userRole: string
  note: string | null
  createdAt: string
}

// ──────────────────────────────────────────────
// Vendor Claims
// ──────────────────────────────────────────────

export interface VendorClaimBatch {
  id: string
  batchNumber: string
  vendor: string
  submittedDate: string
  status: VendorClaimStatus
  createdAt: string
  totalItems: number
  vendorDecision?: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

// ──────────────────────────────────────────────
// Reports Summary
// ──────────────────────────────────────────────

export interface ReportSummary {
  totalClaims: number
  approvedClaims: number
  rejectedClaims: number
  pendingClaims: number
  approvalRate: number
  averageProcessingDays: number
  claimsByVendor: Array<{ vendor: string, count: number }>
  claimsByBranch: Array<{ branch: string, count: number }>
  monthlyTrend: Array<{ month: string, notificationQty: number, claimQty: number, ratio: number }>
}

// ──────────────────────────────────────────────
// Audit Trail – Raw History Record
// ──────────────────────────────────────────────
// Mirrors server/database/schema/claim-history.ts.
// This is the backend write contract — do NOT add display-only fields here.

export interface AuditTrailRecord {
  id: number
  claimId: number
  action: ClaimHistoryAction
  fromStatus: ClaimStatus
  toStatus: ClaimStatus
  userId: string
  userRole: UserRole
  note: string | null
  createdAt: string // ISO-8601 from API; backend stores as timestamp_ms
}

// ──────────────────────────────────────────────
// Audit Trail – Enriched Display Row
// ──────────────────────────────────────────────
// Used by the global audit trail table and claim detail timeline.
// Fields beyond AuditTrailRecord are read-model enrichments (joined at query time).

export interface AuditTrailTableRow extends AuditTrailRecord {
  /** Claim number for display, e.g. "CLM-2026-0342". Enrichment from claim table. */
  claimNumber: string
  /** Actor display name. Enrichment from user table. */
  actorName: string
  /** Initials derived from actorName for avatar placeholder. */
  actorInitials: string
}

// ──────────────────────────────────────────────
// Audit Trail – API Response Contracts (draft)
// ──────────────────────────────────────────────
// These types represent the expected backend response shape.
// Frontend mock data should follow these contracts exactly.

export interface AuditTrailListResponse {
  items: AuditTrailTableRow[]
  meta: {
    page: number
    pageSize: number
    total: number
    sortBy: 'createdAt'
    sortOrder: 'asc' | 'desc'
  }
}

export interface AuditTrailQuery {
  page?: number
  pageSize?: number
  search?: string
  action?: ClaimHistoryAction
  userRole?: UserRole
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// ──────────────────────────────────────────────
// Audit Logs (DEPRECATED – kept for backward compat during migration)
// ──────────────────────────────────────────────
// TODO: Remove once audit-trail.vue is fully migrated to AuditTrailTableRow.

/** @deprecated Use AuditTrailTableRow instead */
export interface AuditLogEntry {
  id: number
  action: string
  entityType: string
  entityId: string
  userId: string
  userName: string
  userRole: string
  details: string
  ipAddress: string
  createdAt: string
}

// ──────────────────────────────────────────────
// Users
// ──────────────────────────────────────────────

export interface UserListItem {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGEMENT' | 'QRCC' | 'CS'
  branch: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

// ──────────────────────────────────────────────
// User Profile / Settings
// ──────────────────────────────────────────────

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGEMENT' | 'QRCC' | 'CS'
  branch: string
  avatarUrl: string
  phone: string
  joinedAt: string
}

// ──────────────────────────────────────────────
// KPI / Stats Card Data
// ──────────────────────────────────────────────

export interface StatsCardData {
  label: string
  value: string | number
  trend?: string
  color?: string
  icon?: string
}
