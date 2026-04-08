import { z } from 'zod'
import type {
  InsertNotificationMaster,
  UpdateNotificationMaster,
  UpdateNotificationMasterStatus
} from '#server/database/schema'
import { notificationRepo, type NotificationListFilter } from '#server/repositories/notification.repo'
import { defectRepo } from '#server/repositories/defect.repo'
import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'
import { NOTIFICATION_STATUSES } from '~~/shared/utils/constants'

type NotificationListResult = {
  items: Awaited<ReturnType<typeof notificationRepo.findAll>>
  pagination: ReturnType<typeof buildPaginationMeta>
}

type ValidatedImportRow = NotificationImportRow & { rowNumber: number }

const importRowSchema = z.object({
  notificationCode: z.string().min(1).trim(),
  notificationDate: z.coerce.date(),
  modelId: z.coerce.number().int().positive(),
  branch: z.string().min(1).trim(),
  vendorId: z.coerce.number().int().positive(),
  status: z.enum(NOTIFICATION_STATUSES).default('NEW')
})

export type NotificationImportRow = z.infer<typeof importRowSchema>

type CreateNotificationInput = {
  notificationCode: string
  notificationDate: Date | number
  modelId: number
  branch: string
  vendorId: number
  status: InsertNotificationMaster['status']
  createdBy: string
  updatedBy: string
}

type UpdateNotificationInput = Omit<UpdateNotificationMaster, 'notificationDate'> & {
  notificationDate?: Date | number
}

function computeFiscalFields(date: Date | number) {
  const info = getFiscalPeriodInfo(date)
  return {
    fiscalYear: info.fiscalYear,
    fiscalHalf: info.fiscalHalf,
    fiscalLabel: info.fiscalLabel,
    calendarYear: info.calendarYear,
    calendarMonth: info.calendarMonth
  }
}

function toMs(date: Date | number) {
  return date instanceof Date ? date.getTime() : date
}

export const notificationService = {
  async getNotifications(filter: NotificationListFilter): Promise<NotificationListResult> {
    const [items, total] = await Promise.all([
      notificationRepo.findAll(filter),
      notificationRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getNotificationById(id: number) {
    const item = await notificationRepo.findById(id)
    if (!item) {
      throw new Error(ErrorCode.NOTIFICATION_NOT_FOUND)
    }
    return item
  },

  async lookupByCode(code: string) {
    const found = await notificationRepo.findByCodeWithRelations(code)
    if (!found) {
      throw new Error(ErrorCode.NOTIFICATION_NOT_FOUND)
    }

    const defects = await defectRepo.findAll({ page: 1, limit: 1000, isActive: true })

    return {
      notification: found.notification,
      productModel: found.productModel,
      vendor: found.vendor,
      defects
    }
  },

  async createNotification(data: CreateNotificationInput) {
    const existing = await notificationRepo.findByCode(data.notificationCode)
    if (existing) {
      throw new Error(ErrorCode.NOTIFICATION_CODE_EXISTS)
    }

    const payload: InsertNotificationMaster = {
      notificationCode: data.notificationCode,
      notificationDate: toMs(data.notificationDate),
      modelId: data.modelId,
      branch: data.branch,
      vendorId: data.vendorId,
      status: data.status,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      ...computeFiscalFields(data.notificationDate)
    }

    const created = await notificationRepo.insert(payload)
    if (!created) {
      throw new Error('FAILED_TO_CREATE_NOTIFICATION')
    }

    return created
  },

  async updateNotification(id: number, data: UpdateNotificationInput) {
    await this.getNotificationById(id)

    const payload: UpdateNotificationMaster = {
      ...(() => {
        const { notificationDate: _, ...rest } = data
        return rest
      })()
    }

    if (data.notificationDate !== undefined) {
      payload.notificationDate = toMs(data.notificationDate)
      const fiscalFields = computeFiscalFields(data.notificationDate)
      payload.fiscalYear = fiscalFields.fiscalYear
      payload.fiscalHalf = fiscalFields.fiscalHalf
      payload.fiscalLabel = fiscalFields.fiscalLabel
      payload.calendarYear = fiscalFields.calendarYear
      payload.calendarMonth = fiscalFields.calendarMonth
    }

    const updated = await notificationRepo.update(id, payload)
    if (!updated) {
      throw new Error('FAILED_TO_UPDATE_NOTIFICATION')
    }

    return updated
  },

  async updateNotificationStatus(id: number, data: UpdateNotificationMasterStatus) {
    await this.getNotificationById(id)

    const updated = await notificationRepo.updateStatus(id, data)
    if (!updated) {
      throw new Error('FAILED_TO_UPDATE_NOTIFICATION_STATUS')
    }

    return updated
  },

  async importFromExcel(rows: unknown[], userId: string) {
    const failed: Array<{ row: number, reason: string }> = []
    const validRows: ValidatedImportRow[] = []
    const seenCodes = new Set<string>()

    rows.forEach((raw, index) => {
      const line = index + 1
      const parsed = importRowSchema.safeParse(raw)

      if (!parsed.success) {
        failed.push({ row: line, reason: parsed.error.issues[0]?.message ?? 'Invalid row' })
        return
      }

      const normalizedCode = parsed.data.notificationCode.toUpperCase()
      if (seenCodes.has(normalizedCode)) {
        failed.push({ row: line, reason: 'Duplicate notification code in file' })
        return
      }

      seenCodes.add(normalizedCode)
      validRows.push({ ...parsed.data, notificationCode: normalizedCode, rowNumber: line })
    })

    const insertCandidates: InsertNotificationMaster[] = []

    for (const row of validRows) {
      const existed = await notificationRepo.findByCode(row.notificationCode)
      if (existed) {
        failed.push({ row: row.rowNumber, reason: 'Notification code already exists' })
        continue
      }

      insertCandidates.push({
        notificationCode: row.notificationCode,
        notificationDate: row.notificationDate.getTime(),
        modelId: row.modelId,
        branch: row.branch,
        vendorId: row.vendorId,
        status: row.status,
        createdBy: userId,
        updatedBy: userId,
        ...computeFiscalFields(row.notificationDate)
      })
    }

    await notificationRepo.insertMany(insertCandidates)

    return {
      imported: insertCandidates.length,
      failed
    }
  }
}
