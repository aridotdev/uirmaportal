# Architecture & Patterns Review

> **Status**: PARTIAL — review backend dan shared/config sudah selesai, frontend belum selesai.
> **Reviewer**: Opus (model mahal) sesuai poin 5 Workflow Optimal di `cara-prompt.md`
> **Tanggal**: 10 April 2026

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Shared Utils & Types](#2-shared-utils--types)
3. [Configuration Files](#3-configuration-files)
4. [Database Schema](#4-database-schema)
5. [Backend — Server Directory](#5-backend--server-directory)
6. [Frontend — App Directory](#6-frontend--app-directory) *(BELUM SELESAI)*
7. [Auth Flow](#7-auth-flow) *(BELUM SELESAI)*
8. [Temuan Prioritas & Rekomendasi](#8-temuan-prioritas--rekomendasi)

---

## 1. Ringkasan Eksekutif

Project ini adalah UI prototype Nuxt 4 untuk RMA claim management. Backend (Nitro + Drizzle + Better-Auth) sudah cukup lengkap (~70 API routes, 13 schemas, 11 services, 13 repos). Frontend masih menggunakan **mock data** di hampir semua halaman. Review ini mengidentifikasi inkonsistensi arsitektur yang harus diperbaiki **sebelum** task cards didelegasikan ke model murah.

### Status Keseluruhan

| Area | Status | Catatan |
|---|---|---|
| Shared types & utils | Partial gaps | Core transaction types belum di-infer |
| Config files | Mostly OK | Zod v4 perlu perhatian |
| Database schema | Belum di-review detail | — |
| Backend patterns | Belum di-review detail | Task agent aborted, perlu dilanjutkan |
| Frontend patterns | Belum di-review | — |
| Auth flow | Belum di-review | — |

---

## 2. Shared Utils & Types

### 2.1 `shared/types/database.ts` (253 baris)

**Yang sudah baik:**
- Infer types dari Drizzle schema untuk master tables (`Vendor`, `ProductModel`, `NotificationMaster`, `DefectMaster`)
- Infer types untuk auth tables (`User`, `Session`, `Account`, `Verification`)
- Type guards: `isTimestampedTable()`, `isStatusTable()`, `isSoftDeleteTable()`
- Filter types: `DateRangeFilter`, `StatusFilter`, `PaginationFilter`, `ReportPeriodFilter`
- API response types: `ApiResponse<T>`, `PaginatedResponse<T>`

**ISSUE — CRITICAL: Transaction table types TIDAK ADA**
- `Claim`, `ClaimPhoto`, `ClaimHistory`, `VendorClaim`, `VendorClaimItem`, `PhotoReview`, `SequenceGenerator` — **tidak ada inferred types** meskipun ini adalah core entities.
- Ini berarti service/repository layer untuk claim dan vendor-claim kemungkinan menggunakan `any` atau inline types.

**ISSUE — MEDIUM: Union types terlalu sempit**
- `StatusTable` hanya mencakup `NotificationMaster`, padahal `Claim` dan `VendorClaim` juga punya status fields.
- `SoftDeleteTable` union tidak mencakup transaction tables.

**ISSUE — LOW: Leaky abstraction**
- `export * from '../utils/constants'` di akhir file — artinya `import { ... } from 'shared/types/database'` juga membawa semua constants. Sebaiknya dipisah.

### 2.2 `shared/utils/constants.ts` (187 baris)

**Yang sudah baik:**
- 11 `as const` enum arrays dengan derived union types
- Type guard validators untuk setiap enum (e.g., `isUserRole()`, `isClaimStatus()`)
- Pattern konsisten

**ISSUE — MEDIUM: Hardcoded password di source code**
- `DEFAULT_INITIAL_PASSWORD = 'sharp1234'` — sebaiknya di-drive via environment variable untuk seed scripts.

### 2.3 `shared/utils/fiscal.ts` (449 baris)

**Yang sudah baik:**
- Implementasi fiscal calendar Jepang lengkap
- Core function `getFiscalPeriodInfo(date)` dengan semua dimensi period
- Range functions, period filter resolution, display helpers
- Semua types exported dengan benar

**Tidak ada issue ditemukan.** File ini well-structured.

---

## 3. Configuration Files

### 3.1 `nuxt.config.ts`

**Yang sudah baik:**
- Modules lengkap: `@nuxt/eslint`, `@nuxt/ui`, `@nuxt/fonts`, `nuxt-charts`
- Dark mode forced correctly
- TypeScript strict mode enabled
- Vite optimizeDeps pre-bundles library berat

**ISSUE — MEDIUM: Tidak ada `runtimeConfig`**
- Environment variables (`BETTER_AUTH_SECRET`, `DB_FILE_NAME`) dikonsumsi langsung oleh library tanpa melalui `runtimeConfig`.
- Artinya tidak type-safe dan tidak tervalidasi saat SSR startup.

### 3.2 `package.json`

**ISSUE — HIGH: Zod v4 (`^4.3.6`) terinstall**
- Zod v4 adalah breaking change major dari v3. Jika ada kode yang masih pakai Zod v3 API, akan break.
- Perlu verifikasi bahwa semua import dan usage sudah kompatibel v4.

**ISSUE — MEDIUM: `drizzle-zod` deprecated**
- `drizzle-zod: ^0.8.3` — menurut `finalisasi-be.md`, harus migrasi ke `drizzle-orm/zod`.

**ISSUE — LOW: Self-referencing dependency**
- `"uirmaportal": "link:"` — unusual, bisa menyebabkan masalah dengan beberapa tooling.

**Catatan:** Tidak ada test framework terinstall (no vitest, no playwright).

### 3.3 `drizzle.config.ts`

- SQLite dialect, migrations ke `./server/database/migrations`
- Schema dari `./server/database/schema/index.ts`
- Minor: `process.env.DB_FILE_NAME! || 'file:local.db'` — `!` non-null assertion redundan karena `||` sudah handle undefined.

### 3.4 `.editorconfig`

Correct: 2-space indent, LF, UTF-8, trim trailing whitespace.

### 3.5 `eslint.config.mjs`

Minimal — wraps Nuxt generated config. Custom rules di `nuxt.config.ts` (`commaDangle: 'never'`, `braceStyle: '1tbs'`).

---

## 4. Database Schema

> **STATUS: BELUM DI-REVIEW DETAIL** — perlu baca semua file di `server/database/schema/`

---

## 5. Backend — Server Directory

> **STATUS: BELUM DI-REVIEW DETAIL** — task agent aborted sebelum selesai. Perlu review:
> - Repository pattern consistency
> - Service layer patterns
> - API route handler patterns
> - Middleware dan utils
> - Error handling consistency
> - Auth check coverage

---

## 6. Frontend — App Directory

> **STATUS: BELUM DI-REVIEW**

### 6.1 Temuan Awal dari Test Fixtures

**`app/test-fixtures/cs/`** (9 files) — mock data untuk CS area:
- `types.ts`: 12 interfaces (`CsClaimListItem`, `CsClaimDetail`, dll.)
- `claims.ts`: 10 mock claims
- `reference-data.ts`: 3 vendors, 5 product models, 7 defects, 5 branches
- `user.ts`: Mock CS user profile

**Tidak ada dashboard test fixtures** — dashboard pages menggunakan inline mock data langsung di file page.

### 6.2 Type Definitions — Duplikasi Ditemukan

**ISSUE — HIGH: Duplikasi type definitions**

| Type | `app/utils/types.ts` | `app/test-fixtures/cs/types.ts` |
|---|---|---|
| `ClaimPhoto` vs `CsClaimPhoto` | `id: number` | `id: number` tapi shape berbeda |
| `ClaimHistoryItem` vs `CsClaimHistoryItem` | `action: string` (LOOSE) | `action: ClaimHistoryAction` (STRICT) |
| `ClaimListItem` vs `CsClaimListItem` | `status: string` | `status: ClaimStatus` |

**Masalah:** Types di `app/utils/types.ts` lebih **loose** (menggunakan `string`) dibandingkan fixture types yang menggunakan union types dari constants. Ini terbalik — production types seharusnya lebih strict.

**ISSUE — MEDIUM: `VendorClaimBatch.vendorDecision`**
- Menggunakan inline union `'PENDING' | 'ACCEPTED' | 'REJECTED'` alih-alih mengimport `VendorDecision` dari constants.

---

## 7. Auth Flow

> **STATUS: BELUM DI-REVIEW**
> Perlu review: `server/middleware/auth.ts`, `server/utils/auth.ts`, `app/composables/useAuthSession.ts`, `server/types/h3.d.ts`

---

## 8. Temuan Prioritas & Rekomendasi

### CRITICAL (Harus fix sebelum wiring ke real API)

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| C1 | `.env` dengan `BETTER_AUTH_SECRET` pernah ter-commit | `.env` | Rotate secret, bersihkan git history, buat `.env.example` |
| C2 | Transaction table types tidak ada di shared types | `shared/types/database.ts` | Tambah inferred types untuk `Claim`, `ClaimPhoto`, `ClaimHistory`, `VendorClaim`, `VendorClaimItem`, `PhotoReview`, `SequenceGenerator` |
| C3 | `.env.example` belum dibuat | root | Buat sesuai Fase 1.4 di `cara-prompt.md` |

### HIGH (Harus fix saat wiring)

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| H1 | Zod v4 breaking change | `package.json` | Audit semua Zod usage, pastikan kompatibel v4 |
| H2 | `drizzle-zod` deprecated | `package.json` | Migrasi ke `drizzle-orm/zod` |
| H3 | Type definitions terlalu loose di `app/utils/types.ts` | `app/utils/types.ts` | Ganti `string` dengan proper union types dari `shared/utils/constants.ts` |
| H4 | Duplikasi types antara `app/utils/types.ts` dan `app/test-fixtures/cs/types.ts` | Kedua file | Setelah mock dihapus, pastikan hanya satu source of truth untuk types |

### MEDIUM

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| M1 | Tidak ada `runtimeConfig` untuk env vars | `nuxt.config.ts` | Tambahkan `runtimeConfig` block |
| M2 | Hardcoded `DEFAULT_INITIAL_PASSWORD` | `shared/utils/constants.ts` | Pindahkan ke env variable |
| M3 | Leaky re-export di `database.ts` | `shared/types/database.ts` | Pisahkan import constants dari types |
| M4 | Branch casing inkonsisten | Test fixtures | `'JAKARTA'` vs `'Jakarta'` — standardisasi |

### LOW

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| L1 | `StatusTable` / `SoftDeleteTable` union terlalu sempit | `shared/types/database.ts` | Extend untuk mencakup transaction tables |
| L2 | Self-referencing `"uirmaportal": "link:"` | `package.json` | Evaluasi apakah diperlukan |
| L3 | Redundant `!` assertion di `drizzle.config.ts` | `drizzle.config.ts` | Hapus `!` karena `||` sudah handle |

---

## TODO — Lanjutan Review

Review berikut **belum dilakukan** dan harus dilanjutkan:

- [ ] **Backend full review**: Baca semua files di `server/repositories/`, `server/services/`, `server/api/`, `server/utils/`, `server/middleware/`, `server/plugins/`
  - Cek pattern consistency repo → service → handler
  - Cek error handling di setiap layer
  - Cek auth check coverage di setiap endpoint
  - Cek Zod validation di setiap handler
  - Cek response format consistency (`{ success: true, data, pagination? }`)
- [ ] **Database schema review**: Baca semua files di `server/database/schema/`, `server/database/migrations/`, `server/database/seed.ts`
  - Cek index definitions
  - Cek foreign key constraints
  - Cek seed data completeness
- [ ] **Frontend full review**: Baca semua pages, composables, components, layouts
  - Identify semua pages yang masih pakai mock data
  - Cek pattern consistency di pages yang sudah wire ke API
  - Cek layout assignment consistency
  - Cek component reuse patterns
- [ ] **Auth flow review**: End-to-end auth dari login → session → middleware → protected routes
- [ ] **Cross-cutting concerns**: Error handling consistency, loading states, type safety across layers
