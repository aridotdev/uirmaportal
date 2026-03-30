<script setup lang="ts">
import {
  Camera,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Shield,
  User
} from 'lucide-vue-next'
import type { UserProfile } from '~/utils/types'

definePageMeta({
  layout: 'cs'
})

// ──────────────────────────────────────────────
// Mock User Data
// ──────────────────────────────────────────────

const profile = ref<UserProfile>({
  id: 'USR-001',
  name: 'Zaina Riddle',
  email: 'zaina.riddle@sharp.co.id',
  role: 'CS',
  branch: 'Jakarta - Central Service',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  phone: '+62 812-3456-7890',
  joinedAt: '2023-01-15'
})

const isEditing = ref(false)
const isSaving = ref(false)
const editForm = ref({
  name: profile.value.name,
  phone: profile.value.phone,
  email: profile.value.email
})

const toggleEdit = () => {
  if (isEditing.value) {
    // Cancel editing
    editForm.value = {
      name: profile.value.name,
      phone: profile.value.phone,
      email: profile.value.email
    }
  }
  isEditing.value = !isEditing.value
}

const saveProfile = async () => {
  isSaving.value = true
  await new Promise(r => setTimeout(r, 800))
  profile.value.name = editForm.value.name
  profile.value.phone = editForm.value.phone
  profile.value.email = editForm.value.email
  isSaving.value = false
  isEditing.value = false
}

// ──────────────────────────────────────────────
// Password Change
// ──────────────────────────────────────────────

const passwordForm = ref({
  current: '',
  newPassword: '',
  confirm: ''
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const isChangingPassword = ref(false)
const passwordSuccess = ref(false)

const passwordsMatch = computed(() => {
  return passwordForm.value.newPassword === passwordForm.value.confirm && passwordForm.value.newPassword.length >= 8
})

const canSubmitPassword = computed(() => {
  return passwordForm.value.current.length > 0 && passwordsMatch.value
})

const changePassword = async () => {
  if (!canSubmitPassword.value) return
  isChangingPassword.value = true
  await new Promise(r => setTimeout(r, 1000))
  isChangingPassword.value = false
  passwordSuccess.value = true
  passwordForm.value = { current: '', newPassword: '', confirm: '' }
  setTimeout(() => {
    passwordSuccess.value = false
  }, 3000)
}

// ──────────────────────────────────────────────
// Activity Stats
// ──────────────────────────────────────────────

const activityStats = ref([
  { label: 'Total Claims', value: '47', color: 'text-white' },
  { label: 'Approved', value: '31', color: 'text-[#B6F500]' },
  { label: 'Pending', value: '8', color: 'text-blue-400' },
  { label: 'Revision', value: '5', color: 'text-amber-400' },
  { label: 'Draft', value: '3', color: 'text-white/40' }
])

const sessionInfo = ref({
  lastLogin: '26 Mar 2026, 08:15 AM',
  currentIp: '192.168.1.45',
  device: 'Chrome 128 / Windows 11'
})
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 px-6 backdrop-blur-md md:px-12">
      <div class="mx-auto flex h-24 w-full max-w-7xl items-center justify-between">
        <div class="flex items-center gap-6">
          <div>
            <h1 class="text-2xl font-black uppercase italic tracking-tighter">
              My <span class="text-[#B6F500]">Profile</span>
            </h1>
            <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="p-6 md:p-12 animate-in space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        <!-- Left: Profile Card -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Avatar & Info Card -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 text-center relative overflow-hidden">
            <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#B6F500]/5 rounded-full blur-3xl pointer-events-none" />
            <div class="relative z-10 flex flex-col items-center">
              <div class="relative group">
                <div class="w-24 h-24 rounded-3xl overflow-hidden border-3 border-[#B6F500]/30 shadow-[0_0_30px_rgba(182,245,0,0.15)]">
                  <img
                    :src="profile.avatarUrl"
                    :alt="profile.name"
                    class="w-full h-full object-cover"
                  >
                </div>
                <button class="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#B6F500] text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Camera :size="14" />
                </button>
              </div>

              <h2 class="text-2xl font-black italic tracking-tight mt-6">
                {{ profile.name }}
              </h2>
              <div class="flex items-center gap-2 mt-2">
                <span class="px-3 py-1 rounded-full bg-[#B6F500]/10 text-[#B6F500] text-[10px] font-black uppercase tracking-[0.2em] border border-[#B6F500]/20">
                  {{ profile.role }}
                </span>
              </div>

              <div class="w-full mt-8 space-y-3 text-left">
                <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Mail
                    :size="16"
                    class="text-white/30 shrink-0"
                  />
                  <span class="text-xs font-bold text-white/50 truncate">{{ profile.email }}</span>
                </div>
                <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <MapPin
                    :size="16"
                    class="text-white/30 shrink-0"
                  />
                  <span class="text-xs font-bold text-white/50 truncate">{{ profile.branch }}</span>
                </div>
                <div class="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Shield
                    :size="16"
                    class="text-white/30 shrink-0"
                  />
                  <span class="text-xs font-bold text-white/50">Joined {{ profile.joinedAt }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Stats -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">
              My Claim Statistics
            </h3>
            <div class="space-y-4">
              <div
                v-for="stat in activityStats"
                :key="stat.label"
                class="flex items-center justify-between"
              >
                <span class="text-xs font-bold text-white/40 uppercase tracking-widest">{{ stat.label }}</span>
                <span :class="['text-xl font-black italic', stat.color]">{{ stat.value }}</span>
              </div>
            </div>
          </div>

          <!-- Session Info -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
            <div class="flex items-center gap-3 mb-6">
              <Monitor
                :size="16"
                class="text-white/30"
              />
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Session Info
              </h3>
            </div>
            <div class="space-y-4 text-xs">
              <div class="flex justify-between">
                <span class="font-bold text-white/30 uppercase tracking-widest">Last Login</span>
                <span class="font-bold">{{ sessionInfo.lastLogin }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-bold text-white/30 uppercase tracking-widest">IP Address</span>
                <span class="font-mono font-bold text-white/60">{{ sessionInfo.currentIp }}</span>
              </div>
              <div class="flex justify-between">
                <span class="font-bold text-white/30 uppercase tracking-widest">Device</span>
                <span class="font-bold text-white/60">{{ sessionInfo.device }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Edit Profile & Security -->
        <div class="lg:col-span-8 space-y-8">
          <!-- Edit Profile Section -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
            <div class="flex items-center justify-between border-b border-white/5 pb-6">
              <div class="flex items-center gap-3">
                <div class="bg-white/5 p-2 rounded-lg">
                  <User class="w-5 h-5 text-white/60" />
                </div>
                <h3 class="font-black text-lg uppercase tracking-tight">
                  Personal Information
                </h3>
              </div>
              <button
                :class="[
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                  isEditing
                    ? 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
                    : 'bg-[#B6F500]/10 border border-[#B6F500]/20 text-[#B6F500] hover:bg-[#B6F500]/20'
                ]"
                @click="toggleEdit"
              >
                <Edit3 :size="14" />
                {{ isEditing ? 'Cancel' : 'Edit Profile' }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Full Name</label>
                <input
                  v-model="editForm.name"
                  type="text"
                  :disabled="!isEditing"
                  :class="[
                    'w-full rounded-xl px-5 py-3 text-sm font-bold transition-all',
                    isEditing
                      ? 'bg-white/5 border border-white/10 focus:outline-none focus:border-[#B6F500]'
                      : 'bg-white/2 border border-white/5 text-white/60 cursor-not-allowed'
                  ]"
                >
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  :disabled="!isEditing"
                  :class="[
                    'w-full rounded-xl px-5 py-3 text-sm font-bold transition-all',
                    isEditing
                      ? 'bg-white/5 border border-white/10 focus:outline-none focus:border-[#B6F500]'
                      : 'bg-white/2 border border-white/5 text-white/60 cursor-not-allowed'
                  ]"
                >
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Phone Number</label>
                <input
                  v-model="editForm.phone"
                  type="tel"
                  :disabled="!isEditing"
                  :class="[
                    'w-full rounded-xl px-5 py-3 text-sm font-bold transition-all',
                    isEditing
                      ? 'bg-white/5 border border-white/10 focus:outline-none focus:border-[#B6F500]'
                      : 'bg-white/2 border border-white/5 text-white/60 cursor-not-allowed'
                  ]"
                >
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Branch</label>
                <input
                  :value="profile.branch"
                  type="text"
                  disabled
                  class="w-full rounded-xl px-5 py-3 text-sm font-bold bg-white/2 border border-white/5 text-white/60 cursor-not-allowed"
                >
              </div>
            </div>

            <button
              v-if="isEditing"
              :disabled="isSaving"
              class="bg-[#B6F500] text-black px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(182,245,0,0.3)] active:scale-95 disabled:opacity-50"
              @click="saveProfile"
            >
              <Loader2
                v-if="isSaving"
                :size="16"
                class="animate-spin"
              />
              <Check
                v-else
                :size="16"
              />
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

          <!-- Change Password Section -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
            <div class="flex items-center gap-3 border-b border-white/5 pb-6">
              <div class="bg-white/5 p-2 rounded-lg">
                <Key class="w-5 h-5 text-white/60" />
              </div>
              <div>
                <h3 class="font-black text-lg uppercase tracking-tight">
                  Change Password
                </h3>
                <p class="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                  Ensure your account uses a strong, unique password
                </p>
              </div>
            </div>

            <!-- Success Message -->
            <div
              v-if="passwordSuccess"
              class="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
            >
              <Check class="text-emerald-400 w-5 h-5" />
              <span class="text-sm font-bold text-emerald-400">Password berhasil diubah!</span>
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Current Password</label>
                <div class="relative">
                  <input
                    v-model="passwordForm.current"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    placeholder="Enter current password"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold pr-12 focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                  <button
                    class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    <Eye
                      v-if="!showCurrentPassword"
                      :size="16"
                    />
                    <EyeOff
                      v-else
                      :size="16"
                    />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">New Password</label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      placeholder="Min. 8 characters"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold pr-12 focus:outline-none focus:border-[#B6F500] transition-colors"
                    >
                    <button
                      class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <Eye
                        v-if="!showNewPassword"
                        :size="16"
                      />
                      <EyeOff
                        v-else
                        :size="16"
                      />
                    </button>
                  </div>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Confirm New Password</label>
                  <input
                    v-model="passwordForm.confirm"
                    type="password"
                    placeholder="Re-enter new password"
                    :class="[
                      'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm font-bold focus:outline-none transition-colors',
                      passwordForm.confirm && !passwordsMatch
                        ? 'border-red-500/50 focus:border-red-500'
                        : passwordForm.confirm && passwordsMatch
                          ? 'border-emerald-500/50 focus:border-emerald-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                    ]"
                  >
                  <p
                    v-if="passwordForm.confirm && !passwordsMatch"
                    class="text-[10px] font-bold text-red-400 ml-2 mt-1"
                  >
                    {{ passwordForm.newPassword.length < 8 ? 'Password harus minimal 8 karakter' : 'Password tidak cocok' }}
                  </p>
                </div>
              </div>

              <button
                :disabled="!canSubmitPassword || isChangingPassword"
                class="bg-[#B6F500] text-black px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(182,245,0,0.3)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                @click="changePassword"
              >
                <Loader2
                  v-if="isChangingPassword"
                  :size="16"
                  class="animate-spin"
                />
                <Lock
                  v-else
                  :size="16"
                />
                {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
</style>
