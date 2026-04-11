import { ErrorCode } from '#server/utils/error-codes'
import { settingsRepo } from '#server/repositories/settings.repo'

type AppSettings = {
  general: {
    maintenanceMode: boolean
  }
  claim: {
    maxPhotosPerClaim: number
    maxPhotoSizeMb: number
  }
  auditTrail: {
    defaultSort: 'asc' | 'desc'
    defaultPageSize: number
  }
  updatedAt: string
  updatedBy: string
}

type UpdateSettingsInput = {
  general?: {
    maintenanceMode?: boolean
  }
  claim?: {
    maxPhotosPerClaim?: number
    maxPhotoSizeMb?: number
  }
  auditTrail?: {
    defaultSort?: 'asc' | 'desc'
    defaultPageSize?: number
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    maintenanceMode: false
  },
  claim: {
    maxPhotosPerClaim: 6,
    maxPhotoSizeMb: 5
  },
  auditTrail: {
    defaultSort: 'desc',
    defaultPageSize: 20
  },
  updatedAt: new Date(0).toISOString(),
  updatedBy: 'system'
}

function mergeSettings(current: AppSettings, input: UpdateSettingsInput, userId: string): AppSettings {
  return {
    general: {
      maintenanceMode: input.general?.maintenanceMode ?? current.general.maintenanceMode
    },
    claim: {
      maxPhotosPerClaim: input.claim?.maxPhotosPerClaim ?? current.claim.maxPhotosPerClaim,
      maxPhotoSizeMb: input.claim?.maxPhotoSizeMb ?? current.claim.maxPhotoSizeMb
    },
    auditTrail: {
      defaultSort: input.auditTrail?.defaultSort ?? current.auditTrail.defaultSort,
      defaultPageSize: input.auditTrail?.defaultPageSize ?? current.auditTrail.defaultPageSize
    },
    updatedAt: new Date().toISOString(),
    updatedBy: userId
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const settingsService = {
  async getSettings() {
    const rows = await settingsRepo.findAll()

    let general = DEFAULT_SETTINGS.general
    let claim = DEFAULT_SETTINGS.claim
    let auditTrail = DEFAULT_SETTINGS.auditTrail
    let latestUpdatedAt = 0
    let latestUpdatedBy = DEFAULT_SETTINGS.updatedBy

    for (const row of rows) {
      const rowUpdatedAt = row.updatedAt instanceof Date ? row.updatedAt.getTime() : 0

      if (rowUpdatedAt >= latestUpdatedAt) {
        latestUpdatedAt = rowUpdatedAt
        latestUpdatedBy = row.updatedBy
      }

      if (!isObject(row.value)) {
        continue
      }

      if (row.key === 'general') {
        general = {
          ...DEFAULT_SETTINGS.general,
          ...(row.value as Partial<AppSettings['general']>)
        }
      }

      if (row.key === 'claim') {
        claim = {
          ...DEFAULT_SETTINGS.claim,
          ...(row.value as Partial<AppSettings['claim']>)
        }
      }

      if (row.key === 'auditTrail') {
        auditTrail = {
          ...DEFAULT_SETTINGS.auditTrail,
          ...(row.value as Partial<AppSettings['auditTrail']>)
        }
      }
    }

    return {
      general,
      claim,
      auditTrail,
      updatedAt: latestUpdatedAt > 0 ? new Date(latestUpdatedAt).toISOString() : DEFAULT_SETTINGS.updatedAt,
      updatedBy: latestUpdatedBy
    }
  },

  async updateSettings(input: UpdateSettingsInput, userId: string) {
    const current = await this.getSettings()

    if (input.general !== undefined) {
      const currentGeneralRow = await settingsRepo.findByKey('general')
      const currentGeneral = isObject(currentGeneralRow?.value)
        ? {
            ...DEFAULT_SETTINGS.general,
            ...(currentGeneralRow.value as Partial<AppSettings['general']>)
          }
        : current.general

      const merged = mergeSettings({ ...current, general: currentGeneral }, { general: input.general }, userId)
      const upserted = await settingsRepo.upsert('general', merged.general, userId)
      if (!upserted) {
        throw new Error(ErrorCode.SETTINGS_UPDATE_FAILED)
      }
    }

    if (input.claim !== undefined) {
      const currentClaimRow = await settingsRepo.findByKey('claim')
      const currentClaim = isObject(currentClaimRow?.value)
        ? {
            ...DEFAULT_SETTINGS.claim,
            ...(currentClaimRow.value as Partial<AppSettings['claim']>)
          }
        : current.claim

      const merged = mergeSettings({ ...current, claim: currentClaim }, { claim: input.claim }, userId)
      const upserted = await settingsRepo.upsert('claim', merged.claim, userId)
      if (!upserted) {
        throw new Error(ErrorCode.SETTINGS_UPDATE_FAILED)
      }
    }

    if (input.auditTrail !== undefined) {
      const currentAuditTrailRow = await settingsRepo.findByKey('auditTrail')
      const currentAuditTrail = isObject(currentAuditTrailRow?.value)
        ? {
            ...DEFAULT_SETTINGS.auditTrail,
            ...(currentAuditTrailRow.value as Partial<AppSettings['auditTrail']>)
          }
        : current.auditTrail

      const merged = mergeSettings({ ...current, auditTrail: currentAuditTrail }, { auditTrail: input.auditTrail }, userId)
      const upserted = await settingsRepo.upsert('auditTrail', merged.auditTrail, userId)
      if (!upserted) {
        throw new Error(ErrorCode.SETTINGS_UPDATE_FAILED)
      }
    }

    return await this.getSettings()
  }
}

export function mapSettingsErrorToHttp(error: unknown): { statusCode: number, statusMessage: string } {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.SETTINGS_UPDATE_FAILED) {
    return { statusCode: 500, statusMessage: 'Failed to update settings' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}

export type { AppSettings, UpdateSettingsInput }
