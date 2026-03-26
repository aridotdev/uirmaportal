import { claims } from '~~/server/utils/claim-data'

export default defineEventHandler(async () => {
  return claims
})
