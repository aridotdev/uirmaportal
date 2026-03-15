<script setup>
import { ref, onMounted } from 'vue'
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
  ArrowRight,
  ShieldCheck,
  Database,
  History,
  Activity,
  ArrowUpRight
} from 'lucide-vue-next'

// --- State Management ---
const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 600)
})

// --- Mock Data untuk Admin ---
const kpiData = [
  { label: 'Total RMA Claims', value: '1,842', trend: '+14%', icon: ClipboardList, color: '#B6F500' },
  { label: 'Pending QRCC Review', value: '42', trend: '-8%', icon: Clock, color: '#3b82f6' },
  { label: 'System Approval Rate', value: '92.4%', trend: '+1.2%', icon: CheckCircle2, color: '#10b981' },
  { label: 'Active Users', value: '128', trend: '+4', icon: Users, color: '#f59e0b' }
]

const recentClaims = [
  { id: 'RMA-2026-0412', cs: 'Felix K.', branch: 'Jakarta', model: 'LG OLED 55" C3', status: 'IN_REVIEW', time: '2 mins ago' },
  { id: 'RMA-2026-0411', cs: 'Zaina R.', branch: 'Bekasi', model: 'Samsung S23 Ultra', status: 'APPROVED', time: '15 mins ago' },
  { id: 'RMA-2026-0410', cs: 'Budi A.', branch: 'Surabaya', model: 'Sony PS5 Slim', status: 'NEED_REVISION', time: '1 hour ago' },
  { id: 'RMA-2026-0409', cs: 'Siska W.', branch: 'Bandung', model: 'iPhone 15 Pro', status: 'SUBMITTED', time: '3 hours ago' },
]

const statusConfigs = {
  'SUBMITTED': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'IN_REVIEW': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'NEED_REVISION': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'APPROVED': 'bg-[#B6F500]/20 text-[#B6F500] border-[#B6F500]/30',
}

const sidebarLinks = [
  { label: 'Overview', icon: LayoutDashboard, active: true },
  { label: 'Claims Review', icon: ClipboardList, badge: '42' },
  { label: 'Vendor Claims', icon: Package },
  { label: 'Master Data', icon: Database },
  { label: 'Reports', icon: FileText },
  { label: 'Audit Trail', icon: History },
  { label: 'User Management', icon: Users },
  { label: 'Settings', icon: Settings },
]
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black flex justify-center overflow-x-hidden">
    
    <!-- Wrapper Utama 1440px -->
    <div class="w-full max-w-[1440px] flex border-x border-white/5 shadow-2xl shadow-black relative">
      
      <!-- BACKGROUND ORBS (Glassmorphism Decor) -->
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#B6F500]/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <!-- SIDEBAR -->
      <aside class="w-72 bg-[#0a0a0a]/80 backdrop-blur-xl border-r border-white/5 flex flex-col p-8 sticky top-0 h-screen z-50">
        <div class="flex items-center gap-3 px-2 mb-12">
          <div class="w-10 h-10 bg-[#B6F500] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(182,245,0,0.3)]">
            <ShieldCheck :size="20" class="text-black" />
          </div>
          <div>
            <span class="text-xl font-black tracking-tighter italic block leading-none">RMA PRO</span>
            <span class="text-[8px] uppercase tracking-[0.3em] text-[#B6F500] font-black">Admin Portal</span>
          </div>
        </div>

        <nav class="flex-1 space-y-1">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">Operations</p>
          
          <button 
            v-for="link in sidebarLinks" 
            :key="link.label"
            :class="[
              'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm relative group',
              link.active ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]' : 'text-white/40 hover:text-white hover:bg-white/5'
            ]"
          >
            <component :is="link.icon" :size="18" :class="link.active ? 'text-black' : 'group-hover:text-[#B6F500]'" />
            {{ link.label }}
            <span v-if="link.badge" class="ml-auto bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              {{ link.badge }}
            </span>
          </button>
        </nav>

        <!-- User Profile Card -->
        <div class="p-5 rounded-[28px] bg-white/5 border border-white/10 mt-10 backdrop-blur-md">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full border-2 border-[#B6F500]/30 bg-gradient-to-tr from-gray-800 to-gray-900 overflow-hidden shadow-inner">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black truncate">Zaina Riddle</p>
              <p class="text-[9px] text-[#B6F500] uppercase tracking-widest font-black italic">System Administrator</p>
            </div>
          </div>
          <button class="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
            <LogOut :size="14" /> Sign Out
          </button>
        </div>
      </aside>

      <!-- CONTENT AREA -->
      <main class="flex-1 flex flex-col relative z-10">
        <!-- Topbar -->
        <header class="h-24 px-12 flex items-center justify-between border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl sticky top-0 z-40">
          <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 w-[450px] focus-within:border-[#B6F500]/40 transition-all group">
            <Search :size="18" class="text-white/20 group-focus-within:text-[#B6F500]" />
            <input type="text" placeholder="Cari Klaim, User, atau Log Aktivitas..." class="bg-transparent border-none outline-none px-4 text-sm w-full placeholder:text-white/10 font-medium" />
            <kbd class="hidden lg:block px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/20 font-mono">⌘K</kbd>
          </div>

          <div class="flex items-center gap-8">
            <div class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]"></div>
              <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Server: Optimal</span>
            </div>
            
            <div class="relative group cursor-pointer">
              <Bell :size="22" class="text-white/30 group-hover:text-white transition-colors" />
              <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#B6F500] rounded-full border-2 border-[#050505] shadow-[0_0_10px_#B6F500]"></div>
            </div>
            
            <div class="h-10 w-px bg-white/10"></div>
            
            <div class="text-right">
              <p class="text-xs font-black tracking-widest text-white/80">SUNDAY, 15 MAR</p>
              <p class="text-[10px] text-white/30 font-bold uppercase tracking-tighter">Karawang, ID • 23:45</p>
            </div>
          </div>
        </header>

        <!-- DASHBOARD CONTENT -->
        <div class="flex-1 p-12 overflow-y-auto custom-scrollbar">
          
          <div class="max-w-[1200px] mx-auto space-y-12">
            
            <!-- Welcome Section -->
            <div class="flex justify-between items-end animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div>
                <h2 class="text-5xl font-black tracking-tighter uppercase italic leading-none">Admin <span class="text-[#B6F500]">Console</span></h2>
                <p class="text-white/30 mt-3 font-medium text-lg italic tracking-tight">Selamat datang kembali. Sistem mendeteksi 12 klaim baru butuh verifikasi QRCC.</p>
              </div>
              <div class="flex gap-4">
                <button class="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 italic">
                  <Activity :size="16" /> Audit Logs
                </button>
                <button class="px-8 py-4 bg-[#B6F500] text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#B6F500]/10 hover:scale-105 active:scale-95 transition-all italic">
                  Generate Report
                </button>
              </div>
            </div>

            <!-- KPI Cards Grid -->
            <div class="grid grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
              <div v-for="(kpi, i) in kpiData" :key="i" class="p-8 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] group hover:bg-white/10 hover:border-[#B6F500]/30 transition-all cursor-pointer relative overflow-hidden">
                <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                   <component :is="kpi.icon" :size="80" />
                </div>
                <div class="flex justify-between items-start mb-8 relative z-10">
                  <div class="p-4 rounded-2xl bg-white/5 group-hover:bg-[#B6F500] group-hover:text-black transition-all">
                    <component :is="kpi.icon" :size="24" :class="i === 0 ? 'text-[#B6F500]' : 'text-white/40 group-hover:text-black'" />
                  </div>
                  <span :class="[
                    'text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest italic',
                    kpi.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  ]">{{ kpi.trend }}</span>
                </div>
                <p class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1 relative z-10">{{ kpi.label }}</p>
                <h4 class="text-4xl font-black tracking-tighter italic relative z-10">{{ kpi.value }}</h4>
              </div>
            </div>

            <!-- Charts & Activity Row -->
            <div class="grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
              <!-- Weekly Trend Chart Simulation -->
              <div class="col-span-8 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[48px] p-10 relative overflow-hidden">
                <div class="flex justify-between items-center mb-14">
                  <div>
                    <h3 class="text-xl font-black italic tracking-tight uppercase">Approval <span class="text-[#B6F500]">Velocity</span></h3>
                    <p class="text-xs text-white/20 font-bold uppercase tracking-widest mt-1 italic">Rata-rata waktu proses: 1.4 Hari</p>
                  </div>
                  <div class="flex gap-2">
                    <div v-for="t in ['Daily', 'Weekly']" :key="t" :class="['px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all', t === 'Weekly' ? 'bg-[#B6F500] text-black shadow-[0_0_15px_rgba(182,245,0,0.3)]' : 'bg-white/5 text-white/20 hover:text-white']">
                      {{ t }}
                    </div>
                  </div>
                </div>
                
                <div class="h-64 flex items-end justify-between gap-6 px-4">
                  <div v-for="(h, idx) in [45, 75, 55, 95, 80, 60, 90]" :key="idx" class="flex-1 flex flex-col items-center group relative">
                    <div 
                      class="w-full rounded-t-2xl transition-all duration-1000 relative"
                      :class="idx === 3 ? 'bg-[#B6F500] shadow-[0_0_40px_rgba(182,245,0,0.4)]' : 'bg-white/5 group-hover:bg-white/10'"
                      :style="{ height: `${h}%` }"
                    >
                      <div v-if="idx === 3" class="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap uppercase italic tracking-tighter">Puncak Klaim</div>
                    </div>
                    <span class="mt-6 text-[10px] font-black text-white/10 uppercase italic tracking-tighter">{{ ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][idx] }}</span>
                  </div>
                </div>
                <!-- Abstract Grid Lines -->
                <div class="absolute inset-x-10 bottom-24 h-px bg-white/5 pointer-events-none"></div>
                <div class="absolute inset-x-10 bottom-44 h-px bg-white/5 pointer-events-none"></div>
              </div>

              <!-- Top Vendors Activity -->
              <div class="col-span-4 space-y-8">
                <div class="bg-gradient-to-br from-[#B6F500] to-[#8ac500] p-10 rounded-[48px] text-black flex flex-col justify-between h-64 relative overflow-hidden group cursor-pointer shadow-2xl shadow-[#B6F500]/10">
                  <div class="relative z-10">
                    <div class="flex items-center gap-2 opacity-60">
                      <TrendingUp :size="14" />
                      <span class="text-[10px] font-black uppercase tracking-widest">Market Intel</span>
                    </div>
                    <h4 class="text-3xl font-black leading-tight mt-3 italic tracking-tighter">Vendor MTC butuh perhatian khusus.</h4>
                    <p class="text-xs font-bold opacity-60 mt-2">Klaim 'Rejected' meningkat 24% minggu ini.</p>
                  </div>
                  <button class="relative z-10 w-fit px-6 py-3 bg-black text-white text-[10px] font-black rounded-2xl hover:scale-110 transition-transform uppercase tracking-widest italic flex items-center gap-2">
                    Analisis <ArrowUpRight :size="14" />
                  </button>
                  <Package :size="180" class="absolute -bottom-10 -right-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                </div>

                <div class="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] p-10 space-y-8 h-fit">
                  <h3 class="font-black text-[10px] uppercase tracking-[0.2em] text-[#B6F500] mb-6 flex items-center gap-3 italic">
                    <Users :size="16"/> Top CS Performance
                  </h3>
                  <div class="space-y-6">
                    <div v-for="(v, i) in [
                      { name: 'Felix Kurniawan', claims: 42, p: '88%', color: '#B6F500' },
                      { name: 'Zaina Riddle', claims: 38, p: '75%', color: '#3b82f6' },
                      { name: 'Budi Santoso', claims: 24, p: '45%', color: '#f59e0b' }
                    ]" :key="i" class="flex items-center gap-4 group">
                      <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-white/30 border border-white/10 group-hover:border-[#B6F500]/50 transition-colors">
                        0{{ i + 1 }}
                      </div>
                      <div class="flex-1 space-y-2">
                        <div class="flex justify-between text-[10px] font-black">
                          <span class="text-white/80 group-hover:text-white transition-colors italic">{{ v.name }}</span>
                          <span class="text-white/30">{{ v.claims }} Klaim</span>
                        </div>
                        <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-1000" :style="{ width: v.p, backgroundColor: v.color }"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TABLE: RECENT SYSTEM ACTIVITY -->
            <div class="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[48px] overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300">
              <div class="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 class="text-2xl font-black italic tracking-tighter uppercase leading-none">Global <span class="text-white/20">Claim Queue</span></h3>
                  <p class="text-[10px] text-white/20 font-black uppercase tracking-widest mt-2">Real-time status dari seluruh cabang</p>
                </div>
                <button class="text-[10px] font-black text-[#B6F500] uppercase tracking-widest hover:underline italic flex items-center gap-2">
                  Lihat Seluruh Database <ArrowRight :size="14" />
                </button>
              </div>
              <table class="w-full text-left">
                <thead class="bg-white/5">
                  <tr>
                    <th class="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">ID Claim / S/N</th>
                    <th class="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Branch & Agent</th>
                    <th class="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Model Detail</th>
                    <th class="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Current State</th>
                    <th class="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <tr v-for="(row, i) in recentClaims" :key="i" class="hover:bg-white/5 transition-all duration-300 group cursor-pointer">
                    <td class="px-10 py-7">
                      <div class="font-black text-[#B6F500] italic tracking-tighter">{{ row.id }}</div>
                      <div class="text-[9px] text-white/20 font-mono mt-1 uppercase">SN: 8829-Z-{{ 2024 + i }}</div>
                    </td>
                    <td class="px-10 py-7">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/20 group-hover:text-[#B6F500] group-hover:border-[#B6F500]/30 transition-all">
                          {{ row.cs.charAt(0) }}
                        </div>
                        <div>
                          <p class="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{{ row.cs }}</p>
                          <p class="text-[10px] text-white/30 uppercase font-black">{{ row.branch }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-10 py-7">
                      <p class="text-sm font-medium text-white/60 italic">{{ row.model }}</p>
                      <p class="text-[9px] text-white/20 uppercase font-black tracking-widest mt-1">Electronics • TV</p>
                    </td>
                    <td class="px-10 py-7">
                      <span :class="['px-4 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-lg italic transition-all group-hover:scale-105 inline-block', statusConfigs[row.status]]">
                        {{ row.status.replace('_', ' ') }}
                      </span>
                    </td>
                    <td class="px-10 py-7 text-right">
                      <p class="text-xs font-black text-white/20 uppercase italic">{{ row.time }}</p>
                      <button class="mt-2 text-[#B6F500] opacity-0 group-hover:opacity-100 transition-all text-[9px] font-black uppercase tracking-widest underline">
                        Review Now
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </main>
    </div>

  </div>
</template>

<style>
/* Nuxt 4 Specific Transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

/* Custom Scrollbar for Operations Density */
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

/* Nuxt/Tailwind Animations */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-from-bottom-5 { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.animate-in {
  animation-duration: 0.8s;
  animation-fill-mode: both;
}
.fade-in { animation-name: fade-in; }
.slide-in-from-bottom-5 { animation-name: slide-in-from-bottom-5; }

/* Font styling for high-density tables */
table {
  border-collapse: separate;
  border-spacing: 0;
}

input::placeholder {
  font-style: italic;
  letter-spacing: 0.05em;
}
</style>