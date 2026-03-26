import type {
  ClaimListItem,
  ClaimDetail,
  ClaimPhoto,
  ClaimHistoryItem,
  VendorClaimBatch,
  ReportSummary,
  AuditLogEntry,
  UserListItem,
  UserProfile
} from '~/utils/types'

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
  totalClaims: 1842,
  approvedClaims: 1702,
  rejectedClaims: 98,
  pendingClaims: 42,
  approvalRate: 92.4,
  averageProcessingDays: 3.2,
  claimsByVendor: [
    { vendor: 'MOKA', count: 820 },
    { vendor: 'MTC', count: 612 },
    { vendor: 'SDP', count: 410 }
  ],
  claimsByBranch: [
    { branch: 'Cirebon', count: 420 },
    { branch: 'Purwokerto', count: 380 },
    { branch: 'Karawang', count: 240 },
    { branch: 'Jakarta', count: 350 },
    { branch: 'Surabaya', count: 280 },
    { branch: 'Bandung', count: 172 }
  ],
  monthlyTrend: [
    { month: '10/2025', notificationQty: 150, claimQty: 20, ratio: 13.33 },
    { month: '11/2025', notificationQty: 140, claimQty: 24, ratio: 17.14 },
    { month: '12/2025', notificationQty: 173, claimQty: 21, ratio: 12.14 },
    { month: '01/2026', notificationQty: 130, claimQty: 18, ratio: 13.85 },
    { month: '02/2026', notificationQty: 170, claimQty: 35, ratio: 20.59 },
    { month: '03/2026', notificationQty: 155, claimQty: 17, ratio: 10.97 }
  ]
}

// ──────────────────────────────────────────────
// Mock Audit Logs
// ──────────────────────────────────────────────

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

export const MOCK_USERS: UserListItem[] = [
  { id: '1', name: 'Zaina Riddle', email: 'zaina@sharp.co.id', role: 'CS', branch: 'Jakarta', isActive: true, lastLoginAt: '2024-05-21T08:00:00Z', createdAt: '2024-01-15T00:00:00Z' },
  { id: '2', name: 'Budi Raharjo', email: 'budi@sharp.co.id', role: 'QRCC', branch: 'Jakarta', isActive: true, lastLoginAt: '2024-05-21T07:55:00Z', createdAt: '2024-01-10T00:00:00Z' },
  { id: '3', name: 'Admin System', email: 'admin@sharp.co.id', role: 'ADMIN', branch: 'Jakarta', isActive: true, lastLoginAt: '2024-05-20T09:00:00Z', createdAt: '2024-01-01T00:00:00Z' },
  { id: '4', name: 'Rina Sari', email: 'rina@sharp.co.id', role: 'CS', branch: 'Surabaya', isActive: true, lastLoginAt: '2024-05-19T10:30:00Z', createdAt: '2024-02-01T00:00:00Z' },
  { id: '5', name: 'Nadia Putri', email: 'nadia@sharp.co.id', role: 'QRCC', branch: 'Bandung', isActive: true, lastLoginAt: '2024-05-18T11:00:00Z', createdAt: '2024-02-15T00:00:00Z' },
  { id: '6', name: 'Dewi Kusuma', email: 'dewi@sharp.co.id', role: 'CS', branch: 'Bandung', isActive: true, lastLoginAt: '2024-05-18T08:30:00Z', createdAt: '2024-03-01T00:00:00Z' },
  { id: '7', name: 'Andi Wijaya', email: 'andi@sharp.co.id', role: 'CS', branch: 'Medan', isActive: true, lastLoginAt: '2024-05-17T15:45:00Z', createdAt: '2024-03-15T00:00:00Z' },
  { id: '8', name: 'Siti Nurhayati', email: 'siti@sharp.co.id', role: 'CS', branch: 'Makassar', isActive: false, lastLoginAt: '2024-05-10T12:00:00Z', createdAt: '2024-01-20T00:00:00Z' },
  { id: '9', name: 'Rudi Hartono', email: 'rudi@sharp.co.id', role: 'MANAGEMENT', branch: 'Jakarta', isActive: true, lastLoginAt: '2024-05-20T14:00:00Z', createdAt: '2024-01-05T00:00:00Z' }
]

// ──────────────────────────────────────────────
// Mock User Profile
// ──────────────────────────────────────────────

export const MOCK_USER_PROFILE: UserProfile = {
  id: '1',
  name: 'Zaina Riddle',
  email: 'zaina@sharp.co.id',
  role: 'CS',
  branch: 'Jakarta',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  phone: '+62 812-3456-7890',
  joinedAt: '2024-01-15T00:00:00Z'
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
