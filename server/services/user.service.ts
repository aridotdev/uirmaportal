import { ErrorCode } from '#server/utils/error-codes'
import { buildPaginationMeta } from '#server/utils/pagination'
import { userRepo, type UserListFilter } from '#server/repositories/user.repo'
import type { UpdateUserBusiness, UpdateUserStatus } from '#server/database/schema'

type UserListResult = {
  items: Awaited<ReturnType<typeof userRepo.findAll>>
  pagination: ReturnType<typeof buildPaginationMeta>
}

type UpdateProfileInput = {
  name?: string
  email?: string
}

export const userService = {
  async getUsers(filter: UserListFilter): Promise<UserListResult> {
    const [items, total] = await Promise.all([
      userRepo.findAll(filter),
      userRepo.countByFilter(filter)
    ])

    return {
      items,
      pagination: buildPaginationMeta(total, filter.page, filter.limit)
    }
  },

  async getUserById(id: string) {
    const item = await userRepo.findById(id)
    if (!item) {
      throw new Error(ErrorCode.NOT_FOUND)
    }
    return item
  },

  async updateUserBusiness(id: string, data: UpdateUserBusiness) {
    await this.getUserById(id)

    const updated = await userRepo.update(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  },

  async toggleUserStatus(id: string, data: UpdateUserStatus) {
    await this.getUserById(id)

    const updated = await userRepo.updateStatus(id, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  },

  async getProfile(userId: string) {
    return this.getUserById(userId)
  },

  async updateProfile(userId: string, data: UpdateProfileInput) {
    if (data.email) {
      const existing = await userRepo.findByEmail(data.email)
      if (existing && existing.id !== userId) {
        throw new Error(ErrorCode.EMAIL_ALREADY_EXISTS)
      }
    }

    const updated = await userRepo.updateProfile(userId, data)
    if (!updated) {
      throw new Error(ErrorCode.INTERNAL_ERROR)
    }

    return updated
  }
}

export function mapUserErrorToHttp(error: unknown): { statusCode: number, statusMessage: string } {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'User not found' }
  }
  if (code === ErrorCode.EMAIL_ALREADY_EXISTS) {
    return { statusCode: 409, statusMessage: 'Email already exists' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}

export function mapProfileErrorToHttp(error: unknown): { statusCode: number, statusMessage: string } {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Profile not found' }
  }
  if (code === ErrorCode.EMAIL_ALREADY_EXISTS) {
    return { statusCode: 409, statusMessage: 'Email already exists' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
