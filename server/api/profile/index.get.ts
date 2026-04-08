import { userService } from '#server/services/user.service'
import { requireAuth } from '#server/utils/auth'
import { ErrorCode } from '#server/utils/error-codes'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  try {
    const profile = await userService.getProfile(user.id)
    return {
      success: true,
      data: profile
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message === ErrorCode.NOT_FOUND) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
