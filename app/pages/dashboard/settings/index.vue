<script setup lang="ts">
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Moon,
  Palette,
  Shield,
  Sun,
  User
} from 'lucide-vue-next'
import { MOCK_USER_PROFILE } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Navigation
// ──────────────────────────────────────────────

const settingSections = [
  { id: 'general', label: 'General', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette }
]

const activeSection = ref('general')

// ──────────────────────────────────────────────
// General — Read-only account info
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Security — Change Password
// ──────────────────────────────────────────────

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const isSubmittingPassword = ref(false)
const passwordSuccess = ref(false)
const passwordServerError = ref('')

const passwordValidation = computed(() => {
  const { currentPassword, newPassword, confirmPassword } = passwordForm.value
  const errors: Record<string, string> = {}

  if (!currentPassword) errors.currentPassword = 'Password saat ini wajib diisi'
  if (!newPassword) {
    errors.newPassword = 'Password baru wajib diisi'
  } else if (newPassword.length < 8) {
    errors.newPassword = 'Password baru minimal 8 karakter'
  } else if (newPassword === currentPassword) {
    errors.newPassword = 'Password baru tidak boleh sama dengan password saat ini'
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Konfirmasi password wajib diisi'
  } else if (confirmPassword !== newPassword) {
    errors.confirmPassword = 'Konfirmasi password tidak cocok'
  }

  return errors
})

const isPasswordFormDirty = computed(() => {
  const { currentPassword, newPassword, confirmPassword } = passwordForm.value
  return currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0
})

const canSubmitPassword = computed(() => {
  return isPasswordFormDirty.value && Object.keys(passwordValidation.value).length === 0
})

const submitPassword = async () => {
  if (!canSubmitPassword.value) return

  isSubmittingPassword.value = true
  passwordServerError.value = ''
  passwordSuccess.value = false

  // Simulated API call
  await new Promise(r => setTimeout(r, 1200))

  isSubmittingPassword.value = false
  passwordSuccess.value = true
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  showCurrentPassword.value = false
  showNewPassword.value = false
  showConfirmPassword.value = false

  setTimeout(() => {
    passwordSuccess.value = false
  }, 4000)
}

// ──────────────────────────────────────────────
// Appearance — Accent Color + Dark Mode
// ──────────────────────────────────────────────

const colorMode = useColorMode()
const isDarkMode = computed({
  get: () => colorMode.preference === 'dark',
  set: (val: boolean) => {
    colorMode.preference = val ? 'dark' : 'light'
  }
})

const themeSettings = ref({
  accentColor: '#B6F500'
})

const accentPresets = [
  { color: '#B6F500', label: 'Lime' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#8b5cf6', label: 'Purple' },
  { color: '#f59e0b', label: 'Amber' },
  { color: '#ef4444', label: 'Red' },
  { color: '#06b6d4', label: 'Cyan' }
]
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
          Account <span class="text-[#B6F500]">Settings</span>
        </h1>
        <p class="mt-2 text-sm font-medium text-white/40">
          Kelola informasi akun dan preferensi Anda.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Sidebar Navigation -->
        <div class="lg:col-span-3">
          <div class="bg-[#0a0a0a] border border-white/5 rounded-3xl p-4 sticky top-32 space-y-1">
            <button
              v-for="section in settingSections"
              :key="section.id"
              :class="[
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                activeSection === section.id
                  ? 'bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              ]"
              @click="activeSection = section.id"
            >
              <component
                :is="section.icon"
                :size="18"
              />
              {{ section.label }}
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="lg:col-span-9 space-y-8">
          <!-- ═══════════════════════════════════════ -->
          <!-- GENERAL — Account Information           -->
          <!-- ═══════════════════════════════════════ -->
          <div
            v-if="activeSection === 'general'"
            class="space-y-6"
          >
            <!-- Loading State -->
            <div
              v-if="isLoadingProfile"
              class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-12 flex flex-col items-center justify-center gap-4"
            >
              <Loader2
                :size="32"
                class="animate-spin text-white/20"
              />
              <p class="text-sm font-bold text-white/30">
                Memuat data profil...
              </p>
            </div>

            <!-- Error State -->
            <div
              v-else-if="profileError"
              class="bg-[#0a0a0a] border border-red-500/20 rounded-4xl p-12 flex flex-col items-center justify-center gap-4"
            >
              <div class="bg-red-500/10 p-3 rounded-2xl">
                <AlertCircle
                  :size="28"
                  class="text-red-400"
                />
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-red-400">
                  Gagal memuat data profil.
                </p>
                <p class="text-xs text-white/30 mt-1">
                  Silakan coba muat ulang halaman.
                </p>
              </div>
            </div>

            <!-- Profile Card -->
            <div
              v-else
              class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8"
            >
              <!-- Card Header -->
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <User class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Account Information
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Data akun yang sedang login
                  </p>
                </div>
              </div>

              <!-- Avatar + Name -->
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
                  <p class="text-sm text-white/40 font-medium mt-0.5">
                    @{{ sessionUser.username }}
                  </p>
                  <div class="flex flex-wrap items-center gap-2 mt-3">
                    <span :class="['inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border', roleBadgeClass]">
                      {{ sessionUser.role }}
                    </span>
                    <span :class="['inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border', statusBadgeClass]">
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        :class="sessionUser.isActive ? 'bg-emerald-400' : 'bg-red-400'"
                      />
                      {{ sessionUser.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Account Fields -->
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

              <!-- Helper Text -->
              <div class="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/2 px-5 py-4">
                <Lock
                  :size="16"
                  class="shrink-0 mt-0.5 text-white/20"
                />
                <p class="text-xs text-white/30 font-medium leading-relaxed">
                  Data akun inti dikelola oleh admin. Jika ada perubahan yang diperlukan, silakan hubungi administrator sistem.
                </p>
              </div>
            </div>
          </div>

          <!-- ═══════════════════════════════════════ -->
          <!-- SECURITY — Change Password              -->
          <!-- ═══════════════════════════════════════ -->
          <div
            v-if="activeSection === 'security'"
            class="space-y-6"
          >
            <!-- Success Banner -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 -translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <div
                v-if="passwordSuccess"
                class="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4"
              >
                <Check
                  :size="18"
                  class="shrink-0 text-emerald-400"
                />
                <p class="text-sm text-emerald-300 font-bold">
                  Password berhasil diperbarui!
                </p>
              </div>
            </Transition>

            <!-- Server Error Banner -->
            <div
              v-if="passwordServerError"
              class="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-4"
            >
              <AlertCircle
                :size="18"
                class="shrink-0 text-red-400"
              />
              <p class="text-sm text-red-300 font-bold">
                {{ passwordServerError }}
              </p>
            </div>

            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
              <!-- Card Header -->
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <Shield class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Change Password
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Perbarui password akun Anda
                  </p>
                </div>
              </div>

              <div class="max-w-lg space-y-5">
                <!-- Current Password -->
                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Current Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      placeholder="Masukkan password saat ini"
                      class="w-full rounded-xl border bg-white/5 px-5 py-3 pr-12 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none transition-colors"
                      :class="[
                        isPasswordFormDirty && passwordValidation.currentPassword
                          ? 'border-red-500/40 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                    >
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <Eye
                        v-if="!showCurrentPassword"
                        :size="18"
                      />
                      <EyeOff
                        v-else
                        :size="18"
                      />
                    </button>
                  </div>
                  <p
                    v-if="isPasswordFormDirty && passwordValidation.currentPassword"
                    class="ml-1 text-[10px] font-bold text-red-400"
                  >
                    {{ passwordValidation.currentPassword }}
                  </p>
                </div>

                <!-- New Password -->
                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">
                    New Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      placeholder="Minimal 8 karakter"
                      class="w-full rounded-xl border bg-white/5 px-5 py-3 pr-12 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none transition-colors"
                      :class="[
                        isPasswordFormDirty && passwordValidation.newPassword
                          ? 'border-red-500/40 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                    >
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <Eye
                        v-if="!showNewPassword"
                        :size="18"
                      />
                      <EyeOff
                        v-else
                        :size="18"
                      />
                    </button>
                  </div>
                  <p
                    v-if="isPasswordFormDirty && passwordValidation.newPassword"
                    class="ml-1 text-[10px] font-bold text-red-400"
                  >
                    {{ passwordValidation.newPassword }}
                  </p>
                </div>

                <!-- Confirm Password -->
                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Confirm New Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="Ulangi password baru"
                      class="w-full rounded-xl border bg-white/5 px-5 py-3 pr-12 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none transition-colors"
                      :class="[
                        isPasswordFormDirty && passwordValidation.confirmPassword
                          ? 'border-red-500/40 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                    >
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <Eye
                        v-if="!showConfirmPassword"
                        :size="18"
                      />
                      <EyeOff
                        v-else
                        :size="18"
                      />
                    </button>
                  </div>
                  <p
                    v-if="isPasswordFormDirty && passwordValidation.confirmPassword"
                    class="ml-1 text-[10px] font-bold text-red-400"
                  >
                    {{ passwordValidation.confirmPassword }}
                  </p>
                </div>

                <!-- Submit Button -->
                <div class="pt-2">
                  <button
                    :disabled="!canSubmitPassword || isSubmittingPassword"
                    class="flex items-center gap-2 bg-[#B6F500] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_10px_30px_rgba(182,245,0,0.2)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    @click="submitPassword"
                  >
                    <Loader2
                      v-if="isSubmittingPassword"
                      :size="16"
                      class="animate-spin"
                    />
                    <Lock
                      v-else
                      :size="16"
                    />
                    {{ isSubmittingPassword ? 'Updating...' : 'Update Password' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ═══════════════════════════════════════ -->
          <!-- APPEARANCE — Theme & Visual             -->
          <!-- ═══════════════════════════════════════ -->
          <div
            v-if="activeSection === 'appearance'"
            class="space-y-6"
          >
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
              <!-- Card Header -->
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <Palette class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Appearance & Theme
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Sesuaikan tampilan visual aplikasi
                  </p>
                </div>
              </div>

              <!-- Dark Mode Toggle -->
              <div class="space-y-4">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Theme Mode
                </p>
                <div class="flex items-center justify-between rounded-2xl border border-white/8 bg-white/2 px-5 py-4">
                  <div class="flex items-center gap-4">
                    <div class="bg-white/5 p-2.5 rounded-xl">
                      <Moon
                        v-if="isDarkMode"
                        :size="20"
                        class="text-[#B6F500]"
                      />
                      <Sun
                        v-else
                        :size="20"
                        class="text-amber-400"
                      />
                    </div>
                    <div>
                      <p class="text-sm font-bold">
                        {{ isDarkMode ? 'Dark Mode' : 'Light Mode' }}
                      </p>
                      <p class="text-[10px] font-medium text-white/30 mt-0.5">
                        {{ isDarkMode ? 'Tampilan gelap untuk kenyamanan mata.' : 'Tampilan terang untuk kejelasan maksimal.' }}
                      </p>
                    </div>
                  </div>
                  <button
                    class="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-colors duration-200 focus:outline-none"
                    :class="isDarkMode ? 'bg-[#B6F500]' : 'bg-white/10'"
                    @click="isDarkMode = !isDarkMode"
                  >
                    <span
                      class="pointer-events-none inline-block h-5 w-5 rounded-full shadow-lg transition-transform duration-200"
                      :class="isDarkMode ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'"
                    />
                  </button>
                </div>
              </div>

              <!-- Accent Color Picker -->
              <div class="space-y-4">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Accent Color
                </p>
                <div class="flex flex-wrap gap-3">
                  <button
                    v-for="preset in accentPresets"
                    :key="preset.color"
                    class="group relative"
                    @click="themeSettings.accentColor = preset.color"
                  >
                    <div
                      :class="[
                        'w-12 h-12 rounded-2xl border-2 transition-all group-hover:scale-110',
                        themeSettings.accentColor === preset.color
                          ? 'border-white scale-110'
                          : 'border-transparent'
                      ]"
                      :style="{
                        backgroundColor: preset.color,
                        boxShadow: themeSettings.accentColor === preset.color
                          ? `0 0 20px ${preset.color}40`
                          : 'none'
                      }"
                    >
                      <div
                        v-if="themeSettings.accentColor === preset.color"
                        class="flex h-full w-full items-center justify-center"
                      >
                        <Check
                          :size="18"
                          class="text-black drop-shadow-sm"
                        />
                      </div>
                    </div>
                    <p class="mt-1.5 text-center text-[9px] font-bold uppercase tracking-wider text-white/30">
                      {{ preset.label }}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
