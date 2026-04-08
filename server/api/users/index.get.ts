import { z } from 'zod'
import { userService } from '#server/services/user.service'
import { requireRole } from '#server/utils/auth'
import { USER_ROLES } from '~~/shared/utils/constants'

const listUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  role: z.enum(USER_ROLES).optional(),
  branch: z.string().trim().min(1).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform(value => value === 'true')
    .optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const query = await getValidatedQuery(event, listUserQuerySchema.parse)
  const result = await userService.getUsers(query)

  return {
    success: true,
    data: result.items,
    pagination: result.pagination
  }
})
