<script setup lang="ts">
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Settings,
  LogOut,
  Search,
  Bell,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
  ArrowRight
} from 'lucide-vue-next'

type Page = 'login' | 'cs' | 'dashboard'
type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'NEED_REVISION' | 'APPROVED' | 'REJECTED'

type ClaimItem = {
  id: string
  user: string
  prod: string
  status: ClaimStatus
  date: string
}

const currentPage = ref<Page>('login')

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

const navigateTo = (page: Page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <!-- 1. LOGIN PAGE -->
    <div
      v-if="currentPage === 'login'"
      class="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
    >
      <!-- Background Glow Orbs -->
      <div class="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#B6F500]/10 blur-[120px] rounded-full animate-pulse" />
      <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />

      <div class="w-full max-w-md p-10 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] shadow-2xl relative z-10">
        <div class="flex flex-col items-center mb-10">
          <div class="w-16 h-16 bg-[#B6F500] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(182,245,0,0.4)]">
            <Package
              :size="32"
              class="text-black"
            />
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight">
            RMA <span class="text-[#B6F500]">SYSTEM</span>
          </h1>
          <p class="text-white/40 mt-2 font-medium">
            Portal Operasional Internal
          </p>
        </div>

        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Username</label>
            <input
              type="text"
              placeholder="zaina.riddle@company.com"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#B6F500]/50 focus:ring-4 focus:ring-[#B6F500]/5 transition-all"
            >
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#B6F500]/50 focus:ring-4 focus:ring-[#B6F500]/5 transition-all"
            >
          </div>
          <div class="flex items-center justify-between text-xs text-white/40">
            <label class="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                class="rounded border-white/10 bg-white/5 accent-[#B6F500]"
              > Ingat Sesi
            </label>
            <a
              href="#"
              class="hover:text-[#B6F500] transition-colors"
            >Lupa Password?</a>
          </div>
          <button
            class="w-full bg-[#B6F500] text-black py-4 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(182,245,0,0.3)] hover:shadow-[0_15px_40px_rgba(182,245,0,0.4)] hover:-translate-y-0.5 transition-all"
            @click="navigateTo('cs')"
          >
            MASUK SEKARANG
          </button>
        </div>

        <p class="mt-10 text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
          Build version 4.0.1-stable
        </p>
      </div>
    </div>

    <!-- 2. MAIN APP SHELL (CS & DASHBOARD) -->
    <div
      v-else
      class="flex min-h-screen"
    >
      <!-- SIDEBAR -->
      <aside class="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-8 sticky top-0 h-screen">
        <div class="flex items-center gap-3 px-2 mb-12">
          <div class="w-10 h-10 bg-[#B6F500] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(182,245,0,0.3)]">
            <Package
              :size="20"
              class="text-black"
            />
          </div>
          <span class="text-xl font-black tracking-tighter italic">HOURGLASS</span>
        </div>

        <nav class="flex-1 space-y-2">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">
            Workspace
          </p>

          <button
            :class="[
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm',
              currentPage === 'dashboard' ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]' : 'text-white/40 hover:text-white hover:bg-white/5'
            ]"
            @click="navigateTo('dashboard')"
          >
            <LayoutDashboard :size="20" /> Dashboard
          </button>

          <button
            :class="[
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm',
              currentPage === 'cs' ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]' : 'text-white/40 hover:text-white hover:bg-white/5'
            ]"
            @click="navigateTo('cs')"
          >
            <ClipboardList :size="20" /> Claim Operations
          </button>

          <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
            <PlusCircle :size="20" /> Create New
          </button>

          <div class="pt-10">
            <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">
              System
            </p>
            <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
              <Users :size="20" /> Vendors
            </button>
            <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
              <Settings :size="20" /> Settings
            </button>
          </div>
        </nav>

        <!-- User Profile Card -->
        <div class="p-5 rounded-[24px] bg-white/5 border border-white/10 mt-auto">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full border-2 border-[#B6F500]/30 overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                alt="User"
              >
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black truncate">
                Zaina Riddle
              </p>
              <p class="text-[10px] text-white/40 uppercase tracking-widest">
                {{ currentPage === 'dashboard' ? 'Admin' : 'CS Agent' }}
              </p>
            </div>
          </div>
          <button
            class="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
            @click="navigateTo('login')"
          >
            <LogOut :size="14" /> Sign Out
          </button>
        </div>
      </aside>

      <!-- CONTENT AREA -->
      <main class="flex-1 flex flex-col">
        <!-- Topbar -->
        <header class="h-24 px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-[#050505]/80">
          <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 w-100 focus-within:border-[#B6F500]/50 transition-all">
            <Search
              :size="18"
              class="text-white/30"
            />
            <input
              type="text"
              placeholder="Cari Kode RMA atau SN..."
              class="bg-transparent border-none outline-none px-4 text-sm w-full placeholder:text-white/20 font-medium"
            >
          </div>

          <div class="flex items-center gap-8">
            <div class="relative group cursor-pointer">
              <Bell
                :size="22"
                class="text-white/40 group-hover:text-white transition-colors"
              />
              <div class="absolute top-0 right-0 w-2.5 h-2.5 bg-[#B6F500] rounded-full border-2 border-[#050505] shadow-[0_0_10px_#B6F500]" />
            </div>
            <div class="h-8 w-px bg-white/10" />
            <div class="text-right">
              <p class="text-xs font-black tracking-widest text-[#B6F500]">
                MON, 06 OCT
              </p>
              <p class="text-[10px] text-white/30 font-bold">
                14:45 PM SERVER TIME
              </p>
            </div>
          </div>
        </header>

        <div class="flex-1 p-12 overflow-y-auto">
          <!-- PAGE: DASHBOARD ADMIN -->
          <div
            v-if="currentPage === 'dashboard'"
            class="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700"
          >
            <div class="flex justify-between items-end">
              <div>
                <h2 class="text-5xl font-black tracking-tighter uppercase italic">
                  System <span class="text-[#B6F500]">Overview</span>
                </h2>
                <p class="text-white/40 mt-2 font-medium">
                  Monitoring performa operasional dan klaim vendor.
                </p>
              </div>
              <div class="flex gap-3">
                <button class="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                  <FileText :size="16" /> Report
                </button>
                <button class="px-6 py-3 bg-[#B6F500] text-black rounded-2xl text-sm font-black shadow-lg shadow-[#B6F500]/20 flex items-center gap-2">
                  <PlusCircle :size="16" /> New Vendor
                </button>
              </div>
            </div>

            <!-- KPI Grid -->
            <div class="grid grid-cols-4 gap-6">
              <div
                v-for="(kpi, i) in [
                  { label: 'Total Claims', value: '1,298', trend: '+12%', icon: ClipboardList, color: '#B6F500' },
                  { label: 'In Review', value: '176', trend: '+5 today', icon: Clock, color: '#3b82f6' },
                  { label: 'Approved Rate', value: '95%', trend: '+2%', icon: CheckCircle2, color: '#10b981' },
                  { label: 'Revisions', value: '24', trend: '-3%', icon: AlertCircle, color: '#f59e0b' }
                ]"
                :key="i"
                class="p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-4xl group hover:bg-white/10 transition-all cursor-pointer"
              >
                <div class="flex justify-between items-start mb-6">
                  <div class="p-4 rounded-2xl bg-white/5 group-hover:bg-[#B6F500] group-hover:text-black transition-all">
                    <component
                      :is="kpi.icon"
                      :size="24"
                      :class="i === 0 ? 'text-[#B6F500]' : 'text-white/40'"
                      class="group-hover:text-inherit"
                    />
                  </div>
                  <span class="text-[10px] font-black px-2.5 py-1 rounded-lg bg-[#B6F500]/10 text-[#B6F500] uppercase">{{ kpi.trend }}</span>
                </div>
                <p class="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-1">
                  {{ kpi.label }}
                </p>
                <h4 class="text-4xl font-black tracking-tight">
                  {{ kpi.value }}
                </h4>
              </div>
            </div>

            <!-- Main Dashboard Content -->
            <div class="grid grid-cols-12 gap-8">
              <div class="col-span-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] p-10">
                <div class="flex justify-between items-center mb-12">
                  <h3 class="text-xl font-black italic tracking-tight">
                    KLAIM AKTIVITAS MINGGUAN
                  </h3>
                  <div class="flex gap-2">
                    <div
                      v-for="tag in ['Daily', 'Weekly']"
                      :key="tag"
                      :class="['px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all', tag === 'Weekly' ? 'bg-[#B6F500] text-black' : 'bg-white/5 text-white/30 hover:text-white']"
                    >
                      {{ tag }}
                    </div>
                  </div>
                </div>

                <!-- Chart Simulator -->
                <div class="h-64 flex items-end justify-between gap-6 px-4">
                  <div
                    v-for="(h, idx) in [40, 65, 30, 95, 75, 50, 85]"
                    :key="idx"
                    class="flex-1 flex flex-col items-center group"
                  >
                    <div
                      class="w-full rounded-t-2xl transition-all duration-700 relative"
                      :class="idx === 3 ? 'bg-[#B6F500] shadow-[0_0_30px_rgba(182,245,0,0.3)]' : 'bg-white/5 group-hover:bg-white/10'"
                      :style="{ height: `${h}%` }"
                    >
                      <div
                        v-if="idx === 3"
                        class="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded shadow-xl whitespace-nowrap"
                      >
                        90 CLAIMS
                      </div>
                    </div>
                    <span class="mt-4 text-[10px] font-black text-white/20 uppercase">{{ ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][idx] }}</span>
                  </div>
                </div>
              </div>

              <div class="col-span-4 space-y-6">
                <div class="bg-linear-to-br from-[#B6F500] to-[#8ac500] p-8 rounded-[40px] text-black flex flex-col justify-between h-56 relative overflow-hidden group cursor-pointer shadow-xl shadow-[#B6F500]/10">
                  <div class="relative z-10">
                    <span class="text-[10px] font-black uppercase tracking-widest opacity-60">Vendor Alert</span>
                    <h4 class="text-2xl font-black leading-tight mt-2 italic">
                      MTC Distribution butuh tindakan segera.
                    </h4>
                  </div>
                  <button class="relative z-10 w-fit px-5 py-2.5 bg-black text-white text-xs font-black rounded-xl hover:scale-105 transition-transform flex items-center gap-2 uppercase tracking-widest">
                    Lihat Isu <ArrowRight :size="14" />
                  </button>
                  <Package
                    :size="140"
                    class="absolute -bottom-8 -right-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700"
                  />
                </div>

                <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] p-8">
                  <h3 class="font-black text-sm uppercase tracking-widest text-[#B6F500] mb-6 flex items-center gap-2">
                    <TrendingUp :size="16" /> Top Performance
                  </h3>
                  <div class="space-y-6">
                    <div
                      v-for="(v, i) in [
                        { name: 'MOKA Electrics', claims: 428, color: '#B6F500', p: '80%' },
                        { name: 'MTC Dist.', claims: 312, color: '#3b82f6', p: '60%' },
                        { name: 'SDP Tech', claims: 156, color: '#f59e0b', p: '40%' }
                      ]"
                      :key="i"
                      class="space-y-2"
                    >
                      <div class="flex justify-between text-xs">
                        <span class="font-black text-white/80 italic">{{ v.name }}</span>
                        <span class="text-white/40 font-bold">{{ v.claims }} Claims</span>
                      </div>
                      <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full"
                          :style="{ width: v.p, backgroundColor: v.color }"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Table Section -->
            <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] overflow-hidden">
              <div class="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
                <h3 class="text-xl font-black italic tracking-tight uppercase">
                  Recent <span class="text-white/30">Activity</span>
                </h3>
                <button class="text-xs font-black text-[#B6F500] uppercase tracking-widest hover:underline">
                  View All Records
                </button>
              </div>
              <table class="w-full text-left">
                <thead class="bg-white/5">
                  <tr>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      ID Claim
                    </th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Agent
                    </th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Product Model
                    </th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Status
                    </th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr
                    v-for="(row, i) in claimsData"
                    :key="i"
                    class="hover:bg-white/5 transition-colors group"
                  >
                    <td class="px-8 py-5 font-black text-[#B6F500] italic">
                      {{ row.id }}
                    </td>
                    <td class="px-8 py-5">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-black">
                          {{ row.user.charAt(0) }}
                        </div>
                        <span class="font-bold text-sm">{{ row.user }}</span>
                      </div>
                    </td>
                    <td class="px-8 py-5 text-sm font-medium text-white/60">
                      {{ row.prod }}
                    </td>
                    <td class="px-8 py-5">
                      <span :class="['px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest', statusConfigs[row.status]]">
                        {{ row.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="px-8 py-5">
                      <button class="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#B6F500] hover:border-[#B6F500]/30 transition-all">
                        <FileText :size="18" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- PAGE: CS PORTAL -->
          <div
            v-if="currentPage === 'cs'"
            class="space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700"
          >
            <!-- Hero Search -->
            <section class="relative rounded-[50px] p-20 overflow-hidden border border-[#B6F500]/20 bg-linear-to-br from-[#B6F500]/5 via-[#0a0a0a] to-[#0a0a0a]">
              <div class="absolute -top-24 -right-24 w-96 h-96 bg-[#B6F500]/10 blur-[120px] rounded-full" />

              <div class="max-w-3xl relative z-10">
                <span class="px-4 py-1.5 rounded-full bg-[#B6F500]/10 text-[#B6F500] text-[10px] font-black uppercase tracking-[0.3em] mb-8 inline-block">Operation Mode: Create Claim</span>
                <h2 class="text-6xl font-black tracking-tighter uppercase italic leading-[0.9] mb-6">
                  Mulai <span class="text-[#B6F500]">Klaim RMA</span> Secara Instan.
                </h2>
                <p class="text-lg text-white/40 font-medium mb-12 leading-relaxed">
                  Gunakan kode notifikasi POS untuk pengambilan data inventaris otomatis dan sinkronisasi status vendor.
                </p>

                <div class="flex gap-4">
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
                    Hubungi Admin jika serial number tidak terdaftar di database pusat.
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
      </main>
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
