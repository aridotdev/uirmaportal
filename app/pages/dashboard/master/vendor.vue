<script setup lang="ts">
import { Plus, Camera, ClipboardCheck, Eye, Power, CheckCircle, AlertCircle, Pencil, Save, X, CalendarDays, Fingerprint, User2, History, ArrowUpDown, Info } from 'lucide-vue-next'
import { h, computed, ref, reactive, watch } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useVueTable,
  FlexRender,
  type SortingState
} from '@tanstack/vue-table'
import { z } from 'zod'

import { PHOTO_TYPES, FIELD_NAMES } from '~~/shared/utils/constants'

definePageMeta({ layout: 'dashboard' })

interface Vendor {
  id: number
  code: string
  name: string
  requiredPhotos: string[]
  requiredFields: string[]
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: number | string | Date
  updatedAt?: number | string | Date
}

interface VendorListResponse {
  success: boolean
  data: Vendor[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const { user } = useAuthSession()
const toast = useToast()

const isStatusModalOpen = ref(false)
const isUpsertModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isEditing = ref(false)
const vendorToToggle = ref<Vendor | null>(null)
const selectedVendor = ref<Vendor | null>(null)
const isRefreshing = ref(false)
const isMutating = ref(false)

const defaultForm = {
  id: 0,
  code: '',
  name: '',
  requiredPhotos: [] as string[],
  requiredFields: [] as string[],
  isActive: true
}

const form = reactive({ ...defaultForm })
const formErrors = ref<Record<string, string>>({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
const statusFilter = ref<StatusFilter>('ALL')
const searchQuery = ref('')
const statusOptions: StatusFilter[] = ['ALL', 'ACTIVE', 'INACTIVE']

const queryParams = computed(() => {
  const query: {
    page: number
    limit: number
    search?: string
    isActive?: 'true' | 'false'
  } = {
    page: pagination.value.pageIndex + 1,
    limit: pagination.value.pageSize
  }

  const keyword = searchQuery.value.trim()
  if (keyword) query.search = keyword

  if (statusFilter.value !== 'ALL') {
    query.isActive = statusFilter.value === 'ACTIVE' ? 'true' : 'false'
  }

  return query
})

const { data, pending, error, refresh } = useFetch<VendorListResponse>('/api/master/vendors', {
  query: queryParams,
  default: () => ({ success: true, data: [] })
})

const vendorList = computed(() => data.value?.data ?? [])
const filteredList = computed(() => vendorList.value)
const paginationMeta = computed(() => {
  const fallbackTotal = vendorList.value.length
  return data.value?.pagination ?? {
    page: pagination.value.pageIndex + 1,
    limit: pagination.value.pageSize,
    total: fallbackTotal,
    totalPages: Math.max(1, Math.ceil(fallbackTotal / pagination.value.pageSize))
  }
})
const pageCount = computed(() => Math.max(1, paginationMeta.value.totalPages || 1))
const hasActiveFilters = computed(() => statusFilter.value !== 'ALL' || searchQuery.value.trim().length > 0)
const fetchErrorMessage = computed(() => error.value?.statusMessage || error.value?.message || 'Terjadi kesalahan saat mengambil data vendor.')
const isLoading = computed(() => pending.value || isRefreshing.value || isMutating.value)

const vendorSchema = z.object({
  code: z.string().min(1, 'Code wajib diisi').max(20, 'Max 20 karakter'),
  name: z.string().min(1, 'Name wajib diisi').max(100, 'Max 100 karakter'),
  requiredPhotos: z.array(z.string()).min(1, 'Minimal 1 foto type wajib dipilih'),
  requiredFields: z.array(z.string())
})

function validateForm(): boolean {
  formErrors.value = {}
  const result = vendorSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path[0]
      if (path) formErrors.value[String(path)] = issue.message
    }
    return false
  }
  return true
}

const photoTypeDescriptions: Record<string, string> = {
  CLAIM: 'Foto keseluruhan produk yang diklaim',
  CLAIM_ZOOM: 'Foto close-up area kerusakan',
  ODF: 'Foto ODF label pada produk',
  PANEL_SN: 'Foto serial number panel',
  WO_PANEL: 'Foto Work Order panel',
  WO_PANEL_SN: 'Foto serial number Work Order panel'
}

const getActorId = () => user.value?.id ?? 'system'

const openUpsertModal = (vendor?: Vendor) => {
  formErrors.value = {}

  if (vendor) {
    isEditing.value = true
    Object.assign(form, {
      ...vendor,
      requiredPhotos: [...vendor.requiredPhotos],
      requiredFields: [...vendor.requiredFields]
    })
  } else {
    isEditing.value = false
    Object.assign(form, { ...defaultForm })
  }

  isUpsertModalOpen.value = true
}

const handleUpsert = async () => {
  if (!validateForm()) return

  isMutating.value = true
  try {
    if (isEditing.value) {
      await $fetch(`/api/master/vendors/${form.id}`, {
        method: 'PUT',
        body: {
          code: form.code,
          name: form.name,
          requiredPhotos: form.requiredPhotos,
          requiredFields: form.requiredFields,
          updatedBy: getActorId()
        }
      })
    } else {
      const created = await $fetch<{ success: boolean, data: Vendor }>('/api/master/vendors', {
        method: 'POST',
        body: {
          code: form.code,
          name: form.name,
          requiredPhotos: form.requiredPhotos,
          requiredFields: form.requiredFields,
          createdBy: getActorId(),
          updatedBy: getActorId()
        }
      })

      if (!form.isActive && created.data?.id) {
        await $fetch(`/api/master/vendors/${created.data.id}/status`, {
          method: 'PATCH',
          body: {
            isActive: false,
            updatedBy: getActorId()
          }
        })
      }
    }

    await refresh()
    isUpsertModalOpen.value = false

    toast.add({
      title: isEditing.value ? 'Vendor Updated' : 'Vendor Created',
      description: `Successfully ${isEditing.value ? 'updated' : 'added'} ${form.name}.`,
      color: 'success'
    })
  } catch (e) {
    toast.add({
      title: 'Operation Failed',
      description: e instanceof Error ? e.message : 'Terjadi kesalahan saat menyimpan vendor.',
      color: 'error'
    })
  } finally {
    isMutating.value = false
  }
}

const handleViewDetail = (vendor: Vendor) => {
  selectedVendor.value = vendor
  isDetailModalOpen.value = true
}

const confirmToggleStatus = (vendor: Vendor) => {
  vendorToToggle.value = vendor
  isStatusModalOpen.value = true
}

const handleToggleStatus = async () => {
  if (!vendorToToggle.value) return

  isMutating.value = true
  try {
    const nextStatus = !vendorToToggle.value.isActive
    await $fetch(`/api/master/vendors/${vendorToToggle.value.id}/status`, {
      method: 'PATCH',
      body: {
        isActive: nextStatus,
        updatedBy: getActorId()
      }
    })

    await refresh()

    toast.add({
      title: 'Status Updated',
      description: `${vendorToToggle.value.name} is now ${nextStatus ? 'ACTIVE' : 'INACTIVE'}.`,
      color: nextStatus ? 'success' : 'warning'
    })

    isStatusModalOpen.value = false
    vendorToToggle.value = null
  } catch (e) {
    toast.add({
      title: 'Update Failed',
      description: e instanceof Error ? e.message : 'Terjadi kesalahan saat mengubah status vendor.',
      color: 'error'
    })
  } finally {
    isMutating.value = false
  }
}

const resetFilters = () => {
  statusFilter.value = 'ALL'
  searchQuery.value = ''
  pagination.value.pageIndex = 0
}

const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await refresh()
  } finally {
    isRefreshing.value = false
  }
}

watch(paginationMeta, (meta) => {
  if (meta.totalPages <= 0) {
    pagination.value.pageIndex = 0
    return
  }

  const maxIndex = meta.totalPages - 1
  if (pagination.value.pageIndex > maxIndex) {
    pagination.value.pageIndex = maxIndex
  }
})

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

const columnHelper = createColumnHelper<Vendor>()
const sorting = ref<SortingState>([])

const columns = [
  columnHelper.accessor('code', {
    header: 'Vendor Code',
    enableSorting: true,
    cell: info => h('p', { class: 'text-xs font-mono font-black tracking-widest text-[#B6F500] italic uppercase' }, info.getValue())
  }),
  columnHelper.accessor('name', {
    header: 'Vendor Name',
    enableSorting: true,
    cell: info => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/20 transition-all group-hover:border-blue-500/30 group-hover:text-blue-400' }, info.getValue().charAt(0)),
      h('p', { class: 'text-sm font-black italic text-white/80 group-hover:text-white transition-colors' }, info.getValue())
    ])
  }),
  columnHelper.accessor('requiredPhotos', {
    header: 'Required Config',
    cell: info => h('div', { class: 'flex items-center gap-4' }, [
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(Camera, { size: 12, class: 'text-white/20' }),
        h('span', { class: 'text-[10px] font-black text-white/40' }, info.getValue().length)
      ]),
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(ClipboardCheck, { size: 12, class: 'text-white/20' }),
        h('span', { class: 'text-[10px] font-black text-white/40' }, info.row.original.requiredFields.length)
      ])
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
        title: 'Edit Vendor',
        onClick: () => openUpsertModal(info.row.original),
        class: 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-400/60 transition-all hover:scale-110 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400 active:scale-90 shadow-lg'
      }, [
        h(Pencil, { size: 15 })
      ]),
      h('button', {
        title: info.row.original.isActive ? 'Deactivate Vendor' : 'Activate Vendor',
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

const pageSizeOptions = [5, 10, 25]

const handlePageSizeChange = (nextPageSize: number) => {
  pagination.value = {
    pageIndex: 0,
    pageSize: nextPageSize
  }
}

const table = useVueTable({
  get data() { return filteredList.value },
  columns,
  state: {
    get sorting() {
      return sorting.value
    }
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel()
})

const visibleFrom = computed(() => {
  if (!vendorList.value.length || paginationMeta.value.total === 0) return 0
  return (pagination.value.pageIndex * pagination.value.pageSize) + 1
})

const visibleTo = computed(() => {
  if (!vendorList.value.length || paginationMeta.value.total === 0) return 0
  return Math.min(paginationMeta.value.total, ((pagination.value.pageIndex + 1) * pagination.value.pageSize))
})

const togglePhoto = (photo: string) => {
  const index = form.requiredPhotos.indexOf(photo)
  if (index === -1) form.requiredPhotos.push(photo)
  else form.requiredPhotos.splice(index, 1)
}

const toggleField = (field: string) => {
  const index = form.requiredFields.indexOf(field)
  if (index === -1) form.requiredFields.push(field)
  else form.requiredFields.splice(index, 1)
}
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <PageHeader
      title="Vendor Management"
      description="Master data vendor"
    >
      <template #actions>
        <button
          class="flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          @click="openUpsertModal()"
        >
          <Plus :size="16" /> Add New Vendor
        </button>
      </template>
    </PageHeader>

    <FilterBar
      v-model:search="searchQuery"
      v-model:refreshing="isRefreshing"
      search-placeholder="Search by vendor code or name..."
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
          getFilterClass(status)
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
          <p class="text-xl font-black tracking-tight text-[#B6F500] mt-1">
            {{ filteredList.length.toString().padStart(2, '0') }}
            <span class="text-white/30 text-sm font-semibold">/ {{ paginationMeta.total.toString().padStart(2, '0') }}</span>
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
        v-else-if="error"
        title="Gagal memuat data"
        :description="fetchErrorMessage"
        action-label="Coba Lagi"
        @action="handleRefresh"
      />
      <EmptyState
        v-else-if="filteredList.length === 0 && hasActiveFilters"
        title="Tidak ada data ditemukan"
        description="Coba ubah filter atau kata kunci pencarian."
        action-label="Reset Filter"
        @action="resetFilters"
      />
      <EmptyState
        v-else-if="vendorList.length === 0"
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
                    :class="header.column.getIsSorted() ? 'text-[#B6F500]' : 'text-white/15'"
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
        :total-items="paginationMeta.total"
        :page-index="pagination.pageIndex"
        :page-count="pageCount"
        :can-previous-page="pagination.pageIndex > 0"
        :can-next-page="pagination.pageIndex < pageCount - 1"
        accent-class="text-white/80"
        button-class="text-white/40 hover:bg-white/10 hover:text-white"
        @update:page-size="handlePageSizeChange"
        @first="pagination.pageIndex = 0"
        @previous="pagination.pageIndex = Math.max(0, pagination.pageIndex - 1)"
        @next="pagination.pageIndex = Math.min(pageCount - 1, pagination.pageIndex + 1)"
        @last="pagination.pageIndex = pageCount - 1"
      />
    </div>

    <!-- Vendor Detail (Profile) Modal -->
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
          v-if="selectedVendor"
          class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#060606] p-0 shadow-[0_60px_180px_-40px_rgba(0,0,0,1)]"
        >
          <!-- Premium Backdrop Accent -->
          <div class="absolute -top-32 -left-32 h-80 w-80 bg-blue-600/10 blur-[140px]" />
          <div class="absolute -bottom-32 -right-32 h-80 w-80 bg-emerald-500/5 blur-[140px]" />

          <!-- Modal Header -->
          <div class="relative z-10 p-10 2xl:p-12">
            <div class="flex items-start justify-between">
              <div>
                <div class="mb-4 flex items-center gap-2">
                  <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Fingerprint :size="20" />
                  </div>
                  <span class="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Profile identity</span>
                </div>
                <h2 class="text-5xl font-black italic tracking-tighter uppercase text-white">
                  {{ selectedVendor.name }}
                </h2>
                <div class="mt-4 flex items-center gap-3">
                  <code
                    class="rounded-xl border border-[#B6F500]/20 bg-[#B6F500]/5 px-3 py-1.5 text-xs font-black tracking-widest text-[#B6F500] italic"
                  >
                    {{ selectedVendor.code }}
                  </code>
                  <span
                    :class="[
                      'rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
                      selectedVendor.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    ]"
                  >
                    ● {{ selectedVendor.isActive ? 'Operational' : 'Deactivated' }}
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
              <!-- Configuration Stats -->
              <div class="space-y-8">
                <div>
                  <label
                    class="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20"
                  >
                    <Camera :size="12" /> Required Visuals
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="photo in PHOTO_TYPES"
                      :key="photo"
                      class="rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-tight transition-all"
                      :class="selectedVendor.requiredPhotos.includes(photo) ? 'border-[#B6F500]/40 bg-[#B6F500]/10 text-[#B6F500]' : 'border-white/5 bg-white/3 text-white/15'"
                    >
                      {{ photo.replace('_', ' ') }}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    class="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white/20"
                  >
                    <ClipboardCheck :size="12" /> Mandatory Data
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="field in FIELD_NAMES"
                      :key="field"
                      class="rounded-xl border px-3 py-2 text-[9px] font-black italic tracking-widest transition-all"
                      :class="selectedVendor.requiredFields.includes(field) ? 'border-blue-400/40 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/3 text-white/15'"
                    >
                      {{ field }}
                    </span>
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
                      <p
                        class="text-[9px] font-black uppercase tracking-[0.2em] text-white/20"
                      >
                        Registered On
                      </p>
                      <p
                        class="text-sm font-black italic text-white/80 mt-1"
                      >
                        {{ new Date(selectedVendor.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
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
                        {{ selectedVendor.updatedBy }}
                      </p>
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
                        v-if="selectedVendor.updatedAt"
                        class="text-xs font-bold text-white/40 mt-1 italic"
                      >
                        {{ new Date(selectedVendor.updatedAt).toLocaleTimeString('id-ID') }} WIB
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
                @click="isDetailModalOpen = false; openUpsertModal(selectedVendor)"
              >
                <Pencil :size="16" /> Edit Account Profile
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Status Toggle (Soft Delete) Confirmation Modal -->
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
            :class="vendorToToggle?.isActive ? 'bg-orange-600/10' : 'bg-emerald-600/10'"
          />

          <div class="relative z-10 flex flex-col items-center text-center">
            <div
              class="mb-8 flex h-20 w-20 items-center justify-center rounded-4xl border transition-all duration-500 shadow-xl scale-110"
              :class="vendorToToggle?.isActive
                ? 'border-orange-500/20 bg-orange-500/10 text-orange-500 shadow-orange-500/10'
                : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10'"
            >
              <component
                :is="vendorToToggle?.isActive ? AlertCircle : CheckCircle"
                :size="32"
                stroke-width="2.5"
              />
            </div>

            <p
              class="mb-2 text-[11px] font-black uppercase tracking-[0.4em] transition-colors"
              :class="vendorToToggle?.isActive ? 'text-orange-500/50' : 'text-emerald-500/50'"
            >
              Master Data Policy
            </p>
            <h3 class="mb-4 text-3xl font-black italic tracking-tighter uppercase text-white">
              {{ vendorToToggle?.isActive ? 'Deactivate' : 'Activate' }} <span
                class="italic underline underline-offset-8 transition-colors"
                :class="vendorToToggle?.isActive ? 'text-orange-500 decoration-orange-500/30' : 'text-emerald-500 decoration-emerald-500/30'"
              >Vendor</span>?
            </h3>

            <p class="mb-10 text-pretty text-sm font-medium leading-relaxed text-white/40 italic px-2">
              You are about to modify the visibility of <span class="font-black text-white/80">"{{ vendorToToggle?.name }}"</span>.
              <template v-if="vendorToToggle?.isActive">
                Inactive vendors <span class="font-bold text-orange-500/70">cannot be selected</span> in new transactions but their history will be preserved.
              </template>
              <template v-else>
                This will restore access to this vendor for <span class="font-bold text-emerald-500/70">all system modules</span> immediately.
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
                :class="vendorToToggle?.isActive
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
        content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-2xl w-full',
        overlay: 'bg-black/55 backdrop-blur-md'
      }"
    >
      <template #content>
        <div class="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#080808] p-10 2xl:p-12 shadow-[0_60px_160px_-40px_rgba(0,0,0,0.95)]">
          <!-- Animated Background Elements -->
          <div class="absolute -top-32 -right-32 h-64 w-64 bg-blue-600/10 blur-[120px]" />
          <div class="absolute -bottom-32 -left-32 h-64 w-64 bg-[#B6F500]/5 blur-[120px]" />

          <!-- Header -->
          <div class="relative z-10 flex items-center justify-between mb-10">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-2">
                {{ isEditing ? 'Modification' : 'Registration' }}
              </p>
              <h2 class="text-4xl font-black italic tracking-tighter uppercase text-white">
                {{ isEditing ? 'Edit' : 'Add New' }} <span class="text-blue-400 italic">Vendor</span>
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <!-- Left Side: Basic Info -->
            <div class="space-y-6">
              <div class="group space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-blue-400 transition-colors">Vendor Code <span class="text-red-500">*</span></label>
                <div class="relative">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <input
                    v-model="form.code"
                    type="text"
                    placeholder="e.g. VND-MK-101"
                    class="h-14 w-full rounded-2xl border border-white/8 bg-white/3 pl-10 pr-6 text-sm font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:border-blue-500/50 focus:outline-none transition-all"
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

              <div class="group space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 group-focus-within:text-blue-400 transition-colors">
                  Vendor Name <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Official Company Name"
                  class="h-14 w-full rounded-2xl border border-white/8 bg-white/3 px-6 text-sm font-black italic text-white placeholder:text-white/10 focus:border-blue-500/50 focus:outline-none transition-all"
                  @input="formErrors.name = ''"
                >
                <p
                  v-if="formErrors.name"
                  class="text-xs text-red-400 mt-1"
                >
                  {{ formErrors.name }}
                </p>
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
                  <component
                    :is="form.isActive ? Power : Power"
                    :size="16"
                  />
                </button>
              </div>
            </div>

            <!-- Right Side: Complex Config -->
            <div class="space-y-6">
              <div class="space-y-4">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                  <Camera :size="12" /> Required Photos <span class="text-red-500">*</span>
                </label>
                <p
                  v-if="formErrors.requiredPhotos"
                  class="text-xs text-red-400"
                >
                  {{ formErrors.requiredPhotos }}
                </p>
                <div class="grid grid-cols-1 gap-2">
                  <button
                    v-for="photo in PHOTO_TYPES"
                    :key="photo"
                    class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all"
                    :class="form.requiredPhotos.includes(photo) ? 'border-[#B6F500]/40 bg-[#B6F500]/10' : 'border-white/5 bg-white/2 hover:border-white/20'"
                    @click="togglePhoto(photo)"
                  >
                    <div
                      :class="[
                        'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                        form.requiredPhotos.includes(photo) ? 'bg-[#B6F500] border-[#B6F500]' : 'border-white/20'
                      ]"
                    >
                      <svg
                        v-if="form.requiredPhotos.includes(photo)"
                        class="w-3 h-3 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <span
                        :class="[
                          'text-[10px] font-black uppercase tracking-tight block',
                          form.requiredPhotos.includes(photo) ? 'text-[#B6F500]' : 'text-white/30'
                        ]"
                      >
                        {{ photo.replace('_', ' ') }}
                      </span>
                      <span class="text-[9px] text-white/25 block truncate">{{ photoTypeDescriptions[photo] }}</span>
                    </div>
                  </button>
                </div>
              </div>

              <div class="space-y-4 pt-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 flex items-center gap-2">
                  <ClipboardCheck :size="12" /> Mandatory Fields
                </label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="field in FIELD_NAMES"
                    :key="field"
                    class="flex items-center gap-2 rounded-xl border px-4 py-3 text-[10px] font-black italic tracking-tight transition-all"
                    :class="form.requiredFields.includes(field) ? 'border-blue-400/40 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/2 text-white/30 hover:border-white/20'"
                    @click="toggleField(field)"
                  >
                    <div
                      :class="[
                        'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                        form.requiredFields.includes(field) ? 'bg-blue-400 border-blue-400' : 'border-white/20'
                      ]"
                    >
                      <svg
                        v-if="form.requiredFields.includes(field)"
                        class="w-2.5 h-2.5 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {{ field }}
                  </button>
                </div>
              </div>

              <!-- Rule Summary Preview -->
              <div class="rounded-2xl border border-white/5 bg-white/2 p-4">
                <div class="flex items-center gap-2 mb-2">
                  <Info
                    :size="12"
                    class="text-white/30"
                  />
                  <span class="text-[9px] font-black uppercase tracking-widest text-white/30">Config Preview</span>
                </div>
                <p class="text-xs text-white/50">
                  Vendor ini memerlukan <strong class="text-[#B6F500]">{{ form.requiredPhotos.length }}</strong> jenis foto
                  dan <strong class="text-blue-400">{{ form.requiredFields.length }}</strong> field tambahan.
                </p>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="mt-12 flex gap-4 relative z-10 border-t border-white/5 pt-8">
            <button
              class="flex-1 rounded-2xl border border-white/10 bg-white/5 py-5 text-[10px] font-black uppercase tracking-widest text-white/50 transition-all hover:bg-white/10 hover:text-white active:scale-95"
              @click="isUpsertModalOpen = false"
            >
              Discard Changes
            </button>
            <button
              class="flex-1 flex items-center justify-center gap-3 rounded-2xl bg-white py-5 text-[10px] font-black uppercase tracking-widest text-[#080808] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              @click="handleUpsert"
            >
              <Save :size="16" />
              {{ isEditing ? 'Save Changes' : 'Register Vendor' }}
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
