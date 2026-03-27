<script setup lang="ts">
import {
  Check,
  Loader2,
  Palette,
  Save,
  Settings,
  User
} from 'lucide-vue-next'
import { MOCK_USER_PROFILE } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// General Settings
// ──────────────────────────────────────────────

const isSaving = ref(false)
const saveSuccess = ref(false)

const generalSettings = ref({
  siteName: 'RMA Portal',
  companyName: 'PT Sharp Electronics Indonesia',
  timezone: 'Asia/Jakarta',
  language: 'id'
})

const timezones = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura']
const languages = [
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'en', label: 'English' }
]

const sessionUser = ref({
  ...MOCK_USER_PROFILE,
  username: MOCK_USER_PROFILE.email.split('@')[0] || ''
})
const usernameForm = ref(sessionUser.value.username)
const isSavingUsername = ref(false)
const usernameSaveSuccess = ref(false)
const canUpdateUsername = computed(() => {
  const nextUsername = usernameForm.value.trim()
  return nextUsername.length > 0 && nextUsername !== sessionUser.value.username
})

const updateUsername = async () => {
  const nextUsername = usernameForm.value.trim()
  if (!nextUsername || nextUsername === sessionUser.value.username) return

  isSavingUsername.value = true
  await new Promise(r => setTimeout(r, 800))
  sessionUser.value = {
    ...sessionUser.value,
    username: nextUsername
  }
  isSavingUsername.value = false
  usernameSaveSuccess.value = true
  setTimeout(() => {
    usernameSaveSuccess.value = false
  }, 2500)
}

// ──────────────────────────────────────────────
// Theme Settings
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Actions
// ──────────────────────────────────────────────

const saveSettings = async () => {
  isSaving.value = true
  await new Promise(r => setTimeout(r, 1000))
  isSaving.value = false
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 3000)
}

const settingSections = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette }
]

const activeSection = ref('general')
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            System <span class="text-[#B6F500]">Settings</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Konfigurasi global untuk sistem RMA Portal.
          </p>
        </div>
        <button
          :disabled="isSaving"
          class="flex items-center gap-2 bg-[#B6F500] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_10px_30px_rgba(182,245,0,0.2)] active:scale-95 disabled:opacity-50"
          @click="saveSettings"
        >
          <Loader2
            v-if="isSaving"
            :size="16"
            class="animate-spin"
          />
          <Save
            v-else
            :size="16"
          />
          {{ isSaving ? 'Saving...' : 'Save All Changes' }}
        </button>
      </div>

      <!-- Success Banner -->
      <div
        v-if="saveSuccess"
        class="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4"
      >
        <Check
          :size="18"
          class="shrink-0 text-emerald-400"
        />
        <p class="text-sm text-emerald-300 font-bold">
          Settings berhasil disimpan!
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
          <!-- Profile -->
          <div
            v-if="activeSection === 'profile'"
            class="space-y-8"
          >
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <User class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Profile Session
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Data user yang sedang login
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-8 md:flex-row md:items-start">
                <div class="shrink-0">
                  <div class="h-24 w-24 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                    <img
                      :src="sessionUser.avatarUrl"
                      :alt="sessionUser.name"
                      class="h-full w-full object-cover"
                    >
                  </div>
                </div>

                <div class="w-full space-y-4">
                  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                      <label class="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30">Nama</label>
                      <input
                        :value="sessionUser.name"
                        disabled
                        type="text"
                        class="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/50 opacity-80"
                      >
                    </div>

                    <div class="space-y-2">
                      <label class="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30">Email</label>
                      <input
                        :value="sessionUser.email"
                        disabled
                        type="text"
                        class="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/50 opacity-80"
                      >
                    </div>

                    <div class="space-y-2">
                      <label class="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30">Role</label>
                      <input
                        :value="sessionUser.role"
                        disabled
                        type="text"
                        class="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/50 opacity-80"
                      >
                    </div>

                    <div
                      v-if="sessionUser.role === 'CS'"
                      class="space-y-2"
                    >
                      <label class="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30">Branch</label>
                      <input
                        :value="sessionUser.branch"
                        disabled
                        type="text"
                        class="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white/50 opacity-80"
                      >
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="ml-2 text-[10px] font-black uppercase tracking-widest text-white/30">Username</label>
                    <div class="flex flex-col gap-3 md:flex-row md:items-center">
                      <input
                        v-model="usernameForm"
                        type="text"
                        class="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white focus:border-[#B6F500] focus:outline-none"
                      >
                      <button
                        :disabled="isSavingUsername || !canUpdateUsername"
                        class="inline-flex h-[46px] w-fit self-start items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#B6F500] px-5 text-xs font-black uppercase tracking-widest text-black transition-all hover:shadow-[0_10px_30px_rgba(182,245,0,0.2)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        @click="updateUsername"
                      >
                        <Loader2
                          v-if="isSavingUsername"
                          :size="14"
                          class="animate-spin"
                        />
                        <span>{{ isSavingUsername ? 'Updating...' : 'Update Username' }}</span>
                      </button>
                    </div>
                    <p
                      v-if="usernameSaveSuccess"
                      class="ml-2 text-[10px] font-bold uppercase tracking-widest text-emerald-400"
                    >
                      Username berhasil diperbarui.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- General Settings -->
          <div
            v-if="activeSection === 'general'"
            class="space-y-8"
          >
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <Settings class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    General Configuration
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Basic system settings and preferences
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:max-w-4xl">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Site Name</label>
                  <input
                    v-model="generalSettings.siteName"
                    type="text"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Company Name</label>
                  <input
                    v-model="generalSettings.companyName"
                    type="text"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Timezone</label>
                  <select
                    v-model="generalSettings.timezone"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold appearance-none focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                    <option
                      v-for="tz in timezones"
                      :key="tz"
                      :value="tz"
                      class="bg-[#0a0a0a]"
                    >
                      {{ tz }}
                    </option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Language</label>
                  <select
                    v-model="generalSettings.language"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold appearance-none focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                    <option
                      v-for="lang in languages"
                      :key="lang.value"
                      :value="lang.value"
                      class="bg-[#0a0a0a]"
                    >
                      {{ lang.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Appearance Settings -->
          <div
            v-if="activeSection === 'appearance'"
            class="space-y-8"
          >
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <Palette class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Appearance & Theme
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Customize the visual experience
                  </p>
                </div>
              </div>

              <!-- Accent Color Picker -->
              <div class="space-y-4">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Accent Color
                </p>
                <div class="flex gap-3">
                  <button
                    v-for="preset in accentPresets"
                    :key="preset.color"
                    :class="[
                      'w-12 h-12 rounded-2xl border-2 transition-all hover:scale-110',
                      themeSettings.accentColor === preset.color ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    ]"
                    :style="{ backgroundColor: preset.color, boxShadow: themeSettings.accentColor === preset.color ? `0 0 20px ${preset.color}40` : 'none' }"
                    @click="themeSettings.accentColor = preset.color"
                  />
                </div>
                <p class="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                  Selected: {{ accentPresets.find(p => p.color === themeSettings.accentColor)?.label || 'Custom' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
