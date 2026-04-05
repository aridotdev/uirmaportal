import type { ClaimStatus, UserRole } from '~~/shared/utils/constants'
import type { CsClaimHistoryItem } from '~/utils/cs-mock-data/types'

function makeHistoryItem(
  id: number,
  claimId: string,
  action: CsClaimHistoryItem['action'],
  fromStatus: ClaimStatus | '-',
  toStatus: ClaimStatus,
  userId: string,
  userName: string,
  userRole: UserRole,
  note: string | null,
  createdAt: string
): CsClaimHistoryItem {
  return {
    id,
    claimId,
    action,
    fromStatus,
    toStatus,
    userId,
    userName,
    userRole,
    note,
    createdAt
  }
}

export const CS_MOCK_CLAIM_HISTORY: Record<string, CsClaimHistoryItem[]> = {
  'CLM-2026-0001': [
    makeHistoryItem(10001, 'CLM-2026-0001', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2026-03-12T08:00:00Z'),
    makeHistoryItem(10002, 'CLM-2026-0001', 'UPDATE', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft updated: panelPartNumber, defectCode', '2026-03-12T08:06:00Z'),
    makeHistoryItem(10003, 'CLM-2026-0001', 'UPLOAD_PHOTO', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Photo CLAIM uploaded', '2026-03-12T08:10:00Z'),
    makeHistoryItem(10004, 'CLM-2026-0001', 'UPLOAD_PHOTO', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Photo CLAIM_ZOOM uploaded', '2026-03-12T08:12:00Z'),
    makeHistoryItem(10005, 'CLM-2026-0001', 'UPLOAD_PHOTO', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Photo PANEL_SN uploaded', '2026-03-12T08:14:00Z'),
    makeHistoryItem(10006, 'CLM-2026-0001', 'UPLOAD_PHOTO', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Photo ODF uploaded', '2026-03-12T08:15:00Z'),
    makeHistoryItem(10007, 'CLM-2026-0001', 'UPLOAD_PHOTO', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Photo WO_PANEL uploaded', '2026-03-12T08:18:00Z'),
    makeHistoryItem(10008, 'CLM-2026-0001', 'UPLOAD_PHOTO', 'DRAFT', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Photo WO_PANEL_SN uploaded', '2026-03-12T08:20:00Z'),
    makeHistoryItem(10009, 'CLM-2026-0001', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2026-03-12T08:30:00Z'),
    makeHistoryItem(10010, 'CLM-2026-0001', 'REVIEW', 'SUBMITTED', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Review dimulai', '2026-03-12T10:00:00Z'),
    makeHistoryItem(10011, 'CLM-2026-0001', 'REVIEW_PHOTO', 'IN_REVIEW', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Photo CLAIM verified', '2026-03-12T10:10:00Z'),
    makeHistoryItem(10012, 'CLM-2026-0001', 'REVIEW_PHOTO', 'IN_REVIEW', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Photo CLAIM_ZOOM rejected: Foto terlalu gelap', '2026-03-12T10:12:00Z'),
    makeHistoryItem(10013, 'CLM-2026-0001', 'REVIEW_PHOTO', 'IN_REVIEW', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Photo PANEL_SN verified', '2026-03-12T10:14:00Z'),
    makeHistoryItem(10014, 'CLM-2026-0001', 'REVIEW_PHOTO', 'IN_REVIEW', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Photo ODF - menunggu', '2026-03-12T10:16:00Z'),
    makeHistoryItem(10015, 'CLM-2026-0001', 'REVIEW_PHOTO', 'IN_REVIEW', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Photo WO_PANEL verified', '2026-03-12T10:18:00Z'),
    makeHistoryItem(10016, 'CLM-2026-0001', 'REVIEW_PHOTO', 'IN_REVIEW', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Photo WO_PANEL_SN rejected: SN tidak terbaca', '2026-03-12T10:20:00Z'),
    makeHistoryItem(10017, 'CLM-2026-0001', 'REQUEST_REVISION', 'IN_REVIEW', 'NEED_REVISION', 'USR-003', 'Budi Raharjo', 'QRCC', 'Foto CLAIM_ZOOM dan WO_PANEL_SN ditolak. Harap upload ulang dengan kualitas lebih baik.', '2026-03-12T10:30:00Z')
  ],
  'CLM-2026-0002': [
    makeHistoryItem(20001, 'CLM-2026-0002', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2026-03-10T07:30:00Z'),
    makeHistoryItem(20002, 'CLM-2026-0002', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2026-03-10T08:00:00Z'),
    makeHistoryItem(20003, 'CLM-2026-0002', 'REVIEW', 'SUBMITTED', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Review dimulai', '2026-03-10T10:00:00Z'),
    makeHistoryItem(20004, 'CLM-2026-0002', 'APPROVE', 'IN_REVIEW', 'APPROVED', 'USR-003', 'Budi Raharjo', 'QRCC', 'Semua evidence valid. Klaim disetujui.', '2026-03-15T09:10:00Z')
  ],
  'CLM-2026-0003': [
    makeHistoryItem(30001, 'CLM-2026-0003', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2026-01-20T05:30:00Z'),
    makeHistoryItem(30002, 'CLM-2026-0003', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2026-01-20T07:00:00Z'),
    makeHistoryItem(30003, 'CLM-2026-0003', 'REVIEW', 'SUBMITTED', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Review dimulai', '2026-01-24T11:50:00Z')
  ],
  'CLM-2026-0004': [
    makeHistoryItem(40001, 'CLM-2026-0004', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2025-12-18T09:30:00Z'),
    makeHistoryItem(40002, 'CLM-2026-0004', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2025-12-19T08:40:00Z')
  ],
  'CLM-2026-0005': [
    makeHistoryItem(50001, 'CLM-2026-0005', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2025-11-26T10:30:00Z')
  ],
  'CLM-2025-0006': [
    makeHistoryItem(60001, 'CLM-2025-0006', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2025-10-03T04:10:00Z'),
    makeHistoryItem(60002, 'CLM-2025-0006', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2025-10-03T04:40:00Z'),
    makeHistoryItem(60003, 'CLM-2025-0006', 'REVIEW', 'SUBMITTED', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Review dimulai', '2025-10-04T09:10:00Z'),
    makeHistoryItem(60004, 'CLM-2025-0006', 'APPROVE', 'IN_REVIEW', 'APPROVED', 'USR-003', 'Budi Raharjo', 'QRCC', 'Klaim disetujui.', '2025-10-07T15:40:00Z')
  ],
  'CLM-2025-0007': [
    makeHistoryItem(70001, 'CLM-2025-0007', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2025-09-02T03:05:00Z'),
    makeHistoryItem(70002, 'CLM-2025-0007', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2025-09-02T03:25:00Z'),
    makeHistoryItem(70003, 'CLM-2025-0007', 'REVIEW', 'SUBMITTED', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Review dimulai', '2025-09-03T04:15:00Z'),
    makeHistoryItem(70004, 'CLM-2025-0007', 'APPROVE', 'IN_REVIEW', 'APPROVED', 'USR-003', 'Budi Raharjo', 'QRCC', 'Klaim disetujui.', '2025-09-10T07:10:00Z'),
    makeHistoryItem(70005, 'CLM-2025-0007', 'ARCHIVE', 'APPROVED', 'ARCHIVED', 'USR-003', 'Budi Raharjo', 'QRCC', 'Klaim diarsipkan sesuai SOP retensi.', '2025-10-05T06:20:00Z')
  ],
  'CLM-2025-0008': [
    makeHistoryItem(80001, 'CLM-2025-0008', 'CREATE', '-', 'DRAFT', 'USR-001', 'Sari Dewi', 'CS', 'Draft klaim dibuat', '2025-08-12T12:00:00Z'),
    makeHistoryItem(80002, 'CLM-2025-0008', 'SUBMIT', 'DRAFT', 'SUBMITTED', 'USR-001', 'Sari Dewi', 'CS', 'Klaim diajukan untuk review', '2025-08-12T12:30:00Z'),
    makeHistoryItem(80003, 'CLM-2025-0008', 'REVIEW', 'SUBMITTED', 'IN_REVIEW', 'USR-003', 'Budi Raharjo', 'QRCC', 'Review dimulai', '2025-08-16T13:10:00Z'),
    makeHistoryItem(80004, 'CLM-2025-0008', 'REQUEST_REVISION', 'IN_REVIEW', 'NEED_REVISION', 'USR-003', 'Budi Raharjo', 'QRCC', 'Foto CLAIM_ZOOM tidak valid. Harap upload ulang.', '2025-08-18T14:45:00Z')
  ]
}
