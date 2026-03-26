import type { ClaimStatus, ClaimPhotoStatus, VendorClaimStatus } from '~~/shared/utils/constants'

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
// Audit Logs
// ──────────────────────────────────────────────

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
