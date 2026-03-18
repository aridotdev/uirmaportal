<script setup lang="ts">
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileText,
  Search
} from 'lucide-vue-next'

type Status = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'ARCHIVED'
type StatusFilter = 'ALL' | Status

type ClaimItem = {
  id: string
  model: string
  status: Status
  createdAt: string
}

definePageMeta({
  layout: 'cs'
})

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('ALL')
const currentPage = ref(1)
const itemsPerPage = 8

const statusOptions: StatusFilter[] = ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED']

const statusConfigs: Record<Status, string> = {
  DRAFT: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_REVIEW: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  NEED_REVISION: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-[#B6F500]/10 text-[#B6F500] border-[#B6F500]/20',
  ARCHIVED: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
}

const mockStatuses: Status[] = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED']

const claimsData = ref<ClaimItem[]>(
  Array.from({ length: 25 }, (_, i) => ({
    id: `NTF-2026-X${882 + i}`,
    model: i % 2 === 0 ? 'LG OLED 55" C3' : 'Samsung S23 Ultra',
    status: mockStatuses[i % mockStatuses.length]!,
    createdAt: `2025-10-0${(i % 9) + 1} 14:20`
  }))
)

const filteredData = computed(() => {
  return claimsData.value.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredData.value.slice(start, end)
})

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

  return (currentPage.value - 1) * itemsPerPage + 1
})

const visibleTo = computed(() => Math.min(filteredData.value.length, currentPage.value * itemsPerPage))

const setPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const getStatusClass = (status: Status) => statusConfigs[status]

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
  currentPage.value = 1
})
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white selection:bg-[#B6F500] selection:text-black">
    <header class="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-white/5 bg-[#050505]/80 px-6 backdrop-blur-md md:px-12">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-black uppercase italic tracking-tighter">
          My <span class="text-[#B6F500]">Reports</span>
        </h1>
        <div class="hidden h-4 w-px bg-white/10 md:block" />
        <p class="hidden text-[10px] font-bold uppercase tracking-widest text-white/20 md:block">
          History Lengkap Klaim RMA
        </p>
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
    </header>

    <div class="animate-in space-y-8 p-6 md:p-12">
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

        <div class="no-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-2 lg:w-auto lg:pb-0">
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
      </section>

      <div class="overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                <th class="px-8 py-6">
                  Notification Code
                </th>
                <th class="px-8 py-6">
                  Model Name
                </th>
                <th class="px-8 py-6">
                  Status
                </th>
                <th class="px-8 py-6">
                  Created At
                </th>
                <th class="px-8 py-6 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <template v-if="paginatedData.length > 0">
                <tr
                  v-for="(item, idx) in paginatedData"
                  :key="`${item.id}-${idx}`"
                  class="group transition-colors hover:bg-white/2"
                >
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/20 transition-colors group-hover:bg-[#B6F500]/10 group-hover:text-[#B6F500]">
                        <FileText class="h-3.5 w-3.5" />
                      </div>
                      <span class="text-sm font-black italic tracking-tight">{{ item.id }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-sm font-bold text-white/60">{{ item.model }}</span>
                  </td>
                  <td class="px-8 py-6">
                    <span :class="['rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest', getStatusClass(item.status)]">
                      {{ item.status.replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-8 py-6">
                    <span class="text-xs font-medium uppercase tracking-tighter text-white/30">{{ item.createdAt }}</span>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button class="rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:border-[#B6F500]/50 hover:text-[#B6F500]">
                        <Eye class="h-4 w-4" />
                      </button>
                      <button class="rounded-xl border border-white/10 bg-white/5 p-2 transition-all hover:bg-white/10">
                        <ExternalLink class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td
                  colspan="5"
                  class="px-8 py-20 text-center"
                >
                  <div class="flex flex-col items-center gap-4 text-white/20">
                    <Search
                      class="h-12 w-12"
                      :stroke-width="1"
                    />
                    <p class="text-xs font-black italic uppercase tracking-widest">
                      Data tidak ditemukan
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col items-center justify-between gap-4 border-t border-white/5 p-6 sm:flex-row">
          <p class="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Showing {{ visibleFrom }} to {{ visibleTo }} of {{ filteredData.length }} entries
          </p>

          <div class="flex items-center gap-2">
            <button
              :disabled="currentPage === 1"
              class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              @click="setPage(currentPage - 1)"
            >
              <ChevronLeft class="h-4.5 w-4.5" />
            </button>

            <div class="flex items-center gap-1">
              <button
                v-for="page in totalPages"
                :key="page"
                :class="[
                  'h-10 w-10 rounded-xl border text-[10px] font-black transition-all',
                  currentPage === page
                    ? 'border-[#B6F500] bg-[#B6F500] text-black'
                    : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
                ]"
                @click="setPage(page)"
              >
                {{ page.toString().padStart(2, '0') }}
              </button>
            </div>

            <button
              :disabled="currentPage === totalPages || totalPages === 0"
              class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              @click="setPage(currentPage + 1)"
            >
              <ChevronRight class="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

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
