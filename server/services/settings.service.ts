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

const SETTINGS_STORAGE_KEY = 'app:settings'

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

export const settingsService = {
  async getSettings() {
    const storage = useStorage('data')
    const stored = await storage.getItem<AppSettings>(SETTINGS_STORAGE_KEY)
    return stored ?? DEFAULT_SETTINGS
  },

  async updateSettings(input: UpdateSettingsInput, userId: string) {
    const storage = useStorage('data')
    const current = await this.getSettings()
    const next = mergeSettings(current, input, userId)
    await storage.setItem(SETTINGS_STORAGE_KEY, next)
    return next
  }
}

export type { AppSettings, UpdateSettingsInput }
