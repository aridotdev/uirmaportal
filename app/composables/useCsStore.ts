import type {
  CsActivityStats,
  CsClaimDetail,
  CsClaimListItem,
  CsCreateClaimPayload,
  CsNotificationLookupResult,
  CsReferenceData,
  CsRevisionPayload,
  CsUserProfile
} from '~/utils/cs-mock-data'
import {
  CS_MOCK_BRANCHES,
  CS_MOCK_CLAIMS,
  CS_MOCK_CURRENT_USER,
  CS_MOCK_DEFECTS,
  CS_MOCK_PRODUCT_MODELS,
  CS_MOCK_VENDORS,
  PHOTO_LABEL_MAP
} from '~/utils/cs-mock-data'

export function useCsStore() {
  const currentUser: CsUserProfile = CS_MOCK_CURRENT_USER
  const claims = ref<CsClaimListItem[]>(
    CS_MOCK_CLAIMS.map(item => ({ ...item }))
  )

  const activityStats = computed<CsActivityStats>(() => {
    const all = claims.value
    return {
      totalClaims: all.length,
      approved: all.filter(item => item.claimStatus === 'APPROVED').length,
      pending: all.filter(item => item.claimStatus === 'SUBMITTED' || item.claimStatus === 'IN_REVIEW').length,
      revision: all.filter(item => item.claimStatus === 'NEED_REVISION').length,
      draft: all.filter(item => item.claimStatus === 'DRAFT').length
    }
  })

  // Data fetching will be handled by useFetch inside pages,
  // but we can provide helper functions that use $fetch

  async function getClaimDetail(claimId: string): Promise<CsClaimDetail | null> {
    try {
      return await $fetch<CsClaimDetail>(`/api/cs/claims/${claimId}`)
    } catch (e) {
      console.error('Error fetching claim detail:', e)
      return null
    }
  }

  async function lookupNotification(code: string): Promise<CsNotificationLookupResult | null> {
    const normalizedCode = code.trim().toUpperCase()
    try {
      return await $fetch<CsNotificationLookupResult>(`/api/cs/notifications/${normalizedCode}`)
    } catch (e) {
      console.error('Error looking up notification:', e)
      return null
    }
  }

  const referenceData: CsReferenceData = {
    vendors: CS_MOCK_VENDORS.map(item => ({ ...item })),
    productModels: CS_MOCK_PRODUCT_MODELS.map(item => ({ ...item })),
    defects: CS_MOCK_DEFECTS.map(item => ({ ...item })),
    branches: [...CS_MOCK_BRANCHES],
    photoLabelMap: PHOTO_LABEL_MAP,
    vendorRules: CS_MOCK_VENDORS.reduce((acc, vendor) => {
      acc[vendor.code] = {
        requiredPhotos: [...vendor.requiredPhotos],
        requiredFields: [...vendor.requiredFields]
      }
      return acc
    }, {} as CsReferenceData['vendorRules'])
  }

  async function createClaim(payload: CsCreateClaimPayload): Promise<CsClaimDetail> {
    return await $fetch<CsClaimDetail>('/api/cs/claims', {
      method: 'POST',
      body: payload
    })
  }

  async function submitClaim(claimId: string): Promise<boolean> {
    try {
      const endpoint: string = `/api/cs/claims/${claimId}/submit`
      await $fetch(endpoint, {
        method: 'POST'
      })
      return true
    } catch (e) {
      console.error('Error submitting claim:', e)
      return false
    }
  }

  async function submitRevision(payload: CsRevisionPayload): Promise<boolean> {
    try {
      await $fetch(`/api/cs/claims/${payload.claimId}/revision`, {
        method: 'POST',
        body: payload
      })
      return true
    } catch (e) {
      console.error('Error submitting revision:', e)
      return false
    }
  }

  return {
    claims,
    activityStats,
    getClaimDetail,
    lookupNotification,
    currentUser,
    referenceData,
    createClaim,
    submitClaim,
    submitRevision
  }
}
