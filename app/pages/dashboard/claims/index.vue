<script setup lang="ts">
import { h } from 'vue'
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
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  ClipboardList,
  Eye
} from 'lucide-vue-next'

// Definisi Tipe berdasarkan schema claim.ts
interface ClaimRow {
  id: string
  claimNumber: string
  vendor: string
  model: string
  branch: string
  createdAt: Date
  claimStatus: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  panelPartNumber: string
  ocSerialNo: string
  defect: string
}

definePageMeta({ layout: 'dashboard' })

interface ClaimApiItem {
  id?: number | string | null
  claimNumber?: string | null
  vendorName?: string | null
  modelName?: string | null
  branch?: string | null
  createdAt?: string | null
  claimStatus?: ClaimRow['claimStatus'] | null
  panelPartNumber?: string | null
  ocSerialNo?: string | null
  defectName?: string | null
}

// Fetch data from API
const { data: fetchedClaims, pending: isLoading, refresh: executeRefresh } = await useFetch<ClaimApiItem[]>('/api/claims')

const data = computed<ClaimRow[]>(() => {
  if (!fetchedClaims.value) return []
  return fetchedClaims.value.map(item => ({
    id: String(item.id ?? item.claimNumber ?? ''),
    claimNumber: item.claimNumber || '-',
    vendor: item.vendorName || '-',
    model: item.modelName || '-',
    branch: item.branch || '-',
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    claimStatus: item.claimStatus ?? 'SUBMITTED',
    panelPartNumber: item.panelPartNumber || '-',
    ocSerialNo: item.ocSerialNo || '-',
    defect: item.defectName || '-'
  }))
})

// State Management
const searchQuery = ref('')
type StatusFilter = 'ALL' | ClaimRow['claimStatus']
const statusFilter = ref<StatusFilter>('ALL')
const statusOptions: StatusFilter[] = ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED']
const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})
const pageSizeOptions = [5, 10, 25]
const sorting = ref<SortingState>([
  {
    id: 'createdAt',
    desc: true
  }
])
/* isLoading dari useFetch di atas */

// Status Styling Helper
interface StatusConfig {
  label: string
  color: string
  icon: typeof Clock
}

const statusConfigs = {
  DRAFT: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: Clock },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  IN_REVIEW: { label: 'In Review', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: Search },
  NEED_REVISION: { label: 'Revision', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', color: 'bg-white/10 text-white/40 border-white/20', icon: Clock }
} satisfies Record<string, StatusConfig>

const getStatusConfig = (status: string): StatusConfig => {
  return (statusConfigs as Record<string, StatusConfig>)[status] ?? statusConfigs.SUBMITTED
}

const getStatusLabel = (status: StatusFilter) => {
  if (status === 'ALL') {
    return 'All'
  }

  return getStatusConfig(status).label
}

const getStatusFilterClasses = (status: StatusFilter) => {
  if (status === 'ALL') {
    return {
      active: 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]',
      idle: 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
    }
  }

  return {
    active: {
      DRAFT: 'border-zinc-400 bg-zinc-400 text-black shadow-[0_10px_28px_rgba(161,161,170,0.28)]',
      SUBMITTED: 'border-blue-400 bg-blue-400 text-black shadow-[0_10px_28px_rgba(96,165,250,0.28)]',
      IN_REVIEW: 'border-indigo-400 bg-indigo-400 text-black shadow-[0_10px_28px_rgba(129,140,248,0.28)]',
      NEED_REVISION: 'border-amber-400 bg-amber-400 text-black shadow-[0_10px_28px_rgba(251,191,36,0.28)]',
      APPROVED: 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]',
      ARCHIVED: 'border-white/40 bg-white/40 text-black shadow-[0_10px_28px_rgba(255,255,255,0.16)]'
    }[status],
    idle: `${getStatusConfig(status).color} opacity-45 hover:opacity-80 border-transparent`
  }
}

const debouncedSearchQuery = ref('')

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

watch(searchQuery, (value) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, 250)
}, { immediate: true })

const normalizedSearchQuery = computed(() => debouncedSearchQuery.value.trim().toLowerCase())

const searchScopedClaims = computed(() => {
  if (!normalizedSearchQuery.value) {
    return data.value
  }

  return data.value.filter((claim) => {
    const haystacks = [
      claim.claimNumber,
      claim.panelPartNumber,
      claim.ocSerialNo,
      claim.vendor,
      claim.model,
      claim.branch
    ]

    return haystacks.some(value => value.toLowerCase().includes(normalizedSearchQuery.value))
  })
})

const filteredClaims = computed(() => {
  if (statusFilter.value === 'ALL') {
    return searchScopedClaims.value
  }

  return searchScopedClaims.value.filter(claim => claim.claimStatus === statusFilter.value)
})

const hasActiveFilters = computed(() => normalizedSearchQuery.value.length > 0 || statusFilter.value !== 'ALL')

const activeFilterSummary = computed(() => {
  const parts: string[] = []

  if (normalizedSearchQuery.value) {
    parts.push(`search "${searchQuery.value.trim()}"`)
  }

  if (statusFilter.value !== 'ALL') {
    parts.push(getStatusLabel(statusFilter.value))
  }

  if (!parts.length) {
    return 'Showing all claims.'
  }

  return `Filtered by ${parts.join(' + ')}.`
})

const visibleFrom = computed(() => {
  if (!filteredClaims.value.length) {
    return 0
  }

  return pagination.value.pageIndex * pagination.value.pageSize + 1
})

const visibleTo = computed(() => {
  if (!filteredClaims.value.length) {
    return 0
  }

  return Math.min(filteredClaims.value.length, (pagination.value.pageIndex + 1) * pagination.value.pageSize)
})

const handlePageSizeChange = (nextPageSize: number) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: 0,
    pageSize: nextPageSize
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
}

watch([searchQuery, statusFilter], () => {
  pagination.value.pageIndex = 0
})

watch(sorting, () => {
  pagination.value.pageIndex = 0
}, { deep: true })

// TanStack Table Setup
const columnHelper = createColumnHelper<ClaimRow>()

const columns = [
  columnHelper.accessor('claimNumber', {
    enableSorting: true,
    header: 'Claim Number',
    cell: info => h('span', { class: 'font-black text-[#B6F500] tracking-tighter' }, info.getValue())
  }),
  columnHelper.accessor('vendor', {
    enableSorting: true,
    header: 'Vendor',
    cell: info => h('span', { class: 'font-bold text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('model', {
    enableSorting: true,
    header: 'Model Name',
    cell: info => h('span', { class: 'font-medium text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('branch', {
    enableSorting: true,
    header: 'Branch',
    cell: info => h('span', { class: 'text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('defect', {
    enableSorting: true,
    header: 'Defect',
    cell: (info) => {
      return h('span', { class: 'font-bold text-red-400' }, info.getValue())
    }
  }),
  columnHelper.accessor('createdAt', {
    enableSorting: true,
    header: 'Date Created',
    cell: (info) => {
      const date = info.getValue()
      return h('span', { class: 'text-sm text-white/60 group-hover:text-white/70 transition-colors' }, date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }))
    }
  }),
  columnHelper.accessor('claimStatus', {
    enableSorting: true,
    header: 'Status',
    cell: (info) => {
      const config = getStatusConfig(info.getValue())
      return h('div', {
        class: `inline-flex items-center gap-2 px-3 py-1 rounded-full border ${config.color} text-[10px] font-black uppercase tracking-widest`
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
        class: 'p-2 rounded-xl bg-white/5 hover:bg-[#B6F500] hover:text-black transition-all group',
        onClick: (event: MouseEvent) => {
          event.stopPropagation()
          navigateTo(`/dashboard/claims/${info.row.original.id}`)
        }
      }, [
        h(Eye, { size: 16 })
      ])
    ])
  })
]

const table = useVueTable({
  get data() { return filteredClaims.value },
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

const handleRefresh = async () => {
  await executeRefresh()
}
</script>

<template>
  <div class="p-6 lg:p-12 space-y-8">
    <!-- Header Section -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-lg bg-white/5 border border-white/10">
            <ClipboardList
              class="text-[#B6F500]"
              :size="20"
            />
          </div>
          <h1 class="text-3xl font-black italic tracking-tighter uppercase">
            Claims
          </h1>
        </div>
        <p class="text-white/40 text-sm font-medium">
          Verifikasi dan kelola pengajuan klaim RMA dari Customer Service.
        </p>
      </div>
    </div>

    <!-- Filter Panel -->
    <section class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.10),transparent_28%),rgba(255,255,255,0.04)] p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div class="flex flex-col gap-4 border-b border-white/6 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex-1">
          <div class="mb-3 flex flex-col gap-2 text-[11px] font-bold tracking-[0.18em] text-white/28 uppercase md:flex-row md:items-center md:justify-between">
            <p>Search across claim number, panel serial, OC serial, vendor, model, and branch.</p>
          </div>
          <div class="group relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-[#B6F500] transition-colors"
              :size="18"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari claim number, serial panel, OC serial, vendor, model, atau branch..."
              class="h-14 w-full rounded-2xl border border-white/8 bg-black/20 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-white/18 focus:border-[#B6F500]/45 focus:outline-none focus:ring-4 focus:ring-[#B6F500]/10 transition-all"
            >
          </div>
        </div>

        <div class="flex items-end gap-3 lg:pl-4 h-full">
          <button
            class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/45 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            :class="{ 'animate-spin': isLoading }"
            @click="handleRefresh"
          >
            <RefreshCw :size="20" />
          </button>
          <button
            v-if="hasActiveFilters"
            class="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-[11px] font-black uppercase tracking-[0.24em] text-white/65 transition-all hover:border-white/20 hover:text-white"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 flex-1">
          <div class="mb-3 flex items-center justify-between gap-4">
            <p class="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
              Tap to filter by status
            </p>
          </div>

          <div class="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <button
              v-for="status in statusOptions"
              :key="status"
              :class="[
                'group whitespace-nowrap rounded-2xl border px-4 py-3 text-left transition-all',
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
                <span class="text-[10px] font-black uppercase tracking-[0.22em]">{{ getStatusLabel(status) }}</span>
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-2xl flex justify-between border border-white/8 bg-black/20 px-4 py-3 xl:w-[320px] xl:shrink-0">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
              Current View
            </p>
            <p class="mt-2 text-sm font-semibold text-white/78">
              {{ activeFilterSummary }}
            </p>
          </div>
          <div class="flex items-end justify-between">
            <p class="text-xl font-black tracking-tight text-[#B6F500]">
              {{ filteredClaims.length.toString().padStart(2, '0') }}
            </p>
            <p class="text-xl font-semibold text-white/40 px-2">
              /
            </p>
            <p class="text-xl font-semibold text-white/40">
              {{ data.length.toString().padStart(2, '0') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Data Table -->
    <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
      >
        <div class="h-10 w-10 border-4 border-[#B6F500]/20 border-t-[#B6F500] rounded-full animate-spin" />
      </div>

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
              class="group cursor-pointer hover:bg-white/2 transition-colors"
              @click="navigateTo(`/dashboard/claims/${row.original.id}`)"
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
            <!-- Empty State -->
            <tr v-if="table.getRowModel().rows.length === 0">
              <td
                :colspan="columns.length"
                class="py-32 text-center"
              >
                <div class="flex flex-col items-center gap-4">
                  <div class="p-6 rounded-full bg-white/5">
                    <ClipboardList
                      :size="48"
                      class="text-white/10"
                    />
                  </div>
                  <p class="text-white/20 font-bold uppercase tracking-widest text-sm">
                    Tidak ada klaim yang cocok dengan filter
                  </p>
                  <button
                    v-if="hasActiveFilters"
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition-all hover:border-white/20 hover:text-white"
                    @click="resetFilters"
                  >
                    Reset Filters
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <DashboardTablePagination
        :page-size="pagination.pageSize"
        :page-size-options="pageSizeOptions"
        :visible-from="visibleFrom"
        :visible-to="visibleTo"
        :total-items="filteredClaims.length"
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
</template>

<style scoped>
/* Transisi halus untuk hover row */
tr {
  transition: all 0.2s ease;
}

input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

button {
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

/* Hide scrollbar for filter pills */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
