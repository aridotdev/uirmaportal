<script setup lang="ts">
import { h, useTemplateRef } from 'vue'
import type { Component } from 'vue'
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
import { CalendarDate } from '@internationalized/date'

type Status = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
type StatusFilter = 'ALL' | Status
type DateFieldFilter = 'LAST_UPDATE' | 'CREATED_AT'
type DatePresetFilter = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'

type ClaimItem = {
  id: string
  notificationCode: string
  model: string
  vendor: string
  defect: string
  status: Status
  createdAt: string
  lastUpdate: string
}

definePageMeta({
  layout: 'cs'
})

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('ALL')
const vendorFilter = ref('ALL')
const defectFilter = ref('ALL')
const dateFieldFilter = ref<DateFieldFilter>('LAST_UPDATE')
const datePresetFilter = ref<DatePresetFilter>('ALL')
const dateFromFilter = ref('')
const dateToFilter = ref('')
const isAdvanceFilterOpen = ref(false)

const draftVendorFilter = ref('ALL')
const draftDefectFilter = ref('ALL')
const draftDateFieldFilter = ref<DateFieldFilter>('LAST_UPDATE')
const draftDatePresetFilter = ref<DatePresetFilter>('ALL')
const draftDateFromFilter = ref('')
const draftDateToFilter = ref('')

const dateFromRef = useTemplateRef('dateFromInput')
const dateToRef = useTemplateRef('dateToInput')

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

interface RawClaim {
  claimNumber: string
  notificationId: number
  modelName: string
  vendorName: string
  defectName: string
  claimStatus: Status
  createdAt: string
  updatedAt: string
}

const { data: rawClaims } = await useFetch<RawClaim[]>('/api/claims')

const formatDate = (dateString: string) => {
  return new Date(dateString).toISOString().split('T')[0] || ''
}

const claimsData = computed<ClaimItem[]>(() => {
  if (!rawClaims.value) return []
  return rawClaims.value.map(item => ({
    id: item.claimNumber,
    notificationCode: `NTF-${String(item.notificationId).padStart(4, '0')}`,
    model: item.modelName,
    vendor: item.vendorName,
    defect: item.defectName,
    status: item.claimStatus,
    createdAt: formatDate(item.createdAt),
    lastUpdate: formatDate(item.updatedAt)
  }))
})

const vendorFilterOptions = computed(() => {
  const vendors = Array.from(new Set(claimsData.value.map(item => item.vendor))).sort((a, b) => a.localeCompare(b))
  return [{ label: 'All Vendors', value: 'ALL' }, ...vendors.map(vendor => ({ label: vendor, value: vendor }))]
})

const defectFilterOptions = computed(() => {
  const defects = Array.from(new Set(claimsData.value.map(item => item.defect))).sort((a, b) => a.localeCompare(b))
  return [{ label: 'All Defects', value: 'ALL' }, ...defects.map(defect => ({ label: defect, value: defect }))]
})

const datePresetOptions: { label: string, value: DatePresetFilter }[] = [
  { label: 'All Time', value: 'ALL' },
  { label: 'Today', value: 'TODAY' },
  { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'Custom Range', value: 'CUSTOM' }
]

const stringToCalendarDate = (value: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new CalendarDate(year, month, day)
}

const calendarDateToString = (value: CalendarDate) => {
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}

const draftCalendarDateFrom = computed({
  get: () => stringToCalendarDate(draftDateFromFilter.value),
  set: (value) => { draftDateFromFilter.value = value ? calendarDateToString(value) : '' }
})

const draftCalendarDateTo = computed({
  get: () => stringToCalendarDate(draftDateToFilter.value),
  set: (value) => { draftDateToFilter.value = value ? calendarDateToString(value) : '' }
})

const parseDateValue = (value: string) => {
  return value ? new Date(`${value}T00:00:00`) : null
}

const isDateInPreset = (value: string) => {
  if (datePresetFilter.value === 'ALL') return true

  const targetDate = parseDateValue(value)
  if (!targetDate) return false

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  if (datePresetFilter.value === 'TODAY') {
    return targetDate >= todayStart && targetDate < tomorrowStart
  }

  if (datePresetFilter.value === 'LAST_7_DAYS') {
    const rangeStart = new Date(todayStart)
    rangeStart.setDate(rangeStart.getDate() - 6)
    return targetDate >= rangeStart && targetDate < tomorrowStart
  }

  if (datePresetFilter.value === 'THIS_MONTH') {
    return targetDate.getFullYear() === now.getFullYear() && targetDate.getMonth() === now.getMonth()
  }

  const fromDate = parseDateValue(dateFromFilter.value)
  const toDate = parseDateValue(dateToFilter.value)

  if (fromDate && targetDate < fromDate) return false
  if (toDate) {
    const toDateEnd = new Date(toDate)
    toDateEnd.setDate(toDateEnd.getDate() + 1)
    if (targetDate >= toDateEnd) return false
  }

  return true
}

const filteredData = computed(() => {
  return claimsData.value.filter((item) => {
    const keyword = searchQuery.value.toLowerCase()
    const matchesSearch = item.id.toLowerCase().includes(keyword)
      || item.notificationCode.toLowerCase().includes(keyword)
      || item.model.toLowerCase().includes(keyword)
      || item.vendor.toLowerCase().includes(keyword)
      || item.defect.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value
    const matchesVendor = vendorFilter.value === 'ALL' || item.vendor === vendorFilter.value
    const matchesDefect = defectFilter.value === 'ALL' || item.defect === defectFilter.value
    const dateSource = dateFieldFilter.value === 'LAST_UPDATE' ? item.lastUpdate : item.createdAt
    const matchesDate = isDateInPreset(dateSource)

    return matchesSearch && matchesStatus && matchesVendor && matchesDefect && matchesDate
  })
})

const activeAdvancedFilterCount = computed(() => {
  let count = 0
  if (vendorFilter.value !== 'ALL') count++
  if (defectFilter.value !== 'ALL') count++
  if (dateFieldFilter.value !== 'LAST_UPDATE') count++
  if (datePresetFilter.value !== 'ALL') count++
  return count
})

const hasAnyFilterApplied = computed(() => {
  return searchQuery.value.trim().length > 0
    || statusFilter.value !== 'ALL'
    || activeAdvancedFilterCount.value > 0
})

const datePresetLabelMap: Record<DatePresetFilter, string> = {
  ALL: 'All Time',
  TODAY: 'Today',
  LAST_7_DAYS: 'Last 7 Days',
  THIS_MONTH: 'This Month',
  CUSTOM: 'Custom Range'
}

const dateFieldLabelMap: Record<DateFieldFilter, string> = {
  LAST_UPDATE: 'Last Update',
  CREATED_AT: 'Created At'
}

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

  if (datePresetFilter.value !== 'ALL') {
    const range = datePresetFilter.value === 'CUSTOM'
      ? [dateFromFilter.value || '-', dateToFilter.value || '-'].join(' to ')
      : datePresetLabelMap[datePresetFilter.value]
    chips.push({ key: 'datePreset', label: 'Period', value: range })
  }

  return chips
})

const openAdvanceFilter = () => {
  draftVendorFilter.value = vendorFilter.value
  draftDefectFilter.value = defectFilter.value
  draftDateFieldFilter.value = dateFieldFilter.value
  draftDatePresetFilter.value = datePresetFilter.value
  draftDateFromFilter.value = dateFromFilter.value
  draftDateToFilter.value = dateToFilter.value
  isAdvanceFilterOpen.value = true
}

const applyAdvanceFilter = () => {
  vendorFilter.value = draftVendorFilter.value
  defectFilter.value = draftDefectFilter.value
  dateFieldFilter.value = draftDateFieldFilter.value
  datePresetFilter.value = draftDatePresetFilter.value
  dateFromFilter.value = draftDateFromFilter.value
  dateToFilter.value = draftDateToFilter.value
  isAdvanceFilterOpen.value = false
}

const resetAdvanceFilter = () => {
  vendorFilter.value = 'ALL'
  defectFilter.value = 'ALL'
  dateFieldFilter.value = 'LAST_UPDATE'
  datePresetFilter.value = 'ALL'
  dateFromFilter.value = ''
  dateToFilter.value = ''

  draftVendorFilter.value = 'ALL'
  draftDefectFilter.value = 'ALL'
  draftDateFieldFilter.value = 'LAST_UPDATE'
  draftDatePresetFilter.value = 'ALL'
  draftDateFromFilter.value = ''
  draftDateToFilter.value = ''
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
  if (chipKey === 'datePreset') {
    datePresetFilter.value = 'ALL'
    dateFromFilter.value = ''
    dateToFilter.value = ''
    draftDatePresetFilter.value = 'ALL'
    draftDateFromFilter.value = ''
    draftDateToFilter.value = ''
  }
}

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const sorting = ref<SortingState>([
  {
    id: 'lastUpdate',
    desc: true
  }
])

const columnHelper = createColumnHelper<ClaimItem>()

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
  columnHelper.accessor('model', {
    enableSorting: true,
    header: 'Model Name',
    cell: info => h('span', { class: 'text-xs font-medium text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('vendor', {
    enableSorting: true,
    header: 'Vendor',
    cell: info => h('span', { class: 'text-xs font-medium text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('defect', {
    enableSorting: true,
    header: 'Defect',
    cell: info => h('span', { class: 'text-xs text-red-400' }, info.getValue())
  }),
  columnHelper.accessor('createdAt', {
    enableSorting: true,
    header: 'Date Created',
    cell: info => h('span', { class: 'text-xs font-medium uppercase tracking-tighter text-white/30' }, info.getValue())
  }),
  columnHelper.accessor('lastUpdate', {
    enableSorting: true,
    header: 'Last Update',
    cell: info => h('span', { class: 'text-xs font-medium uppercase tracking-tighter text-white/30' }, info.getValue())
  }),
  columnHelper.accessor('status', {
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
  { label: 'Total Claims', val: claimsData.value.length, color: 'white' },
  { label: 'Approved', val: claimsData.value.filter(d => d.status === 'APPROVED').length, color: '#B6F500' },
  { label: 'Pending', val: claimsData.value.filter(d => d.status === 'IN_REVIEW').length, color: '#0ea5e9' },
  { label: 'Revision', val: claimsData.value.filter(d => d.status === 'NEED_REVISION').length, color: '#f59e0b' }
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

watch([searchQuery, statusFilter, vendorFilter, defectFilter, dateFieldFilter, datePresetFilter, dateFromFilter, dateToFilter], () => {
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
                    content: 'bg-[#0a0a0a] text-white border-none',
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
                            v-for="option in datePresetOptions"
                            :key="option.value"
                            type="button"
                            :class="[
                              'rounded-xl border px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.18em] transition-all',
                              draftDatePresetFilter === option.value
                                ? 'border-[#B6F500] bg-[#B6F500]/15 text-[#B6F500]'
                                : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:text-white'
                            ]"
                            @click="draftDatePresetFilter = option.value"
                          >
                            {{ option.label }}
                          </button>
                        </div>
                      </div>

                      <div
                        v-if="draftDatePresetFilter === 'CUSTOM'"
                        class="grid grid-cols-1 gap-3 sm:grid-cols-2"
                      >
                        <label class="space-y-2">
                          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Date From</span>
                          <UInputDate
                            ref="dateFromInput"
                            v-model="draftCalendarDateFrom"
                            locale="id-ID"
                            variant="none"
                            :ui="{
                              base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white transition-all focus-within:border-[#B6F500]/45 cursor-pointer',
                              segment: 'text-white data-placeholder:text-white/35 data-[focused]:bg-black/40 data-[focused]:rounded'
                            }"
                          >
                            <template #trailing>
                              <UPopover :reference="dateFromRef?.inputsRef?.[3]?.$el">
                                <UButton
                                  color="neutral"
                                  variant="link"
                                  size="sm"
                                  icon="i-lucide-calendar-days"
                                  aria-label="Open date from picker"
                                  class="px-0 text-white/35 hover:text-[#B6F500]"
                                />
                                <template #content>
                                  <UCalendar
                                    v-model="draftCalendarDateFrom"
                                    class="p-2"
                                  />
                                </template>
                              </UPopover>
                            </template>
                          </UInputDate>
                        </label>

                        <label class="space-y-2">
                          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Date To</span>
                          <UInputDate
                            ref="dateToInput"
                            v-model="draftCalendarDateTo"
                            locale="id-ID"
                            variant="none"
                            :ui="{
                              base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white transition-all focus-within:border-[#B6F500]/45 cursor-pointer',
                              segment: 'text-white data-placeholder:text-white/35 data-[focused]:bg-black/40 data-[focused]:rounded'
                            }"
                          >
                            <template #trailing>
                              <UPopover :reference="dateToRef?.inputsRef?.[3]?.$el">
                                <UButton
                                  color="neutral"
                                  variant="link"
                                  size="sm"
                                  icon="i-lucide-calendar-days"
                                  aria-label="Open date to picker"
                                  class="px-0 text-white/35 hover:text-[#B6F500]"
                                />
                                <template #content>
                                  <UCalendar
                                    v-model="draftCalendarDateTo"
                                    class="p-2"
                                  />
                                </template>
                              </UPopover>
                            </template>
                          </UInputDate>
                        </label>
                      </div>

                      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label class="space-y-2">
                          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Vendor</span>
                          <USelect
                            v-model="draftVendorFilter"
                            :items="vendorFilterOptions"
                            variant="none"
                            size="sm"
                            :ui="{
                              base: 'h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-white focus-within:border-[#B6F500]/45',
                              content: 'bg-[#0a0a0a] border border-white/10 text-white'
                            }"
                          />
                        </label>

                        <label class="space-y-2">
                          <span class="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Defect</span>
                          <USelect
                            v-model="draftDefectFilter"
                            :items="defectFilterOptions"
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
