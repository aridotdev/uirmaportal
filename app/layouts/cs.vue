<script setup lang="ts">
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Settings,
  Users
} from 'lucide-vue-next'

const route = useRoute()

const isDashboardPage = computed(() => route.path === '/cs')
const isMyReportsPage = computed(() => route.path.startsWith('/cs/claims'))
</script>

<template>
  <div class="flex min-h-screen bg-[#050505] text-white selection:bg-[#B6F500] selection:text-black">
    <aside class="hidden h-screen w-72 shrink-0 border-r border-white/5 bg-[#0a0a0a] p-8 lg:sticky lg:top-0 lg:flex lg:flex-col">
      <div class="mb-12 flex items-center gap-3 px-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6F500] shadow-[0_0_15px_rgba(182,245,0,0.3)]">
          <Package class="h-5 w-5 text-black" />
        </div>
        <span class="text-xl font-black italic tracking-tighter">HOURGLASS</span>
      </div>

      <nav class="flex-1 space-y-2">
        <p class="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          Workspace
        </p>

        <NuxtLink
          to="/cs"
          :class="[
            'flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all',
            isDashboardPage ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]' : 'text-white/40 hover:bg-white/5 hover:text-white'
          ]"
        >
          <LayoutDashboard class="h-5 w-5" /> Dashboard
        </NuxtLink>

        <NuxtLink
          to="/cs/claims"
          :class="[
            'flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all',
            isMyReportsPage ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]' : 'text-white/40 hover:bg-white/5 hover:text-white'
          ]"
        >
          <ClipboardList class="h-5 w-5" /> My Reports
        </NuxtLink>

        <button class="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold text-white/40 transition-all hover:bg-white/5 hover:text-white">
          <PlusCircle class="h-5 w-5" /> Create New
        </button>

        <div class="pt-10">
          <p class="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            System
          </p>
          <button class="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold text-white/40 transition-all hover:bg-white/5 hover:text-white">
            <Users class="h-5 w-5" /> Profile
          </button>
          <button class="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold text-white/40 transition-all hover:bg-white/5 hover:text-white">
            <Settings class="h-5 w-5" /> Security
          </button>
        </div>
      </nav>

      <div class="mt-auto rounded-[24px] border border-white/10 bg-white/5 p-5">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#B6F500]/30 bg-zinc-800">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
              alt="User"
            >
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black">
              Zaina Riddle
            </p>
            <p class="text-[10px] uppercase tracking-widest text-white/40">
              CS Agent
            </p>
          </div>
        </div>
        <NuxtLink
          to="/"
          class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-400/10"
        >
          <LogOut class="h-3.5 w-3.5" /> Sign Out
        </NuxtLink>
      </div>
    </aside>

    <main class="flex min-w-0 flex-1 flex-col min-h-screen">
      <slot />
    </main>
  </div>
</template>
