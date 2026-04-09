import type { InsertProductModel, UpdateProductModel, UpdateProductModelStatus } from '#server/database/schema'
import { productModelRepo, type ProductModelListFilter } from '#server/repositories/product-model.repo'
import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'

type ProductModelListResult = {
  items: Awaited<ReturnType<typeof productModelRepo.findAll>>
  pagination: ReturnType<typeof buildPaginationMeta>
}

export const productModelService = {
  async getProductModels(filter: ProductModelListFilter): Promise<ProductModelListResult> {
    const [items, total] = await Promise.all([
      productModelRepo.findAll(filter),
      productModelRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getProductModelById(id: number) {
    const item = await productModelRepo.findById(id)
    if (!item) {
      throw new Error(ErrorCode.NOT_FOUND)
    }
    return item
  },

  async createProductModel(data: InsertProductModel) {
    const existing = await productModelRepo.findByNameAndVendor(data.name, data.vendorId)
    if (existing) {
      throw new Error(ErrorCode.MODEL_NAME_VENDOR_EXISTS)
    }

    const created = await productModelRepo.insert(data)
    if (!created) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return created
  },

  async updateProductModel(id: number, data: UpdateProductModel) {
    await this.getProductModelById(id)

    if (data.name && data.vendorId) {
      const existing = await productModelRepo.findByNameAndVendor(data.name, data.vendorId)
      if (existing && existing.id !== id) {
        throw new Error(ErrorCode.MODEL_NAME_VENDOR_EXISTS)
      }
    }

    const updated = await productModelRepo.update(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  },

  async toggleProductModelStatus(id: number, data: UpdateProductModelStatus) {
    await this.getProductModelById(id)

    const updated = await productModelRepo.updateStatus(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  }
}
