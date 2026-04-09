import type { InsertDefectMaster, UpdateDefectMaster, UpdateDefectMasterStatus } from '#server/database/schema'
import { defectRepo, type DefectListFilter } from '#server/repositories/defect.repo'
import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'

type DefectListResult = {
  items: Awaited<ReturnType<typeof defectRepo.findAll>>
  pagination: ReturnType<typeof buildPaginationMeta>
}

export const defectService = {
  async getDefects(filter: DefectListFilter): Promise<DefectListResult> {
    const [items, total] = await Promise.all([
      defectRepo.findAll(filter),
      defectRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getDefectById(id: number) {
    const item = await defectRepo.findById(id)
    if (!item) {
      throw new Error(ErrorCode.NOT_FOUND)
    }
    return item
  },

  async createDefect(data: InsertDefectMaster) {
    const existing = await defectRepo.findByCode(data.code)
    if (existing) {
      throw new Error(ErrorCode.DEFECT_CODE_EXISTS)
    }

    const created = await defectRepo.insert(data)
    if (!created) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return created
  },

  async updateDefect(id: number, data: UpdateDefectMaster) {
    await this.getDefectById(id)

    if (data.code) {
      const existing = await defectRepo.findByCode(data.code)
      if (existing && existing.id !== id) {
        throw new Error(ErrorCode.DEFECT_CODE_EXISTS)
      }
    }

    const updated = await defectRepo.update(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  },

  async toggleDefectStatus(id: number, data: UpdateDefectMasterStatus) {
    await this.getDefectById(id)

    const updated = await defectRepo.updateStatus(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  }
}
