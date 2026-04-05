import { claims } from '~~/server/utils/claim-data'

export default defineEventHandler(async () => {
  // In a real migration, we might transform the data here
  // to match CsClaimListItem or CsClaimDetail
  return claims
})
