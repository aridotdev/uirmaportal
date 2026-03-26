<script setup lang="ts">
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Loader2,
  Mail,
  Shield,
  User2,
  X,
  XCircle
} from 'lucide-vue-next'
import { MOCK_AUTH_USERS } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard'
})

interface UserDetail {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGEMENT' | 'QRCC' | 'CS'
  branch: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const toast = useToast()
const isResettingPassword = ref(false)
const isResetPasswordModalOpen = ref(false)

const roleStyles: Record<UserDetail['role'], string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  MANAGEMENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  QRCC: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  CS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

const userId = computed(() => String(route.params.id || '').toUpperCase())

const user = computed<UserDetail | null>(() => {
  const raw = MOCK_AUTH_USERS.find(item => item.id === userId.value)
  if (!raw) {
    return null
  }

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role ?? 'CS',
    branch: raw.branch ?? '-',
    isActive: raw.isActive,
    emailVerified: raw.emailVerified,
    createdAt: new Date(raw.createdAt).toISOString(),
    updatedAt: new Date(raw.updatedAt).toISOString()
  }
})

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

const resetPasswordToDefault = async () => {
  if (!user.value || isResettingPassword.value) {
    return
  }

  isResettingPassword.value = true

  await new Promise(resolve => setTimeout(resolve, 700))

  toast.add({
    title: 'Admin reset password',
    description: `Password ${user.value.name} direset admin ke default: sharp1234`,
    color: 'success'
  })

  isResetPasswordModalOpen.value = false
  isResettingPassword.value = false
}

const openResetPasswordModal = () => {
  if (!user.value || isResettingPassword.value) {
    return
  }

  isResetPasswordModalOpen.value = true
}
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-4xl space-y-8">
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
              Account <span class="text-[#B6F500]">Detail</span>
            </h1>
            <p class="mt-2 text-sm font-medium text-white/40">
              Informasi akun user berdasarkan data autentikasi sistem.
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
              <button
                type="button"
                :disabled="isResettingPassword"
                class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300 transition-all hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                @click="openResetPasswordModal"
              >
                <Loader2
                  v-if="isResettingPassword"
                  :size="12"
                  class="animate-spin"
                />
                <KeyRound
                  v-else
                  :size="12"
                />
                {{ isResettingPassword ? 'Resetting...' : 'Admin Reset Password' }}
              </button>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[11px] font-semibold text-amber-300">
            Aksi admin: reset password user ke default <span class="font-mono">sharp1234</span>. User wajib ganti password setelah login.
          </div>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              Updated At
            </p>
            <p class="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <Clock3
                :size="14"
                class="text-white/35"
              />
              {{ formatDateTime(user.updatedAt) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Created At
            </p>
            <p class="mt-3 flex items-center gap-2 text-sm font-semibold text-white/80">
              <CalendarDays
                :size="14"
                class="text-white/35"
              />
              {{ formatDate(user.createdAt) }}
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
              Email Verified
            </p>
            <p class="mt-3 text-sm font-semibold text-white/80">
              {{ user.emailVerified ? 'Yes' : 'No' }}
            </p>
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

      <UModal
        v-model:open="isResetPasswordModalOpen"
        :ui="{ content: 'bg-transparent shadow-none border-none ring-0 overflow-visible', overlay: 'bg-black/55 backdrop-blur-md' }"
        :dismissible="!isResettingPassword"
      >
        <template #content>
          <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a] p-10 shadow-2xl">
            <button
              type="button"
              :disabled="isResettingPassword"
              class="group absolute top-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/20 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              @click="isResetPasswordModalOpen = false"
            >
              <X
                :size="18"
                class="transition-transform group-hover:rotate-90"
              />
            </button>

            <div class="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />

            <div class="relative z-10">
              <div class="mb-8 flex items-center gap-5">
                <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                  <KeyRound :size="30" />
                </div>
                <div>
                  <h3 class="text-3xl leading-none font-black tracking-tighter uppercase italic">
                    Reset Password
                  </h3>
                  <p class="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    Konfirmasi Aksi Admin
                  </p>
                </div>
              </div>

              <div class="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-300">
                Password untuk <span class="text-white">{{ user?.name }}</span> akan direset ke default <span class="font-mono">sharp1234</span>.
              </div>
              <p class="mt-3 text-xs font-semibold text-white/55">
                User wajib mengganti password setelah login pertama.
              </p>

              <div class="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  :disabled="isResettingPassword"
                  class="h-14 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-black uppercase tracking-[0.2em] text-white/40 transition-all hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  @click="isResetPasswordModalOpen = false"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  :disabled="isResettingPassword"
                  class="h-14 flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 text-xs font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-amber-400/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  @click="resetPasswordToDefault"
                >
                  <Loader2
                    v-if="isResettingPassword"
                    :size="16"
                    class="animate-spin"
                  />
                  <KeyRound
                    v-else
                    :size="16"
                  />
                  {{ isResettingPassword ? 'Resetting...' : 'Reset Password' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>
