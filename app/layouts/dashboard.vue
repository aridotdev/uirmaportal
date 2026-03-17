<script setup>
import {
  Bell,
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShieldCheck,
  Users
} from 'lucide-vue-next'

const route = useRoute()

const sidebarLinks = [
  { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Claims Review', icon: ClipboardList, to: '/dashboard/claims-review', badge: '42' },
  { label: 'Vendor Claims', icon: Package, to: '/dashboard/vendor-claims' },
  { label: 'Master Data', icon: Database, to: '/dashboard/master-data' },
  { label: 'Reports', icon: FileText, to: '/dashboard/reports' },
  { label: 'Audit Trail', icon: History, to: '/dashboard/audit-trail' },
  { label: 'User Management', icon: Users, to: '/dashboard/users' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' }
]

const isActiveLink = to => route.path === to
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-[#050505] font-sans text-white selection:bg-[#B6F500] selection:text-black">
    <div class="relative flex h-dvh w-full overflow-hidden">
      <div class="pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-[#B6F500]/5 blur-[150px]" />
      <div class="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[150px]" />

      <aside class="z-50 hidden h-dvh w-72 shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-[#0a0a0a]/80 p-8 backdrop-blur-xl lg:flex">
        <div class="mb-12 flex items-center gap-3 px-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6F500] shadow-[0_0_15px_rgba(182,245,0,0.3)]">
            <ShieldCheck
              :size="20"
              class="text-black"
            />
          </div>
          <div>
            <span class="block text-xl font-black leading-none tracking-tighter italic">RMA PRO</span>
            <span class="text-[8px] font-black uppercase tracking-[0.3em] text-[#B6F500]">Admin Portal</span>
          </div>
        </div>

        <nav class="flex-1 space-y-1">
          <p class="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            Operations
          </p>

          <NuxtLink
            v-for="link in sidebarLinks"
            :key="link.label"
            :to="link.to"
            :class="[
              'group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300',
              isActiveLink(link.to) ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]' : 'text-white/40 hover:bg-white/5 hover:text-white'
            ]"
          >
            <component
              :is="link.icon"
              :size="18"
              :class="isActiveLink(link.to) ? 'text-black' : 'group-hover:text-[#B6F500]'"
            />
            {{ link.label }}
            <span
              v-if="link.badge"
              class="ml-auto rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            >
              {{ link.badge }}
            </span>
          </NuxtLink>
        </nav>

        <div class="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-10 w-10 overflow-hidden rounded-full border-2 border-[#B6F500]/30 bg-linear-to-tr from-gray-800 to-gray-900 shadow-inner">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                alt="Admin"
              >
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-black">
                Zaina Riddle
              </p>
              <p class="text-[9px] font-black uppercase tracking-widest text-[#B6F500] italic">
                System Administrator
              </p>
            </div>
          </div>
          <button class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-400/10">
            <LogOut :size="14" /> Sign Out
          </button>
        </div>
      </aside>

      <main class="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header class="sticky top-0 z-40 flex h-24 shrink-0 items-center justify-between border-b border-white/5 bg-[#050505]/70 px-6 backdrop-blur-xl supports-backdrop-filter:bg-[#050505]/45 lg:px-12">
          <div class="flex w-full max-w-112.5 items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 transition-all focus-within:border-[#B6F500]/40 group">
            <Search
              :size="18"
              class="text-white/20 group-focus-within:text-[#B6F500]"
            />
            <input
              type="text"
              placeholder="Cari Klaim, User, atau Log Aktivitas..."
              class="w-full border-none bg-transparent px-4 text-sm font-medium outline-none placeholder:text-white/10"
            >
            <kbd class="hidden rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/20 lg:block">⌘K</kbd>
          </div>

          <div class="ml-6 hidden items-center gap-8 lg:flex">
            <div class="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
              <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400 italic">Server: Optimal</span>
            </div>

            <div class="group relative cursor-pointer">
              <Bell
                :size="22"
                class="text-white/30 transition-colors group-hover:text-white"
              />
              <div class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050505] bg-[#B6F500] shadow-[0_0_10px_#B6F500]" />
            </div>

            <div class="h-10 w-px bg-white/10" />

            <div class="text-right">
              <p class="text-xs font-black tracking-widest text-white/80">
                SUNDAY, 15 MAR
              </p>
              <p class="text-[10px] font-bold uppercase tracking-tighter text-white/30">
                Karawang, ID • 23:45
              </p>
            </div>
          </div>
        </header>

        <div class="dashboard-scrollbar flex-1 overflow-y-auto overscroll-contain">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.dashboard-scrollbar::-webkit-scrollbar {
  width: 16px;
  height: 10px;
}

.dashboard-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin-block: 10px;
}

.dashboard-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(182, 245, 0, 0.3), rgba(182, 245, 0, 0.14));
  border: 2px solid transparent;
  border-radius: 9999px;
  background-clip: padding-box;
  min-height: 48px;
}

.dashboard-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(182, 245, 0, 0.45), rgba(182, 245, 0, 0.22));
  background-clip: padding-box;
}

.dashboard-scrollbar::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
