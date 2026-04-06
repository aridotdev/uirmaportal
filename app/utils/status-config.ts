import type { Component } from 'vue'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  ShieldCheck,
  AlertTriangle,
  History,
  Package
} from 'lucide-vue-next'
import type { ClaimStatus, ClaimPhotoStatus, VendorClaimStatus, NotificationStatus } from '~~/shared/utils/constants'

// ──────────────────────────────────────────────
// Claim Status Config
// ──────────────────────────────────────────────

export interface StatusConfig {
  label: string
  color: string
  icon: Component
}

export const CLAIM_STATUS_CONFIG: Record<ClaimStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    icon: FileText
  },
  SUBMITTED: {
    label: 'Submitted',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Clock
  },
  IN_REVIEW: {
    label: 'In Review',
    color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: Search
  },
  NEED_REVISION: {
    label: 'Need Revision',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: AlertCircle
  },
  APPROVED: {
    label: 'Approved',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2
  },
  ARCHIVED: {
    label: 'Archived',
    color: 'bg-white/10 text-white/40 border-white/20',
    icon: Clock
  }
}

// ──────────────────────────────────────────────
// Claim Photo Status Config
// ──────────────────────────────────────────────

export const PHOTO_STATUS_CONFIG: Record<ClaimPhotoStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock
  },
  VERIFIED: {
    label: 'Verified',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2
  },
  REJECT: {
    label: 'REJECT',
    color: 'bg-red-500/10 text-red-400 border-red-500/20',
    icon: AlertCircle
  }
}

// ──────────────────────────────────────────────
// Vendor Claim Status Config
// ──────────────────────────────────────────────

export const VENDOR_CLAIM_STATUS_CONFIG: Record<VendorClaimStatus, StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    icon: FileText
  },
  CREATED: {
    label: 'Created',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    icon: Package
  },
  PROCESSING: {
    label: 'Processing',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2
  }
}

// ──────────────────────────────────────────────
// Notification Status Config
// ──────────────────────────────────────────────

export const NOTIFICATION_STATUS_CONFIG: Record<NotificationStatus, StatusConfig> = {
  NEW: {
    label: 'New',
    color: 'bg-[#B6F500]/20 text-[#B6F500] border-[#B6F500]/30',
    icon: CheckCircle2
  },
  USED: {
    label: 'Used',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Clock
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertCircle
  }
}

// ──────────────────────────────────────────────
// Dashboard Detail Status Config (with border glow)
// ──────────────────────────────────────────────

export const CLAIM_STATUS_DETAIL_CONFIG: Record<ClaimStatus, { label: string, class: string, icon: Component }> = {
  DRAFT: { label: 'Draft', class: 'bg-white/10 text-white/60 border-white/10', icon: FileText },
  SUBMITTED: { label: 'Submitted', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  IN_REVIEW: { label: 'In Review', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: ShieldCheck },
  NEED_REVISION: { label: 'Need Revision', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
  APPROVED: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', class: 'bg-white/10 text-white/40 border-white/10', icon: History }
}

// ──────────────────────────────────────────────
// Filter Pill Active Styles (per claim status)
// ──────────────────────────────────────────────

export const CLAIM_STATUS_FILTER_ACTIVE: Record<ClaimStatus, string> = {
  DRAFT: 'border-zinc-400 bg-zinc-400 text-black shadow-[0_10px_28px_rgba(161,161,170,0.28)]',
  SUBMITTED: 'border-blue-400 bg-blue-400 text-black shadow-[0_10px_28px_rgba(96,165,250,0.28)]',
  IN_REVIEW: 'border-indigo-400 bg-indigo-400 text-black shadow-[0_10px_28px_rgba(129,140,248,0.28)]',
  NEED_REVISION: 'border-amber-400 bg-amber-400 text-black shadow-[0_10px_28px_rgba(251,191,36,0.28)]',
  APPROVED: 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]',
  ARCHIVED: 'border-white/40 bg-white/40 text-black shadow-[0_10px_28px_rgba(255,255,255,0.16)]'
}

export const VENDOR_CLAIM_STATUS_FILTER_ACTIVE: Record<VendorClaimStatus, string> = {
  DRAFT: 'border-zinc-400 bg-zinc-400 text-black shadow-[0_10px_28px_rgba(161,161,170,0.28)]',
  CREATED: 'border-blue-400 bg-blue-400 text-black shadow-[0_10px_28px_rgba(96,165,250,0.28)]',
  PROCESSING: 'border-amber-400 bg-amber-400 text-black shadow-[0_10px_28px_rgba(251,191,36,0.28)]',
  COMPLETED: 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
}

export const ACCENT_FILTER_ACTIVE = 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]'
export const ACCENT_FILTER_IDLE = 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

export function getClaimStatusConfig(status: ClaimStatus): StatusConfig {
  return CLAIM_STATUS_CONFIG[status] ?? CLAIM_STATUS_CONFIG.SUBMITTED
}

export function getPhotoStatusConfig(status: ClaimPhotoStatus): StatusConfig {
  return PHOTO_STATUS_CONFIG[status] ?? PHOTO_STATUS_CONFIG.PENDING
}

export function getVendorClaimStatusConfig(status: VendorClaimStatus): StatusConfig {
  return VENDOR_CLAIM_STATUS_CONFIG[status] ?? VENDOR_CLAIM_STATUS_CONFIG.CREATED
}

export function getNotificationStatusConfig(status: NotificationStatus): StatusConfig {
  return NOTIFICATION_STATUS_CONFIG[status] ?? NOTIFICATION_STATUS_CONFIG.NEW
}

/**
 * Get filter pill classes for a status-based filter.
 * Pass the status type and current active value to get active/idle classes.
 */
export function getClaimStatusFilterClasses(status: ClaimStatus | 'ALL', activeStatus: ClaimStatus | 'ALL') {
  const isActive = status === activeStatus

  if (status === 'ALL') {
    return isActive ? ACCENT_FILTER_ACTIVE : ACCENT_FILTER_IDLE
  }

  if (isActive) {
    return CLAIM_STATUS_FILTER_ACTIVE[status as ClaimStatus]
  }

  const config = getClaimStatusConfig(status as ClaimStatus)
  return `${config.color} opacity-45 hover:opacity-80 border-transparent`
}

export function getVendorClaimFilterClasses(status: VendorClaimStatus | 'ALL', activeStatus: VendorClaimStatus | 'ALL') {
  const isActive = status === activeStatus

  if (status === 'ALL') {
    return isActive ? ACCENT_FILTER_ACTIVE : ACCENT_FILTER_IDLE
  }

  if (isActive) {
    return VENDOR_CLAIM_STATUS_FILTER_ACTIVE[status as VendorClaimStatus]
  }

  const config = getVendorClaimStatusConfig(status as VendorClaimStatus)
  return `${config.color} opacity-50 hover:opacity-80 border-transparent`
}

/**
 * Format a status enum value into a display label.
 * e.g. 'NEED_REVISION' -> 'Need Revision'
 */
export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace(/\bRma\b/gi, 'RMA')
}
