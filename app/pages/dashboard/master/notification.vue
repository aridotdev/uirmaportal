<script setup lang="ts">
import {
  Bell,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  Pencil,
  Save,
  X,
  CalendarDays,
  Fingerprint,
  History,
  XCircle,
  MapPin,
  Tag,
  LayoutGrid
} from 'lucide-vue-next'
import { h, computed, ref, reactive, useTemplateRef } from 'vue'
import { CalendarDate } from '@internationalized/date'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'

// server/database/schema/notification-master.ts
interface NotificationRecord {
  id: number
  notificationCode: string
  notificationDate: number
  modelId: number
  branch: string
  vendorId: number
  status: 'NEW' | 'USED' | 'EXPIRED'
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

// Mock Data for Relations
const vendors = [
  { id: 1, name: 'MOKA' },
  { id: 2, name: 'MTC' },
  { id: 3, name: 'SDP' }
]

const productModels = [
  { id: 1, name: '42V-TYPE', vendorId: 1 },
  { id: 2, name: '50V-TYPE', vendorId: 1 },
  { id: 3, name: '32V-TYPE', vendorId: 2 }
]

const notificationList = ref<NotificationRecord[]>([
  {
    id: 1,
    notificationCode: 'N2024-88219',
    notificationDate: Date.now() - 86400000 * 5,
    modelId: 1,
    branch: 'JKT-01',
    vendorId: 1,
    status: 'NEW',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: 2,
    notificationCode: 'N2024-88220',
    notificationDate: Date.now() - 86400000 * 10,
    modelId: 2,
    branch: 'SBY-02',
    vendorId: 1,
    status: 'USED',
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 8
  },
  {
    id: 3,
    notificationCode: 'N2024-88221',
    notificationDate: Date.now() - 86400000 * 30,
    modelId: 3,
    branch: 'BDG-03',
    vendorId: 2,
    status: 'EXPIRED',
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5
  }
])

// ------- Stats Calculation -------
const stats = computed(() => {
  return [
    { label: 'Total Codes', value: notificationList.value.length.toString(), color: 'text-white/40' },
    { label: 'Available (New)', value: notificationList.value.filter(n => n.status === 'NEW').length.toString(), color: 'text-emerald-400' },
    { label: 'Used', value: notificationList.value.filter(n => n.status === 'USED').length.toString(), color: 'text-white/40' },
    { label: 'Expired', value: notificationList.value.filter(n => n.status === 'EXPIRED').length.toString(), color: 'text-red-400' }
  ]
})

// ------- CRUD & Modal Logic -------
const isUpsertModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isEditing = ref(false)
const selectedNotification = ref<NotificationRecord | null>(null)
const isLoading = ref(false)

const defaultForm = {
  id: 0,
  notificationCode: '',
  notificationDate: Date.now(),
  modelId: 1,
  branch: '',
  vendorId: 1,
  status: 'NEW' as 'NEW' | 'USED' | 'EXPIRED'
}

const form = reactive({ ...defaultForm })

const notificationDateRef = useTemplateRef('notificationDateInput')

// Convert Unix timestamp <-> CalendarDate
const calendarDate = computed({
  get: () => {
    const d = new Date(form.notificationDate)
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  },
  set: (val: CalendarDate) => {
    if (val) {
      form.notificationDate = new Date(val.year, val.month - 1, val.day).getTime()
    }
  }
})

const openUpsertModal = (record?: NotificationRecord) => {
  if (record) {
    isEditing.value = true
    Object.assign(form, {
      ...record
    })
  } else {
    isEditing.value = false
    Object.assign(form, { ...defaultForm, id: Date.now(), notificationDate: Date.now() })
  }
  isUpsertModalOpen.value = true
}

const handleUpsert = async () => {
  if (!form.notificationCode || !form.branch) {
    useToast().add({ title: 'Validation Error', description: 'Code and Branch are required.', color: 'error' })
    return
  }

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  if (isEditing.value) {
    const idx = notificationList.value.findIndex(n => n.id === form.id)
    if (idx !== -1) {
      const existing = notificationList.value[idx]
      if (existing) {
        notificationList.value[idx] = {
          ...existing,
          ...form,
          updatedBy: 'Admin',
          updatedAt: Date.now()
        }
      }
    }
  } else {
    notificationList.value.push({
      ...form,
      createdBy: 'Admin',
      updatedBy: 'Admin',
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }

  useToast().add({
    title: isEditing.value ? 'Code Updated' : 'Code Registered',
    description: `Successfully ${isEditing.value ? 'updated' : 'added'} ${form.notificationCode}.`,
    color: 'success'
  })

  isUpsertModalOpen.value = false
  isLoading.value = false
}

const handleViewDetail = (record: NotificationRecord) => {
  selectedNotification.value = record
  isDetailModalOpen.value = true
}

// ------- Filtering Logic -------
type StatusFilter = 'ALL' | 'NEW' | 'USED' | 'EXPIRED'
const statusFilter = ref<StatusFilter>('ALL')
const searchQuery = ref('')
const statusOptions: StatusFilter[] = ['ALL', 'NEW', 'USED', 'EXPIRED']

const filteredList = computed(() => {
  return notificationList.value.filter((n) => {
    const matchesStatus = statusFilter.value === 'ALL' || n.status === statusFilter.value

    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !query
      || n.notificationCode.toLowerCase().includes(query)
      || n.branch.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })
})

const handleRefresh = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 700))
  isLoading.value = false
}

const getFilterClass = (status: StatusFilter) => {
  if (statusFilter.value === status) {
    if (status === 'ALL') return 'border-amber-400 bg-amber-400 text-black shadow-[0_10px_28px_rgba(251,191,36,0.28)]'
    if (status === 'NEW') return 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
    if (status === 'USED') return 'border-white/20 bg-white/20 text-white shadow-[0_10px_28px_rgba(255,255,255,0.1)]'
    if (status === 'EXPIRED') return 'border-red-400 bg-red-400 text-black shadow-[0_10px_28px_rgba(248,113,113,0.28)]'
  }
  return 'border-white/8 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
}

const columnHelper = createColumnHelper<NotificationRecord>()

const columns = [
  columnHelper.accessor('notificationCode', {
    header: 'Code',
    cell: info => h('p', { class: 'text-xs font-mono font-black tracking-widest text-amber-400 italic uppercase' }, info.getValue())
  }),
  columnHelper.accessor('notificationDate', {
    header: 'Doc Date',
    cell: info => h('p', { class: 'text-[10px] font-bold text-white/60 italic' }, new Date(info.getValue()).toLocaleDateString('id-ID'))
  }),
  columnHelper.accessor('modelId', {
    header: 'Product Model',
    cell: (info) => {
      const model = productModels.find(m => m.id === info.getValue())
      return h('div', { class: 'flex items-center gap-3' }, [
        h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/20' }, model?.name.charAt(0)),
        h('p', { class: 'text-sm font-black italic text-white/80' }, model?.name)
      ])
    }
  }),
  columnHelper.accessor('branch', {
    header: 'Branch',
    cell: info => h('p', { class: 'text-[10px] font-black text-white/40 uppercase tracking-widest' }, info.getValue())
  }),
  columnHelper.accessor('vendorId', {
    header: 'Vendor',
    cell: (info) => {
      const vendor = vendors.find(v => v.id === info.getValue())
      return h('p', { class: 'text-[10px] font-black text-[#B6F500] italic' }, vendor?.name)
    }
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      const isNew = status === 'NEW'
      const isUsed = status === 'USED'

      return h('div', { class: 'flex items-center gap-2' }, [
        h(isNew ? CheckCircle2 : (isUsed ? History : XCircle), {
          size: 14,
          class: isNew ? 'text-emerald-400' : (isUsed ? 'text-white/20' : 'text-red-400')
        }),
        h('span', {
          class: [
            'text-[9px] font-black uppercase tracking-widest italic font-mono',
            isNew ? 'text-emerald-400' : 'text-white/20'
          ]
        }, status)
      ])
    }
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: info => h('div', { class: 'flex items-center gap-2' }, [
      h('button', {
        title: 'View History',
        onClick: () => handleViewDetail(info.row.original),
        class: 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-400/60 transition-all hover:scale-110 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 active:scale-90 shadow-lg'
      }, [
        h(History, { size: 15 })
      ]),
      h('button', {
        title: 'Edit Code',
        onClick: () => openUpsertModal(info.row.original),
        class: 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition-all hover:scale-110 hover:border-white/30 hover:bg-white/10 hover:text-white active:scale-90 shadow-lg'
      }, [
        h(Pencil, { size: 15 })
      ])
    ])
  })
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

const pageSizeOptions = [5, 10, 25]

const handlePageSizeChange = (nextPageSize: number) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: 0,
    pageSize: nextPageSize
  }
}

const table = useVueTable({
  get data() { return filteredList.value },
  columns,
  state: {
    get pagination() {
      return pagination.value
    }
  },
  onPaginationChange: (updaterOrValue) => {
    pagination.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(pagination.value)
      : updaterOrValue
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel()
})

const visibleFrom = computed(() => {
  if (!filteredList.value.length) return 0
  return pagination.value.pageIndex * pagination.value.pageSize + 1
})

const visibleTo = computed(() => {
  if (!filteredList.value.length) return 0
  return Math.min(filteredList.value.length, (pagination.value.pageIndex + 1) * pagination.value.pageSize)
})
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-amber-400">
          <Bell :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">Code Registry</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Notification <span class="text-amber-400">Master</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Master data kode notifikasi dan tracking status penggunaan sesuai schema database.
        </p>
      </div>
      <div class="flex gap-4">
        <button
          class="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black italic shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          @click="openUpsertModal()"
        >
          <Plus :size="16" /> Register New Codes
        </button>
      </div>
    </div>

    <!-- Statistic Cards -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-4 mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-75">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="group relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl overflow-hidden transition-all hover:border-amber-500/30 hover:bg-white/8"
      >
        <div class="absolute -top-10 -right-10 h-32 w-32 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">
          {{ stat.label }}
        </p>
        <p :class="['text-4xl font-black italic tracking-tighter', stat.color]">
          {{ stat.value.padStart(2, '0') }}
        </p>
      </div>
    </div>

    <!-- Filter Panel -->
    <section class="mb-10 rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.05),transparent_25%),rgba(255,255,255,0.02)] p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="min-w-0 flex-1">
          <p class="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
            Filter by status
          </p>
          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              v-for="status in statusOptions"
              :key="status"
              :class="[
                'group whitespace-nowrap rounded-2xl border px-5 py-3 text-left transition-all',
                statusFilter === status ? getFilterClass(status) : getFilterClass(status)
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
                <span class="text-[10px] font-black uppercase tracking-[0.22em]">
                  {{ status }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="rounded-2xl border border-white/8 bg-black/20 px-5 py-3 flex items-center gap-4">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
                Results
              </p>
              <p class="text-xl font-black tracking-tight text-amber-400 mt-1">
                {{ filteredList.length.toString().padStart(2, '0') }}
                <span class="text-white/30 text-sm font-semibold">/ {{ notificationList.length.toString().padStart(2, '0') }}</span>
              </p>
            </div>
          </div>
          <button
            class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/45 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            :class="{ 'animate-spin': isLoading }"
            @click="handleRefresh"
          >
            <RefreshCw :size="20" />
          </button>
        </div>
      </div>
    </section>

    <!-- Table Section -->
    <div class="relative rounded-[36px] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
      >
        <div class="h-10 w-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>

      <div class="p-6 border-b border-white/5">
        <div class="relative w-full max-w-md">
          <Search
            :size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search Notification Code or Branch..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-amber-500/50"
          >
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="px-6 py-6 2xl:px-10"
              >
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="group hover:bg-white/5 transition-all duration-300"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-6 py-7 2xl:px-10"
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

      <DashboardTablePagination
        :page-size="pagination.pageSize"
        :page-size-options="pageSizeOptions"
        :visible-from="visibleFrom"
        :visible-to="visibleTo"
        :total-items="filteredList.length"
        :page-index="table.getState().pagination.pageIndex"
        :page-count="table.getPageCount()"
        :can-previous-page="table.getCanPreviousPage()"
        :can-next-page="table.getCanNextPage()"
        accent-class="text-white/80"
        button-class="text-white/40 hover:bg-white/10 hover:text-white"
        @update:page-size="handlePageSizeChange"
        @first="table.setPageIndex(0)"
        @previous="table.previousPage()"
        @next="table.nextPage()"
        @last="table.setPageIndex(table.getPageCount() - 1)"
      />
    </div>

    <!-- Detail Modal -->
    <UModal
      v-model:open="isDetailModalOpen"
      :dismissible="false"
      :ui="{ content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-2xl w-full', overlay: 'bg-black/95 backdrop-blur-2xl' }"
    >
      <template #content>
        <div
          v-if="selectedNotification"
          class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#060606] p-0 shadow-[0_60px_180px_-40px_rgba(0,0,0,1)]"
        >
          <div class="absolute -top-32 -left-32 h-80 w-80 bg-amber-600/10 blur-[140px]" />
          <div class="relative z-10 p-10 2xl:p-12">
            <div class="flex items-start justify-between">
              <div>
                <div class="mb-4 flex items-center gap-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Fingerprint :size="20" />
                  </div>
                  <span class="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Code Details</span>
                </div>
                <h2
                  class="text-5xl font-black italic tracking-tighter uppercase text-white"
                >
                  {{ selectedNotification.notificationCode }}
                </h2>
                <div class="mt-4 flex items-center gap-3">
                  <span :class="['rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg', selectedNotification.status === 'NEW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20']">
                    ● {{ selectedNotification.status }}
                  </span>
                </div>
              </div>
              <button
                class="group h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                @click="isDetailModalOpen = false"
              >
                <X
                  :size="24"
                  class="transition-transform group-hover:rotate-90"
                />
              </button>
            </div>

            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-12">
              <div class="space-y-6">
                <div class="rounded-3xl border border-white/5 bg-white/2 p-6 space-y-4">
                  <div class="flex items-center gap-3">
                    <LayoutGrid
                      :size="16"
                      class="text-white/20"
                    />
                    <div>
                      <p
                        class="text-[9px] font-black uppercase tracking-widest text-white/20"
                      >
                        Product Model
                      </p>
                      <p class="text-sm font-black text-white/80 italic">
                        {{ productModels.find(m => m.id === selectedNotification?.modelId)?.name }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <MapPin
                      :size="16"
                      class="text-white/20"
                    />
                    <div>
                      <p
                        class="text-[9px] font-black uppercase tracking-widest text-white/20"
                      >
                        Branch Location
                      </p>
                      <p
                        class="text-sm font-black text-white/80 italic"
                      >
                        {{ selectedNotification.branch }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <Tag
                      :size="16"
                      class="text-white/20"
                    />
                    <div>
                      <p
                        class="text-[9px] font-black uppercase tracking-widest text-white/20"
                      >
                        Vendor Affiliate
                      </p>
                      <p
                        class="text-sm font-black text-[#B6F500] italic"
                      >
                        {{ vendors.find(v => v.id === selectedNotification?.vendorId)?.name }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="rounded-3xl border border-white/5 bg-white/2 p-6 space-y-4">
                  <div class="flex items-start gap-3">
                    <CalendarDays
                      :size="16"
                      class="text-white/20"
                    />
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-widest text-white/20">
                        Document Date
                      </p>
                      <p class="text-sm font-black text-white/80 italic">
                        {{ new Date(selectedNotification.notificationDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ') }}
                      </p>
                    </div>
                  </div>
                  <div class="pt-4 border-t border-white/5">
                    <p class="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                      Created by {{ selectedNotification.createdBy }}
                    </p>
                    <p class="text-[10px] font-bold text-white/10 mt-1 italic">
                      Last modified on {{ new Date(selectedNotification.updatedAt).toLocaleDateString('id-ID') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-14 flex gap-4">
              <button
                class="flex-1 flex items-center justify-center gap-3 rounded-3xl bg-white py-5 text-[10px] font-black uppercase tracking-widest text-[#080808] transition-all hover:scale-[1.03] active:scale-[0.97]"
                @click="isDetailModalOpen = false; openUpsertModal(selectedNotification)"
              >
                <Pencil :size="16" /> Edit Record
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>    <!-- Upsert Modal -->
    <UModal
      v-model:open="isUpsertModalOpen"
      :dismissible="false"
      :ui="{ content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-3xl w-full', overlay: 'bg-black/90 backdrop-blur-xl' }"
    >
      <template #content>
        <div class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#080808] p-10 2xl:p-12 shadow-[0_60px_160px_-40px_rgba(0,0,0,0.95)]">
          <div class="absolute -top-32 -right-32 h-64 w-64 bg-amber-600/10 blur-[120px]" />
          <div class="relative z-10 flex items-center justify-between mb-10">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-2">
                {{ isEditing ? 'Modification' : 'Registration' }}
              </p>
              <h2 class="text-4xl font-black italic tracking-tighter uppercase text-white">
                {{ isEditing ? 'Edit' : 'Register' }} <span class="text-amber-400 italic">Notification</span>
              </h2>
            </div>
            <button
              class="group h-14 w-14 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40 transition-all hover:bg-white/10 hover:text-white"
              @click="isUpsertModalOpen = false"
            >
              <X
                :size="24"
                class="transition-transform group-hover:rotate-90"
              />
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div class="space-y-6">
              <div class="group space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-amber-400 transition-colors">Notification<span class="text-red-500">*</span></label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                  <input
                    v-model="form.notificationCode"
                    type="text"
                    placeholder="e.g. N2024-XXXXX"
                    class="h-14 w-full rounded-2xl border border-white/8 bg-white/3 pl-10 pr-6 text-sm font-black uppercase tracking-widest text-white focus:border-amber-500/50 outline-none transition-all"
                  >
                </div>
              </div>

              <div class="group space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-amber-400">Branch <span class="text-red-500">*</span></label>
                <input
                  v-model="form.branch"
                  type="text"
                  placeholder="e.g. JKT-01"
                  class="h-14 w-full rounded-2xl border border-white/8 bg-white/3 px-6 text-sm font-black italic text-white focus:border-amber-500/50 outline-none transition-all"
                >
              </div>

              <div class="space-y-4 p-6 rounded-3xl border border-white/5 bg-white/2">
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">
                  System Status
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <button
                    v-for="s in (['NEW'] as const)"
                    :key="s"
                    :class="['rounded-xl border px-3 py-4 text-[11px] font-black uppercase tracking-widest transition-all w-full', form.status === s ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/2 text-white/30']"
                    @click="form.status = s"
                  >
                    {{ s }}
                  </button>
                </div>
                <p
                  v-if="form.status === 'USED'"
                  class="text-[9px] font-bold text-white/20 italic text-center uppercase tracking-widest"
                >
                  Used codes cannot be reverted via form
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Vendor</label>
                <UInputMenu
                  v-model="form.vendorId"
                  :items="vendors"
                  value-key="id"
                  label-key="name"
                  placeholder="Select Vendor..."
                  size="xl"
                  variant="none"
                  :ui="{
                    root: 'w-full',
                    base: 'h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-black italic text-[#B6F500] focus:ring-2 focus:ring-amber-500/40 transition-all hover:bg-white/[0.08]',
                    content: 'bg-[#0a0a0a] border-none rounded-2xl shadow-[0_45px_150px_-50px_rgba(251,191,36,0.2)] overflow-hidden p-1',
                    item: 'text-white/50 data-highlighted:text-black data-highlighted:before:bg-amber-400 font-black italic uppercase text-[10px] tracking-widest py-4 transition-colors'
                  }"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Model Name</label>
                <UInputMenu
                  v-model="form.modelId"
                  :items="productModels"
                  value-key="id"
                  label-key="name"
                  placeholder="Select Model..."
                  size="xl"
                  variant="none"
                  :ui="{
                    root: 'w-full',
                    base: 'h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-black italic text-white focus:ring-2 focus:ring-amber-500/40 transition-all hover:bg-white/[0.08]',
                    content: 'bg-[#0a0a0a] border-none rounded-2xl shadow-[0_45px_150px_-50px_rgba(251,191,36,0.2)] overflow-hidden p-1',
                    item: 'text-white/50 data-highlighted:text-black data-highlighted:before:bg-amber-400 font-black italic uppercase text-[10px] tracking-widest py-4 transition-colors'
                  }"
                />
              </div>

              <div class="group space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-amber-400 transition-colors">Notification Date</label>
                <UInputDate
                  ref="notificationDateInput"
                  v-model="calendarDate"
                  locale="id-ID"
                  size="xl"
                  icon="i-lucide-calendar"
                  :ui="{
                    base: 'h-14 w-full rounded-2xl border border-white/8 bg-white/3 px-4 text-sm font-black italic text-white focus-within:border-amber-500/50 transition-all cursor-pointer',
                    segment: 'text-white/80 data-placeholder:text-white/30'
                  }"
                >
                  <template #trailing>
                    <UPopover :reference="notificationDateRef?.inputsRef?.[3]?.$el">
                      <UButton
                        color="neutral"
                        variant="link"
                        size="sm"
                        icon="i-lucide-calendar-days"
                        aria-label="Open date picker"
                        class="px-0 text-amber-400/60 hover:text-amber-400"
                      />
                      <template #content>
                        <UCalendar
                          v-model="calendarDate"
                          class="p-2"
                        />
                      </template>
                    </UPopover>
                  </template>
                </UInputDate>
              </div>
            </div>
          </div>

          <div class="mt-12 flex gap-4 relative z-10 border-t border-white/5 pt-8">
            <button
              class="flex-1 rounded-2xl border border-white/10 bg-white/5 py-5 text-[10px] font-black uppercase tracking-widest text-white/50 transition-all hover:bg-white/10 hover:text-white"
              @click="isUpsertModalOpen = false"
            >
              Discard changes
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white py-5 text-[10px] font-black uppercase tracking-widest text-[#080808] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl"
              @click="handleUpsert"
            >
              <Save :size="16" /> {{ isEditing ? 'Update Record' : 'Register Code' }}
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
