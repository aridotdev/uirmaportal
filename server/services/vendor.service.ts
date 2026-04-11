import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'
import { vendorRepo, type VendorListFilter } from '#server/repositories/vendor.repo'
import type { InsertVendor, UpdateVendor, UpdateVendorStatus } from '#server/database/schema'

type VendorListResult = {
  items: Awaited<ReturnType<typeof vendorRepo.findAll>>
  pagination: ReturnType<typeof buildPaginationMeta>
}

export const vendorService = {
  async getVendors(filter: VendorListFilter): Promise<VendorListResult> {
    const [items, total] = await Promise.all([
      vendorRepo.findAll(filter),
      vendorRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getVendorById(id: number) {
    const item = await vendorRepo.findById(id)
    if (!item) {
      throw new Error(ErrorCode.NOT_FOUND)
    }
    return item
  },

  async createVendor(data: InsertVendor) {
    const existing = await vendorRepo.findByCode(data.code)
    if (existing) {
      throw new Error(ErrorCode.VENDOR_CODE_EXISTS)
    }

    const created = await vendorRepo.insert(data)
    if (!created) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return created
  },

  async updateVendor(id: number, data: UpdateVendor) {
    await this.getVendorById(id)

    const updated = await vendorRepo.update(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  },

  async toggleVendorStatus(id: number, data: UpdateVendorStatus) {
    await this.getVendorById(id)

    const updated = await vendorRepo.updateStatus(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  }
}

export function mapVendorErrorToHttp(error: unknown): { statusCode: number, statusMessage: string } {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.VENDOR_CODE_EXISTS) {
    return { statusCode: 409, statusMessage: 'Vendor code already exists' }
  }
  if (code === ErrorCode.NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Vendor not found' }
  }
  if (code === ErrorCode.VENDOR_HAS_DEPENDENCIES) {
    return { statusCode: 422, statusMessage: 'Vendor has dependencies' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
