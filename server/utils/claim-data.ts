import type { ClaimStatus, FiscalHalf } from '~~/shared/utils/constants'
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'

export interface ClaimRecord {
  id: number
  claimNumber: string
  notificationId: number
  modelName: string
  vendorName: string
  inch: number
  branch: string
  odfNumber: string | null
  panelSerialNo: string
  ocSerialNo: string
  defectName: string
  version: string | null
  week: string | null
  claimStatus: ClaimStatus
  submittedBy: string
  updatedBy: string
  // Fiscal period fields
  fiscalYear: number
  fiscalHalf: FiscalHalf
  fiscalLabel: string
  calendarYear: number
  calendarMonth: number
  createdAt: string
  updatedAt: string
}

/**
 * Helper to build a ClaimRecord with auto-computed fiscal fields.
 */
function makeClaim(
  id: number,
  data: Omit<ClaimRecord, 'id' | 'fiscalYear' | 'fiscalHalf' | 'fiscalLabel' | 'calendarYear' | 'calendarMonth'>
): ClaimRecord {
  const fp = getFiscalPeriodInfo(data.createdAt)
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
// Dummy claims spread across two fiscal halves:
//   2025FH = Apr 2025 – Sep 2025
//   2025LH = Oct 2025 – Mar 2026
//
// Data intentionally hits fiscal boundaries:
//   - 31 Mar 2026 (last day 2025LH)
//   - 1 Apr 2025 (first day 2025FH)
//   - 30 Sep 2025 (last day 2025FH)
//   - 1 Oct 2025 (first day 2025LH)
// ────────────────────────────────────────────────────────────────

export const claims: ClaimRecord[] = [
  // ═══════════════════════════════════════════════════
  // 2025LH boundary claims (Oct 2025 – Mar 2026)
  // ═══════════════════════════════════════════════════

  // Last day of 2025LH
  makeClaim(1, {
    claimNumber: 'CLM-20260001',
    notificationId: 48,
    modelName: '4T-C43HJ6000I',
    vendorName: 'MOKA',
    inch: 43,
    branch: 'JAKARTA',
    odfNumber: 'ODF-A6F4XA',
    panelSerialNo: 'PNLYZKIA1BR',
    ocSerialNo: 'OCWNBWXHHG',
    defectName: 'Blank Screen',
    version: 'V1.0',
    week: 'W1',
    claimStatus: 'DRAFT',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-1',
    createdAt: '2026-03-31T14:30:00Z',
    updatedAt: '2026-03-31T14:30:00Z'
  }),

  makeClaim(2, {
    claimNumber: 'CLM-20260002',
    notificationId: 93,
    modelName: '4T-C55HJ6000I',
    vendorName: 'MTC',
    inch: 55,
    branch: 'SURABAYA',
    odfNumber: null,
    panelSerialNo: 'PNLOXH6491L',
    ocSerialNo: 'OCNLUG935M',
    defectName: 'Line Vertical',
    version: null,
    week: null,
    claimStatus: 'SUBMITTED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-1',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-03-28T10:00:00Z'
  }),

  makeClaim(3, {
    claimNumber: 'CLM-20260003',
    notificationId: 75,
    modelName: '4T-C65HJ6000I',
    vendorName: 'SDP',
    inch: 65,
    branch: 'MEDAN',
    odfNumber: 'ODF-033QLI',
    panelSerialNo: 'PNL3OO4VTL4',
    ocSerialNo: 'OCQJ76CWB1',
    defectName: 'Flickering',
    version: null,
    week: null,
    claimStatus: 'IN_REVIEW',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-2',
    createdAt: '2026-03-15T08:30:00Z',
    updatedAt: '2026-03-16T09:00:00Z'
  }),

  makeClaim(4, {
    claimNumber: 'CLM-20260004',
    notificationId: 75,
    modelName: '4T-C75HJ6000I',
    vendorName: 'MOKA',
    inch: 75,
    branch: 'BANDUNG',
    odfNumber: null,
    panelSerialNo: 'PNLF7ALW9G6',
    ocSerialNo: 'OCY699NTI5',
    defectName: 'No Backlight',
    version: 'V4.0',
    week: null,
    claimStatus: 'NEED_REVISION',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2026-03-01T03:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z'
  }),

  makeClaim(5, {
    claimNumber: 'CLM-20260005',
    notificationId: 54,
    modelName: '2T-C42FD1I',
    vendorName: 'MTC',
    inch: 42,
    branch: 'MAKASSAR',
    odfNumber: 'ODF-LSOM3',
    panelSerialNo: 'PNLXAETUHIA',
    ocSerialNo: 'OC73YCTUH9',
    defectName: 'Color Distort',
    version: null,
    week: 'W5',
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2026-02-20T15:30:00Z',
    updatedAt: '2026-02-22T11:00:00Z'
  }),

  makeClaim(6, {
    claimNumber: 'CLM-20260006',
    notificationId: 82,
    modelName: '4T-C42FG1I',
    vendorName: 'SDP',
    inch: 42,
    branch: 'JAKARTA',
    odfNumber: null,
    panelSerialNo: 'PNLM3AT0GEN',
    ocSerialNo: 'OCFNZQDMKA',
    defectName: 'No Signal',
    version: null,
    week: null,
    claimStatus: 'ARCHIVED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-15T14:00:00Z'
  }),

  makeClaim(7, {
    claimNumber: 'CLM-20260007',
    notificationId: 30,
    modelName: '4T-C55FJ1I',
    vendorName: 'MOKA',
    inch: 55,
    branch: 'SURABAYA',
    odfNumber: 'ODF-THKS1D',
    panelSerialNo: 'PNLEUBJ5GQC',
    ocSerialNo: 'OCX47FVVRB',
    defectName: 'Line Horizontal',
    version: 'V2.0',
    week: null,
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2026-01-25T07:00:00Z',
    updatedAt: '2026-01-28T16:00:00Z'
  }),

  makeClaim(8, {
    claimNumber: 'CLM-20260008',
    notificationId: 32,
    modelName: '4T-C65FJ1I',
    vendorName: 'MTC',
    inch: 50,
    branch: 'MEDAN',
    odfNumber: null,
    panelSerialNo: 'PNLWHFJVC05',
    ocSerialNo: 'OCEWI6WDKW',
    defectName: 'Blank Screen',
    version: null,
    week: null,
    claimStatus: 'SUBMITTED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-1',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z'
  }),

  makeClaim(9, {
    claimNumber: 'CLM-20260009',
    notificationId: 25,
    modelName: '4T-C75FJ1I',
    vendorName: 'SDP',
    inch: 75,
    branch: 'BANDUNG',
    odfNumber: 'ODF-U2LIUT',
    panelSerialNo: 'PNLUL3Q6K6R',
    ocSerialNo: 'OC10J2LGRW',
    defectName: 'Line Vertical',
    version: null,
    week: 'W9',
    claimStatus: 'IN_REVIEW',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-2',
    createdAt: '2025-12-18T10:00:00Z',
    updatedAt: '2025-12-19T14:00:00Z'
  }),

  makeClaim(10, {
    claimNumber: 'CLM-20260010',
    notificationId: 95,
    modelName: '4T-C43ARI000I',
    vendorName: 'MOKA',
    inch: 43,
    branch: 'MAKASSAR',
    odfNumber: null,
    panelSerialNo: 'PNLZAVG5UOT',
    ocSerialNo: 'OC8ZJFH48P',
    defectName: 'Flickering',
    version: 'V5.0',
    week: null,
    claimStatus: 'NEED_REVISION',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-12-01T12:00:00Z',
    updatedAt: '2025-12-05T09:00:00Z'
  }),

  makeClaim(11, {
    claimNumber: 'CLM-20260011',
    notificationId: 25,
    modelName: '4T-C55ARI000I',
    vendorName: 'MTC',
    inch: 55,
    branch: 'JAKARTA',
    odfNumber: 'ODF-0UJTBQ',
    panelSerialNo: 'PNLUY8GYQT8',
    ocSerialNo: 'OCZ40KS3QF',
    defectName: 'No Backlight',
    version: null,
    week: null,
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-11-15T09:00:00Z',
    updatedAt: '2025-11-18T11:00:00Z'
  }),

  makeClaim(12, {
    claimNumber: 'CLM-20260012',
    notificationId: 79,
    modelName: '4T-C43HJ6000I',
    vendorName: 'SDP',
    inch: 43,
    branch: 'SURABAYA',
    odfNumber: null,
    panelSerialNo: 'PNL2BKNRM4D',
    ocSerialNo: 'OC09UZ6B1R',
    defectName: 'Color Distort',
    version: null,
    week: null,
    claimStatus: 'ARCHIVED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-11-01T08:00:00Z',
    updatedAt: '2025-11-10T16:00:00Z'
  }),

  // ── Fiscal boundary: first day of 2025LH ──
  makeClaim(13, {
    claimNumber: 'CLM-20250013',
    notificationId: 75,
    modelName: '4T-C65ARI000I',
    vendorName: 'MOKA',
    inch: 65,
    branch: 'MEDAN',
    odfNumber: 'ODF-T6HN0P',
    panelSerialNo: 'PNLOV6CH3SU',
    ocSerialNo: 'OCUAR93AP7',
    defectName: 'No Signal',
    version: 'V3.0',
    week: 'W13',
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2025-10-05T10:00:00Z'
  }),

  makeClaim(14, {
    claimNumber: 'CLM-20250014',
    notificationId: 16,
    modelName: '4T-C43HJ6000I',
    vendorName: 'MTC',
    inch: 43,
    branch: 'BANDUNG',
    odfNumber: null,
    panelSerialNo: 'PNLTVNS62TG',
    ocSerialNo: 'OCN0UGABS3',
    defectName: 'Line Horizontal',
    version: null,
    week: null,
    claimStatus: 'SUBMITTED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-1',
    createdAt: '2025-10-15T08:30:00Z',
    updatedAt: '2025-10-15T08:30:00Z'
  }),

  // ═══════════════════════════════════════════════════
  // 2025FH boundary claims (Apr 2025 – Sep 2025)
  // ═══════════════════════════════════════════════════

  // ── Fiscal boundary: last day of 2025FH ──
  makeClaim(15, {
    claimNumber: 'CLM-20250015',
    notificationId: 70,
    modelName: '4T-C55HJ6000I',
    vendorName: 'SDP',
    inch: 55,
    branch: 'MAKASSAR',
    odfNumber: 'ODF-EO8I18',
    panelSerialNo: 'PNL8HCOXOMN',
    ocSerialNo: 'OCPWRB4Q1K',
    defectName: 'Blank Screen',
    version: null,
    week: null,
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-09-30T23:30:00Z',
    updatedAt: '2025-10-02T10:00:00Z'
  }),

  makeClaim(16, {
    claimNumber: 'CLM-20250016',
    notificationId: 55,
    modelName: '4T-C65HJ6000I',
    vendorName: 'MOKA',
    inch: 65,
    branch: 'JAKARTA',
    odfNumber: null,
    panelSerialNo: 'PNLF26QXSQQ',
    ocSerialNo: 'OCTH82HMUI',
    defectName: 'Line Vertical',
    version: 'V1.0',
    week: null,
    claimStatus: 'NEED_REVISION',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-09-15T14:00:00Z',
    updatedAt: '2025-09-18T09:00:00Z'
  }),

  makeClaim(17, {
    claimNumber: 'CLM-20250017',
    notificationId: 85,
    modelName: '4T-C75HJ6000I',
    vendorName: 'MTC',
    inch: 75,
    branch: 'SURABAYA',
    odfNumber: 'ODF-I2KL96',
    panelSerialNo: 'PNLQ27D0HUP',
    ocSerialNo: 'OCCIP16CXA',
    defectName: 'Flickering',
    version: null,
    week: 'W17',
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-08-20T07:00:00Z',
    updatedAt: '2025-08-23T15:00:00Z'
  }),

  makeClaim(18, {
    claimNumber: 'CLM-20250018',
    notificationId: 73,
    modelName: '2T-C42FD1I',
    vendorName: 'SDP',
    inch: 42,
    branch: 'MEDAN',
    odfNumber: null,
    panelSerialNo: 'PNLEPV0EA8E',
    ocSerialNo: 'OCDWG4UV3G',
    defectName: 'No Backlight',
    version: null,
    week: null,
    claimStatus: 'ARCHIVED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-07-25T10:00:00Z',
    updatedAt: '2025-08-01T14:00:00Z'
  }),

  makeClaim(19, {
    claimNumber: 'CLM-20250019',
    notificationId: 10,
    modelName: '4T-C42FG1I',
    vendorName: 'MOKA',
    inch: 42,
    branch: 'BANDUNG',
    odfNumber: 'ODF-AXYTH',
    panelSerialNo: 'PNLAFCO8W1A',
    ocSerialNo: 'OCN91I7H2F',
    defectName: 'Color Distort',
    version: 'V4.0',
    week: null,
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-06-15T09:00:00Z',
    updatedAt: '2025-06-18T11:00:00Z'
  }),

  makeClaim(20, {
    claimNumber: 'CLM-20250020',
    notificationId: 84,
    modelName: '4T-C65HJ6000I',
    vendorName: 'MTC',
    inch: 65,
    branch: 'MAKASSAR',
    odfNumber: null,
    panelSerialNo: 'PNLAZCFRRRQ',
    ocSerialNo: 'OCKBLJFNC7',
    defectName: 'No Signal',
    version: null,
    week: null,
    claimStatus: 'SUBMITTED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-1',
    createdAt: '2025-05-20T08:00:00Z',
    updatedAt: '2025-05-20T08:00:00Z'
  }),

  // ── Fiscal boundary: first day of 2025FH ──
  makeClaim(21, {
    claimNumber: 'CLM-20250021',
    notificationId: 31,
    modelName: '4T-C55FJ1I',
    vendorName: 'SDP',
    inch: 55,
    branch: 'JAKARTA',
    odfNumber: 'ODF-OTCPRW',
    panelSerialNo: 'PNL9KA53TA7',
    ocSerialNo: 'OC6RWHPYH6',
    defectName: 'Line Horizontal',
    version: null,
    week: 'W21',
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-04-01T00:00:00Z',
    updatedAt: '2025-04-04T10:00:00Z'
  }),

  makeClaim(22, {
    claimNumber: 'CLM-20250022',
    notificationId: 10,
    modelName: '4T-C65FJ1I',
    vendorName: 'MOKA',
    inch: 50,
    branch: 'SURABAYA',
    odfNumber: null,
    panelSerialNo: 'PNLMC4AYZ09',
    ocSerialNo: 'OCMQB37Z8B',
    defectName: 'Blank Screen',
    version: 'V2.0',
    week: null,
    claimStatus: 'NEED_REVISION',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-04-15T14:00:00Z',
    updatedAt: '2025-04-18T09:00:00Z'
  }),

  // ═══════════════════════════════════════════════════
  // 2024LH claims (Oct 2024 – Mar 2025) — previous fiscal period
  // ═══════════════════════════════════════════════════

  // ── Fiscal boundary: last day of 2024LH ──
  makeClaim(23, {
    claimNumber: 'CLM-20250023',
    notificationId: 82,
    modelName: '4T-C55FJ1I',
    vendorName: 'MTC',
    inch: 55,
    branch: 'MEDAN',
    odfNumber: 'ODF-1NZIR',
    panelSerialNo: 'PNL4K1KBWPA',
    ocSerialNo: 'OC7294G5OP',
    defectName: 'Line Vertical',
    version: null,
    week: null,
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-03-31T23:00:00Z',
    updatedAt: '2025-04-02T10:00:00Z'
  }),

  makeClaim(24, {
    claimNumber: 'CLM-20250024',
    notificationId: 90,
    modelName: '4T-C75FJ1I',
    vendorName: 'SDP',
    inch: 75,
    branch: 'BANDUNG',
    odfNumber: null,
    panelSerialNo: 'PNLJ8TDV1DV',
    ocSerialNo: 'OCTUKXJB7H',
    defectName: 'Flickering',
    version: null,
    week: null,
    claimStatus: 'ARCHIVED',
    submittedBy: 'user-uuid-dummy-1',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-20T14:00:00Z'
  }),

  makeClaim(25, {
    claimNumber: 'CLM-20250025',
    notificationId: 93,
    modelName: '4T-C43ARI000I',
    vendorName: 'MOKA',
    inch: 43,
    branch: 'MAKASSAR',
    odfNumber: 'ODF-O8ZWT',
    panelSerialNo: 'PNLJLNIC1KX',
    ocSerialNo: 'OC99PLIDE0',
    defectName: 'No Backlight',
    version: 'V5.0',
    week: 'W25',
    claimStatus: 'APPROVED',
    submittedBy: 'user-uuid-dummy-2',
    updatedBy: 'user-uuid-dummy-3',
    createdAt: '2025-01-10T12:00:00Z',
    updatedAt: '2025-01-14T16:00:00Z'
  })
]
