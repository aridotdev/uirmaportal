import type { PhotoType } from '~~/shared/utils/constants'
import type { CsClaimPhoto } from '~/test-fixtures/cs/types'
import { PHOTO_LABEL_MAP } from '~/test-fixtures/cs/reference-data'

export const PHOTO_URLS: Record<PhotoType, string> = {
  CLAIM: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800',
  CLAIM_ZOOM: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
  PANEL_SN: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
  ODF: 'https://images.unsplash.com/photo-1618044733300-9472154093ee?auto=format&fit=crop&q=80&w=800',
  WO_PANEL: 'https://images.unsplash.com/photo-1536335980403-4dbdb4b78000?auto=format&fit=crop&q=80&w=800',
  WO_PANEL_SN: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=800'
}

const VENDOR_PHOTO_TYPES = {
  MOKA: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF', 'WO_PANEL', 'WO_PANEL_SN'],
  MTC: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'],
  SDP: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF']
} as const

function makePhotos(
  claimId: string,
  createdAt: string,
  updatedAt: string,
  vendor: keyof typeof VENDOR_PHOTO_TYPES,
  statusMap: Partial<Record<(typeof VENDOR_PHOTO_TYPES)[keyof typeof VENDOR_PHOTO_TYPES][number], CsClaimPhoto['status']>>,
  rejectReasonMap: Partial<Record<(typeof VENDOR_PHOTO_TYPES)[keyof typeof VENDOR_PHOTO_TYPES][number], string>>,
  startId: number
): CsClaimPhoto[] {
  return VENDOR_PHOTO_TYPES[vendor].map((photoType, index) => ({
    id: startId + index,
    claimId,
    photoType,
    label: PHOTO_LABEL_MAP[photoType] ?? photoType,
    status: statusMap[photoType] ?? 'PENDING',
    filePath: PHOTO_URLS[photoType],
    thumbnailPath: null,
    rejectReason: rejectReasonMap[photoType] ?? null,
    createdAt,
    updatedAt
  }))
}

export const CS_MOCK_CLAIM_PHOTOS: Record<string, CsClaimPhoto[]> = {
  'CLM-2026-0001': makePhotos(
    'CLM-2026-0001',
    '2026-03-12T08:00:00Z',
    '2026-03-16T10:15:00Z',
    'MOKA',
    {
      CLAIM: 'VERIFIED',
      CLAIM_ZOOM: 'REJECT',
      PANEL_SN: 'VERIFIED',
      ODF: 'PENDING',
      WO_PANEL: 'VERIFIED',
      WO_PANEL_SN: 'REJECT'
    },
    {
      CLAIM_ZOOM: 'Foto terlalu gelap dan buram. Barcode tidak terbaca.',
      WO_PANEL_SN: 'Serial number tidak terlihat jelas. Harap foto ulang dengan fokus.'
    },
    1001
  ),
  'CLM-2026-0002': makePhotos(
    'CLM-2026-0002',
    '2026-03-10T07:30:00Z',
    '2026-03-15T09:10:00Z',
    'SDP',
    {
      CLAIM: 'VERIFIED',
      CLAIM_ZOOM: 'VERIFIED',
      PANEL_SN: 'VERIFIED',
      ODF: 'VERIFIED'
    },
    {},
    2001
  ),
  'CLM-2026-0003': makePhotos(
    'CLM-2026-0003',
    '2026-01-20T05:30:00Z',
    '2026-01-24T11:50:00Z',
    'MTC',
    {
      CLAIM: 'VERIFIED',
      CLAIM_ZOOM: 'PENDING',
      PANEL_SN: 'VERIFIED',
      ODF: 'PENDING'
    },
    {},
    3001
  ),
  'CLM-2026-0004': makePhotos(
    'CLM-2026-0004',
    '2025-12-18T09:30:00Z',
    '2025-12-19T08:40:00Z',
    'MOKA',
    {
      CLAIM: 'PENDING',
      CLAIM_ZOOM: 'PENDING',
      PANEL_SN: 'PENDING',
      ODF: 'PENDING',
      WO_PANEL: 'PENDING',
      WO_PANEL_SN: 'PENDING'
    },
    {},
    4001
  ),
  'CLM-2026-0005': makePhotos(
    'CLM-2026-0005',
    '2025-11-26T10:30:00Z',
    '2025-11-26T10:30:00Z',
    'SDP',
    {
      CLAIM: 'PENDING',
      CLAIM_ZOOM: 'PENDING',
      PANEL_SN: 'PENDING',
      ODF: 'PENDING'
    },
    {},
    5001
  ),
  'CLM-2025-0006': makePhotos(
    'CLM-2025-0006',
    '2025-10-03T04:10:00Z',
    '2025-10-07T15:40:00Z',
    'MTC',
    {
      CLAIM: 'VERIFIED',
      CLAIM_ZOOM: 'VERIFIED',
      PANEL_SN: 'VERIFIED',
      ODF: 'VERIFIED'
    },
    {},
    6001
  ),
  'CLM-2025-0007': makePhotos(
    'CLM-2025-0007',
    '2025-09-02T03:05:00Z',
    '2025-10-05T06:20:00Z',
    'MOKA',
    {
      CLAIM: 'VERIFIED',
      CLAIM_ZOOM: 'VERIFIED',
      PANEL_SN: 'VERIFIED',
      ODF: 'VERIFIED',
      WO_PANEL: 'VERIFIED',
      WO_PANEL_SN: 'VERIFIED'
    },
    {},
    7001
  ),
  'CLM-2025-0008': makePhotos(
    'CLM-2025-0008',
    '2025-08-12T12:00:00Z',
    '2025-08-18T14:45:00Z',
    'SDP',
    {
      CLAIM: 'VERIFIED',
      CLAIM_ZOOM: 'REJECT',
      PANEL_SN: 'VERIFIED',
      ODF: 'PENDING'
    },
    {
      CLAIM_ZOOM: 'Area defect tidak terfokus. Mohon foto ulang lebih dekat.'
    },
    8001
  )
}
