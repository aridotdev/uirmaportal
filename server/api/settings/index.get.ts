import { mapSettingsErrorToHttp, settingsService } from '#server/services/settings.service'
import { requireRole } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireRole(event, ['ADMIN'])

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
