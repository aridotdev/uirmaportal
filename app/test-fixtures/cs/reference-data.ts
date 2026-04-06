import type { CsDefectRecord, CsProductModelRecord, CsVendorRecord } from '~/test-fixtures/cs/types'

export const CS_MOCK_VENDORS: CsVendorRecord[] = [
  {
    id: 1,
    code: 'MOKA',
    name: 'MOKA Display',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF', 'WO_PANEL', 'WO_PANEL_SN'],
    requiredFields: ['odfNumber', 'version', 'week']
  },
  {
    id: 2,
    code: 'MTC',
    name: 'MTC Panel',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'],
    requiredFields: []
  },
  {
    id: 3,
    code: 'SDP',
    name: 'SDP Electronics',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'],
    requiredFields: []
  }
]

export const CS_MOCK_PRODUCT_MODELS: CsProductModelRecord[] = [
  { id: 1, name: '4T-C43HJ6000I', inch: 43, vendorId: 1 },
  { id: 2, name: '4T-C55HJ6000I', inch: 55, vendorId: 1 },
  { id: 3, name: '4T-C50FJ1I', inch: 50, vendorId: 2 },
  { id: 4, name: '4T-C55FJ1I', inch: 55, vendorId: 2 },
  { id: 5, name: '2T-C-42FD1I', inch: 42, vendorId: 3 }
]

export const CS_MOCK_DEFECTS: CsDefectRecord[] = [
  { id: 1, code: 'DEF-001', name: 'No Display' },
  { id: 2, code: 'DEF-002', name: 'Vertical Line' },
  { id: 3, code: 'DEF-003', name: 'Horizontal Line' },
  { id: 4, code: 'DEF-004', name: 'Broken Panel' },
  { id: 5, code: 'DEF-005', name: 'Flicker' },
  { id: 6, code: 'DEF-006', name: 'Dark Spot' },
  { id: 7, code: 'DEF-007', name: 'Backlight Bleed' }
]

export const CS_MOCK_BRANCHES = [
  'JAKARTA',
  'SURABAYA',
  'MEDAN',
  'BANDUNG',
  'MAKASSAR'
] as const

export const PHOTO_LABEL_MAP: Record<string, string> = {
  CLAIM: 'Main Claim Photo',
  CLAIM_ZOOM: 'Defect Zoom',
  PANEL_SN: 'Panel Part Number',
  ODF: 'ODF Document',
  WO_PANEL: 'Written Off Panel',
  WO_PANEL_SN: 'Written Off Panel SN'
}
