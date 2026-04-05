# RENCANA TEKNIS: Unified Mock Data untuk CS Area

> **Status**: READY FOR IMPLEMENTATION
> **Scope**: Seluruh halaman CS (`/cs`, `/cs/claims`, `/cs/claims/create`, `/cs/claims/[id]`, `/cs/claims/[id]/edit`, `/cs/profile`) + layout `cs.vue`
> **Goal**: Satu sumber data mock yang konsisten, digunakan oleh semua halaman CS, dan siap diganti dengan API call nyata saat backend tersedia.

---

## Daftar Isi

1. [Latar Belakang & Masalah](#1-latar-belakang--masalah)
2. [Arsitektur Solusi](#2-arsitektur-solusi)
3. [Struktur File Mock Data](#3-struktur-file-mock-data)
4. [Desain Interface & Type Contract](#4-desain-interface--type-contract)
5. [Spesifikasi Mock Data](#5-spesifikasi-mock-data)
6. [Composable `useCsMockStore`](#6-composable-usecsmockstore)
7. [Rencana Perubahan Per Halaman](#7-rencana-perubahan-per-halaman)
8. [Flow Lengkap: Create → Detail → Edit → Submit](#8-flow-lengkap-create--detail--edit--submit)
9. [Strategi Migrasi ke Backend Nyata](#9-strategi-migrasi-ke-backend-nyata)
10. [Checklist Implementasi](#10-checklist-implementasi)
11. [Catatan untuk Developer / AI Agent](#11-catatan-untuk-developer--ai-agent)

---

## 1. Latar Belakang & Masalah

### Kondisi Saat Ini

| Halaman | Sumber Data | Masalah |
|---------|-------------|---------|
| `/cs` (dashboard) | `useFetch('/api/claims')` + `useFetch('/api/notifications')` | Data dari server mock (`server/utils/claim-data.ts`) — struktur berbeda dari `app/utils/mock-data.ts` |
| `/cs/claims` (list) | `useFetch('/api/claims')` | Sama dengan dashboard, interface `RawClaim` didefinisikan ulang inline |
| `/cs/claims/create` | `$fetch('/api/notifications/${code}')` + hardcoded constants | Reference data (vendors, branches, defects, models) hardcoded inline, tidak sinkron dengan server data |
| `/cs/claims/[id]` | **Hardcoded `ref({...})` inline** | Data claim, evidences, history semua ditulis langsung di file — tidak terhubung ke data manapun |
| `/cs/claims/[id]/edit` | **Hardcoded `ref<ClaimState>({...})` inline** | Sama — data terpisah, interface terpisah, tidak konsisten dengan detail page |
| `/cs/profile` | Import `MOCK_CS_USER_PROFILE` | Satu-satunya yang sudah import dari shared, tapi `activityStats` masih hardcoded |
| Layout `cs.vue` | Import `MOCK_CS_USER_PROFILE` | OK, sudah dari shared |

### Masalah Kunci

1. **Inkonsistensi data**: Claim `CLM-2024-0891` di detail page punya data yang berbeda dari claim manapun di `MOCK_CLAIMS` atau `server/utils/claim-data.ts`
2. **Duplikasi interface**: `RawClaim`, `ClaimState`, `EvidenceItem` didefinisikan ulang di setiap halaman dengan field yang berbeda-beda
3. **Data tidak mengalir**: Membuat claim di create page tidak menghasilkan claim yang bisa dilihat di list atau detail
4. **Reference data tidak sinkron**: Server punya 5 product models dan 25 notifications, tapi create page punya 4 product model options yang berbeda
5. **Tidak ada state persistence**: Create → submit tidak membuat claim baru; detail dan edit selalu menampilkan data hardcoded yang sama

---

## 2. Arsitektur Solusi

### Prinsip Desain

```
┌─────────────────────────────────────────────────────────┐
│                     CS PAGES (Views)                     │
│  /cs  /cs/claims  /cs/claims/create  [id]  [id]/edit   │
└──────────────────────┬──────────────────────────────────┘
                       │ import & use
                       ▼
┌─────────────────────────────────────────────────────────┐
│              composables/useCsMockStore.ts               │
│                                                         │
│  • getClaims() → ClaimListItem[]                        │
│  • getClaimDetail(id) → CsClaimDetail | null            │
│  • createClaim(data) → CsClaimDetail                    │
│  • submitClaim(id) → void                               │
│  • submitRevision(id, data) → void                      │
│  • getNotifications() → NotificationRecord[]            │
│  • lookupNotification(code) → NotificationLookupResult  │
│  • getCurrentUser() → CsUserProfile                     │
│  • getUserStats() → CsActivityStats                     │
│  • getReferenceData() → CsReferenceData                 │
│                                                         │
│  (Saat backend ready: ganti isi fungsi ini dengan       │
│   $fetch / useFetch calls — interface tetap sama)       │
└──────────────────────┬──────────────────────────────────┘
                       │ reads from
                       ▼
┌─────────────────────────────────────────────────────────┐
│              app/utils/cs-mock-data/                     │
│                                                         │
│  index.ts          → barrel export                      │
│  types.ts          → CS-specific view model interfaces  │
│  claims.ts         → MOCK_CS_CLAIMS (enriched)          │
│  claim-photos.ts   → MOCK_CS_CLAIM_PHOTOS               │
│  claim-history.ts  → MOCK_CS_CLAIM_HISTORY              │
│  notifications.ts  → MOCK_CS_NOTIFICATIONS              │
│  reference-data.ts → vendors, models, defects, branches │
│  user.ts           → CS user profile & auth mock        │
│  helpers.ts        → ID generators, date formatters     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Mengapa Composable, Bukan Direct Import?

1. **Satu titik migrasi**: Saat backend ready, cukup ubah composable — semua page langsung terkoneksi
2. **Reactive state**: Composable bisa meng-hold reactive state yang diubah oleh create/submit operations
3. **Konsisten dengan Nuxt pattern**: `useFetch`/`useAsyncData` akan menggantikan fungsi-fungsi di composable
4. **Testable**: Composable bisa di-mock di unit test nanti

### Hubungan dengan Server Mock Data yang Sudah Ada

File-file di `server/utils/` (`claim-data.ts`, `notification-data.ts`, `claim-review-data.ts`) TETAP ADA dan tidak diubah. Mereka melayani API route (`/api/claims`, `/api/notifications`) yang digunakan oleh dashboard area.

CS mock data di `app/utils/cs-mock-data/` adalah **superset** yang:
- Menggunakan tipe/konstanta yang sama dari `shared/utils/constants.ts`
- Memiliki data yang KONSISTEN dengan server mock (claim numbers, notification codes, vendor names, dll)
- Menambahkan data yang dibutuhkan CS tapi belum ada di server mock (detail photos per claim, claim history lengkap, revision state)

---

## 3. Struktur File Mock Data

### Folder: `app/utils/cs-mock-data/`

```
app/utils/cs-mock-data/
├── index.ts              # Barrel export semua data & helpers
├── types.ts              # Semua CS-specific interface/type
├── claims.ts             # Data klaim milik CS user (reactive store)
├── claim-photos.ts       # Foto per klaim (per photoType)
├── claim-history.ts      # History/timeline per klaim
├── notifications.ts      # Notification records untuk lookup
├── reference-data.ts     # Vendors, models, defects, branches
├── user.ts               # CS user profile & session
└── helpers.ts            # Utility: ID generator, date, fiscal
```

### Aturan Penamaan

- Semua export menggunakan prefix `CS_MOCK_` untuk data constants
- Semua interface menggunakan prefix `Cs` untuk membedakan dari shared types
- Fungsi helper tanpa prefix, menggunakan nama deskriptif

---

## 4. Desain Interface & Type Contract

### File: `app/utils/cs-mock-data/types.ts`

```typescript
import type {
  ClaimStatus,
  ClaimPhotoStatus,
  ClaimHistoryAction,
  PhotoType,
  NotificationStatus,
  UserRole,
  FieldName
} from '~~/shared/utils/constants'

// ════════════════════════════════════════
// CLAIM - List Item (untuk tabel & cards)
// ════════════════════════════════════════

/** View model untuk daftar klaim CS. Digunakan di /cs dan /cs/claims */
export interface CsClaimListItem {
  id: string                    // = claimNumber (e.g. 'CLM-2026-0001')
  claimNumber: string
  notificationCode: string      // notification code (bukan ID numerik)
  modelName: string
  inch: number
  vendorName: string            // vendor code: MOKA, MTC, SDP
  branch: string
  defectName: string
  claimStatus: ClaimStatus
  createdAt: string             // ISO-8601
  updatedAt: string             // ISO-8601
}

// ════════════════════════════════════════
// CLAIM - Full Detail (untuk detail & edit)
// ════════════════════════════════════════

/** View model lengkap untuk halaman detail dan edit claim CS */
export interface CsClaimDetail extends CsClaimListItem {
  // Hardware identifiers
  panelPartNumber: string
  ocSerialNo: string

  // ODF fields (vendor-dependent, nullable)
  odfNumber: string | null
  odfVersion: string | null
  odfWeek: string | null

  // Context
  submittedBy: string           // user ID yang membuat
  submittedByName: string       // display name CS agent
  reviewedBy: string | null     // user ID QRCC reviewer
  reviewedByName: string | null // display name reviewer

  // Revision
  revisionNote: string | null   // catatan QRCC saat minta revisi

  // Related data
  evidences: CsClaimPhoto[]
  history: CsClaimHistoryItem[]
}

// ════════════════════════════════════════
// CLAIM PHOTO
// ════════════════════════════════════════

/** Foto evidence per klaim */
export interface CsClaimPhoto {
  id: number
  claimId: string               // = claimNumber
  photoType: PhotoType
  label: string                 // human-readable label
  status: ClaimPhotoStatus      // PENDING, VERIFIED, REJECT
  filePath: string              // URL gambar (Unsplash placeholder)
  thumbnailPath: string | null
  rejectReason: string | null   // catatan QRCC jika REJECT
  createdAt: string
  updatedAt: string
}

// ════════════════════════════════════════
// CLAIM HISTORY
// ════════════════════════════════════════

/** Entry timeline/history per klaim */
export interface CsClaimHistoryItem {
  id: number
  claimId: string               // = claimNumber
  action: ClaimHistoryAction
  fromStatus: ClaimStatus | '-'
  toStatus: ClaimStatus
  userId: string
  userName: string
  userRole: UserRole
  note: string | null
  createdAt: string             // ISO-8601
}

// ════════════════════════════════════════
// NOTIFICATION (untuk lookup saat create)
// ════════════════════════════════════════

/** Record notification untuk lookup */
export interface CsNotificationRecord {
  id: number
  notificationCode: string
  notificationDate: string      // ISO-8601
  branch: string
  status: NotificationStatus
  modelId: number
  vendorId: number
}

/** Hasil lookup notification (enriched dengan relasi) */
export interface CsNotificationLookupResult {
  notification: {
    id: number
    notificationCode: string
    notificationDate: number    // timestamp ms
    branch: string
    status: NotificationStatus
  }
  productModel: {
    id: number
    name: string
    inch: number
  } | null
  vendor: {
    id: number
    code: string
    name: string
    requiredPhotos: PhotoType[]
    requiredFields: FieldName[]
  } | null
  defects: Array<{
    id: number
    code: string
    name: string
  }>
}

// ════════════════════════════════════════
// REFERENCE DATA
// ════════════════════════════════════════

/** Vendor record untuk dropdown & rules */
export interface CsVendorRecord {
  id: number
  code: string
  name: string
  requiredPhotos: PhotoType[]
  requiredFields: FieldName[]
}

/** Product model untuk dropdown */
export interface CsProductModelRecord {
  id: number
  name: string
  inch: number
  vendorId: number
}

/** Defect untuk dropdown */
export interface CsDefectRecord {
  id: number
  code: string
  name: string
}

/** Semua reference data bundled */
export interface CsReferenceData {
  vendors: CsVendorRecord[]
  productModels: CsProductModelRecord[]
  defects: CsDefectRecord[]
  branches: string[]
  photoLabelMap: Record<string, string>
  vendorRules: Record<string, {
    requiredPhotos: PhotoType[]
    requiredFields: FieldName[]
  }>
}

// ════════════════════════════════════════
// USER & SESSION
// ════════════════════════════════════════

/** CS user profile */
export interface CsUserProfile {
  id: string
  name: string
  username: string
  email: string
  role: UserRole
  branch: string
  avatarUrl: string
  phone: string
  joinedAt: string
  isActive: boolean
  lastLoginAt: string
}

/** Statistik aktivitas user CS */
export interface CsActivityStats {
  totalClaims: number
  approved: number
  pending: number        // SUBMITTED + IN_REVIEW
  revision: number       // NEED_REVISION
  draft: number          // DRAFT
}

// ════════════════════════════════════════
// CREATE CLAIM - Input payload
// ════════════════════════════════════════

/** Payload untuk membuat klaim baru */
export interface CsCreateClaimPayload {
  notificationCode: string
  modelName: string
  inch: number
  branch: string
  vendorName: string
  defectCode: string
  defectName: string
  panelPartNumber: string
  ocSerialNo: string
  odfNumber?: string
  odfVersion?: string
  odfWeek?: string
  photos: Array<{
    photoType: PhotoType
    label: string
    file: File
  }>
  submitAs: 'DRAFT' | 'SUBMITTED'
}

// ════════════════════════════════════════
// REVISION - Input payload
// ════════════════════════════════════════

/** Payload untuk submit revisi */
export interface CsRevisionPayload {
  claimId: string
  revisedFields: Record<string, string>   // field key → new value
  replacedPhotos: Array<{
    photoType: PhotoType
    file: File
  }>
  revisionNote: string
}
```

> **PENTING**: Interface ini menjadi CONTRACT antara view dan data layer. Saat backend ready, API response harus mengikuti shape ini (atau di-map di composable).

---

## 5. Spesifikasi Mock Data

### 5.1 Claims — `claims.ts`

Mock data klaim harus memenuhi kriteria berikut:

**Jumlah**: Minimal 8 klaim dengan distribusi status:

| # | Claim Number | Status | Vendor | Branch | Tujuan |
|---|-------------|--------|--------|--------|--------|
| 1 | CLM-2026-0001 | `NEED_REVISION` | MOKA | Jakarta | **Klaim utama untuk demo detail + edit/revisi** |
| 2 | CLM-2026-0002 | `APPROVED` | SDP | Surabaya | Klaim yang sudah disetujui |
| 3 | CLM-2026-0003 | `IN_REVIEW` | MTC | Bandung | Klaim sedang direview |
| 4 | CLM-2026-0004 | `SUBMITTED` | MOKA | Medan | Klaim baru disubmit |
| 5 | CLM-2026-0005 | `DRAFT` | SDP | Jakarta | Klaim draft (belum submit) |
| 6 | CLM-2025-0006 | `APPROVED` | MTC | Makassar | Klaim lama, fiscal period berbeda |
| 7 | CLM-2025-0007 | `ARCHIVED` | MOKA | Surabaya | Klaim archived |
| 8 | CLM-2025-0008 | `NEED_REVISION` | SDP | Bandung | Klaim kedua yang butuh revisi |

**Aturan data**:
- Semua `createdAt`/`updatedAt` harus ISO-8601 dan realistis (span 2025FH–2025LH)
- `submittedBy` harus konsisten — semua milik CS user aktif (`USR-001` = Sari Dewi, sesuai `MOCK_CS_USER_PROFILE`)
- `notificationCode` harus mereferensi notification yang ada di `notifications.ts`
- `vendorName` harus salah satu dari: MOKA, MTC, SDP
- `branch` harus salah satu dari: Jakarta, Surabaya, Medan, Bandung, Makassar
- `modelName` harus mereferensi product model yang ada di `reference-data.ts`
- `defectName` harus mereferensi defect yang ada di `reference-data.ts`

### 5.2 Claim Photos — `claim-photos.ts`

Setiap klaim harus punya foto sesuai vendor requirements:

**MOKA** (6 foto): CLAIM, CLAIM_ZOOM, PANEL_SN, ODF, WO_PANEL, WO_PANEL_SN
**MTC** (4 foto): CLAIM, CLAIM_ZOOM, PANEL_SN, ODF
**SDP** (4 foto): CLAIM, CLAIM_ZOOM, PANEL_SN, ODF

**Status foto berdasarkan status klaim**:

| Claim Status | Photo Status Pattern |
|-------------|---------------------|
| DRAFT | Semua PENDING (atau belum ada foto) |
| SUBMITTED | Semua PENDING |
| IN_REVIEW | Mix: beberapa VERIFIED, beberapa PENDING |
| NEED_REVISION | Minimal 1 REJECT + sisanya VERIFIED/PENDING |
| APPROVED | Semua VERIFIED |
| ARCHIVED | Semua VERIFIED |

**Untuk CLM-2026-0001 (NEED_REVISION, MOKA)** — foto harus **persis**:

| PhotoType | Status | Reject Reason |
|-----------|--------|---------------|
| CLAIM | VERIFIED | — |
| CLAIM_ZOOM | REJECT | "Foto terlalu gelap dan buram. Barcode tidak terbaca." |
| PANEL_SN | VERIFIED | — |
| ODF | PENDING | — |
| WO_PANEL | VERIFIED | — |
| WO_PANEL_SN | REJECT | "Serial number tidak terlihat jelas. Harap foto ulang dengan fokus." |

Ini memastikan halaman edit/revisi punya 2 rejected photos untuk di-fix.

**Image URLs**: Gunakan Unsplash placeholder images yang konsisten:

```typescript
const PHOTO_URLS: Record<string, string> = {
  CLAIM: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=800',
  CLAIM_ZOOM: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800',
  PANEL_SN: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
  ODF: 'https://images.unsplash.com/photo-1618044733300-9472154093ee?auto=format&fit=crop&q=80&w=800',
  WO_PANEL: 'https://images.unsplash.com/photo-1536335980403-4dbdb4b78000?auto=format&fit=crop&q=80&w=800',
  WO_PANEL_SN: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=800'
}
```

### 5.3 Claim History — `claim-history.ts`

Setiap klaim harus punya history yang realistis berdasarkan statusnya.

**Contoh CLM-2026-0001 (NEED_REVISION)**:

```
1. CREATE         DRAFT → DRAFT        by Sari Dewi (CS)     "Draft klaim dibuat"
2. UPDATE         DRAFT → DRAFT        by Sari Dewi (CS)     "Draft updated: panelPartNumber, defectCode"
3. UPLOAD_PHOTO   DRAFT → DRAFT        by Sari Dewi (CS)     "Photo CLAIM uploaded"
4. UPLOAD_PHOTO   DRAFT → DRAFT        by Sari Dewi (CS)     "Photo CLAIM_ZOOM uploaded"
5. UPLOAD_PHOTO   DRAFT → DRAFT        by Sari Dewi (CS)     "Photo PANEL_SN uploaded"
6. UPLOAD_PHOTO   DRAFT → DRAFT        by Sari Dewi (CS)     "Photo ODF uploaded"
7. UPLOAD_PHOTO   DRAFT → DRAFT        by Sari Dewi (CS)     "Photo WO_PANEL uploaded"
8. UPLOAD_PHOTO   DRAFT → DRAFT        by Sari Dewi (CS)     "Photo WO_PANEL_SN uploaded"
9. SUBMIT         DRAFT → SUBMITTED    by Sari Dewi (CS)     "Klaim diajukan untuk review"
10. REVIEW        SUBMITTED → IN_REVIEW by Budi Raharjo (QRCC) "Review dimulai"
11. REVIEW_PHOTO  IN_REVIEW → IN_REVIEW by Budi Raharjo (QRCC) "Photo CLAIM verified"
12. REVIEW_PHOTO  IN_REVIEW → IN_REVIEW by Budi Raharjo (QRCC) "Photo CLAIM_ZOOM rejected: Foto terlalu gelap"
13. REVIEW_PHOTO  IN_REVIEW → IN_REVIEW by Budi Raharjo (QRCC) "Photo PANEL_SN verified"
14. REVIEW_PHOTO  IN_REVIEW → IN_REVIEW by Budi Raharjo (QRCC) "Photo ODF — menunggu"
15. REVIEW_PHOTO  IN_REVIEW → IN_REVIEW by Budi Raharjo (QRCC) "Photo WO_PANEL verified"
16. REVIEW_PHOTO  IN_REVIEW → IN_REVIEW by Budi Raharjo (QRCC) "Photo WO_PANEL_SN rejected: SN tidak terbaca"
17. REQUEST_REVISION IN_REVIEW → NEED_REVISION by Budi Raharjo (QRCC)
    "Foto CLAIM_ZOOM dan WO_PANEL_SN ditolak. Harap upload ulang dengan kualitas lebih baik."
```

### 5.4 Notifications — `notifications.ts`

Minimal 10 notifications dengan distribusi:
- 4 × `NEW` (bisa dipakai untuk create claim baru)
- 4 × `USED` (sudah dipakai oleh klaim yang ada)
- 2 × `EXPIRED`

Notification yang status `USED` harus punya klaim yang mereferensinya di `claims.ts`.

**Contoh mapping notification → claim:**

| Notification Code | Status | Linked Claim |
|-------------------|--------|--------------|
| NTF-2026-001 | USED | CLM-2026-0001 |
| NTF-2026-002 | USED | CLM-2026-0002 |
| NTF-2026-003 | NEW | — (available) |
| NTF-2026-004 | NEW | — (available) |
| ... | | |

### 5.5 Reference Data — `reference-data.ts`

**HARUS IDENTIK** dengan `server/utils/notification-data.ts`:

```typescript
// Vendors — sama persis dengan server data
export const CS_MOCK_VENDORS: CsVendorRecord[] = [
  {
    id: 1, code: 'MOKA', name: 'MOKA Display',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF', 'WO_PANEL', 'WO_PANEL_SN'],
    requiredFields: ['odfNumber', 'version', 'week']
  },
  {
    id: 2, code: 'MTC', name: 'MTC Panel',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'],
    requiredFields: []
  },
  {
    id: 3, code: 'SDP', name: 'SDP Electronics',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'],
    requiredFields: []
  }
]

// Product Models — sama persis
export const CS_MOCK_PRODUCT_MODELS: CsProductModelRecord[] = [
  { id: 1, name: '4T-C43HJ6000I', inch: 43, vendorId: 1 },
  { id: 2, name: '4T-C55HJ6000I', inch: 55, vendorId: 1 },
  { id: 3, name: '4T-C50FJ1I', inch: 50, vendorId: 2 },
  { id: 4, name: '4T-C55FJ1I', inch: 55, vendorId: 2 },
  { id: 5, name: '2T-C-42FD1I', inch: 42, vendorId: 3 }
]

// Defects — sama persis
export const CS_MOCK_DEFECTS: CsDefectRecord[] = [
  { id: 1, code: 'DEF-001', name: 'No Display' },
  { id: 2, code: 'DEF-002', name: 'Vertical Line' },
  { id: 3, code: 'DEF-003', name: 'Horizontal Line' },
  { id: 4, code: 'DEF-004', name: 'Broken Panel' },
  { id: 5, code: 'DEF-005', name: 'Flicker' },
  { id: 6, code: 'DEF-006', name: 'Dark Spot' },
  { id: 7, code: 'DEF-007', name: 'Backlight Bleed' }
]

// Branches
export const CS_MOCK_BRANCHES = [
  'JAKARTA', 'SURABAYA', 'MEDAN', 'BANDUNG', 'MAKASSAR'
] as const

// Photo label map
export const PHOTO_LABEL_MAP: Record<string, string> = {
  CLAIM: 'Main Claim Photo',
  CLAIM_ZOOM: 'Defect Zoom',
  PANEL_SN: 'Panel Part Number',
  ODF: 'ODF Document',
  WO_PANEL: 'Written Off Panel',
  WO_PANEL_SN: 'Written Off Panel SN'
}
```

### 5.6 User — `user.ts`

```typescript
export const CS_MOCK_CURRENT_USER: CsUserProfile = {
  id: 'USR-001',
  name: 'Sari Dewi',
  username: 'sari.dewi',
  email: 'sari.dewi@sharp.co.id',
  role: 'CS',
  branch: 'Jakarta',
  avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sari',
  phone: '+62 812-9988-7766',
  joinedAt: '2024-06-10T00:00:00Z',
  isActive: true,
  lastLoginAt: '2026-03-26T08:15:00Z'
}

// Juga export QRCC user untuk referensi di history
export const CS_MOCK_QRCC_REVIEWER = {
  id: 'USR-003',
  name: 'Budi Raharjo',
  role: 'QRCC' as const
}
```

> **PENTING**: `CS_MOCK_CURRENT_USER.id` = `'USR-001'` harus SAMA dengan `MOCK_AUTH_USERS[0].id` di `app/utils/mock-data.ts`. `CS_MOCK_CURRENT_USER` menggantikan `MOCK_CS_USER_PROFILE` yang lama. Pastikan juga id `USR-001` konsisten digunakan sebagai `submittedBy` di semua klaim CS.

---

## 6. Composable `useCsMockStore`

### File: `app/composables/useCsMockStore.ts`

Ini adalah **satu-satunya entry point** yang dipakai semua halaman CS untuk mengakses data.

```typescript
// app/composables/useCsMockStore.ts

import type {
  CsClaimListItem,
  CsClaimDetail,
  CsClaimPhoto,
  CsClaimHistoryItem,
  CsNotificationLookupResult,
  CsUserProfile,
  CsActivityStats,
  CsReferenceData,
  CsCreateClaimPayload,
  CsRevisionPayload
} from '~/utils/cs-mock-data/types'

// ═══════════════════════════════════════════════
// PRIVATE STATE (module-level, shared across calls)
// ═══════════════════════════════════════════════

// Reactive arrays — dimutasi oleh create/submit/revision operations
const _claims = ref<CsClaimDetail[]>([...initialClaims])
const _notifications = ref([...initialNotifications])

// ═══════════════════════════════════════════════
// PUBLIC COMPOSABLE
// ═══════════════════════════════════════════════

export function useCsMockStore() {

  // ── READ OPERATIONS ──

  /** Semua klaim milik CS user saat ini, sorted by updatedAt DESC */
  const claims = computed<CsClaimListItem[]>(() => {
    return _claims.value
      .map(c => ({
        id: c.id,
        claimNumber: c.claimNumber,
        notificationCode: c.notificationCode,
        modelName: c.modelName,
        inch: c.inch,
        vendorName: c.vendorName,
        branch: c.branch,
        defectName: c.defectName,
        claimStatus: c.claimStatus,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
      .sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
  })

  /** Detail klaim by ID (claimNumber) */
  function getClaimDetail(claimId: string): CsClaimDetail | null {
    return _claims.value.find(c => c.claimNumber === claimId) ?? null
  }

  /** Lookup notification by code */
  function lookupNotification(code: string): CsNotificationLookupResult | null {
    // ... cari di _notifications, enrich dengan reference data
  }

  /** Semua notifications */
  const notifications = computed(() => [..._notifications.value])

  /** Current user profile */
  const currentUser: CsUserProfile = CS_MOCK_CURRENT_USER

  /** Activity stats computed dari claims */
  const activityStats = computed<CsActivityStats>(() => {
    const all = _claims.value
    return {
      totalClaims: all.length,
      approved: all.filter(c => c.claimStatus === 'APPROVED').length,
      pending: all.filter(c =>
        c.claimStatus === 'SUBMITTED' || c.claimStatus === 'IN_REVIEW'
      ).length,
      revision: all.filter(c => c.claimStatus === 'NEED_REVISION').length,
      draft: all.filter(c => c.claimStatus === 'DRAFT').length
    }
  })

  /** Reference data for dropdowns */
  const referenceData: CsReferenceData = {
    vendors: CS_MOCK_VENDORS,
    productModels: CS_MOCK_PRODUCT_MODELS,
    defects: CS_MOCK_DEFECTS,
    branches: [...CS_MOCK_BRANCHES],
    photoLabelMap: PHOTO_LABEL_MAP,
    vendorRules: { /* derived from vendors */ }
  }

  // ── WRITE OPERATIONS ──

  /** Create new claim (DRAFT or SUBMITTED) */
  function createClaim(payload: CsCreateClaimPayload): CsClaimDetail {
    const claimNumber = generateClaimNumber()
    const now = new Date().toISOString()

    const newClaim: CsClaimDetail = {
      id: claimNumber,
      claimNumber,
      notificationCode: payload.notificationCode,
      modelName: payload.modelName,
      inch: payload.inch,
      vendorName: payload.vendorName,
      branch: payload.branch,
      defectName: payload.defectName,
      panelPartNumber: payload.panelPartNumber,
      ocSerialNo: payload.ocSerialNo,
      odfNumber: payload.odfNumber ?? null,
      odfVersion: payload.odfVersion ?? null,
      odfWeek: payload.odfWeek ?? null,
      claimStatus: payload.submitAs,
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      reviewedBy: null,
      reviewedByName: null,
      revisionNote: null,
      createdAt: now,
      updatedAt: now,
      evidences: payload.photos.map((p, idx) => ({
        id: Date.now() + idx,
        claimId: claimNumber,
        photoType: p.photoType,
        label: p.label,
        status: 'PENDING' as const,
        filePath: URL.createObjectURL(p.file),
        thumbnailPath: null,
        rejectReason: null,
        createdAt: now,
        updatedAt: now
      })),
      history: [
        {
          id: Date.now(),
          claimId: claimNumber,
          action: 'CREATE',
          fromStatus: '-',
          toStatus: 'DRAFT',
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: 'CS',
          note: 'Draft klaim dibuat.',
          createdAt: now
        },
        // Jika langsung submit, tambah SUBMIT entry
        ...(payload.submitAs === 'SUBMITTED' ? [{
          id: Date.now() + 1,
          claimId: claimNumber,
          action: 'SUBMIT' as const,
          fromStatus: 'DRAFT' as const,
          toStatus: 'SUBMITTED' as const,
          userId: currentUser.id,
          userName: currentUser.name,
          userRole: 'CS' as const,
          note: 'Klaim diajukan untuk review.',
          createdAt: new Date(Date.now() + 1000).toISOString()
        }] : [])
      ]
    }

    _claims.value.unshift(newClaim)

    // Update notification status to USED
    const notif = _notifications.value.find(
      n => n.notificationCode === payload.notificationCode
    )
    if (notif) notif.status = 'USED'

    return newClaim
  }

  /** Submit existing DRAFT claim */
  function submitClaim(claimId: string): boolean {
    const claim = _claims.value.find(c => c.claimNumber === claimId)
    if (!claim || claim.claimStatus !== 'DRAFT') return false

    claim.claimStatus = 'SUBMITTED'
    claim.updatedAt = new Date().toISOString()
    claim.history.push({
      id: Date.now(),
      claimId,
      action: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'CS',
      note: 'Klaim diajukan untuk review.',
      createdAt: claim.updatedAt
    })
    return true
  }

  /** Submit revision for NEED_REVISION claim */
  function submitRevision(payload: CsRevisionPayload): boolean {
    const claim = _claims.value.find(c => c.claimNumber === payload.claimId)
    if (!claim || claim.claimStatus !== 'NEED_REVISION') return false

    const now = new Date().toISOString()

    // Apply revised fields
    for (const [key, value] of Object.entries(payload.revisedFields)) {
      if (key in claim) {
        (claim as any)[key] = value
      }
    }

    // Replace rejected photos
    for (const photo of payload.replacedPhotos) {
      const existing = claim.evidences.find(e => e.photoType === photo.photoType)
      if (existing) {
        existing.status = 'PENDING'
        existing.rejectReason = null
        existing.filePath = URL.createObjectURL(photo.file)
        existing.updatedAt = now
      }
    }

    // Reset semua REJECT foto yang di-replace ke PENDING
    // Update claim status
    claim.claimStatus = 'SUBMITTED'
    claim.revisionNote = null
    claim.updatedAt = now

    // Add history
    claim.history.push({
      id: Date.now(),
      claimId: payload.claimId,
      action: 'SUBMIT',
      fromStatus: 'NEED_REVISION',
      toStatus: 'SUBMITTED',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: 'CS',
      note: payload.revisionNote || 'Revisi diajukan ulang.',
      createdAt: now
    })

    return true
  }

  return {
    // Read
    claims,
    getClaimDetail,
    lookupNotification,
    notifications,
    currentUser,
    activityStats,
    referenceData,

    // Write
    createClaim,
    submitClaim,
    submitRevision
  }
}
```

### Kenapa Module-Level State?

```typescript
// STATE di luar fungsi composable (module-level)
const _claims = ref<CsClaimDetail[]>([...initialClaims])
```

Ini memastikan **semua komponen yang memanggil `useCsMockStore()`** mendapat referensi ke reactive state yang SAMA. Jadi ketika create page menambah claim baru, list page dan dashboard langsung melihat perubahan.

Ini adalah pattern yang umum di Vue 3 composables untuk "poor man's store" — mirip dengan Pinia store tanpa dependency tambahan.

---

## 7. Rencana Perubahan Per Halaman

### 7.1 Layout `cs.vue`

**Saat ini**: Import `MOCK_CS_USER_PROFILE` dari `~/utils/mock-data`
**Setelah**: Import dari composable

```diff
- import { MOCK_CS_USER_PROFILE } from '~/utils/mock-data'
+ const { currentUser } = useCsMockStore()

- const user = MOCK_CS_USER_PROFILE
+ const user = currentUser
```

Perubahan minimal — hanya ganti source import.

### 7.2 `/cs` — CS Dashboard

**Saat ini**:
- `useFetch<RawClaim[]>('/api/claims')` untuk data klaim
- `useFetch<RawNotification[]>('/api/notifications')` untuk data notification
- Interface `RawClaim` dan `RawNotification` didefinisikan inline
- Search/lookup modal hit `$fetch('/api/notifications/${code}')`

**Setelah**:
```typescript
const {
  claims,
  notifications,
  activityStats,
  lookupNotification,
  getClaimDetail
} = useCsMockStore()
```

**Perubahan detail**:

1. **Hapus** semua `useFetch` calls dan inline interfaces
2. **Ganti** `rawClaims` → `claims` (sudah sorted, sudah mapped)
3. **Ganti** `rawNotifications` → `notifications`
4. **Ganti** `personalStats` computed → `activityStats` (sudah computed di store)
5. **Ganti** `$fetch('/api/notifications/${code}')` → `lookupNotification(code)`
6. **Ganti** claims lookup di search modal → `getClaimDetail(id)` atau filter dari `claims`
7. **Hapus** computed `claimsData` — store sudah return format yang benar

**Hero notification lookup**:
```typescript
// Sebelum
const notification = await $fetch(`/api/notifications/${code}`)

// Sesudah
const result = lookupNotification(code)
if (!result) {
  // show 404 modal
} else if (result.notification.status !== 'NEW') {
  // show already-used modal
} else {
  navigateTo(`/cs/claims/create?notification=${code}`)
}
```

### 7.3 `/cs/claims` — My Claims List

**Saat ini**:
- `useFetch<RawClaim[]>('/api/claims')` untuk data klaim
- Inline type `RawClaim`, `ClaimItem`, `Status`, `StatusFilter`, dll
- Manual mapping dari `RawClaim` → `ClaimItem`
- Filter dan sort semua client-side

**Setelah**:
```typescript
const { claims, activityStats, referenceData } = useCsMockStore()
```

**Perubahan detail**:

1. **Hapus** `useFetch` dan inline `RawClaim` interface
2. **Ganti** data source ke `claims` dari store (sudah `CsClaimListItem[]`)
3. **Hapus** manual mapping ke `ClaimItem` — gunakan `CsClaimListItem` langsung
4. **Ganti** inline status counts → `activityStats` dari store
5. **Pertahankan** filter logic, TanStack table, pagination — mereka bekerja di atas computed data
6. **Ganti** vendor/defect filter options:
   ```typescript
   const vendorOptions = referenceData.vendors.map(v => v.code)
   const defectOptions = referenceData.defects.map(d => d.name)
   ```

**Catatan penting**: Column definitions di TanStack table perlu disesuaikan field name-nya:
```diff
- accessorKey: 'notificationCode'
+ accessorKey: 'notificationCode'  // SAMA — sudah konsisten di CsClaimListItem

- accessorKey: 'model'
+ accessorKey: 'modelName'

- accessorKey: 'vendor'
+ accessorKey: 'vendorName'

- accessorKey: 'defect'
+ accessorKey: 'defectName'

- accessorKey: 'lastUpdate'
+ accessorKey: 'updatedAt'
```

### 7.4 `/cs/claims/create` — Create Claim Wizard

**Saat ini**:
- `$fetch('/api/notifications/${code}')` untuk notification lookup
- Hardcoded constants: `branches`, `DEFAULT_DEFECT_OPTIONS`, `productModelOptions`, `VENDOR_RULES_FALLBACK`, `PHOTO_LABEL_MAP`
- Mock submit (console.log only)

**Setelah**:
```typescript
const {
  lookupNotification,
  referenceData,
  createClaim,
  currentUser
} = useCsMockStore()
```

**Perubahan detail**:

1. **Ganti** `$fetch` notification lookup → `lookupNotification(code)`
   ```typescript
   const handleSearch = async () => {
     isSearching.value = true
     lookupError.value = ''

     // Simulate network delay for UX
     await new Promise(resolve => setTimeout(resolve, 500))

     const result = lookupNotification(form.value.notificationCode)
     if (!result) {
       lookupError.value = 'Notification not found'
     } else {
       // Auto-fill form dari result
       notificationFound.value = true
       notificationStatus.value = result.notification.status
       if (result.productModel) {
         form.value.model = result.productModel.name
         form.value.inch = String(result.productModel.inch)
       }
       if (result.vendor) {
         form.value.vendor = result.vendor.code
         vendorRequiredPhotos.value = result.vendor.requiredPhotos
         vendorRequiredFields.value = result.vendor.requiredFields
       }
       form.value.branch = result.notification.branch
       defectOptions.value = result.defects
     }

     isSearching.value = false
   }
   ```

2. **Ganti** semua hardcoded reference data → `referenceData` dari store:
   ```diff
   - const vendors = INITIAL_VENDORS
   + const vendors = referenceData.vendors.map(v => v.code)

   - const branches = ['JAKARTA', 'SURABAYA', ...] as const
   + const branches = referenceData.branches

   - const DEFAULT_DEFECT_OPTIONS = [...]
   + const defectOptions = ref(referenceData.defects.map(d => ({ code: d.code, name: d.name })))

   - const productModelOptions = [...]
   + const productModelOptions = referenceData.productModels.map(m => ({ id: m.id, name: m.name }))

   - const VENDOR_RULES_FALLBACK = {...}
   + // Sudah di-handle oleh referenceData.vendorRules

   - const PHOTO_LABEL_MAP = {...}
   + const photoLabelMap = referenceData.photoLabelMap
   ```

3. **Ganti** mock submit → `createClaim()`:
   ```typescript
   const handleSubmit = (submitAs: 'DRAFT' | 'SUBMITTED') => {
     // ... validation ...

     const newClaim = createClaim({
       notificationCode: form.value.notificationCode,
       modelName: form.value.model,
       inch: Number(form.value.inch),
       branch: form.value.branch,
       vendorName: form.value.vendor,
       defectCode: form.value.defectType,
       defectName: defectOptions.value.find(d => d.code === form.value.defectType)?.name ?? '',
       panelPartNumber: form.value.panelPartNumber,
       ocSerialNo: form.value.ocSN,
       odfNumber: form.value.odfNumber || undefined,
       odfVersion: form.value.odfVersion || undefined,
       odfWeek: form.value.odfWeek || undefined,
       photos: photoRequirements.value
         .filter(p => uploads.value[p.id])
         .map(p => ({
           photoType: p.id as PhotoType,
           label: p.label,
           file: uploads.value[p.id]!
         })),
       submitAs
     })

     toast.add({
       title: submitAs === 'SUBMITTED' ? 'Claim submitted!' : 'Draft saved!',
       description: `Claim ${newClaim.claimNumber} berhasil ${submitAs === 'SUBMITTED' ? 'diajukan' : 'disimpan'}.`,
       color: 'success'
     })

     // Navigate ke detail
     navigateTo(`/cs/claims/${newClaim.claimNumber}`)
   }
   ```

### 7.5 `/cs/claims/[id]` — Claim Detail

**Saat ini**: SEMUA data hardcoded inline (`ref({...})` dengan data statis)
**Ini adalah perubahan TERBESAR.**

**Setelah**:
```typescript
const { getClaimDetail, currentUser } = useCsMockStore()

const route = useRoute()
const claimId = typeof route.params.id === 'string' ? route.params.id : ''

const claim = computed(() => getClaimDetail(claimId))
const isLoading = ref(true)

onMounted(() => {
  // Simulate loading
  setTimeout(() => { isLoading.value = false }, 500)
})
```

**Perubahan detail**:

1. **Hapus** seluruh inline `ref({...})` dengan data hardcoded
2. **Ganti** dengan `computed(() => getClaimDetail(claimId))` dari store
3. **Handle** null case (claim not found → show error/redirect)
4. **Update** template bindings:

```diff
- {{ claim.id }}
+ {{ claim?.claimNumber }}

- {{ claim.status }}
+ {{ claim?.claimStatus }}

- {{ claim.agent }}
+ {{ claim?.submittedByName }}

- {{ claim.branch }}
+ {{ claim?.branch }}

- {{ claim.notificationCode }}
+ {{ claim?.notificationCode }}

- {{ claim.product.model }}
+ {{ claim?.modelName }}

- {{ claim.product.size }}
+ {{ claim?.inch }} Inch

- {{ claim.product.vendor }}
+ {{ claim?.vendorName }}

- {{ claim.product.panelPartNumber }}
+ {{ claim?.panelPartNumber }}

- {{ claim.product.ocSN }}
+ {{ claim?.ocSerialNo }}

- {{ claim.product.defect }}
+ {{ claim?.defectName }}

- {{ claim.revisionNote }}
+ {{ claim?.revisionNote }}
```

5. **Update** evidences tab — data sudah dalam format `CsClaimPhoto[]`:
```diff
- claim.evidences  →  claim?.evidences
```
Map ke PhotoEvidenceCard props:
```typescript
// ev.id → ev.photoType (untuk key)
// ev.label → ev.label
// ev.status → ev.status
// ev.url → ev.filePath
// ev.note → ev.rejectReason || 'Menunggu review.'
```

6. **Update** history tab — data sudah dalam format `CsClaimHistoryItem[]`:
```typescript
const formattedHistory = computed<TimelineItem[]>(() => {
  if (!claim.value) return []
  return claim.value.history
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(log => ({
      id: log.id,
      date: formatDateTime(log.createdAt),
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      note: log.note,
      actionColor: getActionColor(log.action)
    }))
})
```

### 7.6 `/cs/claims/[id]/edit` — Revise Claim

**Saat ini**: SEMUA data hardcoded inline (`ref<ClaimState>({...})`)
**Juga perubahan besar.**

**Setelah**:
```typescript
const { getClaimDetail, submitRevision, referenceData } = useCsMockStore()

const route = useRoute()
const claimId = typeof route.params.id === 'string' ? route.params.id : ''

const claimData = computed(() => getClaimDetail(claimId))
```

**Perubahan detail**:

1. **Hapus** inline `ClaimState` interface dan `ref<ClaimState>({...})`
2. **Load** data dari store:
   ```typescript
   // Mutable local copy for editing
   const editForm = ref({
     panelPartNumber: '',
     ocSerialNo: '',
     defectType: '',
     odfNumber: '',
     odfVersion: '',
     odfWeek: ''
   })

   // Initialize from store data
   watchEffect(() => {
     const c = claimData.value
     if (c) {
       editForm.value = {
         panelPartNumber: c.panelPartNumber,
         ocSerialNo: c.ocSerialNo,
         defectType: c.defectName,
         odfNumber: c.odfNumber ?? '',
         odfVersion: c.odfVersion ?? '',
         odfWeek: c.odfWeek ?? ''
       }
       // Store original values for comparison
       originalValues.value = { ...editForm.value }
     }
   })
   ```

3. **Evidences** — load dari store data:
   ```typescript
   const evidences = computed(() => claimData.value?.evidences ?? [])
   const rejectedEvidences = computed(() =>
     evidences.value.filter(ev => ev.status === 'REJECT')
   )
   ```

4. **History** — load dari store data:
   ```typescript
   const history = computed(() => claimData.value?.history ?? [])
   ```

5. **Submit** — panggil store:
   ```typescript
   const handleSubmitRevision = () => {
     const success = submitRevision({
       claimId,
       revisedFields: getRevisedFields(),
       replacedPhotos: getReplacedPhotos(),
       revisionNote: revisionNote.value
     })

     if (success) {
       toast.add({
         title: 'Revision submitted',
         description: 'Revisi claim berhasil dikirim ke QRCC.',
         color: 'success'
       })
       navigateTo(`/cs/claims/${claimId}`)
     }
   }
   ```

6. **Guard**: Jika claim tidak berstatus `NEED_REVISION`, redirect:
   ```typescript
   watch(claimData, (c) => {
     if (c && c.claimStatus !== 'NEED_REVISION') {
       navigateTo(`/cs/claims/${claimId}`)
     }
   }, { immediate: true })
   ```

### 7.7 `/cs/profile` — User Profile

**Saat ini**: Import `MOCK_CS_USER_PROFILE` + hardcoded `activityStats`
**Setelah**:
```typescript
const { currentUser, activityStats } = useCsMockStore()
```

**Perubahan detail**:

1. **Ganti** `MOCK_CS_USER_PROFILE` → `currentUser`
2. **Ganti** hardcoded `activityStats` → computed `activityStats` dari store
3. **Profile edit** tetap mock (simpan ke local ref) — nanti backend handle
4. **Password change** tetap mock

---

## 8. Flow Lengkap: Create → Detail → Edit → Submit

Berikut alur data end-to-end yang HARUS bekerja setelah implementasi:

### Skenario 1: Create & Submit Baru

```
1. User buka /cs
   → Dashboard menampilkan stats dari store.activityStats
   → Recent claims dari store.claims (4 terbaru)

2. User ketik notification code "NTF-2026-003" di hero input
   → store.lookupNotification("NTF-2026-003") → found, status NEW
   → Navigate ke /cs/claims/create?notification=NTF-2026-003

3. User di /cs/claims/create
   → Auto-lookup: store.lookupNotification("NTF-2026-003")
   → Form auto-fill: model, inch, branch, vendor dari result
   → Reference data (defects, branches) dari store.referenceData
   → User isi panelPartNumber, ocSN, defect, upload photos

4. User klik "SUBMIT"
   → store.createClaim(payload) dipanggil
   → Claim baru CLM-2026-0009 dibuat dengan status SUBMITTED
   → History: CREATE + SUBMIT entries
   → Notification NTF-2026-003 status berubah jadi USED
   → Navigate ke /cs/claims/CLM-2026-0009

5. User di /cs/claims/CLM-2026-0009 (detail)
   → store.getClaimDetail("CLM-2026-0009") → menampilkan data baru
   → Status badge: SUBMITTED
   → Photos: semua PENDING
   → History: 2 entries (CREATE, SUBMIT)

6. User kembali ke /cs/claims (list)
   → store.claims sekarang punya 9 items (termasuk yang baru)
   → Claim baru muncul di urutan pertama
   → Stats updated: totalClaims bertambah 1
```

### Skenario 2: View & Revise Existing Claim

```
1. User buka /cs/claims
   → Lihat CLM-2026-0001 dengan status NEED_REVISION (badge amber)

2. User klik CLM-2026-0001 → /cs/claims/CLM-2026-0001
   → Detail page menampilkan data dari store
   → Revision banner muncul dengan QRCC feedback
   → Tab Photos: 2 REJECT (CLAIM_ZOOM, WO_PANEL_SN), 2 VERIFIED, 2 PENDING/VERIFIED
   → Tab History: 17 entries timeline lengkap
   → Tombol "REVISE CLAIM" terlihat

3. User klik "REVISE CLAIM" → /cs/claims/CLM-2026-0001/edit
   → Step 1: Form pre-filled dari store data
   → QRCC feedback ditampilkan di banner
   → User edit panelPartNumber

4. User next ke Step 2
   → Rejected photos ditampilkan (CLAIM_ZOOM, WO_PANEL_SN)
   → User upload foto baru untuk keduanya
   → Fixed count: 2/2

5. User next ke Step 3
   → Summary: 1 field revised (panelPartNumber), 2 photos replaced
   → User tulis revision note
   → User klik "SUBMIT REVISION"

6. store.submitRevision() dipanggil:
   → CLM-2026-0001 status: NEED_REVISION → SUBMITTED
   → Rejected photos → status PENDING (foto baru)
   → Revised fields updated
   → History: entry SUBMIT baru ditambahkan
   → Navigate ke /cs/claims/CLM-2026-0001

7. Detail page sekarang menampilkan:
   → Status: SUBMITTED (bukan NEED_REVISION lagi)
   → Revision banner HILANG
   → Photos: semua PENDING (yang baru) + VERIFIED (yang lama)
   → History: 18 entries (termasuk SUBMIT revision baru)
   → Tombol "REVISE CLAIM" HILANG
```

---

## 9. Strategi Migrasi ke Backend Nyata

### Layer Abstraksi

Saat backend ready, **hanya `useCsMockStore.ts` yang perlu diubah**. Interface tetap sama.

```typescript
// SEBELUM (mock)
export function useCsMockStore() {
  const claims = computed(() => _claims.value.map(mapToListItem))

  function getClaimDetail(id: string) {
    return _claims.value.find(c => c.claimNumber === id) ?? null
  }

  // ...
}

// SESUDAH (real API)
export function useCsStore() {
  const { data: claims } = useFetch<CsClaimListItem[]>('/api/cs/claims')

  async function getClaimDetail(id: string) {
    return await $fetch<CsClaimDetail>(`/api/cs/claims/${id}`)
  }

  async function createClaim(payload: CsCreateClaimPayload) {
    return await $fetch<CsClaimDetail>('/api/cs/claims', {
      method: 'POST',
      body: payload
    })
  }

  // ...
}
```

### Checklist Migrasi

- [ ] Rename `useCsMockStore` → `useCsStore`
- [ ] Ganti `ref<CsClaimDetail[]>(initialData)` → `useFetch('/api/cs/claims')`
- [ ] Ganti `_claims.value.find(...)` → `$fetch('/api/cs/claims/${id}')`
- [ ] Ganti `_claims.value.unshift(...)` → `$fetch('/api/cs/claims', { method: 'POST', body })`
- [ ] Ganti `lookupNotification()` → `$fetch('/api/notifications/${code}')`
- [ ] Ganti `submitRevision()` → `$fetch('/api/cs/claims/${id}/revision', { method: 'POST', body })`
- [ ] Tambah error handling (`try/catch`, loading states)
- [ ] Tambah `refresh()` calls setelah mutations
- [ ] Hapus file `app/utils/cs-mock-data/` (atau keep sebagai test fixtures)

### API Endpoints yang Dibutuhkan Backend

| Method | Path | Request | Response | Keterangan |
|--------|------|---------|----------|------------|
| GET | `/api/cs/claims` | query: `?status=&vendor=&search=` | `CsClaimListItem[]` | Klaim milik user saat ini |
| GET | `/api/cs/claims/:id` | — | `CsClaimDetail` | Detail lengkap + photos + history |
| POST | `/api/cs/claims` | `CsCreateClaimPayload` (multipart) | `CsClaimDetail` | Buat klaim baru |
| POST | `/api/cs/claims/:id/submit` | — | `CsClaimDetail` | Submit draft |
| POST | `/api/cs/claims/:id/revision` | `CsRevisionPayload` (multipart) | `CsClaimDetail` | Submit revision |
| GET | `/api/notifications/:code` | — | `CsNotificationLookupResult` | Lookup notification |
| GET | `/api/reference/vendors` | — | `CsVendorRecord[]` | Master vendors |
| GET | `/api/reference/product-models` | — | `CsProductModelRecord[]` | Master product models |
| GET | `/api/reference/defects` | — | `CsDefectRecord[]` | Master defects |
| GET | `/api/auth/me` | — | `CsUserProfile` | Current user profile |

---

## 10. Checklist Implementasi

### Phase 1: Buat Mock Data Files
- [x] Buat folder `app/utils/cs-mock-data/`
- [x] Buat `types.ts` — semua interface sesuai Section 4
- [x] Buat `helpers.ts` — claim number generator, date formatters
- [x] Buat `user.ts` — CS_MOCK_CURRENT_USER + QRCC reviewer
- [x] Buat `reference-data.ts` — vendors, models, defects, branches (identik server)
- [x] Buat `notifications.ts` — 10+ notifications dengan status terdistribusi
- [x] Buat `claim-photos.ts` — generator foto per claim berdasarkan vendor
- [x] Buat `claim-history.ts` — generator history per claim berdasarkan status
- [x] Buat `claims.ts` — 8 claims dengan relasi lengkap ke photos & history
- [x] Buat `index.ts` — barrel export

### Phase 2: Buat Composable
- [x] Buat `app/composables/useCsMockStore.ts`
- [x] Implement semua READ operations (claims, getClaimDetail, lookupNotification, dll)
- [x] Implement semua WRITE operations (createClaim, submitClaim, submitRevision)
- [x] Test reactive state: mutasi di satu tempat terlihat di tempat lain

### Phase 3: Migrasi Halaman (Satu Per Satu)
- [x] **Layout `cs.vue`**: Ganti MOCK_CS_USER_PROFILE → currentUser
- [x] **`/cs/profile`**: Ganti import + hardcoded stats → store
- [x] **`/cs/claims`**: Ganti useFetch → store.claims
- [x] **`/cs`**: Ganti useFetch + inline lookup → store
- [x] **`/cs/claims/[id]`**: Ganti hardcoded ref → store.getClaimDetail
- [x] **`/cs/claims/[id]/edit`**: Ganti hardcoded ref → store + submitRevision
- [x] **`/cs/claims/create`**: Ganti API calls + hardcoded data → store

### Phase 4: Verifikasi End-to-End
- [x] Test flow: Buka dashboard → lihat stats → buka list → lihat data yang sama
- [x] Test flow: Create claim → navigate ke detail → data muncul
- [x] Test flow: Buka claim NEED_REVISION → detail → edit → submit → detail updated
- [x] Test: Notification lookup di dashboard hero → create page
- [x] Test: Filter dan sort di claims list bekerja dengan data baru
- [x] Test: Profile page stats konsisten dengan claims data
- [x] Test: Mobile responsive tidak rusak / ada temuan minor layout kurang rapih saat mobile

### Phase 5: Cleanup
- [x] Hapus referensi lama ke `MOCK_CS_USER_PROFILE` dari `app/utils/mock-data.ts`
- [x] Hapus inline interfaces yang sudah ada di `types.ts`
- [x] Pastikan tidak ada import lama yang tersisa
- [x] Run `pnpm lint:fix` dan `pnpm typecheck`

---

## 11. Catatan untuk Developer / AI Agent

### Do's ✅

1. **Selalu gunakan `useCsMockStore()`** — jangan import data file langsung dari halaman
2. **Gunakan interface dari `cs-mock-data/types.ts`** — jangan buat interface baru inline
3. **Pertahankan reactive state** — gunakan `computed` untuk read, fungsi store untuk write
4. **Pertahankan UX patterns** — autosave indicator, loading states, validation tetap sama
5. **Test flow end-to-end** — pastikan data mengalir dari create → list → detail → edit
6. **Konsistenkan field names** — pakai `claimNumber` bukan `id`, `vendorName` bukan `vendor`, dst
7. **Jaga konsistensi dengan server mock** — reference data (vendors, models, defects) harus IDENTIK
8. **Simpan fiscal period awareness** — claims list filter masih menggunakan `shared/utils/fiscal.ts`

### Don'ts ❌

1. **Jangan ubah file di `server/`** — server mock data untuk dashboard area tetap terpisah
2. **Jangan ubah `app/utils/mock-data.ts`** — file ini digunakan dashboard area (kecuali menghapus `MOCK_CS_USER_PROFILE` yang sudah dipindahkan)
3. **Jangan ubah component files** (`StatusBadge`, `PhotoEvidenceCard`, dll) kecuali benar-benar perlu
4. **Jangan ubah shared types** di `app/utils/types.ts` atau `shared/utils/constants.ts`
5. **Jangan hard-delete data** — semua mock data harus "survive" page navigation
6. **Jangan gunakan `localStorage`** untuk persistence — cukup module-level reactive state
7. **Jangan buat API routes baru** — ini murni client-side mock data

### Urutan Kerja yang Disarankan

```
1. Types     → Definisikan semua interface dulu
2. Data      → Buat mock data yang konsisten
3. Store     → Buat composable dengan semua operations
4. Easy pages → Layout, profile, claims list (perubahan kecil)
5. Hard pages → Detail, edit, create (perubahan besar)
6. Testing   → Verifikasi semua flow
7. Cleanup   → Hapus import lama, lint, typecheck
```

### Referensi Database Schema

Saat membuat mock data, selalu cross-check dengan schema di `server/database/schema/`:

| Table | Schema File | Key Fields |
|-------|------------|------------|
| claim | `claim.ts` | claimNumber, notificationId, modelId, vendorId, inch, branch, odfNumber, panelPartNumber, ocSerialNo, defectCode, version, week, claimStatus |
| claim_photo | `claim-photo.ts` | claimId, photoType (UQ per claim), filePath, status, rejectReason |
| claim_history | `claim-history.ts` | claimId, action, fromStatus, toStatus, userId, userRole, note |
| notification_master | `notification-master.ts` | notificationCode (UQ), status, modelId, branch, vendorId |
| vendor | `vendor.ts` | code (UQ), requiredPhotos (JSON), requiredFields (JSON) |
| product_model | `product-model.ts` | name (UQ), vendorId, inch |
| defect_master | `defect-master.ts` | code (UQ), name |

### Fiscal Period Reminder

- Semua tanggal claim harus realistis dan span fiscal periods
- `2025FH` = 1 Apr 2025 – 30 Sep 2025
- `2025LH` = 1 Oct 2025 – 31 Mar 2026
- Gunakan `getFiscalPeriodInfo()` dari `shared/utils/fiscal.ts` jika perlu compute fiscal fields
- Claims list page menggunakan fiscal-aware date filtering — pastikan data punya cukup variasi tanggal

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Mock data constants | `CS_MOCK_` prefix | `CS_MOCK_CLAIMS`, `CS_MOCK_VENDORS` |
| Interface types | `Cs` prefix | `CsClaimDetail`, `CsUserProfile` |
| Composable | `useCsMockStore` | — |
| File names | kebab-case | `claim-photos.ts`, `reference-data.ts` |
| Export functions | camelCase | `generateClaimNumber()`, `getPhotoLabel()` |

---

> **Dokumen ini adalah single source of truth untuk implementasi unified mock data CS area.**
> Jika ada ambiguitas, prioritaskan: (1) database schema, (2) `shared/utils/constants.ts`, (3) dokumen ini, (4) PRD.
