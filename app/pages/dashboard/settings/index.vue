<script setup lang="ts">
import {
  Bell,
  Check,
  Clock,
  Globe,
  Loader2,
  Mail,
  Moon,
  Palette,
  Save,
  Settings,
  ToggleLeft,
  ToggleRight,
  Upload
} from 'lucide-vue-next'

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

// ──────────────────────────────────────────────
// Notification Settings
// ──────────────────────────────────────────────

const notificationSettings = ref({
  emailOnClaimSubmit: true,
  emailOnClaimApproved: true,
  emailOnClaimRevision: true,
  emailOnVendorDecision: false,
  systemNotifications: true,
  dailyDigest: false,
  weeklyReport: true
})

// ──────────────────────────────────────────────
// Theme Settings
// ──────────────────────────────────────────────

const themeSettings = ref({
  accentColor: '#B6F500',
  darkMode: true,
  compactMode: false,
  showAnimations: true
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
  { id: 'notifications', label: 'Notifications', icon: Bell },
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

          <!-- Notification Settings -->
          <div
            v-if="activeSection === 'notifications'"
            class="space-y-8"
          >
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <Bell class="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Notification Preferences
                  </h3>
                  <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                    Control which notifications you receive
                  </p>
                </div>
              </div>

              <div class="space-y-1">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
                  Email Notifications
                </p>
                <div class="space-y-2">
                  <div
                    v-for="(value, key) in { emailOnClaimSubmit: 'Claim submitted', emailOnClaimApproved: 'Claim approved', emailOnClaimRevision: 'Claim needs revision', emailOnVendorDecision: 'Vendor decision received' }"
                    :key="key"
                    class="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-5 py-4"
                  >
                    <div class="flex items-center gap-3">
                      <Mail
                        :size="16"
                        class="text-white/30"
                      />
                      <span class="text-sm font-bold text-white/60">{{ value }}</span>
                    </div>
                    <button
                      @click="notificationSettings[key as keyof typeof notificationSettings] = !notificationSettings[key as keyof typeof notificationSettings]"
                    >
                      <component
                        :is="notificationSettings[key as keyof typeof notificationSettings] ? ToggleRight : ToggleLeft"
                        :size="28"
                        :class="notificationSettings[key as keyof typeof notificationSettings] ? 'text-[#B6F500]' : 'text-white/20'"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div class="space-y-1 pt-4 border-t border-white/5">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
                  Report Schedule
                </p>
                <div class="space-y-2">
                  <div class="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-5 py-4">
                    <div class="flex items-center gap-3">
                      <Clock
                        :size="16"
                        class="text-white/30"
                      />
                      <span class="text-sm font-bold text-white/60">Daily Digest Email</span>
                    </div>
                    <button @click="notificationSettings.dailyDigest = !notificationSettings.dailyDigest">
                      <component
                        :is="notificationSettings.dailyDigest ? ToggleRight : ToggleLeft"
                        :size="28"
                        :class="notificationSettings.dailyDigest ? 'text-[#B6F500]' : 'text-white/20'"
                      />
                    </button>
                  </div>
                  <div class="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-5 py-4">
                    <div class="flex items-center gap-3">
                      <Globe
                        :size="16"
                        class="text-white/30"
                      />
                      <span class="text-sm font-bold text-white/60">Weekly Performance Report</span>
                    </div>
                    <button @click="notificationSettings.weeklyReport = !notificationSettings.weeklyReport">
                      <component
                        :is="notificationSettings.weeklyReport ? ToggleRight : ToggleLeft"
                        :size="28"
                        :class="notificationSettings.weeklyReport ? 'text-[#B6F500]' : 'text-white/20'"
                      />
                    </button>
                  </div>
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

              <!-- Toggle Settings -->
              <div class="space-y-2 pt-4 border-t border-white/5">
                <div class="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-5 py-4">
                  <div class="flex items-center gap-3">
                    <Moon
                      :size="16"
                      class="text-white/30"
                    />
                    <div>
                      <span class="text-sm font-bold text-white/60">Dark Mode</span>
                      <p class="text-[9px] font-bold text-white/20 mt-0.5">
                        Always-on for this application
                      </p>
                    </div>
                  </div>
                  <ToggleRight
                    :size="28"
                    class="text-[#B6F500]"
                  />
                </div>
                <div class="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-5 py-4">
                  <div class="flex items-center gap-3">
                    <Settings
                      :size="16"
                      class="text-white/30"
                    />
                    <div>
                      <span class="text-sm font-bold text-white/60">Compact Mode</span>
                      <p class="text-[9px] font-bold text-white/20 mt-0.5">
                        Reduce spacing for more content
                      </p>
                    </div>
                  </div>
                  <button @click="themeSettings.compactMode = !themeSettings.compactMode">
                    <component
                      :is="themeSettings.compactMode ? ToggleRight : ToggleLeft"
                      :size="28"
                      :class="themeSettings.compactMode ? 'text-[#B6F500]' : 'text-white/20'"
                    />
                  </button>
                </div>
                <div class="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 px-5 py-4">
                  <div class="flex items-center gap-3">
                    <Upload
                      :size="16"
                      class="text-white/30"
                    />
                    <div>
                      <span class="text-sm font-bold text-white/60">Animations</span>
                      <p class="text-[9px] font-bold text-white/20 mt-0.5">
                        Enable smooth transition effects
                      </p>
                    </div>
                  </div>
                  <button @click="themeSettings.showAnimations = !themeSettings.showAnimations">
                    <component
                      :is="themeSettings.showAnimations ? ToggleRight : ToggleLeft"
                      :size="28"
                      :class="themeSettings.showAnimations ? 'text-[#B6F500]' : 'text-white/20'"
                    />
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
