# Prompt: Perbaikan Halaman CS Profile (`/cs/profile`)

## Konteks Proyek

**Repo**: `uirmaportal` — internal RMA claim management system.
**Stack**: Nuxt 4, Nuxt UI v4, TailwindCSS v4, Lucide Vue Next, Zod, TypeScript.
**Design system**: Dark theme only (bg `#050505`, surface `#0a0a0a`), accent `#B6F500`.
**Status**: Semua halaman masih pakai mock data (belum ada API).

### File yang Relevan

| File | Peran |
|------|-------|
| `app/pages/cs/profile.vue` | **Target utama** — halaman profile CS yang akan diperbaiki |
| `app/utils/mock-data.ts` | Sumber mock data terpusat. Ada `MOCK_USER_PROFILE` (line 1110-1122) |
| `app/utils/types.ts` | Interface `UserProfile` (line 215-227) |
| `app/layouts/cs.vue` | Layout CS — sidebar + user card bawah |
| `app/pages/dashboard/settings/index.vue` | **Referensi pattern** untuk security flow yang lebih mature |
| `app/assets/css/main.css` | Utility classes: `.cs-shell-x`, `.cs-shell-container`, `.cs-shell-main` |

### Spesifikasi PRD (Sumber Kebenaran)

Dari `pages.md` baris 19:
> **CS Profile** `/cs/profile` — Halaman akun ringkas dalam satu page: profile card, personal information edit, statistik sederhana, session info, dan section security untuk change password; tidak ada route `/cs/security` terpisah selama scope security CS hanya ganti password.

Dari `prd.md` baris 235-237:
> **Profile `/cs/profile`** — Ringkas dan sederhana: profile info, branch, role, edit basic account info, dan section security untuk ganti password. Tidak memerlukan route `/cs/security` terpisah selama fitur security CS masih terbatas pada change password.

---

## Checklist Perbaikan

### SHOULD FIX (Wajib dikerjakan)

---

#### [DONE] SF-1: Samakan Data Profile dengan Mock Sentral

**Masalah**: Halaman `cs/profile.vue` mendefinisikan data profile hardcoded sendiri di baris 27-36 dan session info di baris 114-118. Ini membuat data **tidak konsisten** dengan `MOCK_USER_PROFILE` di `app/utils/mock-data.ts` (yang sudah dipakai oleh `dashboard/settings/index.vue`).

**Data yang inkonsisten saat ini**:
- Profile page: `role: 'CS'`, `branch: 'Jakarta - Central Service'`, `email: 'zaina.riddle@sharp.co.id'`, `id: 'USR-001'`
- Mock sentral: `role: 'QRCC'`, `branch: 'Jakarta'`, `email: 'zaina@sharp.co.id'`, `id: 'usr_001'`

**Yang harus dilakukan**:

1. **Buat mock profile baru khusus CS** di `app/utils/mock-data.ts`.

   Tambahkan di bawah `MOCK_USER_PROFILE` (sekitar baris 1122):

   ```ts
   export const MOCK_CS_USER_PROFILE: UserProfile = {
     id: 'usr_003',
     name: 'Sari Dewi',
     username: 'sari.dewi',
     email: 'sari.dewi@sharp.co.id',
     role: 'CS',
     branch: 'Jakarta - Central Service',
     avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sari',
     phone: '+62 812-9988-7766',
     joinedAt: '2024-06-10T00:00:00Z',
     isActive: true,
     lastLoginAt: '2026-03-26T08:15:00Z'
   }
   ```

2. **Pada `cs/profile.vue`**, ganti hardcoded data dengan import:

   ```ts
   import { MOCK_CS_USER_PROFILE } from '~/utils/mock-data'

   const profile = ref<UserProfile>({ ...MOCK_CS_USER_PROFILE })
   ```

3. **Ganti `sessionInfo` manual** dengan data dari profile:

   ```ts
   // HAPUS ini (baris 114-118):
   // const sessionInfo = ref({
   //   lastLogin: '26 Mar 2026, 08:15 AM',
   //   currentIp: '192.168.1.45',
   //   device: 'Chrome 128 / Windows 11'
   // })

   // GANTI dengan:
   const sessionInfo = computed(() => ({
     lastLogin: profile.value.lastLoginAt
       ? new Date(profile.value.lastLoginAt).toLocaleString('id-ID', {
           day: '2-digit', month: 'short', year: 'numeric',
           hour: '2-digit', minute: '2-digit'
         })
       : '-',
     currentIp: '192.168.1.45',   // tetap mock — tidak ada di UserProfile
     device: 'Chrome 128 / Windows 11' // tetap mock — tidak ada di UserProfile
   }))
   ```

4. **Update juga `joinedAt` di template** agar pakai format tanggal yang rapi.
   Saat ini baris 189 langsung tampilkan raw string `profile.joinedAt`.
   Buat helper atau pakai inline:

   ```ts
   const formattedJoinDate = computed(() => {
     return new Date(profile.value.joinedAt).toLocaleDateString('id-ID', {
       day: '2-digit', month: 'short', year: 'numeric'
     })
   })
   ```

   Template: ganti `Joined {{ profile.joinedAt }}` menjadi `Joined {{ formattedJoinDate }}`.

5. **Sinkronkan juga user card di sidebar (`app/layouts/cs.vue`)**:
   Sidebar saat ini hardcode nama "Zaina Riddle" dan role "CS Agent" (baris 157-162). Ini boleh tetap hardcoded karena layout belum connected ke auth state, tapi **pastikan nama dan avatar konsisten** dengan `MOCK_CS_USER_PROFILE` yang baru di atas.

   Opsi paling simpel: import mock dan bind langsung di sidebar:
   ```ts
   import { MOCK_CS_USER_PROFILE } from '~/utils/mock-data'
   const currentUser = MOCK_CS_USER_PROFILE
   ```
   Lalu ganti hardcoded di template:
   - `"Zaina Riddle"` → `{{ currentUser.name }}`
   - `"CS Agent"` → `{{ currentUser.role }}`
   - Avatar src → `:src="currentUser.avatarUrl"`

**Kriteria selesai**: Tidak ada data hardcoded profile di `cs/profile.vue`. Semua bersumber dari `MOCK_CS_USER_PROFILE`. Sidebar cs.vue konsisten.

---

#### [DONE] SF-2: Branch dan Username Hanya Display (Tidak Boleh Diedit CS)

**Masalah**: Saat ini `branch` sudah non-editable (disabled input, baris 312-317). Namun `username` belum ditampilkan di section Personal Information form. Field `role` tidak perlu ditambahkan di grid karena sudah ada di header profile (dibawah avatar).

**Yang harus dilakukan**:

1. **Tambahkan field `Username` read-only** (direkomendasikan karena ada di interface `UserProfile`):

   ```html
   <div class="space-y-2">
     <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Username</label>
     <input
       :value="profile.username"
       type="text"
       disabled
       class="w-full rounded-xl px-5 py-3 text-sm font-bold bg-white/2 border border-white/5 text-white/60 cursor-not-allowed"
     >
   </div>
   ```

2. **Pastikan grid tetap rapi**. Gunakan `md:grid-cols-2`. Urutan yang direkomendasikan:
   - Row 1: Full Name (editable) | Email (editable)
   - Row 2: Phone Number (editable) | Username (read-only)
   - Row 3: Branch (read-only)

3. **Tambahkan helper text** di bawah grid, menjelaskan field read-only. Ikuti pattern dari `dashboard/settings/index.vue` baris 348-356:

   ```html
   <div class="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/2 px-5 py-4 mt-6">
     <Lock :size="16" class="shrink-0 mt-0.5 text-white/20" />
     <p class="text-xs text-white/30 font-medium leading-relaxed">
       Branch dan Username dikelola oleh admin. Hubungi administrator jika ada perubahan yang diperlukan.
     </p>
   </div>
   ```

   Import `Lock` dari lucide-vue-next (sudah di-import di file ini).

**Kriteria selesai**: Branch dan Username ditampilkan tapi disabled di grid. Ada helper text. Hanya Name, Email, Phone yang editable.

---

#### [DONE] SF-3: Rapikan Security Flow (Change Password)

**Masalah**: Validasi password di `cs/profile.vue` terlalu sederhana dibandingkan pattern yang sudah matang di `dashboard/settings/index.vue`. Kurang: per-field error message, validasi password baru != password lama, error state per field, server error handling, show/hide toggle pada confirm password, dan `Transition` animasi pada success banner.

**Yang harus dilakukan**:

1. **Ganti reactive state password** dari pattern lama ke pattern baru.

   **HAPUS** (baris 72-100):
   ```ts
   const passwordForm = ref({
     current: '',
     newPassword: '',
     confirm: ''
   })
   const showCurrentPassword = ref(false)
   const showNewPassword = ref(false)
   const isChangingPassword = ref(false)
   const passwordSuccess = ref(false)

   const passwordsMatch = computed(...)
   const canSubmitPassword = computed(...)
   const changePassword = async () => { ... }
   ```

   **GANTI dengan** (ikuti pattern `dashboard/settings/index.vue` baris 76-140):
   ```ts
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

     await new Promise(r => setTimeout(r, 1200))

     isSubmittingPassword.value = false
     passwordSuccess.value = true
     passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
     showCurrentPassword.value = false
     showNewPassword.value = false
     showConfirmPassword.value = false

     setTimeout(() => { passwordSuccess.value = false }, 4000)
   }
   ```

2. **Update icon import**. Tambahkan `AlertCircle` ke import list (baris 2-16):
   ```ts
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
   ```

3. **Update template Change Password section** (baris 340-457).
   Ganti seluruh blok `<!-- Change Password Section -->` dengan yang mengikuti pattern ini:

   - **Success banner dengan `<Transition>`**:
     ```html
     <Transition
       enter-active-class="transition-all duration-300 ease-out"
       enter-from-class="opacity-0 -translate-y-2"
       enter-to-class="opacity-100 translate-y-0"
       leave-active-class="transition-all duration-200 ease-in"
       leave-from-class="opacity-100 translate-y-0"
       leave-to-class="opacity-0 -translate-y-2"
     >
       <div v-if="passwordSuccess" class="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
         <Check class="text-emerald-400 w-5 h-5" />
         <span class="text-sm font-bold text-emerald-400">Password berhasil diperbarui!</span>
       </div>
     </Transition>
     ```

   - **Server error banner**:
     ```html
     <div v-if="passwordServerError" class="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
       <AlertCircle class="text-red-400 w-5 h-5" />
       <span class="text-sm font-bold text-red-400">{{ passwordServerError }}</span>
     </div>
     ```

   - **Tiap input field harus punya**:
     - Conditional border class: `border-red-500/50 focus:border-red-500` ketika ada error
     - Error message `<p>` di bawah input
     - Show/hide password toggle (termasuk confirm password — yang saat ini tidak punya toggle)

   - **Current Password field**: ikat ke `passwordForm.currentPassword`, tampilkan `passwordValidation.currentPassword` jika dirty.
   - **New Password field**: ikat ke `passwordForm.newPassword`, tampilkan `passwordValidation.newPassword` jika dirty.
   - **Confirm Password field**: ikat ke `passwordForm.confirmPassword`, tambahkan show/hide toggle (`showConfirmPassword`), tampilkan `passwordValidation.confirmPassword` jika dirty.

   - **Submit button**: ganti `@click="changePassword"` menjadi `@click="submitPassword"`, ganti `:disabled` ke `:disabled="!canSubmitPassword || isSubmittingPassword"`, sesuaikan label loading.

**Kriteria selesai**: Validasi per-field, error messages, server error banner, Transition pada success, show/hide toggle di semua 3 field, password baru != password lama.

---

### NICE TO HAVE (Boleh dikerjakan setelah Should Fix selesai)

---

#### [DONE] NTH-1: Implementasi Upload Avatar

**Masalah**: Tombol camera sudah ada (baris 155-157) tapi belum punya flow apapun. PRD bilang upload avatar masuk scope profile CS.

**Yang harus dilakukan**:

1. **Tambahkan state untuk avatar upload**:

   ```ts
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
       // tampilkan toast/error
       return
     }
     if (file.size > 2 * 1024 * 1024) {
       // tampilkan toast/error
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
   }

   const cancelAvatarChange = () => {
     avatarFile.value = null
     if (avatarPreview.value) {
       URL.revokeObjectURL(avatarPreview.value)
     }
     avatarPreview.value = null
   }
   ```

2. **Update template avatar area** (baris 147-158).
   Tambahkan hidden input dan modifikasi tombol:

   ```html
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
   <div v-if="avatarFile" class="flex items-center gap-2 mt-4">
     <button
       :disabled="isUploadingAvatar"
       class="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B6F500] text-black text-xs font-black uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(182,245,0,0.3)] disabled:opacity-50"
       @click="saveAvatar"
     >
       <Loader2 v-if="isUploadingAvatar" :size="12" class="animate-spin" />
       <Upload v-else :size="12" />
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
   ```

   Pastikan `Upload` dan `X` sudah di-import dari `lucide-vue-next`.

**Kriteria selesai**: Klik tombol camera membuka file picker. Preview avatar muncul. Ada tombol Save dan Cancel. Validasi tipe file dan ukuran.

---

#### [DONE] NTH-2: Tambahkan Loading dan Error State

**Masalah**: Halaman langsung menampilkan data tanpa state loading/error. Tidak kritis karena masih mock, tapi bagus untuk konsistensi UI dan persiapan ke API asli.

**Yang harus dilakukan**:

1. Tambahkan state:
   ```ts
   const isLoadingProfile = ref(false)
   const profileError = ref(false)
   ```

2. Tambahkan skeleton/loading indicator di awal page (sebelum grid). Ikuti pattern dari `dashboard/settings/index.vue` baris 214-226:
   ```html
   <div v-if="isLoadingProfile" class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-12 flex flex-col items-center justify-center gap-4">
     <Loader2 :size="32" class="animate-spin text-white/20" />
     <p class="text-sm font-bold text-white/30">Memuat data profil...</p>
   </div>
   ```

3. Tambahkan error state. Ikuti pattern dari `dashboard/settings/index.vue` baris 229-247:
   ```html
   <div v-else-if="profileError" class="bg-[#0a0a0a] border border-red-500/20 rounded-4xl p-12 flex flex-col items-center justify-center gap-4">
     <div class="bg-red-500/10 p-3 rounded-2xl">
       <AlertCircle :size="28" class="text-red-400" />
     </div>
     <div class="text-center">
       <p class="text-sm font-bold text-red-400">Gagal memuat data profil.</p>
       <p class="text-xs text-white/30 mt-1">Silakan coba muat ulang halaman.</p>
     </div>
   </div>
   ```

4. Grid utama dibungkus `v-else` agar tampil hanya saat data sudah loaded tanpa error.

**Kriteria selesai**: Ada 3 state — loading, error, dan loaded. Grid utama hanya muncul di state loaded.

---

#### [DONE] NTH-3: Tambah Toast Notification untuk Feedback User

**Masalah**: Save profile dan change password hanya punya inline success text. Akan lebih baik jika ada toast notification agar user mendapat feedback yang lebih jelas.

**Yang harus dilakukan**:

1. Gunakan `useToast()` dari Nuxt UI:
   ```ts
   const toast = useToast()
   ```

2. Pada `saveProfile()`, setelah berhasil:
   ```ts
   toast.add({
     title: 'Profil diperbarui',
     description: 'Perubahan berhasil disimpan.',
     color: 'green'
   })
   ```

3. Pada `submitPassword()`, setelah berhasil:
   ```ts
   toast.add({
     title: 'Password diperbarui',
     description: 'Password Anda berhasil diubah.',
     color: 'green'
   })
   ```

4. Untuk error (avatar validation, dll):
   ```ts
   toast.add({
     title: 'Upload gagal',
     description: 'File harus berupa gambar dan maksimal 2MB.',
     color: 'red'
   })
   ```

**Kriteria selesai**: Toast muncul saat save profile berhasil, change password berhasil, dan error validasi avatar.

---

#### [DONE] NTH-4: Password Strength Indicator

**Masalah**: Saat ini hanya ada validasi "minimal 8 karakter". Belum ada visual indicator kekuatan password.

**Yang harus dilakukan**:

1. Tambahkan computed untuk password strength:
   ```ts
   const passwordStrength = computed(() => {
     const pw = passwordForm.value.newPassword
     if (!pw) return { level: 0, label: '', color: '' }

     let score = 0
     if (pw.length >= 8) score++
     if (pw.length >= 12) score++
     if (/[A-Z]/.test(pw)) score++
     if (/[0-9]/.test(pw)) score++
     if (/[^A-Za-z0-9]/.test(pw)) score++

     if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' }
     if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' }
     if (score <= 3) return { level: 3, label: 'Good', color: 'bg-blue-500' }
     return { level: 4, label: 'Strong', color: 'bg-emerald-500' }
   })
   ```

2. Tambahkan indicator bar di bawah input new password:
   ```html
   <div v-if="passwordForm.newPassword" class="flex items-center gap-3 mt-2 ml-1">
     <div class="flex gap-1 flex-1">
       <div v-for="i in 4" :key="i"
         :class="['h-1 flex-1 rounded-full transition-colors', i <= passwordStrength.level ? passwordStrength.color : 'bg-white/10']"
       />
     </div>
     <span class="text-[10px] font-black uppercase tracking-widest" :class="passwordStrength.color.replace('bg-', 'text-')">
       {{ passwordStrength.label }}
     </span>
   </div>
   ```

**Kriteria selesai**: Bar indicator 4 segment muncul saat user mengetik password baru. Label berubah: Weak/Fair/Good/Strong.

---

## Urutan Pengerjaan yang Direkomendasikan

```
1. SF-1  (Mock data sinkronisasi) — fondasi, harus duluan
2. SF-2  (Branch & Username read-only) — cepat, 10 menit
3. SF-3  (Security flow) — paling banyak perubahan code
4. NTH-1 (Avatar upload) — fitur baru, mandiri
5. NTH-2 (Loading/Error state) — pola persiapan API
6. NTH-3 (Toast notification) — polish UX
7. NTH-4 (Password strength) — nice polish
```

## Panduan Style & Convention

- **Tailwind inline** — tidak pakai CSS modules terpisah. Semua styling di `class=""`.
- **Dark only** — bg `#050505`, surface `#0a0a0a`, text `white` dengan opacity. JANGAN tambahkan light mode.
- **Accent** — `#B6F500` untuk CTA, active state, highlight. Jangan pakai warna lain untuk primary actions.
- **Disabled field** — `bg-white/2 border-white/5 text-white/60 cursor-not-allowed`.
- **Label** — `text-[10px] font-black uppercase tracking-widest text-white/40 ml-2`.
- **Input aktif** — `bg-white/5 border-white/10 focus:outline-none focus:border-[#B6F500]`.
- **Rounded** — card: `rounded-4xl`, input: `rounded-xl`, avatar: `rounded-3xl`.
- **Section header** — icon box `bg-white/5 p-2 rounded-lg` + `font-black text-lg uppercase tracking-tight`.
- **CS shell classes** — gunakan `cs-shell-x` untuk horizontal padding, `cs-shell-container` untuk max-width, `cs-shell-main` untuk main area padding.
- **Comma dangle** — TIDAK pakai trailing comma (eslint rule `commaDangle: 'never'`).
- **Brace style** — `1tbs` (opening brace di baris yang sama).
- **Indent** — 2 spasi.

## Verifikasi

Setelah semua perubahan:
```bash
pnpm lint        # pastikan tidak ada lint error
pnpm typecheck   # pastikan tidak ada type error
pnpm dev         # cek visual di browser http://localhost:3000/cs/profile
```

Cek manual:
- [x] Profile card menampilkan data dari `MOCK_CS_USER_PROFILE`
- [x] Sidebar CS layout menampilkan nama & avatar yang konsisten
- [x] Name, Email, Phone bisa diedit; Branch dan Username tidak bisa
- [x] Ada helper text "dikelola oleh admin"
- [x] Change password punya validasi per-field lengkap
- [x] Success banner pakai Transition
- [x] Server error banner bisa muncul
- [x] Show/hide toggle ada di ketiga field password
- [x] (NTH) Tombol camera bisa buka file picker dan preview avatar
- [x] (NTH) Loading dan error state berfungsi
- [x] (NTH) Toast muncul untuk aksi berhasil/gagal
- [x] (NTH) Password strength indicator tampil


@prompt.md implementasikan bagian SHOUlD FIX saja.

workflow:
- buatkan branch baru.
- implementasikan bagian SHOUlD FIX saja.
- commit per task.
- jika sudah selesai semua baru push branch dan buatkan PR.