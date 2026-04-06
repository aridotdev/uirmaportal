import type { CsUserProfile } from '~/test-fixtures/cs/types'

export const CS_MOCK_CURRENT_USER: CsUserProfile = {
  id: 'USR-001',
  name: 'Sari Dewi',
  username: 'sari.dewi',
  email: 'sari.dewi@sharp.co.id',
  role: 'CS',
  branch: 'Jakarta',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sari',
  phone: '+62 812-9988-7766',
  joinedAt: '2024-06-10T00:00:00Z',
  isActive: true,
  lastLoginAt: '2026-03-26T08:15:00Z'
}

export const CS_MOCK_QRCC_REVIEWER = {
  id: 'USR-003',
  name: 'Budi Raharjo',
  role: 'QRCC' as const
}
