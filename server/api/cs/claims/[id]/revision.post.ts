import { defineEventHandler, readBody, createError } from 'h3'
import { claims } from '~~/server/utils/claim-data'
import type { ClaimRecord } from '~~/server/utils/claim-data'

export default defineEventHandler(async (event) => {
  const claimId = event.context.params?.id
  const _body = await readBody(event)

  const claim = claims.find((c: ClaimRecord) => c.claimNumber === claimId)

  if (!claim) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Claim not found'
    })
  }

  // Update claim logic (mock)
  return {
    success: true,
    message: 'Revision submitted successfully',
    claimNumber: claimId
  }
})
