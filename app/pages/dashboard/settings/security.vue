<script setup lang="ts">
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  User
} from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard'
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

  await new Promise(resolve => setTimeout(resolve, 1200))

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
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="-translate-y-2 opacity-0"
              enter-to-class="translate-y-0 opacity-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="translate-y-0 opacity-100"
              leave-to-class="-translate-y-2 opacity-0"
            >
              <div
                v-if="passwordSuccess"
                class="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4"
              >
                <Check
                  :size="18"
                  class="shrink-0 text-emerald-400"
                />
                <p class="text-sm font-bold text-emerald-300">
                  Password berhasil diperbarui!
                </p>
              </div>
            </Transition>

            <div
              v-if="passwordServerError"
              class="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-4"
            >
              <AlertCircle
                :size="18"
                class="shrink-0 text-red-400"
              />
              <p class="text-sm font-bold text-red-300">
                {{ passwordServerError }}
              </p>
            </div>

            <div class="space-y-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="rounded-lg bg-white/5 p-2">
                  <Shield class="h-5 w-5 text-white/60" />
                </div>
                <div>
                  <h3 class="text-lg font-black uppercase tracking-tight">
                    Change Password
                  </h3>
                  <p class="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Perbarui password akun Anda
                  </p>
                </div>
              </div>

              <div class="max-w-lg space-y-5">
                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Current Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      placeholder="Masukkan password saat ini"
                      class="w-full rounded-xl border bg-white/5 px-5 py-3 pr-12 text-sm font-bold text-white transition-colors placeholder:text-white/20 focus:outline-none"
                      :class="[
                        isPasswordFormDirty && passwordValidation.currentPassword
                          ? 'border-red-500/40 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                    >
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
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

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">
                    New Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      placeholder="Minimal 8 karakter"
                      class="w-full rounded-xl border bg-white/5 px-5 py-3 pr-12 text-sm font-bold text-white transition-colors placeholder:text-white/20 focus:outline-none"
                      :class="[
                        isPasswordFormDirty && passwordValidation.newPassword
                          ? 'border-red-500/40 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                    >
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
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

                <div class="space-y-2">
                  <label class="ml-1 text-[10px] font-black uppercase tracking-widest text-white/30">
                    Confirm New Password
                  </label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="Ulangi password baru"
                      class="w-full rounded-xl border bg-white/5 px-5 py-3 pr-12 text-sm font-bold text-white transition-colors placeholder:text-white/20 focus:outline-none"
                      :class="[
                        isPasswordFormDirty && passwordValidation.confirmPassword
                          ? 'border-red-500/40 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                    >
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
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

                <div class="pt-2">
                  <button
                    :disabled="!canSubmitPassword || isSubmittingPassword"
                    class="flex items-center gap-2 rounded-xl bg-[#B6F500] px-6 py-3 text-xs font-black uppercase tracking-widest text-black transition-all hover:shadow-[0_10px_30px_rgba(182,245,0,0.2)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
                    @click="submitPassword"
                  >
                    <Loader2
                      v-if="isSubmittingPassword"
                      :size="16"
                      class="animate-spin"
                    />
                    <Shield
                      v-else
                      :size="16"
                    />
                    {{ isSubmittingPassword ? 'Updating...' : 'Update Password' }}
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
