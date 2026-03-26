import { getRouterParam, createError } from 'h3'
import { getPhotosByClaimId } from '~~/server/utils/claim-review-data'

/**
 * GET /api/claims/:id/photos
 *
 * Return all photos for a given claim.
 */
export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid claim id' })
  }

  return getPhotosByClaimId(id)
})
