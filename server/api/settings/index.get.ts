import { settingsService } from '#server/services/settings.service'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const settings = await settingsService.getSettings()

  return {
    success: true,
    data: settings
  }
})
