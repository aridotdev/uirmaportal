<script setup lang="ts">
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Users
} from 'lucide-vue-next'

const route = useRoute()

const isDashboardPage = computed(() => route.path === '/cs')
const isMyReportsPage = computed(() => route.path.startsWith('/cs/claims'))
</script>

<template>
  <div class="flex h-screen bg-[#050505] text-white selection:bg-[#B6F500] selection:text-black">
    <aside class="hidden h-screen w-72 shrink-0 border-r border-white/5 bg-[#0a0a0a] p-8 lg:sticky lg:top-0 lg:flex lg:flex-col">
      <div class="mb-12 flex items-center gap-3 px-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B6F500] shadow-[0_0_15px_rgba(182,245,0,0.3)]">
          <svg
            width="34"
            height="32"
            viewBox="0 0 34 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
          >
            <path
              d="M25.8108 6.1863C26.6396 5.35742 27.9966 5.34999 28.7094 6.28054C30.7732 8.97476 32 12.3439 32 16C32 17.888 31.6724 19.6991 31.0715 21.3804C30.4545 23.1066 30.6507 25.1038 31.9469 26.4L33.3931 27.8462C34.1582 28.6113 34.1583 29.8517 33.3933 30.6169C32.6282 31.3824 31.3874 31.3825 30.6221 30.6172L27.317 27.3121C27.3156 27.3107 27.3134 27.3108 27.3125 27.3125C27.3116 27.3142 27.3094 27.3143 27.308 27.3129L25.81 25.8148C24.9808 24.9857 25.0001 23.6499 25.668 22.6862C26.9836 20.7882 27.7549 18.4844 27.7549 16C27.7549 13.516 26.9839 11.2126 25.6687 9.31476C25.0009 8.35108 24.9817 7.01535 25.8108 6.1863ZM16 0C17.9814 0 19.8786 0.360395 21.6297 1.01898C22.9864 1.52921 23.2039 3.25187 22.1788 4.27662C21.5116 4.94363 20.5019 5.09696 19.6038 4.80797C18.4682 4.44253 17.2572 4.24512 16 4.24512C9.50784 4.24512 4.24512 9.50784 4.24512 16C4.24512 22.4922 9.50784 27.7549 16 27.7549C17.2566 27.7549 18.4666 27.5569 19.6016 27.1914C20.4998 26.902 21.5097 27.0556 22.1769 27.7228C23.202 28.7479 22.9843 30.4708 21.6274 30.9811C19.8769 31.6395 17.9807 32 16 32C7.17794 32 0.0244211 24.86 0.000977863 16.0435C0.000977146 16.0432 0.000758446 16.043 0.000488923 16.043C0.000218898 16.043 0 16.0427 0 16.0425V8.21415C0 6.74321 1.19243 5.55078 2.66337 5.55078C3.43768 5.55078 4.16496 5.20486 4.71381 4.65867C7.60704 1.77944 11.5957 0 16 0Z"
              fill="#0a0a0a"
            />
            <circle
              cx="16"
              cy="16"
              r="8"
              fill="#0a0a0a"
            />
          </svg>
        </div>
        <span class="text-xl font-black tracking-tighter">RMA PORTAL</span>
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

    <main class="flex min-w-0 flex-1 flex-col overflow-y-auto scrollbar">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.scrollbar::-webkit-scrollbar {
  width: 16px;
  height: 10px;
}
.scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin-block: 10px;
}
.scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(182, 245, 0, 0.3), rgba(182, 245, 0, 0.14));
  border: 2px solid transparent;
  border-radius: 9999px;
  background-clip: padding-box;
  min-height: 48px;
}
.scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(182, 245, 0, 0.45), rgba(182, 245, 0, 0.22));
  background-clip: padding-box;
}
</style>
