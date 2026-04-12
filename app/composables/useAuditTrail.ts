// app/composables/useAuditTrail.ts
// ──────────────────────────────────────────────
// Audit Trail Composable – Integration-Ready State Management
// ──────────────────────────────────────────────
// Separates raw backend records from display-enriched rows.
// When backend is ready, replace fetchRawRecords() with actual API call.
// All filter, sort, pagination state is managed here for clean page composition.
//
// Source of truth: doc/audit-trail-flow.md, shared/utils/constants.ts

import type { AuditTrailRecord, AuditTrailTableRow } from '~/utils/types'
import type { ClaimHistoryAction, UserRole } from '~~/shared/utils/constants'
import { getMockAuditTrailSorted } from '~/utils/mock-data'
import { generateInitials } from '~/utils/audit-trail-config'

// ──────────────────────────────────────────────
// Enrichment Transform
// ──────────────────────────────────────────────
// Simulates backend join of claimNumber + actorName.
// When backend provides enriched response, this layer becomes a passthrough.

/** Mock enrichment lookup maps (simulates backend join) */
const MOCK_CLAIM_NUMBER_MAP: Record<number, string> = {
  101: 'CLM-2026-0342',
  102: 'CLM-2026-0341',
  103: 'CLM-2026-0340',
  104: 'CLM-2026-0339'
}

const MOCK_ACTOR_NAME_MAP: Record<string, string> = {
  'USR-001': 'Zaina Riddle',
  'USR-002': 'Ahmad Fauzi',
  'USR-003': 'Nadia Putri',
  'USR-004': 'Budi Raharjo',
  'USR-005': 'Siti Aminah'
}

/**
 * Enrich a raw AuditTrailRecord into a display-ready AuditTrailTableRow.
 * When backend API returns enriched data, this function can become identity.
 */
export function enrichAuditRecord(record: AuditTrailRecord): AuditTrailTableRow {
  const actorName = MOCK_ACTOR_NAME_MAP[record.userId] ?? record.userId
  return {
    ...record,
    claimNumber: MOCK_CLAIM_NUMBER_MAP[record.claimId] ?? `CLM-${record.claimId}`,
    actorName,
    actorInitials: generateInitials(actorName)
  }
}

/**
 * Enrich a batch of raw records. Safe for nullable enrichment fields.
 */
export function enrichAuditRecords(records: AuditTrailRecord[]): AuditTrailTableRow[] {
  return records.map(enrichAuditRecord)
}

// ──────────────────────────────────────────────
// Composable
// ──────────────────────────────────────────────

export interface UseAuditTrailOptions {
  /** Initial page size */
  pageSize?: number
  /** Default sort order */
  sortOrder?: 'asc' | 'desc'
}

export function useAuditTrail(options: UseAuditTrailOptions = {}) {
  const {
    pageSize: initialPageSize = 10,
    sortOrder: initialSortOrder = 'desc'
  } = options

  // ── Raw records (simulates backend response) ──
  const rawRecords = ref<AuditTrailRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const totalServerRecords = ref(0)

  // ── Filter state ──
  const searchQuery = ref('')
  const debouncedSearch = ref('')
  const filterAction = ref<ClaimHistoryAction | 'ALL'>('ALL')
  const filterRole = ref<UserRole | 'ALL'>('ALL')
  const filterDateFrom = ref<string>('')
  const filterDateTo = ref<string>('')

  // ── Sort state ──
  const sortOrder = ref<'asc' | 'desc'>(initialSortOrder)

  // ── Pagination state ──
  const pagination = ref({
    pageIndex: 0,
    pageSize: initialPageSize
  })
  const pageSizeOptions = [10, 25, 50]

  // ── Debounce search (250ms) ──
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  watch(searchQuery, (value) => {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      debouncedSearch.value = value
    }, 250)
  }, { immediate: true })

  onScopeDispose(() => {
    if (searchTimer) clearTimeout(searchTimer)
  })

  const normalizedSearch = computed(() => debouncedSearch.value.trim().toLowerCase())

  // ── Display rows (enriched from raw records) ──
  const displayRows = computed<AuditTrailTableRow[]>(() => {
    return enrichAuditRecords(rawRecords.value)
  })

  // ── Sorted rows ──
  const sortedRows = computed(() => {
    return [...displayRows.value].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder.value === 'asc' ? diff : -diff
    })
  })

  // ── Filtered rows ──
  const filteredRows = computed(() => {
    return sortedRows.value.filter((row) => {
      // Search filter
      if (normalizedSearch.value) {
        const haystack = [
          row.claimNumber,
          String(row.claimId),
          row.note ?? '',
          row.userId,
          row.actorName
        ].join(' ').toLowerCase()
        if (!haystack.includes(normalizedSearch.value)) return false
      }

      // Action filter
      if (filterAction.value !== 'ALL' && row.action !== filterAction.value) return false

      // Role filter
      if (filterRole.value !== 'ALL' && row.userRole !== filterRole.value) return false

      // Date range filter
      if (filterDateFrom.value) {
        const rowDate = new Date(row.createdAt).getTime()
        const fromDate = new Date(filterDateFrom.value).getTime()
        if (rowDate < fromDate) return false
      }
      if (filterDateTo.value) {
        const rowDate = new Date(row.createdAt).getTime()
        // End of day for dateTo
        const toDate = new Date(filterDateTo.value).getTime() + 86400000 - 1
        if (rowDate > toDate) return false
      }

      return true
    })
  })

  // ── Computed helpers ──
  const hasActiveFilters = computed(() => {
    return normalizedSearch.value.length > 0
      || filterAction.value !== 'ALL'
      || filterRole.value !== 'ALL'
      || filterDateFrom.value !== ''
      || filterDateTo.value !== ''
  })

  const activeFilterSummary = computed(() => {
    const parts: string[] = []
    if (normalizedSearch.value) parts.push(`search "${searchQuery.value.trim()}"`)
    if (filterAction.value !== 'ALL') parts.push(filterAction.value.replace(/_/g, ' '))
    if (filterRole.value !== 'ALL') parts.push(filterRole.value)
    if (filterDateFrom.value || filterDateTo.value) parts.push('date range')
    if (!parts.length) return 'Showing all audit trail events.'
    return `Filtered by ${parts.join(' + ')}.`
  })

  const visibleFrom = computed(() => {
    if (!filteredRows.value.length) return 0
    return pagination.value.pageIndex * pagination.value.pageSize + 1
  })

  const visibleTo = computed(() => {
    if (!filteredRows.value.length) return 0
    return Math.min(
      filteredRows.value.length,
      (pagination.value.pageIndex + 1) * pagination.value.pageSize
    )
  })

  const pageCount = computed(() => {
    return Math.max(1, Math.ceil(filteredRows.value.length / pagination.value.pageSize))
  })

  // ── Reset pagination on filter change ──
  watch([debouncedSearch, filterAction, filterRole, filterDateFrom, filterDateTo], () => {
    pagination.value.pageIndex = 0
  })

  // ── Data fetch (mock for now, replace with useFetch later) ──
  async function fetchAuditTrail() {
    isLoading.value = true
    error.value = null
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400))

      // Mock: extract raw records from pre-enriched mock data
      // In real backend, response would be AuditTrailRecord[] + enrichment
      const mockData = getMockAuditTrailSorted('desc')
      rawRecords.value = mockData.map(row => ({
        id: row.id,
        claimId: row.claimId,
        action: row.action,
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        userId: row.userId,
        userRole: row.userRole,
        note: row.note,
        createdAt: row.createdAt
      }))
      totalServerRecords.value = rawRecords.value.length
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch audit trail'
      rawRecords.value = []
      totalServerRecords.value = 0
    } finally {
      isLoading.value = false
    }
  }

  function resetFilters() {
    searchQuery.value = ''
    filterAction.value = 'ALL'
    filterRole.value = 'ALL'
    filterDateFrom.value = ''
    filterDateTo.value = ''
  }

  function handlePageSizeChange(nextPageSize: number) {
    pagination.value = {
      pageIndex: 0,
      pageSize: nextPageSize
    }
  }

  return {
    // Raw + display data
    rawRecords: readonly(rawRecords),
    displayRows,
    sortedRows,
    filteredRows,
    totalServerRecords: readonly(totalServerRecords),

    // Loading
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Filter state
    searchQuery,
    filterAction,
    filterRole,
    filterDateFrom,
    filterDateTo,
    hasActiveFilters,
    activeFilterSummary,

    // Sort state
    sortOrder,

    // Pagination state
    pagination,
    pageSizeOptions,
    visibleFrom,
    visibleTo,
    pageCount,

    // Actions
    fetchAuditTrail,
    resetFilters,
    handlePageSizeChange
  }
}
