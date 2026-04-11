import db from '#server/database'
import type {
  UserRole,
  VendorDecision,
  VendorClaimStatus
} from '#server/database/schema'
import { claimRepo } from '#server/repositories/claim.repo'
import { claimHistoryRepo } from '#server/repositories/claim-history.repo'
import { vendorRepo } from '#server/repositories/vendor.repo'
import { vendorClaimRepo, type VendorClaimListFilter } from '#server/repositories/vendor-claim.repo'
import { vendorClaimItemRepo } from '#server/repositories/vendor-claim-item.repo'
import { sequenceService } from '#server/services/sequence.service'
import { buildHistory } from '#server/utils/claim-history'
import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'
import { canTransitionVendorClaimStatus } from '#server/utils/status-transitions'
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'

type AuthUser = {
  id: string
  role?: UserRole
}

function ensureClaimFound<T>(value: T | null): T {
  if (!value) {
    throw new Error(ErrorCode.CLAIM_NOT_FOUND)
  }
  return value
}

function ensureVendorClaimFound<T>(value: T | null): T {
  if (!value) {
    throw new Error(ErrorCode.VENDOR_CLAIM_NOT_FOUND)
  }
  return value
}

export const vendorClaimService = {
  async getVendorClaims(filter: VendorClaimListFilter) {
    const [items, total] = await Promise.all([
      vendorClaimRepo.findAll(filter),
      vendorClaimRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getVendorClaimDetail(id: number) {
    const detail = await vendorClaimRepo.findByIdWithItems(id)
    return ensureVendorClaimFound(detail)
  },

  async getAvailableClaimsForBatch(vendorId: number, periodFilter?: { fiscalLabel?: string, fiscalYear?: number }) {
    const available = await claimRepo.findApprovedByVendorNotInBatch(vendorId)

    if (!periodFilter?.fiscalLabel && typeof periodFilter?.fiscalYear !== 'number') {
      return available
    }

    return available.filter((row) => {
      if (periodFilter.fiscalLabel && row.claim.fiscalLabel !== periodFilter.fiscalLabel) {
        return false
      }

      if (typeof periodFilter.fiscalYear === 'number' && row.claim.fiscalYear !== periodFilter.fiscalYear) {
        return false
      }

      return true
    })
  },

  async generateVendorClaim(payload: { vendorId: number, claimIds: number[] }, user: AuthUser) {
    const uniqueClaimIds = Array.from(new Set(payload.claimIds))
    if (uniqueClaimIds.length === 0) {
      throw new Error(ErrorCode.NO_APPROVED_CLAIMS_FOR_BATCH)
    }

    const selectedVendor = await vendorRepo.findById(payload.vendorId)
    if (!selectedVendor) {
      throw new Error(ErrorCode.NOT_FOUND)
    }

    const claims = await Promise.all(uniqueClaimIds.map(async (claimId) => {
      return await claimRepo.findById(claimId)
    }))

    if (claims.some(item => item === null)) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    const claimRows = claims.filter(item => item !== null)

    for (const item of claimRows) {
      if (item.vendorId !== payload.vendorId) {
        throw new Error(ErrorCode.VALIDATION_FAILED)
      }

      if (item.claimStatus !== 'APPROVED') {
        throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
      }
    }

    const availableClaims = await claimRepo.findApprovedByVendorNotInBatch(payload.vendorId)
    const availableClaimIds = new Set(availableClaims.map(item => item.claim.id))
    const hasAlreadyBatchedClaim = uniqueClaimIds.some(claimId => !availableClaimIds.has(claimId))

    if (hasAlreadyBatchedClaim) {
      throw new Error(ErrorCode.CLAIM_ALREADY_IN_VENDOR_BATCH)
    }

    const now = new Date()
    const fiscal = getFiscalPeriodInfo(now)
    const vendorClaimNo = await sequenceService.generateVendorClaimNumber()

    const reportSnapshot = {
      vendorId: payload.vendorId,
      vendorCode: selectedVendor.code,
      vendorName: selectedVendor.name,
      generatedAt: now.toISOString(),
      totalItems: claimRows.length,
      claimIds: uniqueClaimIds,
      claimNumbers: claimRows.map(item => item.claimNumber)
    }

    return await db.transaction(async (tx) => {
      const created = await vendorClaimRepo.insert({
        vendorClaimNo,
        vendorId: payload.vendorId,
        submittedAt: now,
        reportSnapshot,
        status: 'CREATED',
        createdBy: user.id,
        updatedBy: user.id,
        fiscalYear: fiscal.fiscalYear,
        fiscalHalf: fiscal.fiscalHalf,
        fiscalLabel: fiscal.fiscalLabel,
        calendarYear: fiscal.calendarYear,
        calendarMonth: fiscal.calendarMonth
      }, tx)

      const createdVendorClaim = ensureVendorClaimFound(created)

      await vendorClaimItemRepo.insertMany(
        uniqueClaimIds.map(claimId => ({
          vendorClaimId: createdVendorClaim.id,
          claimId,
          vendorDecision: 'PENDING'
        })),
        tx
      )

      for (const item of claimRows) {
        await claimHistoryRepo.insert(buildHistory({
          claimId: item.id,
          action: 'GENERATE_VENDOR_CLAIM',
          fromStatus: item.claimStatus,
          toStatus: item.claimStatus,
          note: `Added to vendor claim batch ${createdVendorClaim.vendorClaimNo}`,
          user
        }, 'QRCC'), tx)
      }

      return createdVendorClaim
    })
  },

  async updateVendorDecision(vendorClaimId: number, itemId: number, decision: {
    vendorDecision: VendorDecision
    compensation?: number
    rejectReason?: string
  }, user: AuthUser) {
    const item = await vendorClaimItemRepo.findById(itemId)
    if (!item || item.vendorClaimId !== vendorClaimId) {
      throw new Error(ErrorCode.NOT_FOUND)
    }

    const vendorClaimHeader = await vendorClaimRepo.findById(vendorClaimId)
    if (!vendorClaimHeader) {
      throw new Error(ErrorCode.VENDOR_CLAIM_NOT_FOUND)
    }

    if (decision.vendorDecision === 'REJECTED' && (!decision.rejectReason || decision.rejectReason.trim().length === 0)) {
      throw new Error(ErrorCode.VALIDATION_FAILED)
    }

    if (decision.vendorDecision === 'ACCEPTED' && typeof decision.compensation !== 'number') {
      throw new Error(ErrorCode.VALIDATION_FAILED)
    }

    const now = new Date()

    const updated = await db.transaction(async (tx) => {
      const updatedItem = await vendorClaimItemRepo.update(itemId, {
        vendorDecision: decision.vendorDecision,
        compensation: decision.vendorDecision === 'ACCEPTED' ? decision.compensation : null,
        rejectReason: decision.vendorDecision === 'REJECTED' ? decision.rejectReason ?? null : null,
        vendorDecisionBy: user.id,
        vendorDecisionAt: now
      }, tx)

      const pendingCount = await vendorClaimItemRepo.countPendingByVendorClaimId(vendorClaimId, tx)
      const nextStatus: VendorClaimStatus = pendingCount > 0 ? 'PROCESSING' : 'COMPLETED'

      if (!canTransitionVendorClaimStatus(vendorClaimHeader.status, nextStatus)) {
        throw new Error(ErrorCode.INVALID_STATUS_TRANSITION)
      }

      await vendorClaimRepo.update(vendorClaimId, {
        status: nextStatus,
        updatedBy: user.id
      }, tx)

      const itemClaim = await ensureClaimFound(await claimRepo.findById(item.claimId))
      await claimHistoryRepo.insert(buildHistory({
        claimId: item.claimId,
        action: 'UPDATE_VENDOR_DECISION',
        fromStatus: itemClaim.claimStatus,
        toStatus: itemClaim.claimStatus,
        note: `Vendor decision set to ${decision.vendorDecision}`,
        user
      }, 'QRCC'), tx)

      return updatedItem
    })

    if (!updated) {
      throw new Error(ErrorCode.NOT_FOUND)
    }

    return updated
  },

  async exportToExcel(vendorClaimId: number) {
    const detail = await this.getVendorClaimDetail(vendorClaimId)

    return {
      vendorClaimNo: detail.vendorClaim.vendorClaimNo,
      generatedAt: detail.vendorClaim.submittedAt,
      rows: detail.items.map(row => ({
        claimNumber: row.claim.claimNumber,
        branch: row.claim.branch,
        modelId: row.claim.modelId,
        defectCode: row.claim.defectCode,
        vendorDecision: row.item.vendorDecision,
        compensation: row.item.compensation,
        rejectReason: row.item.rejectReason
      }))
    }
  }
}

export function mapVendorClaimErrorToHttp(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.VENDOR_CLAIM_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Vendor claim not found' }
  }
  if (code === ErrorCode.CLAIM_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Claim not found' }
  }
  if (code === ErrorCode.CLAIM_ALREADY_IN_VENDOR_BATCH) {
    return { statusCode: 409, statusMessage: 'One or more claims are already assigned to another vendor batch' }
  }
  if (code === ErrorCode.NO_APPROVED_CLAIMS_FOR_BATCH) {
    return { statusCode: 422, statusMessage: 'No approved claims available for batch generation' }
  }
  if (code === ErrorCode.INVALID_STATUS_TRANSITION) {
    return { statusCode: 422, statusMessage: 'Invalid claim status for vendor batch operation' }
  }
  if (code === ErrorCode.VALIDATION_FAILED) {
    return { statusCode: 400, statusMessage: 'Validation failed' }
  }
  if (code === ErrorCode.NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Resource not found' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
