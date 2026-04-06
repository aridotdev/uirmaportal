import type {
  ClaimHistoryAction,
  ClaimPhotoStatus,
  ClaimStatus,
  FieldName,
  NotificationStatus,
  PhotoType,
  UserRole
} from '~~/shared/utils/constants'

export interface CsClaimListItem {
  id: string
  claimNumber: string
  notificationCode: string
  modelName: string
  inch: number
  vendorName: string
  branch: string
  defectName: string
  claimStatus: ClaimStatus
  createdAt: string
  updatedAt: string
}

export interface CsClaimDetail extends CsClaimListItem {
  panelPartNumber: string
  ocSerialNo: string
  odfNumber: string | null
  odfVersion: string | null
  odfWeek: string | null
  submittedBy: string
  submittedByName: string
  reviewedBy: string | null
  reviewedByName: string | null
  revisionNote: string | null
  evidences: CsClaimPhoto[]
  history: CsClaimHistoryItem[]
}

export interface CsClaimPhoto {
  id: number
  claimId: string
  photoType: PhotoType
  label: string
  status: ClaimPhotoStatus
  filePath: string
  thumbnailPath: string | null
  rejectReason: string | null
  createdAt: string
  updatedAt: string
}

export interface CsClaimHistoryItem {
  id: number
  claimId: string
  action: ClaimHistoryAction
  fromStatus: ClaimStatus | '-'
  toStatus: ClaimStatus
  userId: string
  userName: string
  userRole: UserRole
  note: string | null
  createdAt: string
}

export interface CsNotificationRecord {
  id: number
  notificationCode: string
  notificationDate: string
  branch: string
  status: NotificationStatus
  modelId: number
  vendorId: number
}

export interface CsNotificationLookupResult {
  notification: {
    id: number
    notificationCode: string
    notificationDate: number
    branch: string
    status: NotificationStatus
  }
  productModel: {
    id: number
    name: string
    inch: number
  } | null
  vendor: {
    id: number
    code: string
    name: string
    requiredPhotos: PhotoType[]
    requiredFields: FieldName[]
  } | null
  defects: Array<{
    id: number
    code: string
    name: string
  }>
}

export interface CsVendorRecord {
  id: number
  code: string
  name: string
  requiredPhotos: PhotoType[]
  requiredFields: FieldName[]
}

export interface CsProductModelRecord {
  id: number
  name: string
  inch: number
  vendorId: number
}

export interface CsDefectRecord {
  id: number
  code: string
  name: string
}

export interface CsReferenceData {
  vendors: CsVendorRecord[]
  productModels: CsProductModelRecord[]
  defects: CsDefectRecord[]
  branches: string[]
  photoLabelMap: Record<string, string>
  vendorRules: Record<string, {
    requiredPhotos: PhotoType[]
    requiredFields: FieldName[]
  }>
}

export interface CsUserProfile {
  id: string
  name: string
  username: string
  email: string
  role: UserRole
  branch: string
  avatarUrl: string
  phone: string
  joinedAt: string
  isActive: boolean
  lastLoginAt: string
}

export interface CsActivityStats {
  totalClaims: number
  approved: number
  pending: number
  revision: number
  draft: number
}

export interface CsCreateClaimPayload {
  notificationCode: string
  modelName: string
  inch: number
  branch: string
  vendorName: string
  defectCode: string
  defectName: string
  panelPartNumber: string
  ocSerialNo: string
  odfNumber?: string
  odfVersion?: string
  odfWeek?: string
  photos: Array<{
    photoType: PhotoType
    label: string
    file: File
  }>
  submitAs: 'DRAFT' | 'SUBMITTED'
}

export interface CsRevisionPayload {
  claimId: string
  revisedFields: Record<string, string>
  replacedPhotos: Array<{
    photoType: PhotoType
    file: File
  }>
  revisionNote: string
}
