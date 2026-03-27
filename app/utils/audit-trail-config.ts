// app/utils/audit-trail-config.ts
// ──────────────────────────────────────────────
// Audit Trail UI Configuration & Helpers
// ──────────────────────────────────────────────
// Reusable across global audit trail page and claim detail timeline.
// Source of truth: doc/audit-trail-flow.md, shared/utils/constants.ts
//
// Visual mapping follows domain semantics, NOT generic log colors.

import type { Component } from 'vue'
import {
  FileText,
  Upload,
  Send,
  Search,
  Camera,
  ShieldCheck,
  AlertTriangle,
  Archive,
  Edit3,
  Gavel,
  Package
} from 'lucide-vue-next'
import type { ClaimHistoryAction, ClaimStatus, UserRole } from '~~/shared/utils/constants'
import { CLAIM_HISTORY_ACTIONS, USER_ROLES } from '~~/shared/utils/constants'

// ──────────────────────────────────────────────
// Action Visual Config
// ──────────────────────────────────────────────

export interface ActionConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: Component
}

export const ACTION_CONFIG: Record<ClaimHistoryAction, ActionConfig> = {
  CREATE: {
    label: 'Create',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: FileText
  },
  SUBMIT: {
    label: 'Submit',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: Send
  },
  REVIEW: {
    label: 'Review',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    icon: Search
  },
  APPROVE: {
    label: 'Approve',
    color: 'text-[#B6F500]',
    bgColor: 'bg-[#B6F500]/10',
    borderColor: 'border-[#B6F500]/20',
    icon: ShieldCheck
  },
  REJECT: {
    label: 'Reject',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: AlertTriangle
  },
  REQUEST_REVISION: {
    label: 'Request Revision',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: AlertTriangle
  },
  ARCHIVE: {
    label: 'Archive',
    color: 'text-white/40',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
    icon: Archive
  },
  UPDATE: {
    label: 'Update',
    color: 'text-white/60',
    bgColor: 'bg-white/5',
    borderColor: 'border-white/10',
    icon: Edit3
  },
  UPLOAD_PHOTO: {
    label: 'Upload Photo',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    icon: Upload
  },
  REVIEW_PHOTO: {
    label: 'Review Photo',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    icon: Camera
  },
  GENERATE_VENDOR_CLAIM: {
    label: 'Vendor Batch',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    icon: Package
  },
  UPDATE_VENDOR_DECISION: {
    label: 'Vendor Decision',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: Gavel
  }
}

export function getActionConfig(action: ClaimHistoryAction): ActionConfig {
  return ACTION_CONFIG[action] ?? ACTION_CONFIG.UPDATE
}

export function getActionLabel(action: ClaimHistoryAction): string {
  return ACTION_CONFIG[action]?.label ?? action.replace(/_/g, ' ')
}

// ──────────────────────────────────────────────
// Role Badge Config
// ──────────────────────────────────────────────

export interface RoleBadgeConfig {
  label: string
  classes: string // Combined bg + text + border classes
}

export const ROLE_BADGE_CONFIG: Record<UserRole, RoleBadgeConfig> = {
  ADMIN: {
    label: 'Admin',
    classes: 'bg-red-500/10 text-red-400 border-red-500/20'
  },
  MANAGEMENT: {
    label: 'Management',
    classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
  },
  QRCC: {
    label: 'QRCC',
    classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
  },
  CS: {
    label: 'CS',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
}

export function getRoleBadgeConfig(role: UserRole): RoleBadgeConfig {
  return ROLE_BADGE_CONFIG[role] ?? { label: role, classes: 'bg-white/5 text-white/40 border-white/10' }
}

// ──────────────────────────────────────────────
// Status Badge Config (reuses status-config.ts for consistency)
// ──────────────────────────────────────────────

export interface StatusBadgeConfig {
  label: string
  classes: string
}

export const STATUS_BADGE_CONFIG: Record<ClaimStatus, StatusBadgeConfig> = {
  DRAFT: { label: 'Draft', classes: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  SUBMITTED: { label: 'Submitted', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  IN_REVIEW: { label: 'In Review', classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  NEED_REVISION: { label: 'Revision', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  APPROVED: { label: 'Approved', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ARCHIVED: { label: 'Archived', classes: 'bg-white/5 text-white/40 border-white/10' }
}

export function getStatusBadgeConfig(status: ClaimStatus): StatusBadgeConfig {
  return STATUS_BADGE_CONFIG[status] ?? { label: status, classes: 'bg-white/5 text-white/40 border-white/10' }
}

// ──────────────────────────────────────────────
// Event Classification Helpers
// ──────────────────────────────────────────────

/** Returns true if fromStatus !== toStatus (actual state transition) */
export function isStatusChangeEvent(fromStatus: ClaimStatus, toStatus: ClaimStatus): boolean {
  return fromStatus !== toStatus
}

/** Actions that typically change claim status */
export const STATUS_CHANGING_ACTIONS: ClaimHistoryAction[] = [
  'SUBMIT', 'REVIEW', 'APPROVE', 'REQUEST_REVISION', 'ARCHIVE'
]

/** Actions related to photo operations */
export const PHOTO_ACTIONS: ClaimHistoryAction[] = [
  'UPLOAD_PHOTO', 'REVIEW_PHOTO'
]

/** Actions related to vendor operations */
export const VENDOR_ACTIONS: ClaimHistoryAction[] = [
  'GENERATE_VENDOR_CLAIM', 'UPDATE_VENDOR_DECISION'
]

// ──────────────────────────────────────────────
// Filter Options
// ──────────────────────────────────────────────

export interface FilterOption<T = string> {
  label: string
  value: T
}

export const ACTION_FILTER_OPTIONS: FilterOption<ClaimHistoryAction | 'ALL'>[] = [
  { label: 'All Actions', value: 'ALL' },
  ...CLAIM_HISTORY_ACTIONS.map(action => ({
    label: getActionLabel(action),
    value: action
  }))
]

export const ROLE_FILTER_OPTIONS: FilterOption<UserRole | 'ALL'>[] = [
  { label: 'All Roles', value: 'ALL' },
  ...USER_ROLES.map(role => ({
    label: ROLE_BADGE_CONFIG[role]?.label ?? role,
    value: role
  }))
]

// ──────────────────────────────────────────────
// Table Column Definitions (semantic, not UI-bound)
// ──────────────────────────────────────────────
// These define what the global audit trail table should display.
// UI binding (UTable column defs, h() renderers) will be done in the page component.

export const AUDIT_TRAIL_COLUMNS = [
  { key: 'createdAt', label: 'Timestamp', sortable: true },
  { key: 'claimReference', label: 'Claim', sortable: false },
  { key: 'action', label: 'Action', sortable: true },
  { key: 'statusTransition', label: 'Status', sortable: false },
  { key: 'actor', label: 'Actor', sortable: false },
  { key: 'userRole', label: 'Role', sortable: false },
  { key: 'note', label: 'Note', sortable: false }
] as const

// ──────────────────────────────────────────────
// Format Helpers
// ──────────────────────────────────────────────

/** Format ISO date string to localized timestamp for audit trail */
export function formatAuditTimestamp(dateStr: string, locale = 'id-ID'): string {
  return new Date(dateStr).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** Format status transition for display: "DRAFT -> SUBMITTED" or "IN_REVIEW" (when same) */
export function formatStatusTransition(fromStatus: ClaimStatus, toStatus: ClaimStatus): string {
  if (fromStatus === toStatus) return fromStatus.replace(/_/g, ' ')
  return `${fromStatus.replace(/_/g, ' ')} → ${toStatus.replace(/_/g, ' ')}`
}

/** Generate initials from a full name */
export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
