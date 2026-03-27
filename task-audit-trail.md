# Audit Trail Rebuild Task List

Dokumen ini adalah source of truth untuk rebuild halaman `app/pages/dashboard/audit-trail.vue` menjadi data table berbasis Nuxt UI `UTable`, dengan visual language yang tetap mengikuti dashboard saat ini, tetapi struktur datanya sudah sinkron dengan kontrak audit trail MVP.

Fokus fase sekarang adalah frontend. Backend belum dikerjakan, tetapi semua keputusan frontend di bawah ini harus tetap mengikuti:

- `doc/audit-trail-flow.md`
- `server/database/schema/claim-history.ts`
- `shared/utils/constants.ts`

---

## Tujuan Utama

- Mengganti implementasi tabel manual audit trail menjadi `UTable` dari Nuxt UI.
- Menjaga style existing dashboard: dark surface, rounded corners besar, border halus, uppercase headings, accent `#B6F500`.
- Mengubah model data halaman dari generic log menjadi audit trail bisnis per claim.
- Menyiapkan kontrak frontend yang siap dihubungkan ke backend tanpa refactor besar.
- Memisahkan dengan jelas apa yang termasuk source of truth schema dan apa yang hanya display enrichment.

---

## Source of Truth

### Business Rules

- `doc/audit-trail-flow.md`

### Database Write Contract

- `server/database/schema/claim-history.ts`

### Enum dan Value Constraints

- `shared/utils/constants.ts`

### Target UI File

- `app/pages/dashboard/audit-trail.vue`

### Existing Type yang Perlu Direview

- `app/utils/types.ts`

---

## Keputusan Desain yang Wajib Diikuti

- [x] Audit trail diperlakukan sebagai `business event log per claim`, bukan system log generik.
- [x] Row utama frontend harus berangkat dari schema `claim_history`, bukan dari field lama seperti `entityType`, `entityId`, atau `ipAddress`.
- [x] Event yang ditampilkan harus memakai action enum resmi `CLAIM_HISTORY_ACTIONS`.
- [x] `CREATE` harus diperlakukan sebagai `DRAFT -> DRAFT`.
- [x] Event material non-status harus memakai `fromStatus === toStatus`.
- [x] Halaman global audit trail harus menonjolkan perubahan status tanpa menyembunyikan non-status event.
- [x] `userRole` ditampilkan sebagai snapshot role saat event terjadi.
- [x] Field seperti `actorName` dan `claimNumber` dianggap sebagai enrichment read-model, bukan field asli tabel `claim_history`.

---

## Frontend Scope

### A. Rapikan Kontrak Data Frontend

- [x] Audit `app/pages/dashboard/audit-trail.vue` dan identifikasi semua field yang tidak sinkron dengan schema backend.
- [x] Audit `app/utils/types.ts` dan tentukan apakah type lama `AuditLogEntry` akan diganti atau dipisah.
- [x] Buat type baru, misalnya `AuditTrailRecord`, yang mengikuti kontrak backend mentah:
  - [x] `id`
  - [x] `claimId`
  - [x] `action`
  - [x] `fromStatus`
  - [x] `toStatus`
  - [x] `userId`
  - [x] `userRole`
  - [x] `note`
  - [x] `createdAt`
- [x] Buat type display terpisah, misalnya `AuditTrailTableRow`, untuk kebutuhan tabel global:
  - [x] semua field raw history yang relevan
  - [x] `claimNumber`
  - [x] `actorName`
  - [x] `actorInitials`
  - [x] field turunan lain yang memang hanya untuk rendering UI
- [x] Pastikan naming type membedakan secara eksplisit antara raw data backend dan display-enriched row.

### B. Susun Mock Data yang Sinkron dengan Backend

- [x] Hapus asumsi generic entity log seperti `entityType`, `entityId`, `details`, dan `ipAddress` dari data utama halaman.
- [x] Susun mock data audit trail yang mengikuti event matrix di `doc/audit-trail-flow.md`.
- [x] Minimal sediakan mock untuk skenario berikut:
  - [x] happy path tanpa revisi
  - [x] flow perlu revisi lalu submit ulang
  - [x] flow vendor decision berubah
- [x] Pastikan mock mencakup action berikut:
  - [x] `CREATE`
  - [x] `UPDATE`
  - [x] `UPLOAD_PHOTO`
  - [x] `SUBMIT`
  - [x] `REVIEW`
  - [x] `REVIEW_PHOTO`
  - [x] `REQUEST_REVISION`
  - [x] `APPROVE`
  - [x] `GENERATE_VENDOR_CLAIM`
  - [x] `UPDATE_VENDOR_DECISION`
  - [x] `ARCHIVE`
- [x] Pastikan setiap row mock mematuhi aturan status:
  - [x] `CREATE = DRAFT -> DRAFT`
  - [x] event non-status = status sama
  - [x] event status = transisi aktual sesuai flow
- [x] Untuk field display-only seperti `actorName` dan `claimNumber`, tandai secara mental sebagai simulasi join backend.

### C. Definisikan Kontrak Tampilan Tabel Global

- [x] Jadikan kolom tabel global sesuai rekomendasi dokumen audit trail:
  - [x] waktu
  - [x] claim reference
  - [x] action
  - [x] from status
  - [x] to status
  - [x] actor
  - [x] role
  - [x] note
- [x] Rancang kolom `claim reference` agar menampilkan:
  - [x] `claimNumber` sebagai primary label
  - [x] `claimId` sebagai secondary label kecil
- [x] Rancang kolom `actor` agar menampilkan:
  - [x] `actorName` sebagai primary label
  - [x] `userId` sebagai secondary label kecil
- [x] Tampilkan `fromStatus` dan `toStatus` sebagai transition yang mudah dipindai.
- [x] Beri treatment visual berbeda antara:
  - [x] event yang mengubah status
  - [x] event material tanpa perubahan status
- [x] Jangan tampilkan kolom yang tidak ada dalam objective audit trail MVP kecuali benar-benar display enrichment yang dibutuhkan.

### D. Rebuild ke TanStack Vue Table

- [x] Ganti table manual saat ini dengan TanStack Vue Table (selaras dengan dashboard claims/users pattern).
- [x] Gunakan column definitions typed via `createColumnHelper<AuditTrailTableRow>()`.
- [x] Tetap gunakan pola styling yang selaras dengan dashboard lain di repo.
- [x] Gunakan header style uppercase dan muted seperti halaman dashboard list lain.
- [x] Pertimbangkan `sticky` header untuk pengalaman investigasi yang lebih baik.
- [x] Pastikan wrapper visual tabel tetap terasa seperti surface dashboard yang ada sekarang.
- [x] Gunakan `DashboardTablePagination` component agar konsisten dengan halaman dashboard lain.

### E. Filter, Search, Sorting, Pagination

- [x] Ganti filter lama agar sinkron dengan use case audit trail MVP.
- [x] Sediakan search tunggal yang mencari pada:
  - [x] `claimNumber`
  - [x] `claimId`
  - [x] `note`
  - [x] `userId`
  - [x] `actorName`
- [x] Tambahkan filter `action` berdasarkan `CLAIM_HISTORY_ACTIONS`.
- [x] Tambahkan filter `role` berdasarkan `USER_ROLES`.
- [x] Tambahkan filter date range untuk investigasi.
- [x] Tetapkan sorting default `createdAt DESC` untuk halaman audit trail global.
- [x] Pastikan perubahan filter mereset pagination ke halaman pertama.
- [x] Pastikan pagination siap diubah ke server-side nanti tanpa rewrite besar.

### F. Visual Mapping dan UI Helpers

- [x] Buat mapping visual untuk action audit trail berdasarkan domain, bukan log teknis.
- [x] Pastikan warna action konsisten dengan semantic repo:
  - [x] biru untuk `SUBMIT`
  - [x] indigo untuk `REVIEW`
  - [x] amber untuk `REQUEST_REVISION`
  - [x] hijau/accent untuk `APPROVE`
  - [x] muted untuk `ARCHIVE`
  - [x] treatment khusus untuk `REVIEW_PHOTO`
  - [x] treatment khusus untuk `UPDATE_VENDOR_DECISION`
- [x] Buat helper untuk:
  - [x] format timestamp lokal `id-ID`
  - [x] label action yang readable
  - [x] style role badge
  - [x] style status badge
  - [x] deteksi apakah sebuah event mengubah status
- [x] Pastikan helper ini reusable untuk halaman claim detail history nanti.

### G. State Handling dan Interaction

- [x] Tambahkan empty state yang relevan untuk hasil filter kosong.
- [x] Tambahkan loading state yang siap dipakai saat backend fetch tersedia.
- [x] Pastikan row interaction aman untuk masa depan:
  - [x] row bisa diarahkan ke detail claim terkait
  - [x] tidak bergantung pada backend action yang belum ada
- [x] Tambahkan summary ringan di area header/filter, misalnya total hasil atau current view, jika memang membantu investigasi.

### H. Frontend Integration Readiness

- [x] Susun state halaman dengan pemisahan yang jelas antara:
  - [x] raw records dari backend
  - [x] display rows hasil enrichment/mapping
  - [x] filter state
  - [x] sorting state
  - [x] pagination state
- [x] Jika perlu, siapkan composable atau helper transform agar pergantian dari mock ke API cukup mengganti source data.
- [x] Hindari hardcode UI yang mengunci integrasi backend, misalnya asumsi data selalu lengkap padahal nanti bisa null pada enrichment tertentu.

### I. Validasi Frontend Sebelum Integrasi Backend

- [x] Review ulang apakah tidak ada lagi field log generik yang tersisa di halaman audit trail.
- [x] Review ulang apakah semua action mock valid terhadap `CLAIM_HISTORY_ACTIONS`.
- [x] Review ulang apakah semua status mock valid terhadap `CLAIM_STATUSES`.
- [x] Pastikan `note` selalu terisi pada event material di mock data.
- [x] Pastikan halaman tetap rapi di desktop dan tidak rusak total di tablet/mobile.

---

## Backend Scope

### A. Kontrak Response untuk Audit Trail Global

- [ ] Tetapkan endpoint list audit trail global yang bersumber dari `claim_history`.
- [ ] Response item minimal harus memuat:
  - [ ] `id`
  - [ ] `claimId`
  - [ ] `action`
  - [ ] `fromStatus`
  - [ ] `toStatus`
  - [ ] `userId`
  - [ ] `userRole`
  - [ ] `note`
  - [ ] `createdAt`
- [ ] Tambahkan enrichment read-model yang dibutuhkan UI global:
  - [ ] `claimNumber`
  - [ ] `actorName`
- [ ] Dokumentasikan dengan jelas bahwa `claimNumber` dan `actorName` adalah hasil join/read model, bukan field tabel `claim_history`.

### B. Query Layer untuk Halaman Global

- [ ] Buat query backend untuk audit trail global dengan filter:
  - [ ] `claimId`
  - [ ] `claimNumber`
  - [ ] `action`
  - [ ] `userId`
  - [ ] `userRole`
  - [ ] `dateFrom`
  - [ ] `dateTo`
- [ ] Sorting minimal mendukung `createdAt DESC`.
- [ ] Pagination dibuat server-side sejak awal.
- [ ] Pastikan hasil query tetap bisa dibaca cepat untuk investigasi operasional.

### C. Query Layer untuk Timeline per Claim

- [ ] Buat endpoint khusus timeline per claim.
- [ ] Filter minimum berdasarkan `claimId`.
- [ ] Sorting default `createdAt ASC` untuk pembacaan kronologis.
- [ ] Gunakan shape response yang konsisten dengan endpoint global agar frontend bisa reuse formatter.

### D. Penulisan Audit Trail di Service Layer

- [ ] Audit semua service yang memodifikasi claim atau proses turunannya.
- [ ] Pastikan audit trail ditulis di service layer, bukan controller atau frontend.
- [ ] Pastikan perubahan domain dan insert `claim_history` terjadi dalam transaksi yang sama.
- [ ] Buat helper terpusat seperti:

```ts
recordClaimHistory({
  claimId,
  action,
  fromStatus,
  toStatus,
  userId,
  userRole,
  note
})
```

- [ ] Pastikan helper memakai validasi enum dan kontrak yang sama dengan schema.

### E. Event Coverage Matrix di Backend

- [ ] Pastikan event berikut menghasilkan row history saat domain berubah:
  - [ ] create draft claim
  - [ ] update draft claim
  - [ ] upload photo draft
  - [ ] delete photo draft
  - [ ] submit claim
  - [ ] start review
  - [ ] update claim during review
  - [ ] verify photo
  - [ ] reject photo
  - [ ] request revision
  - [ ] update revision data
  - [ ] upload photo in revision
  - [ ] submit revision
  - [ ] approve claim
  - [ ] generate vendor claim
  - [ ] update vendor decision
  - [ ] archive claim
- [ ] Pastikan tidak ada perubahan state material tanpa history.

### F. Standardisasi Note Builder

- [ ] Buat formatter note terpusat per event.
- [ ] Pastikan `UPDATE` menyebut field penting yang berubah.
- [ ] Pastikan `UPLOAD_PHOTO` menyebut `photoType`.
- [ ] Pastikan `REVIEW_PHOTO` menyebut `photoType` dan alasan jika reject.
- [ ] Pastikan `GENERATE_VENDOR_CLAIM` menyebut `vendorClaimNo`.
- [ ] Pastikan `UPDATE_VENDOR_DECISION` menyebut decision final dan konteks penting seperti compensation atau reason.
- [ ] Hindari note generik seperti `updated` atau `success`.

### G. Enrichment Strategy

- [ ] Tentukan sumber `claimNumber` dari join ke data claim.
- [ ] Tentukan sumber `actorName` dari join ke data user.
- [ ] Jangan pernah menghitung ulang `userRole` dari tabel user saat membaca history.
- [ ] Perlakukan `userRole` di history sebagai snapshot immutable.

### H. Testing dan Verification Backend

- [ ] Tambahkan test untuk validasi enum action dan status pada history insert.
- [ ] Tambahkan test bahwa `CREATE` ditulis sebagai `DRAFT -> DRAFT`.
- [ ] Tambahkan test bahwa event non-status memakai status yang sama.
- [ ] Tambahkan test bahwa event status memakai transisi yang benar.
- [ ] Tambahkan test query filtering, sorting, dan pagination.
- [ ] Tambahkan test bahwa note terisi pada semua event material.

### I. Dokumentasi API Contract

- [ ] Dokumentasikan request dan response shape endpoint audit trail global.
- [ ] Dokumentasikan request dan response shape endpoint timeline per claim.
- [ ] Pisahkan dokumentasi antara:
  - [ ] field schema asli
  - [ ] field enrichment untuk read model
- [ ] Pastikan kontrak ini dipakai sebagai acuan final saat frontend mock diganti ke API nyata.

---

## Frontend-Backend Contract Draft

Bagian ini adalah kontrak kerja yang direkomendasikan supaya frontend bisa mulai dibangun sekarang tanpa drift saat backend dikerjakan nanti.

### 1. Raw History Record

Ini mengikuti source of truth schema `claim_history`.

```ts
type AuditTrailRecord = {
  id: number
  claimId: number
  action: ClaimHistoryAction
  fromStatus: ClaimStatus
  toStatus: ClaimStatus
  userId: string
  userRole: UserRole
  note: string | null
  createdAt: number | string
}
```

### 2. Enriched Row for Global Table

Ini adalah shape yang boleh dipakai frontend untuk rendering tabel global.

```ts
type AuditTrailTableRow = AuditTrailRecord & {
  claimNumber: string
  actorName: string
  actorInitials?: string
}
```

### 3. Global Audit Trail API Response Draft

```ts
type GetAuditTrailResponse = {
  items: AuditTrailTableRow[]
  meta: {
    page: number
    pageSize: number
    total: number
    sortBy: 'createdAt'
    sortOrder: 'asc' | 'desc'
  }
}
```

### 4. Global Audit Trail Query Draft

```ts
type GetAuditTrailQuery = {
  page?: number
  pageSize?: number
  search?: string
  action?: ClaimHistoryAction
  userRole?: UserRole
  dateFrom?: string
  dateTo?: string
  sortBy?: 'createdAt'
  sortOrder?: 'asc' | 'desc'
}
```

### 5. Claim Detail Timeline Response Draft

```ts
type GetClaimAuditTrailResponse = {
  claimId: number
  claimNumber: string
  items: AuditTrailTableRow[]
}
```

### 6. Konvensi Kontrak yang Harus Dijaga

- [x] `action` selalu memakai enum resmi.
- [x] `fromStatus` dan `toStatus` selalu valid.
- [x] `note` boleh nullable di schema, tetapi untuk event material harus dianggap mandatory secara bisnis.
- [x] `createdAt` harus bisa diurutkan stabil.
- [x] `claimNumber` dan `actorName` diperlakukan sebagai field enrichment, jadi frontend tidak boleh menganggap keduanya source of truth domain.

---

## Urutan Eksekusi yang Disarankan

### Phase 1 - Contract First

- [x] Finalkan type frontend audit trail.
- [x] Finalkan shape mock data yang sesuai schema.
- [x] Finalkan daftar kolom dan filter sesuai objective MVP.

### Phase 2 - UI Rebuild

- [x] Rebuild `app/pages/dashboard/audit-trail.vue` ke TanStack Vue Table.
- [x] Terapkan style dashboard existing.
- [x] Pasang sorting, filtering, dan pagination.

### Phase 3 - Integration Readiness

- [x] Pisahkan raw records dan display rows.
- [x] Siapkan transform/helper untuk enrichment mock.
- [x] Rapikan loading, empty state, dan row interaction.

### Phase 4 - Backend Implementation

- [ ] Implement query endpoint global.
- [ ] Implement query endpoint per claim.
- [ ] Implement `recordClaimHistory()` helper di service layer.
- [ ] Tambahkan test coverage dan dokumentasi API.

---

## Definition of Done

### Frontend Done

- [x] Halaman audit trail memakai TanStack Vue Table (selaras dengan dashboard claims/users).
- [x] Desain tetap konsisten dengan dashboard existing.
- [x] Tidak ada lagi field utama UI yang bertentangan dengan schema audit trail.
- [x] Mock data mengikuti event matrix audit trail MVP.
- [x] Filter, sorting, pagination, loading, dan empty state bekerja dengan benar.

### Backend Done

- [ ] Semua event material menulis `claim_history` di transaksi yang sama dengan perubahan domain.
- [ ] Endpoint global dan per-claim tersedia.
- [ ] Response backend sinkron dengan kontrak frontend yang disepakati.
- [ ] Test dan dokumentasi kontrak sudah tersedia.

---

## Catatan Implementasi Penting

- Jangan teruskan model data lama berbasis `entityType/entityId/ipAddress` ke implementasi baru.
- Jangan menambahkan action string bebas di luar `CLAIM_HISTORY_ACTIONS`.
- Jangan membuat frontend tergantung pada backend export atau analytics yang belum ada.
- Bila butuh field tambahan untuk UI, masukkan sebagai enrichment read-model, bukan mengubah makna schema audit trail.
- Jika nanti ada perubahan schema besar, revisi dokumen ini terlebih dahulu sebelum lanjut implementasi agar tetap menjadi source of truth.
