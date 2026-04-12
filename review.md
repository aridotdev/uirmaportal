# Architecture & Patterns Review

> **Status**: COMPLETE — Semua section (2-7) sudah di-review.
> **Reviewer**: Opus (model mahal) sesuai poin 5 Workflow Optimal di `cara-prompt.md`
> **Tanggal**: 10–11 April 2026

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Shared Utils & Types](#2-shared-utils--types)
3. [Configuration Files](#3-configuration-files)
4. [Database Schema](#4-database-schema)
5. [Backend — Server Directory](#5-backend--server-directory)
6. [Frontend — App Directory](#6-frontend--app-directory)
7. [Auth Flow](#7-auth-flow)
8. [Temuan Prioritas & Rekomendasi](#8-temuan-prioritas--rekomendasi)

---

## 1. Ringkasan Eksekutif

Project ini adalah UI prototype Nuxt 4 untuk RMA claim management. Backend (Nitro + Drizzle + Better-Auth) sudah cukup lengkap (~70 API routes, 13 schemas, 11 services, 13 repos). Frontend masih menggunakan **mock data** di hampir semua halaman. Review ini mengidentifikasi inkonsistensi arsitektur yang harus diperbaiki **sebelum** task cards didelegasikan ke model murah.

### Status Keseluruhan

| Area | Status | Catatan |
|---|---|---|
| Shared types & utils | Partial gaps | Core transaction types belum di-infer |
| Config files | Mostly OK | Zod v4 perlu perhatian |
| Database schema | **REVIEWED** | 18 issues (0 critical, 4 high, 7 medium, 7 low) |
| Backend patterns | **REVIEWED** | 0 critical, 7 high, 13 medium, 10 low (30 total) |
| Frontend patterns | **REVIEWED** | 15 CRITICAL, 31 HIGH, 46 MEDIUM, 33 LOW |
| Auth flow | **REVIEWED** | **0 CRITICAL open** — C-AUTH1/C-AUTH2/C-AUTH3 sudah fixed |

---

## 2. Shared Utils & Types (DONE)

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

## 3. Configuration Files (DONE)

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

**ISSUE — LOW: Self-referencing dependency** (DONE)
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

## 4. Database Schema (DONE)

> **STATUS: SELESAI** — 15 tables, 1 migration, 1 seed file di-review.

### 4.1 Overview

- **ORM**: Drizzle ORM dengan SQLite (libsql)
- **Schema files**: 13 files di `server/database/schema/`
- **Tables**: 15 tables (user, session, account, verification, vendor, product_model, defect_master, notification_master, claim, claim_photo, claim_history, photo_review, vendor_claim, vendor_claim_item, sequence_generator)
- **Migrations**: 1 migration (initial schema `0000_melodic_hex.sql`)

### 4.2 Yang Sudah Baik

- Table structure well-designed, good domain modeling
- Primary keys correct dan konsisten (text untuk auth, integer autoIncrement untuk business)
- Fiscal columns (fiscalYear, fiscalHalf, fiscalLabel, calendarYear, calendarMonth) lengkap di semua 3 transaction tables (claim, notification_master, vendor_claim)
- Index coverage sangat thorough — 10+ indexes per transaction table
- Zod validation schemas comprehensive dan well-typed per schema file
- `claim_history` dan `photo_review` benar sebagai immutable audit records (no updatedAt)
- Seed file idempotent via `.onConflictDoNothing()`, tidak ada secrets

### 4.3 Issues (DONE) 
#### HIGH

**H-DB1. Missing `updatedAt` default pada `session` dan `account` tables** (DONE)
- **File**: `server/database/schema/auth.ts` (session ~line 43, account ~line 78)
- `updatedAt` punya `.$onUpdate()` tapi **tidak ada `.default()`**. Column `.notNull()` artinya INSERT tanpa explicit value akan gagal constraint violation.
- `user` dan `verification` tables sudah benar (ada `.default(sql\`...\`)`).
- **Fix**: Tambah `.default(sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`)` pada `updatedAt` di kedua table.

**H-DB2. Missing FK constraints pada semua user reference columns** (DONE)
- **Files**: `claim.ts` (submittedBy, updatedBy), `claim-history.ts` (userId), `vendor.ts` (createdBy, updatedBy), `vendor-claim.ts` (createdBy, updatedBy), `vendor-claim-item.ts` (vendorDecisionBy), `product-model.ts` (createdBy, updatedBy), `defect-master.ts` (createdBy, updatedBy), `notification-master.ts` (createdBy, updatedBy), `photo-review.ts` (reviewedBy)
- Semua column ini menyimpan `user.id` tapi **tidak ada FK constraint**. Referential integrity tidak enforced di DB level.
- **Fix**: Tambah `.references(() => user.id, { onDelete: 'restrict' })` atau dokumentasikan sebagai keputusan arsitektur.

**H-DB3. Duplicate unique indexes pada columns yang sudah `.unique()`** (DONE)
- **Files**: `vendor.ts` (code), `defect-master.ts` (name, code), `claim.ts` (claimNumber), `vendor-claim.ts` (vendorClaimNo), `notification-master.ts` (notificationCode)
- Setiap column ini punya `.unique()` (generate auto index) DAN explicit `uniqueIndex()` — menghasilkan **2 index identik** per column.
- Terlihat jelas di migration `0000_melodic_hex.sql` (e.g., `vendor_code_unique` DAN `vendor_code_idx`).
- **Fix**: Hapus salah satu — preferably hapus `.unique()` dari column def dan pertahankan explicit `uniqueIndex()` untuk naming consistency.

**H-DB4. Redundant index pada `vendor_claim_item.claimId`** (DONE)
- **File**: `server/database/schema/vendor-claim-item.ts` (~line 33-34)
- Ada regular `index()` DAN `uniqueIndex()` pada column `claimId` yang sama. Unique index sudah cukup.
- **Fix**: Hapus non-unique `vendor_claim_item_claim_idx`.

#### MEDIUM

**M-DB1. Inkonsistensi timestamp default expression** (DONE)
- Auth tables pakai `sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`` (sub-second precision)
- Business tables pakai `sql\`(unixepoch() * 1000)\`` (second precision saja, selalu `xxx000`)
- **Fix**: Standardisasi ke satu approach. `(unixepoch() * 1000)` lebih simple dan cukup.

**M-DB2. `notification_master` tidak punya `isActive` soft-delete column** (DONE)
- Semua master table lain (`vendor`, `product_model`, `defect_master`) punya `isActive`.
- `notification_master` hanya punya `status` (NEW/USED/EXPIRED) — tidak bisa soft-delete.
- **Fix**: Tambah `isActive` atau dokumentasikan bahwa status lifecycle cukup.

**M-DB3. Tidak ada Drizzle `relations()` untuk business tables** (DONE)
- Hanya auth tables (user, session, account) yang punya `relations()` definitions.
- Business tables tidak bisa pakai Drizzle relational query API (`db.query.claim.findMany({ with: { vendor: true } })`).
- **Fix**: Tambah `relations()` exports untuk semua business tables.

**M-DB4. `claim.defectCode` FK references `defect_master.code` (natural key) bukan `defect_master.id`** (DONE)
- **File**: `server/database/schema/claim.ts` (~line 30)
- Jika defect code diubah, semua claims yang reference akan inkonsisten (tidak ada ON UPDATE CASCADE).
- **Fix**: Consider reference ke `defect_master.id` atau tambah ON UPDATE CASCADE.

**M-DB5. `user.role` nullable tanpa default** (DONE)
- **File**: `server/database/schema/auth.ts` (~line 24)
- User tanpa role (e.g., OAuth signup) akan punya `role = NULL`, menyebabkan masalah role-based access.
- **Fix**: Set default role (e.g., `'CS'`) atau pastikan app layer selalu assign role.

**M-DB6. Inkonsistensi Zod validation untuk date fields** (DONE)
- `vendor_claim.submittedAt` expect raw number (`z.number().int().positive()`)
- `notification_master.notificationDate` pakai `z.coerce.date().transform(...)` pattern
- **Fix**: Standardisasi date/timestamp Zod validation pattern.

**M-DB7. Missing composite index `(vendorId, status)` pada `vendor_claim`** (DONE)
- `claim` dan `notification_master` punya composite vendor+status index, tapi `vendor_claim` tidak.
- **Fix**: Tambah `index('vendor_claim_vendor_status_idx').on(table.vendorId, table.status)`.

#### LOW

**L-DB1.** `user.banned` nullable (three-state boolean) — tambah `.notNull()`. (DONE)
**L-DB2.** `claim_photo.status` default pakai hardcoded string `'PENDING'` bukan constant. (DONE)
**L-DB3.** `sequence_generator` tidak punya timestamps sama sekali — tambah minimal `updatedAt`. (DONE)
**L-DB4.** `notification_master` missing `calendar_ym` composite index (claim & vendor_claim punya). (DONE)
**L-DB5.** `notification_master` missing `fiscalYear + fiscalHalf` composite index (claim punya). (DONE)
**L-DB6.** Column naming inkonsisten: auth tables pakai explicit snake_case (`'user_id'`), business tables pakai camelCase default — mixed naming di DB. (DONE)
**L-DB7.** `server/database/index.ts`: redundant `!` assertion pada `process.env.DB_FILE_NAME!` (sudah ada `||` fallback). (DONE)

### 4.4 Seed File (`server/database/seed.ts`) (DONE)

- Seeds: 4 users (1 per role), 3 vendors, 5 product models, 7 defect masters, 25 notification masters
- Idempotent via `.onConflictDoNothing()`
- Tidak ada secrets/passwords di seed data
- **ISSUE M**: Hardcoded vendor IDs (`vendorId: 1, 2, 3`) dalam product models — fragile jika autoincrement IDs berbeda
- **ISSUE L**: Tidak ada seed untuk claims, vendor_claims — hanya master data (ABAIKAN)

### 4.5 Migration Notes (DONE)

- 1 migration (`0000_melodic_hex.sql`, 281 lines) — initial schema creation
- Properly structured dengan `-->statement-breakpoint` markers
- **PENTING**: Migration tidak include `PRAGMA foreign_keys = ON;` — SQLite default foreign keys **disabled**. Enforcement harus di connection level.

---

## 5. Backend — Server Directory

> **STATUS: SELESAI** — Full review terhadap database, repositories, services, API route handlers, middleware, utils, types, plugins.

### 5.1 Architecture Overview

| Layer | Files | Lines (approx) | Pattern |
|---|---|---|---|
| Database (`database/`) | 14 (1 index, 12 schema, 1 seed) | ~1,100 | Drizzle ORM + Zod schemas per table |
| Repositories (`repositories/`) | 13 | ~1,670 | Object literal with async methods, raw Drizzle queries |
| Services (`services/`) | 11 | ~1,660 | Object literal with async methods, orchestrates repos + business logic |
| API Routes (`api/`) | 66 | ~2,200 | Nitro event handlers, Zod-validated input, service delegation |
| Middleware (`middleware/`) | 1 | 41 | Better-Auth session extraction, opt-in auth model |
| Utils (`utils/`) | 6 | 179 | Auth helpers, error codes, pagination, status transitions |
| Types (`types/`) | 1 | 12 | H3 context augmentation for `event.context.auth` |
| Plugins (`plugins/`) | 0 (`.gitkeep` only) | 0 | Empty — no server plugins |

**Layered architecture**: `API Handler → Service → Repository → Database`. This is well-structured. Each layer has a clear responsibility.

### 5.2 Yang Sudah Baik

**Database Layer:**
- Schema files well-organized — 1 file per table, consistent structure (table → Zod schemas → relations → type exports)
- `drizzle-zod` integration: `createInsertSchema`/`createSelectSchema` used consistently for input validation
- Index coverage thorough — composite indexes for common query patterns (vendor+status, fiscal filters)
- Fiscal period columns denormalized correctly on all 3 transaction tables (`claim`, `notification_master`, `vendor_claim`)
- Foreign key constraints present on all business relationships
- `PRAGMA foreign_keys = ON` enforced at connection level in `database/index.ts`

**Repository Layer:**
- Consistent naming: `{entity}.repo.ts` with exported `{entity}Repo` object literal
- `buildWhereClause()` helper pattern reused across all list repos — clean, composable filtering
- Transaction support via optional `tx?: DbTransaction` parameter — well-designed
- `DbExecutor` type alias (`DbTransaction | typeof db`) used consistently
- `findById` returns `row[0] ?? null` consistently (never throws)
- `countByFilter` co-located with `findAll` in every repo
- Pagination via shared `calcOffset()` utility
- Explicit `select()` projections in join queries (not `select(*)`)

**Service Layer:**
- Clear business logic encapsulation — repos handle data access, services handle rules
- `buildHistory()` helper for audit trail entries — reused across claim/review/vendor-claim services
- `mapXxxErrorToHttp()` co-exported from services — clean error translation pattern
- Fiscal period computation delegated to `getFiscalPeriodInfo()` from shared utils
- `db.transaction()` used correctly for multi-table operations
- `ensureClaimFound()` / `ensureVendorClaimFound()` guard helpers in review/vendor-claim services

**API Route Handlers:**
- Consistent file naming: `[resource].get.ts`, `[resource].post.ts`, `[resource].put.ts`, `[id]/status.patch.ts`
- Zod validation on ALL inputs using H3 helpers: `getValidatedRouterParams`, `getValidatedQuery`, `readValidatedBody`
- Auth checks present on 66/66 routes (3 intentionally public auth endpoints excluded)
- Response format generally consistent: `{ success: true, data, pagination? }`

**Utils:**
- `ErrorCode` constants well-organized by domain (Generic, Claim, Notification, Vendor, Photo, VendorClaim, MasterData)
- `paginationQuerySchema` reusable Zod schema — avoids duplication in every GET handler
- `canTransitionClaimStatus()` / `canTransitionVendorClaimStatus()` — clean state machine validation
- `requireAuth()` / `requireRole()` — minimal, effective auth guard functions

### 5.3 Issues

#### CRITICAL (DONE)

*Tidak ada issue CRITICAL ditemukan di backend server layer.*

Backend layer secara keseluruhan well-structured. Issue auth critical yang sempat ada di Section 7 sudah ditutup.

#### HIGH (DONE)

✅ **H-BE1. Tiga pola error handling yang berbeda di API handlers — tidak konsisten**
- **Lokasi**: Semua 66 files di `server/api/`
- **Detail**: Ada 3 pola yang dipakai:
  1. **`mapXxxErrorToHttp(error)`** — Claims, CS claims, vendor-claims, audit-trail (~20 files). Service-level error mapper yang translate `ErrorCode` ke HTTP status. Paling clean.
  2. **Manual `ErrorCode` matching** — Master data, users, profile, notifications (~25 files). Setiap handler punya `catch` block sendiri dengan `if (error.message === ErrorCode.XXX)` chains. Duplikasi tinggi.
  3. **Tanpa try/catch sama sekali** — Report endpoints, beberapa GET-list endpoints (~15 files). Error propagate sebagai uncaught 500 tanpa structured error response.
- **Impact**: Inconsistent error responses untuk client. Unhandled errors di report endpoints bisa expose stack traces di non-production.
- **Fix**: Standarisasi ke pola #1 — buat `mapXxxErrorToHttp()` untuk setiap service domain, atau buat satu generic `mapServiceErrorToHttp()`. Untuk GET-list yang sekarang tanpa try/catch, minimal wrap dengan generic error handler.

✅ **H-BE2. Beberapa API handlers bypass service layer — langsung call repository** (DONE)
- **File**: `server/api/claims/[id]/photos.get.ts`, `server/api/claims/[id]/history.get.ts`, beberapa CS route handlers (`cs/claims/[id].get.ts` calls `claimRepo.findById()` langsung untuk ID resolution)
- **Detail**: `photos.get.ts` langsung panggil `claimPhotoRepo.findByClaimId()`, `history.get.ts` langsung panggil `claimHistoryRepo.findByClaimId()`. CS routes call `claimRepo.findById()` / `findByClaimNumber()` untuk resolve ID sebelum call service.
- **Impact**: Bypass business rules, authorization checks, dan audit logging yang ada di service layer. Jika nanti ada access control per-claim (e.g., QRCC hanya bisa lihat claims di branch-nya), harus update di 2 tempat.
- **Status implementasi**:
  - `server/api/claims/[id]/photos.get.ts` sekarang pakai `claimReviewService.getPhotos()`
  - `server/api/claims/[id]/history.get.ts` sekarang pakai `claimReviewService.getHistory()`
  - CS handlers (`[id].get.ts`, `[id].put.ts`, `[id]/submit.post.ts`, `[id]/revision.post.ts`) sekarang pakai `claimService.resolveClaimId()`
  - Import repository langsung dari handler API terkait sudah dihapus

✅ **H-BE3. `report.repo.ts` terlalu besar (492 lines) dan berisi business logic** (DONE)
- **File**: `server/repositories/report.repo.ts`
- **Detail**: Report repo melakukan business logic computations (approval rate calculation, lead time aggregation, aging bucket classification, acceptance rate) yang seharusnya di service layer. `reportService.ts` sebelumnya hanya proxy call ke repo tanpa value-add.
- **Impact**: Melanggar layered architecture — repo seharusnya hanya data access. Testing repo berarti testing business logic + SQL sekaligus.
- **Fix**: Pindahkan computations (approval rate, lead time, aging buckets) ke `reportService.ts`. Repo hanya return raw data.
- **Status implementasi**:
  - `server/repositories/report.repo.ts` direfaktor menjadi pure data access untuk `getDashboardKpi`, `getClaimsByBranch`, `getBranchPerformance`, `getVendorPerformance`, dan `getAgingAnalysis`
  - Business computation dipindahkan ke `server/services/report.service.ts` (approval/acceptance rate, lead time rounding, aging bucket fill)
  - Interface business object (`ExecutiveKpi`, `ClaimsByBranchRow`, `BranchPerformanceRow`, `VendorPerformanceRow`, `AgingBucket`) dipindahkan ke service layer

✅ **H-BE4. `buildHistory()` helper function duplikat di 3 service files** (DONE)
- **Files**: `claim.service.ts` (line ~80), `claim-review.service.ts` (line ~33), `vendor-claim.service.ts` (line ~47)
- **Detail**: Ketiga file mendefinisikan `buildHistory()` function yang identik — hanya default `userRole` berbeda (`'CS'` vs `'QRCC'`).
- **Impact**: Jika schema `InsertClaimHistory` berubah, harus update di 3 tempat. Sudah terjadi divergensi kecil (default role).
- **Fix**: Extract ke shared util `server/utils/claim-history.ts` dengan configurable default role, atau buat di service base.
- **Status implementasi**:
  - Dibuat shared util `server/utils/claim-history.ts` dengan `buildHistory(input, defaultRole)`
  - Local helper `buildHistory()` di `claim.service.ts`, `claim-review.service.ts`, dan `vendor-claim.service.ts` sudah dihapus
  - Seluruh caller sudah pakai `buildHistory({...}, 'CS')` untuk claim service dan `buildHistory({...}, 'QRCC')` untuk review + vendor claim service

✅ **H-BE5. `AuthUser` type redefinisi lokal di 3 service files** (DONE)
- **Files**: `claim.service.ts` (line ~25), `claim-review.service.ts` (line ~17), `vendor-claim.service.ts` (line ~22)
- **Detail**: Setiap file mendefinisikan `type AuthUser = { id: string, role?: UserRole, branch?: string | null }` secara lokal. Ini terpisah dari `AuthUser` di `server/utils/auth.ts` (yang juga berbeda — punya `name` dan `email`).
- **Impact**: Type drift — service-level `AuthUser` tidak punya `name`/`email` tapi `server/utils/auth.ts` punya. Jika property ditambahkan, harus update di 4 tempat.
- **Fix**: Import canonical `AuthUser` dari `server/utils/auth.ts` di semua services. Tambah `branch` property ke canonical type jika belum ada.
- **Status implementasi**:
  - Local `type AuthUser` di `claim.service.ts`, `claim-review.service.ts`, dan `vendor-claim.service.ts` sudah dihapus
  - Ketiga service sekarang import canonical `AuthUser` dari `#server/utils/auth`
  - Tidak ada perubahan logic bisnis; hanya konsolidasi source of truth type

✅ **H-BE6. `settingsService` pakai `useStorage('data')` — Nitro unstorage tanpa persistence guarantee** (DONE)
- **File**: `server/services/settings.service.ts`
- **Detail**: Settings disimpan di Nitro's `useStorage('data')` yang default ke memory storage. Artinya settings hilang setiap kali server restart.
- **Impact**: Admin mengubah settings → server restart (deploy, crash) → settings kembali ke default.
- **Fix**: Migrate ke database table `app_settings` atau configure persistent storage driver (filesystem/Redis).

✅ **H-BE7. `claimService.createClaim()` hardcodes IDs ketika notification belum ada** (DONE)
- **File**: `server/services/claim.service.ts` (line ~135-140)
- **Detail**: Saat notification belum ada, `modelId: 1`, `vendorId: 1` di-hardcode. Ini berarti claim baru tanpa existing notification akan selalu terkait ke vendor ID 1 dan model ID 1.
- **Impact**: Data integrity issue — claims bisa terkait ke vendor/model yang salah.
- **Fix**: Require notification lookup terlebih dahulu, atau derive `modelId`/`vendorId` dari `CreateClaimPayload` data (yang sudah punya `vendorName` dan `modelName`).
- **Status implementasi**:
  - Ditambahkan `ErrorCode.MODEL_NOT_FOUND` di `server/utils/error-codes.ts`
  - Ditambahkan `productModelRepo.findByName(name)` di `server/repositories/product-model.repo.ts`
  - `claimService.createClaim()` sekarang resolve `modelId` + `vendorId` dari model saat notification belum ada; tidak ada lagi fallback hardcoded `1`
  - Auto-created notification dan claim payload sekarang memakai ID hasil resolve (`resolvedModelId`, `resolvedVendorId`)
  - Mapping error HTTP ditambah: `MODEL_NOT_FOUND` -> 400 dengan pesan validasi yang jelas

#### MEDIUM

**M-BE1. `sequence.service.ts` pakai `getUTCFullYear()` tapi database timestamps pakai local time**
- **File**: `server/services/sequence.service.ts` (line ~8-12)
- **Detail**: `getDateStamp()` pakai `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` untuk generate claim number. Tapi `createdAt` di database pakai `(unixepoch() * 1000)` yang selalu UTC. Jika server timezone bukan UTC, claim number date stamp bisa beda hari dari `createdAt`.
- **Fix**: Konsisten pakai UTC di semua tempat (sudah benar), tapi dokumentasikan bahwa claim number selalu UTC-based. Atau gunakan local time jika business requirement menginginkan Japan timezone.

**M-BE2. `claimService.createClaim()` uses inline `CreateClaimPayload` type — not Zod-validated**
- **File**: `server/services/claim.service.ts` (line ~30-48)
- **Detail**: `CreateClaimPayload` adalah manual TypeScript type, bukan Zod schema. API handler `cs/claims/index.post.ts` melakukan Zod validation sendiri, tapi service layer tidak re-validate. Jika service dipanggil dari tempat lain (e.g., background job, import), input tidak tervalidasi.
- **Fix**: Buat Zod schema `createClaimPayloadSchema` dan validate di service layer juga. Atau pastikan service selalu dipanggil melalui handler yang validate.

**M-BE3. Tidak ada logging di service layer — error observability terbatas**
- **Lokasi**: Semua files di `server/services/`
- **Detail**: Service methods throw errors tapi tidak log ke console/external system sebelumnya. Jika error terjadi di production, tidak ada trace selain HTTP 500 response.
- **Fix**: Tambah `console.error()` atau structured logger (e.g., Pino via `useLogger()`) minimal di catch blocks.

**M-BE4. `notification.service.ts` `importFromExcel` — sequential DB lookups tanpa batching**
- **File**: `server/services/notification.service.ts` (line ~162-175)
- **Detail**: `for (const row of validRows) { await notificationRepo.findByCode(row.notificationCode) }` — setiap row melakukan 1 DB query. Dengan 100 rows = 100 sequential queries.
- **Fix**: Batch check: query semua existing codes dalam satu `WHERE code IN (...)`, lalu check in-memory.

**M-BE5. `defect.repo.ts`, `product-model.repo.ts`, `vendor.repo.ts` tidak support transaction**
- **Files**: 3 repository files
- **Detail**: `insert()`, `update()`, `updateStatus()` methods tidak accept `tx?: DbTransaction` parameter, berbeda dari `claim.repo.ts`, `claimHistory.repo.ts`, dll yang konsisten support transactions.
- **Impact**: Jika master data operations perlu dilakukan dalam transaction (e.g., batch import), tidak bisa.
- **Fix**: Tambah optional `tx?: DbTransaction` parameter ke semua mutation methods untuk konsistensi. Ini breaking change-free karena parameter optional.

**M-BE6. `productModelService.updateProductModel()` — partial uniqueness check**
- **File**: `server/services/product-model.service.ts` (line ~51-56)
- **Detail**: Uniqueness check `findByNameAndVendor(data.name, data.vendorId)` hanya jalan jika **kedua** `data.name` AND `data.vendorId` present. Jika hanya salah satu yang diupdate, uniqueness check di-skip.
- **Fix**: Merge existing values: `const checkName = data.name ?? existing.name; const checkVendorId = data.vendorId ?? existing.vendorId;` lalu `findByNameAndVendor(checkName, checkVendorId)`.

**M-BE7. Beberapa repo `findAll` query results tidak strongly typed**
- **Files**: `claim.repo.ts`, `vendor-claim.repo.ts`
- **Detail**: `findAll` returns join results with inferred types tapi tidak ada explicit return type annotation. Consumers (service/handler) mengandalkan inference. Jika query berubah, type changes propagate silently.
- **Fix**: Tambah explicit return type (e.g., `Promise<ClaimListRow[]>`) atau extract result type.

**M-BE8. `vendorClaimRepo.findByIdWithItems()` — N+1 risk pada join result parsing**
- **File**: `server/repositories/vendor-claim.repo.ts` (line ~108-134)
- **Detail**: Query joins `vendorClaim` + `vendorClaimItem` + `claim`, returning multiple rows per vendor claim. Parsing logic `rows.filter(row => row.item !== null)` correctly handles this, tapi jika items banyak (e.g., 100 claims per batch), join duplicates vendor claim data per row.
- **Fix**: Consider 2-query approach: fetch header first, then items separately. Cleaner and more efficient for large batches.

**M-BE9. `claim.repo.ts` `findByIdWithRelations()` joins `user` table on `submittedBy` tapi `user` column bisa berbeda**
- **File**: `server/repositories/claim.repo.ts` (line ~127-145)
- **Detail**: `leftJoin(user, eq(claim.submittedBy, user.id))` — joins ke submittedBy. Tapi claim juga punya `updatedBy` yang bisa user berbeda. History query di bawahnya also joins user. Tidak ada way untuk get `updatedBy` user info dari query ini.
- **Fix**: Tambah alias join untuk `updatedBy` user, atau return `updatedBy` as raw ID (cukup untuk audit purposes).

**M-BE10. `server/database/index.ts` — `client.execute('PRAGMA...')` tidak awaited**
- **File**: `server/database/index.ts` (line 11)
- **Detail**: `client.execute('PRAGMA foreign_keys = ON;')` returns a Promise tapi tidak di-`await`. PRAGMA mungkin belum aktif saat query pertama dijalankan.
- **Fix**: Await the execute call. Karena ini top-level module code, bisa wrap dalam async IIFE atau move ke server plugin.

**M-BE11. `server/plugins/` empty — no server lifecycle hooks**
- **Detail**: Plugins directory hanya berisi `.gitkeep`. Tidak ada server startup hook untuk:
  - Validate required environment variables
  - Run database health check
  - Log startup configuration
- **Fix**: Buat `server/plugins/startup.ts` untuk env validation dan DB ping.

**M-BE12. Response format tidak 100% konsisten antar handlers**
- **Lokasi**: Semua API handlers
- **Detail**: Mayoritas return `{ success: true, data, pagination? }` tapi beberapa variasi:
  - Report endpoints return raw data tanpa `success` wrapper
  - Auth endpoints return Better-Auth native format
  - Some handlers return `{ success: true, data: record }` vs `{ success: true, data: { items, pagination } }`
  - Settings endpoint returns `{ success: true, settings }` (bukan `data`)
- **Fix**: Standardisasi response envelope. Auth endpoints boleh berbeda (Better-Auth controls format). Sisanya konsisten `{ success: true, data }`.

**M-BE13. Zod validation di API handlers — inline vs imported schemas tidak konsisten**
- **Lokasi**: Semua API handlers
- **Detail**: 
  - Master data endpoints import Zod schemas dari `#server/database/schema` (e.g., `insertVendorSchema`)
  - CS claim endpoints define inline Zod schemas di handler file
  - Report endpoints define identical filter schema inline di setiap file (~8 duplicates)
- **Fix**: Extract shared query schemas ke `server/utils/` (e.g., `report-filter.schema.ts`, `claim-query.schema.ts`).

#### LOW

**L-BE1. `ensureClaimFound()` / `ensureVendorClaimFound()` — generic helper duplikat**
- **Files**: `claim-review.service.ts`, `vendor-claim.service.ts`
- **Detail**: Kedua services punya `ensureXxxFound<T>(value: T | null): T` yang identik kecuali error code. Pattern ini bisa di-generalize.
- **Fix**: Extract ke `server/utils/guards.ts`: `function ensureFound<T>(value: T | null, errorCode: ErrorCode): T`.

**L-BE2. `vendor-claim-item.repo.ts` uses inline types instead of imports**
- **File**: `server/repositories/vendor-claim-item.repo.ts` (line ~9-10)
- **Detail**: Defines `type VendorClaimItemInsert = typeof vendorClaimItem.$inferInsert` locally instead of importing `InsertVendorClaimItem` from schema. `vendor-claim.repo.ts` does the same for its types.
- **Fix**: Import dari schema for consistency.

**L-BE3. `server/utils/request-headers.ts` — hanya dipakai di 1 file**
- **File**: `server/utils/request-headers.ts` (14 lines)
- **Detail**: `toRequestHeaders()` hanya dipakai di `server/middleware/auth.ts`. Bisa di-inline.
- **Fix**: Minor — keep as is (future reuse kemungkinan ada) atau inline ke middleware.

**L-BE4. `status-transitions.ts` tidak include validation error messages**
- **File**: `server/utils/status-transitions.ts`
- **Detail**: `canTransitionClaimStatus()` returns boolean tanpa info tentang allowed transitions. Service layer throw generic `INVALID_STATUS_TRANSITION` tanpa detail.
- **Fix**: Return object `{ valid: boolean, allowed: ClaimStatus[] }` agar error message bisa include "allowed transitions: [X, Y]".

**L-BE5. `error-codes.ts` — type `ErrorCode` sama nama dengan value object `ErrorCode`**
- **File**: `server/utils/error-codes.ts` (line 1 vs 39)
- **Detail**: `export const ErrorCode = { ... } as const` dan `export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]` — TypeScript allows this (value/type namespaces separate) tapi bisa confusing.
- **Fix**: Rename type ke `ErrorCodeValue` atau keep as is (ini common TypeScript pattern).

**L-BE6. `pagination.ts` — `MAX_LIMIT = 100` tapi report queries tidak paginate**
- **File**: `server/utils/pagination.ts`
- **Detail**: Report endpoints tidak pakai pagination — return semua data. Jika ada 10,000 claims, report queries return semuanya.
- **Fix**: Tambah LIMIT ke report queries atau document bahwa reports intentionally unbounded.

✅**L-BE7. `auth.ts` — TODO comment masih ada**
- **File**: `server/utils/auth.ts` (line 15)
- **Detail**: `/** TODO: Ganti dengan Better-Auth session check. */` — tapi `requireAuth()` sudah pakai Better-Auth via middleware. Comment outdated.
- **Fix**: Hapus atau update TODO comment.

**L-BE8. `claimService.submitRevision()` — hardcoded photo revision path**
- **File**: `server/services/claim.service.ts` (line ~283)
- **Detail**: `filePath: \`uploads/claims/${claimId}/${item.photoType}-revision.jpg\`` — hardcoded path. Sama untuk `createClaim()` (line ~173).
- **Fix**: Extract upload path builder ke shared utility (e.g., `buildClaimPhotoPath(claimId, photoType, suffix?)`).

**L-BE9. `claim-history.repo.ts` `findAllWithUserInfo` — search dengan `like` pada `user.name` tanpa join di `countByFilter`**
- **File**: `server/repositories/claim-history.repo.ts` (line ~32-38 vs ~105-113)
- **Detail**: `buildWhereClause` pakai `like(user.name, searchTerm)`, tapi `countByFilter` joins `user` table untuk WHERE clause. Ini benar tapi potentially expensive karena join hanya untuk filter.
- **Fix**: Minor optimization — acceptable for current scale.

✅**L-BE10. `server/database/seed.ts` not in scope but referenced by `database/index.ts`**
- **Detail**: `seed.ts` di-exclude dari review scope (per instruction), tapi `database/index.ts` exports `db` yang dipakai oleh seed. No issue, just noting the dependency.

### 5.4 Pattern Analysis — Layer-by-Layer

#### Repository Pattern

| Metric | Status |
|---|---|
| Naming convention (`entity.repo.ts`) | Consistent |
| Exported as object literal | Consistent |
| `findById` returns `T \| null` | Consistent |
| `insert`/`update` uses `.returning()` | Consistent |
| `buildWhereClause` for list filtering | Consistent (8/13 repos that have list queries) |
| Transaction support (`tx?` param) | **Partial** — 8/13 repos support tx, 5 master-data repos do not |
| Explicit return types | **Missing** — all rely on inference |
| Pagination via `calcOffset()` | Consistent |

#### Service Pattern

| Metric | Status |
|---|---|
| Naming convention (`entity.service.ts`) | Consistent |
| Exported as object literal | Consistent |
| Error throwing via `ErrorCode` | Consistent |
| Error-to-HTTP mapper co-exported | **Partial** — only 3/11 services export `mapXxxErrorToHttp` |
| Business rule enforcement | Good — status transitions, uniqueness, ownership checks |
| Transaction usage for multi-step ops | Good — `db.transaction()` used where needed |
| Logging | **Missing** — no logging in any service |
| Input re-validation | **Missing** — services trust caller input |

#### API Handler Pattern

| Metric | Status |
|---|---|
| Auth check on protected routes | 52/52 non-auth routes protected |
| Zod validation | Universal — all inputs validated |
| Error handling | **Inconsistent** — 3 different patterns (H-BE1) |
| Response format | **Mostly consistent** — minor variations (M-BE12) |
| Service delegation | Consistent — handlers delegate through service layer |
| HTTP method semantics | Correct (GET read, POST create, PUT update, PATCH partial) |

### 5.5 Issue Summary (Section 5 Only)

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 6 |
| MEDIUM | 13 |
| LOW | 10 |
| **Total** | **29** |

---

## 6. Frontend — App Directory

> **STATUS: SELESAI** — Full review terhadap layouts, pages, composables, components, utils.

### 6.1 Overview

| Kategori | Jumlah | Notes |
|---|---|---|
| Layouts | 2 (`cs.vue`, `dashboard.vue`) | + 2 parent route wrappers (`pages/cs.vue`, `pages/dashboard.vue`) |
| Pages | 30 | 6 CS + 24 Dashboard |
| Composables | 5 | `useAuthSession`, `useDashboardStore`, `useCsStore`, `useClaimReview`, `useAuditTrail` |
| Components | 20 | 4 unused, 0 dengan ARIA attributes |
| Utils | 6 | `types.ts`, `status-config.ts`, `role-navigation.ts`, `mock-data.ts`, `select-ui.ts`, `audit-trail-config.ts` |
| Test Fixtures | 9 files di `test-fixtures/cs/` | Hanya untuk CS area, dashboard pakai inline mock |
| Total Lines (app/) | ~16,000+ | |

### 6.2 API Integration Maturity

**Ini adalah temuan paling penting dari frontend review.** Mayoritas halaman masih 100% mock data.

| Page | API Status | Data Source |
|---|---|---|
| `cs/index.vue` | **Partial** | `useFetch('/api/cs/claims')` + mock notifications |
| `cs/claims/index.vue` | **Partial** | Via `useCsStore` → `useFetch` + mock reference data |
| `cs/claims/create.vue` | **Partial** | `useCsStore().lookupNotification()` + `createClaim()` real; reference data mock |
| `cs/claims/[id]/index.vue` | **Real** | `useFetch('/api/cs/claims/${id}')` |
| `cs/claims/[id]/edit.vue` | **Real** | `useFetch` + `useCsStore().submitRevision()` |
| `cs/profile.vue` | **None** | 100% mock (`setTimeout` fakes) |
| `dashboard/index.vue` | **Partial** | `useFetch('/api/claims')` + hardcoded KPIs, chart, topCS |
| `dashboard/claims/index.vue` | **Real** | `useFetch('/api/claims')` |
| `dashboard/claims/[id].vue` | **Real** | 6 API endpoints (`useFetch`, `$fetch` PATCH/POST) |
| `dashboard/vendor-claims/index.vue` | **None** | 100% mock (7 hardcoded batches + fake refresh) |
| `dashboard/vendor-claims/create.vue` | **None** | 100% mock (fake generate + hardcoded eligible claims) |
| `dashboard/vendor-claims/[id].vue` | **None** | 100% mock (1 batch, local-only mutations) |
| `dashboard/users/index.vue` | **None** | 100% mock (`MOCK_AUTH_USERS`) |
| `dashboard/users/[id].vue` | **None** | 100% mock (static import) |
| `dashboard/settings/index.vue` | **None** | 100% mock (`MOCK_USER_PROFILE`) |
| `dashboard/settings/security.vue` | **None** | 100% mock (password change faked) |
| `dashboard/audit-trail.vue` | **None** | Mock via `useAuditTrail` composable |
| `dashboard/master/index.vue` | **None** | Hardcoded card counts |
| `dashboard/master/vendor.vue` | **None** | 3 hardcoded vendors + `setTimeout` |
| `dashboard/master/product-model.vue` | **None** | 3 hardcoded models + `setTimeout` |
| `dashboard/master/notification.vue` | **None** | 3 hardcoded notifications + `setTimeout` |
| `dashboard/master/defect.vue` | **None** | 4 hardcoded defects + `setTimeout` |
| `dashboard/reports/*.vue` (7 pages) | **None** | All hardcoded `ref([...])` arrays |

**Summary:** 4 pages fully wired, 3 partially wired, **23 pages still 100% mock data**. Khususnya, 9 server API routes di `/api/reports/` sudah ada tapi **tidak satupun** dipakai oleh report pages.

### 6.3 Layouts

#### `app/layouts/cs.vue` (208 lines)
- Fixed sidebar (w-80) + scrollable main area
- 4 nav links: Home, My Claims, Create New, Profile
- Design system correct: `bg-[#050505]`, `bg-[#0a0a0a]`, accent `#B6F500`
- Uses `useAuthSession()` for user/logout
- Mobile hamburger with overlay

#### `app/layouts/dashboard.vue` (376 lines)
- Fixed sidebar (w-[360px]) + topbar with search, bell, clock
- Dynamic navigation via `useDashboardStore().navigation` (role-aware)
- Collapsible menu groups with dropdown state
- Live clock (1s `setInterval`), keyboard shortcut (`/` and `Ctrl+K`)
- Decorative blurred orbs: `bg-[#B6F700]/5 blur-[150px]`
- Dev role switcher sudah dihapus dari layout (production-safe)

### 6.4 Composables

| Composable | Lines | Data Source | State Pattern | Issues |
|---|---|---|---|---|
| `useAuthSession` | 132 | Real API (`$fetch`) | `useState` + `useAsyncData(lazy)` | Unsafe `as UserRole` cast tanpa runtime validation |
| `useDashboardStore` | 44 | Delegates to `useAuthSession` | All `computed` | Dev role-switcher logic sudah dihapus |
| `useCsStore` | 174 | Hybrid (API + mock reference data) | `useFetch` + `reactive` | ✅ `currentUser` sekarang reactive computed dari `useAuthSession()` |
| `useClaimReview` | 113 | None (pure logic) | Stateless | `SUBMITTED` in neither reviewable nor readonly |
| `useAuditTrail` | 279 | Mock (`getMockAuditTrailSorted`) | `ref` + `computed` + `readonly` | Timer leak + no error catch |

### 6.5 Components

| Component | Lines | Used By | Issues |
|---|---|---|---|
| `AppLogo` | 40 | **UNUSED** | Nuxt logo SVG, not RMA branding |
| `DashboardTablePagination` | 123 | 9 pages | No `aria-label` on nav buttons |
| `EmptyState` | 58 | 9 pages (18 instances) | `icon` prop typed as `object` not `Component` |
| `FilterBar` | 92 | 8 pages | Search input has no `aria-label` |
| `FilterPill` | 34 | **UNUSED** | 8 pages duplicate its markup manually |
| `ImportExcelModal` | 405 | 1 page | Hardcoded "Notification Master" subtitle |
| `LoadingState` | 71 | 9 pages | No `role="status"` / `aria-busy` |
| `PageHeader` | 65 | 8 pages | Back button uses inline SVG not lucide |
| `PhotoCompareCard` | 147 | 1 page | Tightly coupled to photo revision |
| `PhotoEvidenceCard` | 199 | 1 page | ExternalLink button non-functional |
| `PhotoLightbox` | 151 | 1 page | No focus trap |
| `SectionCard` | 33 | 10+ instances | Uses `<div>` not `<section>` |
| `StatsCard` | 44 | **UNUSED** | Operator precedence bug in trend color |
| `StatusBadge` | 71 | 17 refs / 8 files | ✅ Fallback rendering ditambahkan untuk unknown status |
| `StickyActionBar` | 30 | 3 pages | `<footer>` semantically incorrect |
| `TemplateMenu` | 49 | **UNUSED** | Nuxt starter template leftover |
| `TimelineList` | 109 | 2 pages | `<time>` lacks `datetime` attribute |
| `WorkflowStepper` | 68 | 3 pages | Not responsive |
| `reports/AnalyticsChart` | 108 | 6 pages | `LineChart` not explicitly imported |
| `reports/RankingList` | 88 | 3 pages | `revisionRate` interface prop unused |

**4 unused components** should be removed: `AppLogo`, `FilterPill`, `StatsCard`, `TemplateMenu`.

### 6.6 Utils

| File | Lines | Purpose | Issues |
|---|---|---|---|
| `types.ts` | 318 | 16 interfaces + 1 type alias | Mixed strictness: `AuditTrailRecord` uses unions, `ClaimHistoryItem` uses `string` |
| `status-config.ts` | 225 | Status → color/icon mappings | Follows PRD semantics correctly |
| `role-navigation.ts` | 230 | Role-aware nav builder | MANAGEMENT = amber here but purple in audit-trail-config |
| `mock-data.ts` | 1181 | Mock data + utility functions | Utility functions (`formatDate`, `formatDateTime`) misplaced in mock file |
| `select-ui.ts` | 66 | Nuxt UI `ui` prop presets | Hardcoded `#B6F700` in all presets |
| `audit-trail-config.ts` | 282 | Audit trail config/helpers | Duplicates status colors from `status-config.ts` |

### 6.7 Test Fixtures

**`app/test-fixtures/cs/`** (9 files):
- `types.ts`: 12 interfaces (stricter than `utils/types.ts` — uses union types)
- `claims.ts`: 10 mock claims
- `reference-data.ts`: 3 vendors, 5 product models, 7 defects, 5 branches
- `user.ts`: Mock CS user profile
- `helpers.ts`: `formatDateTime()` (duplicated from `mock-data.ts`)

**Dashboard pages have no test fixtures** — setiap page mendefinisikan mock data inline.

### 6.8 Type Definitions — Duplikasi & Inkonsistensi

**ISSUE — HIGH: Duplikasi type definitions antara 3 lokasi**

| Type | `app/utils/types.ts` | `app/test-fixtures/cs/types.ts` | `shared/types/database.ts` |
|---|---|---|---|
| `ClaimHistoryItem.action` | `string` (LOOSE) | `ClaimHistoryAction` (STRICT) | N/A |
| `ClaimListItem.status` | `string` | `ClaimStatus` | N/A |
| Transaction types | Partial (no infer) | Separate shapes | **MISSING** |

Types di `app/utils/types.ts` lebih **loose** — production types seharusnya lebih strict.

### 6.9 Design System Consistency

#### Yang Sudah Benar:
- Background: `bg-[#050505]` (base), `bg-[#0a0a0a]` (surface) — konsisten di semua halaman
- Accent `#B6F700`: CTA buttons, active links, selection color, glow effects — konsisten
- Dark theme: `text-white`, `text-white/40`, `border-white/5` — konsisten
- Decorative orbs: `blur-[150px]` radial gradients — dipakai di layouts & login
- Rounded corners: `rounded-4xl`, `rounded-[32px]`, `rounded-[28px]` — dipakai konsisten

#### Yang Inkonsisten:

**ISSUE — CRITICAL: Status color mismatch antar halaman**

| Status | `cs/index.vue` | `cs/claims/index.vue` | `status-config.ts` | PRD |
|---|---|---|---|---|
| IN_REVIEW | `cyan` | `indigo` | `indigo` | `indigo` |
| APPROVED | `#B6F700` | `emerald` | `emerald` | `emerald` |
| ARCHIVED | `purple` | `white/muted` | `zinc/white` | `white/muted` |

`cs/index.vue` menggunakan inline color definitions yang berbeda dari shared `status-config.ts`.

**ISSUE — HIGH: MANAGEMENT role badge color inconsistency**

| Location | Color |
|---|---|
| `role-navigation.ts` | `bg-amber-500/10 text-amber-400` |
| `audit-trail-config.ts` | `bg-purple-500/10 text-purple-400` |
| `settings/index.vue` | `text-amber-400` |

**ISSUE — MEDIUM: Nuxt UI `primary: 'green'` !== design accent `#B6F700`**
- `app.config.ts` sets `primary: 'green'` (Nuxt green ~`#00DC82`)
- Nuxt UI components using `color="primary"` (e.g., `UTabs`) render in Nuxt green, not the design accent

### 6.10 TanStack Vue Table Usage

Dipakai di **9 pages**:

| Page | Columns | Sorting | Pagination | `h()` renders | `StatusBadge` in cell |
|---|---|---|---|---|---|
| `dashboard/index.vue` | 8 | No | No | Yes | Yes |
| `dashboard/claims/index.vue` | 8 | Yes | Yes | Yes | Yes |
| `dashboard/audit-trail.vue` | 8 | Yes | Yes | Yes | No |
| `dashboard/master/vendor.vue` | 6 | Yes | Yes | Yes | No |
| `dashboard/master/product-model.vue` | 6 | Yes | Yes | Yes | No |
| `dashboard/master/notification.vue` | 7 | No | Yes | Yes | No |
| `dashboard/master/defect.vue` | 5 | Yes | Yes | Yes | No |
| `dashboard/users/index.vue` | 7 | No | Yes | Yes | No |
| `cs/claims/index.vue` | 9 | Yes | Yes | Yes | Yes |

**Pattern issues:**
- `StatusBadge` harus di-import explicit untuk `h()` render: `import StatusBadge from '~/components/StatusBadge.vue'`
- Boilerplate ~50-80 lines per page (column setup, pagination state, table config). Bisa di-extract ke shared wrapper.
- Debounce search: hanya `dashboard/claims/index.vue` yang benar pakai 250ms debounce. Halaman lain langsung via `computed`.

### 6.11 Layout Assignment

✅ **ISSUE — CRITICAL: 2 pages missing `definePageMeta`** (DONE)

| Page | Has `definePageMeta`? | Consequence |
|---|---|---|
| `dashboard/master/index.vue` | **YES** | Fixed — page now declares `definePageMeta({ layout: 'dashboard', middleware: 'auth' })` |
| `dashboard/master/notification.vue` | **YES** | Fixed — page now declares `definePageMeta({ layout: 'dashboard', middleware: 'auth' })` |
| All other pages | Yes | Correct |

**Status implementasi:**
- `dashboard/master/index.vue` dan `dashboard/master/notification.vue` sudah ditambahkan `definePageMeta`
- Wrapper `dashboard/reports.vue` juga sudah ditambahkan `definePageMeta`
- Seluruh halaman dashboard/cs yang relevan sekarang konsisten memakai `middleware: 'auth'`

**ISSUE — MEDIUM: Redundant layout declaration in child pages**

Parent route wrappers (`pages/cs.vue`, `pages/dashboard.vue`) sudah set `layout: 'cs'`/`layout: 'dashboard'`. Semua ~26 child pages juga declare layout secara redundan. Jika layout name berubah, harus update di 28+ files.

### 6.12 Client Middleware

**`app/middleware/auth.global.ts`** (22 lines):
- Public routes: `/` dan `/login`
- Redirects to `/login` jika no session
- CS users cannot access `/dashboard/*`, non-CS cannot access `/cs/*`

✅ **ISSUE — CRITICAL: Race condition with lazy auth session** (DONE)

`useAuthSession()` uses `useAsyncData` dengan `lazy: true`. Sebelumnya middleware membaca `session.value` secara synchronous saat status masih `idle/pending`, sehingga authenticated users bisa salah redirect ke `/login` pada hard refresh.

**Status implementasi:**
- `app/middleware/auth.global.ts` sekarang memakai `defineNuxtRouteMiddleware(async ...)`
- Middleware menunggu resolve session via `await refreshSession()` saat `status` masih `idle`/`pending`
- Session baru dievaluasi setelah fetch selesai, sehingga false redirect ke `/login` tidak terjadi lagi

### 6.13 Loading & Error State Coverage

| Page | Loading State | Error State | Empty State |
|---|---|---|---|
| `cs/index.vue` | Skeleton cards | Retry button | Illustrated empty |
| `cs/claims/index.vue` | **MISSING** | **MISSING** | In-table empty |
| `cs/claims/create.vue` | Button spinners | Validation banners | N/A |
| `cs/claims/[id]/index.vue` | `LoadingState` component | 404 handling | Not-found state |
| `cs/claims/[id]/edit.vue` | **MISSING** | Redirect on error | N/A |
| `cs/profile.vue` | Spinner (fake delay) | ✅ wired (`profileError` set via try/catch) | N/A |
| `dashboard/index.vue` | **MISSING** | **MISSING** | N/A |
| `dashboard/claims/index.vue` | `LoadingState` table skeleton | **MISSING** | `EmptyState` |
| `dashboard/claims/[id].vue` | Spinner + contextual message | Success/error banners + not-found fallback | ✅ 404 handling via guard + `EmptyState` |
| `dashboard/vendor-claims/index.vue` | `LoadingState` (fake) | **MISSING** | `EmptyState` |
| `dashboard/vendor-claims/create.vue` | Button spinner | Step error banners | `EmptyState` per step |
| `dashboard/vendor-claims/[id].vue` | **MISSING** | **MISSING** | N/A |
| `dashboard/users/index.vue` | `LoadingState` | **MISSING** | `EmptyState` |
| `dashboard/users/[id].vue` | **MISSING** | **MISSING** | Not-found fallback |
| `dashboard/settings/index.vue` | Present (dead code) | Present (dead code) | N/A |
| `dashboard/settings/security.vue` | Button spinner | `passwordServerError` (dead code) | N/A |
| `dashboard/audit-trail.vue` | `LoadingState` | **MISSING** | `EmptyState` |
| `dashboard/master/*.vue` (4 pages) | `LoadingState` | **MISSING** | `EmptyState` |
| `dashboard/reports/*.vue` (7 pages) | **MISSING** (kecuali chart fallback) | **MISSING** | **MISSING** |

**Summary:** Hanya 2 page punya full loading+error+empty coverage (`cs/index.vue` dan `cs/claims/[id]/index.vue`). Sisanya partial atau missing.

### 6.14 Report Pages — Non-Functional Filters

**ISSUE — CRITICAL: Filter UI yang tidak berfungsi di report pages**

| Page | Filters Rendered | Filters Actually Working |
|---|---|---|
| `reports/index.vue` | Period, Branch, Vendor | **All 3** (via `resolvePeriodFilter`) |
| `reports/vendors.vue` | Period | ✅ period wired ke data mock + chart/kpi/table |
| `reports/trends.vue` | Granularity, Branch, Vendor | ✅ granularity + branch + vendor wired ke active data |
| `reports/recovery.vue` | Period, Branch, Vendor, Decision | ✅ period + branch + vendor + decision wired |
| `reports/aging.vue` | Period, Branch, Bucket | ✅ period + branch + bucket wired |
| `reports/branches.vue` | Period, Search | ✅ period + search wired |
| `reports/defects.vue` | Period, Branch, Vendor, Model | ✅ period + branch + vendor + model wired |

✅ Semua halaman reports sekarang sudah merespons perubahan filter terhadap data mock yang ditampilkan.

### 6.15 Export Buttons

| Page | Button Exists | Functional? |
|---|---|---|
| `reports/index.vue` | "Export CSV" | **Yes** — client-side CSV |
| `reports/vendors.vue` | "Export" | ✅ Yes — client-side CSV |
| `reports/trends.vue` | "Export" | ✅ Yes — client-side CSV |
| `reports/recovery.vue` | "Export" | ✅ Yes — client-side CSV (tanpa API export endpoint) |
| `reports/aging.vue` | "Export" | ✅ Yes — client-side CSV |
| `reports/branches.vue` | "Export" | ✅ Yes — client-side CSV |
| `reports/defects.vue` | "Export" | ✅ Yes — client-side CSV |

### 6.16 Accessibility

**Systemic failure: 0 dari 20 komponen memiliki ARIA attributes.**

Temuan spesifik:
- Zero `aria-label` pada icon-only buttons di semua pages & components
- Zero `aria-pressed` pada toggle/filter pill buttons
- Zero `role="status"` atau `aria-live` pada loading/empty/error states
- Zero `aria-expanded` pada collapsible menus di dashboard layout
- Zero focus trap di `PhotoLightbox` (modal-like overlay)
- `LoadingState` component: no `aria-busy="true"`, no screen reader text
- Modal close buttons di `cs/index.vue` have `tabindex="-1"` (unreachable by keyboard)
- Keyboard shortcut hint shows `⌘K` (Mac) but handler checks `Ctrl+K` (Windows/Linux)

### 6.17 Code Duplication

| Duplicated Pattern | Locations | Fix |
|---|---|---|
| Clock `setInterval` + formatting | `cs/index.vue`, `cs/claims/index.vue`, `dashboard/layout` | Extract `useFormattedClock()` composable |
| Autosave mock (`setTimeout` nesting) | `cs/claims/create.vue`, `cs/claims/[id]/edit.vue` | Extract composable or remove |
| Scrollbar CSS (webkit) | Both layouts + `login.vue` | Extract to shared CSS |
| Logo inline SVG (18 lines) | Both layouts | `AppLogo` component exists but unused |
| Period filter options array | 7 report pages (identical) | Extract constant |
| `formatIdr()` function | `reports/vendors.vue`, `reports/recovery.vue` (different logic) | Extract shared util |
| `formatDateTime()` function | `mock-data.ts`, `test-fixtures/cs/helpers.ts` | Consolidate |
| `initials()` / `generateInitials()` | `mock-data.ts`, `audit-trail-config.ts` (different behavior) | Consolidate |
| Status color definitions | `status-config.ts`, `audit-trail-config.ts`, inline in pages | Single source |
| Settings sidebar tabs | `settings/index.vue`, `settings/security.vue` | Extract component |
| Explicit Vue imports | 8+ pages import `ref, computed, watch` etc. | Remove (Nuxt auto-imports) |

### 6.18 Missing Components (Architectural Gaps)

| Component | Rationale |
|---|---|
| `ErrorState` | `EmptyState` dan `LoadingState` ada, tapi tidak ada `ErrorState` untuk API failures |
| `ConfirmDialog` | Beberapa aksi irreversible (complete batch, toggle status) tanpa konfirmasi |
| `DataTable` (wrapper) | 9 pages duplicate TanStack boilerplate ~50-80 lines. Shared wrapper bisa mengurangi ini |
| `SearchInput` | Pattern search icon + input + focus ring di-replicate di `FilterBar` dan layouts |
| `Avatar` | `TimelineList` buat initials avatars inline. Bisa di-share untuk user management dan audit trail |
| `BreadcrumbNav` | Deep nested pages tanpa breadcrumb navigation |
| `FormField` | Create/edit pages duplicate form field wrappers (label + input + error) |

### 6.19 Issues

#### CRITICAL

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| ✅ C-FE1 (DONE) | Race condition: lazy auth session + synchronous middleware check | `auth.global.ts`, `useAuthSession.ts` | Sudah ditangani dengan middleware async + `await refreshSession()` saat `status` `idle/pending` |
| ✅ C-FE2 (DONE) | Status color mismatch: `cs/index.vue` pakai cyan/purple/`#B6F700`, halaman lain pakai indigo/emerald/zinc | `cs/index.vue` vs `status-config.ts` | Gunakan `status-config.ts` di semua halaman |
| ✅ C-FE3 (DONE) | 2 pages missing `definePageMeta` — render tanpa layout | `master/index.vue`, `master/notification.vue` | Sudah ditambahkan `definePageMeta({ layout: 'dashboard', middleware: 'auth' })` |
| ✅ C-FE4 (DONE) | Report filters non-functional — UI renders `USelect` yang inert | 6 report pages | Filter period/branch/vendor/model sudah di-wire ke computed data di semua halaman report |
| ✅ C-FE5 (DONE) | `cs/profile.vue` error state dead code — `profileError` never set to `true` | `cs/profile.vue` | `onMounted` sudah pakai `try/catch` dan set `profileError` saat fetch gagal |
| ✅ C-FE6 (DONE) | `dashboard/claims/[id].vue` no 404 handling — null `claimRecord` renders review UI | `dashboard/claims/[id].vue` | Sudah ditambahkan guard `error || !claimRecord` + fallback `EmptyState` |
| C-FE7 | Vendor-claims pages 100% mock — API routes exist tapi tidak dipakai | 3 vendor-claim pages | Wire ke `/api/vendor-claims` endpoints |
| C-FE8 | Master data pages 100% mock — mutations are local-only `setTimeout` fakes | 4 master pages | Wire ke `/api/master/*` endpoints |
| ✅ C-FE9 (DONE) | `useAuditTrail` timer leak — `searchTimer` not cleaned up on unmount | `useAuditTrail.ts` | Gunakan `onScopeDispose` atau `watchDebounced` |
| ✅ C-FE10 (DONE) | `useAuditTrail` no error catch — `try/finally` tanpa `catch` | `useAuditTrail.ts` | Tambah `catch` block yang set error ref |
| ✅ C-FE11 (DONE) | `recovery.vue` calls non-existent API endpoint `/api/reports/export` | `reports/recovery.vue` | Export diganti ke client-side CSV dan `isExporting` tetap dipertahankan |
| C-FE12 | Create user modal tanpa form validation — no Zod, no email format check | `users/index.vue` | Tambah Zod schema |
| ✅ C-FE13 (DONE) | No auth middleware pada admin pages — unprotected route access | All 10 admin/master pages | Middleware auth sudah diterapkan konsisten di dashboard/cs pages |
| ✅ C-FE14 (DONE) | `cs/claims/create.vue` declaration checkbox always checked, not bound to state | `cs/claims/create.vue` | Checkbox sudah di-bind ke `ref` dan submit diblokir jika belum dicentang |
| ✅ C-FE15 (DONE) | `cs/claims/create.vue` photo uploads via JSON body — Files cannot be sent as JSON | `cs/claims/create.vue` | Payload create claim sudah dikirim via `FormData` (multipart) |

#### HIGH

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| H-FE1 | `ClaimHistoryItem` uses loose `string` types vs `AuditTrailRecord` strict unions | `utils/types.ts` | Ganti ke union types dari constants |
| H-FE2 | Duplikasi types antara `utils/types.ts` dan `test-fixtures/cs/types.ts` | Kedua file | Single source of truth |
| ✅ H-FE3 (DONE) | `useCsStore.currentUser` non-reactive static constant, not from auth | `useCsStore.ts` | `currentUser` sekarang `computed` yang derive dari `useAuthSession().user` — reactive dan sinkron dengan session server |
| H-FE4 | 0 ARIA attributes di semua 20 components — systemic accessibility failure | All components | Tambah `aria-label`, `aria-pressed`, `role`, `aria-live` |
| H-FE5 | `FilterPill` component unused, 8 pages manually duplicate markup | `FilterPill.vue` + 8 pages | Gunakan component atau hapus |
| H-FE6 | `TemplateMenu` — Nuxt starter leftover, unrelated to RMA | `TemplateMenu.vue` | Hapus |
| H-FE7 | `AppLogo`, `StatsCard` — fully implemented but unused dead code | 2 component files | Hapus atau integrate |
| H-FE8 | Explicit Vue imports di 8+ pages (`ref, computed, watch`) — Nuxt auto-imports | 8+ pages | Hapus explicit imports |
| H-FE9 | `h-screen` di CS layout vs `h-dvh` di dashboard layout — mobile viewport inconsistency | `cs.vue` layout | Standardisasi ke `h-dvh` |
| ✅ H-FE10 (DONE) | Authenticated users can access `/login` — no redirect | `auth.global.ts` | Redirect authenticated users dari `/login` |
| H-FE11 | Auto-start review fires on every page load for SUBMITTED claims — race condition | `dashboard/claims/[id].vue` | Concurrency guard / optimistic locking |
| H-FE12 | `cs/index.vue` `rawNotifications` always empty — ratio permanently 0% | `cs/index.vue` | Wire ke API atau hapus gamification |
| H-FE13 | `cs/claims/index.vue` no loading/error state — empty table during fetch | `cs/claims/index.vue` | Tambah `LoadingState` dan error handling |
| H-FE14 | `cs/claims/create.vue` autosave entirely fake (`setTimeout`) — misleading UX | `cs/claims/create.vue` | Implement real persistence atau hapus indicator |
| H-FE15 | Fake refresh functions (`setTimeout` no-ops) di vendor-claims & users | 3 pages | Wire ke real API refresh |
| H-FE16 | KPI data di `dashboard/index.vue` hardcoded — API routes exist unused | `dashboard/index.vue` | Wire ke `/api/reports/dashboard-kpi` |
| H-FE17 | `qrccAssignee` hardcoded sebagai `'Nadia Putri'` | `dashboard/claims/[id].vue` | Wire ke API atau auth context |
| H-FE18 | `cs/profile.vue` all 3 save operations entirely mock — avatar blob URL lost on refresh | `cs/profile.vue` | Wire ke real API |
| H-FE19 | `dashboard/users/[id].vue` reads static import not reactive ref — changes from list page not reflected | `users/[id].vue` | Fetch dari API atau shared reactive state |
| H-FE20 | `PhotoLightbox` no focus trap — keyboard tab leaks behind overlay | `PhotoLightbox.vue` | Implement focus trap |
| H-FE21 | Shared `isLoading` ref for multiple operations in master pages — state corruption risk | 4 master pages | Separate loading refs per operation |
| H-FE22 | Vendor/product-model options hardcoded independently in multiple pages — data silos | `product-model.vue`, `notification.vue` | Fetch from API or shared store |
| ✅ H-FE23 (DONE) | `StatusBadge` renders nothing on unknown status — silent failure | `StatusBadge.vue` | Ditambahkan fallback rendering dengan neutral style (`bg-white/10 text-white/50`) untuk status yang tidak dikenali |
| H-FE24 | `login.vue` `:global()` scrollbar styles leak to entire app | `login.vue` | Gunakan scoped styles |
| H-FE25 | No Zod validation di CS create/edit forms — PRD lists Zod in tech stack | `create.vue`, `edit.vue` | Tambah Zod schemas |
| H-FE26 | 9 server API routes di `/api/reports/` exist tapi tidak satupun dipakai | 7 report pages | Wire ke existing endpoints |
| H-FE27 | `dashboard/index.vue` no error handling for `useFetch('/api/claims')` | `dashboard/index.vue` | Destructure `error` dan tampilkan fallback |
| H-FE28 | MANAGEMENT role color: amber vs purple in different configs | `role-navigation.ts` vs `audit-trail-config.ts` | Unify |
| H-FE29 | `dashboard/vendor-claims/[id].vue` no 404 — silently falls back to first mock batch | `vendor-claims/[id].vue` | Wire ke API + proper 404 |
| H-FE30 | No Zod schema on user creation form | `users/index.vue` | Tambah Zod validation |
| H-FE31 | Settings sidebar duplicated between `settings/index.vue` and `security.vue` | 2 settings pages | Extract ke shared component |

#### MEDIUM

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| M-FE1 | Redundant layout declaration di ~26 child pages (parent already sets it) | All child pages | Hapus redundant declarations |
| M-FE2 | `VendorClaimBatch.vendorDecision` inline union, not imported | `utils/types.ts` | Import dari constants |
| M-FE3 | Primary color (`green`) mismatch dengan accent (`#B6F700`) di `app.config.ts` | `app.config.ts` | Register custom color |
| M-FE4 | `useDashboardStore`: `switchRole` silently returns on failure | `useDashboardStore.ts` | Return result atau throw on failure |
| M-FE5 | `useCsStore`: redundant `refreshNuxtData` after `refreshClaims` | `useCsStore.ts` | Pilih satu mechanism |
| M-FE6 | `useClaimReview`: `SUBMITTED` di neither reviewable nor readonly — implicit third state | `useClaimReview.ts` | Dokumentasikan atau handle explicitly |
| M-FE7 | `useAuditTrail`: double sorting — mock pre-sorted lalu re-sorted client | `useAuditTrail.ts` | Hapus pre-sort |
| M-FE8 | `AuditLogEntry` deprecated but still exported and used | `types.ts`, `mock-data.ts` | Remove |
| M-FE9 | `ImportExcelModal` drop zone not keyboard-accessible | `ImportExcelModal.vue` | Tambah keyboard handler |
| M-FE10 | `useAuthSession`: unsafe `as UserRole` cast tanpa runtime validation | `useAuthSession.ts` | Gunakan `isUserRole()` guard |
| M-FE11 | `cs/claims/create.vue` artificial 500ms delay di `handleLookup` | `cs/claims/create.vue` | Hapus `setTimeout` |
| M-FE12 | Multiple `console.log` debug statements left in code | `cs/claims/create.vue` | Remove |
| M-FE13 | Non-functional UI elements: "COPY" buttons, "PRINT REPORT", "Lupa Password?" | Multiple pages | Wire atau hapus |
| M-FE14 | No `useSeoMeta`/`useHead` on any page — browser tab shows nothing meaningful | All pages | Tambah page titles |
| M-FE15 | Keyboard shortcut `⌘K` displayed but `Ctrl+K` handled — macOS mismatch | `dashboard.vue` layout | Detect platform |
| M-FE16 | Avatar `<img>` no fallback for undefined `avatarUrl` — shows broken image | Both layouts | Tambah fallback/initial avatar |
| M-FE17 | `cs/claims/index.vue` no debounce on search — every keystroke triggers recompute | `cs/claims/index.vue` | Tambah 250ms debounce |
| M-FE18 | `NuxtLink` with `target="_blank"` on claim items — unusual for internal SPA | `cs/index.vue` | Hapus `target="_blank"` |
| M-FE19 | Hardcoded "In Warranty" badge not data-driven | `cs/claims/[id]/index.vue` | Derive dari claim data |
| M-FE20 | Empty `onMounted` dead code | `cs/claims/[id]/index.vue` | Hapus |
| M-FE21 | `cs/claims/[id]/edit.vue` unsafe cast `as unknown as CsClaimDetail` | `cs/claims/[id]/edit.vue` | Proper type narrowing |
| M-FE22 | No unsaved-changes warning on create/edit pages | 3 form pages | Implement `onBeforeRouteLeave` |
| M-FE23 | No confirmation dialog before irreversible actions (complete batch, submit review) | Multiple pages | Tambah confirm modal |
| M-FE24 | `dashboard/master` pages: no duplicate code/name validation | 4 master pages | Check before upsert |
| M-FE25 | `dashboard/master` pages: ID generation uses `Date.now()` — collision risk | 4 master pages | Use API-generated IDs |
| M-FE26 | `dashboard/audit-trail.vue`: `await fetchAuditTrail()` in setup — Suspense dependency | `audit-trail.vue` | Handle error or use `useFetch` |
| ✅ M-FE27 (DONE) | Report pages: export buttons tanpa `@click` handler | 5 report pages | Semua tombol export report sudah terhubung ke fungsi CSV client-side |
| M-FE28 | Report pages: `formatIdr()` defined independently dengan logic berbeda | `vendors.vue`, `recovery.vue` | Extract shared util |
| M-FE29 | Report pages: branch/vendor filter options copy-pasted identically di 7 pages | 7 report pages | Extract constant |
| M-FE30 | `dashboard/claims/[id].vue` photo review decisions lost on navigate — no warning | `dashboard/claims/[id].vue` | Unsaved changes warning |
| M-FE31 | `dashboard/claims/[id].vue` error casting `as { data?: ... }` repeated 3 times | `dashboard/claims/[id].vue` | Extract utility |
| M-FE32 | `dashboard/claims/[id].vue` sequential API waterfall (3-4 calls on load) | `dashboard/claims/[id].vue` | Parallelize fetches |
| M-FE33 | `dashboard/vendor-claims/[id].vue` modal `type="number"` stored as string | `vendor-claims/[id].vue` | Use proper `ref<number>` |
| M-FE34 | `dashboard/settings/security.vue` `passwordServerError` dead code — never set | `security.vue` | Wire ke real API error |
| M-FE35 | `dashboard/master/notification.vue` no status toggle capability unlike other masters | `notification.vue` | Add soft-delete / status management |
| M-FE36 | Clock `setInterval` duplicated di 3+ locations | Multiple files | Extract `useFormattedClock()` |
| M-FE37 | `reports/index.vue` hardcoded KPI trend values don't update with filter changes | `reports/index.vue` | Compute trends dynamically |
| M-FE38 | `reports/index.vue` claims detail table has no pagination | `reports/index.vue` | Tambah pagination |
| ✅ M-FE39 (DONE) | `reports/recovery.vue` period filter only passed to export params, not data filtering | `reports/recovery.vue` | Period filter sudah di-wire ke filtering data (trend + vendor breakdown) |
| M-FE40 | Custom CSS animation classes duplicated di 4+ pages | Multiple pages | Extract ke shared Tailwind utilities |
| M-FE41 | `cs/claims/index.vue` `periodPresetOptions` includes `'CUSTOM'` cast as type | `cs/claims/index.vue` | Add to union type |
| M-FE42 | `cs/claims/index.vue` duplicate action buttons (Eye + ExternalLink) go to same URL | `cs/claims/index.vue` | Hapus satu |
| ✅ M-FE43 (DONE) | `dashboard/reports.vue` wrapper no `definePageMeta` — layout delegated to children | `reports.vue` | Sudah ditambahkan `definePageMeta({ layout: 'dashboard', middleware: 'auth' })` |
| M-FE44 | `dashboard/reports/aging.vue` inline status colors instead of `StatusBadge` | `aging.vue` | Gunakan `StatusBadge` |
| M-FE45 | `dashboard/master` pages 800-1000+ lines — should decompose | 4 master pages | Extract modals & columns |
| M-FE46 | No `<NuxtErrorBoundary>` atau `error.vue` — unhandled errors show default Nuxt page | `app.vue` | Tambah error boundary |

#### LOW

| # | Temuan | File | Rekomendasi |
|---|---|---|---|
| L-FE1 | Missing `lang="ts"` on 3 script blocks (`app.vue`, `pages/cs.vue`, `pages/dashboard.vue`) | 3 files | Tambah `lang="ts"` |
| L-FE2 | Webkit-only scrollbar CSS — no Firefox support | Both layouts | Tambah `scrollbar-color`/`scrollbar-width` |
| L-FE3 | Inconsistent version strings: `v4.3.1` vs `4.0.1-stable` | `index.vue` vs `login.vue` | Standardisasi |
| L-FE4 | `useClaimReview` is stateless composable — could be plain util functions | `useClaimReview.ts` | Move ke `utils/` |
| L-FE5 | `mock-data.ts` exports utility functions alongside mock data | `mock-data.ts` | Move utils ke dedicated file |
| L-FE6 | Duplicate `initials()` vs `generateInitials()` with different behavior | `mock-data.ts` vs `audit-trail-config.ts` | Consolidate |
| L-FE7 | `select-ui.ts` string concatenation for class composition — potential Tailwind conflicts | `select-ui.ts` | Consider `tailwind-merge` |
| L-FE8 | `MOCK_USER_PROFILE.role = 'QRCC'` but same person is `'CS'` in `MOCK_AUTH_USERS` | `mock-data.ts` | Fix mock consistency |
| L-FE9 | `audit-trail-config.ts` re-declares status colors already in `status-config.ts` | `audit-trail-config.ts` | Derive from shared |
| L-FE10 | `EmptyState` icon prop typed as `object` not `Component` | `EmptyState.vue` | Fix type |
| L-FE11 | `PageHeader` back button uses inline SVG not lucide icon | `PageHeader.vue` | Use lucide |
| L-FE12 | `SectionCard` uses `<div>` not `<section>` | `SectionCard.vue` | Use `<section>` |
| L-FE13 | `StickyActionBar` uses `<footer>` semantically incorrect for action bar | `StickyActionBar.vue` | Use `<div role="toolbar">` |
| L-FE14 | `TimelineList` `<time>` lacks `datetime` attribute | `TimelineList.vue` | Tambah `datetime` ISO format |
| L-FE15 | `WorkflowStepper` not responsive — horizontal overflow on mobile | `WorkflowStepper.vue` | Add responsive layout |
| L-FE16 | `RankingList` `revisionRate` declared in interface but never used | `RankingList.vue` | Remove atau implement |
| L-FE17 | `RankingList` `cursor-pointer` without click handler | `RankingList.vue` | Hapus atau implement |
| L-FE18 | Mixed language in UI — Indonesian labels, English headings, inconsistent | All pages | Standardisasi |
| L-FE19 | No URL hash/query sync for tabs — refresh resets to first tab | `cs/claims/[id]/index.vue` | Sync tab to URL |
| L-FE20 | `onUnmounted` called inside `onMounted` — unconventional pattern | `cs/index.vue` | Move ke top level |
| L-FE21 | Modal close buttons `tabindex="-1"` — keyboard unreachable | `cs/index.vue` | Remove `tabindex` |
| L-FE22 | No debounce on search inputs in several pages | Multiple pages | Tambah 250ms debounce |
| L-FE23 | `dashboard/reports.vue` bidirectional watch pattern (route ↔ tab) | `reports.vue` | Single source of truth |
| L-FE24 | `StatsCard` operator precedence bug in trend color logic | `StatsCard.vue` | Tambah parentheses |
| L-FE25 | `AnalyticsChart` `LineChart` not explicitly imported — relies on auto-import | `AnalyticsChart.vue` | Verify auto-import |
| L-FE26 | Sidebar width inconsistency: cs=`w-80`(320px), dashboard=`w-[360px]` | Both layouts | Dokumentasikan |
| L-FE27 | Report pages: `vendorColors` hardcodes 3 vendors — new vendors render as white | `reports/index.vue` | Dynamic color generation |
| L-FE28 | `cs/claims/index.vue` unscoped `<style>` leaks scrollbar styles | `cs/claims/index.vue` | Add `scoped` |
| L-FE29 | No sign-out confirmation dialog | Both layouts | Add confirmation |
| L-FE30 | `dashboard/claims/index.vue` native `<select>` and `<input type="date">` instead of Nuxt UI | `dashboard/claims/index.vue` | Use Nuxt UI components |
| L-FE31 | `MOCK_CLAIM_HISTORY` uses invalid `'REJECT'` action for claim status transition | `mock-data.ts` | Fix to `'REQUEST_REVISION'` |
| L-FE32 | `useDashboardStore`: `DEFAULT_INITIAL_PASSWORD` in client bundle | `useDashboardStore.ts` | Dynamic import inside dev guard |
| L-FE33 | `cs/profile.vue` avatar accepts all images but `accept` filters only png/jpeg/webp | `cs/profile.vue` | Align accept + validation |

### 6.20 Issue Summary (Section 6 Only)

| Severity | Count |
|---|---|
| CRITICAL | 15 |
| HIGH | 31 |
| MEDIUM | 46 |
| LOW | 33 |
| **Total** | **125** |

---

## 7. Auth Flow

> **STATUS: SELESAI** — End-to-end review dari login hingga protected routes.

### 7.1 Architecture Overview

Sistem punya **dua mekanisme auth paralel yang TIDAK terintegrasi**:

1. **Client-side (mock)**: `app/composables/useAuthSession.ts` — cookie-based mock auth dengan hardcoded users
2. **Server-side (real)**: Better-Auth setup di `server/utils/auth-config.ts` dengan Drizzle + SQLite

```
BROWSER                              SERVER
───────                              ──────

┌───────────┐
│ /login    │
│ login.vue │
└─────┬─────┘
      │ onSubmit()
      ▼
┌──────────────────┐   MOCK: setTimeout + hardcoded users
│ useAuthSession() │──────────────────────────┐
│ login()          │                          │ Sets cookie 'auth-session'
└────────┬─────────┘                          │ {user, token: 'mock-*'}
         │ navigateTo(getLandingPage())       ▼
         ▼
┌─────────────────────┐
│ auth.global.ts      │  Reads cookie 'auth-session'
│ (client middleware)  │  Checks session for route access
└─────────┬───────────┘
          ▼
┌──────────────────┐  fetch('/api/...')  ┌──────────────────────────┐
│ Page component   │ ──────────────────► │ server/middleware/auth.ts │
│                  │                     │ Uses Better-Auth session  │
│                  │                     │ auth.api.getSession()     │
└──────────────────┘                     └────────────┬─────────────┘
                                                      ▼
                                         ┌──────────────────────────┐
                                         │ API Route Handler         │
                                         │ requireAuth(event)        │
                                         │ requireRole(event, [...]) │
                                         └──────────────────────────┘

═══════════════════════════════════════════════════════════════
CONNECTED: Login/logout flow sekarang memakai Better-Auth endpoints
(`POST /api/auth/sign-in` dan `POST /api/auth/sign-out`).
Client dan server session state sekarang sinkron.
═══════════════════════════════════════════════════════════════
```

### 7.2 Login Flow Detail

- `app/pages/login.vue`: Zod validation + `UAuthForm` dari Nuxt UI
- `onSubmit()` calls `useAuthSession().login(username, password)`
- `login()` call real endpoint `POST /api/auth/sign-in` lalu refresh session dari `/api/auth/session`
- Session state di client berasal dari response Better-Auth (bukan mock cookie custom)
- Login page sudah memakai alur auth server yang sama dengan API protected routes

### 7.3 Session Management

- **Client**: state auth dihydrate dari `GET /api/auth/session` via `useAsyncData`
- **Server**: Better-Auth dengan Drizzle adapter, session expiry 7 hari, rate limiting 5 attempts / 15 min, plugins: `username()` + `admin()`

### 7.4 Server Middleware Behavior

- `server/middleware/auth.ts`: Runs pada semua `/api/*` kecuali `/api/auth/*`
- Calls `auth.api.getSession({ headers })` via Better-Auth
- **Jika tidak ada session: sets `event.context.auth = null` dan RETURN** — tidak block request
- Setiap API route harus **sendiri** call `requireAuth()` atau `requireRole()` — opt-in security model

### 7.5 API Auth Audit

**52 dari 52 non-auth API routes protected.**

| Route | File |
|---|---|
| `GET /api/notifications/[code]` | `server/api/notifications/[code].get.ts` — `requireAuth(event)` |
| `GET /api/notifications/lookup/[code]` | `server/api/notifications/lookup/[code].get.ts` — `requireAuth(event)` |
| `GET /api/cs/notifications/[code]` | `server/api/cs/notifications/[code].get.ts` — `requireRole(event, ['CS'])` |

Bandingkan: `GET /api/cs/notifications/lookup/[code]` **sudah benar** pakai `requireRole(event, ['CS'])`.

### 7.6 Role-Based Access Control Matrix

| Resource Area | CS | QRCC | MGMT | ADMIN |
|---|---|---|---|---|
| CS Claims (own) | Yes | — | — | — |
| CS Notification Lookup | Yes | — | — | — |
| Claims Review | — | Yes | — | Yes |
| Vendor Claims | — | Yes | — | Yes |
| Reports | — | Yes | Yes | Yes |
| Audit Trail | — | Yes | — | Yes |
| Master Data (CRUD) | — | Yes | — | Yes |
| User Management | — | — | — | Yes |
| Settings (read) | Yes | Yes | Yes | Yes |
| Settings (write) | — | — | — | Yes |
| Profile (own) | Yes | Yes | Yes | Yes |

MANAGEMENT role hanya akses reports + profile/settings (read-only executive oversight, sesuai PRD).

### 7.7 Issues

#### CRITICAL

✅ **C-AUTH1. Dual Auth System — Client dan Server Disconnected** (DONE)
- **Files**: `app/composables/useAuthSession.ts` (line 22-41) vs `server/utils/auth-config.ts`
- Login page sebelumnya pakai mock function, tidak create real Better-Auth session. User bisa login di frontend tapi API protected endpoint akan 401.
- **Fix**: Replace mock `login()` dengan `$fetch('/api/auth/sign-in', { ... })`.
- **Status implementasi**:
  - `login()` di `app/composables/useAuthSession.ts` sekarang call `POST /api/auth/sign-in`
  - Setelah login, flow refresh session via `/api/auth/session` agar state client sinkron

✅ **C-AUTH2. Logout Tidak Invalidate Server Session** (DONE)
- **File**: `app/composables/useAuthSession.ts` (line 44-47)
- `logout()` sebelumnya hanya clear state client. Server session tetap valid jika tidak sign-out ke Better-Auth.
- **Fix**: Call `/api/auth/sign-out` sebelum clear state.
- **Status implementasi**:
  - `logout()` di `app/composables/useAuthSession.ts` sekarang call `POST /api/auth/sign-out`
  - Setelah sign-out, state auth di-reset lalu refresh session dilakukan untuk sinkronisasi

✅ **C-AUTH3. 3 Notification Endpoints Tanpa Auth** (DONE)
- **Files**: lihat tabel di 7.5
- Ketiga route sebelumnya tidak memanggil guard auth di handler.
- **Fix**: Tambah `requireAuth()` atau `requireRole()` di ketiga endpoint.
- **Status implementasi**:
  - `server/api/notifications/[code].get.ts` sekarang call `requireAuth(event)`
  - `server/api/notifications/lookup/[code].get.ts` sekarang call `requireAuth(event)`
  - `server/api/cs/notifications/[code].get.ts` sekarang call `requireRole(event, ['CS'])`

#### HIGH

✅ **H-AUTH1. Server Middleware Tidak Block Unauthenticated Requests** (DONE)
- **File**: `server/middleware/auth.ts` (line 17-19)
- Middleware set `null` dan return — setiap new route default unprotected kecuali developer ingat tambah auth guard. Opt-in security model yang rawan human error.
- **Fix**: Middleware throw 401 untuk semua `/api/*` kecuali allowlist. Individual routes tambah role checks di atas.
- **Status implementasi**:
  - `server/middleware/auth.ts` sekarang default-deny untuk `/api/*` tanpa session
  - Public auth route `/api/auth/*` tetap bypass auth middleware
  - Ditambahkan allowlist public route (`/api/health`, `/api/public`)

✅ **H-AUTH2. Role Type Mismatch Client vs Server** (DONE)
- Client `AuthUser`: `role: 'CS' | 'QRCC' | 'MANAGEMENT' | 'ADMIN'` (required)
- Server `AuthUser`: `role?: UserRole` (optional)
- 3 definisi terpisah: `useAuthSession.ts`, `server/utils/auth.ts`, `server/types/h3.d.ts`
- **Fix**: Buat single canonical `AuthUser` type di `shared/types/`.
- **Status implementasi**:
  - Dibuat canonical type `shared/types/auth.ts`
  - `useAuthSession.ts`, `server/utils/auth.ts`, dan `server/types/h3.d.ts` sudah memakai source type yang sama
  - Service layer (`claim`, `claim-review`, `vendor-claim`) juga align ke `shared/types/auth`

✅ **H-AUTH3. Dev Role Switcher di Dashboard Layout** (DONE)
- **File**: `app/layouts/dashboard.vue` (line 274-294)
- UI untuk switch role client-side. Comment: "hapus sebelum production".
- **Fix**: Gate behind `import.meta.dev` atau hapus.
- **Status implementasi**:
  - Role switcher block di `app/layouts/dashboard.vue` sudah dihapus
  - Destructuring `switchRole` dan watch sync role dev juga sudah dihapus dari script setup

✅ **H-AUTH4. Default Password di Shared Constants (Client-Visible)** (DONE)
- **File**: `shared/utils/constants.ts` line 168: `DEFAULT_INITIAL_PASSWORD = 'sharp1234'`
- Shared directory = masuk client bundle. Siapapun yang inspect JS bisa lihat.
- **Fix**: Pindahkan ke server-only (`server/utils/`) dan implement forced password change on first login.
- **Status implementasi**:
  - `DEFAULT_INITIAL_PASSWORD` dipindahkan dari `shared/utils/constants.ts` ke `server/utils/constants.ts`
  - Import client-side dari `useDashboardStore` sudah dihapus
  - Literal `sharp1234` di halaman users dashboard dihilangkan agar tidak masuk bundle client

#### MEDIUM

✅ **M-AUTH1. Settings GET Terlalu Permissive** (DONE)
- `GET /api/settings` pakai `requireAuth()` (any user) tapi `PUT /api/settings` pakai `requireRole(['ADMIN'])`.
- **Fix**: Restrict GET ke `['ADMIN']` atau buat endpoint terpisah untuk public settings subset.

**M-AUTH2. Change Password Page Mock**
- **File**: `app/pages/dashboard/settings/security.vue` (line 73-92)
- `submitPassword()` pakai `setTimeout` — tidak call `POST /api/auth/change-password`.
- **Fix**: Wire ke real API.

**M-AUTH3. Session Cookie Tidak httpOnly**
- `useCookie('auth-session')` — client-readable, no httpOnly/secure/sameSite flags.
- **Fix**: Biarkan Better-Auth manage session cookie sendiri (httpOnly, secure). `useAuthSession` hanya untuk display data.

**✅ M-AUTH4 (DONE). Deactivated Users Masih Bisa Akses**
- `requireAuth()` dan middleware tidak cek `isActive` flag. User yang di-deactivate via admin masih bisa akses sampai session expire.
- **Fix**: Tambah `isActive` check di `requireAuth()`. Revoke sessions saat deactivation.

**M-AUTH5. Tidak Ada CSRF Protection Visible**
- Tidak ada explicit CSRF token generation/validation. Better-Auth mungkin handle internally tapi tidak terkonfirmasi.
- **Fix**: Verifikasi config Better-Auth atau tambah CSRF middleware.

#### LOW

**L-AUTH1.** "Ingat Sesi" checkbox di login tidak efek — `remember` parameter diabaikan, cookie selalu 7 hari.
**L-AUTH2.** Duplicate `AuthUser` interface di 3 file — akan drift seiring waktu.
**L-AUTH3.** `useDashboardStore` punya redundant `_mockUsers` yang duplikat dari `useAuthSession`.
**L-AUTH4.** "Lupa Password?" link di login page non-functional — no href, no click handler.
**L-AUTH5.** Root page `/` redirect via `onMounted()` (client-only) — flash loading screen sebelum redirect.

### 7.8 Security Summary

| Category | Status |
|---|---|
| Authentication | **GOOD** — login/logout memakai Better-Auth endpoints |
| Session Storage | **GOOD** — client state sync dengan server session |
| Server Route Protection | **GOOD** — 52/52 non-auth routes protected |
| Unprotected Routes | **0 GAPS** |
| Role Enforcement (server) | **GOOD** — consistent `requireRole()` |
| Role Enforcement (client) | **BASIC** — hanya CS vs non-CS routing |
| Logout | **GOOD** — sign-out invalidate server session |
| Account Deactivation | **INCOMPLETE** — no session revocation |
| Password Management | **MOCK** — change password UI tidak call API |
| Rate Limiting | **GOOD** — 5 attempts / 15 min via Better-Auth |
| Type Safety | **GOOD** — AuthUser sudah canonical di shared types |
| CSRF | **UNCLEAR** — no explicit config visible |
| Default Credentials | **MITIGATED** — tidak ada default password di bundle client |

---

## 8. Temuan Prioritas & Rekomendasi

### Urutan Kerja (Task Sequence)

> Fokus section ini: **urutan eksekusi** biar implementasi tidak loncat-loncat. Detail lengkap tiap temuan tetap ada di section 2-7.

#### Cara Cari Cepat Temuan

- Gunakan fitur search dengan kata kunci setelah `Cari:` di tiap item.
- Format identifikasi sekarang: `DOMAIN_TOPIK` (bukan `C6/H32` lagi).
- Contoh: cari `AUTH_UNPROTECTED_NOTIFICATION_ENDPOINTS` atau frasa di kolom `Cari:`.

#### Index Temuan (ID Baru -> Kata Kunci -> Lokasi Detail)

| ID Baru | Kata Kunci Search | Lokasi Detail |
|---|---|---|
| `AUTH_UNPROTECTED_NOTIFICATION_ENDPOINTS` | `3 notification endpoints tanpa auth` | Section 7.5 / 7.7 | ✅
| `AUTH_LAZY_SESSION_RACE` | `Race condition: lazy auth session` | Section 6.12 | ✅
| `AUTH_ADMIN_ROUTE_GUARD_MISSING` | `No auth middleware pada admin pages` | Section 6.19 (CRITICAL table) | ✅
| `AUTH_SERVER_HARDENING` | `Server middleware tidak block unauthenticated requests` | Section 7.7 (HIGH/MEDIUM) | ✅
| `FRONTEND_MISSING_LAYOUT_META` | `2 pages missing definePageMeta` | Section 6.11 | ✅ 
| `FRONTEND_DETAIL_PAGE_GUARDS` | `Dashboard claims/[id] no 404 handling` | Section 6.19 (CRITICAL table) | ✅
| `FRONTEND_CS_CREATE_BLOCKERS` | `photo uploads via JSON body` | Section 6.19 (CRITICAL table) | ✅
| `FRONTEND_REPORT_FILTER_EXPORT_BLOCKERS` | `Report filters non-functional` | Section 6.14 | ✅
| `API_WIRING_REPORTS` | `9 server /api/reports/ routes exist tapi tidak dipakai` | Section 6.2 / 6.19 |
| `API_WIRING_VENDOR_CLAIMS` | `Vendor-claims pages 100% mock` | Section 6.2 / 6.19 |
| `API_WIRING_MASTER_DATA` | `Master data pages 100% mock` | Section 6.2 / 6.19 |
| `API_WIRING_USERS_SETTINGS_PROFILE` | `Create user modal tanpa form validation` | Section 6.19 |
| `BACKEND_OBSERVABILITY_STARTUP` | `Tidak ada logging di service layer` | Section 5.3 (MEDIUM) |
| `BACKEND_REPO_CONSISTENCY` | `3 master repos tidak support transaction` | Section 5.3 (MEDIUM) |
| `BACKEND_SERVICE_CORRECTNESS` | `createClaimPayload inline type` | Section 5.3 (MEDIUM) |
| `BACKEND_API_CONTRACT_STANDARDIZATION` | `Response format tidak 100% konsisten` | Section 5.3 (MEDIUM) |
| `TYPE_SINGLE_SOURCE_OF_TRUTH` | `Duplikasi type definitions antara 3 lokasi` | Section 6.8 |
| `TYPE_AUTH_CANONICAL_ALIGNMENT` | `Role type mismatch & 3x duplicate AuthUser` | Section 7.7 (HIGH) |
| `TYPE_STORE_COMPOSABLE_STRICTNESS` | `useCsStore.currentUser non-reactive` | Section 6.4 / 6.19 |
| `UI_STATUS_COLOR_CONSISTENCY` | `Status color mismatch antar halaman` | Section 6.9 |
| `UI_ACCESSIBILITY_BASELINE` | `0 ARIA attributes di semua 20 components` | Section 6.16 / 6.19 |
| `UI_LOADING_ERROR_COVERAGE` | `no loading/error state` | Section 6.13 |
| `FRONTEND_DEAD_CODE_REMOVAL` | `4 unused components` | Section 6.5 |
| `FRONTEND_DUPLICATION_REDUCTION` | `duplicated` | Section 6.17 |
| `FRONTEND_QUALITY_OF_LIFE_FIXES` | `No useSeoMeta/useHead on any page` | Section 6.19 (MEDIUM) |
| `CONFIG_AND_MINOR_BACKEND_POLISH` | `Tidak ada runtimeConfig` | Section 3.1 / 8 MEDIUM |
| `MINOR_FRONTEND_POLISH` | `#### LOW` | Section 6.19 (LOW table) |
| `ARCHITECTURE_DECISION_LOG` | `accept risk` | Section 8 (buat decision log baru) |

#### Phase 0 — Foundation & Security Baseline (paling dulu)

1. ✅ **AUTH_UNPROTECTED_NOTIFICATION_ENDPOINTS** — tutup 3 endpoint notification tanpa auth. `Cari: 3 notification endpoints tanpa auth`
2. ✅ **AUTH_LAZY_SESSION_RACE** — stabilkan race condition `lazy: true` di auth middleware flow. `Cari: Race condition: lazy auth session`
3. ✅ **AUTH_ADMIN_ROUTE_GUARD_MISSING** — pastikan route admin/master terproteksi middleware. `Cari: No auth middleware pada admin pages`
4. ✅ **AUTH_SERVER_HARDENING** — default deny middleware + deactivated user check + verifikasi CSRF. `Cari: Server middleware tidak block unauthenticated requests`

#### Phase 1 — Core UX Blockers (yang bikin user salah alur)

1. ✅**FRONTEND_MISSING_LAYOUT_META** — perbaiki halaman tanpa `definePageMeta`. `Cari: 2 pages missing definePageMeta`
2. ✅**FRONTEND_DETAIL_PAGE_GUARDS** — 404 handling dashboard claims detail + error state profile CS. `Cari: Dashboard claims/[id] no 404 handling`
3. ✅**FRONTEND_CS_CREATE_BLOCKERS** — declaration checkbox binding + upload file via `FormData`. `Cari: photo uploads via JSON body`
4. ✅**FRONTEND_REPORT_FILTER_EXPORT_BLOCKERS** — filter report inert + endpoint export tidak ada. `Cari: Report filters non-functional`

#### Phase 2 — Wiring Real API (kurangi mock terbesar dulu)

1. **API_WIRING_REPORTS** — sambungkan 7 report pages ke `/api/reports/*`, termasuk export & pagination. `Cari: 9 server /api/reports/ routes exist tapi tidak dipakai`
2. **API_WIRING_VENDOR_CLAIMS** — hilangkan mock vendor-claims index/create/detail + fallback 404. `Cari: Vendor-claims pages 100% mock`
3. **API_WIRING_MASTER_DATA** — hilangkan mock master vendor/model/notification/defect + validasi duplicate + loading state terpisah. `Cari: Master data pages 100% mock`
4. **API_WIRING_USERS_SETTINGS_PROFILE** — wire user create validation + profile/settings/security ke API real. `Cari: Create user modal tanpa form validation`

#### Phase 3 — Backend Consistency & Reliability

1. **BACKEND_OBSERVABILITY_STARTUP** — logging service, await PRAGMA FK, startup plugin validation. `Cari: Tidak ada logging di service layer`
2. **BACKEND_REPO_CONSISTENCY** — tx support, explicit return types, query strategy large batch, relation completeness. `Cari: 3 master repos tidak support transaction`
3. **BACKEND_SERVICE_CORRECTNESS** — zod re-validation service, uniqueness check update model, batch lookup import Excel. `Cari: createClaimPayload inline type`
4. **BACKEND_API_CONTRACT_STANDARDIZATION** — response envelope dan shared zod schemas API handler. `Cari: Response format tidak 100% konsisten`

#### Phase 4 — Type System Consolidation

1. **TYPE_SINGLE_SOURCE_OF_TRUTH** — satukan types shared/app/fixtures dan buang loose string unions. `Cari: Duplikasi type definitions antara 3 lokasi`
2. **TYPE_AUTH_CANONICAL_ALIGNMENT** — 1 definisi `AuthUser` lintas client/server. `Cari: Role type mismatch & 3x duplicate AuthUser`
3. **TYPE_STORE_COMPOSABLE_STRICTNESS** — rapikan cast unsafe + reactive source + state ambiguity. `Cari: useCsStore.currentUser non-reactive`

#### Phase 5 — Design System & Accessibility

1. **UI_STATUS_COLOR_CONSISTENCY** — sinkronkan status color mapping lintas page/config. `Cari: Status color mismatch antar halaman`
2. **UI_ACCESSIBILITY_BASELINE** — ARIA minimum, focus trap modal, keyboard access dropzone, semantic component fixes. `Cari: 0 ARIA attributes di semua 20 components`
3. **UI_LOADING_ERROR_COVERAGE** — tambah loading/error state yang hilang di page prioritas. `Cari: no loading/error state`

#### Phase 6 — Frontend Cleanup & Maintainability

1. **FRONTEND_DEAD_CODE_REMOVAL** — hapus komponen/markup tidak terpakai + code path kosong. `Cari: 4 unused components`
2. **FRONTEND_DUPLICATION_REDUCTION** — extract pattern berulang (clock, modal/sidebar, page jumbo). `Cari: duplicated`
3. **FRONTEND_QUALITY_OF_LIFE_FIXES** — SEO meta, debounce search, confirm dialog, avatar fallback, shortcut platform mismatch. `Cari: No useSeoMeta/useHead on any page`

#### Phase 7 — Low Priority / Finishing

1. **CONFIG_AND_MINOR_BACKEND_POLISH** — runtimeConfig, constants hygiene, schema/index minor, seed robustness. `Cari: Tidak ada runtimeConfig`
2. **MINOR_FRONTEND_POLISH** — selesaikan sisa temuan LOW yang user-facing.
3. **ARCHITECTURE_DECISION_LOG** — dokumentasikan item yang sengaja di-accept risk.

### Backlog Done (sudah beres)

- Tetap refer ke tag `(DONE)` yang sudah tersebar di section 2-7.
- Item prioritas yang sudah confirmed selesai:
  - `SHARED_TRANSACTION_TYPES_ADDED`
  - `.env.example` dibuat
  - `AUTH_CLIENT_SERVER_SESSION_CONNECTED`
  - `AUTH_LOGOUT_INVALIDATES_SERVER_SESSION`
  - `AUTH_UNPROTECTED_NOTIFICATION_ENDPOINTS`
  - `AUTH_LAZY_SESSION_RACE`
  - `API_ERROR_HANDLING_STANDARDIZED`
  - `REPORT_REPO_BUSINESS_LOGIC_MOVED_TO_SERVICE`
  - `BUILD_HISTORY_SHARED_UTIL_EXTRACTED`
  - `AUTHUSER_CANONICAL_TYPE_ADOPTED`
  - `CLAIM_MODEL_VENDOR_RESOLUTION_NO_HARDCODE`

---

### Issue Summary

| Severity | Count |
|---|---|
| CRITICAL | 19 |
| HIGH | 45 |
| MEDIUM | 67 |
| LOW | 59 |
| **Total** | **190** |

---

## TODO — Lanjutan Review

Semua area utama sudah di-review:

- [x] **Database schema review** — 18 issues ditemukan (0 critical, 4 high, 7 medium, 7 low)
- [x] **Auth flow review** — 3 CRITICAL, 4 HIGH, 5 MEDIUM, 5 LOW. Dual auth system = blocker utama.
- [x] **Frontend full review** — 15 CRITICAL, 31 HIGH, 46 MEDIUM, 33 LOW. 23 pages masih 100% mock.
- [x] **Backend full review** — 0 CRITICAL, 7 HIGH, 13 MEDIUM, 10 LOW. Architecture solid, inconsistencies in error handling & patterns.
  - Cek pattern consistency repo -> service -> handler ✅
  - Cek error handling di setiap layer ✅
  - Cek Zod validation di setiap handler ✅
  - Cek response format consistency (`{ success: true, data, pagination? }`) ✅
- [ ] **Cross-cutting concerns**: Error handling consistency, loading states, type safety across layers
