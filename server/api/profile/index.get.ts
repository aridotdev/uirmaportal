import { mapProfileErrorToHttp, userService } from '#server/services/user.service'
import { requireAuth } from '#server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  try {
    const profile = await userService.getProfile(user.id)
    return {
      success: true,
      data: profile
    }
  } catch (error: unknown) {
    throw createError(mapProfileErrorToHttp(error))
  }
})
