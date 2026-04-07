<script setup lang="ts">
import { Plus, PackageOpen, Eye, Pencil, Power, CheckCircle, AlertCircle, X, CalendarDays, Fingerprint, User2, History, Layers, Save } from 'lucide-vue-next'
import { h, computed, ref, reactive } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'

interface ProductModel {
  id: number
  name: string
  inch: number
  vendorId: number
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt?: number
}

interface Vendor {
  id: number
  name: string
}

const vendorOptions = ref<Vendor[]>([
  { id: 1, name: 'MOKA' },
  { id: 2, name: 'MTC' },
  { id: 3, name: 'SDP' }
])

const productModelList = ref<ProductModel[]>([
  {
    id: 1,
    name: 'QLED 4K Q80C',
    inch: 55,
    vendorId: 1,
    isActive: true,
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: Date.now() - 10000000
  },
  {
    id: 2,
    name: 'Odyssey G7',
    inch: 28,
    vendorId: 2,
    isActive: true,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 20000000
  },
  {
    id: 3,
    name: 'Crystal UHD CU7100',
    inch: 43,
    vendorId: 3,
    isActive: false,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 30000000
  }
])

// ------- CRUD & Modal Logic -------
const isStatusModalOpen = ref(false)
const isUpsertModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isEditing = ref(false)
const modelToToggle = ref<ProductModel | null>(null)
const selectedModel = ref<ProductModel | null>(null)
const isLoading = ref(false)

const defaultForm = {
  id: 0,
  name: '',
  inch: 0,
  vendorId: 1,
  isActive: true
}

const form = reactive({ ...defaultForm })

const openUpsertModal = (model?: ProductModel) => {
  if (model) {
    isEditing.value = true
    Object.assign(form, { ...model })
  } else {
    isEditing.value = false
    Object.assign(form, { ...defaultForm })
  }
  isUpsertModalOpen.value = true
}

const handleUpsert = async () => {
  if (!form.name || !form.inch || !form.vendorId) {
    useToast().add({ title: 'Validation Error', description: 'Name, Inch, and Vendor are required.', color: 'error' })
    return
  }

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  if (isEditing.value) {
    const idx = productModelList.value.findIndex(m => m.id === form.id)
    if (idx !== -1) {
      const existingModel = productModelList.value[idx]
      if (existingModel) {
        productModelList.value[idx] = {
          ...existingModel,
          ...form,
          updatedBy: 'Admin',
          updatedAt: Date.now()
        }
      }
    }
  } else {
    productModelList.value.push({
      ...form,
      id: Date.now(),
      createdBy: 'Admin',
      updatedBy: 'Admin',
      createdAt: Date.now()
    })
  }

  useToast().add({
    title: isEditing.value ? 'Model Updated' : 'Model Created',
    description: `Successfully ${isEditing.value ? 'updated' : 'added'} ${form.name}.`,
    color: 'success'
  })

  isUpsertModalOpen.value = false
  isLoading.value = false
}

const handleViewDetail = (model: ProductModel) => {
  selectedModel.value = model
  isDetailModalOpen.value = true
}

const confirmToggleStatus = (model: ProductModel) => {
  modelToToggle.value = model
  isStatusModalOpen.value = true
}

const handleToggleStatus = async () => {
  if (!modelToToggle.value) return

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  const model = productModelList.value.find(m => m.id === modelToToggle.value?.id)
  if (model) {
    model.isActive = !model.isActive
  }

  useToast().add({
    title: `Status Updated`,
    description: `${modelToToggle.value.name} is now ${model?.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
    color: model?.isActive ? 'success' : 'warning'
  })

  isStatusModalOpen.value = false
  modelToToggle.value = null
  isLoading.value = false
}

// ------- Filtering Logic -------
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
const statusFilter = ref<StatusFilter>('ALL')
const searchQuery = ref('')
const statusOptions: StatusFilter[] = ['ALL', 'ACTIVE', 'INACTIVE']

const filteredList = computed(() => {
  return productModelList.value.filter((m) => {
    const matchesStatus = statusFilter.value === 'ALL'
      || (statusFilter.value === 'ACTIVE' ? m.isActive : !m.isActive)

    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !query
      || m.name.toLowerCase().includes(query)
      || vendorOptions.value.find(v => v.id === m.vendorId)?.name.toLowerCase().includes(query)

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
    if (status === 'ALL') return 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]'
    if (status === 'ACTIVE') return 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
    if (status === 'INACTIVE') return 'border-red-400 bg-red-400 text-black shadow-[0_10px_28px_rgba(248,113,113,0.28)]'
  }
  return 'border-white/8 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
}

const columnHelper = createColumnHelper<ProductModel>()

const columns = [
  columnHelper.accessor('name', {
    header: 'Model Name',
    cell: info => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/20 transition-all group-hover:border-[#B6F500]/30 group-hover:text-[#B6F500]' }, info.getValue().charAt(0)),
      h('p', { class: 'text-sm font-black italic text-white/80 group-hover:text-white transition-colors' }, info.getValue())
    ])
  }),
  columnHelper.accessor('inch', {
    header: 'Spec / Size',
    cell: info => h('p', { class: 'text-xs font-mono font-black tracking-widest text-[#B6F500] italic' }, `${info.getValue()}" SCREEN`)
  }),
  columnHelper.accessor('vendorId', {
    header: 'Assigned Vendor',
    cell: (info) => {
      const vendor = vendorOptions.value.find(v => v.id === info.getValue())
      return h('div', { class: 'flex items-center gap-2' }, [
        h(Layers, { size: 12, class: 'text-white/20' }),
        h('span', { class: 'text-[10px] font-black uppercase tracking-widest text-white/40' }, vendor?.name || 'Unknown')
      ])
    }
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
        title: 'Edit Model',
        onClick: () => openUpsertModal(info.row.original),
        class: 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-400/60 transition-all hover:scale-110 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 active:scale-90 shadow-lg'
      }, [
        h(Pencil, { size: 15 })
      ]),
      h('button', {
        title: info.row.original.isActive ? 'Deactivate Model' : 'Activate Model',
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
    <PageHeader
      title="Product Models"
      description="Master data product model."
    >
      <template #actions>
        <button
          class="flex items-center gap-2 rounded-2xl bg-[#B6F500] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#080808] italic shadow-lg shadow-[#B6F500]/20 transition-all hover:scale-105 active:scale-95"
          @click="openUpsertModal()"
        >
          <Plus :size="16" /> Add New Model
        </button>
      </template>
    </PageHeader>

    <FilterBar
      v-model:search="searchQuery"
      v-model:refreshing="isLoading"
      search-placeholder="Search by model name or vendor..."
      :show-refresh="true"
      :show-reset="true"
      :has-active-filters="hasActiveFilters"
      @refresh="handleRefresh"
      @reset="resetFilters"
    >
      <button
        v-for="status in statusOptions"
        :key="status"
        :class="statusFilter === status ? getFilterClass(status) : getFilterClass(status)"
        class="group whitespace-nowrap rounded-2xl border px-5 py-3 text-left transition-all"
        @click="statusFilter = status"
      >
        <div class="flex items-center gap-2">
          <span
            :class="statusFilter === status ? 'opacity-90' : 'opacity-55 group-hover:opacity-80'"
            class="h-2 w-2 rounded-full transition-opacity bg-current"
          />
          <span class="text-[10px] font-black uppercase tracking-[0.22em]">
            {{ status }}
          </span>
        </div>
      </button>

      <template #summary>
        <div class="rounded-2xl border border-white/8 bg-black/20 px-5 py-3">
          <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
            Total Models
          </p>
          <p class="text-xl font-black tracking-tight text-[#B6F500] mt-1">
            {{ filteredList.length.toString().padStart(2, '0') }}
            <span class="text-white/30 text-sm font-semibold">/ {{ productModelList.length.toString().padStart(2, '0') }}</span>
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
        v-else-if="productModelList.length === 0"
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
          v-if="selectedModel"
          class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#060606] p-0 shadow-[0_60px_180px_-40px_rgba(0,0,0,1)]"
        >
          <!-- Premium Backdrop Accent -->
          <div class="absolute -top-32 -left-32 h-80 w-80 bg-[#B6F500]/10 blur-[140px]" />
          <div class="absolute -bottom-32 -right-32 h-80 w-80 bg-blue-500/5 blur-[140px]" />

          <!-- Modal Header -->
          <div class="relative z-10 p-10 2xl:p-12">
            <div class="flex items-start justify-between">
              <div>
                <div class="mb-4 flex items-center gap-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B6F500]/10 border border-[#B6F500]/20 text-[#B6F500]">
                    <Fingerprint :size="20" />
                  </div>
                  <span class="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Product identity</span>
                </div>
                <h2 class="text-5xl font-black italic tracking-tighter uppercase text-white">
                  {{ selectedModel.name }}
                </h2>
                <div class="mt-4 flex items-center gap-3">
                  <code class="rounded-xl border border-[#B6F500]/20 bg-[#B6F500]/5 px-3 py-1.5 text-xs font-black tracking-widest text-[#B6F500] italic">
                    {{ selectedModel.inch }}" SCREEN
                  </code>
                  <span
                    :class="selectedModel.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-red-500/10 text-red-500 border border-red-500/20'"
                    class="rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    ● {{ selectedModel.isActive ? 'Active' : 'Inactive' }}
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
            <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-white/5 pt-12">
              <div class="space-y-8">
                <div>
                  <label class="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    <Layers :size="12" /> Assigned Vendor
                  </label>
                  <p class="text-xl font-black italic text-white uppercase tracking-widest">
                    {{ vendorOptions.find(v => v.id === selectedModel?.vendorId)?.name || 'Unknown' }}
                  </p>
                </div>

                <div class="space-y-4">
                  <div class="rounded-3xl border border-white/5 bg-white/2 p-6">
                    <div class="flex items-center gap-4">
                      <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-[#B6F500]/10 text-[#B6F500] shrink-0">
                        <PackageOpen :size="20" />
                      </div>
                      <div v-if="selectedModel">
                        <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                          Specification
                        </p>
                        <p class="text-sm font-black italic text-white/80 mt-1">
                          Wide Screen Dimension: {{ selectedModel.inch }} Inch
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- History & Audit -->
              <div class="space-y-6 flex flex-col justify-end">
                <div class="rounded-3xl border border-white/5 bg-white/2 p-6 space-y-6">
                  <div class="flex items-start gap-4">
                    <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 shrink-0">
                      <CalendarDays :size="20" />
                    </div>
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                        Registered On
                      </p>
                      <p class="text-sm font-black italic text-white/80 mt-1">
                        {{ new Date(selectedModel.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4">
                    <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 shrink-0">
                      <User2 :size="20" />
                    </div>
                    <div>
                      <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                        Maintained By
                      </p>
                      <p class="text-sm font-black italic text-white/80 mt-1">
                        {{ selectedModel.updatedBy }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-start gap-4 pt-4 border-t border-white/5">
                    <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 shrink-0">
                      <History :size="20" />
                    </div>
                    <div class="flex-1">
                      <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 italic">
                        Last Interaction
                      </p>
                      <p
                        v-if="selectedModel.updatedAt"
                        class="text-xs font-bold text-white/40 mt-1 italic"
                      >
                        {{ new Date(selectedModel.updatedAt).toLocaleTimeString('id-ID') }} WIB
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
                @click="isDetailModalOpen = false; openUpsertModal(selectedModel)"
              >
                <Pencil :size="16" /> Edit Model Info
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Status Toggle Modal -->
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
            :class="modelToToggle?.isActive ? 'bg-orange-600/10' : 'bg-emerald-600/10'"
            class="absolute -top-24 -left-24 h-48 w-48 blur-[100px] transition-colors duration-500"
          />

          <div class="relative z-10 flex flex-col items-center text-center">
            <div
              :class="modelToToggle?.isActive ? 'border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-orange-500/10' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10'"
              class="mb-8 flex h-20 w-20 items-center justify-center rounded-4xl border transition-all duration-500 shadow-xl scale-110"
            >
              <component
                :is="modelToToggle?.isActive ? AlertCircle : CheckCircle"
                :size="32"
                stroke-width="2.5"
              />
            </div>

            <p
              :class="modelToToggle?.isActive ? 'text-orange-500/50' : 'text-emerald-500/50'"
              class="mb-2 text-[11px] font-black uppercase tracking-[0.4em] transition-colors"
            >
              Master Data Policy
            </p>
            <h3 class="mb-4 text-3xl font-black italic tracking-tighter uppercase text-white">
              {{ modelToToggle?.isActive ? 'Deactivate' : 'Activate' }}
              <span
                :class="modelToToggle?.isActive ? 'text-orange-500 decoration-orange-500/30' : 'text-emerald-500 decoration-emerald-500/30'"
                class="italic underline underline-offset-8 transition-colors"
              >
                Model
              </span>?
            </h3>

            <p class="mb-10 text-pretty text-sm font-medium leading-relaxed text-white/40 italic px-2">
              You are about to modify the visibility of <span class="font-black text-white/80">"{{ modelToToggle?.name }}"</span>.
              <template v-if="modelToToggle?.isActive">
                Inactive models <span class="font-bold text-orange-500/70">cannot be selected</span> in new claims but historical data is preserved.
              </template>
              <template v-else>
                This will restore access to this product model for <span class="font-bold text-emerald-500/70">claim creation</span> immediately.
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
                :class="modelToToggle?.isActive ? 'bg-orange-600 shadow-orange-500/20 hover:bg-orange-500' : 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-500'"
                class="flex items-center justify-center gap-2 rounded-2xl py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                @click="handleToggleStatus"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Upsert Modal -->
    <UModal
      v-model:open="isUpsertModalOpen"
      :dismissible="false"
      :ui="{
        content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-2xl w-full',
        overlay: 'bg-black/90 backdrop-blur-xl'
      }"
    >
      <template #content>
        <div class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#080808] p-10 2xl:p-12 shadow-[0_60px_160px_-40px_rgba(0,0,0,0.95)]">
          <!-- Animated Background Elements -->
          <div class="absolute -top-32 -right-32 h-64 w-64 bg-[#B6F500]/10 blur-[120px]" />
          <div class="absolute -bottom-32 -left-32 h-64 w-64 bg-blue-600/5 blur-[120px]" />

          <!-- Header -->
          <div class="relative z-10 flex items-center justify-between mb-10">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.4em] text-[#B6F500] mb-2">
                {{ isEditing ? 'Modification' : 'Registration' }}
              </p>
              <h2 class="text-4xl font-black italic tracking-tighter uppercase text-white">
                {{ isEditing ? 'Edit' : 'Add New' }} <span class="text-[#B6F500] italic">Model</span>
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

          <!-- Form Area -->
          <div class="space-y-8 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="group space-y-2 w-full">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-[#B6F500] transition-colors">Model Name <span class="text-red-500">*</span></label>
                <UInput
                  v-model="form.name"
                  type="text"
                  placeholder="e.g. QLED 4K Q80C"
                  size="xl"
                  variant="none"
                  class="w-full"
                  :ui="{
                    base: 'h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-black italic text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#B6F500]/40 transition-all hover:bg-white/8'
                  }"
                />
              </div>

              <div class="group space-y-2 w-full">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-[#B6F500] transition-colors">Dimension (Inch) <span class="text-red-500">*</span></label>
                <div class="relative">
                  <UInput
                    v-model.number="form.inch"
                    type="number"
                    placeholder="e.g. 55"
                    size="xl"
                    variant="none"
                    class="w-full"
                    :ui="{
                      base: 'h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-black italic text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#B6F500]/40 transition-all hover:bg-white/8'
                    }"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="group space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-[#B6F500] transition-colors">Assigned Vendor <span class="text-red-500">*</span></label>
                <UInputMenu
                  v-model="form.vendorId"
                  :items="vendorOptions"
                  value-key="id"
                  label-key="name"
                  placeholder="Select Vendor..."
                  size="xl"
                  variant="none"
                  :ui="{
                    root: 'w-full',
                    base: 'h-14 w-full rounded-2xl bg-white/5 px-6 text-sm font-black italic text-white focus:ring-2 focus:ring-[#B6F500]/40 transition-all hover:bg-white/8',
                    content: 'bg-[#0a0a0a] border-none rounded-2xl shadow-[0_45px_150px_-50px_rgba(182,245,0,0.2)] overflow-hidden p-1',
                    item: 'text-white/50 data-highlighted:text-black data-highlighted:before:bg-[#B6F500] font-black italic uppercase text-[10px] tracking-widest py-4 transition-colors'
                  }"
                />
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Status</label>
                <button
                  :class="form.isActive ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' : 'border-red-500/30 bg-red-500/5 text-red-400'"
                  class="flex h-14 w-full items-center justify-between rounded-2xl border px-6 transition-all"
                  @click="form.isActive = !form.isActive"
                >
                  <span class="text-xs font-black uppercase tracking-widest">{{ form.isActive ? 'Active' : 'Deactivated' }}</span>
                  <component
                    :is="form.isActive ? Power : Power"
                    :size="16"
                  />
                </button>
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="pt-6">
              <button
                :disabled="isLoading"
                class="w-full flex items-center justify-center gap-3 rounded-3xl bg-[#B6F500] py-6 text-xs font-black uppercase tracking-[0.3em] text-[#080808] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#B6F500]/20"
                @click="handleUpsert"
              >
                <template v-if="isLoading">
                  <RefreshCw
                    :size="18"
                    class="animate-spin"
                  /> Processing...
                </template>
                <template v-else>
                  <Save :size="18" /> {{ isEditing ? 'Save Changes' : 'Register Model' }}
                </template>
              </button>
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
