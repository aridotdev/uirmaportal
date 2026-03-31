import type { NotificationStatus, FiscalHalf } from '~~/shared/utils/constants'
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'

export interface NotificationRecord {
  id: number
  notificationCode: string
  notificationDate: number
  modelId: number
  branch: string
  vendorId: number
  status: NotificationStatus
  // Fiscal period fields (based on notificationDate)
  fiscalYear: number
  fiscalHalf: FiscalHalf
  fiscalLabel: string
  calendarYear: number
  calendarMonth: number
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

export interface ProductModelRecord {
  id: number
  name: string
  inch: number
  vendorId: number
}

export interface VendorRecord {
  id: number
  code: string
  name: string
  requiredPhotos: string[]
  requiredFields: string[]
}

export interface DefectRecord {
  id: number
  code: string
  name: string
}

/**
 * Helper to build a NotificationRecord with auto-computed fiscal fields.
 * notificationDate is the basis for fiscal period calculation.
 */
function makeNotification(
  id: number,
  data: Omit<NotificationRecord, 'id' | 'fiscalYear' | 'fiscalHalf' | 'fiscalLabel' | 'calendarYear' | 'calendarMonth'>
): NotificationRecord {
  const fp = getFiscalPeriodInfo(data.notificationDate)
  return {
    id,
    ...data,
    fiscalYear: fp.fiscalYear,
    fiscalHalf: fp.fiscalHalf,
    fiscalLabel: fp.fiscalLabel,
    calendarYear: fp.calendarYear,
    calendarMonth: fp.calendarMonth
  }
}

// ────────────────────────────────────────────────────────────────
// Timestamps: spread across fiscal boundaries
//   2025FH: Apr 2025 – Sep 2025
//   2025LH: Oct 2025 – Mar 2026
//   2024LH: Oct 2024 – Mar 2025
// ────────────────────────────────────────────────────────────────

const ts = (iso: string) => new Date(iso).getTime()
const NOW_TS = ts('2026-03-20T00:00:00Z')

export const notifications: NotificationRecord[] = [
  // ── 2025LH (Oct 2025 – Mar 2026) ──
  makeNotification(1, { notificationCode: 'NTF-2026001', notificationDate: ts('2026-03-31T10:00:00Z'), modelId: 1, branch: 'JAKARTA', vendorId: 1, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(2, { notificationCode: 'NTF-2026002', notificationDate: ts('2026-03-15T08:00:00Z'), modelId: 2, branch: 'SURABAYA', vendorId: 2, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(3, { notificationCode: 'NTF-2026003', notificationDate: ts('2026-02-20T09:00:00Z'), modelId: 3, branch: 'MEDAN', vendorId: 3, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(4, { notificationCode: 'NTF-2026004', notificationDate: ts('2026-01-10T11:00:00Z'), modelId: 4, branch: 'BANDUNG', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(5, { notificationCode: 'NTF-2025005', notificationDate: ts('2025-12-18T14:00:00Z'), modelId: 5, branch: 'MAKASSAR', vendorId: 2, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(6, { notificationCode: 'NTF-2025006', notificationDate: ts('2025-11-25T07:00:00Z'), modelId: 1, branch: 'JAKARTA', vendorId: 3, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(7, { notificationCode: 'NTF-2025007', notificationDate: ts('2025-10-01T00:00:00Z'), modelId: 2, branch: 'SURABAYA', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(8, { notificationCode: 'NTF-2025008', notificationDate: ts('2025-10-15T09:00:00Z'), modelId: 3, branch: 'MEDAN', vendorId: 2, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),

  // ── 2025FH (Apr 2025 – Sep 2025) ──
  makeNotification(9, { notificationCode: 'NTF-2025009', notificationDate: ts('2025-09-30T23:00:00Z'), modelId: 4, branch: 'BANDUNG', vendorId: 3, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(10, { notificationCode: 'NTF-2025010', notificationDate: ts('2025-09-15T08:00:00Z'), modelId: 5, branch: 'MAKASSAR', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(11, { notificationCode: 'NTF-2025011', notificationDate: ts('2025-08-20T10:00:00Z'), modelId: 1, branch: 'JAKARTA', vendorId: 2, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(12, { notificationCode: 'NTF-2025012', notificationDate: ts('2025-07-10T12:00:00Z'), modelId: 2, branch: 'SURABAYA', vendorId: 3, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(13, { notificationCode: 'NTF-2025013', notificationDate: ts('2025-06-15T09:00:00Z'), modelId: 3, branch: 'MEDAN', vendorId: 1, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(14, { notificationCode: 'NTF-2025014', notificationDate: ts('2025-05-20T14:00:00Z'), modelId: 4, branch: 'BANDUNG', vendorId: 2, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(15, { notificationCode: 'NTF-2025015', notificationDate: ts('2025-04-01T00:00:00Z'), modelId: 5, branch: 'MAKASSAR', vendorId: 3, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(16, { notificationCode: 'NTF-2025016', notificationDate: ts('2025-04-15T08:00:00Z'), modelId: 1, branch: 'JAKARTA', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),

  // ── 2024LH (Oct 2024 – Mar 2025) ──
  makeNotification(17, { notificationCode: 'NTF-2025017', notificationDate: ts('2025-03-31T22:00:00Z'), modelId: 2, branch: 'SURABAYA', vendorId: 2, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(18, { notificationCode: 'NTF-2025018', notificationDate: ts('2025-02-15T10:00:00Z'), modelId: 3, branch: 'MEDAN', vendorId: 3, status: 'NEW', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(19, { notificationCode: 'NTF-2025019', notificationDate: ts('2025-01-10T11:00:00Z'), modelId: 4, branch: 'BANDUNG', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(20, { notificationCode: 'NTF-2024020', notificationDate: ts('2024-12-20T09:00:00Z'), modelId: 5, branch: 'MAKASSAR', vendorId: 2, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(21, { notificationCode: 'NTF-2024021', notificationDate: ts('2024-11-15T14:00:00Z'), modelId: 1, branch: 'JAKARTA', vendorId: 3, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(22, { notificationCode: 'NTF-2024022', notificationDate: ts('2024-10-01T00:00:00Z'), modelId: 2, branch: 'SURABAYA', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(23, { notificationCode: 'NTF-2024023', notificationDate: ts('2024-10-20T08:00:00Z'), modelId: 3, branch: 'MEDAN', vendorId: 2, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(24, { notificationCode: 'NTF-2024024', notificationDate: ts('2024-10-30T12:00:00Z'), modelId: 4, branch: 'BANDUNG', vendorId: 3, status: 'EXPIRED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS }),
  makeNotification(25, { notificationCode: 'NTF-2024025', notificationDate: ts('2024-11-25T15:00:00Z'), modelId: 5, branch: 'MAKASSAR', vendorId: 1, status: 'USED', createdBy: 'system-dummy', updatedBy: 'system-dummy', createdAt: NOW_TS, updatedAt: NOW_TS })
]

export const productModels: ProductModelRecord[] = [
  { id: 1, name: '4T-C43HJ6000I', inch: 43, vendorId: 1 },
  { id: 2, name: '4T-C55HJ6000I', inch: 55, vendorId: 1 },
  { id: 3, name: '4T-C50FJ1I', inch: 50, vendorId: 2 },
  { id: 4, name: '4T-C55FJ1I', inch: 55, vendorId: 2 },
  { id: 5, name: '2T-C-42FD1I', inch: 42, vendorId: 3 }
]

export const vendors: VendorRecord[] = [
  { id: 1, code: 'MOKA', name: 'MOKA Display', requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF', 'WO_PANEL', 'WO_PANEL_SN'], requiredFields: ['odfNumber', 'version', 'week'] },
  { id: 2, code: 'MTC', name: 'MTC Panel', requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'], requiredFields: [] },
  { id: 3, code: 'SDP', name: 'SDP Electronics', requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'], requiredFields: [] }
]

export const defects: DefectRecord[] = [
  { id: 1, code: 'DEF-001', name: 'No Display' },
  { id: 2, code: 'DEF-002', name: 'Vertical Line' },
  { id: 3, code: 'DEF-003', name: 'Horizontal Line' },
  { id: 4, code: 'DEF-004', name: 'Broken Panel' },
  { id: 5, code: 'DEF-005', name: 'Flicker' },
  { id: 6, code: 'DEF-006', name: 'Dark Spot' },
  { id: 7, code: 'DEF-007', name: 'Backlight Bleed' }
]
