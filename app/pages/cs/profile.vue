<script setup lang="ts">
import {
  AlertCircle,
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
  Upload,
  User,
  X
} from 'lucide-vue-next'

const toast = useToast()
const { currentUser, activityStats: userActivityStats } = useCsStore()

definePageMeta({
  layout: 'cs'
})

// ──────────────────────────────────────────────
// Mock User Data
// ──────────────────────────────────────────────

const profile = ref({ ...currentUser })

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

  toast.add({
    title: 'Profil Diperbarui',
    description: 'Informasi profil Anda telah berhasil disimpan.',
    icon: 'i-lucide-check-circle',
    color: 'success'
  })
}

// ──────────────────────────────────────────────
// Avatar Upload
// ──────────────────────────────────────────────

const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const isUploadingAvatar = ref(false)
const avatarInputRef = ref<HTMLInputElement | null>(null)

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click()
}

const handleAvatarChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validasi: hanya image, max 2MB
  if (!file.type.startsWith('image/')) {
    toast.add({
      title: 'File tidak didukung',
      description: 'Silakan pilih file gambar (JPG, PNG, atau WEBP).',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: 'File terlalu besar',
      description: 'Ukuran maksimal foto adalah 2MB.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const saveAvatar = async () => {
  if (!avatarFile.value) return
  isUploadingAvatar.value = true
  await new Promise(r => setTimeout(r, 800))
  // Mock: update profile avatar URL
  if (avatarPreview.value) {
    profile.value.avatarUrl = avatarPreview.value
  }
  avatarFile.value = null
  isUploadingAvatar.value = false

  toast.add({
    title: 'Avatar Diperbarui',
    description: 'Foto profil Anda telah berhasil diperbarui.',
    icon: 'i-lucide-camera',
    color: 'success'
  })
}

const cancelAvatarChange = () => {
  avatarFile.value = null
  if (avatarPreview.value) {
    URL.revokeObjectURL(avatarPreview.value)
  }
  avatarPreview.value = null
}

// ──────────────────────────────────────────────
// Password Change
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

const passwordStrength = computed(() => {
  const password = passwordForm.value.newPassword
  if (!password) return { score: 0, label: '', color: 'bg-white/10' }

  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' }
  if (score === 3) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-[#B6F500]' }
})

const submitPassword = async () => {
  if (!canSubmitPassword.value) return

  isSubmittingPassword.value = true
  passwordServerError.value = ''
  passwordSuccess.value = false

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

  toast.add({
    title: 'Password Berhasil',
    description: 'Kata sandi Anda telah berhasil diperbarui.',
    icon: 'i-lucide-lock',
    color: 'success'
  })
}

// ──────────────────────────────────────────────
// Activity Stats
// ──────────────────────────────────────────────

const activityStats = computed(() => {
  return [
    { label: 'Total Claims', value: String(userActivityStats.value.totalClaims), color: 'text-white' },
    { label: 'Approved', value: String(userActivityStats.value.approved), color: 'text-[#B6F500]' },
    { label: 'Pending', value: String(userActivityStats.value.pending), color: 'text-blue-400' },
    { label: 'Revision', value: String(userActivityStats.value.revision), color: 'text-amber-400' },
    { label: 'Draft', value: String(userActivityStats.value.draft), color: 'text-white/40' }
  ]
})

const sessionInfo = computed(() => ({
  lastLogin: profile.value.lastLoginAt
    ? new Date(profile.value.lastLoginAt).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    : '-',
  currentIp: '192.168.1.45',
  device: 'Chrome 128 / Windows 11'
}))

const formattedJoinDate = computed(() => {
  return new Date(profile.value.joinedAt).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
})

// ──────────────────────────────────────────────
// Loading & Error States
// ──────────────────────────────────────────────

const isLoadingProfile = ref(false)
const profileError = ref(false)

onMounted(async () => {
  isLoadingProfile.value = true
  // Simulasi fetch data
  await new Promise(r => setTimeout(r, 1000))
  isLoadingProfile.value = false
})
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white">
    <!-- Header -->
    <header class="cs-shell-x sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <div class="cs-shell-container flex h-20 items-center justify-between sm:h-24">
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

    <div class="cs-shell-main animate-in space-y-8">
      <div class="cs-shell-container">
        <!-- Loading State -->
        <div
          v-if="isLoadingProfile"
          class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4"
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
          class="bg-[#0a0a0a] border border-red-500/20 rounded-4xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4"
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

        <!-- Loaded State -->
        <div
          v-else
          class="grid grid-cols-1 gap-8 lg:grid-cols-12"
        >
          <!-- Left: Profile Card -->
          <div class="lg:col-span-4 space-y-6">
            <!-- Avatar & Info Card -->
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-6 sm:p-8 text-center relative overflow-hidden">
              <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#B6F500]/5 rounded-full blur-3xl pointer-events-none" />
              <div class="relative z-10 flex flex-col items-center">
                <div class="relative group">
                  <div class="w-24 h-24 rounded-3xl overflow-hidden border-3 border-[#B6F500]/30 shadow-[0_0_30px_rgba(182,245,0,0.15)]">
                    <img
                      :src="avatarPreview || profile.avatarUrl"
                      :alt="profile.name"
                      class="w-full h-full object-cover"
                    >
                  </div>
                  <button
                    class="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[#B6F500] text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    @click="triggerAvatarUpload"
                  >
                    <Camera :size="14" />
                  </button>
                  <input
                    ref="avatarInputRef"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    class="hidden"
                    @change="handleAvatarChange"
                  >
                </div>

                <!-- Avatar action buttons (tampil hanya saat ada file baru) -->
                <div
                  v-if="avatarFile"
                  class="flex items-center gap-2 mt-4"
                >
                  <button
                    :disabled="isUploadingAvatar"
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B6F500] text-black text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(182,245,0,0.3)] disabled:opacity-50"
                    @click="saveAvatar"
                  >
                    <Loader2
                      v-if="isUploadingAvatar"
                      :size="12"
                      class="animate-spin"
                    />
                    <Upload
                      v-else
                      :size="12"
                    />
                    {{ isUploadingAvatar ? 'Uploading...' : 'Save' }}
                  </button>
                  <button
                    class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-black uppercase tracking-widest hover:text-white transition-colors"
                    @click="cancelAvatarChange"
                  >
                    <X :size="12" />
                    Cancel
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
                    <span class="text-xs font-bold text-white/50">Joined {{ formattedJoinDate }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Activity Stats -->
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-6 sm:p-8">
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
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-6 sm:p-8">
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
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span class="font-bold text-white/30 uppercase tracking-widest">Last Login</span>
                  <span class="font-bold">{{ sessionInfo.lastLogin }}</span>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span class="font-bold text-white/30 uppercase tracking-widest">IP Address</span>
                  <span class="font-mono font-bold text-white/60">{{ sessionInfo.currentIp }}</span>
                </div>
                <div class="flex flex-col gap-1 sm:flex-row sm:justify-between">
                  <span class="font-bold text-white/30 uppercase tracking-widest">Device</span>
                  <span class="font-bold text-white/60">{{ sessionInfo.device }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Edit Profile & Security -->
          <div class="lg:col-span-8 space-y-8">
            <!-- Edit Profile Section -->
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-6 sm:p-8 space-y-8">
              <div class="flex flex-col gap-3 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
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
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Username</label>
                  <input
                    :value="profile.username"
                    type="text"
                    disabled
                    class="w-full rounded-xl px-5 py-3 text-sm font-bold bg-white/2 border border-white/5 text-white/60 cursor-not-allowed"
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

              <div class="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/2 px-5 py-4 mt-6">
                <Lock
                  :size="16"
                  class="shrink-0 mt-0.5 text-white/20"
                />
                <p
                  class="text-xs text-white/30 font-medium leading-relaxed"
                >
                  Branch dan Username dikelola oleh admin. Hubungi administrator jika ada perubahan yang diperlukan.
                </p>
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
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-6 sm:p-8 space-y-8">
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

              <!-- Success banner with Transition -->
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
                  class="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
                >
                  <Check class="text-emerald-400 w-5 h-5" />
                  <span class="text-sm font-bold text-emerald-400">Password berhasil diperbarui!</span>
                </div>
              </Transition>

              <!-- Server error banner -->
              <div
                v-if="passwordServerError"
                class="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4"
              >
                <AlertCircle class="text-red-400 w-5 h-5" />
                <span class="text-sm font-bold text-red-400">{{ passwordServerError }}</span>
              </div>

              <div class="space-y-6">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Current Password</label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      placeholder="Enter current password"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm font-bold pr-12 focus:outline-none transition-colors',
                        passwordValidation.currentPassword && isPasswordFormDirty
                          ? 'border-red-500/50 focus:border-red-500'
                          : 'border-white/10 focus:border-[#B6F500]'
                      ]"
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
                  <p
                    v-if="passwordValidation.currentPassword && passwordForm.currentPassword"
                    class="text-[10px] font-bold text-red-400 ml-2 mt-1"
                  >
                    {{ passwordValidation.currentPassword }}
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">New Password</label>
                    <div class="relative">
                      <input
                        v-model="passwordForm.newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        placeholder="Min. 8 characters"
                        :class="[
                          'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm font-bold pr-12 focus:outline-none transition-colors',
                          passwordValidation.newPassword && passwordForm.newPassword
                            ? 'border-red-500/50 focus:border-red-500'
                            : 'border-white/10 focus:border-[#B6F500]'
                        ]"
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

                    <!-- Password Strength Indicator -->
                    <div
                      v-if="passwordForm.newPassword"
                      class="space-y-1.5 mt-2 px-1"
                    >
                      <div class="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em]">
                        <span class="text-white/20">Strength:</span>
                        <span :class="[passwordStrength.color.replace('bg-', 'text-')]">{{ passwordStrength.label }}</span>
                      </div>
                      <div class="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          :class="['h-full transition-all duration-500', passwordStrength.color]"
                          :style="{ width: `${(passwordStrength.score / 4) * 100}%` }"
                        />
                      </div>
                    </div>

                    <p
                      v-if="passwordValidation.newPassword && passwordForm.newPassword"
                      class="text-[10px] font-bold text-red-400 ml-2 mt-1"
                    >
                      {{ passwordValidation.newPassword }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Confirm New Password</label>
                    <div class="relative">
                      <input
                        v-model="passwordForm.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        placeholder="Re-enter new password"
                        :class="[
                          'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm font-bold pr-12 focus:outline-none transition-colors',
                          passwordValidation.confirmPassword && passwordForm.confirmPassword
                            ? 'border-red-500/50 focus:border-red-500'
                            : passwordForm.confirmPassword && !passwordValidation.confirmPassword
                              ? 'border-emerald-500/50 focus:border-emerald-500'
                              : 'border-white/10 focus:border-[#B6F500]'
                        ]"
                      >
                      <button
                        class="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                        @click="showConfirmPassword = !showConfirmPassword"
                      >
                        <Eye
                          v-if="!showConfirmPassword"
                          :size="16"
                        />
                        <EyeOff
                          v-else
                          :size="16"
                        />
                      </button>
                    </div>
                    <p
                      v-if="passwordValidation.confirmPassword && passwordForm.confirmPassword"
                      class="text-[10px] font-bold text-red-400 ml-2 mt-1"
                    >
                      {{ passwordValidation.confirmPassword }}
                    </p>
                  </div>
                </div>

                <button
                  :disabled="!canSubmitPassword || isSubmittingPassword"
                  class="bg-[#B6F500] text-black px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(182,245,0,0.3)] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
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
