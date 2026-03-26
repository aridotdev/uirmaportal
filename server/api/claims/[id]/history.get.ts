import { getRouterParam, createError } from 'h3'
import { getHistoryByClaimId } from '~~/server/utils/claim-review-data'

/**
 * GET /api/claims/:id/history
 *
 * Return full claim history (audit trail), ordered newest first.
 */
export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid claim id' })
  }

  return getHistoryByClaimId(id)
})
