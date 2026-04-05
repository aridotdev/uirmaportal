import type { CsClaimDetail, CsClaimHistoryItem, CsClaimPhoto } from '~/utils/cs-mock-data/types'

export function toIsoString(value: string | number | Date): string {
  return new Date(value).toISOString()
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

export function generateClaimNumber(existingClaims: Array<Pick<CsClaimDetail, 'claimNumber'>>): string {
  const now = new Date()
  const year = now.getFullYear()
  const maxSequence = existingClaims.reduce((max, claim) => {
    const match = claim.claimNumber.match(/^CLM-(\d{4})-(\d{4})$/)
    if (!match || !match[1] || !match[2]) return max
    const claimYear = Number(match[1])
    const claimSeq = Number(match[2])
    if (claimYear !== year) return max
    return claimSeq > max ? claimSeq : max
  }, 0)

  const nextSequence = String(maxSequence + 1).padStart(4, '0')
  return `CLM-${year}-${nextSequence}`
}

export function getMaxPhotoId(claims: CsClaimDetail[]): number {
  return claims.reduce((max, claim) => {
    const claimMax = claim.evidences.reduce((innerMax, photo) => {
      return photo.id > innerMax ? photo.id : innerMax
    }, 0)
    return claimMax > max ? claimMax : max
  }, 0)
}

export function getMaxHistoryId(claims: CsClaimDetail[]): number {
  return claims.reduce((max, claim) => {
    const claimMax = claim.history.reduce((innerMax, history) => {
      return history.id > innerMax ? history.id : innerMax
    }, 0)
    return claimMax > max ? claimMax : max
  }, 0)
}

export function cloneClaimPhotos(photos: CsClaimPhoto[]): CsClaimPhoto[] {
  return photos.map(photo => ({ ...photo }))
}

export function cloneClaimHistory(history: CsClaimHistoryItem[]): CsClaimHistoryItem[] {
  return history.map(entry => ({ ...entry }))
}

export function cloneClaims(claims: CsClaimDetail[]): CsClaimDetail[] {
  return claims.map(claim => ({
    ...claim,
    evidences: cloneClaimPhotos(claim.evidences),
    history: cloneClaimHistory(claim.history)
  }))
}
