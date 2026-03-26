import { getRouterParam, createError } from 'h3'
import { claims } from '~~/server/utils/claim-data'

export default defineEventHandler((event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid claim id'
    })
  }

  const claim = claims.find(item => item.id === id)

  if (!claim) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Claim not found'
    })
  }

  return claim
})
