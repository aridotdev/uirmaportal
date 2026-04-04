# Panduan Implementasi CS-004 & CS-005

> **Tujuan**: Dokumen ini adalah panduan implementasi lengkap untuk memperbaiki halaman **CS Claim Detail** (`CS-004`) dan **CS Claim Edit/Revision** (`CS-005`) agar sesuai dengan PRD. Ditulis agar bisa dieksekusi oleh junior developer atau model AI.

---

## Daftar Isi

1. [Konteks Proyek](#1-konteks-proyek)
2. [Ringkasan Gap & Prioritas](#2-ringkasan-gap--prioritas)
3. [Shared Components yang Tersedia](#3-shared-components-yang-tersedia)
4. [CS-004: Claim Detail — Checklist Implementasi](#4-cs-004-claim-detail)
5. [CS-005: Claim Edit/Revision — Checklist Implementasi](#5-cs-005-claim-editrevision)
6. [Komponen Baru yang Perlu Dibuat](#6-komponen-baru-yang-perlu-dibuat)
7. [Referensi Kode & Pola yang Harus Diikuti](#7-referensi-kode--pola)
8. [Urutan Pengerjaan yang Disarankan](#8-urutan-pengerjaan)
9. [Checklist Verifikasi Akhir](#9-checklist-verifikasi-akhir)

---

## 1. Konteks Proyek

### Tech Stack
- **Framework**: Nuxt 4 + Vue 3 Composition API (`<script setup lang="ts">`)
- **UI Library**: Nuxt UI v4 (komponen `USelectMenu`, `UInputMenu`, dll)
- **Styling**: TailwindCSS v4, inline classes, dark-theme-only
- **Icons**: `lucide-vue-next`
- **State**: Masih mock data (`ref([...])` dengan hardcoded arrays)
- **Package Manager**: pnpm

### Design System
- Background utama: `#050505`, surface: `#0a0a0a`
- Accent color: `#B6F500` (yellow-green)
- Border default: `border-white/5` atau `border-white/10`
- Card pattern: `bg-[#0a0a0a] border border-white/5 rounded-4xl p-8`
- Typography: `font-black italic tracking-tighter uppercase` untuk heading
- Label: `text-[10px] font-black uppercase tracking-[0.2em] text-white/40`

### Status Enum Resmi (dari `shared/utils/constants.ts`)
```
ClaimStatus:      DRAFT | SUBMITTED | IN_REVIEW | NEED_REVISION | APPROVED | ARCHIVED
ClaimPhotoStatus: PENDING | VERIFIED | REJECT          ← BUKAN "REJECTED"
VendorClaimStatus: DRAFT | CREATED | PROCESSING | COMPLETED
```

### File Utama yang Terlibat
| File | Deskripsi |
|------|-----------|
| `app/pages/cs/claims/[id]/index.vue` | CS-004: Halaman detail claim (592 baris) |
| `app/pages/cs/claims/[id]/edit.vue` | CS-005: Halaman revisi claim (361 baris) |
| `app/pages/cs/claims/create.vue` | Referensi pola wizard 3 langkah (1387 baris) |
| `app/components/StatusBadge.vue` | Shared status badge (71 baris) |
| `app/components/PhotoEvidenceCard.vue` | Shared photo card (199 baris) |
| `app/components/TimelineList.vue` | Shared timeline (109 baris) |
| `app/components/WorkflowStepper.vue` | Shared wizard stepper (68 baris) |
| `app/components/StickyActionBar.vue` | Shared sticky footer (30 baris) |
| `app/components/SectionCard.vue` | Shared card wrapper (33 baris) |
| `app/components/PageHeader.vue` | Shared page header (65 baris) |
| `app/utils/status-config.ts` | Config warna/icon per status (225 baris) |
| `shared/utils/constants.ts` | Enum types & helpers (187 baris) |

---

## 2. Ringkasan Gap & Prioritas

### CS-004 (`/cs/claims/:id`) — Status PRD: "Sesuai" dengan catatan

| ID | Gap | Prioritas | Effort |
|----|-----|-----------|--------|
| CS-D-011 | Status foto memakai `REJECTED` — harus `REJECT` sesuai enum PRD | Medium | Rendah |
| CMP-D-001 | Tidak menggunakan shared components (`StatusBadge`, `PhotoEvidenceCard`, `TimelineList`) | Medium | Sedang |
| CMP-D-002 | Lightbox sangat sederhana, tidak ada zoom/pan | Medium | Sedang |
| — | Tidak ada loading state / skeleton saat fetch data | Low | Rendah |
| — | Tidak ada empty state jika data kosong | Low | Rendah |

### CS-005 (`/cs/claims/:id/edit`) — Status PRD: "Parsial" → perlu perbaikan signifikan

| ID | Gap | Prioritas | Effort |
|----|-----|-----------|--------|
| CS-D-009 | **Belum ada side-by-side compare foto lama vs baru** | **High** | Tinggi |
| CS-D-010 | **Belum menggunakan pola wizard bertahap seperti create flow** | **Medium** | Tinggi |
| CS-005 | **Belum ada marker visual jelas pada field/foto yang direvisi** | **High** | Sedang |
| — | Status foto memakai `REJECTED` — harus `REJECT` | Medium | Rendah |
| — | Tidak menggunakan shared components | Medium | Sedang |
| — | Submit button tidak disabled sampai semua item fixed | High | Rendah |
| — | Tidak ada autosave indicator | Medium | Sedang |
| — | Tidak menggunakan `StickyActionBar` shared component | Medium | Rendah |
| — | Tidak ada validation sebelum submit | High | Sedang |

---

## 3. Shared Components yang Tersedia

### 3.1 StatusBadge.vue
**Path**: `app/components/StatusBadge.vue`

**Props**:
```ts
{
  status: string              // Enum value, mis. 'NEED_REVISION', 'REJECT'
  variant?: 'claim' | 'photo' | 'vendor-claim' | 'notification'  // default: 'claim'
  size?: 'sm' | 'md'         // default: 'sm'
  showDot?: boolean           // default: false
}
```

**Cara pakai**:
```vue
<!-- Claim status badge -->
<StatusBadge :status="claim.status" variant="claim" size="md" />

<!-- Photo status badge -->
<StatusBadge :status="evidence.status" variant="photo" size="sm" show-dot />
```

**Catatan**: Komponen ini membaca konfigurasi dari `app/utils/status-config.ts`. Untuk variant `photo`, ia menggunakan `PHOTO_STATUS_CONFIG` yang sudah mendukung enum `REJECT` (bukan `REJECTED`).

---

### 3.2 PhotoEvidenceCard.vue
**Path**: `app/components/PhotoEvidenceCard.vue`

**Props**:
```ts
{
  id: string
  label: string
  status?: 'PENDING' | 'VERIFIED' | 'REJECT' | null
  imageUrl?: string | null
  file?: File | null
  note?: string
  required?: boolean
  reviewMode?: boolean    // true = gallery view, false = upload dropzone
}
```

**Emits**: `upload`, `remove`, `preview`

**Cara pakai di CS-004 (gallery mode)**:
```vue
<PhotoEvidenceCard
  v-for="ev in claim.evidences"
  :key="ev.id"
  :id="ev.id"
  :label="ev.label"
  :status="ev.status"
  :image-url="ev.url"
  :note="ev.note"
  review-mode
  @preview="openLightbox"
/>
```

**Cara pakai di CS-005 (upload mode)**:
```vue
<PhotoEvidenceCard
  :id="ev.id"
  :label="ev.label"
  :status="ev.status"
  :image-url="getPreviewUrl(ev.id)"
  :file="newUploads[ev.id]"
  required
  @upload="handleFileUpload"
  @remove="removeUpload"
/>
```

---

### 3.3 TimelineList.vue
**Path**: `app/components/TimelineList.vue`

**Props**:
```ts
interface TimelineItem {
  id: number | string
  date: string
  userName: string
  userRole: string
  action: string
  actionLabel?: string
  actionColor?: string
  note?: string | null
  icon?: Component
}

{ items: TimelineItem[] }
```

**Cara pakai**:
```vue
<TimelineList :items="formattedHistory" />
```

**Map data dari mock ke TimelineItem**:
```ts
const formattedHistory = computed<TimelineItem[]>(() =>
  claim.value.history.map(log => ({
    id: log.id,
    date: log.date,
    userName: log.user,
    userRole: log.role,
    action: log.action,
    note: log.note,
    icon: log.icon
  }))
)
```

---

### 3.4 WorkflowStepper.vue
**Path**: `app/components/WorkflowStepper.vue`

**Props**:
```ts
{
  steps: number
  currentStep: number
  labels?: string[]
  stepStatus?: Record<number, 'valid' | 'error' | 'default'>
}
```

**Cara pakai (lihat `create.vue` baris 732)**:
```vue
<WorkflowStepper
  :steps="3"
  :current-step="currentStep"
  :labels="['Review Info', 'Fix Evidence', 'Confirm']"
  :step-status="computedStepStatus"
/>
```

---

### 3.5 StickyActionBar.vue
**Path**: `app/components/StickyActionBar.vue`

**Props**:
```ts
{
  align?: 'between' | 'end' | 'center'  // default: 'between'
  containerClass?: string                // default: 'mx-auto max-w-7xl'
}
```

**Slots**: `left`, `default`

**PENTING**: Untuk halaman CS, gunakan `container-class="cs-shell-container"` agar mengikuti container width CS area. Lihat contoh di `create.vue` baris 1341:

```vue
<StickyActionBar container-class="cs-shell-container">
  <template #left>
    <button @click="prevStep">BACK</button>
  </template>
  <button @click="submitRevision">SUBMIT REVISION</button>
</StickyActionBar>
```

---

### 3.6 SectionCard.vue
**Path**: `app/components/SectionCard.vue`

**Props**: `{ padded?: boolean, gradient?: boolean }`

**Slots**: `header`, `default`

**Cara pakai**:
```vue
<SectionCard>
  <template #header>
    <div class="flex items-center gap-3">
      <Monitor class="w-5 h-5 text-white/60" />
      <h3 class="font-black text-lg uppercase tracking-tight">Hardware Spec</h3>
    </div>
  </template>
  <!-- content here -->
</SectionCard>
```

---

## 4. CS-004: Claim Detail

**File**: `app/pages/cs/claims/[id]/index.vue`

### TASK 4.1: Fix Status Foto Terminology `REJECTED` → `REJECT`
**Prioritas**: Medium | **Effort**: Rendah | **ID**: CS-D-011

**Apa yang salah**: Mock data dan template menggunakan string `'REJECTED'` untuk status foto, padahal enum PRD resmi adalah `'REJECT'`.

**Langkah**:

1. Di mock data `claim.evidences` (sekitar baris 51-55), ganti semua `status: 'REJECTED'` menjadi `status: 'REJECT'`:

```ts
// SEBELUM (baris 52)
{ id: 'CLAIM_ZOOM', label: 'Defect Zoom', status: 'REJECTED', ... }

// SESUDAH
{ id: 'CLAIM_ZOOM', label: 'Defect Zoom', status: 'REJECT', ... }
```

2. Di template, ganti SEMUA referensi string `'REJECTED'` menjadi `'REJECT'`. Lokasi yang perlu diubah:
   - Baris 351: `v-if="ev.status === 'REJECTED'"` → `v-if="ev.status === 'REJECT'"`
   - Baris 365: `'text-red-500': ev.status === 'REJECTED'` → `'text-red-500': ev.status === 'REJECT'`
   - Baris 433: `ev.status === 'REJECTED'` → `ev.status === 'REJECT'`
   - Baris 462: `v-if="ev.status === 'REJECTED'"` → `v-if="ev.status === 'REJECT'"`

3. Perhatikan: `PHOTO_STATUS_CONFIG` di `status-config.ts` sudah benar menggunakan key `REJECT` dengan label display `'Rejected'`. Jadi enum valuenya `REJECT`, tapi label tampilannya boleh "Rejected".

**Verifikasi**: Cari semua string `REJECTED` di file ini — seharusnya tidak ada lagi setelah perubahan. Gunakan:
```bash
grep -n "REJECTED" app/pages/cs/claims/\[id\]/index.vue
```

---

### TASK 4.2: Gunakan Shared Component `StatusBadge`
**Prioritas**: Medium | **Effort**: Sedang

**Apa yang salah**: Halaman membangun status badge secara inline dengan `statusConfig` computed property (baris 70-80), padahal sudah ada `StatusBadge.vue`.

**Langkah**:

1. **Hapus** computed property `statusConfig` (baris 64-80) dan type `StatusConfig` (baris 64-68).

2. **Ganti** inline badge di header (baris 112-116):

```vue
<!-- SEBELUM -->
<div :class="['flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] ...', statusConfig?.class]">
  <component :is="statusConfig?.icon" class="w-3 h-3" />
  {{ statusConfig?.label }}
</div>

<!-- SESUDAH -->
<StatusBadge :status="claim.status" variant="claim" size="md" />
```

3. **Ganti** badge di sidebar QRCC Review (baris 333-334):
```vue
<!-- SEBELUM -->
<span :class="['text-xs font-black uppercase ...', statusConfig?.class]">
  {{ statusConfig?.label }}
</span>

<!-- SESUDAH -->
<StatusBadge :status="claim.status" variant="claim" size="sm" />
```

4. **Ganti** badge status foto di Evidence Verification sidebar (baris 343-374) — gunakan `StatusBadge` variant `photo`:
```vue
<!-- SEBELUM: inline dot + text -->
<div v-if="ev.status === 'REJECT'" class="w-2 h-2 rounded-full bg-red-500 ..." />
<!-- ... banyak conditional ... -->
<span class="text-[10px] font-black uppercase ...">{{ ev.status }}</span>

<!-- SESUDAH -->
<StatusBadge :status="ev.status" variant="photo" size="sm" show-dot />
```

**Verifikasi**: Pastikan import `StatusBadge` tidak diperlukan (auto-imported oleh Nuxt). Hapus icon imports yang tidak dipakai lagi setelah refactor (mis. `ShieldCheck` jika hanya dipakai di statusConfig).

---

### TASK 4.3: Gunakan Shared Component `PhotoEvidenceCard`
**Prioritas**: Medium | **Effort**: Sedang

**Apa yang salah**: Tab "Photo Evidence" (baris 388-480) membangun photo gallery cards secara inline — kode ini hampir identik dengan `PhotoEvidenceCard` review mode.

**Langkah**:

1. **Ganti** seluruh grid item di baris 416-478 dengan:
```vue
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <PhotoEvidenceCard
    v-for="ev in claim.evidences"
    :key="ev.id"
    :id="ev.id"
    :label="ev.label"
    :status="ev.status"
    :image-url="ev.url"
    :note="ev.note"
    review-mode
    @preview="(url: string) => selectedImage = url"
  />
</div>
```

2. **Hapus** icon imports yang tidak lagi diperlukan: `Eye`, `ExternalLink` (jika hanya dipakai di gallery cards).

**Verifikasi**: Periksa visual — card harus tetap menampilkan: gambar grayscale hover, status overlay, hover actions (Eye + ExternalLink), dan reject note di footer.

---

### TASK 4.4: Gunakan Shared Component `TimelineList`
**Prioritas**: Medium | **Effort**: Sedang

**Apa yang salah**: Tab "History" (baris 482-561) membangun timeline secara inline — kode ini sangat mirip dengan `TimelineList.vue`.

**Langkah**:

1. **Tambahkan** computed property untuk transformasi data:
```ts
import type { TimelineItem } from '~/components/TimelineList.vue'

const formattedHistory = computed<TimelineItem[]>(() =>
  claim.value.history.map(log => ({
    id: log.id,
    date: log.date,
    userName: log.user,
    userRole: log.role,
    action: log.action,
    note: log.note,
    icon: log.icon
  }))
)
```

2. **Ganti** seluruh konten tab history (baris 487-560) dengan:
```vue
<div v-else-if="activeTab === 'history'" class="max-w-4xl animate-in fade-in duration-500">
  <SectionCard>
    <template #header>
      <div class="flex items-center gap-4">
        <div class="bg-white/5 p-3 rounded-2xl border border-white/10">
          <History class="w-6 h-6 text-white/40" />
        </div>
        <div>
          <h2 class="text-xl font-black italic tracking-tighter uppercase">Claim Lifecycle</h2>
          <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
            Audit trail of all actions taken
          </p>
        </div>
      </div>
    </template>
    <TimelineList :items="formattedHistory" />
  </SectionCard>
</div>
```

3. **Hapus** fungsi `shouldShowComment` (baris 89-92) — logika ini ditangani oleh `TimelineList` secara internal.

**Verifikasi**: Pastikan timeline tetap menampilkan: icon per action, warna sesuai action type, note hanya untuk action tertentu, dan avatar initials.

---

### TASK 4.5: Perkuat Lightbox Modal
**Prioritas**: Medium | **Effort**: Sedang

**Apa yang salah**: Lightbox saat ini (baris 566-578) sangat sederhana — hanya klik untuk menutup, tidak ada zoom/pan, tidak ada navigasi antar foto.

**Langkah**:

1. **Buat komponen baru** `app/components/PhotoLightbox.vue` (lihat [Section 6.1](#61-photolightboxvue)).

2. **Ganti** lightbox inline di `[id]/index.vue` dengan:
```vue
<PhotoLightbox
  v-if="selectedImage"
  :images="claim.evidences.map(ev => ({ url: ev.url, label: ev.label, status: ev.status }))"
  :initial-url="selectedImage"
  @close="selectedImage = null"
/>
```

---

### TASK 4.6: Tambah Loading State & Empty State
**Prioritas**: Low | **Effort**: Rendah

**Langkah**:

1. **Tambahkan** state loading:
```ts
const isLoading = ref(true)

onMounted(() => {
  // Simulasi fetch — nanti diganti API call
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})
```

2. **Wrap** konten utama dalam kondisi:
```vue
<LoadingState v-if="isLoading" variant="detail" :rows="6" />
<template v-else>
  <!-- konten existing -->
</template>
```

---

## 5. CS-005: Claim Edit/Revision

**File**: `app/pages/cs/claims/[id]/edit.vue`

> **Ini adalah pekerjaan terbesar.** Halaman saat ini berupa form panjang flat. Harus diubah menjadi wizard bertahap dengan side-by-side photo compare.

### TASK 5.1: Tambahkan `definePageMeta`
**Prioritas**: High | **Effort**: Rendah

**Apa yang salah**: File saat ini TIDAK memiliki `definePageMeta({ layout: 'cs' })`. Ini perlu ditambahkan agar layout CS wrapper terpasang.

**Langkah**: Tambahkan di awal `<script setup>`:
```ts
definePageMeta({
  layout: 'cs'
})
```

**Catatan**: Periksa apakah `create.vue` menggunakan ini (ya, baris 87-89). Pastikan konsisten.

---

### TASK 5.2: Ubah ke Wizard 3 Langkah
**Prioritas**: Medium | **Effort**: Tinggi | **ID**: CS-D-010

**Apa yang salah**: Revisi saat ini ditampilkan sebagai form panjang, bukan wizard bertahap seperti create flow.

**Arsitektur wizard yang diusulkan**:

| Step | Label | Konten |
|------|-------|--------|
| 1 | Review Info | Tampilkan QRCC feedback, context read-only, form edit defect info (hanya field yang perlu direvisi), revision history |
| 2 | Fix Evidence | Side-by-side compare foto lama vs baru, upload zone untuk foto yang REJECT, foto VERIFIED/PENDING read-only |
| 3 | Confirm | Ringkasan semua perubahan yang dilakukan, revision note textarea, checklist konfirmasi |

**Langkah**:

1. **Tambahkan** state wizard (ikuti pola `create.vue`):
```ts
const STEP_LABELS = ['Review Info', 'Fix Evidence', 'Confirm'] as const
const currentStep = ref<number>(1)
const stepAttempted = ref<Record<number, boolean>>({ 1: false, 2: false, 3: false })
```

2. **Tambahkan** `WorkflowStepper` di header:
```vue
<header class="cs-shell-x sticky top-0 z-40 ...">
  <div class="cs-shell-container flex flex-col justify-between gap-6 md:flex-row md:items-center">
    <div class="flex items-center gap-6">
      <NuxtLink :to="`/cs/claims/${claimId}`" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ...">
        <ArrowLeft class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
          REVISE CLAIM: {{ claim.id }}
          <span class="bg-amber-500 text-black px-2 py-0.5 rounded italic text-[10px]">CORRECTION</span>
        </h1>
        <!-- Autosave indicator (lihat Task 5.6) -->
      </div>
    </div>
    <WorkflowStepper
      :steps="3"
      :current-step="currentStep"
      :labels="[...STEP_LABELS]"
      :step-status="computedStepStatus"
    />
  </div>
</header>
```

3. **Tambahkan** navigasi wizard (copy dari `create.vue` baris 615-636):
```ts
const nextStep = (): void => {
  if (currentStep.value < 3) {
    stepAttempted.value[currentStep.value] = true
    const currentErrors = validationErrors.value.filter(e => e.step === currentStep.value)
    if (currentErrors.length > 0) return
    currentStep.value++
  }
}

const prevStep = (): void => {
  if (currentStep.value > 1) currentStep.value--
}
```

4. **Bagi** konten `<main>` menjadi 3 section `v-if`:
```vue
<main class="cs-shell-main flex-1">
  <div class="cs-shell-container">
    <!-- Step 1: Review Info -->
    <div v-if="currentStep === 1" class="space-y-8 animate-in fade-in ...">
      <!-- QRCC Feedback banner -->
      <!-- Context read-only -->
      <!-- Editable fields (hanya yang perlu revisi) -->
      <!-- Revision history timeline -->
    </div>

    <!-- Step 2: Fix Evidence -->
    <div v-if="currentStep === 2" class="space-y-8 animate-in fade-in ...">
      <!-- Side-by-side compare cards -->
    </div>

    <!-- Step 3: Confirm -->
    <div v-if="currentStep === 3" class="space-y-8 animate-in fade-in ...">
      <!-- Summary perubahan -->
      <!-- Revision note textarea -->
    </div>
  </div>
</main>
```

5. **Ganti** footer dengan `StickyActionBar`:
```vue
<StickyActionBar container-class="cs-shell-container">
  <template #left>
    <button v-if="currentStep > 1" @click="prevStep"
      class="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm text-white/40 hover:bg-white/5 hover:text-white transition-all border border-white/10">
      <ArrowLeft class="w-4 h-4" /> BACK
    </button>
    <div v-else class="flex items-center gap-4 text-white/40">
      <AlertTriangle class="w-4 h-4 text-amber-500" />
      <span class="text-[10px] font-black uppercase tracking-widest">Awaiting Correction</span>
    </div>
  </template>

  <NuxtLink :to="`/cs/claims/${claimId}`"
    class="px-8 py-4 rounded-2xl font-black text-sm text-white/40 hover:text-white transition-all">
    CANCEL
  </NuxtLink>

  <button v-if="currentStep < 3" @click="nextStep"
    class="bg-amber-500 text-black px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
    CONTINUE <ArrowRight class="w-4 h-4" />
  </button>

  <button v-else :disabled="!canSubmitRevision" @click="submitRevision"
    class="bg-amber-500 text-black px-12 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-40 disabled:cursor-not-allowed">
    SUBMIT REVISION <Send class="w-4 h-4" />
  </button>
</StickyActionBar>
```

---

### TASK 5.3: Implementasi Side-by-Side Photo Compare
**Prioritas**: High | **Effort**: Tinggi | **ID**: CS-D-009

**Apa yang salah**: User tidak bisa membandingkan foto lama (yang ditolak) dengan foto baru yang diunggah.

**Langkah**:

1. **Buat komponen baru** `app/components/PhotoCompareCard.vue` (lihat [Section 6.2](#62-photocomparecardvue)).

2. **Gunakan** di Step 2 wizard:

```vue
<!-- Step 2: Fix Evidence -->
<div v-if="currentStep === 2" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-xl font-black italic tracking-tight">FIX EVIDENCE</h2>
      <p class="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
        Replace rejected photos and verify corrections
      </p>
    </div>
    <div class="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
      <span class="text-xs font-black uppercase tracking-widest text-white/40">Fixed: </span>
      <span class="text-sm font-black" :class="allRejectedFixed ? 'text-[#B6F500]' : 'text-amber-500'">
        {{ fixedCount }} / {{ rejectedCount }}
      </span>
    </div>
  </div>

  <!-- Step 2 Error Summary -->
  <div v-if="stepAttempted[2] && rejectedNotFixed.length > 0"
    class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-3">
    <AlertCircle class="w-4 h-4 text-red-400" />
    <p class="text-xs font-bold text-red-400">
      {{ rejectedNotFixed.length }} rejected photo(s) belum di-upload ulang.
    </p>
  </div>

  <!-- Rejected photos: compare cards -->
  <div class="space-y-6">
    <PhotoCompareCard
      v-for="ev in rejectedEvidences"
      :key="ev.id"
      :id="ev.id"
      :label="ev.label"
      :old-image-url="ev.url"
      :new-file="newUploads[ev.id]"
      :new-preview-url="previewUrls[ev.id]"
      :reject-note="ev.note"
      @upload="handleFileUpload"
      @remove="removeUpload"
    />
  </div>

  <!-- Verified/Pending photos: read-only grid -->
  <div v-if="nonRejectedEvidences.length > 0">
    <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
      NO ACTION NEEDED
    </h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="ev in nonRejectedEvidences" :key="ev.id"
        class="bg-white/5 border border-white/10 rounded-2xl p-4 opacity-60">
        <div class="flex items-center gap-2 mb-2">
          <StatusBadge :status="ev.status" variant="photo" size="sm" show-dot />
        </div>
        <p class="text-[10px] font-black uppercase tracking-widest text-white/40">{{ ev.label }}</p>
      </div>
    </div>
  </div>
</div>
```

3. **Tambahkan** computed properties:
```ts
const rejectedEvidences = computed(() =>
  claim.value.evidences.filter(ev => ev.status === 'REJECT')
)

const nonRejectedEvidences = computed(() =>
  claim.value.evidences.filter(ev => ev.status !== 'REJECT')
)

const rejectedCount = computed(() => rejectedEvidences.value.length)
const fixedCount = computed(() =>
  rejectedEvidences.value.filter(ev => newUploads.value[ev.id]).length
)
const allRejectedFixed = computed(() => fixedCount.value === rejectedCount.value)

const rejectedNotFixed = computed(() =>
  rejectedEvidences.value.filter(ev => !newUploads.value[ev.id])
)
```

---

### TASK 5.4: Tambahkan Marker Visual pada Field yang Direvisi
**Prioritas**: High | **Effort**: Sedang | **ID**: CS-005 main gap

**Apa yang salah**: Tidak ada indikasi visual jelas field mana yang perlu direvisi / sudah direvisi.

**Langkah**:

1. **Tambahkan** tracking field mana yang diubah:
```ts
// Track original values untuk detect perubahan
const originalValues = ref({
  panelPartNumber: claim.value.panelPartNumber,
  ocSN: claim.value.ocSN,
  defectType: claim.value.defectType,
  odfNumber: claim.value.odfNumber,
  odfVersion: claim.value.odfVersion,
  odfWeek: claim.value.odfWeek
})

const isFieldRevised = (field: string): boolean => {
  return claim.value[field as keyof typeof claim.value] !== originalValues.value[field as keyof typeof originalValues.value]
}
```

2. **Tambahkan visual marker** pada setiap field input di Step 1. Contoh pattern:
```vue
<div class="space-y-2 group relative">
  <!-- Revision marker -->
  <div v-if="isFieldRevised('panelPartNumber')"
    class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full" />

  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
    Panel Part Number
    <span v-if="isFieldRevised('panelPartNumber')"
      class="text-amber-500 ml-2">REVISED</span>
  </label>
  <input v-model="claim.panelPartNumber" type="text"
    :class="[
      'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm focus:outline-none transition-colors font-mono tracking-wider',
      isFieldRevised('panelPartNumber')
        ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
        : 'border-white/10 focus:border-amber-500'
    ]" />
</div>
```

3. **Terapkan** pattern yang sama pada semua editable fields: `panelPartNumber`, `ocSN`, `defectType`, `odfNumber`, `odfVersion`, `odfWeek`.

---

### TASK 5.5: Fix Status Foto Terminology `REJECTED` → `REJECT`
**Prioritas**: Medium | **Effort**: Rendah

Sama seperti Task 4.1 — ganti semua `'REJECTED'` menjadi `'REJECT'` di mock data (baris 39) dan template conditions (baris 245, 264).

```ts
// SEBELUM (baris 39)
{ id: 'CLAIM_ZOOM', label: 'Defect Zoom', status: 'REJECTED', ... }

// SESUDAH
{ id: 'CLAIM_ZOOM', label: 'Defect Zoom', status: 'REJECT', ... }
```

Template: `ev.status !== 'REJECTED'` → `ev.status !== 'REJECT'` (baris 245), `v-else` block implicit (baris 264).

---

### TASK 5.6: Tambahkan Autosave Indicator
**Prioritas**: Medium | **Effort**: Sedang

**Referensi**: Copy pola autosave dari `create.vue` baris 120-149.

**Langkah**:

1. **Copy** state dan logic autosave:
```ts
type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const autosaveStatus = ref<AutosaveStatus>('idle')
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

const autosaveLabel = computed(() => {
  const labels: Record<AutosaveStatus, string> = {
    idle: '',
    saving: 'Saving draft…',
    saved: 'Draft saved',
    error: 'Save failed'
  }
  return labels[autosaveStatus.value]
})

const triggerAutosave = (): void => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    autosaveStatus.value = 'saving'
    setTimeout(() => {
      autosaveStatus.value = 'saved'
      setTimeout(() => { autosaveStatus.value = 'idle' }, 3000)
    }, 800)
  }, 1500)
}
```

2. **Watch** form changes:
```ts
watch(() => claim.value.panelPartNumber, triggerAutosave)
watch(() => claim.value.ocSN, triggerAutosave)
watch(newUploads, triggerAutosave, { deep: true })
watch(revisionNote, triggerAutosave)
```

3. **Render** indicator di header (sama seperti `create.vue` baris 695-726):
```vue
<Transition ...>
  <span v-if="autosaveStatus !== 'idle'" :class="[...]">
    <Loader2 v-if="autosaveStatus === 'saving'" class="w-3 h-3 animate-spin" />
    <Save v-else-if="autosaveStatus === 'saved'" class="w-3 h-3" />
    <CloudOff v-else-if="autosaveStatus === 'error'" class="w-3 h-3" />
    {{ autosaveLabel }}
  </span>
</Transition>
```

---

### TASK 5.7: Validasi & Disable Submit Sampai Semua Item Fixed
**Prioritas**: High | **Effort**: Sedang

**Apa yang salah**: Button "Submit Revision" selalu aktif, padahal PRD bilang harus disabled sampai semua item rejected sudah di-fix.

**Langkah**:

1. **Tambahkan** validation system (ikuti pola `create.vue`):
```ts
interface ValidationError {
  step: number
  field: string
  message: string
}

const validationErrors = computed<ValidationError[]>(() => {
  const errors: ValidationError[] = []

  // Step 2: Semua foto REJECT harus sudah di-upload ulang
  for (const ev of rejectedEvidences.value) {
    if (!newUploads.value[ev.id]) {
      errors.push({
        step: 2,
        field: ev.label,
        message: `${ev.label} yang ditolak wajib di-upload ulang`
      })
    }
  }

  // Step 3: Revision note wajib diisi (opsional, sesuaikan dengan kebutuhan)
  // if (!revisionNote.value.trim()) {
  //   errors.push({ step: 3, field: 'Revision Note', message: 'Revision note wajib diisi' })
  // }

  return errors
})

const canSubmitRevision = computed(() => validationErrors.value.length === 0)

const computedStepStatus = computed<Record<number, 'valid' | 'error' | 'default'>>(() => {
  const status: Record<number, 'valid' | 'error' | 'default'> = {}
  for (let step = 1; step <= 3; step++) {
    if (!stepAttempted.value[step]) status[step] = 'default'
    else if (validationErrors.value.filter(e => e.step === step).length > 0) status[step] = 'error'
    else status[step] = 'valid'
  }
  return status
})
```

2. **Disable** submit button di footer:
```vue
<button
  v-else
  :disabled="!canSubmitRevision"
  class="... disabled:opacity-40 disabled:cursor-not-allowed"
  @click="submitRevision"
>
  SUBMIT REVISION <Send class="w-4 h-4" />
</button>
```

---

### TASK 5.8: Konten Step 1 — Review Info
**Prioritas**: High | **Effort**: Sedang

**Konten step 1 harus berisi:**

```vue
<div v-if="currentStep === 1" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

  <!-- QRCC Feedback Banner (pindahkan dari left column saat ini) -->
  <div class="bg-amber-500/10 border border-amber-500/30 rounded-4xl p-8 relative overflow-hidden">
    <div class="absolute -top-4 -right-4 opacity-10">
      <ShieldAlert class="w-32 h-32 text-amber-500" />
    </div>
    <div class="relative z-10">
      <div class="flex items-center gap-3 mb-4">
        <div class="bg-amber-500 p-2 rounded-lg text-black">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <h3 class="font-black text-amber-500 uppercase tracking-tight">QRCC Feedback</h3>
      </div>
      <p class="text-white/80 text-sm leading-relaxed font-bold italic">
        "{{ claim.history[0]?.note }}"
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div class="lg:col-span-2 space-y-8">

      <!-- Context Read-Only -->
      <SectionCard>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div v-for="(val, label) in {
            Notification: claim.notificationCode,
            Model: claim.model,
            Vendor: claim.vendor,
            Branch: claim.branch
          }" :key="label">
            <p class="text-[8px] font-black uppercase tracking-widest text-white/30">{{ label }}</p>
            <p class="text-sm font-black">{{ val }}</p>
          </div>
        </div>
      </SectionCard>

      <!-- Editable Fields (dengan revision markers) -->
      <SectionCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div class="bg-white/5 p-2 rounded-lg">
              <Monitor class="w-5 h-5 text-white/60" />
            </div>
            <h3 class="font-black text-lg uppercase tracking-tight">Defect Info Correction</h3>
          </div>
        </template>
        <!-- Fields dengan marker (lihat Task 5.4) -->
      </SectionCard>

    </div>

    <!-- Sidebar: Revision Timeline -->
    <div class="space-y-6">
      <SectionCard>
        <template #header>
          <div class="flex items-center gap-2">
            <History class="w-4 h-4 text-white/40" />
            <span class="font-black text-sm uppercase tracking-tight">Revision History</span>
          </div>
        </template>
        <TimelineList :items="formattedHistory" />
      </SectionCard>
    </div>
  </div>

</div>
```

---

### TASK 5.9: Konten Step 3 — Confirm & Submit
**Prioritas**: High | **Effort**: Sedang

```vue
<div v-if="currentStep === 3" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

  <!-- Summary Header -->
  <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl overflow-hidden">
    <div class="bg-amber-500 p-6 text-black flex items-center justify-between">
      <div>
        <h2 class="font-black text-lg uppercase tracking-tight">Revision Summary</h2>
        <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
          Review all changes before submitting
        </p>
      </div>
      <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-black/10">
        <FileText class="w-6 h-6" />
      </div>
    </div>

    <div class="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
      <!-- Field Changes -->
      <div class="space-y-6">
        <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
          <div class="w-1 h-3 bg-amber-500" /> Field Changes
        </h3>
        <div class="space-y-3">
          <div v-for="field in revisedFields" :key="field.key"
            class="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-amber-500/20">
            <span class="text-[10px] font-bold uppercase text-white/40">{{ field.label }}</span>
            <div class="text-right">
              <p class="text-[9px] text-white/30 line-through">{{ field.oldValue }}</p>
              <p class="text-xs font-black text-amber-500">{{ field.newValue }}</p>
            </div>
          </div>
          <div v-if="revisedFields.length === 0" class="text-xs text-white/30 italic">
            No field changes made
          </div>
        </div>
      </div>

      <!-- Photo Changes -->
      <div class="space-y-6">
        <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
          <div class="w-1 h-3 bg-amber-500" /> Evidence Replacements
        </h3>
        <div class="space-y-3">
          <div v-for="ev in rejectedEvidences" :key="ev.id"
            class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div :class="[
              'p-1.5 rounded-lg',
              newUploads[ev.id] ? 'bg-[#B6F500]/20 text-[#B6F500]' : 'bg-red-500/20 text-red-500'
            ]">
              <CheckCircle2 v-if="newUploads[ev.id]" class="w-4 h-4" />
              <AlertCircle v-else class="w-4 h-4" />
            </div>
            <span class="text-xs font-black uppercase tracking-tight flex-1">{{ ev.label }}</span>
            <span v-if="newUploads[ev.id]"
              class="text-[8px] font-black uppercase tracking-widest text-[#B6F500]">REPLACED</span>
            <span v-else
              class="text-[8px] font-black uppercase tracking-widest text-red-500">MISSING</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Revision Note to QRCC -->
  <SectionCard>
    <template #header>
      <div class="flex items-center gap-3">
        <MessageSquare class="w-5 h-5 text-white/40" />
        <h3 class="font-black text-xs uppercase tracking-widest text-white/40">
          Revision Note to QRCC
        </h3>
      </div>
    </template>
    <textarea v-model="revisionNote"
      placeholder="Explain the changes you made (e.g. 'Photo re-uploaded with better lighting, SN corrected')..."
      class="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold min-h-30 focus:outline-none focus:border-amber-500 transition-colors" />
  </SectionCard>

</div>
```

**Computed untuk summary**:
```ts
const revisedFields = computed(() => {
  const fields = [
    { key: 'panelPartNumber', label: 'Panel Part Number' },
    { key: 'ocSN', label: 'OC Serial Number' },
    { key: 'defectType', label: 'Defect Type' },
    { key: 'odfNumber', label: 'ODF Number' },
    { key: 'odfVersion', label: 'ODF Version' },
    { key: 'odfWeek', label: 'ODF Week' }
  ]

  return fields
    .filter(f => isFieldRevised(f.key))
    .map(f => ({
      ...f,
      oldValue: originalValues.value[f.key as keyof typeof originalValues.value],
      newValue: claim.value[f.key as keyof typeof claim.value]
    }))
})
```

---

### TASK 5.10: File Upload Handler (Perkuat)
**Prioritas**: High | **Effort**: Sedang

**Perkuat** file upload agar mendukung validasi, preview, dan drag-drop seperti create page.

```ts
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const previewUrls = ref<Record<string, string>>({})

const validateUploadFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return 'File terlalu besar (maks 5MB)'
  if (!file.type.startsWith('image/')) return 'Hanya file gambar yang diperbolehkan'
  return null
}

const handleFileUpload = (id: string, event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const error = validateUploadFile(file)
  if (error) {
    // Tampilkan toast error
    console.error(error)
    target.value = ''
    return
  }

  // Cleanup old preview URL
  if (previewUrls.value[id]) URL.revokeObjectURL(previewUrls.value[id])

  newUploads.value[id] = file
  previewUrls.value[id] = URL.createObjectURL(file)
  target.value = ''
}

const removeUpload = (id: string): void => {
  if (previewUrls.value[id]) URL.revokeObjectURL(previewUrls.value[id])
  delete previewUrls.value[id]
  newUploads.value[id] = null
}

// Cleanup on unmount
onUnmounted(() => {
  for (const url of Object.values(previewUrls.value)) {
    URL.revokeObjectURL(url)
  }
})
```

---

## 6. Komponen Baru yang Perlu Dibuat

### 6.1 PhotoLightbox.vue

**Path**: `app/components/PhotoLightbox.vue`

**Deskripsi**: Modal lightbox dengan navigasi antar foto, zoom, dan keyboard support.

**Props**:
```ts
interface LightboxImage {
  url: string
  label: string
  status?: string
}

{
  images: LightboxImage[]
  initialUrl: string
}
```

**Emits**: `close`

**Template**:
```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-vue-next'

interface LightboxImage {
  url: string
  label: string
  status?: string
}

const props = defineProps<{
  images: LightboxImage[]
  initialUrl: string
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(props.images.findIndex(img => img.url === props.initialUrl) || 0)
const zoomLevel = ref(1)

const currentImage = computed(() => props.images[currentIndex.value])

const goNext = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    zoomLevel.value = 1
  }
}

const goPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    zoomLevel.value = 1
  }
}

const zoomIn = () => { zoomLevel.value = Math.min(zoomLevel.value + 0.5, 3) }
const zoomOut = () => { zoomLevel.value = Math.max(zoomLevel.value - 0.5, 0.5) }

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') goNext()
  if (e.key === 'ArrowLeft') goPrev()
  if (e.key === '+' || e.key === '=') zoomIn()
  if (e.key === '-') zoomOut()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in"
    @click.self="emit('close')">

    <!-- Top bar -->
    <div class="flex items-center justify-between p-6">
      <div class="flex items-center gap-3">
        <span class="text-[10px] font-black uppercase tracking-widest text-white/40">
          {{ currentIndex + 1 }} / {{ images.length }}
        </span>
        <span class="text-xs font-black uppercase">{{ currentImage?.label }}</span>
        <StatusBadge v-if="currentImage?.status" :status="currentImage.status" variant="photo" size="sm" />
      </div>
      <div class="flex items-center gap-2">
        <button class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" @click="zoomOut">
          <ZoomOut class="w-5 h-5" />
        </button>
        <span class="text-xs font-black text-white/40 w-12 text-center">{{ Math.round(zoomLevel * 100) }}%</span>
        <button class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors" @click="zoomIn">
          <ZoomIn class="w-5 h-5" />
        </button>
        <button class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ml-4" @click="emit('close')">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Image -->
    <div class="flex-1 flex items-center justify-center p-8 overflow-hidden">
      <button v-if="currentIndex > 0"
        class="absolute left-6 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors z-10"
        @click="goPrev">
        <ChevronLeft class="w-6 h-6" />
      </button>

      <img :src="currentImage?.url" :alt="currentImage?.label"
        class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-200"
        :style="{ transform: `scale(${zoomLevel})` }" />

      <button v-if="currentIndex < images.length - 1"
        class="absolute right-6 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors z-10"
        @click="goNext">
        <ChevronRight class="w-6 h-6" />
      </button>
    </div>

    <!-- Thumbnail strip -->
    <div class="flex justify-center gap-2 p-4">
      <button v-for="(img, idx) in images" :key="idx"
        :class="[
          'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
          idx === currentIndex ? 'border-[#B6F500] scale-110' : 'border-white/10 opacity-50 hover:opacity-80'
        ]"
        @click="currentIndex = idx; zoomLevel = 1">
        <img :src="img.url" :alt="img.label" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>
```

---

### 6.2 PhotoCompareCard.vue

**Path**: `app/components/PhotoCompareCard.vue`

**Deskripsi**: Side-by-side card untuk membandingkan foto lama (rejected) dengan foto baru yang di-upload.

**Props**:
```ts
{
  id: string
  label: string
  oldImageUrl: string | null
  newFile: File | null
  newPreviewUrl: string | null
  rejectNote: string
}
```

**Emits**: `upload`, `remove`

**Template**:
```vue
<script setup lang="ts">
import { Upload, Trash2, AlertTriangle, CheckCircle2, ArrowRight, Camera } from 'lucide-vue-next'

defineProps<{
  id: string
  label: string
  oldImageUrl: string | null
  newFile: File | null
  newPreviewUrl: string | null
  rejectNote: string
}>()

const emit = defineEmits<{
  upload: [id: string, event: Event]
  remove: [id: string]
}>()
</script>

<template>
  <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-red-500/10 p-2 rounded-lg">
          <AlertTriangle class="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 class="font-black text-sm uppercase tracking-tight">{{ label }}</h3>
          <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest">RE-UPLOAD REQUIRED</p>
        </div>
      </div>
      <StatusBadge v-if="newFile" status="VERIFIED" variant="photo" size="sm" />
      <StatusBadge v-else status="REJECT" variant="photo" size="sm" />
    </div>

    <!-- Reject Note -->
    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
      <AlertTriangle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-xs text-red-400 font-bold leading-relaxed italic">"{{ rejectNote }}"</p>
    </div>

    <!-- Side-by-side Compare -->
    <div class="grid grid-cols-2 gap-6">
      <!-- OLD Photo -->
      <div class="space-y-3">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">ORIGINAL (REJECTED)</p>
        <div class="aspect-square rounded-2xl overflow-hidden border border-red-500/20 bg-zinc-900 relative">
          <img v-if="oldImageUrl" :src="oldImageUrl" :alt="`Old ${label}`"
            class="w-full h-full object-cover grayscale opacity-60" />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Camera class="w-12 h-12 text-white/10" />
          </div>
          <!-- Rejected overlay -->
          <div class="absolute inset-0 border-2 border-red-500/30 rounded-2xl pointer-events-none" />
          <div class="absolute top-3 right-3 bg-red-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-red-500/30">
            <span class="text-[8px] font-black uppercase tracking-widest text-red-500">REJECTED</span>
          </div>
        </div>
      </div>

      <!-- NEW Photo / Upload Zone -->
      <div class="space-y-3">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">
          {{ newFile ? 'NEW UPLOAD' : 'UPLOAD REPLACEMENT' }}
        </p>
        <div :class="[
          'aspect-square rounded-2xl overflow-hidden border-2 border-dashed relative transition-all',
          newFile
            ? 'border-[#B6F500] bg-[#B6F500]/5'
            : 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500'
        ]">
          <!-- Empty state: upload zone -->
          <label v-if="!newFile" :for="`compare-file-${id}`"
            class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center">
            <Upload class="w-10 h-10 text-amber-500 mb-3" />
            <p class="text-xs font-black uppercase text-amber-500 mb-1">Click to Upload</p>
            <p class="text-[8px] font-bold text-white/30 uppercase tracking-widest">Max 5MB, image only</p>
            <input :id="`compare-file-${id}`" type="file" class="hidden" accept="image/*"
              @change="(e: Event) => emit('upload', id, e)" />
          </label>

          <!-- Filled state: preview -->
          <template v-else>
            <img v-if="newPreviewUrl" :src="newPreviewUrl" :alt="`New ${label}`"
              class="w-full h-full object-cover" />
            <div class="absolute top-3 right-3 bg-[#B6F500]/20 backdrop-blur-md px-2 py-1 rounded-lg border border-[#B6F500]/30">
              <span class="text-[8px] font-black uppercase tracking-widest text-[#B6F500]">NEW</span>
            </div>
            <button class="absolute bottom-3 right-3 p-2 bg-red-500/80 text-white rounded-xl hover:bg-red-500 transition-colors"
              @click="emit('remove', id)">
              <Trash2 class="w-4 h-4" />
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Arrow indicator between columns -->
    <div class="flex justify-center -mt-4">
      <div class="bg-white/5 p-2 rounded-full border border-white/10">
        <ArrowRight class="w-4 h-4 text-white/30" />
      </div>
    </div>
  </div>
</template>
```

---

## 7. Referensi Kode & Pola

### 7.1 Pola Import yang Benar
```ts
// Icons — hanya import yang dipakai
import { ArrowLeft, AlertTriangle, Send, ... } from 'lucide-vue-next'

// Types
import type { ClaimPhotoStatus } from '~~/shared/utils/constants'
import type { TimelineItem } from '~/components/TimelineList.vue'

// Shared components TIDAK perlu di-import (auto-imported oleh Nuxt)
// StatusBadge, PhotoEvidenceCard, TimelineList, dll langsung pakai di template
```

### 7.2 Pola CSS Utility yang Konsisten
```
// Card wrapper
bg-[#0a0a0a] border border-white/5 rounded-4xl p-8

// Label
text-[10px] font-black uppercase tracking-[0.2em] text-white/40

// Heading
text-xl font-black italic tracking-tighter uppercase

// Input field
w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#B6F500] transition-colors

// Error input
border-red-500/40 focus:border-red-500

// Accent button
bg-[#B6F500] text-black px-10 py-4 rounded-2xl font-black text-sm

// Amber/revision button
bg-amber-500 text-black px-12 py-4 rounded-2xl font-black text-sm

// Ghost button
text-white/40 hover:text-white transition-all

// Animation class
animate-in fade-in slide-in-from-bottom-4 duration-500
```

### 7.3 Pola Page Meta
```ts
definePageMeta({
  layout: 'cs'
})
```

### 7.4 Warna Status Foto
| Status | Background | Text | Border |
|--------|-----------|------|--------|
| PENDING | `bg-amber-500/10` | `text-amber-400` | `border-amber-500/20` |
| VERIFIED | `bg-emerald-500/10` | `text-emerald-400` | `border-emerald-500/20` |
| REJECT | `bg-red-500/10` | `text-red-400` | `border-red-500/20` |

### 7.5 Pola Container CS
Semua halaman CS menggunakan class utility `cs-shell-x`, `cs-shell-container`, dan `cs-shell-main` yang didefinisikan di layout `cs.vue`. Jangan ganti dengan `max-w-7xl` atau container lain.

---

## 8. Urutan Pengerjaan

Ikuti urutan ini untuk meminimalisir konflik dan memaksimalkan progress:

### Phase 1: Komponen Baru (harus selesai duluan)
| # | Task | File | Effort |
|---|------|------|--------|
| 1 | ✅ Buat `PhotoLightbox.vue` | `app/components/PhotoLightbox.vue` | Sedang |
| 2 | ✅ Buat `PhotoCompareCard.vue` | `app/components/PhotoCompareCard.vue` | Sedang |

### Phase 2: CS-004 Fixes (dari yang paling mudah)
| # | Task | Ref |
|---|------|-----|
| 3 | ✅ Fix `REJECTED` → `REJECT` di mock data & template | Task 4.1 |
| 4 | ✅ Ganti inline badges → `StatusBadge` | Task 4.2 |
| 5 | ✅ Ganti inline gallery → `PhotoEvidenceCard` | Task 4.3 |
| 6 | Ganti inline timeline → `TimelineList` | Task 4.4 |
| 7 | Ganti inline lightbox → `PhotoLightbox` | Task 4.5 |
| 8 | Tambah loading & empty state | Task 4.6 |

### Phase 3: CS-005 Rewrite (urutan kritis)
| # | Task | Ref |
|---|------|-----|
| 9 | Tambah `definePageMeta` | Task 5.1 |
| 10 | Fix `REJECTED` → `REJECT` | Task 5.5 |
| 11 | Implementasi wizard state + `WorkflowStepper` | Task 5.2 |
| 12 | Implementasi Step 1 konten | Task 5.8 |
| 13 | Implementasi revision markers | Task 5.4 |
| 14 | Implementasi Step 2 dengan `PhotoCompareCard` | Task 5.3 |
| 15 | Implementasi Step 3 summary | Task 5.9 |
| 16 | Perkuat file upload handler | Task 5.10 |
| 17 | Implementasi validasi & disable submit | Task 5.7 |
| 18 | Implementasi autosave | Task 5.6 |
| 19 | Ganti footer → `StickyActionBar` | Task 5.2 (footer section) |

---

## 9. Checklist Verifikasi Akhir

Setelah semua task selesai, jalankan verifikasi berikut:

### Build & Lint
```bash
pnpm lint          # Harus lolos tanpa error
pnpm typecheck     # Harus lolos tanpa error
```

### CS-004 Visual Checklist
- [x] Status badge claim menggunakan `StatusBadge` component
- [x] Status badge foto menggunakan enum `REJECT` (bukan `REJECTED`)
- [x] Photo gallery menggunakan `PhotoEvidenceCard` dengan `reviewMode`
- [ ] History tab menggunakan `TimelineList` component
- [x] Lightbox bisa navigasi antar foto dengan keyboard (arrows, Escape)
- [x] Lightbox ada zoom in/out
- [ ] Banner revision muncul hanya saat `NEED_REVISION`
- [ ] Button "Revise Claim" muncul hanya saat `NEED_REVISION`
- [x] Tidak ada string `REJECTED` di source code (gunakan `grep -rn "REJECTED" app/pages/cs/claims/\[id\]/index.vue`)

### CS-005 Visual Checklist
- [ ] Page menggunakan layout CS (`definePageMeta({ layout: 'cs' })`)
- [ ] Header menampilkan `WorkflowStepper` 3 langkah
- [ ] Step 1: QRCC feedback banner prominent
- [ ] Step 1: Context read-only (notification, model, vendor, branch)
- [ ] Step 1: Editable fields dengan amber revision markers saat diubah
- [ ] Step 1: Revision history timeline menggunakan `TimelineList`
- [ ] Step 2: Foto REJECT ditampilkan side-by-side (lama vs baru)
- [ ] Step 2: Foto VERIFIED/PENDING ditampilkan read-only
- [ ] Step 2: Progress counter (Fixed: X / Y)
- [ ] Step 3: Summary menampilkan field changes (old → new)
- [ ] Step 3: Summary menampilkan evidence replacement status
- [ ] Step 3: Textarea revision note
- [ ] Footer menggunakan `StickyActionBar` component
- [ ] Button CONTINUE di step 1 & 2
- [ ] Button SUBMIT REVISION di step 3, disabled saat belum semua REJECT items fixed
- [ ] Navigasi BACK di step 2 & 3
- [ ] Autosave indicator di header
- [ ] Tidak ada string `REJECTED` di source code
- [ ] Semua foto status menggunakan enum `REJECT`
- [ ] File validation: max 5MB, image only

### Tidak Boleh Ada
- [ ] String literal `REJECTED` (harus `REJECT`)
- [ ] Inline status badge (harus shared component)
- [ ] Inline timeline (harus `TimelineList`)
- [ ] Form panjang di edit page (harus wizard 3 step)
- [ ] Submit button yang selalu enabled
- [ ] `cd` import patterns (gunakan `~~/shared/...` atau `~/...`)

---

> **Catatan**: Dokumen ini digenerate berdasarkan analisis `prd.md`, `pages.md`, `doc/7-flow.md`, `prd-status-300326.md`, dan semua file implementasi yang relevan per tanggal 4 April 2026. Semua mock data masih dipakai karena API belum tersedia.
