// shared/types/database.ts
// ========================================
// DATABASE TYPE DEFINITIONS
// ========================================
// Inferred types from Drizzle schemas
// Provides type safety for database operations

import type {
  // Master tables
  vendor,
  productModel,
  notificationMaster,
  defectMaster,

  // Auth tables (better-auth)
  user,
  session,
  account,
  verification,

  // Transaction tables
  claim,
  claimPhoto,
  claimHistory,
  vendorClaim,
  vendorClaimItem,
  photoReview,
  sequenceGenerator
} from '../../server/database/schema/index'

import type {
  // Insert types
  InferInsertModel,
  // Select types
  InferSelectModel
} from 'drizzle-orm'

// ========================================
// MASTER TABLE TYPES
// ========================================

// Vendor
export type Vendor = InferSelectModel<typeof vendor>
export type NewVendor = InferInsertModel<typeof vendor>

// ProductModel
export type ProductModel = InferSelectModel<typeof productModel>
export type NewProductModel = InferInsertModel<typeof productModel>

// NotificationMaster
export type NotificationMaster = InferSelectModel<typeof notificationMaster>
export type NewNotificationMaster = InferInsertModel<typeof notificationMaster>

// DefectMaster
export type DefectMaster = InferSelectModel<typeof defectMaster>
export type NewDefectMaster = InferInsertModel<typeof defectMaster>

// ========================================
// AUTH TABLE TYPES
// ========================================

// Auth tables (better-auth)
export type User = InferSelectModel<typeof user>
export type NewUser = InferInsertModel<typeof user>

export type Session = InferSelectModel<typeof session>
export type NewSession = InferInsertModel<typeof session>

export type Account = InferSelectModel<typeof account>
export type NewAccount = InferInsertModel<typeof account>

export type Verification = InferSelectModel<typeof verification>
export type NewVerification = InferInsertModel<typeof verification>

// ========================================
// TRANSACTION TABLE TYPES
// ========================================

// Claim
export type Claim = InferSelectModel<typeof claim>
export type NewClaim = InferInsertModel<typeof claim>

// ClaimPhoto
export type ClaimPhoto = InferSelectModel<typeof claimPhoto>
export type NewClaimPhoto = InferInsertModel<typeof claimPhoto>

// ClaimHistory
export type ClaimHistory = InferSelectModel<typeof claimHistory>
export type NewClaimHistory = InferInsertModel<typeof claimHistory>

// VendorClaim
export type VendorClaim = InferSelectModel<typeof vendorClaim>
export type NewVendorClaim = InferInsertModel<typeof vendorClaim>

// VendorClaimItem
export type VendorClaimItem = InferSelectModel<typeof vendorClaimItem>
export type NewVendorClaimItem = InferInsertModel<typeof vendorClaimItem>

// PhotoReview
export type PhotoReview = InferSelectModel<typeof photoReview>
export type NewPhotoReview = InferInsertModel<typeof photoReview>

// SequenceGenerator
export type SequenceGenerator = InferSelectModel<typeof sequenceGenerator>
export type NewSequenceGenerator = InferInsertModel<typeof sequenceGenerator>

// ========================================
// UNION TYPES FOR COMMON OPERATIONS
// ========================================

// All master table types
export type MasterTable
  = | Vendor
    | ProductModel
    | NotificationMaster
    | DefectMaster

// All user-related table types
export type UserTable = User | Session | Account | Verification

// All transaction table types
export type TransactionTable
  = | Claim
    | ClaimPhoto
    | ClaimHistory
    | VendorClaim
    | VendorClaimItem
    | PhotoReview
    | SequenceGenerator

// All table types
export type DatabaseTable = MasterTable | UserTable | TransactionTable

// ========================================
// COMMON TYPE UTILITIES
// ========================================

// Tables with timestamps
export type TimestampedTable
  = | Vendor
    | ProductModel
    | NotificationMaster
    | DefectMaster
    | Claim
    | ClaimPhoto
    | VendorClaim
    | VendorClaimItem

// Tables with status field
export type StatusTable
  = | NotificationMaster
    | Claim
    | VendorClaim

// Tables that can be soft-deleted
export type SoftDeleteTable
  = | Vendor
    | ProductModel
    | DefectMaster

// ========================================
// RELATIONSHIP TYPES
// ========================================

// Vendor with related data
export type VendorWithRelations = Vendor & {
  productModels?: ProductModel[]
  notificationMasters?: NotificationMaster[]
}

// ========================================
// TYPE GUARDS
// ========================================

/**
 * Check if a table has timestamps
 */
export function isTimestampedTable(table: DatabaseTable): table is TimestampedTable {
  return 'createdAt' in table && 'updatedAt' in table
}

/**
 * Check if a table has status field
 */
export function isStatusTable(table: DatabaseTable): table is StatusTable {
  return 'status' in table || 'claimStatus' in table
}

/**
 * Check if a table supports soft delete
 */
export function isSoftDeleteTable(table: DatabaseTable): table is SoftDeleteTable {
  return 'isActive' in table
}

// ========================================
// SEARCH & FILTER TYPES
// ========================================

// Common search filters
export interface DateRangeFilter {
  startDate?: number
  endDate?: number
}

export interface StatusFilter {
  status?: string
}

export interface PaginationFilter {
  limit?: number
  offset?: number
}

// ========================================
// FISCAL / PERIOD-AWARE FILTER TYPES
// ========================================

/**
 * Period-aware filter for report queries.
 * Supports calendar month, fiscal half, fiscal year, and custom range.
 * All report API endpoints should accept this contract.
 */
export interface ReportPeriodFilter {
  /** The filter mode — determines which range to apply */
  mode: import('../utils/fiscal').PeriodFilterMode
  /** For 'custom' mode: ISO date string */
  customStartDate?: string
  /** For 'custom' mode: ISO date string */
  customEndDate?: string
  /** Which date field to filter on (default: createdAt) */
  dateField?: 'createdAt' | 'submittedAt' | 'notificationDate' | 'vendorDecisionAt' | 'updatedAt'
}

/**
 * Resolved date range after period filter is applied.
 * Used internally by backend query builders.
 */
export interface ResolvedPeriodRange {
  startDate: number // Unix timestamp ms
  endDate: number // Unix timestamp ms
  label: string
  fiscalLabel?: string // e.g. "2025LH"
  fiscalYear?: number
  fiscalHalf?: import('../utils/fiscal').FiscalHalf
}

// Combined filter types
export type ClaimFilter = DateRangeFilter
  & StatusFilter
  & PaginationFilter & {
    claimNumber?: string
    vendorId?: number
    submittedBy?: number
    branch?: string
    period?: ReportPeriodFilter
  }

export type VendorFilter = StatusFilter
  & PaginationFilter & {
    name?: string
  }

export type UserFilter = StatusFilter
  & PaginationFilter & {
    role?: string
    branch?: string
    name?: string
  }

export type VendorClaimFilter = DateRangeFilter
  & StatusFilter
  & PaginationFilter & {
    vendorId?: number
    period?: ReportPeriodFilter
  }

export type ReportFilter = ReportPeriodFilter & {
  branch?: string
  vendorId?: number
  defectCode?: string
  claimStatus?: string
  vendorDecision?: string
  granularity?: import('../utils/fiscal').PeriodGranularity
}

// ========================================
// API RESPONSE TYPES
// ========================================

// Standard API response structure
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Paginated response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
