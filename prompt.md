# Task Cards — Phase 1: Core UX Blockers

---

## Task 1: Fix 404 Handling — Dashboard Claims Detail + CS Profile Error State

### Context
- Project: Nuxt 4, Nuxt UI v4, TypeScript strict
- File utama: `app/pages/dashboard/claims/[id].vue`, `app/pages/cs/profile.vue`
- Referensi pattern: `app/pages/cs/claims/[id]/index.vue` (halaman ini sudah punya 404 handling yang benar)

### Aturan
- JANGAN ubah logic fetch/API yang sudah ada. Hanya TAMBAHKAN guard dan fallback UI.
- JANGAN hapus computed/watcher yang sudah berjalan.
- ESLint: commaDangle 'never', braceStyle '1tbs'. Tanpa explicit Vue imports (Nuxt auto-import).
- Design system: bg `#050505`, surface `#0a0a0a`, accent `#B6F700`, dark-only.

### Instruksi

**A. `app/pages/dashboard/claims/[id].vue`**

1. Baca `app/pages/cs/claims/[id]/index.vue` — perhatikan cara 404 ditangani (guard `v-if` pada data null + EmptyState fallback).
2. Di `useFetch` (sekitar line 108), destructure juga `error` selain `data` dan `pending`.
3. Di template, setelah block `v-if="isLoading"`, tambah block baru `v-else-if="error || !claimRecord"` yang menampilkan state not-found. Gunakan component `EmptyState` yang sudah ada di project (auto-imported). Contoh:
   ```vue
   <div v-else-if="error || !claimRecord" class="flex items-center justify-center min-h-[60vh]">
     <EmptyState
       title="Claim Tidak Ditemukan"
       description="Claim yang Anda cari tidak ada atau sudah dihapus."
     />
   </div>
   ```
4. Pastikan block utama content pakai `v-else` setelah guard di atas.

**B. `app/pages/cs/profile.vue`**

1. `profileError` (line ~268) sudah dideklarasikan tapi tidak pernah di-set `true`.
2. Di `onMounted` (line ~270), wrap `await new Promise(...)` dengan `try/catch`. Di `catch` block, set `profileError.value = true`.
3. Ini persiapan agar nanti saat mock diganti API real, error state langsung berfungsi.

### Validasi
- `pnpm typecheck` — 0 error
- `pnpm lint` — 0 warning baru

---

## Task 2: Fix CS Create Page — Checkbox Binding + FormData Upload

### Context
- File utama: `app/pages/cs/claims/create.vue`, `app/composables/useCsStore.ts`
- Saat ini declaration checkbox hardcoded `checked` tanpa `v-model` — user bisa submit tanpa centang.
- Saat ini `createClaim()` di `useCsStore` kirim `payload` sebagai JSON body (`$fetch` body: payload). File `File` object tidak bisa dikirim via JSON — harus pakai `FormData`.

### Aturan
- JANGAN ubah step wizard flow, validation logic, atau UI structure yang sudah ada.
- JANGAN ubah field/property names di payload — hanya ubah cara pengiriman dari JSON ke FormData.
- Backend handler (`server/api/cs/claims/index.post.ts`) mungkin perlu adjustment untuk parse FormData — tapi itu BUKAN scope task ini. Fokus hanya frontend.
- ESLint: commaDangle 'never', braceStyle '1tbs'. Tanpa explicit Vue imports.

### Instruksi

**A. Declaration Checkbox Binding**

1. Di `app/pages/cs/claims/create.vue`, cari checkbox declaration (sekitar line 1298-1312).
2. Buat ref baru: `const declarationChecked = ref(false)`.
3. Bind checkbox dengan `:model-value="declarationChecked"` dan `@update:model-value="declarationChecked = $event"` (atau `v-model` jika bukan Nuxt UI component).
4. Hapus attribute `checked` yang hardcoded.
5. Di function `submitClaim` (sekitar line 599), tambah guard di awal:
   ```ts
   if (!declarationChecked.value) {
     // tampilkan error atau return early
     return
   }
   ```

**B. FormData Upload**

1. Di `app/composables/useCsStore.ts`, ubah function `createClaim` (line ~92):
   - Buat `FormData` instance
   - Append semua non-file fields sebagai JSON string: `formData.append('data', JSON.stringify(payloadWithoutFiles))`
   - Append setiap photo file: `formData.append('photos', file, \`${photoType}.jpg\`)`
   - Kirim dengan `$fetch('/api/cs/claims', { method: 'POST', body: formData })` — jangan set `Content-Type` manual, browser akan set `multipart/form-data` otomatis.
2. Buat type/interface baru jika perlu untuk memisahkan payload data dan files.

### Validasi
- `pnpm typecheck` — 0 error
- `pnpm lint` — 0 warning baru
- Manual test: buka `/cs/claims/create`, pastikan checkbox harus dicentang sebelum submit

---

## Task 3: Fix Report Filters + Export Buttons (6 Report Pages)

### Context
- File yang diedit: semua di `app/pages/dashboard/reports/`:
  - `vendors.vue`, `trends.vue`, `recovery.vue`, `aging.vue`, `branches.vue`, `defects.vue`
- Referensi pattern: `app/pages/dashboard/reports/index.vue` — halaman ini SUDAH benar: filters wired ke `resolvePeriodFilter()`, export CSV client-side berfungsi.
- Import: `import { resolvePeriodFilter } from '~~/shared/utils/fiscal'`
- Semua halaman report masih pakai **mock data** (`ref([...])` hardcoded). Task ini TIDAK mengganti mock dengan API — hanya membuat filter dan export berfungsi terhadap data mock yang ada.

### Aturan
- JANGAN hapus atau ubah mock data arrays yang sudah ada.
- JANGAN ubah struktur template/layout. Hanya tambah logic di `<script setup>`.
- IKUTI pattern `reports/index.vue` persis untuk filter dan export.
- ESLint: commaDangle 'never', braceStyle '1tbs'. Tanpa explicit Vue imports.

### Instruksi

**A. Wire Period Filter (semua 6 halaman)**

Setiap halaman sudah punya `selectedPeriod` ref dan `periodPresetOptions` array. Yang kurang:

1. Import `resolvePeriodFilter` dan type `PeriodFilterMode` dari `~~/shared/utils/fiscal`.
2. Buat `computed` baru (atau modifikasi existing computed jika ada) yang filter data berdasarkan `selectedPeriod`:
   ```ts
   const filteredData = computed(() => {
     let result = [...rawData.value]
     if (selectedPeriod.value && selectedPeriod.value !== 'all') {
       const range = resolvePeriodFilter(selectedPeriod.value as PeriodFilterMode)
       result = result.filter(item => {
         const d = new Date(item.createdAt) // atau field date yang relevan
         return d >= range.startDate && d <= range.endDate
       })
     }
     // ... filter lain yang sudah berfungsi tetap di sini
     return result
   })
   ```
3. Pastikan semua tampilan (tabel, chart, KPI) menggunakan `filteredData` bukan raw data.

**B. Wire Branch/Vendor/Model Filters (per halaman)**

Untuk setiap halaman yang punya filter tambahan (branch, vendor, model), tambahkan filtering logic di computed yang sama. Pattern:
```ts
if (selectedBranch.value && selectedBranch.value !== 'all') {
  result = result.filter(item => item.branch === selectedBranch.value)
}
```

Detail per halaman:
- **`vendors.vue`**: period filter saja (sudah cukup — data mock adalah vendor summary)
- **`trends.vue`**: period tidak relevan (data sudah per-tanggal), tapi wire branch + vendor filter ke `activeData`
- **`recovery.vue`**: wire period + branch ke `filteredVendors` (vendor + decision sudah berfungsi)
- **`aging.vue`**: wire period + branch ke `filteredClaims`
- **`branches.vue`**: wire period ke data (search sudah berfungsi)
- **`defects.vue`**: wire period + branch + vendor + model ke data

**C. Export CSV Client-Side (5 halaman yang belum punya)**

Ikuti pattern dari `reports/index.vue` (line 316-342):

1. Buat function `exportCsv()`:
   ```ts
   function exportCsv() {
     const data = filteredData.value
     if (!data.length) return
     const headers = ['Column1', 'Column2', ...] // sesuaikan per halaman
     const rows = data.map(item => [item.field1, item.field2, ...].join(','))
     const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
     const url = URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url
     a.download = `report-{nama}-${new Date().toISOString().slice(0, 10)}.csv`
     a.click()
     URL.revokeObjectURL(url)
   }
   ```
2. Bind ke tombol Export yang sudah ada di template: tambah `@click="exportCsv"`.
3. Tambah `:disabled="filteredData.value.length === 0"` pada tombol export.

**D. Fix `recovery.vue` Export — Ganti API call dengan client-side**

File `recovery.vue` saat ini memanggil `$fetch('/api/reports/export')` yang tidak ada. Ganti:
1. Hapus `$fetch` call di function export (line ~288-317).
2. Ganti dengan pattern client-side CSV seperti halaman lain di atas.
3. Pertahankan `isExporting` ref dan loading state yang sudah ada.

### Validasi
- `pnpm typecheck` — 0 error
- `pnpm lint` — 0 warning baru
- Manual test: buka setiap halaman report, ubah filter period/branch/vendor — data harus berubah sesuai filter. Klik Export — file CSV harus terdownload.
