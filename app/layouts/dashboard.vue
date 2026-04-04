<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, reactive } from 'vue'
import {
  Bell,
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Settings,
  Users,
  ChevronDown,
  FileBox,
  AlertCircle,
  X
} from 'lucide-vue-next'

const route = useRoute()
const isMobileMenuOpen = ref(false)

watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

const menuGroups = reactive([
  {
    category: 'Core',
    links: [
      { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Reports', icon: FileText, to: '/dashboard/reports' }
    ]
  },
  {
    category: 'Operations',
    links: [
      { label: 'Claims', icon: ClipboardList, to: '/dashboard/claims', badge: '42' },
      { label: 'Vendor Claims', icon: Package, to: '/dashboard/vendor-claims' },
      {
        label: 'Master Data',
        icon: Database,
        to: '/dashboard/master',
        isOpen: false,
        children: [
          { label: 'Vendor', icon: Users, to: '/dashboard/master/vendor' },
          { label: 'Product Model', icon: FileBox, to: '/dashboard/master/product-model' },
          { label: 'Notification Master', icon: Bell, to: '/dashboard/master/notification' },
          { label: 'Defect Master', icon: AlertCircle, to: '/dashboard/master/defect' }
        ]
      }
    ]
  },
  {
    category: 'Administration',
    links: [
      { label: 'User Management', icon: Users, to: '/dashboard/users' },
      { label: 'Audit Trail', icon: History, to: '/dashboard/audit-trail' },
      { label: 'Settings', icon: Settings, to: '/dashboard/settings' }
    ]
  }
])
const currentTime = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null
const topSearchInput = ref<HTMLInputElement | null>(null)

// Keyboard Shortcut: / or Ctrl+K to search
const handleGlobalKeydown = (e: KeyboardEvent) => {
  if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement?.tagName !== 'INPUT') {
    e.preventDefault()
    topSearchInput.value?.focus()
  }
}

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('keydown', handleGlobalKeydown)
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

function isActiveLink(to: string): boolean {
  if (!to) return false
  if (to === '/dashboard') return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-[#050505] font-sans text-white selection:bg-[#B6F500] selection:text-black">
    <!-- Mobile Menu Button -->
    <button
      class="fixed left-4 top-4 z-60 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] text-white/60 transition-all hover:text-white lg:hidden"
      @click="isMobileMenuOpen = !isMobileMenuOpen"
    >
      <X
        v-if="isMobileMenuOpen"
        :size="18"
      />
      <Menu
        v-else
        :size="18"
      />
    </button>

    <!-- Mobile Overlay -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
      @click="isMobileMenuOpen = false"
    />

    <div class="relative flex h-dvh w-full overflow-hidden">
      <div class="pointer-events-none absolute left-[-10%] top-[-20%] h-[50%] w-[50%] rounded-full bg-[#B6F500]/5 blur-[150px]" />
      <div class="pointer-events-none absolute bottom-[-10%] right-[-5%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[150px]" />

      <aside
        :class="[
          'dashboard-scrollbar fixed inset-y-0 left-0 z-50 flex h-dvh w-[360px] shrink-0 flex-col overflow-y-auto border-r border-white/5 bg-[#0a0a0a]/80 p-6 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <div class="mb-8 flex items-center gap-3 px-2">
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

        <nav class="flex-1 space-y-4">
          <div
            v-for="group in menuGroups"
            :key="group.category"
          >
            <p class="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
              {{ group.category }}
            </p>

            <div class="space-y-1">
              <template
                v-for="link in group.links"
                :key="link.label"
              >
                <!-- Direct Link -->
                <NuxtLink
                  v-if="!link.children"
                  :to="link.to"
                  :class="[
                    'group relative flex w-full items-center gap-4 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300',
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

                <!-- Dropdown Menu -->
                <div
                  v-else
                  class="space-y-1"
                >
                  <button
                    class="group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 text-white/40 hover:bg-white/5 hover:text-white"
                    @click="link.isOpen = !link.isOpen"
                  >
                    <component
                      :is="link.icon"
                      :size="18"
                      class="group-hover:text-[#B6F500]"
                    />
                    <span class="flex-1 text-left">{{ link.label }}</span>
                    <ChevronDown
                      :size="16"
                      :class="['transition-transform duration-300', link.isOpen ? 'rotate-180 text-[#B6F500]' : '']"
                    />
                  </button>

                  <div
                    :class="[
                      'grid transition-all duration-300 ease-in-out',
                      link.isOpen || route.path.startsWith(link.to) ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                    ]"
                  >
                    <div class="overflow-hidden ml-4 space-y-1 border-l border-white/5 pl-4">
                      <NuxtLink
                        v-for="sublink in link.children"
                        :key="sublink.to"
                        :to="sublink.to"
                        :class="[
                          'flex items-center gap-3 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300',
                          isActiveLink(sublink.to) ? 'bg-white/10 text-white translate-x-1' : 'text-white/30 hover:bg-white/5 hover:text-white'
                        ]"
                      >
                        <component
                          :is="sublink.icon"
                          :size="14"
                          :class="isActiveLink(sublink.to) ? 'text-[#B6F500]' : ''"
                        />
                        {{ sublink.label }}
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </nav>

        <div class="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <div class="mb-4 flex items-center gap-3">
            <div class="h-10 w-10 overflow-hidden rounded-full border-2 border-[#B6F500]/30 bg-linear-to-tr from-gray-800 to-gray-900 shadow-inner">
              <img
                src="https://api.dicebear.com/9.x/avataaars/svg?seed=Admin"
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
          <NuxtLink
            to="/login"
            class="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 py-2.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-400/10"
          >
            <LogOut :size="14" /> Sign Out
          </NuxtLink>
        </div>
      </aside>

      <main class="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header class="sticky top-0 z-40 flex h-24 shrink-0 items-center justify-between border-b border-white/5 bg-[#050505]/80 px-6 backdrop-blur-md lg:px-12">
          <div class="flex w-full max-w-112.5 items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 transition-all focus-within:border-[#B6F500]/50 hover:border-[#B6F500] group">
            <Search
              :size="18"
              class="text-white/30 group-focus-within:text-[#B6F500]"
            />
            <input
              ref="topSearchInput"
              type="text"
              placeholder="Cari Klaim, User, atau Log Aktivitas... (Press / to search)"
              class="w-full border-none bg-transparent px-4 text-sm font-medium outline-none placeholder:text-white/20"
            >
            <kbd class="hidden rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-white/20 lg:block">⌘K</kbd>
          </div>

          <div class="ml-6 hidden items-center gap-8 lg:flex">
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
