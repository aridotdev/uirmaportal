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
  ArrowUpDown,
  Eye
} from 'lucide-vue-next'
import StatusBadge from '~/components/StatusBadge.vue'
import { getClaimStatusConfig, getClaimStatusFilterClasses } from '~/utils/status-config'

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

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

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
const vendorFilter = ref<string>('ALL')
const branchFilter = ref<string>('ALL')
const dateFrom = ref<string>('')
const dateTo = ref<string>('')
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

const getStatusLabel = (status: StatusFilter) => {
  if (status === 'ALL') {
    return 'All'
  }

  return getClaimStatusConfig(status).label
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

const vendorOptions = computed(() => {
  const vendors = [...new Set(data.value.map(claim => claim.vendor))].sort()
  return ['ALL', ...vendors]
})

const branchOptions = computed(() => {
  const branches = [...new Set(data.value.map(claim => claim.branch))].sort()
  return ['ALL', ...branches]
})

const filteredClaims = computed(() => {
  let result = searchScopedClaims.value

  if (statusFilter.value !== 'ALL') {
    result = result.filter(claim => claim.claimStatus === statusFilter.value)
  }

  if (vendorFilter.value !== 'ALL') {
    result = result.filter(claim => claim.vendor === vendorFilter.value)
  }

  if (branchFilter.value !== 'ALL') {
    result = result.filter(claim => claim.branch === branchFilter.value)
  }

  if (dateFrom.value) {
    const from = new Date(dateFrom.value)
    result = result.filter(claim => claim.createdAt >= from)
  }

  if (dateTo.value) {
    const to = new Date(dateTo.value)
    to.setHours(23, 59, 59, 999)
    result = result.filter(claim => claim.createdAt <= to)
  }

  return result
})

const hasActiveFilters = computed(() =>
  normalizedSearchQuery.value.length > 0
  || statusFilter.value !== 'ALL'
  || vendorFilter.value !== 'ALL'
  || branchFilter.value !== 'ALL'
  || dateFrom.value !== ''
  || dateTo.value !== ''
)

const activeFilterSummary = computed(() => {
  const parts: string[] = []

  if (normalizedSearchQuery.value) {
    parts.push(`search "${searchQuery.value.trim()}"`)
  }

  if (statusFilter.value !== 'ALL') {
    parts.push(getStatusLabel(statusFilter.value))
  }

  if (vendorFilter.value !== 'ALL') {
    parts.push(`vendor ${vendorFilter.value}`)
  }

  if (branchFilter.value !== 'ALL') {
    parts.push(`branch ${branchFilter.value}`)
  }

  if (dateFrom.value) {
    parts.push(`from ${new Date(dateFrom.value).toLocaleDateString('id-ID')}`)
  }

  if (dateTo.value) {
    parts.push(`to ${new Date(dateTo.value).toLocaleDateString('id-ID')}`)
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
  vendorFilter.value = 'ALL'
  branchFilter.value = 'ALL'
  dateFrom.value = ''
  dateTo.value = ''
}

watch([searchQuery, statusFilter, vendorFilter, branchFilter, dateFrom, dateTo], () => {
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
    cell: info => h(StatusBadge, {
      status: info.getValue(),
      variant: 'claim',
      size: 'sm'
    })
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
    <PageHeader
      title="Claims"
      description="Verifikasi dan kelola pengajuan klaim RMA dari Customer Service."
    />

    <FilterBar
      v-model:search="searchQuery"
      v-model:refreshing="isLoading"
      search-placeholder="Cari claim number, panel part number, OC serial, vendor, model, atau branch..."
      :show-refresh="true"
      :show-reset="true"
      :has-active-filters="hasActiveFilters"
      @refresh="handleRefresh"
      @reset="resetFilters"
    >
      <button
        v-for="status in statusOptions"
        :key="status"
        :class="[
          'group whitespace-nowrap rounded-2xl border px-4 py-3 text-left transition-all',
          getClaimStatusFilterClasses(status, statusFilter === 'ALL' ? 'ALL' : statusFilter)
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

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Vendor</span>
          <select
            v-model="vendorFilter"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 outline-none transition-all focus:border-[#B6F500]/50"
          >
            <option
              v-for="vendor in vendorOptions"
              :key="vendor"
              :value="vendor"
            >
              {{ vendor === 'ALL' ? 'All Vendors' : vendor }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Branch</span>
          <select
            v-model="branchFilter"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 outline-none transition-all focus:border-[#B6F500]/50"
          >
            <option
              v-for="branch in branchOptions"
              :key="branch"
              :value="branch"
            >
              {{ branch === 'ALL' ? 'All Branches' : branch }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black uppercase tracking-widest text-white/20">From</span>
          <input
            v-model="dateFrom"
            type="date"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 outline-none transition-all focus:border-[#B6F500]/50"
          >
          <span class="text-[10px] font-black uppercase tracking-widest text-white/20">To</span>
          <input
            v-model="dateTo"
            type="date"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 outline-none transition-all focus:border-[#B6F500]/50"
          >
        </div>
      </div>

      <template #summary>
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
      </template>
    </FilterBar>

    <!-- Data Table -->
    <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
      <LoadingState
        v-if="isLoading"
        variant="table"
        :rows="5"
      />
      <EmptyState
        v-else-if="filteredClaims.length === 0 && hasActiveFilters"
        title="Tidak ada data ditemukan"
        description="Coba ubah filter atau kata kunci pencarian."
        action-label="Reset Filter"
        @action="resetFilters"
      />
      <EmptyState
        v-else-if="data.length === 0"
        title="Belum ada data"
        description="Data akan muncul saat sudah tersedia."
      />
      <div
        v-else
        class="overflow-x-auto overflow-y-visible"
      >
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
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <DashboardTablePagination
        v-if="!isLoading && filteredClaims.length > 0"
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

select,
input[type='date'] {
  color-scheme: dark;
}

select option {
  background: #0a0a0a;
  color: #fff;
}

/* Hide scrollbar for filter pills */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
