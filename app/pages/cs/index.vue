<script setup lang="ts">
import {
  Search,
  Bell,
  FileText,
  AlertCircle,
  ArrowRight
} from 'lucide-vue-next'

type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'REJECTED'

definePageMeta({
  layout: 'cs'
})

type ClaimItem = {
  id: string
  user: string
  prod: string
  status: ClaimStatus
  date: string
}

const claimsData = [
  { id: 'RMA-2025-0012', user: 'Felix K.', prod: 'LG OLED 55" C3', status: 'IN_REVIEW', date: '06 Oct 2025' },
  { id: 'RMA-2025-0013', user: 'Zaina R.', prod: 'Samsung S23 Ultra', status: 'APPROVED', date: '05 Oct 2025' },
  { id: 'RMA-2025-0014', user: 'Felix K.', prod: 'Sony PS5 Slim', status: 'NEED_REVISION', date: '04 Oct 2025' },
  { id: 'RMA-2025-0015', user: 'Budi A.', prod: 'iPhone 15 Pro', status: 'SUBMITTED', date: '03 Oct 2025' }
] satisfies ClaimItem[]

const statusConfigs: Record<ClaimStatus, string> = {
  DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_REVIEW: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  NEED_REVISION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  APPROVED: 'bg-[#B6F500]/20 text-[#B6F500] border-[#B6F500]/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30'
}

</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <header class="sticky top-0 z-40 flex h-24 items-center justify-between border-b border-white/5 bg-[#050505]/80 px-12 backdrop-blur-md">
      <div class="flex items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 w-100 transition-all focus-within:border-[#B6F500]/50">
        <Search
          :size="18"
          class="text-white/30"
        />
        <input
          type="text"
          placeholder="Cari Kode RMA atau SN..."
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
          <p class="text-xs font-black tracking-widest text-[#B6F500]">
            MON, 06 OCT
          </p>
          <p class="text-[10px] font-bold text-white/30">
            14:45 PM SERVER TIME
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
                <div class="mt-6 flex items-center gap-3 text-white/20">
                  <AlertCircle :size="14" />
                  <p class="text-[10px] font-bold uppercase tracking-widest italic">
                    Hubungi QRCC jika notifikasi tidak terdaftar di database.
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
                <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[45px] p-10 h-full">
                  <h4 class="text-xl font-black italic tracking-tight uppercase mb-10">
                    Statistik <span class="text-[#B6F500]">Saya</span>
                  </h4>

                  <div class="space-y-8">
                    <div
                      v-for="stat in [
                        { label: 'Claim Disetujui', val: '42', color: '#B6F500' },
                        { label: 'Butuh Revisi', val: '03', color: '#f59e0b' },
                        { label: 'Pending Review', val: '12', color: '#3b82f6' }
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

                  <div class="mt-12 pt-10 border-t border-white/5">
                    <div class="p-6 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                      <div class="relative z-10 flex items-center gap-5">
                        <div class="w-14 h-14 bg-[#B6F500] rounded-2xl flex items-center justify-center text-black font-black text-xl italic shadow-xl shadow-[#B6F500]/20 group-hover:scale-110 transition-transform">
                          88%
                        </div>
                        <div>
                          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[#B6F500] mb-1">
                            Efisensi Kerja
                          </p>
                          <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                            Melampaui target harian.
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
/* Custom Scrollbar for Glassmorphism */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(182, 245, 0, 0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(182, 245, 0, 0.3);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

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
