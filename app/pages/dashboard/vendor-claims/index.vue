<script setup lang="ts">
import {
  Plus,
  Eye,
  Layers
} from 'lucide-vue-next'
import { getFiscalLabel } from '~~/shared/utils/fiscal'
import { getVendorClaimFilterClasses, getVendorClaimStatusConfig } from '~/utils/status-config'
import StatusBadge from '~/components/StatusBadge.vue'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

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
const vendorFilter = ref<string>('ALL')
const periodFilter = ref<string>('ALL')
const isLoading = ref(false)
const pageSizeOptions = [5, 10, 25]
const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const statusOptions: StatusFilter[] = ['ALL', 'CREATED', 'PROCESSING', 'COMPLETED']

const vendorOptions = computed(() => {
  const vendors = [...new Set(allBatches.value.map(batch => batch.vendor))].sort()
  return ['ALL', ...vendors]
})

const periodOptions = computed(() => {
  const periods = [...new Set(allBatches.value.map(batch => getFiscalLabel(batch.createdAt)))].sort()
  return ['ALL', ...periods]
})

// ------- Filtered & Paginated -------
const filtered = computed(() => {
  let result = allBatches.value

  if (statusFilter.value !== 'ALL') {
    result = result.filter(batch => batch.status === statusFilter.value)
  }

  if (vendorFilter.value !== 'ALL') {
    result = result.filter(batch => batch.vendor === vendorFilter.value)
  }

  if (periodFilter.value !== 'ALL') {
    result = result.filter(batch => getFiscalLabel(batch.createdAt) === periodFilter.value)
  }

  return result
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pagination.value.pageSize)))

const paginated = computed(() => {
  const start = pagination.value.pageIndex * pagination.value.pageSize
  return filtered.value.slice(start, start + pagination.value.pageSize)
})

watch([statusFilter, vendorFilter, periodFilter], () => {
  pagination.value.pageIndex = 0
})

const resetFilters = () => {
  statusFilter.value = 'ALL'
  vendorFilter.value = 'ALL'
  periodFilter.value = 'ALL'
}

const visibleFrom = computed(() => filtered.value.length === 0 ? 0 : pagination.value.pageIndex * pagination.value.pageSize + 1)
const visibleTo = computed(() => Math.min(filtered.value.length, (pagination.value.pageIndex + 1) * pagination.value.pageSize))

const handlePageSizeChange = (nextPageSize: number) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: 0,
    pageSize: nextPageSize
  }
}

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
    <PageHeader
      title="Vendor Claims"
      description="Kelola batch klaim ke vendor. Setiap batch berisi klaim dari satu vendor."
    >
      <template #actions>
        <NuxtLink
          to="/dashboard/vendor-claims/create"
          class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95"
        >
          <Plus :size="16" />
          Buat Vendor Claim
        </NuxtLink>
      </template>
    </PageHeader>

    <FilterBar
      v-model:refreshing="isLoading"
      search-placeholder=""
      :show-refresh="true"
      :show-reset="true"
      :has-active-filters="statusFilter !== 'ALL' || vendorFilter !== 'ALL' || periodFilter !== 'ALL'"
      @refresh="handleRefresh"
      @reset="resetFilters"
    >
      <button
        v-for="status in statusOptions"
        :key="status"
        :class="[
          'group whitespace-nowrap rounded-2xl border px-4 py-3 text-left transition-all',
          getVendorClaimFilterClasses(status, statusFilter)
        ]"
        @click="statusFilter = status; pagination.pageIndex = 0"
      >
        <div class="flex items-center gap-2">
          <span
            :class="[
              'h-2 w-2 rounded-full transition-opacity bg-current',
              statusFilter === status ? 'opacity-90' : 'opacity-55 group-hover:opacity-80'
            ]"
          />
          <span class="text-[10px] font-black uppercase tracking-[0.22em]">
            {{ status === 'ALL' ? 'All' : getVendorClaimStatusConfig(status).label }}
          </span>
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
          <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Period</span>
          <select
            v-model="periodFilter"
            class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 outline-none transition-all focus:border-[#B6F500]/50"
          >
            <option
              v-for="period in periodOptions"
              :key="period"
              :value="period"
            >
              {{ period === 'ALL' ? 'All Periods' : period }}
            </option>
          </select>
        </div>
      </div>

      <template #summary>
        <div class="rounded-2xl border border-white/8 bg-black/20 px-5 py-3">
          <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
            Total Batch
          </p>
          <p class="text-xl font-black tracking-tight text-[#B6F500] mt-1">
            {{ filtered.length.toString().padStart(2, '0') }}
            <span class="text-white/30 text-sm font-semibold">/ {{ allBatches.length.toString().padStart(2, '0') }}</span>
          </p>
        </div>
      </template>
    </FilterBar>

    <!-- Table -->
    <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
      <LoadingState
        v-if="isLoading"
        variant="table"
        :rows="5"
      />
      <EmptyState
        v-else-if="filtered.length === 0 && (statusFilter !== 'ALL' || vendorFilter !== 'ALL' || periodFilter !== 'ALL')"
        title="Tidak ada data ditemukan"
        description="Coba ubah filter atau kata kunci pencarian."
        action-label="Reset Filter"
        @action="resetFilters"
      />
      <EmptyState
        v-else-if="allBatches.length === 0"
        title="Belum ada vendor claim batch"
        description="Buat vendor claim baru untuk memulai batching klaim."
        action-label="Buat Vendor Claim"
        action-to="/dashboard/vendor-claims/create"
      />
      <div
        v-else
        class="overflow-x-auto"
      >
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
                <StatusBadge
                  :status="batch.status"
                  variant="vendor-claim"
                  size="sm"
                />
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
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div
        v-if="!isLoading && filtered.length > 0"
        class="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-white/5 bg-black/20"
      >
        <div class="text-[10px] font-black uppercase tracking-widest text-white/30">
          Showing <span class="text-white/60">{{ visibleFrom }}-{{ visibleTo }}</span> of <span class="text-white/60">{{ filtered.length }}</span> batches
        </div>
        <DashboardTablePagination
          :page-size="pagination.pageSize"
          :page-size-options="pageSizeOptions"
          :visible-from="visibleFrom"
          :visible-to="visibleTo"
          :total-items="filtered.length"
          :page-index="pagination.pageIndex"
          :page-count="pageCount"
          :can-previous-page="pagination.pageIndex > 0"
          :can-next-page="pagination.pageIndex < pageCount - 1"
          item-label="batches"
          button-class="text-white/40 hover:bg-white/10 hover:text-white"
          @update:page-size="handlePageSizeChange"
          @first="pagination.pageIndex = 0"
          @previous="pagination.pageIndex--"
          @next="pagination.pageIndex++"
          @last="pagination.pageIndex = pageCount - 1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
tr { transition: all 0.2s ease; }
button { transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease; }
select {
  color-scheme: dark;
}

select option {
  background: #0a0a0a;
  color: #fff;
}
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
