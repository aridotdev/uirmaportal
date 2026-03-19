<script setup lang="ts">
import {
  Search,
  Bell,
  FileText,
  AlertCircle,
  ArrowRight
} from 'lucide-vue-next'

import type { ClaimStatus } from '~~/shared/utils/constants'

definePageMeta({
  layout: 'cs'
})

interface RawClaim {
  claimNumber: string
  inch: number
  claimStatus: ClaimStatus
  createdAt: string
  submittedBy: string
}

const { data: rawClaims } = await useFetch<RawClaim[]>('/api/claims')

const claimsData = computed(() => {
  if (!rawClaims.value) return []
  return rawClaims.value.map((item: RawClaim) => ({
    id: item.claimNumber,
    prod: `${item.inch}" Display Panel`,
    status: item.claimStatus as ClaimStatus,
    date: new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(item.createdAt))
  }))
})

const statusConfigs: Record<ClaimStatus, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_REVIEW: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  NEED_REVISION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  APPROVED: 'bg-[#B6F500]/20 text-[#B6F500] border-[#B6F500]/30',
  ARCHIVED: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
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
const totalClaims = computed(() => rawClaims.value?.length || 0)
const totalNotifications = ref(25)

const ratioMessage = computed(() => {
  const ratio = totalNotifications.value > 0 ? (totalClaims.value / totalNotifications.value) * 100 : 0
  if (ratio < 50) {
    return {
      title: 'Fokus & Semangat',
      description: 'Ayo selesaikan klaim RMA bulan ini!'
    }
  } else {
    return {
      title: 'Performa Hebat!',
      description: 'Bisa nih 100% bulan ini!'
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <header class="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-white/5 bg-[#050505]/80 px-12 backdrop-blur-md">
      <div class="flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 w-100 transition-all focus-within:border-[#B6F500]/50 hover:border-[#B6F500]">
        <Search
          :size="18"
          class="text-white/30"
        />
        <input
          type="text"
          placeholder="Cari Kode Notifikasi"
          class="w-full border-none bg-transparent px-4 text-sm font-medium outline-none placeholder:text-white/20"
        >
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

    <div class="flex-1 overflow-y-auto p-12">
      <div class="animate-in fade-in slide-in-from-bottom-5 space-y-12 duration-700">
        <!-- Hero Search -->
        <section class="relative rounded-[50px] p-20 overflow-hidden border border-[#B6F500]/20 bg-linear-to-br from-[#B6F500]/5 via-[#0a0a0a] to-[#0a0a0a]">
          <div class="absolute -top-24 -right-24 w-96 h-96 bg-[#B6F500]/10 blur-[120px] rounded-full" />

          <div class="w-full relative z-10">
            <span class="px-4 py-1.5 rounded-full bg-[#B6F500]/10 text-[#B6F500] text-[10px] font-black uppercase tracking-[0.3em] mb-8 inline-block">Operation Mode: Create Claim</span>
            <h2 class="text-6xl font-black tracking-tighter uppercase italic leading-[0.9] mb-6">
              Mulai <span class="text-[#B6F500]">Klaim RMA</span> Secara Instan.
            </h2>
            <p class="text-lg text-white/40 font-medium mb-12 leading-relaxed">
              Masukan kode notifikasi untuk membuat laporan RMA baru.
            </p>

            <div class="max-w-4xl flex gap-4">
              <div class="flex-1 relative group">
                <input
                  type="text"
                  placeholder="Masukkan Kode Notifikasi (e.g. NTF-2026-X882)"
                  class="w-full bg-white/5 border border-white/10 rounded-3xl px-10 py-6 text-2xl font-black italic focus:outline-none focus:border-[#B6F500] focus:ring-15 focus:ring-[#B6F500]/5 transition-all placeholder:text-white/10 placeholder:italic"
                >
                <div class="absolute right-4 top-1/2 -translate-y-1/2">
                  <button class="bg-[#B6F500] text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#B6F500]/20">
                    Ambil Data
                  </button>
                </div>
              </div>
            </div>
            <div class="mt-6 flex items-center gap-3 text-orange-400">
              <AlertCircle :size="14" />
              <p class="text-[10px] font-bold uppercase tracking-widest italic ">
                Silahkan lanjutkan walaupun notifikasi tidak terdaftar di database.
              </p>
            </div>
          </div>
        </section>

        <!-- Personal Activity Grid -->
        <div class="grid grid-cols-12 gap-12">
          <div class="col-span-8 space-y-8">
            <div class="flex justify-between items-center px-2">
              <h3 class="text-2xl font-black uppercase italic tracking-tight">
                Antrean <span class="text-white/20">Personal</span>
              </h3>
              <button class="text-[10px] font-black text-[#B6F500] uppercase tracking-widest hover:underline">
                History Lengkap
              </button>
            </div>

            <!-- Card List Antrean Personal -->
            <div class="space-y-4">
              <div
                v-for="(item, idx) in claimsData.slice(0, 3)"
                :key="idx"
                class="group backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-[35px] flex items-center justify-between hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer"
              >
                <div class="flex items-center gap-8">
                  <div class="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#B6F500] group-hover:text-black transition-all duration-500 shadow-inner">
                    <FileText :size="28" />
                  </div>
                  <div>
                    <h5 class="text-xl font-black italic tracking-tight mb-1">
                      {{ item.id }}
                    </h5>
                    <p class="text-xs font-bold text-white/30 uppercase tracking-widest">
                      {{ item.prod }} • {{ item.date }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-8">
                  <span :class="['px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-lg', statusConfigs[item.status]]">
                    {{ item.status.replace('_', ' ') }}
                  </span>
                  <div class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-[#B6F500] group-hover:border-[#B6F500]/50 transition-all">
                    <ArrowRight :size="20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-4">
            <!-- card statistik -->
            <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[45px] p-10 h-full">
              <h4 class="text-xl font-black italic tracking-tight uppercase mb-10">
                Statistik <span class="text-[#B6F500]">Saya</span>
              </h4>
              <div class="space-y-8">
                <div
                  v-for="stat in [
                    { label: 'APPROVED', val: '42', color: '#B6F500' },
                    { label: 'NEED REVISION', val: '03', color: '#f59e0b' },
                    { label: 'IN REVIEW', val: '12', color: '#3b82f6' }
                  ]"
                  :key="stat.label"
                  class="flex justify-between items-center"
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_inherit]"
                      :style="{ backgroundColor: stat.color, boxShadow: `0 0 10px ${stat.color}` }"
                    />
                    <span class="text-sm font-bold text-white/50 uppercase tracking-widest">{{ stat.label }}</span>
                  </div>
                  <span class="text-2xl font-black italic">{{ stat.val }}</span>
                </div>
              </div>

              <!-- card ratio -->
              <div class="mt-12 pt-10 border-t border-white/5">
                <div class="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                  <div class="relative z-10 flex items-center gap-5">
                    <div class="w-14 h-14 bg-[#B6F500] rounded-2xl flex items-center justify-center text-black font-black text-xl italic shadow-xl shadow-[#B6F500]/20 group-hover:scale-110 transition-transform">
                      {{ Math.round((totalClaims / totalNotifications) * 100) }}%
                    </div>
                    <div>
                      <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[#B6F500] mb-1">
                        {{ ratioMessage.title }}
                      </p>
                      <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">
                        {{ ratioMessage.description }}
                      </p>
                    </div>
                  </div>
                  <!-- Abstract Decoration -->
                  <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-[#B6F500]/10 rounded-full blur-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom-5 {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-in {
  animation-duration: 0.7s;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fade-in;
}

.slide-in-from-bottom-5 {
  animation-name: slide-in-from-bottom-5;
}
</style>
