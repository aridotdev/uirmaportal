<script setup lang="ts">
import {
  AlertCircle,
  Loader2,
  Lock,
  Shield,
  User
} from 'lucide-vue-next'
import { MOCK_USER_PROFILE } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard', middleware: 'auth'
})

const route = useRoute()

const settingsTabs = [
  { id: 'general', label: 'General', icon: User, to: '/dashboard/settings' },
  { id: 'security', label: 'Security', icon: Shield, to: '/dashboard/settings/security' }
]

const activeTab = computed(() => {
  if (route.path === '/dashboard/settings/security') return 'security'
  return 'general'
})

const isLoadingProfile = ref(false)
const profileError = ref(false)
const sessionUser = ref({
  ...MOCK_USER_PROFILE,
  username: MOCK_USER_PROFILE.username || MOCK_USER_PROFILE.email.split('@')[0] || ''
})

const roleBadgeClass = computed(() => {
  const role = sessionUser.value.role
  const map: Record<string, string> = {
    ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
    MANAGEMENT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    QRCC: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    CS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
  return map[role] || 'bg-white/5 text-white/40 border-white/10'
})

const statusBadgeClass = computed(() => {
  return sessionUser.value.isActive
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-red-500/10 text-red-400 border-red-500/20'
})

function formatDateTimeDisplay(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
          Account <span class="text-[#B6F500]">Settings</span>
        </h1>
        <p class="mt-2 text-sm font-medium text-white/40">
          Kelola informasi akun dan preferensi Anda.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div class="lg:col-span-3">
          <div class="sticky top-32 space-y-1 rounded-3xl border border-white/5 bg-[#0a0a0a] p-4">
            <NuxtLink
              v-for="tab in settingsTabs"
              :key="tab.id"
              :to="tab.to"
              :class="[
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              ]"
            >
              <component
                :is="tab.icon"
                :size="18"
              />
              {{ tab.label }}
            </NuxtLink>
          </div>
        </div>

        <div class="space-y-8 lg:col-span-9">
          <div class="space-y-6">
            <div
              v-if="isLoadingProfile"
              class="flex flex-col items-center justify-center gap-4 rounded-4xl border border-white/5 bg-[#0a0a0a] p-12"
            >
              <Loader2
                :size="32"
                class="animate-spin text-white/20"
              />
              <p class="text-sm font-bold text-white/30">
                Memuat data profil...
              </p>
            </div>

            <div
              v-else-if="profileError"
              class="flex flex-col items-center justify-center gap-4 rounded-4xl border border-red-500/20 bg-[#0a0a0a] p-12"
            >
              <div class="rounded-2xl bg-red-500/10 p-3">
                <AlertCircle
                  :size="28"
                  class="text-red-400"
                />
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-red-400">
                  Gagal memuat data profil.
                </p>
                <p class="mt-1 text-xs text-white/30">
                  Silakan coba muat ulang halaman.
                </p>
              </div>
            </div>

            <div
              v-else
              class="space-y-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8"
            >
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="rounded-lg bg-white/5 p-2">
                  <User class="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <h3 class="text-lg font-black uppercase tracking-tight">
                    Account Information
                  </h3>
                  <p class="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Data akun yang sedang login
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div class="shrink-0">
                  <div class="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <img
                      :src="sessionUser.avatarUrl"
                      :alt="sessionUser.name"
                      class="h-full w-full object-cover"
                    >
                  </div>
                </div>
                <div>
                  <h4 class="text-xl font-black tracking-tight">
                    {{ sessionUser.name }}
                  </h4>
                  <p class="mt-0.5 text-sm font-medium text-white/40">
                    @{{ sessionUser.username }}
                  </p>
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <span :class="['inline-flex items-center rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest', roleBadgeClass]">
                      {{ sessionUser.role }}
                    </span>
                    <span :class="['inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest', statusBadgeClass]">
                      <span
                        class="h-1.5 w-1.5 rounded-full"
                        :class="sessionUser.isActive ? 'bg-emerald-400' : 'bg-red-400'"
                      />
                      {{ sessionUser.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">Full Name</label>
                  <div class="w-full rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm font-bold text-white/50">
                    {{ sessionUser.name }}
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">Username</label>
                  <div class="w-full rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm font-bold text-white/50">
                    {{ sessionUser.username }}
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">Email</label>
                  <div class="w-full rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm font-bold text-white/50">
                    {{ sessionUser.email }}
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">Role</label>
                  <div class="w-full rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm font-bold text-white/50">
                    {{ sessionUser.role }}
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">Branch</label>
                  <div class="w-full rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm font-bold text-white/50">
                    {{ sessionUser.branch || '-' }}
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">Last Login</label>
                  <div class="w-full rounded-xl border border-white/8 bg-white/3 px-5 py-3 text-sm font-bold text-white/50">
                    {{ formatDateTimeDisplay(sessionUser.lastLoginAt) }}
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/2 px-5 py-4">
                <Lock
                  :size="16"
                  class="mt-0.5 shrink-0 text-white/20"
                />
                <p class="text-xs font-medium leading-relaxed text-white/30">
                  Data akun inti dikelola oleh admin. Jika ada perubahan yang diperlukan, silakan hubungi administrator sistem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
