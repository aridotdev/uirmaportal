<script setup lang="ts">
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  Shield,
  User2,
  Users,
  XCircle
} from 'lucide-vue-next'
import type { UserListItem } from '~/utils/types'
import { MOCK_AUTH_USERS, mapAuthUserToUserListItem } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard'
})

interface UserActivity {
  id: string
  action: string
  detail: string
  at: string
  tone: 'success' | 'info' | 'warning'
}

const route = useRoute()

const users = computed<UserListItem[]>(() => MOCK_AUTH_USERS.map(mapAuthUserToUserListItem))

const roleStyles: Record<UserListItem['role'], string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  MANAGEMENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  QRCC: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  CS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

const userId = computed(() => String(route.params.id || '').toUpperCase())

const user = computed(() => users.value.find(item => item.id === userId.value) ?? null)

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const activities = computed<UserActivity[]>(() => {
  if (!user.value) {
    return []
  }

  return [
    {
      id: `${user.value.id}-01`,
      action: user.value.isActive ? 'Account Active' : 'Account Inactive',
      detail: user.value.isActive ? 'Akun sedang bisa mengakses sistem dashboard.' : 'Akun sedang dinonaktifkan oleh admin.',
      at: user.value.lastLoginAt ?? user.value.createdAt,
      tone: user.value.isActive ? 'success' : 'warning'
    },
    {
      id: `${user.value.id}-02`,
      action: 'Last Login',
      detail: user.value.lastLoginAt ? `Login terakhir dari cabang ${user.value.branch}.` : 'Belum ada aktivitas login tercatat.',
      at: user.value.lastLoginAt ?? user.value.createdAt,
      tone: 'info'
    },
    {
      id: `${user.value.id}-03`,
      action: 'Account Created',
      detail: `Akun dibuat untuk role ${user.value.role}.`,
      at: user.value.createdAt,
      tone: 'info'
    }
  ]
})

const activityToneStyles: Record<UserActivity['tone'], string> = {
  success: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  info: 'border-blue-500/20 bg-blue-500/5 text-blue-400',
  warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400'
}
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-6xl space-y-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex items-start gap-4">
          <NuxtLink
            to="/dashboard/users"
            class="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition-all hover:border-white/20 hover:text-white"
          >
            <ArrowLeft :size="18" />
          </NuxtLink>
          <div>
            <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
              User <span class="text-[#B6F500]">Detail</span>
            </h1>
            <p class="mt-2 text-sm font-medium text-white/40">
              Informasi akun pengguna sistem RMA Portal.
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="user"
        class="space-y-6"
      >
        <section class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.09),transparent_35%),rgba(255,255,255,0.03)] p-6">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-center gap-4">
              <div class="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-zinc-800">
                <img
                  :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`"
                  :alt="user.name"
                  class="h-full w-full object-cover"
                >
              </div>
              <div>
                <p class="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">
                  {{ user.id }}
                </p>
                <h2 class="text-2xl font-black tracking-tight italic text-white/90">
                  {{ user.name }}
                </h2>
                <p class="mt-1 text-sm font-semibold text-white/45">
                  {{ user.email }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span
                :class="['inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest', roleStyles[user.role]]"
              >
                <Shield :size="12" /> {{ user.role }}
              </span>
              <span
                :class="[
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest',
                  user.isActive
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                ]"
              >
                <component
                  :is="user.isActive ? CheckCircle2 : XCircle"
                  :size="12"
                />
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Email
            </p>
            <p class="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Mail
                :size="14"
                class="text-white/35"
              />
              {{ user.email }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Branch
            </p>
            <p class="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Building2
                :size="14"
                class="text-white/35"
              />
              {{ user.branch }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Last Login
            </p>
            <p class="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Clock3
                :size="14"
                class="text-white/35"
              />
              {{ formatDateTime(user.lastLoginAt) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Joined At
            </p>
            <p class="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <CalendarDays
                :size="14"
                class="text-white/35"
              />
              {{ formatDate(user.createdAt) }}
            </p>
          </div>
        </section>

        <section class="rounded-3xl border border-white/8 bg-white/3 p-6">
          <div class="mb-4 flex items-center gap-2">
            <Users
              :size="16"
              class="text-[#B6F500]"
            />
            <h3 class="text-sm font-black uppercase tracking-[0.2em] text-white/70">
              Recent Activity
            </h3>
          </div>

          <div class="space-y-3">
            <div
              v-for="item in activities"
              :key="item.id"
              class="rounded-2xl border p-4"
              :class="activityToneStyles[item.tone]"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs font-black uppercase tracking-[0.18em]">
                  {{ item.action }}
                </p>
                <p class="text-[11px] font-semibold opacity-80">
                  {{ formatDateTime(item.at) }}
                </p>
              </div>
              <p class="mt-2 text-sm font-semibold opacity-90">
                {{ item.detail }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else
        class="rounded-3xl border border-white/8 bg-white/[0.02] py-20"
      >
        <div class="flex flex-col items-center gap-4 text-center text-white/25">
          <User2
            :size="48"
            :stroke-width="1.5"
          />
          <p class="text-sm font-black uppercase tracking-[0.2em]">
            User tidak ditemukan
          </p>
          <NuxtLink
            to="/dashboard/users"
            class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:border-white/20 hover:text-white"
          >
            Kembali ke User List
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
