<script setup lang="ts">
import {
  Search,
  Bell,
  FileText,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
  Eye,
  Inbox,
  RefreshCw
} from 'lucide-vue-next'

import type { ClaimStatus, NotificationStatus } from '~~/shared/utils/constants'

definePageMeta({
  layout: 'cs'
})

interface RawClaim {
  claimNumber: string
  notificationId: number
  inch: number
  modelName: string
  vendorName: string
  branch: string
  defectName: string
  claimStatus: ClaimStatus
  createdAt: string
  submittedBy: string
  updatedBy: string
}

interface RawNotification {
  id: number
  notificationCode: string
  status: NotificationStatus
}

const { data: rawClaims, status, error, refresh: refreshClaims } = await useFetch<RawClaim[]>('/api/claims')
const { data: rawNotifications } = await useFetch<RawNotification[]>('/api/notifications')
const isLoading = computed(() => status.value === 'pending')
const isError = computed(() => !!error.value)

const claimsData = computed(() => {
  if (!rawClaims.value) return []
  return [...rawClaims.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((item: RawClaim) => ({
      id: item.claimNumber,
      prod: `${item.modelName} • ${item.defectName}`,
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
const topSearchInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // Keyboard Shortcut: / or Ctrl+K to search
  const handleGlobalKeydown = (e: KeyboardEvent) => {
    if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault()
      topSearchInput.value?.focus()
    }
  }
  window.addEventListener('keydown', handleGlobalKeydown)

  onUnmounted(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('keydown', handleGlobalKeydown)
  })
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
const totalClaims = computed(() => rawClaims.value?.filter(c => c.claimStatus !== 'DRAFT').length || 0)
const totalNotifications = computed(() => rawNotifications.value?.length || 0)

const ratioMessage = computed(() => {
  const ratio = totalNotifications.value > 0 ? (totalClaims.value / totalNotifications.value) * 100 : 0
  if (ratio < 50) {
    return {
      title: 'Fokus & Semangat',
      description: 'Ayo selesaikan klaim RMA bulan ini!'
    }
  } else if (ratio < 100) {
    return {
      title: 'Performa Hebat!',
      description: 'Bisa nih 100% bulan ini!'
    }
  } else {
    return {
      title: 'Target Tercapai!',
      description: 'Terima kasih atas kerja samanya'
    }
  }
})

const personalStats = computed(() => {
  const counts = {
    DRAFT: 0,
    SUBMITTED: 0,
    IN_REVIEW: 0,
    NEED_REVISION: 0,
    APPROVED: 0
  }

  rawClaims.value?.forEach((claim) => {
    const s = claim.claimStatus as keyof typeof counts
    if (Object.hasOwn(counts, s)) {
      counts[s]++
    }
  })

  return [
    { label: 'DRAFT', val: String(counts.DRAFT).padStart(2, '0'), color: '#9ca3af' },
    { label: 'SUBMITTED', val: String(counts.SUBMITTED).padStart(2, '0'), color: '#3b82f6' },
    { label: 'IN REVIEW', val: String(counts.IN_REVIEW).padStart(2, '0'), color: '#06b6d4' },
    { label: 'NEED REVISION', val: String(counts.NEED_REVISION).padStart(2, '0'), color: '#f59e0b' },
    { label: 'APPROVED', val: String(counts.APPROVED).padStart(2, '0'), color: '#B6F500' }
  ]
})

const heroSearchInput = ref('')
const topBarSearchInput = ref('')
const toast = useToast()
const isSearching = ref(false)
const isModalOpen = ref(false)
const activeSearchCode = ref('')

const isLookupModalOpen = ref(false)
const lookupResult = ref<RawClaim | null>(null)

const handleSearch = async (sourceInput: string): Promise<void> => {
  const code = sourceInput.trim()
  if (!code) return

  activeSearchCode.value = code
  isSearching.value = true
  try {
    const data = await $fetch<{ notification: { status: NotificationStatus } }>(`/api/notifications/${encodeURIComponent(code)}`)

    if (data.notification.status !== 'NEW') {
      toast.add({
        title: 'Gagal Memproses',
        description: `Notifikasi ${code} memiliki status ${data.notification.status}. Hanya status NEW yang dapat diproses.`,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      isSearching.value = false
      return
    }
  } catch (error: unknown) {
    const fetchError = error as { statusCode?: number }
    if (fetchError.statusCode === 404) {
      isSearching.value = false
      isModalOpen.value = true
      return
    }

    toast.add({
      title: 'Error',
      description: 'Terjadi kesalahan saat memverifikasi kode notifikasi.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    isSearching.value = false
    return
  }

  isSearching.value = false
  navigateTo({
    path: '/cs/claims/create',
    query: { notification: code }
  })
}

const navigateToCreateClaim = () => handleSearch(heroSearchInput.value)

const handleTopBarSearch = () => {
  if (isLookupModalOpen.value) return
  const code = topBarSearchInput.value.trim().toLowerCase()
  if (!code) return

  const found = rawClaims.value?.find(c =>
    c.claimNumber.toLowerCase().includes(code)
    || String(c.notificationId).toLowerCase().includes(code)
  )

  if (found) {
    lookupResult.value = found
    isLookupModalOpen.value = true
  } else {
    toast.add({
      title: 'Data Tidak Ditemukan',
      description: `Klaim atau Notifikasi "${topBarSearchInput.value}" tidak ditemukan dalam sistem.`,
      color: 'error',
      icon: 'i-lucide-search'
    })
  }
}

const confirmManualEntry = (): void => {
  const code = activeSearchCode.value.trim()
  isModalOpen.value = false
  navigateTo({
    path: '/cs/claims/create',
    query: { notification: code }
  })
}

const cancelManualEntry = (): void => {
  isModalOpen.value = false
  activeSearchCode.value = ''
}

const handleKeydown = (event: KeyboardEvent, source: 'top' | 'hero'): void => {
  if (event.key === 'Enter' && !isSearching.value) {
    if (source === 'top') handleTopBarSearch()
    else navigateToCreateClaim()
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <header class="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 px-6 backdrop-blur-md md:px-12">
      <div class="mx-auto flex h-24 w-full max-w-7xl items-center justify-between">
        <div class="flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 w-100 transition-all focus-within:border-[#B6F500]/50 hover:border-[#B6F500]">
          <Search
            :size="18"
            class="text-white/30"
          />
          <input
            ref="topSearchInput"
            v-model="topBarSearchInput"
            type="text"
            placeholder="Cari Kode Notifikasi (Press / to search)"
            class="w-full border-none bg-transparent px-4 text-sm font-medium outline-none placeholder:text-white/20"
            @keydown.enter.prevent.stop="handleKeydown($event, 'top')"
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
      </div>
    </header>

    <div class="flex-1 overflow-y-auto p-12">
      <div class="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-5 space-y-12 duration-700">
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
                  v-model="heroSearchInput"
                  type="text"
                  placeholder="Masukkan Kode Notifikasi (e.g. NTF-2024003)"
                  class="w-full bg-white/5 border border-white/10 rounded-3xl px-10 py-6 text-2xl font-black italic focus:outline-none focus:border-[#B6F500] focus:ring-15 focus:ring-[#B6F500]/5 transition-all placeholder:text-white/10 placeholder:italic"
                  @keydown.enter.prevent.stop="handleKeydown($event, 'hero')"
                >
                <div class="absolute right-4 top-1/2 -translate-y-1/2">
                  <button
                    :disabled="!heroSearchInput.trim() || isSearching"
                    class="bg-[#B6F500] text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-[#B6F500]/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    @click="navigateToCreateClaim"
                  >
                    <Loader2
                      v-if="isSearching"
                      class="w-4 h-4 animate-spin"
                    />
                    {{ isSearching ? 'Verifikasi...' : 'Ambil Data' }}
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
                Aktivitas <span class="text-white/20">Klaim Terbaru</span>
              </h3>
              <button class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-[#B6F500] uppercase tracking-widest hover:bg-[#B6F500]/10 hover:border-[#B6F500]/30 hover:shadow-[0_0_20px_rgba(182,245,0,0.1)] transition-all duration-300 active:scale-95 group cursor-pointer">
                History Lengkap
                <ArrowRight
                  :size="12"
                  class="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>

            <!-- Card List Antrean Personal: Loading State -->
            <div
              v-if="isLoading"
              class="space-y-4"
            >
              <div
                v-for="i in 4"
                :key="i"
                class="bg-white/5 border border-white/10 p-8 rounded-[35px] flex items-center justify-between animate-pulse"
              >
                <div class="flex items-center gap-8">
                  <div class="w-16 h-16 rounded-2xl bg-white/10" />
                  <div class="space-y-3">
                    <div class="h-6 w-48 bg-white/10 rounded-lg" />
                    <div class="h-4 w-32 bg-white/5 rounded-lg" />
                  </div>
                </div>
                <div class="flex items-center gap-8">
                  <div class="h-8 w-24 bg-white/10 rounded-full" />
                  <div class="w-12 h-12 rounded-full border border-white/10 bg-white/5" />
                </div>
              </div>
            </div>

            <!-- Card List Antrean Personal: Error State -->
            <div
              v-else-if="isError"
              class="backdrop-blur-xl bg-red-500/5 border border-red-500/20 p-20 rounded-[45px] flex flex-col items-center text-center space-y-6"
            >
              <div class="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertCircle :size="48" />
              </div>
              <div class="max-w-xs">
                <h5 class="text-xl font-black italic uppercase tracking-tight mb-2 text-red-500">
                  Gagal Memuat Data
                </h5>
                <p class="text-sm text-white/30 uppercase tracking-widest leading-relaxed mb-6">
                  Terjadi gangguan saat mengambil data klaim dari server.
                </p>
                <button
                  class="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 transition-all active:scale-95"
                  @click="refreshClaims"
                >
                  <RefreshCw
                    :size="14"
                    :class="{ 'animate-spin': isLoading }"
                  />
                  Coba Lagi
                </button>
              </div>
            </div>

            <!-- Card List Antrean Personal: Empty State -->
            <div
              v-else-if="claimsData.length === 0"
              class="backdrop-blur-xl bg-white/5 border border-white/10 p-20 rounded-[45px] flex flex-col items-center text-center space-y-6"
            >
              <div class="w-24 h-24 rounded-3xl bg-[#B6F500]/10 flex items-center justify-center text-[#B6F500]">
                <Inbox :size="48" />
              </div>
              <div class="max-w-xs">
                <h5 class="text-xl font-black italic uppercase tracking-tight mb-2">
                  Klaim RMA belum dibuat
                </h5>
                <p class="text-sm text-white/30 uppercase tracking-widest leading-relaxed">
                  Belum ada klaim RMA yang dibuat. Silahkan buat klaim baru atau cari data di atas.
                </p>
              </div>
            </div>

            <!-- Card List Antrean Personal: Actual Data -->
            <div
              v-else
              class="space-y-4"
            >
              <div
                v-for="(item, idx) in claimsData.slice(0, 4)"
                :key="idx"
                class="group backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-[35px] flex items-center justify-between hover:bg-white/8 hover:border-white/20 transition-all"
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
                  <NuxtLink
                    :to="`/cs/claims/${item.id}`"
                    target="_blank"
                    class="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-black hover:bg-[#B6F500] hover:border-[#B6F500] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group/arrow"
                  >
                    <ArrowRight
                      :size="20"
                      class="transition-transform duration-300 group-hover/arrow:-rotate-45"
                    />
                  </NuxtLink>
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
              <div
                v-if="isLoading"
                class="space-y-8"
              >
                <div
                  v-for="i in 5"
                  :key="i"
                  class="flex justify-between items-center animate-pulse"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-2.5 h-2.5 rounded-full bg-white/10" />
                    <div class="h-4 w-24 bg-white/10 rounded-md" />
                  </div>
                  <div class="h-6 w-8 bg-white/10 rounded-md" />
                </div>
              </div>

              <div
                v-else
                class="space-y-4"
              >
                <div
                  v-for="stat in personalStats"
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
                      {{ totalNotifications > 0 ? Math.round((totalClaims / totalNotifications) * 100) : 0 }}%
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
                  <!-- Progress Bar Gamification -->
                  <div class="mt-6">
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-[8px] font-black uppercase tracking-widest text-white/20">Target Progress</span>
                      <span class="text-[8px] font-black uppercase tracking-widest text-[#B6F500]">{{ totalNotifications > 0 ? Math.round((totalClaims / totalNotifications) * 100) : 0 }}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div
                        class="h-full bg-[#B6F500] shadow-[0_0_10px_#B6F500] transition-all duration-1000 ease-out rounded-full"
                        :style="{ width: `${totalNotifications > 0 ? Math.round((totalClaims / totalNotifications) * 100) : 0}%` }"
                      />
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

    <!-- ──────────────────────────────────────────────
         Verification Modal (404 Flow)
         ────────────────────────────────────────────── -->
    <UModal
      v-model:open="isModalOpen"
      :ui="{ content: 'bg-transparent shadow-none border-none ring-0 overflow-visible' }"
      :dismissible="false"
    >
      <template #content>
        <div class="p-10 bg-[#0a0a0a] rounded-4xl relative overflow-hidden shadow-2xl">
          <!-- Close Button -->
          <button
            class="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all z-20 group"
            @click="isModalOpen = false"
          >
            <X
              :size="18"
              class="group-hover:rotate-90 transition-transform"
            />
          </button>

          <!-- Abstract Background -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div class="relative z-10">
            <div class="flex items-center gap-5 mb-8 text-orange-400">
              <div class="w-16 h-16 rounded-2xl bg-orange-400/10 flex items-center justify-center">
                <AlertCircle :size="32" />
              </div>
              <div>
                <h3 class="text-3xl font-black italic uppercase tracking-tighter leading-none">
                  Verifikasi Kode
                </h3>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">
                  Notification Check
                </p>
              </div>
            </div>

            <p class="text-lg text-white/40 font-medium mb-10 leading-relaxed">
              Nomor notifikasi <span class="text-white font-black italic underline decoration-[#B6F500] underline-offset-4">{{ activeSearchCode }}</span> tidak ditemukan. Apakah nomor ini sudah benar?
            </p>

            <div class="flex gap-4">
              <button
                class="flex-1 bg-[#B6F500] text-black h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-[#B6F500]/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                @click="confirmManualEntry"
              >
                Sudah Benar
              </button>
              <button
                class="flex-1 bg-white/5 border border-white/10 text-white/40 h-16 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white/8 hover:text-white transition-all text-xs"
                @click="cancelManualEntry"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <!-- ──────────────────────────────────────────────
         Lookup Modal (Claims Data Quick View)
         ────────────────────────────────────────────── -->
    <UModal
      v-model:open="isLookupModalOpen"
      :ui="{ content: 'bg-transparent shadow-none border-none ring-0 overflow-visible' }"
    >
      <template #content>
        <div class="p-10 bg-[#0a0a0a] rounded-4xl relative overflow-hidden shadow-2xl border border-white/5">
          <!-- Close Button -->
          <button
            tabindex="-1"
            class="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all z-20 group outline-none"
            @click="isLookupModalOpen = false"
          >
            <X
              :size="18"
              class="group-hover:rotate-90 transition-transform"
            />
          </button>

          <!-- Abstract Background Decor -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#B6F500]/5 rounded-full blur-3xl pointer-events-none" />

          <div
            v-if="lookupResult"
            class="relative z-10"
          >
            <div class="flex items-center gap-5 mb-10 text-[#B6F500]">
              <div class="w-16 h-16 rounded-2xl bg-[#B6F500]/10 flex items-center justify-center">
                <Search :size="32" />
              </div>
              <div>
                <h3 class="text-3xl font-black italic uppercase tracking-tighter leading-none">
                  Claim Lookup
                </h3>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">
                  Details Found for: {{ lookupResult.claimNumber }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8 mb-10">
              <div class="space-y-6">
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Claim ID</label>
                  <p class="text-xl font-black italic">
                    {{ lookupResult.claimNumber }}
                  </p>
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Notification No.</label>
                  <p class="text-xl font-black italic">
                    {{ lookupResult.notificationId }}
                  </p>
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Branch</label>
                  <p class="text-lg font-bold uppercase">
                    {{ lookupResult.branch }}
                  </p>
                </div>
              </div>
              <div class="space-y-6">
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Model Name</label>
                  <p class="text-lg font-bold uppercase italic text-[#B6F500]">
                    {{ lookupResult.modelName }}
                  </p>
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Defect Name</label>
                  <p class="text-lg font-bold text-white/60 uppercase italic">
                    {{ lookupResult.defectName }}
                  </p>
                </div>
                <div>
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2">Status</label>
                  <span :class="['px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest inline-block', statusConfigs[lookupResult.claimStatus]]">
                    {{ lookupResult.claimStatus.replace('_', ' ') }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <NuxtLink
                :to="`/cs/claims/${lookupResult.claimNumber}`"
                class="flex-1 bg-[#B6F500] text-black h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-[#B6F500]/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
              >
                <Eye :size="16" />
                Lihat Detail
              </NuxtLink>
              <button
                class="flex-1 bg-white/5 border border-white/10 text-white/40 h-16 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white/8 hover:text-white transition-all text-xs"
                @click="isLookupModalOpen = false"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </template>
    </UModal>
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
