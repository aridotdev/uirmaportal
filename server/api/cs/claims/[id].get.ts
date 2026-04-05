import { getRouterParam, createError } from 'h3'
import { claims } from '~~/server/utils/claim-data'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid claim id'
    })
  }

  // Support both number id and claimNumber string
  const claim = claims.find(item => String(item.id) === id || item.claimNumber === id)

  if (!claim) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Claim not found'
    })
  }

  return claim
})
