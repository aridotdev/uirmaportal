<script setup>
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  TrendingUp,
  Users
} from 'lucide-vue-next'

const kpiData = [
  { label: 'Total RMA Claims', value: '1,842', trend: '+14%', icon: ClipboardList, color: '#B6F500' },
  { label: 'Pending QRCC Review', value: '42', trend: '-8%', icon: Clock, color: '#3b82f6' },
  { label: 'System Approval Rate', value: '92.4%', trend: '+1.2%', icon: CheckCircle2, color: '#10b981' },
  { label: 'Active Users', value: '128', trend: '+4', icon: Users, color: '#f59e0b' }
]

const recentClaims = [
  { claimNumber: 'CL-20260311-0012', name: 'SDSS-KRW', branch: 'Karawang', model: '4T-C43HJ6000I', status: 'IN_REVIEW', time: '2 mins ago' },
  { claimNumber: 'CL-20260301-0011', name: 'SDSS-BKS', branch: 'Bekasi', model: '4T-C50HJ6000I', status: 'APPROVED', time: '15 mins ago' },
  { claimNumber: 'CL-20260228-0010', name: 'BRC-SBY', branch: 'Surabaya', model: '4T-C65HJ6500I', status: 'NEED_REVISION', time: '1 hour ago' },
  { claimNumber: 'CL-20260215-0009', name: 'BRC-BDG', branch: 'Bandung', model: '4T-C50HL6500I', status: 'SUBMITTED', time: '3 hours ago' }
]

const topCS = [
  { name: 'BRC-CRB', claims: 42, p: '88%', color: '#B6F500' },
  { name: 'BRC-PWK', claims: 38, p: '75%', color: '#3b82f6' },
  { name: 'SDSS-KRW', claims: 24, p: '45%', color: '#f59e0b' }
]

const statusConfigs = {
  SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_REVIEW: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  NEED_REVISION: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  APPROVED: 'bg-[#B6F500]/20 text-[#B6F500] border-[#B6F500]/30'
}
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="space-y-8 lg:space-y-10 xl:space-y-12">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
            Admin <span class="text-[#B6F500]">Console</span>
          </h2>
          <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
            Selamat datang kembali. Sistem mendeteksi 12 klaim baru butuh verifikasi QRCC.
          </p>
        </div>
        <div class="flex flex-wrap gap-3 sm:gap-4 xl:justify-end">
          <button class="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest italic transition-all hover:bg-white/10 sm:px-6 sm:py-4">
            <Activity :size="16" /> Audit Logs
          </button>
          <button class="rounded-2xl bg-[#B6F500] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-black italic shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95 sm:px-8 sm:py-4">
            Generate Report
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
        <div
          v-for="(kpi, i) in kpiData"
          :key="i"
          class="group relative cursor-pointer overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all hover:border-[#B6F500]/30 hover:bg-white/10 2xl:rounded-[40px] 2xl:p-8"
        >
          <div class="absolute right-0 top-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
            <component
              :is="kpi.icon"
              :size="80"
            />
          </div>
          <div class="relative z-10 mb-6 flex items-start justify-between 2xl:mb-8">
            <div class="rounded-2xl bg-white/5 p-3.5 transition-all group-hover:bg-[#B6F500] group-hover:text-black 2xl:p-4">
              <component
                :is="kpi.icon"
                :size="24"
                class="text-white/40 group-hover:text-black"
              />
            </div>
            <span
              :class="[
                'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest italic',
                kpi.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              ]"
            >{{ kpi.trend }}</span>
          </div>
          <p class="relative z-10 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            {{ kpi.label }}
          </p>
          <h4 class="relative z-10 text-3xl font-black tracking-tighter italic 2xl:text-4xl">
            {{ kpi.value }}
          </h4>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-12 2xl:gap-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
        <div class="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl xl:col-span-8 2xl:rounded-[48px] 2xl:p-10">
          <div class="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between 2xl:mb-14">
            <div>
              <h3 class="text-xl font-black tracking-tight uppercase italic">
                Approval <span class="text-[#B6F500]">Velocity</span>
              </h3>
              <p class="mt-1 text-xs font-bold uppercase tracking-widest text-white/20 italic">
                Rata-rata waktu proses: 1.4 Hari
              </p>
            </div>
            <div class="flex gap-2 self-start">
              <div
                v-for="t in ['Daily', 'Weekly']"
                :key="t"
                :class="['cursor-pointer rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all', t === 'Weekly' ? 'bg-[#B6F500] text-black shadow-[0_0_15px_rgba(182,245,0,0.3)]' : 'bg-white/5 text-white/20 hover:text-white']"
              >
                {{ t }}
              </div>
            </div>
          </div>

          <div class="flex h-64 items-end justify-between gap-3 px-0 sm:gap-4 lg:px-4 2xl:gap-6">
            <div
              v-for="(h, idx) in [45, 75, 55, 95, 80, 60, 90]"
              :key="idx"
              class="group relative flex flex-1 flex-col items-center"
            >
              <div
                class="relative w-full rounded-t-2xl transition-all duration-1000"
                :class="idx === 3 ? 'bg-[#B6F500] shadow-[0_0_40px_rgba(182,245,0,0.4)]' : 'bg-white/5 group-hover:bg-white/10'"
                :style="{ height: `${h}%` }"
              >
                <div
                  v-if="idx === 3"
                  class="absolute left-1/2 -top-12 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter text-black italic shadow-2xl"
                >
                  Puncak Klaim
                </div>
              </div>
              <span class="mt-6 text-[10px] font-black uppercase tracking-tighter text-white/10 italic">{{ ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][idx] }}</span>
            </div>
          </div>

          <div class="pointer-events-none absolute inset-x-6 bottom-24 h-px bg-white/5 2xl:inset-x-10" />
          <div class="pointer-events-none absolute inset-x-6 bottom-44 h-px bg-white/5 2xl:inset-x-10" />
        </div>

        <div class="space-y-6 2xl:space-y-8 xl:col-span-4">
          <div class="group relative flex h-64 cursor-pointer flex-col justify-between overflow-hidden rounded-[36px] bg-linear-to-br from-[#B6F500] to-[#8ac500] p-6 text-black shadow-2xl shadow-[#B6F500]/10 2xl:rounded-[48px] 2xl:p-10">
            <div class="relative z-10">
              <div class="flex items-center gap-2 opacity-60">
                <TrendingUp :size="14" />
                <span class="text-[10px] font-black uppercase tracking-widest">Market Intel</span>
              </div>
              <h4 class="mt-3 text-3xl font-black leading-tight tracking-tighter italic">
                Vendor MTC butuh perhatian khusus.
              </h4>
              <p class="mt-2 text-xs font-bold opacity-60">
                Klaim 'Rejected' meningkat 24% minggu ini.
              </p>
            </div>
            <button class="relative z-10 flex w-fit items-center gap-2 rounded-2xl bg-black px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white italic transition-transform hover:scale-110">
              Analisis <ArrowUpRight :size="14" />
            </button>
            <Package
              :size="180"
              class="absolute -bottom-10 -right-10 rotate-12 opacity-10 transition-transform duration-1000 group-hover:rotate-0"
            />
          </div>

          <div class="h-fit space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl 2xl:space-y-8 2xl:rounded-[40px] 2xl:p-10">
            <h3 class="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#B6F500] italic">
              <Users :size="16" /> Top CS Performance
            </h3>
            <div class="space-y-6">
              <div
                v-for="(v, i) in topCS"
                :key="i"
                class="group flex items-center gap-4"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white/30 transition-colors group-hover:border-[#B6F500]/50">
                  0{{ i + 1 }}
                </div>
                <div class="flex-1 space-y-2">
                  <div class="flex justify-between text-[10px] font-black">
                    <span class="text-white/80 transition-colors group-hover:text-white italic">{{ v.name }}</span>
                    <span class="text-white/30">{{ v.claims }} Klaim</span>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      class="h-full rounded-full transition-all duration-1000"
                      :style="{ width: v.p, backgroundColor: v.color }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-[36px] border border-white/10 bg-white/5 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300 2xl:rounded-[48px]">
        <div class="flex flex-col gap-4 border-b border-white/5 bg-white/2 p-6 lg:flex-row lg:items-center lg:justify-between 2xl:p-10">
          <div>
            <h3 class="text-2xl font-black leading-none tracking-tighter uppercase italic">
              Global <span class="text-white/20">Claim Queue</span>
            </h3>
            <p class="mt-2 text-[10px] font-black uppercase tracking-widest text-white/20">
              Real-time status dari seluruh cabang
            </p>
          </div>
          <NuxtLink
            to="/dashboard/claims-review"
            class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B6F500] italic hover:underline"
          >
            Lihat Seluruh Database <ArrowRight :size="14" />
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-240 text-left">
            <thead class="bg-white/5">
              <tr>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 2xl:px-10">
                  Claim Number
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 2xl:px-10">
                  Branch
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 2xl:px-10">
                  Model Name
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 2xl:px-10">
                  Current State
                </th>
                <th class="px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/30 2xl:px-10">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr
                v-for="(row, i) in recentClaims"
                :key="i"
                class="group cursor-pointer transition-all duration-300 hover:bg-white/5"
              >
                <td class="px-6 py-7 2xl:px-10">
                  <div class="font-black tracking-tighter text-[#B6F500] italic">
                    {{ row.claimNumber }}
                  </div>
                  <div class="mt-1 font-mono text-[9px] uppercase text-white/20">
                    SN: 8829-Z-{{ 2024 + i }}
                  </div>
                </td>
                <td class="px-6 py-7 2xl:px-10">
                  <div class="flex items-center gap-3">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/20 transition-all group-hover:border-[#B6F500]/30 group-hover:text-[#B6F500]">
                      {{ row.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="text-sm font-bold text-white/80 transition-colors group-hover:text-white">
                        {{ row.name }}
                      </p>
                      <p class="text-[10px] font-black uppercase text-white/30">
                        {{ row.branch }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-7 2xl:px-10">
                  <p class="text-sm font-medium text-white/60 italic">
                    {{ row.model }}
                  </p>
                </td>
                <td class="px-6 py-7 2xl:px-10">
                  <span :class="['inline-block rounded-full border px-4 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-lg transition-all group-hover:scale-105 italic', statusConfigs[row.status]]">
                    {{ row.status.replace('_', ' ') }}
                  </span>
                </td>
                <td class="px-6 py-7 text-right 2xl:px-10">
                  <p class="text-xs font-black uppercase text-white/20 italic">
                    {{ row.time }}
                  </p>
                  <button class="mt-2 text-[9px] font-black uppercase tracking-widest text-[#B6F500] underline opacity-0 transition-all group-hover:opacity-100">
                    Review Now
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom-5 {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-in {
  animation-duration: 0.8s;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fade-in;
}

.slide-in-from-bottom-5 {
  animation-name: slide-in-from-bottom-5;
}

table {
  border-collapse: separate;
  border-spacing: 0;
}
</style>
