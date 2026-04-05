<script setup lang="ts">
import { h } from 'vue'
import type { Component } from 'vue'
import type { ClaimStatus } from '~~/shared/utils/constants'
import type { FiscalHalf, PeriodFilterMode } from '~~/shared/utils/fiscal'
import {
  getFiscalHalfRange,
  getFiscalPeriodInfo,
  parseFiscalLabel,
  resolvePeriodFilter
} from '~~/shared/utils/fiscal'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'
import {
  Bell,
  ArrowUpDown,
  ClipboardList,
  ExternalLink,
  Eye,
  FileText,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  FilterX
} from 'lucide-vue-next'
import type { CsClaimListItem } from '~/utils/cs-mock-data'

type Status = ClaimStatus
type StatusFilter = 'ALL' | Status
type DateFieldFilter = 'LAST_UPDATE' | 'CREATED_AT'
type PeriodPresetFilter = 'ALL' | Exclude<PeriodFilterMode, 'custom'>
type CustomPeriodType = 'month' | 'fiscal' | 'year'

definePageMeta({
  layout: 'cs'
})

// ── Month / Fiscal / Year option generators ──

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const monthSelectOptions = computed(() => {
  const now = new Date()
  const items: { label: string, value: string }[] = []
  // Last 24 months
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const lbl = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
    items.push({ label: lbl, value: val })
  }
  return items
})

const fiscalSelectOptions = computed(() => {
  const info = getFiscalPeriodInfo(new Date())
  const items: { label: string, value: string }[] = []
  let fy = info.fiscalYear
  let half: FiscalHalf = info.fiscalHalf
  // Last 8 fiscal halves
  for (let i = 0; i < 8; i++) {
    const val = `${fy}${half}`
    items.push({ label: val, value: val })
    if (half === 'FH') {
      half = 'LH'
      fy -= 1
    } else {
      half = 'FH'
    }
  }
  return items
})

const yearSelectOptions = computed(() => {
  const now = new Date()
  const items: { label: string, value: string }[] = []
  // Last 6 years
  for (let i = 0; i < 6; i++) {
    const y = now.getFullYear() - i
    items.push({ label: `${y}`, value: `${y}` })
  }
  return items
})

// ── Filter state ──

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('ALL')
const vendorFilter = ref('ALL')
const defectFilter = ref('ALL')
const dateFieldFilter = ref<DateFieldFilter>('LAST_UPDATE')
const periodPresetFilter = ref<PeriodPresetFilter>('ALL')
const customPeriodType = ref<CustomPeriodType>('month')
const customMonthFrom = ref('')
const customMonthTo = ref('')
const customFiscalFrom = ref('')
const customFiscalTo = ref('')
const customYearFrom = ref('')
const customYearTo = ref('')
const isAdvanceFilterOpen = ref(false)

// Draft state (applied on "Apply")
const draftVendorFilter = ref('ALL')
const draftDefectFilter = ref('ALL')
const draftDateFieldFilter = ref<DateFieldFilter>('LAST_UPDATE')
const draftPeriodPresetFilter = ref<PeriodPresetFilter>('ALL')
const draftCustomPeriodType = ref<CustomPeriodType>('month')
const draftCustomMonthFrom = ref('')
const draftCustomMonthTo = ref('')
const draftCustomFiscalFrom = ref('')
const draftCustomFiscalTo = ref('')
const draftCustomYearFrom = ref('')
const draftCustomYearTo = ref('')

const statusOptions: StatusFilter[] = ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED']

interface StatusConfig {
  label: string
  color: string
  icon: Component
}

const statusConfigs: Record<Status, StatusConfig> = {
  DRAFT: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: FileText },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  IN_REVIEW: { label: 'In Review', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: Search },
  NEED_REVISION: { label: 'Revision', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', color: 'bg-white/10 text-white/40 border-white/20', icon: Clock }
}

const statusSelectItems = statusOptions.map((status) => {
  if (status === 'ALL') return { label: 'All Statuses', value: status }
  return { label: statusConfigs[status].label, value: status }
})

const getStatusConfig = (status: Status): StatusConfig => {
  return statusConfigs[status] ?? statusConfigs.SUBMITTED
}

const { claims: rawClaims, activityStats, referenceData } = useCsMockStore()

const formatDate = (dateString: string) => {
  return new Date(dateString).toISOString().split('T')[0] || ''
}

const claimsData = computed<CsClaimListItem[]>(() => {
  return rawClaims.value.map(item => ({
    ...item,
    createdAt: formatDate(item.createdAt),
    updatedAt: formatDate(item.updatedAt)
  }))
})

const vendorFilterOptions = computed(() => {
  const vendors = referenceData.vendors.map(item => item.code).sort((a, b) => a.localeCompare(b))
  return [{ label: 'All Vendors', value: 'ALL' }, ...vendors.map(vendor => ({ label: vendor, value: vendor }))]
})

const defectFilterOptions = computed(() => {
  const defects = referenceData.defects.map(item => item.name).sort((a, b) => a.localeCompare(b))
  return [{ label: 'All Defects', value: 'ALL' }, ...defects.map(defect => ({ label: defect, value: defect }))]
})

// ── Period preset options (fiscal-aware, no daily/weekly) ──

const periodPresetOptions: { label: string, value: PeriodPresetFilter }[] = [
  { label: 'All Time', value: 'ALL' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Fiscal', value: 'this_fiscal_half' },
  { label: 'Last Fiscal', value: 'last_fiscal_half' },
  { label: 'This Year', value: 'this_calendar_year' },
  { label: 'Custom Range', value: 'CUSTOM' as PeriodPresetFilter }
]

const customPeriodTypeOptions: { label: string, value: CustomPeriodType }[] = [
  { label: 'Month to Month', value: 'month' },
  { label: 'Fiscal to Fiscal', value: 'fiscal' },
  { label: 'Year to Year', value: 'year' }
]

// ── Date filtering logic ──

/**
 * Resolve the active period filter into a start/end Date range.
 * Returns null when preset is ALL (no date filtering).
 */
const resolvedDateRange = computed<{ start: Date, end: Date } | null>(() => {
  if (periodPresetFilter.value === 'ALL') return null

  // Custom range — resolve based on sub-type
  if ((periodPresetFilter.value as string) === 'CUSTOM') {
    return resolveCustomRange()
  }

  // Use fiscal.ts resolvePeriodFilter for preset modes
  const range = resolvePeriodFilter(periodPresetFilter.value as PeriodFilterMode)
  return { start: range.startDate, end: range.endDate }
})

function resolveCustomRange(): { start: Date, end: Date } | null {
  if (customPeriodType.value === 'month') {
    if (!customMonthFrom.value || !customMonthTo.value) return null
    const [fy, fm] = customMonthFrom.value.split('-').map(Number)
    const [ty, tm] = customMonthTo.value.split('-').map(Number)
    if (!fy || !fm || !ty || !tm) return null
    const start = new Date(fy, fm - 1, 1)
    const endLastDay = new Date(ty, tm, 0) // last day of to-month
    const end = new Date(ty, tm - 1, endLastDay.getDate(), 23, 59, 59, 999)
    return { start, end }
  }

  if (customPeriodType.value === 'fiscal') {
    if (!customFiscalFrom.value || !customFiscalTo.value) return null
    const fromParsed = parseFiscalLabel(customFiscalFrom.value)
    const toParsed = parseFiscalLabel(customFiscalTo.value)
    if (!fromParsed || !toParsed) return null
    const fromRange = getFiscalHalfRange(fromParsed.fiscalYear, fromParsed.fiscalHalf)
    const toRange = getFiscalHalfRange(toParsed.fiscalYear, toParsed.fiscalHalf)
    return { start: fromRange.startDate, end: toRange.endDate }
  }

  if (customPeriodType.value === 'year') {
    if (!customYearFrom.value || !customYearTo.value) return null
    const fy = parseInt(customYearFrom.value, 10)
    const ty = parseInt(customYearTo.value, 10)
    if (isNaN(fy) || isNaN(ty)) return null
    const start = new Date(fy, 0, 1)
    const end = new Date(ty, 11, 31, 23, 59, 59, 999)
    return { start, end }
  }

  return null
}

const isDateInRange = (value: string): boolean => {
  const range = resolvedDateRange.value
  if (!range) return true // ALL — no date filtering

  const target = new Date(`${value}T00:00:00`)
  if (isNaN(target.getTime())) return false
  return target >= range.start && target <= range.end
}

const filteredData = computed(() => {
  return claimsData.value.filter((item) => {
    const keyword = searchQuery.value.toLowerCase()
    const matchesSearch = item.id.toLowerCase().includes(keyword)
      || item.notificationCode.toLowerCase().includes(keyword)
      || item.modelName.toLowerCase().includes(keyword)
      || item.vendorName.toLowerCase().includes(keyword)
      || item.defectName.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter.value === 'ALL' || item.claimStatus === statusFilter.value
    const matchesVendor = vendorFilter.value === 'ALL' || item.vendorName === vendorFilter.value
    const matchesDefect = defectFilter.value === 'ALL' || item.defectName === defectFilter.value
    const dateSource = dateFieldFilter.value === 'LAST_UPDATE' ? item.updatedAt : item.createdAt
    const matchesDate = isDateInRange(dateSource)

    return matchesSearch && matchesStatus && matchesVendor && matchesDefect && matchesDate
  })
})

const activeAdvancedFilterCount = computed(() => {
  let count = 0
  if (vendorFilter.value !== 'ALL') count++
  if (defectFilter.value !== 'ALL') count++
  if (dateFieldFilter.value !== 'LAST_UPDATE') count++
  if (periodPresetFilter.value !== 'ALL') count++
  return count
})

const hasAnyFilterApplied = computed(() => {
  return searchQuery.value.trim().length > 0
    || statusFilter.value !== 'ALL'
    || activeAdvancedFilterCount.value > 0
})

const periodPresetLabelMap: Record<string, string> = {
  ALL: 'All Time',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_fiscal_half: 'This Fiscal',
  last_fiscal_half: 'Last Fiscal',
  this_calendar_year: 'This Year',
  CUSTOM: 'Custom Range'
}

const dateFieldLabelMap: Record<DateFieldFilter, string> = {
  LAST_UPDATE: 'Last Update',
  CREATED_AT: 'Created At'
}

/** Build a human-readable label for the active custom range */
const customRangeLabel = computed(() => {
  if (customPeriodType.value === 'month') {
    const from = monthSelectOptions.value.find(o => o.value === customMonthFrom.value)?.label || customMonthFrom.value || '-'
    const to = monthSelectOptions.value.find(o => o.value === customMonthTo.value)?.label || customMonthTo.value || '-'
    return `${from} \u2013 ${to}`
  }
  if (customPeriodType.value === 'fiscal') {
    const from = customFiscalFrom.value || '-'
    const to = customFiscalTo.value || '-'
    return `${from} \u2013 ${to}`
  }
  if (customPeriodType.value === 'year') {
    return `${customYearFrom.value || '-'} \u2013 ${customYearTo.value || '-'}`
  }
  return '-'
})

const activeFilterChips = computed(() => {
  const chips: { key: string, label: string, value: string }[] = []

  if (searchQuery.value.trim()) {
    chips.push({ key: 'search', label: 'Keyword', value: searchQuery.value.trim() })
  }

  if (statusFilter.value !== 'ALL') {
    chips.push({ key: 'status', label: 'Status', value: getStatusConfig(statusFilter.value as Status).label })
  }

  if (vendorFilter.value !== 'ALL') {
    chips.push({ key: 'vendor', label: 'Vendor', value: vendorFilter.value })
  }

  if (defectFilter.value !== 'ALL') {
    chips.push({ key: 'defect', label: 'Defect', value: defectFilter.value })
  }

  if (dateFieldFilter.value !== 'LAST_UPDATE') {
    chips.push({ key: 'dateField', label: 'Date Reference', value: dateFieldLabelMap[dateFieldFilter.value] })
  }

  if (periodPresetFilter.value !== 'ALL') {
    const value = (periodPresetFilter.value as string) === 'CUSTOM'
      ? customRangeLabel.value
      : periodPresetLabelMap[periodPresetFilter.value] || periodPresetFilter.value
    chips.push({ key: 'period', label: 'Period', value })
  }

  return chips
})

// ── Advance filter open / apply / reset ──

const openAdvanceFilter = () => {
  draftVendorFilter.value = vendorFilter.value
  draftDefectFilter.value = defectFilter.value
  draftDateFieldFilter.value = dateFieldFilter.value
  draftPeriodPresetFilter.value = periodPresetFilter.value
  draftCustomPeriodType.value = customPeriodType.value
  draftCustomMonthFrom.value = customMonthFrom.value
  draftCustomMonthTo.value = customMonthTo.value
  draftCustomFiscalFrom.value = customFiscalFrom.value
  draftCustomFiscalTo.value = customFiscalTo.value
  draftCustomYearFrom.value = customYearFrom.value
  draftCustomYearTo.value = customYearTo.value
  isAdvanceFilterOpen.value = true
}

const applyAdvanceFilter = () => {
  vendorFilter.value = draftVendorFilter.value
  defectFilter.value = draftDefectFilter.value
  dateFieldFilter.value = draftDateFieldFilter.value
  periodPresetFilter.value = draftPeriodPresetFilter.value
  customPeriodType.value = draftCustomPeriodType.value
  customMonthFrom.value = draftCustomMonthFrom.value
  customMonthTo.value = draftCustomMonthTo.value
  customFiscalFrom.value = draftCustomFiscalFrom.value
  customFiscalTo.value = draftCustomFiscalTo.value
  customYearFrom.value = draftCustomYearFrom.value
  customYearTo.value = draftCustomYearTo.value
  isAdvanceFilterOpen.value = false
}

const resetAllCustomFields = () => {
  customMonthFrom.value = ''
  customMonthTo.value = ''
  customFiscalFrom.value = ''
  customFiscalTo.value = ''
  customYearFrom.value = ''
  customYearTo.value = ''
  customPeriodType.value = 'month'
  draftCustomMonthFrom.value = ''
  draftCustomMonthTo.value = ''
  draftCustomFiscalFrom.value = ''
  draftCustomFiscalTo.value = ''
  draftCustomYearFrom.value = ''
  draftCustomYearTo.value = ''
  draftCustomPeriodType.value = 'month'
}

const resetAdvanceFilter = () => {
  vendorFilter.value = 'ALL'
  defectFilter.value = 'ALL'
  dateFieldFilter.value = 'LAST_UPDATE'
  periodPresetFilter.value = 'ALL'
  resetAllCustomFields()

  draftVendorFilter.value = 'ALL'
  draftDefectFilter.value = 'ALL'
  draftDateFieldFilter.value = 'LAST_UPDATE'
  draftPeriodPresetFilter.value = 'ALL'
}

const clearAllFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
  resetAdvanceFilter()
}

const clearSingleFilterChip = (chipKey: string) => {
  if (chipKey === 'search') searchQuery.value = ''
  if (chipKey === 'status') statusFilter.value = 'ALL'
  if (chipKey === 'vendor') {
    vendorFilter.value = 'ALL'
    draftVendorFilter.value = 'ALL'
  }
  if (chipKey === 'defect') {
    defectFilter.value = 'ALL'
    draftDefectFilter.value = 'ALL'
  }
  if (chipKey === 'dateField') {
    dateFieldFilter.value = 'LAST_UPDATE'
    draftDateFieldFilter.value = 'LAST_UPDATE'
  }
  if (chipKey === 'period') {
    periodPresetFilter.value = 'ALL'
    draftPeriodPresetFilter.value = 'ALL'
    resetAllCustomFields()
  }
}

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const sorting = ref<SortingState>([
  {
    id: 'updatedAt',
    desc: true
  }
])

const columnHelper = createColumnHelper<CsClaimListItem>()

const columns = [
  columnHelper.accessor('id', {
    enableSorting: true,
    header: 'Claim Number',
    cell: info => h('span', { class: 'text-xs font-black italic tracking-tight text-[#B6F500]' }, info.getValue())
  }),
  columnHelper.accessor('notificationCode', {
    enableSorting: true,
    header: 'Notification Code',
    cell: info => h('span', { class: 'text-xs font-medium text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('modelName', {
    enableSorting: true,
    header: 'Model Name',
    cell: info => h('span', { class: 'text-xs font-medium text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('vendorName', {
    enableSorting: true,
    header: 'Vendor',
    cell: info => h('span', { class: 'text-xs font-medium text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('defectName', {
    enableSorting: true,
    header: 'Defect',
    cell: info => h('span', { class: 'text-xs text-red-400' }, info.getValue())
  }),
  columnHelper.accessor('createdAt', {
    enableSorting: true,
    header: 'Date Created',
    cell: info => h('span', { class: 'text-xs font-medium uppercase tracking-tighter text-white/30' }, info.getValue())
  }),
  columnHelper.accessor('updatedAt', {
    enableSorting: true,
    header: 'Last Update',
    cell: info => h('span', { class: 'text-xs font-medium uppercase tracking-tighter text-white/30' }, info.getValue())
  }),
  columnHelper.accessor('claimStatus', {
    enableSorting: true,
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const config = getStatusConfig(status)
      return h('div', {
        class: `inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${config.color}`
      }, [
        h('span', { class: 'h-1.5 w-1.5 rounded-full bg-current' }),
        config.label
      ])
    }
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: info => h('div', { class: 'flex justify-end gap-2' }, [
      h('button', {
        class: 'rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:border-[#B6F500]/50 hover:text-[#B6F500]',
        onClick: (event: MouseEvent) => {
          event.stopPropagation()
          navigateTo(`/cs/claims/${info.row.original.id}`)
        }
      }, [
        h(Eye, { class: 'h-4 w-4' })
      ]),
      h('button', {
        class: 'rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:bg-white/10',
        onClick: (event: MouseEvent) => {
          event.stopPropagation()
          navigateTo(`/cs/claims/${info.row.original.id}`)
        }
      }, [
        h(ExternalLink, { class: 'h-4 w-4' })
      ])
    ])
  })
]

const table = useVueTable({
  get data() {
    return filteredData.value
  },
  columns,
  state: {
    get pagination() {
      return pagination.value
    },
    get sorting() {
      return sorting.value
    }
  },
  onPaginationChange: (updater) => {
    pagination.value = typeof updater === 'function'
      ? updater(pagination.value)
      : updater
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function'
      ? updater(sorting.value)
      : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel()
})

const pageSizeOptions = [5, 10, 25]

const handlePageSizeChange = (nextPageSize: number) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: 0,
    pageSize: nextPageSize
  }
}

const stats = computed(() => [
  { label: 'Total Claims', val: activityStats.value.totalClaims, color: 'white' },
  { label: 'Approved', val: activityStats.value.approved, color: '#B6F500' },
  { label: 'Pending', val: activityStats.value.pending, color: '#0ea5e9' },
  { label: 'Revision', val: activityStats.value.revision, color: '#f59e0b' }
])

const visibleFrom = computed(() => {
  if (!filteredData.value.length) {
    return 0
  }

  return pagination.value.pageIndex * pagination.value.pageSize + 1
})

const visibleTo = computed(() => {
  if (!filteredData.value.length) {
    return 0
  }

  return Math.min(filteredData.value.length, (pagination.value.pageIndex + 1) * pagination.value.pageSize)
})

const getStatusLabel = (status: StatusFilter) => {
  if (status === 'ALL') return 'All'
  return getStatusConfig(status as Status).label
}

const getStatusFilterClasses = (status: StatusFilter) => {
  if (status === 'ALL') {
    return {
      active: 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]',
      idle: 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
    }
  }

  const s = status as Status
  return {
    active: {
      DRAFT: 'border-zinc-400 bg-zinc-400 text-black shadow-[0_10px_28px_rgba(161,161,170,0.28)]',
      SUBMITTED: 'border-blue-400 bg-blue-400 text-black shadow-[0_10px_28px_rgba(96,165,250,0.28)]',
      IN_REVIEW: 'border-indigo-400 bg-indigo-400 text-black shadow-[0_10px_28px_rgba(129,140,248,0.28)]',
      NEED_REVISION: 'border-amber-400 bg-amber-400 text-black shadow-[0_10px_28px_rgba(251,191,36,0.28)]',
      APPROVED: 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]',
      ARCHIVED: 'border-white/40 bg-white/40 text-black shadow-[0_10px_28px_rgba(255,255,255,0.16)]'
    }[s],
    idle: `${getStatusConfig(s).color} opacity-45 hover:opacity-80 border-transparent`
  }
}

const currentTime = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const formattedDate = computed(() => {
  const d = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(currentTime.value).replace(/\./g, '')

  const w = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long'
  }).format(currentTime.value)

  return `${w}, ${d}`
})

const formattedTime = computed(() => {
  const h = currentTime.value.getHours()
  const m = currentTime.value.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12

  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
})

watch([searchQuery, statusFilter, vendorFilter, defectFilter, dateFieldFilter, periodPresetFilter, customPeriodType, customMonthFrom, customMonthTo, customFiscalFrom, customFiscalTo, customYearFrom, customYearTo], () => {
  pagination.value.pageIndex = 0
})

watch(sorting, () => {
  pagination.value.pageIndex = 0
}, { deep: true })
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white selection:bg-[#B6F500] selection:text-black">
    <header class="cs-shell-x sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <div class="cs-shell-container flex h-24 items-center justify-between">
        <div class="flex items-center gap-6">
          <div>
            <h1 class="text-2xl font-black uppercase italic tracking-tighter">
              My <span class="text-[#B6F500]">Claims</span>
            </h1>
            <p class="text-[10px] font-bold uppercase tracking-widest text-white/30 mt-0.5">
              History Lengkap Klaim RMA
            </p>
          </div>
        </div>

        <div class="flex items-center gap-8">
          <div class="group relative cursor-pointer">
            <Bell
              :size="22"
              class="text-white/40 transition-colors group-hover:text-white"
            />
            <div class="absolute top-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#050505] bg-[#B6F500] shadow-[0_0_10px_#B6F500]" />
          </div>
          <div class="h-8 w-px bg-white/10" />
          <div class="text-right">
            <p class="text-xs font-black tracking-widest text-[#B6F500] uppercase">
              {{ formattedDate }}
            </p>
            <p class="text-[10px] font-bold text-white/30 uppercase">
              {{ formattedTime }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="cs-shell-main animate-in space-y-8">
      <div class="cs-shell-container space-y-8">
        <section>
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="(stat, idx) in stats"
              :key="idx"
              class="flex flex-col gap-2 rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{{ stat.label }}</span>
              <span
                class="text-3xl font-black italic"
                :style="{ color: stat.color }"
              >{{ stat.val.toString().padStart(2, '0') }}</span>
            </div>
          </div>
        </section>
        <section class="space-y-4">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="w-full space-y-2 lg:max-w-sm">
              <div class="flex h-10 w-full items-center rounded-xl border border-white/10 bg-white/5 px-4 transition-all focus-within:border-[#B6F500]/50">
                <Search class="h-4.5 w-4.5 text-white/30" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari claim number, notification, model, vendor, defect..."
                  class="w-full border-none bg-transparent px-4 text-sm font-medium text-white outline-none placeholder:text-white/20"
                >
              </div>
            </div>

            <div class="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-start lg:gap-2">
              <div class="w-full lg:hidden">
                <USelect
                  v-model="statusFilter"
                  :items="statusSelectItems"
                  icon="i-lucide-list-filter"
                  size="sm"
                  variant="none"
                  class="w-full"
                  :ui="{
                    base: 'h-12 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white focus-within:border-[#B6F500]/45',
                    content: 'bg-[#0a0a0a] border border-white/10 text-white'
                  }"
                />
              </div>

              <div class="no-scrollbar hidden w-full gap-2 overflow-x-auto pb-1 lg:flex lg:w-auto lg:pb-0">
                <button
                  v-for="status in statusOptions"
                  :key="status"
                  :class="[
                    'group inline-flex h-10 items-center whitespace-nowrap rounded-xl border px-3 py-2 text-left transition-all',
                    statusFilter === status
                      ? getStatusFilterClasses(status).active
                      : getStatusFilterClasses(status).idle
                  ]"
                  @click="statusFilter = status"
                >
                  <div class="flex items-center gap-2">
                    <span
                      :class="[
                        'h-2 w-2 rounded-full transition-opacity bg-current',
                        statusFilter === status ? 'opacity-90' : 'opacity-55 group-hover:opacity-80'
                      ]"
                    />
                    <span class="text-[10px] font-black uppercase tracking-[0.22em] leading-none">{{ getStatusLabel(status) }}</span>
                  </div>
                </button>
              </div>

              <div class="flex w-full justify-end lg:w-auto lg:justify-start">
                <USlideover
                  v-model:open="isAdvanceFilterOpen"
                  title="Advance Filter"
                  description="Saring klaim berdasarkan vendor, defect, dan tanggal/periode untuk kebutuhan operasional harian."
                  side="right"
                  :ui="{
                    overlay: 'bg-black/55 backdrop-blur-md',
                    content: 'bg-[#0a0a0a] text-white ring-1 ring-[#B6F500]/10',
                    header: 'border-none px-6 py-5 text-[#B6F500]',
                    title: 'text-[#B6F500]',
                    body: 'space-y-6 px-6 py-6 border-none',
                    footer: 'px-6 py-4 justify-between'
                  }"
                >
                  <UButton
                    :label="activeAdvancedFilterCount ? `Advance filter (${activeAdvancedFilterCount})` : 'Advance filter'"
                    color="neutral"
                    variant="ghost"
                    :ui="{
                      base: 'h-10 rounded-xl !border !border-[#B6F500]/20 !bg-[#B6F500]/8 px-4 !text-[#B6F500]/88 hover:!border-[#B6F500]/38 hover:!bg-[#B6F500]/12 hover:!text-[#B6F500]',
                      leadingIcon: 'text-current'
                    }"
                    @click="openAdvanceFilter"
                  >
                    <template #leading>
                      <SlidersHorizontal class="h-4 w-4" />
                    </template>
                  </UButton>

                  <template #body>
                    <div class="space-y-6">
                      <div>
                        <p class="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                          Date Reference
                        </p>
                        <div class="flex gap-2">
                          <button
                            type="button"
                            :class="[
                              'rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                              draftDateFieldFilter === 'LAST_UPDATE'
                                ? 'border-[#B6F500] bg-[#B6F500] text-black'
                                : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white'
                            ]"
                            @click="draftDateFieldFilter = 'LAST_UPDATE'"
                          >
                            Last Update
                          </button>
                          <button
                            type="button"
                            :class="[
                              'rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                              draftDateFieldFilter === 'CREATED_AT'
                                ? 'border-[#B6F500] bg-[#B6F500] text-black'
                                : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white'
                            ]"
                            @click="draftDateFieldFilter = 'CREATED_AT'"
                          >
                            Created At
                          </button>
                        </div>
                      </div>

                      <div>
                        <p class="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                          Period
                        </p>
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            v-for="option in periodPresetOptions"
                            :key="option.value"
                            type="button"
                            :class="[
                              'rounded-xl border px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                              draftPeriodPresetFilter === option.value
                                ? 'border-[#B6F500] bg-[#B6F500]/15 text-[#B6F500]'
                                : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white'
                            ]"
                            @click="draftPeriodPresetFilter = option.value as PeriodPresetFilter"
                          >
                            {{ option.label }}
                          </button>
                        </div>
                      </div>

                      <!-- Custom period sub-type selector -->
                      <div
                        v-if="(draftPeriodPresetFilter as string) === 'CUSTOM'"
                        class="space-y-4"
                      >
                        <div>
                          <p class="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                            Custom Period Type
                          </p>
                          <div class="flex gap-2">
                            <button
                              v-for="opt in customPeriodTypeOptions"
                              :key="opt.value"
                              type="button"
                              :class="[
                                'rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                                draftCustomPeriodType === opt.value
                                  ? 'border-[#B6F500] bg-[#B6F500] text-black'
                                  : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white'
                              ]"
                              @click="draftCustomPeriodType = opt.value"
                            >
                              {{ opt.label }}
                            </button>
                          </div>
                        </div>

                        <!-- Month to Month -->
                        <div
                          v-if="draftCustomPeriodType === 'month'"
                          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
                        >
                          <label class="space-y-2 flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">From Month</span>
                            <USelectMenu
                              v-model="draftCustomMonthFrom"
                              :items="monthSelectOptions"
                              value-key="value"
                              placeholder="Select month"
                              variant="none"
                              size="sm"
                              :ui="{
                                base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                                content: 'bg-[#0a0a0a] border border-white/10 text-white'
                              }"
                            />
                          </label>
                          <label class="space-y-2 flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">To Month</span>
                            <USelectMenu
                              v-model="draftCustomMonthTo"
                              :items="monthSelectOptions"
                              value-key="value"
                              placeholder="Select month"
                              variant="none"
                              size="sm"
                              :ui="{
                                base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                                content: 'bg-[#0a0a0a] border border-white/10 text-white'
                              }"
                            />
                          </label>
                        </div>

                        <!-- Fiscal to Fiscal -->
                        <div
                          v-if="draftCustomPeriodType === 'fiscal'"
                          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
                        >
                          <label class="space-y-2 flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">From Fiscal</span>
                            <USelectMenu
                              v-model="draftCustomFiscalFrom"
                              :items="fiscalSelectOptions"
                              value-key="value"
                              placeholder="Select fiscal half"
                              variant="none"
                              size="sm"
                              :ui="{
                                base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                                content: 'bg-[#0a0a0a] border border-white/10 text-white'
                              }"
                            />
                          </label>
                          <label class="space-y-2 flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">To Fiscal</span>
                            <USelectMenu
                              v-model="draftCustomFiscalTo"
                              :items="fiscalSelectOptions"
                              value-key="value"
                              placeholder="Select fiscal half"
                              variant="none"
                              size="sm"
                              :ui="{
                                base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                                content: 'bg-[#0a0a0a] border border-white/10 text-white'
                              }"
                            />
                          </label>
                        </div>

                        <!-- Year to Year -->
                        <div
                          v-if="draftCustomPeriodType === 'year'"
                          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
                        >
                          <label class="space-y-2 flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">From Year</span>
                            <USelectMenu
                              v-model="draftCustomYearFrom"
                              :items="yearSelectOptions"
                              value-key="value"
                              placeholder="Select year"
                              variant="none"
                              size="sm"
                              :ui="{
                                base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                                content: 'bg-[#0a0a0a] border border-white/10 text-white'
                              }"
                            />
                          </label>
                          <label class="space-y-2 flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">To Year</span>
                            <USelectMenu
                              v-model="draftCustomYearTo"
                              :items="yearSelectOptions"
                              value-key="value"
                              placeholder="Select year"
                              variant="none"
                              size="sm"
                              :ui="{
                                base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                                content: 'bg-[#0a0a0a] border border-white/10 text-white'
                              }"
                            />
                          </label>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label class="space-y-2 flex flex-col">
                          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Vendor</span>
                          <USelectMenu
                            v-model="draftVendorFilter"
                            :items="vendorFilterOptions"
                            value-key="value"
                            placeholder="All Vendors"
                            variant="none"
                            size="sm"
                            :ui="{
                              base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                              content: 'bg-[#0a0a0a] border border-white/10 text-white'
                            }"
                          />
                        </label>

                        <label class="space-y-2 flex flex-col">
                          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Defect</span>
                          <USelectMenu
                            v-model="draftDefectFilter"
                            :items="defectFilterOptions"
                            value-key="value"
                            placeholder="All Defects"
                            variant="none"
                            size="sm"
                            :ui="{
                              base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                              content: 'bg-[#0a0a0a] border border-white/10 text-white'
                            }"
                          />
                        </label>
                      </div>
                    </div>
                  </template>

                  <template #footer>
                    <button
                      type="button"
                      class="inline-flex h-11 items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/65 transition-all hover:border-white/22 hover:text-white"
                      @click="resetAdvanceFilter"
                    >
                      <FilterX class="h-4 w-4" />
                      Reset
                    </button>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="inline-flex h-11 items-center rounded-xl border border-white/10 bg-white/5 px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white/65 transition-all hover:border-white/20 hover:text-white"
                        @click="isAdvanceFilterOpen = false"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="inline-flex h-11 items-center rounded-xl border border-[#B6F500] bg-[#B6F500] px-4 text-[10px] font-black uppercase tracking-[0.18em] text-black transition-all hover:brightness-110"
                        @click="applyAdvanceFilter"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </template>
                </USlideover>
              </div>
            </div>
          </div>

          <div
            v-if="activeFilterChips.length"
            class="flex flex-wrap items-center gap-2"
          >
            <button
              v-for="chip in activeFilterChips"
              :key="chip.key"
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] font-black tracking-[0.14em] text-white/75 transition-all hover:border-white/25 hover:text-white"
              @click="clearSingleFilterChip(chip.key)"
            >
              <span class="text-white/45">{{ chip.label }}:</span>
              <span class="uppercase">{{ chip.value }}</span>
              <FilterX class="h-3.5 w-3.5 text-white/50" />
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full border border-[#B6F500]/40 bg-[#B6F500]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#B6F500] transition-all hover:border-[#B6F500]"
              @click="clearAllFilters"
            >
              <FilterX class="h-3.5 w-3.5" />
              Clear all filters
            </button>
          </div>
        </section>

        <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
          <div class="overflow-x-auto overflow-y-visible">
            <table class="w-full border-collapse text-left">
              <thead>
                <tr
                  v-for="headerGroup in table.getHeaderGroups()"
                  :key="headerGroup.id"
                  class="border-b border-white/5"
                >
                  <th
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    class="px-6 py-6 text-[10px] font-black tracking-[0.2em] text-white/50"
                  >
                    <button
                      v-if="header.column.getCanSort()"
                      class="group flex items-center gap-2 text-left uppercase transition-colors hover:text-white/75"
                      @click="header.column.toggleSorting(header.column.getIsSorted() === 'asc')"
                    >
                      <FlexRender
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                      <ArrowUpDown
                        :size="10"
                        :class="[
                          'transition-all',
                          header.column.getIsSorted()
                            ? 'text-[#B6F500] opacity-100'
                            : 'opacity-35 group-hover:opacity-100'
                        ]"
                      />
                      <span
                        v-if="header.column.getIsSorted()"
                        class="text-[9px] tracking-[0.2em] text-[#B6F500]"
                      >
                        {{ header.column.getIsSorted() === 'asc' ? 'ASC' : 'DESC' }}
                      </span>
                    </button>
                    <div
                      v-else
                      class="flex items-center gap-2 uppercase"
                    >
                      <FlexRender
                        :render="header.column.columnDef.header"
                        :props="header.getContext()"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr
                  v-for="row in table.getRowModel().rows"
                  :key="row.id"
                  class="group cursor-pointer transition-colors hover:bg-white/2"
                  @click="navigateTo(`/cs/claims/${row.original.id}`)"
                >
                  <td
                    v-for="cell in row.getVisibleCells()"
                    :key="cell.id"
                    class="px-6 py-5 text-sm"
                  >
                    <FlexRender
                      :render="cell.column.columnDef.cell"
                      :props="cell.getContext()"
                    />
                  </td>
                </tr>
                <tr v-if="table.getRowModel().rows.length === 0">
                  <td
                    :colspan="columns.length"
                    class="py-32 text-center"
                  >
                    <div class="flex flex-col items-center gap-4">
                      <div class="rounded-full bg-white/5 p-6">
                        <ClipboardList
                          :size="48"
                          class="text-white/10"
                        />
                      </div>
                      <p class="text-sm font-bold uppercase tracking-widest text-white/20">
                        Tidak ada klaim yang cocok dengan filter
                      </p>
                      <button
                        v-if="hasAnyFilterApplied"
                        type="button"
                        class="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#B6F500]/40 bg-[#B6F500]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#B6F500] transition-all hover:border-[#B6F500]"
                        @click="clearAllFilters"
                      >
                        <FilterX class="h-4 w-4" />
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <DashboardTablePagination
            :page-size="pagination.pageSize"
            :page-size-options="pageSizeOptions"
            :visible-from="visibleFrom"
            :visible-to="visibleTo"
            :total-items="filteredData.length"
            :page-index="table.getState().pagination.pageIndex"
            :page-count="table.getPageCount()"
            :can-previous-page="table.getCanPreviousPage()"
            :can-next-page="table.getCanNextPage()"
            item-label="filtered claims"
            button-class="text-white/40 hover:bg-white/10 hover:text-white"
            show-page-size-selector
            @update:page-size="handlePageSizeChange"
            @first="table.setPageIndex(0)"
            @previous="table.previousPage()"
            @next="table.nextPage()"
            @last="table.setPageIndex(table.getPageCount() - 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(182, 245, 0, 0.1);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover { background: rgba(182, 245, 0, 0.3); }
</style>
