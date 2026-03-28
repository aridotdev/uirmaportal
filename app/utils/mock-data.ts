import type {
  ClaimListItem,
  ClaimDetail,
  ClaimPhoto,
  ClaimHistoryItem,
  VendorClaimBatch,
  ReportSummary,
  AuditLogEntry,
  AuditTrailTableRow,
  UserListItem,
  UserProfile
} from '~/utils/types'
import type { UserRole } from '~~/shared/utils/constants'

// ──────────────────────────────────────────────
// Mock Claims
// ──────────────────────────────────────────────

export const MOCK_CLAIMS: ClaimListItem[] = [
  {
    id: 'CLM-2024-0891',
    claimNumber: 'CLM-2024-0891',
    notificationId: 10029334,
    modelName: 'KD-55X7500H',
    vendorName: 'MOKA',
    branch: 'Jakarta',
    defectName: 'Vertical Line',
    inch: 55,
    claimStatus: 'NEED_REVISION',
    panelSerialNo: 'LTY550HN01-001-XJ82',
    ocSerialNo: 'OC-9920334-ZV',
    submittedBy: 'Zaina Riddle',
    updatedBy: 'Budi Raharjo',
    createdAt: '2024-05-20T14:30:00Z',
    updatedAt: '2024-05-21T09:15:00Z'
  },
  {
    id: 'CLM-2024-0890',
    claimNumber: 'CLM-2024-0890',
    notificationId: 10029333,
    modelName: 'KD-43X7500H',
    vendorName: 'SDP',
    branch: 'Surabaya',
    defectName: 'No Display',
    inch: 43,
    claimStatus: 'APPROVED',
    panelSerialNo: 'LTY430HN02-004-AB11',
    ocSerialNo: 'OC-8830122-PK',
    submittedBy: 'Rina Sari',
    updatedBy: 'Budi Raharjo',
    createdAt: '2024-05-19T10:00:00Z',
    updatedAt: '2024-05-20T16:00:00Z'
  },
  {
    id: 'CLM-2024-0889',
    claimNumber: 'CLM-2024-0889',
    notificationId: 10029332,
    modelName: 'KD-65X9000H',
    vendorName: 'MTC',
    branch: 'Bandung',
    defectName: 'Broken Panel',
    inch: 65,
    claimStatus: 'IN_REVIEW',
    panelSerialNo: 'LTY650HN03-007-KK44',
    ocSerialNo: 'OC-7740211-MN',
    submittedBy: 'Dewi Kusuma',
    updatedBy: 'Nadia Putri',
    createdAt: '2024-05-18T08:30:00Z',
    updatedAt: '2024-05-19T11:00:00Z'
  },
  {
    id: 'CLM-2024-0888',
    claimNumber: 'CLM-2024-0888',
    notificationId: 10029331,
    modelName: 'KD-50X7500H',
    vendorName: 'MOKA',
    branch: 'Medan',
    defectName: 'Flicker',
    inch: 50,
    claimStatus: 'SUBMITTED',
    panelSerialNo: 'LTY500HN04-002-PP99',
    ocSerialNo: 'OC-6650100-QR',
    submittedBy: 'Andi Wijaya',
    updatedBy: 'Andi Wijaya',
    createdAt: '2024-05-17T15:45:00Z',
    updatedAt: '2024-05-17T15:45:00Z'
  },
  {
    id: 'CLM-2024-0887',
    claimNumber: 'CLM-2024-0887',
    notificationId: 10029330,
    modelName: 'KD-32W600D',
    vendorName: 'SDP',
    branch: 'Jakarta',
    defectName: 'Dark Spot',
    inch: 32,
    claimStatus: 'DRAFT',
    panelSerialNo: 'LTY320HN05-009-TT88',
    ocSerialNo: 'OC-5540088-UV',
    submittedBy: 'Zaina Riddle',
    updatedBy: 'Zaina Riddle',
    createdAt: '2024-05-16T09:20:00Z',
    updatedAt: '2024-05-16T09:20:00Z'
  },
  {
    id: 'CLM-2024-0886',
    claimNumber: 'CLM-2024-0886',
    notificationId: 10029329,
    modelName: 'KD-75X9500H',
    vendorName: 'MTC',
    branch: 'Makassar',
    defectName: 'Backlight Bleed',
    inch: 75,
    claimStatus: 'ARCHIVED',
    panelSerialNo: 'LTY750HN06-003-WW77',
    ocSerialNo: 'OC-4430077-XY',
    submittedBy: 'Siti Nurhayati',
    updatedBy: 'Admin',
    createdAt: '2024-05-10T12:00:00Z',
    updatedAt: '2024-05-15T08:00:00Z'
  }
]

// ──────────────────────────────────────────────
// Mock Claim Photos
// ──────────────────────────────────────────────

export const MOCK_CLAIM_PHOTOS: ClaimPhoto[] = [
  { id: 1, claimId: 1, photoType: 'CLAIM', label: 'Main Claim Photo', status: 'VERIFIED', filePath: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800', rejectReason: null, note: 'Sudah sesuai standar.' },
  { id: 2, claimId: 1, photoType: 'CLAIM_ZOOM', label: 'Defect Zoom', status: 'REJECT', filePath: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800', rejectReason: 'Foto terlalu gelap dan buram.', note: 'Foto terlalu gelap dan buram.' },
  { id: 3, claimId: 1, photoType: 'PANEL_SN', label: 'Panel Serial Number', status: 'VERIFIED', filePath: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800', rejectReason: null, note: 'Terverifikasi.' },
  { id: 4, claimId: 1, photoType: 'ODF', label: 'ODF Document', status: 'PENDING', filePath: 'https://images.unsplash.com/photo-1618044733300-9472154093ee?auto=format&fit=crop&q=80&w=800', rejectReason: null, note: 'Menunggu review.' }
]

// ──────────────────────────────────────────────
// Mock Claim History
// ──────────────────────────────────────────────

export const MOCK_CLAIM_HISTORY: ClaimHistoryItem[] = [
  { id: 1, claimId: 1, action: 'REJECT', fromStatus: 'IN_REVIEW', toStatus: 'NEED_REVISION', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', note: 'The Panel Serial Number photo is blurry. Please re-upload with a clearer shot focusing on the barcode.', createdAt: '2024-05-21T09:15:00Z' },
  { id: 2, claimId: 1, action: 'REVIEW', fromStatus: 'SUBMITTED', toStatus: 'IN_REVIEW', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', note: null, createdAt: '2024-05-21T08:00:00Z' },
  { id: 3, claimId: 1, action: 'SUBMIT', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', userId: '1', userName: 'Zaina Riddle', userRole: 'CS', note: 'Klaim baru diajukan sesuai laporan unit pelanggan.', createdAt: '2024-05-20T14:30:00Z' },
  { id: 4, claimId: 1, action: 'CREATE', fromStatus: '-', toStatus: 'DRAFT', userId: '1', userName: 'Zaina Riddle', userRole: 'CS', note: 'Menyimpan draft awal laporan.', createdAt: '2024-05-20T11:05:00Z' }
]

// ──────────────────────────────────────────────
// Mock Vendor Claims
// ──────────────────────────────────────────────

export const MOCK_VENDOR_CLAIMS: VendorClaimBatch[] = [
  { id: '1', batchNumber: 'VC-2026-001', vendor: 'MOKA', submittedDate: '2026-03-10', status: 'COMPLETED', createdAt: '2026-03-10', totalItems: 14, vendorDecision: 'ACCEPTED' },
  { id: '2', batchNumber: 'VC-2026-002', vendor: 'SDP', submittedDate: '2026-03-12', status: 'PROCESSING', createdAt: '2026-03-12', totalItems: 7, vendorDecision: 'PENDING' },
  { id: '3', batchNumber: 'VC-2026-003', vendor: 'MTC', submittedDate: '2026-03-14', status: 'CREATED', createdAt: '2026-03-14', totalItems: 5 },
  { id: '4', batchNumber: 'VC-2026-004', vendor: 'MOKA', submittedDate: '2026-03-15', status: 'PROCESSING', createdAt: '2026-03-15', totalItems: 9, vendorDecision: 'PENDING' },
  { id: '5', batchNumber: 'VC-2026-005', vendor: 'SDP', submittedDate: '2026-03-16', status: 'CREATED', createdAt: '2026-03-16', totalItems: 3 },
  { id: '6', batchNumber: 'VC-2026-006', vendor: 'MTC', submittedDate: '2026-03-17', status: 'CREATED', createdAt: '2026-03-17', totalItems: 11 },
  { id: '7', batchNumber: 'VC-2026-007', vendor: 'MTC', submittedDate: '2026-03-08', status: 'COMPLETED', createdAt: '2026-03-08', totalItems: 20, vendorDecision: 'ACCEPTED' }
]

// ──────────────────────────────────────────────
// Mock Report Summary
// ──────────────────────────────────────────────

export const MOCK_REPORT_SUMMARY: ReportSummary = {
  kpi: {
    totalClaims: 1842,
    submittedClaims: 142,
    inReviewClaims: 58,
    needRevisionClaims: 98,
    approvedClaims: 1702,
    pendingBacklog: 298,
    avgReviewLeadTimeDays: 3.2,
    vendorPendingItems: 63,
    approvalRate: 92.4,
    revisionRate: 5.3,
    vendorAcceptanceRate: 78.2
  },
  claimsByVendor: [
    { vendor: 'MOKA', count: 820 },
    { vendor: 'MTC', count: 612 },
    { vendor: 'SDP', count: 410 }
  ],
  claimsByBranch: [
    { branch: 'Cirebon', count: 420, approvalRate: 93.1, revisionRate: 4.5 },
    { branch: 'Purwokerto', count: 380, approvalRate: 91.8, revisionRate: 5.8 },
    { branch: 'Karawang', count: 240, approvalRate: 90.4, revisionRate: 6.3 },
    { branch: 'Jakarta', count: 350, approvalRate: 94.0, revisionRate: 3.7 },
    { branch: 'Surabaya', count: 280, approvalRate: 92.1, revisionRate: 5.0 },
    { branch: 'Bandung', count: 172, approvalRate: 89.5, revisionRate: 7.6 }
  ],
  topDefects: [
    { defect: 'Panel Crack', count: 312 },
    { defect: 'Dead Pixel', count: 245 },
    { defect: 'Backlight Bleeding', count: 198 },
    { defect: 'Color Distortion', count: 156 },
    { defect: 'Power Failure', count: 121 }
  ],
  monthlyTrend: [
    { month: '10/2025', inflow: 150, closure: 130, backlog: 298 },
    { month: '11/2025', inflow: 140, closure: 145, backlog: 293 },
    { month: '12/2025', inflow: 173, closure: 160, backlog: 306 },
    { month: '01/2026', inflow: 130, closure: 138, backlog: 298 },
    { month: '02/2026', inflow: 170, closure: 165, backlog: 303 },
    { month: '03/2026', inflow: 155, closure: 150, backlog: 308 }
  ],
  exceptions: [
    {
      label: 'Highest Revision Rate',
      value: 'Bandung — 7.6%',
      detail: 'Branch ini memiliki revision rate tertinggi. Perlu evaluasi kualitas input.',
      severity: 'warning'
    },
    {
      label: 'Highest Rejection Rate',
      value: 'SDP — 28.4%',
      detail: 'Vendor SDP memiliki rejection rate tertinggi bulan ini.',
      severity: 'critical'
    },
    {
      label: 'Aging > SLA',
      value: '12 claims > 14 hari',
      detail: '12 klaim telah melewati batas SLA 14 hari tanpa keputusan.',
      severity: 'critical'
    }
  ]
}

// ──────────────────────────────────────────────
// Mock Audit Trail (follows claim_history schema + enrichment)
// ──────────────────────────────────────────────
// Source of truth: doc/audit-trail-flow.md event matrix
// Schema contract: server/database/schema/claim-history.ts
// Enum constraints: shared/utils/constants.ts CLAIM_HISTORY_ACTIONS, CLAIM_STATUSES, USER_ROLES
//
// Three scenarios covered:
//   Scenario 1 (Claim 101 / CLM-2026-0342): Happy path without revision
//   Scenario 2 (Claim 102 / CLM-2026-0341): Revision flow then resubmit
//   Scenario 3 (Claim 103 / CLM-2026-0340): Vendor decision changed after batch

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

export const MOCK_AUDIT_TRAIL: AuditTrailTableRow[] = [
  // ── Scenario 1: Happy path (Claim 101 / CLM-2026-0342) ──

  {
    id: 1,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'CREATE',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Claim draft created',
    createdAt: '2026-03-20T08:00:00Z'
  },
  {
    id: 2,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'UPDATE',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Draft updated: panelSerialNo, defectCode',
    createdAt: '2026-03-20T08:15:00Z'
  },
  {
    id: 3,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Photo CLAIM uploaded',
    createdAt: '2026-03-20T08:20:00Z'
  },
  {
    id: 4,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Photo ODF uploaded',
    createdAt: '2026-03-20T08:22:00Z'
  },
  {
    id: 5,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Photo PANEL_SN uploaded',
    createdAt: '2026-03-20T08:24:00Z'
  },
  {
    id: 6,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'SUBMIT',
    fromStatus: 'DRAFT',
    toStatus: 'SUBMITTED',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Claim submitted for review',
    createdAt: '2026-03-20T08:30:00Z'
  },
  {
    id: 7,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'REVIEW',
    fromStatus: 'SUBMITTED',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Claim review started',
    createdAt: '2026-03-20T09:00:00Z'
  },
  {
    id: 8,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo CLAIM verified',
    createdAt: '2026-03-20T09:10:00Z'
  },
  {
    id: 9,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo ODF verified',
    createdAt: '2026-03-20T09:12:00Z'
  },
  {
    id: 10,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo PANEL_SN verified',
    createdAt: '2026-03-20T09:14:00Z'
  },
  {
    id: 11,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'APPROVE',
    fromStatus: 'IN_REVIEW',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'All photos verified - claim approved',
    createdAt: '2026-03-20T09:20:00Z'
  },
  {
    id: 12,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'GENERATE_VENDOR_CLAIM',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Included in vendor claim VC-20260320-001',
    createdAt: '2026-03-20T10:00:00Z'
  },
  {
    id: 13,
    claimId: 101,
    claimNumber: 'CLM-2026-0342',
    action: 'UPDATE_VENDOR_DECISION',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Vendor decision ACCEPTED, compensation=500000',
    createdAt: '2026-03-22T14:00:00Z'
  },

  // ── Scenario 2: Revision flow (Claim 102 / CLM-2026-0341) ──

  {
    id: 14,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'CREATE',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Claim draft created',
    createdAt: '2026-03-19T10:00:00Z'
  },
  {
    id: 15,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Photo CLAIM uploaded',
    createdAt: '2026-03-19T10:10:00Z'
  },
  {
    id: 16,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Photo ODF uploaded',
    createdAt: '2026-03-19T10:12:00Z'
  },
  {
    id: 17,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Photo PANEL_SN uploaded',
    createdAt: '2026-03-19T10:14:00Z'
  },
  {
    id: 18,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'SUBMIT',
    fromStatus: 'DRAFT',
    toStatus: 'SUBMITTED',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Claim submitted for review',
    createdAt: '2026-03-19T10:30:00Z'
  },
  {
    id: 19,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW',
    fromStatus: 'SUBMITTED',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Claim review started',
    createdAt: '2026-03-19T11:00:00Z'
  },
  {
    id: 20,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo CLAIM verified',
    createdAt: '2026-03-19T11:10:00Z'
  },
  {
    id: 21,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo ODF rejected: image not clear',
    createdAt: '2026-03-19T11:12:00Z'
  },
  {
    id: 22,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo PANEL_SN rejected: serial number not readable',
    createdAt: '2026-03-19T11:14:00Z'
  },
  {
    id: 23,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REQUEST_REVISION',
    fromStatus: 'IN_REVIEW',
    toStatus: 'NEED_REVISION',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'One or more photos rejected - revision required',
    createdAt: '2026-03-19T11:20:00Z'
  },
  {
    id: 24,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'UPDATE',
    fromStatus: 'NEED_REVISION',
    toStatus: 'NEED_REVISION',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Revision data updated: odfNumber',
    createdAt: '2026-03-19T14:00:00Z'
  },
  {
    id: 25,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'NEED_REVISION',
    toStatus: 'NEED_REVISION',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Photo ODF uploaded for revision',
    createdAt: '2026-03-19T14:10:00Z'
  },
  {
    id: 26,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'NEED_REVISION',
    toStatus: 'NEED_REVISION',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Photo PANEL_SN uploaded for revision',
    createdAt: '2026-03-19T14:12:00Z'
  },
  {
    id: 27,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'SUBMIT',
    fromStatus: 'NEED_REVISION',
    toStatus: 'SUBMITTED',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Revision submitted',
    createdAt: '2026-03-19T14:20:00Z'
  },
  {
    id: 28,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW',
    fromStatus: 'SUBMITTED',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Claim review started',
    createdAt: '2026-03-19T15:00:00Z'
  },
  {
    id: 29,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo ODF verified',
    createdAt: '2026-03-19T15:10:00Z'
  },
  {
    id: 30,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Photo PANEL_SN verified',
    createdAt: '2026-03-19T15:12:00Z'
  },
  {
    id: 31,
    claimId: 102,
    claimNumber: 'CLM-2026-0341',
    action: 'APPROVE',
    fromStatus: 'IN_REVIEW',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'All photos verified - claim approved',
    createdAt: '2026-03-19T15:20:00Z'
  },

  // ── Scenario 3: Vendor decision changed (Claim 103 / CLM-2026-0340) ──

  {
    id: 32,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'CREATE',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Claim draft created',
    createdAt: '2026-03-18T09:00:00Z'
  },
  {
    id: 33,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'UPLOAD_PHOTO',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Photo CLAIM uploaded',
    createdAt: '2026-03-18T09:10:00Z'
  },
  {
    id: 34,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'SUBMIT',
    fromStatus: 'DRAFT',
    toStatus: 'SUBMITTED',
    userId: 'USR-005',
    userRole: 'CS',
    actorName: 'Siti Aminah',
    actorInitials: initials('Siti Aminah'),
    note: 'Claim submitted for review',
    createdAt: '2026-03-18T09:30:00Z'
  },
  {
    id: 35,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'REVIEW',
    fromStatus: 'SUBMITTED',
    toStatus: 'IN_REVIEW',
    userId: 'USR-002',
    userRole: 'ADMIN',
    actorName: 'Ahmad Fauzi',
    actorInitials: initials('Ahmad Fauzi'),
    note: 'Claim review started',
    createdAt: '2026-03-18T10:00:00Z'
  },
  {
    id: 36,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'REVIEW_PHOTO',
    fromStatus: 'IN_REVIEW',
    toStatus: 'IN_REVIEW',
    userId: 'USR-002',
    userRole: 'ADMIN',
    actorName: 'Ahmad Fauzi',
    actorInitials: initials('Ahmad Fauzi'),
    note: 'Photo CLAIM verified',
    createdAt: '2026-03-18T10:10:00Z'
  },
  {
    id: 37,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'APPROVE',
    fromStatus: 'IN_REVIEW',
    toStatus: 'APPROVED',
    userId: 'USR-002',
    userRole: 'ADMIN',
    actorName: 'Ahmad Fauzi',
    actorInitials: initials('Ahmad Fauzi'),
    note: 'All photos verified - claim approved',
    createdAt: '2026-03-18T10:20:00Z'
  },
  {
    id: 38,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'GENERATE_VENDOR_CLAIM',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Included in vendor claim VC-20260318-001',
    createdAt: '2026-03-18T11:00:00Z'
  },
  {
    id: 39,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'UPDATE_VENDOR_DECISION',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Vendor decision REJECTED, reason=Packaging mismatch',
    createdAt: '2026-03-21T10:00:00Z'
  },
  {
    id: 40,
    claimId: 103,
    claimNumber: 'CLM-2026-0340',
    action: 'UPDATE_VENDOR_DECISION',
    fromStatus: 'APPROVED',
    toStatus: 'APPROVED',
    userId: 'USR-003',
    userRole: 'QRCC',
    actorName: 'Nadia Putri',
    actorInitials: initials('Nadia Putri'),
    note: 'Vendor decision changed from REJECTED to ACCEPTED, compensation=350000, reason=Re-inspected',
    createdAt: '2026-03-23T09:00:00Z'
  },

  // ── Additional: Archive event (Claim 104 / CLM-2026-0339) ──

  {
    id: 41,
    claimId: 104,
    claimNumber: 'CLM-2026-0339',
    action: 'CREATE',
    fromStatus: 'DRAFT',
    toStatus: 'DRAFT',
    userId: 'USR-001',
    userRole: 'CS',
    actorName: 'Zaina Riddle',
    actorInitials: initials('Zaina Riddle'),
    note: 'Claim draft created',
    createdAt: '2026-03-15T08:00:00Z'
  },
  {
    id: 42,
    claimId: 104,
    claimNumber: 'CLM-2026-0339',
    action: 'ARCHIVE',
    fromStatus: 'DRAFT',
    toStatus: 'ARCHIVED',
    userId: 'USR-002',
    userRole: 'ADMIN',
    actorName: 'Ahmad Fauzi',
    actorInitials: initials('Ahmad Fauzi'),
    note: 'Claim archived: duplicate entry',
    createdAt: '2026-03-16T09:00:00Z'
  }
]

// ──────────────────────────────────────────────
// Mock Audit Trail Helpers
// ──────────────────────────────────────────────

/** Check whether an audit trail event represents a status change */
export function isAuditStatusChange(row: AuditTrailTableRow): boolean {
  return row.fromStatus !== row.toStatus
}

/** Get sorted mock audit trail data (default: createdAt DESC for global view) */
export function getMockAuditTrailSorted(order: 'asc' | 'desc' = 'desc'): AuditTrailTableRow[] {
  return [...MOCK_AUDIT_TRAIL].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return order === 'asc' ? diff : -diff
  })
}

// ──────────────────────────────────────────────
// Mock Audit Logs (DEPRECATED – kept for backward compat)
// ──────────────────────────────────────────────
// TODO: Remove once audit-trail.vue is fully migrated to MOCK_AUDIT_TRAIL.

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  { id: 1, action: 'LOGIN', entityType: 'USER', entityId: '1', userId: '1', userName: 'Zaina Riddle', userRole: 'CS', details: 'User logged in successfully', ipAddress: '192.168.1.101', createdAt: '2024-05-21T08:00:00Z' },
  { id: 2, action: 'CREATE_CLAIM', entityType: 'CLAIM', entityId: 'CLM-2024-0891', userId: '1', userName: 'Zaina Riddle', userRole: 'CS', details: 'Created new claim CLM-2024-0891', ipAddress: '192.168.1.101', createdAt: '2024-05-20T14:30:00Z' },
  { id: 3, action: 'START_REVIEW', entityType: 'CLAIM', entityId: 'CLM-2024-0891', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', details: 'Started review for CLM-2024-0891', ipAddress: '192.168.1.102', createdAt: '2024-05-21T08:00:00Z' },
  { id: 4, action: 'REJECT_CLAIM', entityType: 'CLAIM', entityId: 'CLM-2024-0891', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', details: 'Rejected claim CLM-2024-0891 - Photo issues', ipAddress: '192.168.1.102', createdAt: '2024-05-21T09:15:00Z' },
  { id: 5, action: 'UPDATE_VENDOR', entityType: 'VENDOR', entityId: '1', userId: '3', userName: 'Admin System', userRole: 'ADMIN', details: 'Updated vendor MOKA required fields', ipAddress: '192.168.1.100', createdAt: '2024-05-19T16:00:00Z' },
  { id: 6, action: 'CREATE_VENDOR_CLAIM', entityType: 'VENDOR_CLAIM', entityId: 'VC-2026-001', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', details: 'Created vendor claim batch VC-2026-001 for MOKA', ipAddress: '192.168.1.102', createdAt: '2024-05-18T10:00:00Z' },
  { id: 7, action: 'LOGIN', entityType: 'USER', entityId: '2', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', details: 'User logged in successfully', ipAddress: '192.168.1.102', createdAt: '2024-05-21T07:55:00Z' },
  { id: 8, action: 'APPROVE_CLAIM', entityType: 'CLAIM', entityId: 'CLM-2024-0890', userId: '2', userName: 'Budi Raharjo', userRole: 'QRCC', details: 'Approved claim CLM-2024-0890', ipAddress: '192.168.1.102', createdAt: '2024-05-20T16:00:00Z' },
  { id: 9, action: 'UPDATE_USER', entityType: 'USER', entityId: '5', userId: '3', userName: 'Admin System', userRole: 'ADMIN', details: 'Updated user role from CS to QRCC', ipAddress: '192.168.1.100', createdAt: '2024-05-17T14:00:00Z' },
  { id: 10, action: 'DEACTIVATE_USER', entityType: 'USER', entityId: '8', userId: '3', userName: 'Admin System', userRole: 'ADMIN', details: 'Deactivated user account', ipAddress: '192.168.1.100', createdAt: '2024-05-15T11:30:00Z' }
]

// ──────────────────────────────────────────────
// Mock Users
// ──────────────────────────────────────────────

export interface AuthUserMock {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: number
  updatedAt: number
  username: string | null
  displayUsername: string | null
  role: UserRole | null
  banned: boolean
  banReason: string | null
  banExpires: number | null
  branch: string | null
  isActive: boolean
  // Helper field derived from session for UI list/detail
  lastLoginAt: number | null
}

export const MOCK_AUTH_USERS: AuthUserMock[] = [
  {
    id: 'USR-001',
    name: 'Zaina Riddle',
    email: 'zaina@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1705276800000,
    updatedAt: 1774512900000,
    username: 'zaina.riddle',
    displayUsername: 'zainar',
    role: 'CS',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Jakarta',
    isActive: true,
    lastLoginAt: 1774512900000
  },
  {
    id: 'USR-002',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1654041600000,
    updatedAt: 1774508400000,
    username: 'ahmad.fauzi',
    displayUsername: 'ahmadf',
    role: 'ADMIN',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Jakarta',
    isActive: true,
    lastLoginAt: 1774508400000
  },
  {
    id: 'USR-003',
    name: 'Nadia Putri',
    email: 'nadia.putri@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1678406400000,
    updatedAt: 1774465800000,
    username: 'nadia.putri',
    displayUsername: 'nadiap',
    role: 'QRCC',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Jakarta',
    isActive: true,
    lastLoginAt: 1774465800000
  },
  {
    id: 'USR-004',
    name: 'Budi Raharjo',
    email: 'budi.raharjo@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1640995200000,
    updatedAt: 1774440000000,
    username: 'budi.raharjo',
    displayUsername: 'budir',
    role: 'MANAGEMENT',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Jakarta',
    isActive: true,
    lastLoginAt: 1774440000000
  },
  {
    id: 'USR-005',
    name: 'Siti Aminah',
    email: 'siti.aminah@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1692489600000,
    updatedAt: 1774352400000,
    username: 'siti.aminah',
    displayUsername: 'sitia',
    role: 'CS',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Surabaya',
    isActive: true,
    lastLoginAt: 1774352400000
  },
  {
    id: 'USR-006',
    name: 'Rizky Pratama',
    email: 'rizky.pratama@sharp.co.id',
    emailVerified: false,
    image: null,
    createdAt: 1704412800000,
    updatedAt: 1739613600000,
    username: 'rizky.pratama',
    displayUsername: 'rizkyp',
    role: 'CS',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Bandung',
    isActive: false,
    lastLoginAt: 1739613600000
  },
  {
    id: 'USR-007',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1683849600000,
    updatedAt: 1774456800000,
    username: 'dewi.lestari',
    displayUsername: 'dewil',
    role: 'QRCC',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Surabaya',
    isActive: true,
    lastLoginAt: 1774456800000
  },
  {
    id: 'USR-008',
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@sharp.co.id',
    emailVerified: false,
    image: null,
    createdAt: 1709251200000,
    updatedAt: 1774244400000,
    username: 'hendra.wijaya',
    displayUsername: null,
    role: 'CS',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Medan',
    isActive: true,
    lastLoginAt: 1774244400000
  },
  {
    id: 'USR-009',
    name: 'Fitri Handayani',
    email: 'fitri.handayani@sharp.co.id',
    emailVerified: false,
    image: null,
    createdAt: 1726358400000,
    updatedAt: 1726358400000,
    username: 'fitri.handayani',
    displayUsername: null,
    role: 'CS',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Makassar',
    isActive: false,
    lastLoginAt: null
  },
  {
    id: 'USR-010',
    name: 'Andi Setiawan',
    email: 'andi.setiawan@sharp.co.id',
    emailVerified: true,
    image: null,
    createdAt: 1698796800000,
    updatedAt: 1774348800000,
    username: 'andi.setiawan',
    displayUsername: 'andis',
    role: 'MANAGEMENT',
    banned: false,
    banReason: null,
    banExpires: null,
    branch: 'Jakarta',
    isActive: true,
    lastLoginAt: 1774348800000
  }
]

export const mapAuthUserToUserListItem = (user: AuthUserMock): UserListItem => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role ?? 'CS',
  branch: user.branch ?? '-',
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
  createdAt: new Date(user.createdAt).toISOString()
})

export const MOCK_USERS: UserListItem[] = MOCK_AUTH_USERS.map(mapAuthUserToUserListItem)

// ──────────────────────────────────────────────
// Mock User Profile
// ──────────────────────────────────────────────

export const MOCK_USER_PROFILE: UserProfile = {
  id: 'usr_001',
  name: 'Zaina Riddle',
  username: 'zaina.riddle',
  email: 'zaina@sharp.co.id',
  role: 'QRCC',
  branch: 'Jakarta',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  phone: '+62 812-3456-7890',
  joinedAt: '2024-01-15T00:00:00Z',
  isActive: true,
  lastLoginAt: '2026-03-28T08:30:00Z'
}

// ──────────────────────────────────────────────
// Mock Claim Detail (combines claim + photos + history)
// ──────────────────────────────────────────────

export const MOCK_CLAIM_DETAIL: ClaimDetail = {
  ...MOCK_CLAIMS[0]!,
  odfNumber: 'ODF-2024-X9',
  version: '1.2',
  week: 'W20',
  revisionNote: 'Foto Panel Serial Number buram. Harap unggah ulang dengan fokus yang lebih tajam pada bagian barcode.',
  evidences: MOCK_CLAIM_PHOTOS,
  history: MOCK_CLAIM_HISTORY
}

// ──────────────────────────────────────────────
// Utility Helpers
// ──────────────────────────────────────────────

/**
 * Format an ISO date string into a human-readable date.
 */
export function formatDate(dateStr: string, locale = 'id-ID'): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format an ISO date string into a human-readable date+time.
 */
export function formatDateTime(dateStr: string | null | undefined, locale = 'id-ID'): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format a date into a relative time string (e.g. "5 mins ago").
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / 60000)

  if (diffInMins < 1) return 'just now'
  if (diffInMins < 60) return `${diffInMins} mins ago`
  const diffInHours = Math.floor(diffInMins / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  return `${Math.floor(diffInHours / 24)} days ago`
}
