import type { ClaimStatus, InsertClaimHistory, UserRole } from '#server/database/schema'

export type BuildHistoryInput = {
  claimId: number
  action: InsertClaimHistory['action']
  fromStatus: ClaimStatus
  toStatus: ClaimStatus
  note?: string
  user: { id: string, role?: UserRole }
}

export function buildHistory(input: BuildHistoryInput, defaultRole: UserRole): InsertClaimHistory {
  return {
    claimId: input.claimId,
    action: input.action,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    userId: input.user.id,
    userRole: input.user.role ?? defaultRole,
    note: input.note
  }
}
