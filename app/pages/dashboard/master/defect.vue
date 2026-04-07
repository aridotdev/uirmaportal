<script setup lang="ts">
import { AlertCircle, Plus, Eye, Power, CheckCircle, Pencil, Save, X, CalendarDays, Fingerprint, User2, History, ArrowUpDown } from 'lucide-vue-next'
import { h, computed, ref, reactive } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useVueTable,
  FlexRender,
  type SortingState
} from '@tanstack/vue-table'
import { z } from 'zod'

definePageMeta({ layout: 'dashboard' })

interface DefectMaster {
  id: number
  code: string
  name: string
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt?: number
}

const defectList = ref<DefectMaster[]>([
  {
    id: 1,
    code: 'D-001',
    name: 'Layar Retak / Pecah',
    isActive: true,
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: Date.now() - 10000000
  },
  {
    id: 2,
    code: 'D-002',
    name: 'Mati Total',
    isActive: true,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 20000000
  },
  {
    id: 3,
    code: 'D-003',
    name: 'Speaker Cempreng',
    isActive: true,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 30000000
  },
  {
    id: 4,
    code: 'D-004',
    name: 'Remote Tidak Berfungsi',
    isActive: false,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 40000000
  }
])

// ------- CRUD & Modal Logic -------
const isStatusModalOpen = ref(false)
const isUpsertModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isEditing = ref(false)
const itemToToggle = ref<DefectMaster | null>(null)
const selectedItem = ref<DefectMaster | null>(null)

const defaultForm = {
  id: 0,
  code: '',
  name: '',
  isActive: true
}

const form = reactive({ ...defaultForm })
const formErrors = ref<Record<string, string>>({})

const defectSchema = z.object({
  code: z.string().min(1, 'Code wajib diisi').max(20, 'Max 20 karakter'),
  name: z.string().min(1, 'Name wajib diisi').max(100, 'Max 100 karakter')
})

function validateForm(): boolean {
  formErrors.value = {}
  const result = defectSchema.safeParse(form)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path[0]
      if (path) formErrors.value[String(path)] = issue.message
    }
    return false
  }

  return true
}

const openUpsertModal = (item?: DefectMaster) => {
  if (item) {
    isEditing.value = true
    Object.assign(form, {
      ...item
    })
  } else {
    isEditing.value = false
    Object.assign(form, { ...defaultForm, id: Date.now() }) // Simple ID generation
  }
  isUpsertModalOpen.value = true
}

const handleUpsert = async () => {
  if (!validateForm()) return

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  if (isEditing.value) {
    const idx = defectList.value.findIndex(v => v.id === form.id)
    if (idx !== -1) {
      const existing = defectList.value[idx]
      if (existing) {
        defectList.value[idx] = {
          ...existing,
          ...form,
          updatedBy: 'Admin',
          updatedAt: Date.now()
        }
      }
    }
  } else {
    defectList.value.push({
      ...form,
      createdBy: 'Admin',
      updatedBy: 'Admin',
      createdAt: Date.now()
    })
  }

  useToast().add({
    title: isEditing.value ? 'Defect Updated' : 'Defect Created',
    description: `Successfully ${isEditing.value ? 'updated' : 'added'} ${form.name}.`,
    color: 'success'
  })

  isUpsertModalOpen.value = false
  isLoading.value = false
}

const handleViewDetail = (item: DefectMaster) => {
  selectedItem.value = item
  isDetailModalOpen.value = true
}

const confirmToggleStatus = (item: DefectMaster) => {
  itemToToggle.value = item
  isStatusModalOpen.value = true
}

const handleToggleStatus = async () => {
  if (!itemToToggle.value) return

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  const item = defectList.value.find(v => v.id === itemToToggle.value?.id)
  if (item) {
    item.isActive = !item.isActive
  }

  useToast().add({
    title: `Status Updated`,
    description: `${itemToToggle.value.name} is now ${item?.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
    color: item?.isActive ? 'success' : 'warning'
  })

  isStatusModalOpen.value = false
  itemToToggle.value = null
  isLoading.value = false
}

// ------- Filtering Logic -------
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
const statusFilter = ref<StatusFilter>('ALL')
const searchQuery = ref('')
const statusOptions: StatusFilter[] = ['ALL', 'ACTIVE', 'INACTIVE']
const isLoading = ref(false)

const filteredList = computed(() => {
  return defectList.value.filter((v) => {
    const matchesStatus = statusFilter.value === 'ALL'
      || (statusFilter.value === 'ACTIVE' ? v.isActive : !v.isActive)

    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !query
      || v.code.toLowerCase().includes(query)
      || v.name.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })
})

const hasActiveFilters = computed(() => statusFilter.value !== 'ALL' || searchQuery.value.trim().length > 0)

const resetFilters = () => {
  statusFilter.value = 'ALL'
  searchQuery.value = ''
}

const handleRefresh = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 700))
  isLoading.value = false
}

watch([statusFilter, searchQuery], () => {
  pagination.value.pageIndex = 0
})

const getFilterClass = (status: StatusFilter) => {
  if (statusFilter.value === status) {
    if (status === 'ALL') return 'border-red-500 bg-red-500 text-white shadow-[0_10px_28px_rgba(239,68,68,0.28)]'
    if (status === 'ACTIVE') return 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
    if (status === 'INACTIVE') return 'border-white/20 bg-white/20 text-white shadow-[0_10px_28px_rgba(255,255,255,0.1)]'
  }
  return 'border-white/8 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
}

const columnHelper = createColumnHelper<DefectMaster>()
const sorting = ref<SortingState>([])

const columns = [
  columnHelper.accessor('code', {
    header: 'Defect Code',
    enableSorting: true,
    cell: info => h('p', { class: 'text-xs font-mono font-black tracking-widest text-red-500 italic uppercase' }, info.getValue())
  }),
  columnHelper.accessor('name', {
    header: 'Defect Name',
    enableSorting: true,
    cell: info => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/20 transition-all group-hover:border-red-500/30 group-hover:text-red-400' }, info.getValue().charAt(0)),
      h('p', { class: 'text-sm font-black italic text-white/80 group-hover:text-white transition-colors' }, info.getValue())
    ])
  }),
  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: info => h('span', {
      class: [
        'inline-block rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest font-mono shadow-lg transition-all group-hover:scale-105',
        info.getValue() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
      ]
    }, info.getValue() ? 'ACTIVE' : 'INACTIVE')
  }),
  columnHelper.accessor('createdAt', {
    header: 'Registered',
    cell: info => h('p', { class: 'text-[10px] font-bold text-white/30 italic' }, new Date(info.getValue()).toLocaleDateString('id-ID'))
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: info => h('div', { class: 'flex items-center gap-2' }, [
      h('button', {
        title: 'View Detail',
        onClick: () => handleViewDetail(info.row.original),
        class: 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-blue-400/60 transition-all hover:scale-110 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 active:scale-90 shadow-lg'
      }, [
        h(Eye, { size: 15 })
      ]),
      h('button', {
        title: 'Edit Defect',
        onClick: () => openUpsertModal(info.row.original),
        class: 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-400/60 transition-all hover:scale-110 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 active:scale-90 shadow-lg'
      }, [
        h(Pencil, { size: 15 })
      ]),
      h('button', {
        title: info.row.original.isActive ? 'Deactivate Defect' : 'Activate Defect',
        onClick: () => confirmToggleStatus(info.row.original),
        class: [
          'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:scale-110 active:scale-90 shadow-lg',
          info.row.original.isActive
            ? 'text-red-500/60 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10'
            : 'text-emerald-500/60 hover:text-emerald-500 hover:border-emerald-500/30 hover:bg-emerald-500/10'
        ]
      }, [
        h(Power, { size: 15 })
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
    },
    get sorting() {
      return sorting.value
    }
  },
  onPaginationChange: (updaterOrValue) => {
    pagination.value = typeof updaterOrValue === 'function'
      ? updaterOrValue(pagination.value)
      : updaterOrValue
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
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
    <PageHeader
      title="Defect Master"
      description="Master data jenis kerusakan."
    >
      <template #actions>
        <button
          class="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95"
          @click="openUpsertModal()"
        >
          <Plus :size="16" /> Add New Defect
        </button>
      </template>
    </PageHeader>

    <FilterBar
      v-model:search="searchQuery"
      v-model:refreshing="isLoading"
      search-placeholder="Search by defect code or name..."
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

      <template #summary>
        <div class="rounded-2xl border border-white/8 bg-black/20 px-5 py-3">
          <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
            Total Displayed
          </p>
          <p class="text-xl font-black tracking-tight text-red-500 mt-1">
            {{ filteredList.length.toString().padStart(2, '0') }}
            <span class="text-white/30 text-sm font-semibold">/ {{ defectList.length.toString().padStart(2, '0') }}</span>
          </p>
        </div>
      </template>
    </FilterBar>

    <div class="relative rounded-[36px] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
      <LoadingState
        v-if="isLoading"
        variant="table"
        :rows="6"
      />
      <EmptyState
        v-else-if="filteredList.length === 0 && hasActiveFilters"
        title="Tidak ada data ditemukan"
        description="Coba ubah filter atau kata kunci pencarian."
        action-label="Reset Filter"
        @action="resetFilters"
      />
      <EmptyState
        v-else-if="defectList.length === 0"
        title="Belum ada data"
        description="Data akan muncul saat sudah tersedia."
      />
      <div
        v-else
        class="overflow-x-auto"
      >
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
                :class="[
                  'px-6 py-6 2xl:px-10',
                  header.column.getCanSort() ? 'cursor-pointer select-none hover:text-white/50 transition-colors' : ''
                ]"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <div class="flex items-center gap-1.5">
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <ArrowUpDown
                    v-if="header.column.getCanSort()"
                    :size="12"
                    :class="header.column.getIsSorted() ? 'text-red-400' : 'text-white/15'"
                  />
                </div>
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
        v-if="!isLoading && filteredList.length > 0"
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
      :ui="{
        content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-2xl w-full',
        overlay: 'bg-black/95 backdrop-blur-2xl'
      }"
    >
      <template #content>
        <div
          v-if="selectedItem"
          class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#060606] p-0 shadow-[0_60px_180px_-40px_rgba(0,0,0,1)]"
        >
          <!-- Premium Backdrop Accent -->
          <div class="absolute -top-32 -left-32 h-80 w-80 bg-red-600/10 blur-[140px]" />
          <div class="absolute -bottom-32 -right-32 h-80 w-80 bg-emerald-500/5 blur-[140px]" />

          <!-- Modal Header -->
          <div class="relative z-10 p-10 2xl:p-12">
            <div class="flex items-start justify-between">
              <div>
                <div class="mb-4 flex items-center gap-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <Fingerprint :size="20" />
                  </div>
                  <span class="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Defect identity</span>
                </div>
                <h2 class="text-5xl font-black italic tracking-tighter uppercase text-white">
                  {{ selectedItem.name }}
                </h2>
                <div class="mt-4 flex items-center gap-3">
                  <code
                    class="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-black tracking-widest text-red-500 italic"
                  >
                    {{ selectedItem.code }}
                  </code>
                  <span
                    :class="[
                      'rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                      selectedItem.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    ]"
                  >
                    ● {{ selectedItem.isActive ? 'Operational' : 'Deactivated' }}
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

            <!-- Content Grid -->
            <div class="mt-12 border-t border-white/5 pt-12">
              <!-- History & Audit -->
              <div class="space-y-6 flex flex-col">
                <div class="rounded-3xl border border-white/5 bg-white/2 p-6 space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex items-start gap-4">
                      <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 shrink-0">
                        <CalendarDays :size="20" />
                      </div>
                      <div>
                        <p
                          class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20"
                        >
                          Registered On
                        </p>
                        <p
                          class="text-sm font-black italic text-white/80 mt-1"
                        >
                          {{ new Date(selectedItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                        </p>
                      </div>
                    </div>
                    <div class="flex items-start gap-4">
                      <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 shrink-0">
                        <User2 :size="20" />
                      </div>
                      <div>
                        <p
                          class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20"
                        >
                          Maintained By
                        </p>
                        <p
                          class="text-sm font-black italic text-white/80 mt-1"
                        >
                          {{ selectedItem.updatedBy }}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-start gap-4 pt-4 border-t border-white/5">
                    <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 shrink-0">
                      <History :size="20" />
                    </div>
                    <div class="flex-1">
                      <p
                        class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 italic"
                      >
                        Last Interaction
                      </p>
                      <p
                        v-if="selectedItem.updatedAt"
                        class="text-xs font-bold text-white/40 mt-1 italic"
                      >
                        {{ new Date(selectedItem.updatedAt).toLocaleTimeString('id-ID') }} WIB
                      </p>
                      <p
                        v-else
                        class="text-xs font-bold text-white/20 mt-1 italic"
                      >
                        No modifications
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Footer -->
            <div class="mt-14 flex gap-4">
              <button
                class="flex-1 flex items-center justify-center gap-3 rounded-3xl bg-white py-5 text-[10px] font-black uppercase tracking-widest text-[#080808] transition-all hover:scale-[1.03] active:scale-[0.97]"
                @click="isDetailModalOpen = false; openUpsertModal(selectedItem)"
              >
                <Pencil :size="16" /> Edit Defect Profile
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Status Toggle Confirmation Modal -->
    <UModal
      v-model:open="isStatusModalOpen"
      :dismissible="false"
      :ui="{
        content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-md w-full',
        overlay: 'bg-black/80 backdrop-blur-md'
      }"
    >
      <template #content>
        <div class="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#0c0c0c] p-10 shadow-[0_45px_130px_-30px_rgba(0,0,0,0.85)]">
          <!-- Dynamic Glow accent -->
          <div
            class="absolute -top-24 -left-24 h-48 w-48 blur-[100px] transition-colors duration-500"
            :class="itemToToggle?.isActive ? 'bg-orange-600/10' : 'bg-emerald-600/10'"
          />

          <div class="relative z-10 flex flex-col items-center text-center">
            <div
              class="mb-8 flex h-20 w-20 items-center justify-center rounded-[32px] border transition-all duration-500 shadow-xl scale-110"
              :class="itemToToggle?.isActive
                ? 'border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-orange-500/10'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10'"
            >
              <component
                :is="itemToToggle?.isActive ? AlertCircle : CheckCircle"
                :size="32"
                stroke-width="2.5"
              />
            </div>

            <p
              class="mb-2 text-[11px] font-black uppercase tracking-[0.4em] transition-colors"
              :class="itemToToggle?.isActive ? 'text-orange-500/50' : 'text-emerald-500/50'"
            >
              Master Data Policy
            </p>
            <h3 class="mb-4 text-3xl font-black italic tracking-tighter uppercase text-white">
              {{ itemToToggle?.isActive ? 'Deactivate' : 'Activate' }} <span
                class="italic underline underline-offset-8 transition-colors"
                :class="itemToToggle?.isActive ? 'text-orange-500 decoration-orange-500/30' : 'text-emerald-500 decoration-emerald-500/30'"
              >Defect</span>?
            </h3>

            <p class="mb-10 text-pretty text-sm font-medium leading-relaxed text-white/40 italic px-2">
              You are about to modify the visibility of <span class="font-black text-white/80">"{{ itemToToggle?.name }}"</span>.
              <template v-if="itemToToggle?.isActive">
                Inactive defects <span class="font-bold text-orange-500/70">cannot be selected</span> in new transactions but their history will be preserved.
              </template>
              <template v-else>
                This will restore access to this defect for <span class="font-bold text-emerald-500/70">all system modules</span> immediately.
              </template>
            </p>

            <div class="grid w-full grid-cols-2 gap-4">
              <button
                class="group flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                @click="isStatusModalOpen = false"
              >
                Cancel
              </button>
              <button
                class="flex items-center justify-center gap-2 rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                :class="itemToToggle?.isActive
                  ? 'bg-orange-600 shadow-orange-500/20 hover:bg-orange-500'
                  : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-500'"
                @click="handleToggleStatus"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Upsert Modal (Create & Edit) -->
    <UModal
      v-model:open="isUpsertModalOpen"
      :dismissible="false"
      :ui="{
        content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-xl w-full',
        overlay: 'bg-black/90 backdrop-blur-xl'
      }"
    >
      <template #content>
        <div class="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#080808] p-0 shadow-[0_60px_150px_-40px_rgba(0,0,0,0.9)]">
          <div class="absolute -top-24 -left-24 h-64 w-64 bg-red-500/10 blur-[100px]" />

          <div class="relative z-10 p-10">
            <div class="mb-10 flex items-center justify-between">
              <div>
                <div class="mb-3 flex items-center gap-2">
                  <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <Save :size="16" />
                  </div>
                  <span class="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{{ isEditing ? 'Edit Existing' : 'Register New' }} Defect</span>
                </div>
                <h2 class="text-4xl font-black italic tracking-tighter uppercase text-white">
                  {{ isEditing ? 'Update' : 'Add' }} <span class="text-red-500">Defect</span>
                </h2>
              </div>
              <button
                class="group h-12 w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 transition-all hover:bg-white/10 hover:text-white"
                @click="isUpsertModalOpen = false"
              >
                <X
                  :size="20"
                  class="transition-transform group-hover:rotate-90"
                />
              </button>
            </div>

            <div class="space-y-8">
              <!-- Basic Info Section -->
              <div class="space-y-6">
                <div class="grid grid-cols-1 gap-6">
                  <div class="space-y-2">
                    <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30 italic">Defect Code</label>
                    <div class="relative">
                      <Fingerprint
                        :size="18"
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                      />
                      <input
                        v-model="form.code"
                        type="text"
                        placeholder="e.g. D-001"
                        class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-bold text-white outline-none transition-all focus:border-red-500/50 uppercase font-mono tracking-widest"
                        @input="formErrors.code = ''"
                      >
                    </div>
                    <p
                      v-if="formErrors.code"
                      class="text-xs text-red-400 mt-1"
                    >
                      {{ formErrors.code }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30 italic">Defect Name</label>
                    <div class="relative">
                      <AlertCircle
                        :size="18"
                        class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                      />
                      <input
                        v-model="form.name"
                        type="text"
                        placeholder="e.g. Layar Retak"
                        class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-bold text-white outline-none transition-all focus:border-red-500/50 italic"
                        @input="formErrors.name = ''"
                      >
                    </div>
                    <p
                      v-if="formErrors.name"
                      class="text-xs text-red-400 mt-1"
                    >
                      {{ formErrors.name }}
                    </p>
                  </div>
                </div>

                <div class="p-6 rounded-3xl border border-white/5 bg-white/2 space-y-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/20">
                    Status Configuration
                  </p>
                  <button
                    class="flex w-full items-center justify-between rounded-xl border px-5 py-4 transition-all"
                    :class="form.isActive ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-red-500/30 bg-red-500/5 text-red-400'"
                    @click="form.isActive = !form.isActive"
                  >
                    <span class="text-xs font-black uppercase tracking-widest">{{ form.isActive ? 'Active' : 'Deactivated' }}</span>
                    <Power
                      :size="16"
                    />
                  </button>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-4 pt-4">
                <button
                  class="flex-1 rounded-2xl border border-white/10 bg-white/5 py-5 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white"
                  @click="isUpsertModalOpen = false"
                >
                  Discard
                </button>
                <button
                  class="flex-2 rounded-2xl bg-red-600 py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-red-900/20 transition-all hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  @click="handleUpsert"
                >
                  <Save :size="16" />
                  {{ isEditing ? 'Save Changes' : 'Confirm Registration' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
