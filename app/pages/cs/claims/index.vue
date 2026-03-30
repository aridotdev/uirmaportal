<script setup lang="ts">
import { h } from 'vue'
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
  Clock
} from 'lucide-vue-next'

type Status = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
type StatusFilter = 'ALL' | Status

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

const filteredData = computed(() => {
  return claimsData.value.filter((item) => {
    const keyword = searchQuery.value.toLowerCase()
    const matchesSearch = item.id.toLowerCase().includes(keyword)
      || item.notificationCode.toLowerCase().includes(keyword)
      || item.model.toLowerCase().includes(keyword)
      || item.vendor.toLowerCase().includes(keyword)
      || item.defect.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 8
})

const sorting = ref<SortingState>([
  {
    id: 'createdAt',
    desc: true
  }
])

const columnHelper = createColumnHelper<ClaimItem>()

const columns = [
  columnHelper.accessor('id', {
    enableSorting: true,
    header: 'Claim Code',
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

const pageSizeOptions = [8, 16, 32]

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

watch([searchQuery, statusFilter], () => {
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
              My <span class="text-[#B6F500]">Reports</span>
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
        <section class="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div class="flex w-full items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 transition-all focus-within:border-[#B6F500]/50 lg:w-96">
            <Search class="h-4.5 w-4.5 text-white/30" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari Kode Notifikasi..."
              class="w-full border-none bg-transparent px-4 text-sm font-medium text-white outline-none placeholder:text-white/20"
            >
          </div>

          <div class="no-scrollbar flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto lg:pb-0">
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
                <span class="text-[10px] font-black uppercase tracking-[0.22em] leading-none">{{ getStatusLabel(status) }}</span>
              </div>
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
