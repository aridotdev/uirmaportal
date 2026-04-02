<script setup lang="ts">
import { Users, Search, RefreshCw, Plus, Camera, ClipboardCheck, Eye, Power, CheckCircle, AlertCircle, Pencil, Save, X, CalendarDays, Fingerprint, User2, History } from 'lucide-vue-next'
import { h, computed, ref, reactive } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'

import { PHOTO_TYPES, FIELD_NAMES } from '~~/shared/utils/constants'

interface Vendor {
  id: number
  code: string
  name: string
  requiredPhotos: string[]
  requiredFields: string[]
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt?: number
}

const vendorList = ref<Vendor[]>([
  {
    id: 1,
    code: 'VND-MK-001',
    name: 'MOKA',
    requiredPhotos: [...PHOTO_TYPES], // All 6
    requiredFields: [...FIELD_NAMES],
    isActive: true,
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: Date.now() - 10000000
  },
  {
    id: 2,
    code: 'VND-MC-002',
    name: 'MTC',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN'],
    requiredFields: [], // Tidak butuh field
    isActive: true,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 20000000
  },
  {
    id: 3,
    code: 'VND-SP-003',
    name: 'SDP',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN'],
    requiredFields: [], // Tidak butuh field
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
const vendorToToggle = ref<Vendor | null>(null)
const selectedVendor = ref<Vendor | null>(null)

const defaultForm = {
  id: 0,
  code: '',
  name: '',
  requiredPhotos: [] as string[],
  requiredFields: [] as string[],
  isActive: true
}

const form = reactive({ ...defaultForm })

const openUpsertModal = (vendor?: Vendor) => {
  if (vendor) {
    isEditing.value = true
    Object.assign(form, {
      ...vendor,
      requiredPhotos: [...vendor.requiredPhotos],
      requiredFields: [...vendor.requiredFields]
    })
  } else {
    isEditing.value = false
    Object.assign(form, { ...defaultForm, id: Date.now() }) // Simple ID generation
  }
  isUpsertModalOpen.value = true
}

const handleUpsert = async () => {
  // Simple Validation
  if (!form.code || !form.name) {
    useToast().add({ title: 'Validation Error', description: 'Code and Name are required.', color: 'error' })
    return
  }

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  if (isEditing.value) {
    const idx = vendorList.value.findIndex(v => v.id === form.id)
    if (idx !== -1) {
      const existingVendor = vendorList.value[idx]
      if (existingVendor) {
        vendorList.value[idx] = {
          ...existingVendor,
          ...form,
          updatedBy: 'Admin',
          updatedAt: Date.now()
        }
      }
    }
  } else {
    vendorList.value.push({
      ...form,
      createdBy: 'Admin',
      updatedBy: 'Admin',
      createdAt: Date.now()
    })
  }

  useToast().add({
    title: isEditing.value ? 'Vendor Updated' : 'Vendor Created',
    description: `Successfully ${isEditing.value ? 'updated' : 'added'} ${form.name}.`,
    color: 'success'
  })

  isUpsertModalOpen.value = false
  isLoading.value = false
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

  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 800))

  const vendor = vendorList.value.find(v => v.id === vendorToToggle.value?.id)
  if (vendor) {
    vendor.isActive = !vendor.isActive
  }

  useToast().add({
    title: `Status Updated`,
    description: `${vendorToToggle.value.name} is now ${vendor?.isActive ? 'ACTIVE' : 'INACTIVE'}.`,
    color: vendor?.isActive ? 'success' : 'warning'
  })

  isStatusModalOpen.value = false
  vendorToToggle.value = null
  isLoading.value = false
}

// ------- Filtering Logic -------
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE'
const statusFilter = ref<StatusFilter>('ALL')
const searchQuery = ref('')
const statusOptions: StatusFilter[] = ['ALL', 'ACTIVE', 'INACTIVE']
const isLoading = ref(false)

const filteredList = computed(() => {
  return vendorList.value.filter((v) => {
    const matchesStatus = statusFilter.value === 'ALL'
      || (statusFilter.value === 'ACTIVE' ? v.isActive : !v.isActive)

    const query = searchQuery.value.toLowerCase().trim()
    const matchesSearch = !query
      || v.code.toLowerCase().includes(query)
      || v.name.toLowerCase().includes(query)

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
    if (status === 'ALL') return 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]'
    if (status === 'ACTIVE') return 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
    if (status === 'INACTIVE') return 'border-red-400 bg-red-400 text-black shadow-[0_10px_28px_rgba(248,113,113,0.28)]'
  }
  return 'border-white/8 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
}

const columnHelper = createColumnHelper<Vendor>()

const columns = [
  columnHelper.accessor('code', {
    header: 'Vendor Code',
    cell: info => h('p', { class: 'text-xs font-mono font-black tracking-widest text-[#B6F500] italic uppercase' }, info.getValue())
  }),
  columnHelper.accessor('name', {
    header: 'Vendor Name',
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
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-blue-400">
          <Users :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">Vendor Registry</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Vendor <span class="text-blue-400">Management</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Master data vendor
        </p>
      </div>
      <div class="flex gap-4">
        <button
          class="flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          @click="openUpsertModal()"
        >
          <Plus :size="16" /> Add New Vendor
        </button>
      </div>
    </div>

    <!-- Filter Panel -->
    <section class="mb-10 rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.05),transparent_25%),rgba(255,255,255,0.02)] p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
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
                Total Displayed
              </p>
              <p class="text-xl font-black tracking-tight text-[#B6F500] mt-1">
                {{ filteredList.length.toString().padStart(2, '0') }}
                <span class="text-white/30 text-sm font-semibold">/ {{ vendorList.length.toString().padStart(2, '0') }}</span>
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

    <div class="relative rounded-[36px] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
      >
        <div class="h-10 w-10 border-4 border-[#B6F500]/20 border-t-[#B6F500] rounded-full animate-spin" />
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
            placeholder="Search by vendor code or name..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-blue-500/50"
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
                  >
                </div>
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
                >
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
                  <Camera :size="12" /> Required Photos
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="photo in PHOTO_TYPES"
                    :key="photo"
                    class="rounded-xl border px-3 py-3 text-[9px] font-black uppercase tracking-tighter transition-all"
                    :class="form.requiredPhotos.includes(photo) ? 'border-[#B6F500]/40 bg-[#B6F500]/10 text-[#B6F500]' : 'border-white/5 bg-white/2 text-white/30 hover:border-white/20'"
                    @click="togglePhoto(photo)"
                  >
                    {{ photo.replace('_', ' ') }}
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
                    class="rounded-xl border px-4 py-3 text-[10px] font-black italic tracking-tight transition-all"
                    :class="form.requiredFields.includes(field) ? 'border-blue-400/40 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/2 text-white/30 hover:border-white/20'"
                    @click="toggleField(field)"
                  >
                    {{ field }}
                  </button>
                </div>
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
