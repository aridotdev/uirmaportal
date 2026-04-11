import { mapSettingsErrorToHttp, settingsService } from '#server/services/settings.service'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  try {
    const settings = await settingsService.getSettings()

    return {
      success: true,
      data: settings
    }
  } catch (error: unknown) {
    throw createError(mapSettingsErrorToHttp(error))
  }
})
