import type { CsNotificationRecord } from '~/utils/cs-mock-data/types'

export const CS_MOCK_NOTIFICATIONS: CsNotificationRecord[] = [
  {
    id: 1,
    notificationCode: 'NTF-2026-001',
    notificationDate: '2026-03-31T10:00:00Z',
    branch: 'JAKARTA',
    status: 'USED',
    modelId: 1,
    vendorId: 1
  },
  {
    id: 2,
    notificationCode: 'NTF-2026-002',
    notificationDate: '2026-03-15T08:00:00Z',
    branch: 'SURABAYA',
    status: 'USED',
    modelId: 5,
    vendorId: 3
  },
  {
    id: 3,
    notificationCode: 'NTF-2026-003',
    notificationDate: '2026-02-20T09:00:00Z',
    branch: 'BANDUNG',
    status: 'NEW',
    modelId: 3,
    vendorId: 2
  },
  {
    id: 4,
    notificationCode: 'NTF-2026-004',
    notificationDate: '2026-01-10T11:00:00Z',
    branch: 'MEDAN',
    status: 'USED',
    modelId: 2,
    vendorId: 1
  },
  {
    id: 5,
    notificationCode: 'NTF-2025-005',
    notificationDate: '2025-12-18T14:00:00Z',
    branch: 'JAKARTA',
    status: 'USED',
    modelId: 5,
    vendorId: 3
  },
  {
    id: 6,
    notificationCode: 'NTF-2025-006',
    notificationDate: '2025-11-25T07:00:00Z',
    branch: 'MAKASSAR',
    status: 'USED',
    modelId: 4,
    vendorId: 2
  },
  {
    id: 7,
    notificationCode: 'NTF-2025-007',
    notificationDate: '2025-10-01T00:00:00Z',
    branch: 'SURABAYA',
    status: 'USED',
    modelId: 1,
    vendorId: 1
  },
  {
    id: 8,
    notificationCode: 'NTF-2025-008',
    notificationDate: '2025-10-15T09:00:00Z',
    branch: 'BANDUNG',
    status: 'USED',
    modelId: 5,
    vendorId: 3
  },
  {
    id: 9,
    notificationCode: 'NTF-2025-009',
    notificationDate: '2025-09-30T23:00:00Z',
    branch: 'JAKARTA',
    status: 'NEW',
    modelId: 2,
    vendorId: 1
  },
  {
    id: 10,
    notificationCode: 'NTF-2025-010',
    notificationDate: '2025-09-15T08:00:00Z',
    branch: 'MEDAN',
    status: 'NEW',
    modelId: 4,
    vendorId: 2
  },
  {
    id: 11,
    notificationCode: 'NTF-2025-011',
    notificationDate: '2025-08-20T10:00:00Z',
    branch: 'MAKASSAR',
    status: 'NEW',
    modelId: 3,
    vendorId: 2
  },
  {
    id: 12,
    notificationCode: 'NTF-2025-012',
    notificationDate: '2025-07-10T12:00:00Z',
    branch: 'SURABAYA',
    status: 'EXPIRED',
    modelId: 1,
    vendorId: 1
  },
  {
    id: 13,
    notificationCode: 'NTF-2025-013',
    notificationDate: '2025-06-15T09:00:00Z',
    branch: 'BANDUNG',
    status: 'EXPIRED',
    modelId: 5,
    vendorId: 3
  }
]
