<script setup lang="ts">
import {
  Package2,
  Plus,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

// ------- Types -------
interface VendorClaimBatch {
  id: string
  batchNumber: string
  vendor: string
  submittedDate: string
  status: 'CREATED' | 'PROCESSING' | 'COMPLETED'
  createdAt: string
  totalItems: number
}

// ------- Mock Data -------
const allBatches = ref<VendorClaimBatch[]>([
  { id: '1', batchNumber: 'VC-2026-001', vendor: 'MOKA', submittedDate: '2026-03-10', status: 'COMPLETED', createdAt: '2026-03-10', totalItems: 14 },
  { id: '2', batchNumber: 'VC-2026-002', vendor: 'SDP', submittedDate: '2026-03-12', status: 'PROCESSING', createdAt: '2026-03-12', totalItems: 7 },
  { id: '3', batchNumber: 'VC-2026-003', vendor: 'MTC', submittedDate: '2026-03-14', status: 'CREATED', createdAt: '2026-03-14', totalItems: 5 },
  { id: '4', batchNumber: 'VC-2026-004', vendor: 'MOKA', submittedDate: '2026-03-15', status: 'PROCESSING', createdAt: '2026-03-15', totalItems: 9 },
  { id: '5', batchNumber: 'VC-2026-005', vendor: 'SDP', submittedDate: '2026-03-16', status: 'CREATED', createdAt: '2026-03-16', totalItems: 3 },
  { id: '6', batchNumber: 'VC-2026-006', vendor: 'KNP', submittedDate: '2026-03-17', status: 'CREATED', createdAt: '2026-03-17', totalItems: 11 },
  { id: '7', batchNumber: 'VC-2026-007', vendor: 'MTC', submittedDate: '2026-03-08', status: 'COMPLETED', createdAt: '2026-03-08', totalItems: 20 }
])

// ------- State -------
type StatusFilter = 'ALL' | VendorClaimBatch['status']
const statusFilter = ref<StatusFilter>('ALL')
const isLoading = ref(false)
const PAGE_SIZE = 5
const currentPage = ref(1)

const statusOptions: StatusFilter[] = ['ALL', 'CREATED', 'PROCESSING', 'COMPLETED']

// ------- Status Config -------
const statusConfigs = {
  CREATED: { label: 'Created', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  PROCESSING: { label: 'Processing', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
}
type StatusKey = keyof typeof statusConfigs
const getStatusConfig = (status: string) => (statusConfigs as Record<string, typeof statusConfigs[StatusKey]>)[status] ?? statusConfigs.CREATED

const getFilterClass = (status: StatusFilter) => {
  if (status === 'ALL') return {
    active: 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]',
    idle: 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07] hover:text-white'
  }
  const activeMap: Record<VendorClaimBatch['status'], string> = {
    CREATED: 'border-blue-400 bg-blue-400 text-black shadow-[0_10px_28px_rgba(96,165,250,0.28)]',
    PROCESSING: 'border-amber-400 bg-amber-400 text-black shadow-[0_10px_28px_rgba(251,191,36,0.28)]',
    COMPLETED: 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
  }
  return {
    active: activeMap[status as VendorClaimBatch['status']],
    idle: `${getStatusConfig(status).color} opacity-50 hover:opacity-80 border-transparent`
  }
}

// ------- Filtered & Paginated -------
const filtered = computed(() =>
  statusFilter.value === 'ALL'
    ? allBatches.value
    : allBatches.value.filter(b => b.status === statusFilter.value)
)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

watch(statusFilter, () => {
  currentPage.value = 1
})

const pageNumbers = computed(() => Array.from({ length: pageCount.value }, (_, i) => i + 1))
const visibleFrom = computed(() => filtered.value.length === 0 ? 0 : (currentPage.value - 1) * PAGE_SIZE + 1)
const visibleTo = computed(() => Math.min(filtered.value.length, currentPage.value * PAGE_SIZE))

// ------- Actions -------
const handleRefresh = async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 700))
  isLoading.value = false
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
</script>

<template>
  <div class="p-6 lg:p-12 space-y-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-lg bg-white/5 border border-white/10">
            <Package2
              class="text-[#B6F500]"
              :size="20"
            />
          </div>
          <h1 class="text-3xl font-black italic tracking-tighter uppercase">
            Vendor Claims
          </h1>
        </div>
        <p class="text-white/40 text-sm font-medium">
          Kelola batch klaim ke vendor. Setiap batch berisi klaim dari satu vendor.
        </p>
      </div>
      <NuxtLink
        to="/dashboard/vendor-claims/create"
        class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95 self-start lg:self-auto"
      >
        <Plus :size="16" />
        Buat Vendor Claim
      </NuxtLink>
    </div>

    <!-- Filter Panel -->
    <section class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.10),transparent_28%),rgba(255,255,255,0.04)] p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="min-w-0 flex-1">
          <p class="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
            Filter by status
          </p>
          <div class="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <button
              v-for="status in statusOptions"
              :key="status"
              :class="[
                'group whitespace-nowrap rounded-2xl border px-4 py-3 text-left transition-all',
                statusFilter === status
                  ? getFilterClass(status).active
                  : getFilterClass(status).idle
              ]"
              @click="statusFilter = status; currentPage = 1"
            >
              <div class="flex items-center gap-2">
                <span
                  :class="[
                    'h-2 w-2 rounded-full transition-opacity bg-current',
                    statusFilter === status ? 'opacity-90' : 'opacity-55 group-hover:opacity-80'
                  ]"
                />
                <span class="text-[10px] font-black uppercase tracking-[0.22em]">
                  {{ status === 'ALL' ? 'All' : getStatusConfig(status).label }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="rounded-2xl border border-white/8 bg-black/20 px-5 py-3 flex items-center gap-4">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
                Total Batch
              </p>
              <p class="text-xl font-black tracking-tight text-[#B6F500] mt-1">
                {{ filtered.length.toString().padStart(2, '0') }}
                <span class="text-white/30 text-sm font-semibold">/ {{ allBatches.length.toString().padStart(2, '0') }}</span>
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

    <!-- Table -->
    <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
      >
        <div class="h-10 w-10 border-4 border-[#B6F500]/20 border-t-[#B6F500] rounded-full animate-spin" />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr class="border-b border-white/5">
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Batch Number
              </th>
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Vendor
              </th>
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Items
              </th>
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Submitted Date
              </th>
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Created At
              </th>
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Status
              </th>
              <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <!-- Data rows -->
            <tr
              v-for="batch in paginated"
              :key="batch.id"
              class="group hover:bg-white/2 transition-colors"
            >
              <td class="px-6 py-5">
                <div class="flex flex-col">
                  <span class="font-black text-[#B6F500] tracking-tighter">{{ batch.batchNumber }}</span>
                  <span class="text-[10px] text-white/30 uppercase font-bold tracking-widest">{{ batch.totalItems }} items</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest">
                  {{ batch.vendor }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-2">
                  <Layers
                    :size="14"
                    class="text-white/30"
                  />
                  <span class="text-sm font-bold text-white/70">{{ batch.totalItems }}</span>
                </div>
              </td>
              <td class="px-6 py-5">
                <span class="text-sm font-semibold text-white/60">{{ formatDate(batch.submittedDate) }}</span>
              </td>
              <td class="px-6 py-5">
                <span class="text-sm font-semibold text-white/40">{{ formatDate(batch.createdAt) }}</span>
              </td>
              <td class="px-6 py-5">
                <span
                  :class="`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusConfig(batch.status).color} text-[10px] font-black uppercase tracking-widest`"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current" />
                  {{ getStatusConfig(batch.status).label }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex justify-end">
                  <NuxtLink
                    :to="`/dashboard/vendor-claims/${batch.id}`"
                    class="p-2 rounded-xl bg-white/5 hover:bg-[#B6F500] hover:text-black transition-all"
                  >
                    <Eye :size="16" />
                  </NuxtLink>
                </div>
              </td>
            </tr>

            <!-- Empty: no data at all -->
            <tr v-if="!isLoading && allBatches.length === 0">
              <td
                colspan="7"
                class="py-32 text-center"
              >
                <div class="flex flex-col items-center gap-4">
                  <div class="p-6 rounded-full bg-white/5">
                    <Package2
                      :size="48"
                      class="text-white/10"
                    />
                  </div>
                  <p class="text-white/20 font-bold uppercase tracking-widest text-sm">
                    Belum ada vendor claim batch
                  </p>
                  <NuxtLink
                    to="/dashboard/vendor-claims/create"
                    class="rounded-xl bg-[#B6F500] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-all hover:scale-105"
                  >
                    Buat Vendor Claim
                  </NuxtLink>
                </div>
              </td>
            </tr>

            <!-- Empty: no filtered results -->
            <tr v-else-if="!isLoading && filtered.length === 0">
              <td
                colspan="7"
                class="py-32 text-center"
              >
                <div class="flex flex-col items-center gap-4">
                  <div class="p-6 rounded-full bg-white/5">
                    <Package2
                      :size="48"
                      class="text-white/10"
                    />
                  </div>
                  <p class="text-white/20 font-bold uppercase tracking-widest text-sm">
                    Tidak ada batch dengan status ini
                  </p>
                  <button
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition-all hover:border-white/20 hover:text-white"
                    @click="statusFilter = 'ALL'"
                  >
                    Reset Filter
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="filtered.length > 0"
        class="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-white/5 bg-black/20"
      >
        <div class="text-[10px] font-black uppercase tracking-widest text-white/30">
          Showing <span class="text-white/60">{{ visibleFrom }}-{{ visibleTo }}</span> of <span class="text-white/60">{{ filtered.length }}</span> batches
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="currentPage === 1"
            class="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            @click="currentPage--"
          >
            <ChevronLeft :size="18" />
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="page in pageNumbers"
              :key="page"
              :class="[
                'h-10 w-10 flex items-center justify-center rounded-xl font-bold text-xs transition-all',
                currentPage === page
                  ? 'bg-[#B6F500] text-black shadow-[0_5px_15px_rgba(182,245,0,0.3)]'
                  : 'hover:bg-white/5 text-white/40'
              ]"
              @click="currentPage = page"
            >
              {{ page.toString().padStart(2, '0') }}
            </button>
          </div>
          <button
            :disabled="currentPage === pageCount"
            class="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            @click="currentPage++"
          >
            <ChevronRight :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
tr { transition: all 0.2s ease; }
button { transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
