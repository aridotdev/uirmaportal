# Petunjuk Teknis Implementasi — RMA Portal (uirmaportal)

> **Terakhir diperbarui**: 7 April 2026 (aktual: Fase 1 & Fase 2 selesai)
> **Berdasarkan**: `prd.md`, `pages.md`, `prd-status-300326.md`, dan inspeksi kode aktual.
> **Tujuan**: Panduan utama bagi junior developer atau AI agent untuk **menyelesaikan finalisasi frontend** secara bertahap. Semua pekerjaan di dokumen ini menggunakan mock data — backend/API integration adalah fase terpisah yang **belum termasuk scope dokumen ini**.

---

## Daftar Isi

1. [Konteks Proyek](#1-konteks-proyek)
2. [Status Saat Ini](#2-status-saat-ini)
3. [Arsitektur & Konvensi](#3-arsitektur--konvensi)
4. [Fase Implementasi](#4-fase-implementasi)
5. [Fase 1 — Auth Flow & Route Protection](#5-fase-1--auth-flow--route-protection)
6. [Fase 2 — Notification Master Excel Import](#6-fase-2--notification-master-excel-import)
7. [Fase 3 — Penguatan Dashboard Parsial](#7-fase-3--penguatan-dashboard-parsial)
8. [Fase 4 — Standardisasi Shared Components](#8-fase-4--standardisasi-shared-components)
9. [Panduan Per File](#9-panduan-per-file)
10. [Referensi Pola Kode](#10-referensi-pola-kode)
11. [Testing & Validasi](#11-testing--validasi)
12. [Hal yang TIDAK Boleh Dilakukan](#12-hal-yang-tidak-boleh-dilakukan)

---

## 1. Konteks Proyek

### Apa Ini?

Sistem internal web app untuk proses **RMA (Return Merchandise Authorization)** klaim elektronik. Alur utama:

```
CS input claim → QRCC review foto → Approve/Reject → Batch ke vendor claim → Report
```

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Nuxt 4 (v4.4.2), Vue 3 Composition API |
| UI | Nuxt UI v4, TailwindCSS v4 |
| Tabel | TanStack Vue Table |
| Ikon | Lucide Vue Next |
| Validasi | Zod v4 |
| Chart | Unovis + nuxt-charts |
| Font | Plus Jakarta Sans |

> **Catatan**: Backend stack (Better-Auth, Drizzle ORM, SQLite) sudah disiapkan di `server/` tapi **bukan scope dokumen ini**. Semua halaman frontend saat ini dan yang akan diperbaiki menggunakan **mock data** (`ref([...])` / `mock-data.ts`).

### 4 Role Pengguna

| Role | Landing Page | Akses |
|------|-------------|-------|
| **CS** | `/cs` | Create/edit/track claim pribadi |
| **QRCC** | `/dashboard` | Review claim, approve/reject foto, vendor claim, master data |
| **MANAGEMENT** | `/dashboard` | Analytics, reports |
| **ADMIN** | `/dashboard` | Semua akses + user management |

### 2 Workspace

- **CS Workspace** (`/cs/*`): Shell sederhana, sidebar kecil. Layout: `app/layouts/cs.vue`.
- **Dashboard Workspace** (`/dashboard/*`): Full sidebar + topbar. Layout: `app/layouts/dashboard.vue`.

---

## 2. Status Saat Ini

### Sudah Selesai (Tidak Perlu Diubah)

| Area | Keterangan |
|------|-----------|
| CS Home (`/cs`) | Hero notification code, summary, entry point |
| CS Claims List (`/cs/claims`) | TanStack table, filter, search, pagination |
| CS Create Wizard (`/cs/claims/create`) | 3-step wizard, autosave, validation summary, drag/drop upload, sticky footer |
| CS Claim Detail (`/cs/claims/[id]`) | Header status, tabs, gallery, notes, history |
| CS Revision (`/cs/claims/[id]/edit`) | Side-by-side compare, wizard 3-step, marker revisi |
| CS Profile (`/cs/profile`) | Profile info + change password section |
| Auth Flow (`/`, `/login`, middleware) | Mock session cookie, role-based redirect, guard route, login validation/error/loading |
| Dashboard Home (`/dashboard`) | Role-aware widgets, KPI, CTA |
| Claims List (`/dashboard/claims`) | Full filter (status/vendor/branch/date/keyword), pagination |
| Claim Review Detail (`/dashboard/claims/[id]`) | 3 tabs, photo review, decision bar |
| Vendor Claims List (`/dashboard/vendor-claims`) | Filter status/vendor/period, pagination |
| Users (`/dashboard/users`) | Status filter, role filter, search, CRUD modal |
| Settings General (`/dashboard/settings`) | Route-based navigation, profile read-only |
| Settings Security (`/dashboard/settings/security`) | Change password form |
| Notification Master Excel Import (`/dashboard/master/notification`) | Import `.xlsx/.xls`, preview valid/invalid, import valid rows ke local ref + toast |
| Layout Dashboard | Role-aware sidebar, role switcher (dev) |
| Layout CS | Navigasi Home/My Claims/Profile |
| Shared: StatusBadge, PageHeader, FilterBar, LoadingState, EmptyState | Konsisten di list pages utama |

### Perlu Perbaikan (Scope Dokumen Ini)

> **Prinsip utama**: Semua perbaikan di bawah ini dikerjakan **murni di sisi frontend** menggunakan mock data. Tidak ada pembuatan API route atau integrasi database. Backend integration akan dilakukan di fase terpisah setelah frontend final.

| ID | Area | Prioritas | Estimasi |
|----|------|-----------|----------|
| VC-CREATE | Vendor claims create wizard enhancement | **P1 - High** | 1 hari |
| VC-DETAIL | Vendor claims detail enhancement | **P1 - High** | 1 hari |
| MASTER | Master data pages consistency (vendor rule editor, sorting) | **P2 - Medium** | 2 hari |
| REPORTS | Reports halaman utama fungsional | **P2 - Medium** | 1-2 hari |
| AUDIT | Audit trail export + date presets | **P2 - Medium** | 0.5 hari |
| COMP | Shared components (lightbox, stepper adoption, autosave) | **P3 - Low** | 1-2 hari |

---

## 3. Arsitektur & Konvensi

### Struktur Direktori

```
app/
├── app.vue                    # Root: UApp + NuxtLayout + NuxtPage
├── app.config.ts              # Theme: primary=green, neutral=slate
├── assets/css/main.css        # TailwindCSS + custom vars
├── layouts/
│   ├── cs.vue                 # CS workspace shell
│   └── dashboard.vue          # Dashboard workspace shell
├── components/                # Auto-imported, PascalCase
├── composables/               # Shared state & logic
│   ├── useDashboardStore.ts   # Dashboard role/user state
│   ├── useCsStore.ts          # CS CRUD state
│   ├── useClaimReview.ts      # QRCC review state machine
│   └── useAuditTrail.ts       # Audit trail data layer
├── pages/                     # File-based routing
├── utils/                     # Helper functions
│   ├── types.ts               # Frontend view model interfaces
│   ├── role-navigation.ts     # Sidebar menu per role
│   ├── status-config.ts       # Status visual config
│   ├── select-ui.ts           # Nuxt UI component theme overrides
│   ├── audit-trail-config.ts  # Audit trail UI config
│   └── mock-data.ts           # Mock data (1181 lines) — sumber data utama saat ini
└── test-fixtures/cs/          # CS mock data modular

shared/
└── utils/
    ├── constants.ts            # Enums, type guards, defaults
    └── fiscal.ts               # Fiscal period utilities (Japan FY)
```

> **Catatan**: Direktori `server/` (Drizzle schema, API routes) sudah ada tapi **tidak perlu disentuh** dalam scope dokumen ini.

### Konvensi Wajib

1. **Dark-only**: Background `#050505`, surface `#0a0a0a`, accent `#B6F500`. **Jangan** buat light mode.
2. **Bahasa kode**: Variabel, fungsi, interface dalam **English**. Komentar boleh Indonesian.
3. **PascalCase** untuk nama file komponen (`StatusBadge.vue`, bukan `status-badge.vue`).
4. **Layout assignment**: Setiap page harus punya `definePageMeta({ layout: 'dashboard' })` atau `layout: 'cs'`.
5. **Indent 2 space**, LF line endings, no trailing comma (`commaDangle: 'never'`).
6. **Brace style**: `1tbs` (opening brace di baris yang sama).
7. **Import enums** dari `shared/utils/constants.ts`, jangan hardcode string status.
8. **Zod** untuk semua validasi form di frontend.
9. **Soft delete**: Gunakan `isActive` flag untuk master data, `ARCHIVED` status untuk claims.
10. **Mock data**: Semua data tetap menggunakan `ref([...])` atau import dari `mock-data.ts`. Jangan buat API route baru.

### Design System Colors

```
Status semantics:
- neutral/gray  → DRAFT, inactive, muted
- blue          → SUBMITTED, CREATED
- indigo        → IN_REVIEW
- amber/orange  → NEED_REVISION, PROCESSING
- emerald/green → APPROVED, VERIFIED, COMPLETED
- red           → REJECT, destructive actions
- white/muted   → ARCHIVED
```

---

## 4. Fase Implementasi

```
Fase 1 (P0) ✅ → Auth Flow & Route Protection (mock session, bukan Better-Auth)
    ↓
Fase 2 (P1) ✅ → Notification Master Excel Import (parsing di browser, data masuk ke ref)
    ↓
Fase 3 (P1) → Penguatan Dashboard Parsial (VC Create, VC Detail, Master Data, Reports, Audit)
    ↓
Fase 4 (P3) → Standardisasi Shared Components
```

Setiap fase bersifat **independen** dan bisa dikerjakan tanpa menunggu fase lain selesai.

> **Setelah Fase 1-4 selesai**, frontend dianggap **final sebagai UI prototype**. Backend integration (API routes, Drizzle, Better-Auth) akan dikerjakan di dokumen teknis terpisah.

---

## 5. Fase 1 — Auth Flow & Route Protection

> **Status aktual**: ✅ **Selesai diimplementasikan**.

> **Penting**: Fase ini menggunakan **mock authentication** (hardcoded users di composable + cookie). Tidak ada integrasi Better-Auth atau API route. Tujuannya murni agar flow UI login/redirect/guard bisa diuji secara visual dan fungsional.

### Konteks

Kondisi awal (sebelum implementasi):
- `app/pages/index.vue` hanya splash screen animasi, tidak ada redirect.
- `app/pages/login.vue` form statis, klik langsung `navigateTo('cs')` tanpa validasi.
- Tidak ada middleware auth.
- Tidak ada session management.

### Target

1. `/` membaca session → redirect ke landing page sesuai role, atau ke `/login` jika belum login.
2. `/login` memiliki form yang divalidasi, error state, loading state, dan redirect role-based.
3. Middleware melindungi route CS dan dashboard dari akses tanpa session.

### Task 1.1 — Auth Middleware

**File**: `app/middleware/auth.global.ts` (buat baru)

```typescript
// Mock auth middleware — menggunakan cookie session dari useAuthSession composable
export default defineNuxtRouteMiddleware((to) => {
  // Public routes yang tidak perlu auth
  const publicRoutes = ['/login']
  if (publicRoutes.includes(to.path)) return

  // Cek session (untuk saat ini bisa pakai mock)
  const session = useAuthSession() // composable yang akan dibuat
  
  if (!session.value) {
    return navigateTo('/login')
  }

  // Role-based route guard
  const role = session.value.role
  if (to.path.startsWith('/cs') && role !== 'CS') {
    return navigateTo('/dashboard')
  }
  if (to.path.startsWith('/dashboard') && role === 'CS') {
    return navigateTo('/cs')
  }
})
```

**Catatan penting**: Ini adalah **mock auth** murni — tidak ada panggilan ke backend. Session disimpan di cookie agar SSR-safe. Nanti saat backend integration, tinggal ganti isi fungsi `login()` dengan panggilan ke Better-Auth.

### Task 1.2 — Auth Composable (Mock-First)

**File**: `app/composables/useAuthSession.ts` (buat baru)

```typescript
interface AuthUser {
  id: string
  name: string
  email: string
  role: 'CS' | 'QRCC' | 'MANAGEMENT' | 'ADMIN'
  branch: string
}

interface AuthSession {
  user: AuthUser
  token: string
}

// State persisted di cookie agar SSR-safe
export function useAuthSession() {
  const session = useCookie<AuthSession | null>('auth-session', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 7 // 7 hari
  })

  function login(username: string, password: string): Promise<AuthSession> {
    // Mock auth — hardcoded users, no API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockUsers: Record<string, AuthUser> = {
          'cs1': { id: '1', name: 'Andi CS', email: 'andi@rma.id', role: 'CS', branch: 'Jakarta' },
          'qrcc1': { id: '2', name: 'Budi QRCC', email: 'budi@rma.id', role: 'QRCC', branch: 'Jakarta' },
          'mgmt1': { id: '3', name: 'Citra Mgmt', email: 'citra@rma.id', role: 'MANAGEMENT', branch: 'Jakarta' },
          'admin1': { id: '4', name: 'Dian Admin', email: 'dian@rma.id', role: 'ADMIN', branch: 'Jakarta' }
        }
        const user = mockUsers[username]
        if (user && password === 'password') {
          const s: AuthSession = { user, token: 'mock-token-' + Date.now() }
          session.value = s
          resolve(s)
        } else {
          reject(new Error('Invalid credentials'))
        }
      }, 800)
    })
  }

  function logout() {
    session.value = null
    return navigateTo('/login')
  }

  function getLandingPage(): string {
    if (!session.value) return '/login'
    return session.value.user.role === 'CS' ? '/cs' : '/dashboard'
  }

  return { session, login, logout, getLandingPage }
}
```

### Task 1.3 — Perbaiki `app/pages/index.vue`

**Hapus** semua konten splash screen. Ganti dengan:

```vue
<script setup lang="ts">
const { session, getLandingPage } = useAuthSession()

// Redirect langsung berdasarkan session
definePageMeta({ layout: false })

onMounted(() => {
  navigateTo(getLandingPage(), { replace: true })
})
</script>

<template>
  <div class="min-h-screen bg-[#050505] flex items-center justify-center">
    <div class="animate-pulse text-white/50 text-sm">Redirecting...</div>
  </div>
</template>
```

### Task 1.4 — Perbaiki `app/pages/login.vue` dengan `UAuthForm` + Zod

Ganti form statis saat ini dengan komponen `UAuthForm` dari Nuxt UI v4. Komponen ini menangani state form secara internal, validasi via Zod schema, loading state otomatis, dan slot untuk customization — sehingga kode jauh lebih ringkas.

**Prinsip**: Pertahankan **seluruh design style yang sudah ada** (background `#050505`, glow orbs, glassmorphism card `rounded-[40px]`, branding header RMA SYSTEM, warna accent `#B6F500`). Yang diganti **hanya** bagian form fields + button di dalam card, menggunakan `UAuthForm`.

**File**: `app/pages/login.vue` — rewrite

```vue
<script setup lang="ts">
import { z } from 'zod'
import { Package } from 'lucide-vue-next'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

definePageMeta({ layout: false })

const { login, getLandingPage } = useAuthSession()

const errorMessage = ref('')
const isLoading = ref(false)

// --- Zod schema ---
const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember: z.boolean().optional()
})

type LoginSchema = z.output<typeof loginSchema>

// --- UAuthForm fields ---
const fields: AuthFormField[] = [
  {
    name: 'username',
    type: 'text',
    label: 'Username',
    placeholder: 'Masukkan username',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: '••••••••',
    required: true
  },
  {
    name: 'remember',
    type: 'checkbox',
    label: 'Ingat Sesi'
  }
]

// --- Submit handler ---
async function onSubmit(payload: FormSubmitEvent<LoginSchema>) {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await login(payload.data.username, payload.data.password)
    navigateTo(getLandingPage(), { replace: true })
  } catch {
    errorMessage.value = 'Username atau password salah'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <!-- Background Glow Orbs (pertahankan dari design existing) -->
      <div class="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#B6F500]/10 blur-[120px] rounded-full animate-pulse" />
      <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />

      <!-- Glassmorphism Card (pertahankan style existing) -->
      <div class="w-full max-w-md p-10 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] shadow-2xl relative z-10">

        <!-- Branding Header (pertahankan dari design existing) -->
        <div class="flex flex-col items-center mb-10">
          <div class="w-16 h-16 bg-[#B6F500] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(182,245,0,0.4)]">
            <Package :size="32" class="text-black" />
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight">
            RMA <span class="text-[#B6F500]">SYSTEM</span>
          </h1>
          <p class="text-white/40 mt-2 font-medium">
            Portal Operasional Internal
          </p>
        </div>

        <!-- UAuthForm — mengganti form statis -->
        <UAuthForm
          :schema="loginSchema"
          :fields="fields"
          :loading="isLoading"
          :submit="{ label: 'MASUK SEKARANG', block: true }"
          :ui="{
            root: 'space-y-6',
            form: 'space-y-5',
            footer: 'text-center text-[10px] text-white/20 uppercase tracking-[0.2em] mt-6'
          }"
          @submit="onSubmit"
        >
          <!-- Slot: error validation -->
          <template #validation>
            <div
              v-if="errorMessage"
              class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center"
            >
              {{ errorMessage }}
            </div>
          </template>

          <!-- Slot: forgot password link di bawah field password -->
          <template #password-hint>
            <span class="text-xs text-white/40 hover:text-[#B6F500] transition-colors cursor-pointer">
              Lupa Password?
            </span>
          </template>

          <!-- Slot: footer -->
          <template #footer>
            Build version 4.0.1-stable
          </template>
        </UAuthForm>
      </div>
    </div>
  </div>
</template>

<style>
/* Pertahankan custom scrollbar dari design existing */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(182, 245, 0, 0.1); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(182, 245, 0, 0.3); }
</style>
```

**Penjelasan keputusan**:

| Aspek | Sebelum (statis) | Sesudah (UAuthForm) |
|-------|-----------------|---------------------|
| State form | Tidak ada `v-model` | Dikelola internal oleh `UAuthForm` |
| Validasi | Tidak ada | Zod schema via prop `:schema` — error per-field otomatis |
| Loading | Tidak ada | Prop `:loading` + `loadingAuto` bawaan komponen |
| Error login | Tidak ada | Slot `#validation` untuk pesan error custom |
| Submit | `@click="navigateTo('cs')"` | `@submit` event dengan typed payload `FormSubmitEvent<LoginSchema>` |
| Forgot password | Dead link `href="#"` | Slot `#password-hint` |
| Design | Glassmorphism card + glow orbs | **Sama persis** — hanya form fields yang diganti |
| Styling form | Manual CSS per input | Prop `:ui` untuk override slot classes + Nuxt UI theme config |

**Styling override (opsional)**: Jika default input styling dari Nuxt UI terlalu berbeda dari glassmorphism look existing, tambahkan override di `app/app.config.ts`:

```typescript
// app/app.config.ts — tambahkan di dalam ui object
export default defineAppConfig({
  ui: {
    // ... existing config
    authForm: {
      slots: {
        root: 'space-y-6',
        form: 'space-y-5',
        footer: 'text-center text-[10px] text-white/20 uppercase tracking-[0.2em] mt-6'
      }
    }
  }
})
```

> **Catatan**: `UAuthForm` tidak punya prop `title`/`icon` bawaan yang wajib — kita **tidak menggunakan** prop tersebut karena branding header sudah custom (logo Package + "RMA SYSTEM"). Header diletakkan di **luar** `UAuthForm`, di dalam card wrapper.

### Task 1.5 — Integrasikan Session ke Layout

Di `app/layouts/dashboard.vue` dan `app/layouts/cs.vue`, ganti mock user data dengan data dari `useAuthSession()`:

```typescript
const { session, logout } = useAuthSession()
const currentUser = computed(() => session.value?.user)
```

Dan di user menu/avatar, gunakan `currentUser` sebagai sumber data + tombol logout yang memanggil `logout()`.

### Kriteria Selesai Fase 1

- [x] Buka `/` → redirect ke `/login` jika belum login, atau ke landing page jika sudah login
- [x] Login page menggunakan `UAuthForm` dengan Zod schema validation
- [x] Submit form kosong → error inline per field muncul otomatis dari Zod
- [x] Login dengan username valid → redirect ke landing sesuai role
- [x] Login dengan credential salah → error message muncul di slot `#validation`
- [x] Tombol login menunjukkan loading state saat proses (prop `:loading`)
- [x] Akses `/cs/*` tanpa session → redirect ke `/login`
- [x] Akses `/dashboard/*` tanpa session → redirect ke `/login`
- [x] CS role tidak bisa akses `/dashboard/*`, dan sebaliknya
- [x] Logout menghapus session dan kembali ke `/login`
- [x] Design glassmorphism card, glow orbs, dan branding "RMA SYSTEM" tetap utuh
- [x] `pnpm build` berhasil tanpa error

---

## 6. Fase 2 — Notification Master Excel Import

> **Status aktual**: ✅ **Selesai diimplementasikan**.

### Konteks

File: `app/pages/dashboard/master/notification.vue`.
CRUD dasar sudah ada, dan flow import Excel dengan preview hasil sudah berjalan.

### Target

Tambahkan fitur "Import Excel" yang (semua client-side, tanpa API):
1. User klik tombol Import → modal muncul.
2. User upload file `.xlsx` atau `.xls`.
3. Browser mem-parsing file dengan SheetJS, menampilkan preview tabel.
4. User review baris yang valid vs invalid.
5. User konfirmasi → data ditambahkan ke `ref([...])` local (mock).

### Task 2.1 — Install Library Parser

```bash
pnpm add xlsx
```

Library `xlsx` (SheetJS) digunakan untuk parsing Excel di browser tanpa perlu backend.

### Task 2.2 — Buat Komponen ImportExcelModal

**File**: `app/components/ImportExcelModal.vue` (buat baru)

Props & emits:

```typescript
interface ImportColumn {
  key: string
  label: string
  required: boolean
}

interface Props {
  open: boolean
  columns: ImportColumn[]       // kolom yang diharapkan
  validateRow?: (row: Record<string, any>) => string | null  // return error message or null
}

const emit = defineEmits<{
  close: []
  import: [rows: Record<string, any>[]]
}>()
```

Fitur yang harus ada:

1. **Upload zone**: drag & drop atau click, hanya terima `.xlsx/.xls`.
2. **Parsing**: Gunakan `XLSX.read()` → ambil sheet pertama → convert ke JSON array.
3. **Column mapping**: Auto-detect header row, highlight jika kolom required tidak ditemukan.
4. **Preview table**: Tampilkan semua baris dengan indikator valid (hijau) / invalid (merah + pesan error).
5. **Summary**: `X baris valid, Y baris invalid`.
6. **Tombol**: "Import Valid Rows" (disabled jika 0 valid) dan "Cancel".

Template structure:

```html
<UModal :open="open" @close="emit('close')">
  <!-- Step 1: Upload -->
  <div v-if="!parsedRows.length">
    <div class="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer"
         @click="triggerFileInput" @dragover.prevent @drop="handleDrop">
      <input ref="fileInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleFile" />
      Upload file Excel (.xlsx / .xls)
    </div>
  </div>

  <!-- Step 2: Preview -->
  <div v-else>
    <div class="text-sm mb-4">
      <span class="text-emerald-400">{{ validCount }} valid</span>
      <span class="text-red-400 ml-3">{{ invalidCount }} invalid</span>
    </div>
    <div class="max-h-[400px] overflow-auto">
      <table> <!-- preview rows --> </table>
    </div>
    <div class="flex justify-end gap-3 mt-4">
      <UButton variant="ghost" @click="reset">Reset</UButton>
      <UButton :disabled="validCount === 0" @click="confirmImport">
        Import {{ validCount }} Rows
      </UButton>
    </div>
  </div>
</UModal>
```

### Task 2.3 — Integrasikan ke Notification Master Page

Di `app/pages/dashboard/master/notification.vue`:

1. Tambahkan state:
   ```typescript
   const showImportModal = ref(false)
   ```

2. Tambahkan tombol di area header/action:
   ```html
   <UButton icon="i-lucide-upload" @click="showImportModal = true">
     Import Excel
   </UButton>
   ```

3. Definisikan kolom yang diharapkan:
   ```typescript
   const importColumns: ImportColumn[] = [
     { key: 'notificationCode', label: 'Notification Code', required: true },
     { key: 'notificationDate', label: 'Date', required: true },
     { key: 'productModel', label: 'Product Model', required: false },
     { key: 'branch', label: 'Branch', required: false },
     { key: 'vendor', label: 'Vendor', required: false }
   ]
   ```

4. Handler import (mutasi ke local ref, bukan API):
   ```typescript
   function handleImportRows(rows: Record<string, any>[]) {
     // Map rows ke NotificationRecord format
     // Cek duplikat notificationCode terhadap data existing di notificationList ref
     // Tambahkan ke notificationList ref (mock, client-side only)
     // Tampilkan toast: "X notification berhasil diimport"
     showImportModal.value = false
   }
   ```

### Kriteria Selesai Fase 2

- [x] Tombol "Import Excel" muncul di halaman notification master
- [x] Modal upload menerima file .xlsx dan .xls
- [x] File diparsing dan preview tabel muncul dengan baris valid/invalid
- [x] Baris tanpa `notificationCode` ditandai invalid
- [x] Klik "Import" menambahkan baris valid ke tabel utama
- [x] Toast muncul setelah import berhasil
- [x] Modal bisa di-reset dan dipakai ulang
- [x] `pnpm build` berhasil tanpa error

---

## 7. Fase 3 — Penguatan Dashboard Parsial

### 3A. Vendor Claim Create Wizard Enhancement

**File**: `app/pages/dashboard/vendor-claims/create.vue` (573 baris)

**Gap**: Wizard sudah berfungsi, tapi informasi seleksi dan ringkasan batch belum cukup kuat.

**Perubahan yang diperlukan**:

1. **Step 2 — Tambahkan summary bar di atas list klaim**:
   ```html
   <div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl mb-4">
     <div>Selected: <strong>{{ selectedClaims.length }}</strong> / {{ eligibleClaims.length }}</div>
     <div>Unique Models: <strong>{{ uniqueModels }}</strong></div>
     <div>Unique Defects: <strong>{{ uniqueDefects }}</strong></div>
     <div>Branches: <strong>{{ uniqueBranches }}</strong></div>
   </div>
   ```

2. **Step 3 — Tambahkan estimasi output box**:
   ```html
   <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
     <h4 class="text-blue-400 font-semibold text-sm mb-2">Output Estimasi</h4>
     <ul class="text-sm text-white/60 space-y-1">
       <li>Vendor Claim Number: VC-{{ currentYYYYMM }}-XXX (auto-generated)</li>
       <li>Total items: {{ selectedClaims.length }}</li>
       <li>File Excel akan otomatis di-generate setelah batch dibuat</li>
     </ul>
   </div>
   ```

3. **Ganti inline stepper dengan `WorkflowStepper` component**:
   ```html
   <WorkflowStepper
     :steps="3"
     :current-step="currentStep"
     :labels="['Pilih Vendor', 'Pilih Klaim', 'Review & Generate']"
   />
   ```

4. **Tambahkan "Save as Draft" option** di sticky footer:
   ```html
   <StickyActionBar>
     <template #left>
       <UButton variant="ghost" @click="saveAsDraft">Save as Draft</UButton>
     </template>
     <UButton @click="generate" :loading="isGenerating">Generate Vendor Claim</UButton>
   </StickyActionBar>
   ```

### 3B. Vendor Claim Detail Enhancement

**File**: `app/pages/dashboard/vendor-claims/[id].vue` (576 baris)

**Perubahan yang diperlukan**:

1. **Tambahkan summary area yang lebih prominent**:
   ```html
   <!-- Di bagian atas, setelah header -->
   <div class="grid grid-cols-4 gap-4">
     <StatsCard label="Total Items" :value="batch.items.length" icon="i-lucide-package" />
     <StatsCard label="Accepted" :value="acceptedCount" icon="i-lucide-check-circle" color="emerald" />
     <StatsCard label="Rejected" :value="rejectedCount" icon="i-lucide-x-circle" color="red" />
     <StatsCard label="Total Compensation" :value="formatCurrency(totalCompensation)" icon="i-lucide-banknote" color="amber" />
   </div>
   ```

2. **Tambahkan "Complete Batch" button** yang muncul ketika semua item sudah punya keputusan:
   ```typescript
   const allDecided = computed(() => batch.items.every(i => i.decision !== null))
   ```
   ```html
   <UButton v-if="allDecided && batch.status !== 'COMPLETED'" @click="completeBatch">
     Complete Batch
   </UButton>
   ```

3. **Tambahkan claim number sebagai link** ke detail claim:
   ```html
   <NuxtLink :to="`/dashboard/claims/${item.claimId}`" class="text-[#B6F500] hover:underline">
     {{ item.claimNumber }}
   </NuxtLink>
   ```

4. **Gunakan route param** untuk load data dari mock:
   ```typescript
   const route = useRoute()
   const batchId = route.params.id as string
   // Cari dari mock data berdasarkan ID
   const batch = computed(() => mockBatches.find(b => b.id === batchId))
   ```

### 3C. Master Data Consistency

**File yang terkait**: `vendor.vue`, `product-model.vue`, `defect.vue` (masing-masing ~800-886 baris)

**Perubahan seragam untuk ketiga halaman**:

1. **Tambahkan column sorting** di TanStack table:
   ```typescript
   import { getSortedRowModel } from '@tanstack/vue-table'
   
   const table = useVueTable({
     // ... existing config
     getSortedRowModel: getSortedRowModel(),
     state: {
       get sorting() { return sorting.value }
     },
     onSortingChange: (updater) => {
       sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
     }
   })
   ```

2. **Tambahkan `definePageMeta({ layout: 'dashboard' })`** jika belum ada.

3. **Tambahkan Zod validation** pada form modal upsert:
   ```typescript
   // Contoh untuk vendor
   const vendorSchema = z.object({
     code: z.string().min(1, 'Code wajib diisi').max(10),
     name: z.string().min(1, 'Name wajib diisi').max(100),
     requiredPhotos: z.array(z.string()).min(1, 'Minimal 1 foto type'),
     requiredFields: z.array(z.string())
   })
   ```

4. **Untuk Vendor Master khusus** — perkuat rule editor `requiredPhotos` dan `requiredFields`:
   - Tampilkan sebagai checklist/toggle yang jelas, bukan hanya chip/tag
   - Tambahkan tooltip penjelasan untuk setiap photo type
   - Preview: "Vendor ini memerlukan 4 jenis foto dan 2 field tambahan"

### 3D. Reports Main Page

**File**: `app/pages/dashboard/reports.vue` + `app/pages/dashboard/reports/index.vue`

**Gap utama**: Halaman reports sudah lebih kaya dari spec (7 sub-tab), tapi belum berfungsi sebagai Claim Status Report utama dengan filter, table, dan export.

**Perubahan di `reports/index.vue`** (overview sub-page):

1. **Fungsikan filter period/branch/vendor**:
   ```typescript
   const filteredData = computed(() => {
     let data = rawReportData.value
     if (selectedVendor.value) {
       data = { ...data, /* filter claims by vendor */ }
     }
     if (selectedBranch.value) {
       data = { ...data, /* filter claims by branch */ }
     }
     // Recalculate KPI berdasarkan filtered data
     return recalculateKpis(data)
   })
   ```

2. **Tambahkan detail report table** di bawah KPI cards:
   ```html
   <!-- Claim Status Report Table -->
   <SectionCard title="Claim Detail Report">
     <table class="w-full text-sm">
       <thead>
         <tr>
           <th>Claim Number</th>
           <th>Vendor</th>
           <th>Model</th>
           <th>Notification</th>
           <th>Branch</th>
           <th>Status</th>
           <th>Submitted By</th>
           <th>Created At</th>
         </tr>
       </thead>
       <!-- ... rows dari filteredClaims -->
     </table>
   </SectionCard>
   ```

3. **Tambahkan Export CSV button**:
   ```typescript
   function exportCSV() {
     const headers = ['Claim Number', 'Vendor', 'Model', 'Branch', 'Status', 'Created']
     const rows = filteredClaims.value.map(c => [c.claimNumber, c.vendor, c.model, c.branch, c.status, c.createdAt])
     const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
     const blob = new Blob([csv], { type: 'text/csv' })
     const url = URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url
     a.download = `claim-report-${new Date().toISOString().slice(0, 10)}.csv`
     a.click()
     URL.revokeObjectURL(url)
   }
   ```

### 3E. Audit Trail Enhancement

**File**: `app/pages/dashboard/audit-trail.vue` (579 baris)

Halaman ini sudah relatif kuat. Hanya perlu:

1. **Tambahkan date range presets** di filter:
   ```typescript
   const datePresets = [
     { label: 'Today', getValue: () => ({ from: today, to: today }) },
     { label: 'Last 7 days', getValue: () => ({ from: subDays(today, 7), to: today }) },
     { label: 'This month', getValue: () => ({ from: startOfMonth(today), to: today }) },
     { label: 'This fiscal half', getValue: () => getFiscalHalfRange(today) }
   ]
   ```

2. **Tambahkan Export CSV** (pola sama dengan Reports di atas).

3. **Tambahkan event detail** — saat klik baris, tampilkan drawer/modal berisi:
   - Full timestamp
   - Claim info (number, vendor, model)
   - Actor info (name, role, branch)
   - Action description
   - Status transition detail
   - Note lengkap

### Kriteria Selesai Fase 3

- [x] VC Create: summary bar di step 2, estimasi output di step 3, pakai WorkflowStepper
- [x] VC Detail: stats cards prominent, "Complete Batch" button, claim number link
- [x] Master pages: column sorting berfungsi, Zod validation di form, definePageMeta
- [x] Vendor master: rule editor requiredPhotos/requiredFields lebih jelas
- [ ] Reports: filter period/branch/vendor fungsional, detail table, export CSV
- [ ] Audit: date presets, export CSV
- [ ] `pnpm build` berhasil tanpa error

---

## 8. Fase 4 — Standardisasi Shared Components

### 4A. Adopt WorkflowStepper di Semua Wizard

**File**: `app/components/WorkflowStepper.vue` (68 baris, sudah ada)

Saat ini komponen ini **tidak dipakai** oleh halaman wizard manapun. Setiap wizard punya stepper custom inline.

**Aksi**: Ganti inline stepper di halaman berikut dengan `<WorkflowStepper>`:
- `app/pages/cs/claims/create.vue`
- `app/pages/cs/claims/[id]/edit.vue`
- `app/pages/dashboard/vendor-claims/create.vue`

### 4B. Photo Lightbox Component

**File**: `app/components/PhotoLightbox.vue` (sudah ada, perlu diverifikasi)

Pastikan komponen ini mendukung:
- Full-screen overlay
- Zoom in/out (scroll atau pinch)
- Navigate prev/next jika multiple photos
- Close button dan Escape key
- Lazy loading image

Jika belum cukup, perkuat. Lalu integrasikan di:
- `app/pages/cs/claims/[id]/index.vue` (claim detail gallery)
- `app/pages/dashboard/claims/[id].vue` (photo review tab)

### 4C. Autosave Indicator Component

**File**: `app/components/AutosaveIndicator.vue` (buat baru)

```vue
<script setup lang="ts">
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const props = defineProps<{
  status: SaveStatus
  lastSaved?: Date
}>()
</script>

<template>
  <div class="flex items-center gap-2 text-xs">
    <template v-if="status === 'saving'">
      <div class="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span class="text-amber-400">Saving...</span>
    </template>
    <template v-else-if="status === 'saved'">
      <div class="w-2 h-2 rounded-full bg-emerald-400" />
      <span class="text-emerald-400/70">Saved</span>
    </template>
    <template v-else-if="status === 'error'">
      <div class="w-2 h-2 rounded-full bg-red-400" />
      <span class="text-red-400">Save failed</span>
    </template>
  </div>
</template>
```

Integrasikan di:
- `app/pages/cs/claims/create.vue` (sudah punya autosave indicator inline, extract ke komponen ini)
- `app/pages/cs/claims/[id]/edit.vue`

### 4D. StickyActionBar Adoption

**File**: `app/components/StickyActionBar.vue` (30 baris, sudah ada)

Pastikan dipakai secara konsisten di semua halaman yang butuh action bar tetap:
- CS create claim ✅ (sudah pakai)
- CS revision
- Dashboard claim review detail
- Vendor claim create wizard
- Vendor claim detail (untuk "Complete Batch")

### Kriteria Selesai Fase 4

- [x] WorkflowStepper dipakai di ketiga wizard page
- [ ] PhotoLightbox berfungsi dengan zoom, prev/next, keyboard support
- [ ] AutosaveIndicator jadi komponen terpisah dan dipakai di CS create + edit
- [x] StickyActionBar dipakai konsisten di semua halaman yang memerlukan
- [ ] `pnpm build` berhasil tanpa error

---

## 9. Panduan Per File

Tabel referensi cepat untuk setiap file yang perlu dikerjakan:

| File | Fase | Aksi Utama | Tingkat Kesulitan |
|------|------|-----------|-------------------|
| `app/middleware/auth.global.ts` | 1 | Buat baru: route guard + role check | Mudah |
| `app/composables/useAuthSession.ts` | 1 | Buat baru: mock auth → Better-Auth later | Mudah |
| `app/pages/index.vue` | 1 | Rewrite: splash → auth redirect | Mudah |
| `app/pages/login.vue` | 1 | Rewrite: UAuthForm + Zod schema, pertahankan glassmorphism design | Sedang |
| `app/layouts/dashboard.vue` | 1 | Patch: ganti mock user → useAuthSession | Mudah |
| `app/layouts/cs.vue` | 1 | Patch: ganti mock user → useAuthSession | Mudah |
| `app/components/ImportExcelModal.vue` | 2 | Buat baru: upload, parse xlsx, preview, confirm | Sedang |
| `app/pages/dashboard/master/notification.vue` | 2 | Enhance: tambah import button + modal integration | Mudah |
| `app/pages/dashboard/vendor-claims/create.vue` | 3A | Enhance: summary bar, estimasi, WorkflowStepper | Sedang |
| `app/pages/dashboard/vendor-claims/[id].vue` | 3B | Enhance: stats cards, complete batch, claim link | Sedang |
| `app/pages/dashboard/master/vendor.vue` | 3C | Enhance: sorting, Zod, rule editor UX | Sedang |
| `app/pages/dashboard/master/product-model.vue` | 3C | Enhance: sorting, Zod, definePageMeta | Mudah |
| `app/pages/dashboard/master/defect.vue` | 3C | Enhance: sorting, Zod, definePageMeta | Mudah |
| `app/pages/dashboard/reports/index.vue` | 3D | Enhance: fungsikan filter, detail table, export | Sedang |
| `app/pages/dashboard/audit-trail.vue` | 3E | Enhance: date presets, export CSV | Mudah |
| `app/components/AutosaveIndicator.vue` | 4 | Buat baru: status indicator component | Mudah |
| `app/pages/cs/claims/create.vue` | 4 | Refactor: ganti inline stepper → WorkflowStepper | Mudah |
| `app/pages/cs/claims/[id]/edit.vue` | 4 | Refactor: ganti inline stepper → WorkflowStepper | Mudah |

---

## 10. Referensi Pola Kode

### Pola TanStack Table dengan Sorting

```typescript
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type SortingState
} from '@tanstack/vue-table'

const sorting = ref<SortingState>([])

const columnHelper = createColumnHelper<YourType>()
const columns = [
  columnHelper.accessor('name', {
    header: 'Name',
    enableSorting: true,
    cell: (info) => info.getValue()
  }),
  // ... more columns
]

const table = useVueTable({
  get data() { return filteredData.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get sorting() { return sorting.value }
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater
  }
})
```

### Pola Filter + Debounced Search

```typescript
const searchQuery = ref('')
const statusFilter = ref<string>('ALL')
const debouncedSearch = ref('')

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = val
  }, 250)
})

const filteredData = computed(() => {
  let result = rawData.value
  
  // Status filter
  if (statusFilter.value !== 'ALL') {
    result = result.filter(item => item.status === statusFilter.value)
  }
  
  // Search filter
  if (debouncedSearch.value) {
    const q = debouncedSearch.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    )
  }
  
  return result
})
```

### Pola Zod Form Validation

```typescript
import { z } from 'zod'

const schema = z.object({
  code: z.string().min(1, 'Code wajib diisi').max(10, 'Max 10 karakter'),
  name: z.string().min(1, 'Name wajib diisi'),
  isActive: z.boolean().default(true)
})

type FormData = z.infer<typeof schema>

const formData = ref<Partial<FormData>>({})
const formErrors = ref<Record<string, string>>({})

function validate(): boolean {
  formErrors.value = {}
  const result = schema.safeParse(formData.value)
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    return false
  }
  return true
}

async function handleSubmit() {
  if (!validate()) return
  // proceed with submit
}
```

### Pola UAuthForm + Zod (Nuxt UI v4)

Gunakan pola ini untuk halaman login dan form auth lainnya:

```typescript
import { z } from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'

// 1. Definisikan Zod schema
const schema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember: z.boolean().optional()
})
type Schema = z.output<typeof schema>

// 2. Definisikan fields (UAuthForm membangun input secara otomatis dari array ini)
const fields: AuthFormField[] = [
  { name: 'username', type: 'text', label: 'Username', placeholder: 'Masukkan username', required: true },
  { name: 'password', type: 'password', label: 'Password', placeholder: '••••••••', required: true },
  { name: 'remember', type: 'checkbox', label: 'Ingat Sesi' }
]

// 3. Handler submit — payload sudah ter-validasi oleh Zod
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  // payload.data berisi data yang sudah valid
  await doSomething(payload.data.username, payload.data.password)
}
```

```html
<!-- 4. Template — UAuthForm menangani state, validasi, dan error display secara internal -->
<UAuthForm
  :schema="schema"
  :fields="fields"
  :loading="isLoading"
  :submit="{ label: 'Submit', block: true }"
  @submit="onSubmit"
>
  <!-- Slot #validation untuk error custom (misal: wrong credential) -->
  <template #validation>
    <div v-if="errorMsg" class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
      {{ errorMsg }}
    </div>
  </template>

  <!-- Slot #password-hint untuk link "Lupa Password?" -->
  <template #password-hint>
    <NuxtLink to="#" class="text-xs text-primary">Lupa Password?</NuxtLink>
  </template>

  <!-- Slot #footer untuk konten di bawah form -->
  <template #footer>
    <span>Footer text</span>
  </template>
</UAuthForm>
```

**Kapan pakai UAuthForm vs UForm manual**:
- **UAuthForm**: Untuk halaman login, register, reset password — form sederhana dengan fields standar.
- **UForm manual**: Untuk form kompleks seperti wizard claim create, vendor claim create, master data CRUD modal.

### Pola Status Badge Usage

```html
<StatusBadge variant="claim" :status="item.status" size="sm" />
<StatusBadge variant="photo" :status="photo.status" />
<StatusBadge variant="vendor-claim" :status="batch.status" show-dot />
```

### Pola Export CSV (Client-Side)

```typescript
function exportCSV(headers: string[], rows: string[][], filename: string) {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## 11. Testing & Validasi

### Checklist Validasi Per Fase

Setelah menyelesaikan setiap fase, jalankan:

```bash
# 1. Type check
pnpm typecheck

# 2. Lint check
pnpm lint

# 3. Build check
pnpm build

# 4. Manual smoke test
pnpm dev
```

### Manual Smoke Test Checklist

**Fase 1 (Auth)**:
- [x] Buka `http://localhost:3000` → redirect ke `/login`
- [x] Login dengan `cs1` / `password` → masuk ke `/cs`
- [x] Login dengan `admin1` / `password` → masuk ke `/dashboard`
- [x] Login dengan credential salah → error muncul di slot `#validation`
- [x] Submit form kosong → Zod validation error muncul inline per field
- [x] Tombol login menunjukkan loading state saat proses
- [x] Buka `/dashboard` langsung tanpa login → redirect ke `/login`
- [x] Klik logout → kembali ke `/login`
- [x] Design glassmorphism card, glow orbs, branding header tetap utuh

**Fase 2 (Excel Import)**:
- [x] Buka `/dashboard/master/notification`
- [x] Klik "Import Excel"
- [x] Upload file `.xlsx` dengan kolom yang benar → preview muncul
- [x] Upload file dengan baris invalid → baris ditandai merah
- [x] Klik "Import Valid Rows" → data muncul di tabel utama + toast
- [x] Upload file format salah (.pdf) → error message

**Fase 3 (Dashboard)**:
- [x] Vendor claim create: summary visible di step 2, estimasi di step 3
- [x] Vendor claim detail: 4 stats cards, Complete Batch muncul saat semua decided
- [x] Master data: kolom bisa di-sort, form validation error muncul
- [x] Reports: ubah filter → data berubah, klik Export CSV → file terdownload
- [x] Audit trail: klik date preset → range berubah, export CSV works

---

## 12. Hal yang TIDAK Boleh Dilakukan

1. **Jangan** buat light mode atau color mode toggle. Aplikasi ini dark-only.
2. **Jangan** ubah warna accent `#B6F700` tanpa persetujuan.
3. **Jangan** hardcode string status di template. Selalu import dari `shared/utils/constants.ts`.
4. **Jangan** tulis logic bisnis di komponen Vue. Pisahkan ke composable.
5. **Jangan** skip `definePageMeta({ layout: ... })` di halaman baru.
6. **Jangan** commit file `.env`, `*.sqlite`, atau `credentials.*`.
7. **Jangan** pakai `npm` atau `yarn`. Pakai `pnpm` saja.
8. **Jangan** buat komponen baru jika sudah ada yang serupa di `app/components/`. Cek dulu.
9. **Jangan** ubah arsitektur shared/utils tanpa memastikan semua import tetap berjalan.
10. **Jangan** gunakan `any` di TypeScript. Definisikan type yang tepat.
11. **Jangan** buat file CSS terpisah untuk halaman. Gunakan Tailwind inline classes.
12. **Jangan** hapus mock data — mock data adalah sumber kebenaran sampai backend terhubung.
13. **Jangan** buat API route baru atau modifikasi file di `server/`. Scope dokumen ini frontend only.
14. **Jangan** install Better-Auth, setup database, atau jalankan migrasi Drizzle. Itu fase terpisah.

---

## Lampiran: Quick Reference

### File Konfigurasi Penting

| File | Fungsi |
|------|--------|
| `nuxt.config.ts` | Nuxt modules, colorMode, TypeScript strict |
| `app/app.config.ts` | UI theme (primary=green, neutral=slate) |
| `shared/utils/constants.ts` | Semua enum dan type guard |
| `shared/utils/fiscal.ts` | Japanese fiscal calendar utilities |
| `app/utils/status-config.ts` | Status visual mapping |
| `app/utils/role-navigation.ts` | Sidebar menu per role |
| `app/utils/mock-data.ts` | All mock data (1181 lines) |

### Perintah yang Sering Dipakai

```bash
pnpm dev              # Start dev server (port 3000)
pnpm build            # Production build
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint auto-fix
```

### Commit Message Format

```
feat: Add Excel import to notification master
fix: Fix login redirect for MANAGEMENT role
refactor: Extract autosave indicator to shared component
docs: Update prompt.md with Fase 3 completion notes
```


prompt.md
 implementasikan bagian Fase 3 yang belum selesai saja.

workflow:
- buatkan branch baru.
- implementasikan bagian Fase 3 yang belum selesai saja.
- commit per task, lint::fix , typecheck
- jika sudah selesai semua baru push branch dan buatkan PR.