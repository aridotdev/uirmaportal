import type {
  CsActivityStats,
  CsClaimDetail,
  CsClaimListItem,
  CsCreateClaimPayload,
  CsNotificationLookupResult,
  CsReferenceData,
  CsRevisionPayload,
  CsUserProfile
} from '~/test-fixtures/cs'
import {
  CS_MOCK_BRANCHES,
  CS_MOCK_CURRENT_USER,
  CS_MOCK_DEFECTS,
  CS_MOCK_PRODUCT_MODELS,
  CS_MOCK_VENDORS,
  PHOTO_LABEL_MAP
} from '~/test-fixtures/cs'

export function useCsStore() {
  const currentUser: CsUserProfile = CS_MOCK_CURRENT_USER
  const {
    data: claimsResponse,
    refresh: refreshClaims,
    status: claimsStatus,
    error: claimsError
  } = useFetch<CsClaimListItem[]>('/api/cs/claims', {
    default: () => []
  })

  const claims = computed<CsClaimListItem[]>(() => claimsResponse.value ?? [])
  const isClaimsLoading = computed(() => claimsStatus.value === 'pending')
  const claimsFetchError = computed(() => claimsError.value)

  const mutationState = reactive({
    creating: false,
    submitting: false,
    revising: false,
    lastError: ''
  })

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
      const response = await $fetch<{ data?: CsNotificationLookupResult } | CsNotificationLookupResult>(`/api/cs/notifications/lookup/${normalizedCode}`)
      const withData = response as { data?: CsNotificationLookupResult }
      return withData.data ?? (response as CsNotificationLookupResult)
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
    mutationState.creating = true
    mutationState.lastError = ''
    try {
      const { photos, ...payloadWithoutFiles } = payload
      const formData = new FormData()
      formData.append('data', JSON.stringify(payloadWithoutFiles))

      for (const photo of photos) {
        formData.append('photos', photo.file, `${photo.photoType}.jpg`)
      }

      const response = await $fetch<{ data?: CsClaimDetail } | CsClaimDetail>('/api/cs/claims', {
        method: 'POST',
        body: formData
      })

      const responseWithData = response as { data?: CsClaimDetail }
      const createdClaim: CsClaimDetail = responseWithData.data ?? (response as CsClaimDetail)
      await refreshClaims()
      await refreshNuxtData('/api/cs/claims')
      if (createdClaim.claimNumber) {
        await refreshNuxtData(`/api/cs/claims/${createdClaim.claimNumber}`)
      }
      return createdClaim
    } catch (e) {
      mutationState.lastError = e instanceof Error ? e.message : 'Failed to create claim'
      throw e
    } finally {
      mutationState.creating = false
    }
  }

  async function submitClaim(claimId: string): Promise<boolean> {
    mutationState.submitting = true
    mutationState.lastError = ''
    try {
      const endpoint: string = `/api/cs/claims/${claimId}/submit`
      await $fetch(endpoint, {
        method: 'POST'
      })
      await refreshClaims()
      await refreshNuxtData('/api/cs/claims')
      await refreshNuxtData(`/api/cs/claims/${claimId}`)
      return true
    } catch (e) {
      mutationState.lastError = e instanceof Error ? e.message : 'Failed to submit claim'
      console.error('Error submitting claim:', e)
      return false
    } finally {
      mutationState.submitting = false
    }
  }

  async function submitRevision(payload: CsRevisionPayload): Promise<boolean> {
    mutationState.revising = true
    mutationState.lastError = ''
    try {
      await $fetch(`/api/cs/claims/${payload.claimId}/revision`, {
        method: 'POST',
        body: payload
      })
      await refreshClaims()
      await refreshNuxtData('/api/cs/claims')
      await refreshNuxtData(`/api/cs/claims/${payload.claimId}`)
      return true
    } catch (e) {
      mutationState.lastError = e instanceof Error ? e.message : 'Failed to submit revision'
      console.error('Error submitting revision:', e)
      return false
    } finally {
      mutationState.revising = false
    }
  }

  return {
    claims,
    refreshClaims,
    isClaimsLoading,
    claimsFetchError,
    activityStats,
    getClaimDetail,
    lookupNotification,
    currentUser,
    referenceData,
    mutationState,
    createClaim,
    submitClaim,
    submitRevision
  }
}
