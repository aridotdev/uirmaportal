<script setup lang="ts">
import { h } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  ClipboardList,
  Eye
} from 'lucide-vue-next'

// Definisi Tipe berdasarkan schema claim.ts
interface ClaimRow {
  claimNumber: string
  vendor: string
  model: string
  branch: string
  createdAt: Date
  claimStatus: 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
  panelSerialNo: string
  ocSerialNo: string
}

// Mock Data untuk Preview
const data = ref<ClaimRow[]>([
  {
    claimNumber: 'CLM-20240315-001',
    vendor: 'MOKA',
    model: 'MKA-32-V1',
    branch: 'Jakarta',
    createdAt: new Date(),
    claimStatus: 'SUBMITTED',
    panelSerialNo: 'PNL8823192',
    ocSerialNo: 'OC-99211'
  },
  {
    claimNumber: 'CLM-20240315-002',
    vendor: 'SDP',
    model: 'SDP-43-X',
    branch: 'Bekasi',
    createdAt: new Date(Date.now() - 3600000),
    claimStatus: 'IN_REVIEW',
    panelSerialNo: 'PNL7721102',
    ocSerialNo: 'OC-11200'
  },
  {
    claimNumber: 'CLM-20240315-003',
    vendor: 'MTC',
    model: 'MTC-55-PRO',
    branch: 'Surabaya',
    createdAt: new Date(Date.now() - 7200000),
    claimStatus: 'NEED_REVISION',
    panelSerialNo: 'PNL550012',
    ocSerialNo: 'OC-44512'
  },
  {
    claimNumber: 'CLM-20240315-004',
    vendor: 'MOKA',
    model: 'MKA-50-V2',
    branch: 'Bandung',
    createdAt: new Date(Date.now() - 86400000),
    claimStatus: 'APPROVED',
    panelSerialNo: 'PNL119922',
    ocSerialNo: 'OC-88712'
  },
  {
    claimNumber: 'CLM-20240315-005',
    vendor: 'SDP',
    model: 'SDP-32-BASIC',
    branch: 'Jakarta',
    createdAt: new Date(Date.now() - 172800000),
    claimStatus: 'SUBMITTED',
    panelSerialNo: 'PNL443122',
    ocSerialNo: 'OC-22199'
  }
])

// State Management
const searchQuery = ref('')
type StatusFilter = 'ALL' | ClaimRow['claimStatus']
const statusFilter = ref<StatusFilter>('ALL')
const statusOptions: StatusFilter[] = ['ALL', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED']
const isLoading = ref(false)

// Status Styling Helper
interface StatusConfig {
  label: string
  color: string
  icon: typeof Clock
}

const statusConfigs = {
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock },
  IN_REVIEW: { label: 'In Review', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: Search },
  NEED_REVISION: { label: 'Revision', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertCircle },
  APPROVED: { label: 'Approved', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  ARCHIVED: { label: 'Archived', color: 'bg-white/10 text-white/40 border-white/20', icon: Clock }
} satisfies Record<string, StatusConfig>

const getStatusConfig = (status: string): StatusConfig => {
  return (statusConfigs as Record<string, StatusConfig>)[status] ?? statusConfigs.SUBMITTED
}

// TanStack Table Setup
const columnHelper = createColumnHelper<ClaimRow>()

const columns = [
  columnHelper.accessor('claimNumber', {
    header: 'Claim Number',
    cell: info => h('div', { class: 'flex flex-col' }, [
      h('span', { class: 'font-black text-[#B6F500] tracking-tighter' }, info.getValue()),
      h('span', { class: 'text-[10px] text-white/30 uppercase font-bold tracking-widest' }, `RMA-ID: ${info.row.index + 1024}`)
    ])
  }),
  columnHelper.accessor('vendor', {
    header: 'Vendor',
    cell: info => h('span', { class: 'px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-bold' }, info.getValue())
  }),
  columnHelper.accessor('model', {
    header: 'Product Model',
    cell: info => h('span', { class: 'font-medium text-white/80' }, info.getValue())
  }),
  columnHelper.accessor('branch', {
    header: 'Branch',
    cell: info => info.getValue()
  }),
  columnHelper.accessor('createdAt', {
    header: 'Date Created',
    cell: (info) => {
      const date = info.getValue()
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-bold text-white/60' }, date.toLocaleDateString('id-ID')),
        h('span', { class: 'text-[10px] text-white/20 font-bold' }, date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
      ])
    }
  }),
  columnHelper.accessor('claimStatus', {
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
    cell: () => h('div', { class: 'flex justify-end gap-2' }, [
      h('button', {
        class: 'p-2 rounded-xl bg-white/5 hover:bg-[#B6F500] hover:text-black transition-all group'
      }, [
        h(Eye, { size: 16 })
      ])
    ])
  })
]

const table = useVueTable({
  get data() { return data.value },
  columns,
  getCoreRowModel: getCoreRowModel()
})

const handleRefresh = async () => {
  isLoading.value = true
  // Simulasi API call
  await new Promise(resolve => setTimeout(resolve, 800))
  isLoading.value = false
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
            Claims Review
          </h1>
        </div>
        <p class="text-white/40 text-sm font-medium">
          Verifikasi dan kelola pengajuan klaim RMA dari Customer Service.
        </p>
      </div>

      <div class="flex items-center gap-4">
        <div class="px-6 py-3 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md">
          <p class="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">
            Queue Size
          </p>
          <p class="text-2xl font-black text-[#B6F500]">
            42 <span class="text-xs text-white/20 font-bold uppercase italic">Klaim</span>
          </p>
        </div>
        <button
          class="flex items-center justify-center h-14 w-14 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 group"
          :class="{ 'animate-spin': isLoading }"
          @click="handleRefresh"
        >
          <RefreshCw
            :size="20"
            class="text-white/40 group-hover:text-white"
          />
        </button>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-[28px] border border-white/5 bg-white/5 p-4 backdrop-blur-xl">
      <!-- Search -->
      <div class="md:col-span-5 relative group">
        <Search
          class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#B6F500] transition-colors"
          :size="18"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari No. Klaim, SN Panel, atau OC SN..."
          class="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-bold placeholder:text-white/10 focus:outline-none focus:border-[#B6F500]/40 focus:ring-1 focus:ring-[#B6F500]/40 transition-all"
        >
      </div>

      <!-- Status Filter -->
      <div class="md:col-span-4 no-scrollbar flex items-center gap-2 overflow-x-auto">
        <button
          v-for="status in statusOptions"
          :key="status"
          :class="[
            'whitespace-nowrap rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
            statusFilter === status
              ? 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_5px_15px_rgba(182,245,0,0.2)]'
              : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:text-white'
          ]"
          @click="statusFilter = status"
        >
          {{ status.replace('_', ' ') }}
        </button>
      </div>
    </div>

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
                class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20"
              >
                <div class="flex items-center gap-2">
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <ArrowUpDown
                    v-if="header.id !== 'actions'"
                    :size="10"
                    class="opacity-0 group-hover:opacity-100"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="group hover:bg-white/2 transition-colors"
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
            <tr v-if="data.length === 0">
              <td
                colspan="7"
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
                    Tidak ada klaim ditemukan
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-white/5 bg-black/20">
        <div class="text-[10px] font-black uppercase tracking-widest text-white/30">
          Showing <span class="text-white/60">1-5</span> of <span class="text-white/60">42</span> Entries
        </div>

        <div class="flex items-center gap-2">
          <button class="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft :size="18" />
          </button>

          <div class="flex items-center gap-1">
            <button
              v-for="p in 3"
              :key="p"
              :class="[
                'h-10 w-10 flex items-center justify-center rounded-xl font-bold text-xs transition-all',
                p === 1 ? 'bg-[#B6F500] text-black shadow-[0_5px_15px_rgba(182,245,0,0.3)]' : 'hover:bg-white/5 text-white/40'
              ]"
            >
              {{ p }}
            </button>
            <span class="px-2 text-white/20">...</span>
            <button class="h-10 w-10 flex items-center justify-center rounded-xl font-bold text-xs hover:bg-white/5 text-white/40">
              12
            </button>
          </div>

          <button class="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white transition-all">
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transisi halus untuk hover row */
tr {
  transition: all 0.2s ease;
}

/* Hide scrollbar for filter pills */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
