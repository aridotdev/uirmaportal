# TASK-BACKEND.MD — Rencana Teknis Backend uirmaportal

> **Versi**: 1.0 | **Tanggal**: 8 Apr 2026
> **Target Stack**: Nuxt 4.4.2, SQLite (libsql), Drizzle ORM 0.45+, Zod 4.3+, TypeScript strict
> **Status Saat Ini**: Frontend prototype selesai. Backend masih dominan mock data. Implementasi **Fase 0** sudah berjalan untuk Task 0.1, 0.2, 0.3, 0.4; Task 0.5 ditunda karena subpath `drizzle-orm/zod` belum tersedia di `drizzle-orm@0.45.1`.

---

## DAFTAR ISI

1. [Arsitektur & Separation of Concern](#1-arsitektur--separation-of-concern)
2. [Konvensi & Aturan Wajib](#2-konvensi--aturan-wajib)
3. [Fase 0 — Infrastruktur & Setup](#3-fase-0--infrastruktur--setup)
4. [Fase 1 — Master Data CRUD](#4-fase-1--master-data-crud)
5. [Fase 2 — Auth (Better-Auth)](#5-fase-2--auth-better-auth)
6. [Fase 3 — Claim Lifecycle (CS + QRCC)](#6-fase-3--claim-lifecycle-cs--qrcc)
7. [Fase 4 — Vendor Claim Batching](#7-fase-4--vendor-claim-batching)
8. [Fase 5 — Reports & Analytics API](#8-fase-5--reports--analytics-api)
9. [Fase 6 — Audit Trail & Settings](#9-fase-6--audit-trail--settings)
10. [Peta File Lengkap](#10-peta-file-lengkap)
11. [Checklist Validasi per Task](#11-checklist-validasi-per-task)
12. [Catatan Migrasi drizzle-zod](#12-catatan-migrasi-drizzle-zod)
13. [Referensi Quick-Lookup](#13-referensi-quick-lookup)

---

## 1. Arsitektur & Separation of Concern

### 1.1 Tiga Layer Wajib

```
┌─────────────────────────────────────────────────┐
│  API Route  (server/api/*.ts)                   │
│  Tanggung Jawab:                                │
│    - HTTP request/response handling             │
│    - Auth check (verify session, cek role)      │
│    - Validasi input (Zod parse body/query/param)│
│    - Return JSON response / throw createError   │
│  TIDAK BOLEH:                                   │
│    - Business logic                             │
│    - Query database langsung                    │
│    - Import db / drizzle                        │
├─────────────────────────────────────────────────┤
│  Service  (server/services/*.service.ts)        │
│  Tanggung Jawab:                                │
│    - Business logic & validasi bisnis           │
│    - Koordinasi antar repository                │
│    - Compute fiscal period, generate nomor, dll │
│    - Transaction orchestration                  │
│  TIDAK BOLEH:                                   │
│    - Query database langsung (pakai repository) │
│    - Akses HTTP request/event                   │
│    - Import h3 functions                        │
├─────────────────────────────────────────────────┤
│  Repository  (server/repositories/*.repo.ts)    │
│  Tanggung Jawab:                                │
│    - CRUD operasi database via Drizzle ORM      │
│    - Query building (filter, join, pagination)  │
│    - Return raw data dari database              │
│  TIDAK BOLEH:                                   │
│    - Business logic / validasi bisnis           │
│    - Auth check                                 │
│    - Throw HTTP errors                          │
└─────────────────────────────────────────────────┘
```

### 1.2 Alur Data (contoh Create Claim)

```
[Client POST /api/cs/claims]
  │
  ▼
API Route (server/api/cs/claims/index.post.ts)
  │  1. getValidatedRouterParams / readValidatedBody (Zod)
  │  2. Ambil session user dari event.context.auth
  │  3. Cek role === 'CS'
  │  4. Panggil claimService.createClaim(validatedData, user)
  │
  ▼
Service (server/services/claim.service.ts)
  │  1. Lookup notification via notificationRepo
  │  2. Compute fiscal period via getFiscalPeriodInfo()
  │  3. Generate claim number via sequenceService
  │  4. Panggil claimRepo.insert(claimData) dalam transaction
  │  5. Panggil claimHistoryRepo.insert(historyData)
  │  6. Return claim yang baru dibuat
  │
  ▼
Repository (server/repositories/claim.repo.ts)
  │  1. db.insert(claim).values(data).returning()
  │  2. Return raw row
  │
  ▼
[Response: { success: true, data: ClaimObject }]
```

### 1.3 Import Rules

```typescript
// API Route boleh import:
import { claimService } from '#server/services/claim.service'
import { insertClaimSchema } from '#server/database/schema'

// Service boleh import:
import { claimRepo } from '#server/repositories/claim.repo'
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'
import db from '#server/database'  // hanya untuk db.transaction()

// Repository boleh import:
import db from '#server/database'
import { claim, vendor } from '#server/database/schema'
import { eq, and, like, desc, sql } from 'drizzle-orm'
```

> **Catatan**: `#server` adalah alias bawaan Nuxt 4 untuk folder `server/`. Gunakan ini untuk import antar file di dalam server directory.

---

## 2. Konvensi & Aturan Wajib

### 2.1 Naming Conventions

| Item | Convention | Contoh |
|------|-----------|--------|
| File API route | kebab-case + HTTP suffix | `index.get.ts`, `[id].put.ts` |
| File service | kebab-case + `.service.ts` | `claim.service.ts` |
| File repository | kebab-case + `.repo.ts` | `claim.repo.ts` |
| Exported function (service) | camelCase | `createClaim()`, `getClaimById()` |
| Exported function (repo) | camelCase | `findById()`, `findAll()`, `insert()` |
| Zod schema var | camelCase + `Schema` suffix | `insertClaimSchema` |
| Type | PascalCase | `Claim`, `InsertClaim` |

### 2.2 Response Format Standar

Semua API response WAJIB mengikuti kontrak `ApiResponse<T>` dan `PaginatedResponse<T>` yang sudah didefinisikan di `shared/types/database.ts`.

```typescript
// Success (single)
{ success: true, data: { id: 1, ... } }

// Success (list + pagination)
{
  success: true,
  data: [...],
  pagination: { page: 1, limit: 20, total: 100, totalPages: 5 }
}

// Error
{ success: false, error: 'Validation failed', message: 'Detail...' }
```

### 2.3 Error Handling Pattern

```typescript
// API Route — gunakan createError dari h3
throw createError({ statusCode: 400, statusMessage: 'Invalid input' })
throw createError({ statusCode: 404, statusMessage: 'Claim not found' })
throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

// Service — throw plain Error, API route tangkap & convert ke createError
throw new Error('CLAIM_NOT_FOUND')
throw new Error('INVALID_STATUS_TRANSITION')
throw new Error('NOTIFICATION_ALREADY_USED')
```

**Pattern di API Route:**

```typescript
export default defineEventHandler(async (event) => {
  // 1. Auth check
  // 2. Validate input
  // 3. Call service
  try {
    const result = await claimService.createClaim(data, user)
    return { success: true, data: result }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message === 'CLAIM_NOT_FOUND') {
      throw createError({ statusCode: 404, statusMessage: 'Claim not found' })
    }
    if (message === 'INVALID_STATUS_TRANSITION') {
      throw createError({ statusCode: 422, statusMessage: message })
    }

    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
```

### 2.4 Pagination Defaults

```typescript
const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
```

### 2.5 Zod Validation di API Route

Gunakan `getValidatedQuery` dan `readValidatedBody` dari h3 untuk runtime + type safety:

```typescript
// Query params (GET request)
const query = await getValidatedQuery(event, z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(CLAIM_STATUSES).optional()
}).parse)

// Body (POST/PUT request)
const body = await readValidatedBody(event, insertClaimSchema.parse)

// Route params
const id = await getValidatedRouterParams(event, z.object({
  id: z.coerce.number().int().positive()
}).parse).then(p => p.id)
```

### 2.6 Auth Middleware (Placeholder)

Sampai Better-Auth diimplementasikan, buat utility sementara:

```typescript
// server/utils/auth.ts
import type { H3Event } from 'h3'
import type { UserRole } from '~~/shared/utils/constants'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  branch: string
}

/**
 * Ambil user dari session. Throw 401 jika tidak ada session.
 * TODO: Ganti dengan Better-Auth session check.
 */
export function requireAuth(event: H3Event): AuthUser {
  const user = event.context.auth?.user as AuthUser | undefined
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

/**
 * Cek apakah user punya salah satu role yang diizinkan.
 */
export function requireRole(event: H3Event, allowedRoles: UserRole[]): AuthUser {
  const user = requireAuth(event)
  if (!allowedRoles.includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
```

---

## 3. Fase 0 -- Infrastruktur & Setup

### Task 0.1: Buat Folder Structure

```
server/
├── api/                          # (sudah ada, perlu refactor)
├── database/
│   ├── index.ts                  # (sudah ada) — DB connection
│   ├── schema/                   # (sudah ada) — 12 schema files
│   └── migrations/               # (output drizzle-kit generate)
├── middleware/
│   └── auth.ts                   # Server middleware inject auth ke context
├── plugins/
│   └── database.ts               # Nitro plugin: migrate on start (optional)
├── repositories/
│   ├── vendor.repo.ts
│   ├── product-model.repo.ts
│   ├── defect.repo.ts
│   ├── notification.repo.ts
│   ├── claim.repo.ts
│   ├── claim-photo.repo.ts
│   ├── claim-history.repo.ts
│   ├── vendor-claim.repo.ts
│   ├── vendor-claim-item.repo.ts
│   ├── photo-review.repo.ts
│   ├── sequence.repo.ts
│   └── user.repo.ts
├── services/
│   ├── vendor.service.ts
│   ├── product-model.service.ts
│   ├── defect.service.ts
│   ├── notification.service.ts
│   ├── claim.service.ts
│   ├── claim-review.service.ts
│   ├── vendor-claim.service.ts
│   ├── sequence.service.ts
│   ├── report.service.ts
│   └── user.service.ts
└── utils/
    ├── auth.ts                   # requireAuth, requireRole helpers
    ├── pagination.ts             # Pagination helper functions
    └── error-codes.ts            # Centralized error code constants
```

### Task 0.2: Setup Database Migration

```bash
# Generate migration dari schema yang sudah ada
pnpm drizzle-kit generate

# Push schema ke SQLite (development)
pnpm drizzle-kit push
```

Tambahkan scripts ke `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx server/database/seed.ts"
  }
}
```

### Task 0.3: Buat Seed Script

File: `server/database/seed.ts`

Seed data minimal untuk development:
- 3 vendor (MOKA, MTC, SDP) sesuai `INITIAL_VENDORS` di constants
- 5 product model
- 7 defect master
- 25 notification master
- 4 user (1 per role: CS, QRCC, MANAGEMENT, ADMIN)

> Gunakan data dari `server/utils/notification-data.ts` dan `server/utils/claim-data.ts` yang sudah ada sebagai referensi value.

### Task 0.4: Buat Utility Files

#### `server/utils/pagination.ts`

```typescript
import { z } from 'zod'

export const DEFAULT_PAGE = 1
export const DEFAULT_LIMIT = 20
export const MAX_LIMIT = 100

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT)
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export function calcOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

export function buildPaginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}
```

#### `server/utils/error-codes.ts`

```typescript
export const ErrorCode = {
  // Generic
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Claim
  CLAIM_NOT_FOUND: 'CLAIM_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  CLAIM_NOT_EDITABLE: 'CLAIM_NOT_EDITABLE',
  CLAIM_ALREADY_IN_VENDOR_BATCH: 'CLAIM_ALREADY_IN_VENDOR_BATCH',

  // Notification
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  NOTIFICATION_ALREADY_USED: 'NOTIFICATION_ALREADY_USED',
  NOTIFICATION_CODE_EXISTS: 'NOTIFICATION_CODE_EXISTS',

  // Vendor
  VENDOR_CODE_EXISTS: 'VENDOR_CODE_EXISTS',
  VENDOR_HAS_DEPENDENCIES: 'VENDOR_HAS_DEPENDENCIES',

  // Photo
  PHOTO_NOT_FOUND: 'PHOTO_NOT_FOUND',
  PHOTO_ALREADY_REVIEWED: 'PHOTO_ALREADY_REVIEWED',
  REQUIRED_PHOTOS_MISSING: 'REQUIRED_PHOTOS_MISSING',

  // Vendor Claim
  VENDOR_CLAIM_NOT_FOUND: 'VENDOR_CLAIM_NOT_FOUND',
  NO_APPROVED_CLAIMS_FOR_BATCH: 'NO_APPROVED_CLAIMS_FOR_BATCH',

  // Master Data
  DEFECT_CODE_EXISTS: 'DEFECT_CODE_EXISTS',
  MODEL_NAME_VENDOR_EXISTS: 'MODEL_NAME_VENDOR_EXISTS'
} as const

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode]
```

### Task 0.5: Migrasi Import dari `drizzle-zod` ke `drizzle-orm/zod`

> **PENTING**: Mulai `drizzle-orm@0.45`, `drizzle-zod` sudah deprecated. Fungsi `createInsertSchema`, `createSelectSchema` sekarang di-import dari `drizzle-orm/zod`.

Untuk setiap file di `server/database/schema/*.ts`, ganti:

```typescript
// SEBELUM (deprecated)
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

// SESUDAH (official)
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
```

Lalu update `package.json`:
- `drizzle-zod` bisa dihapus dari dependencies (opsional, karena masih backward-compatible).

**File yang perlu diupdate** (12 file):
1. `server/database/schema/auth.ts`
2. `server/database/schema/vendor.ts`
3. `server/database/schema/product-model.ts`
4. `server/database/schema/notification-master.ts`
5. `server/database/schema/defect-master.ts`
6. `server/database/schema/claim.ts`
7. `server/database/schema/claim-photo.ts`
8. `server/database/schema/claim-history.ts`
9. `server/database/schema/vendor-claim.ts`
10. `server/database/schema/vendor-claim-item.ts`
11. `server/database/schema/photo-review.ts`
12. `server/database/schema/sequence-generator.ts`

### Checklist Eksekusi Fase 0 (Aktual)

- [x] Task 0.1: Folder structure dibuat (`server/repositories`, `server/services`, `server/middleware`, `server/plugins`, `server/database/migrations`)
- [x] Task 0.2: Migration setup selesai (`db:generate`, `db:push`, script `db:seed` ditambahkan)
- [x] Task 0.3: Seed script dibuat di `server/database/seed.ts` (4 user, 3 vendor, 5 model, 7 defect, 25 notification)
- [x] Task 0.4: Utility files dibuat (`server/utils/auth.ts`, `server/utils/pagination.ts`, `server/utils/error-codes.ts`)
- [ ] Task 0.5: Migrasi ke `drizzle-orm/zod` (ditunda: belum tersedia pada `drizzle-orm@0.45.1`, masih menggunakan `drizzle-zod`)
- [x] `pnpm lint:fix` dijalankan
- [x] `pnpm typecheck` dijalankan (ada error pre-existing di `app/components/ImportExcelModal.vue` terkait type `xlsx`, bukan akibat Fase 0)

---

## 4. Fase 1 -- Master Data CRUD

### Prinsip Master Data

- Semua master data menggunakan **soft delete** (`isActive` flag), KECUALI `notificationMaster` yang menggunakan status (NEW/USED/EXPIRED).
- Setiap operasi insert/update wajib menyertakan `createdBy` / `updatedBy` (user ID).
- List endpoint selalu mendukung pagination + search.

---

### Task 1.1: Vendor CRUD

#### Repository: `server/repositories/vendor.repo.ts`

```typescript
// Fungsi yang perlu diimplementasi:
findAll(filter: { search?: string, isActive?: boolean, page: number, limit: number })
  // → query: SELECT *, COUNT(*) dengan filter name/code LIKE, isActive, LIMIT/OFFSET
findById(id: number)
  // → SELECT * FROM vendor WHERE id = ?
findByCode(code: string)
  // → SELECT * FROM vendor WHERE code = ?
insert(data: InsertVendor)
  // → db.insert(vendor).values(data).returning()
update(id: number, data: UpdateVendor)
  // → db.update(vendor).set(data).where(eq(vendor.id, id)).returning()
updateStatus(id: number, data: UpdateVendorStatus)
  // → db.update(vendor).set(data).where(eq(vendor.id, id)).returning()
countByFilter(filter: { search?: string, isActive?: boolean })
  // → SELECT COUNT(*) dengan filter
```

#### Service: `server/services/vendor.service.ts`

```typescript
getVendors(filter)
  // → panggil vendorRepo.findAll + vendorRepo.countByFilter
  // → return { items, pagination }

getVendorById(id: number)
  // → panggil vendorRepo.findById
  // → throw error jika tidak ditemukan

createVendor(data: InsertVendor)
  // → cek unique code via vendorRepo.findByCode
  // → throw VENDOR_CODE_EXISTS jika duplikat
  // → vendorRepo.insert(data)

updateVendor(id: number, data: UpdateVendor)
  // → pastikan vendor exists
  // → vendorRepo.update(id, data)

toggleVendorStatus(id: number, data: UpdateVendorStatus)
  // → pastikan vendor exists
  // → jika deactivate: cek tidak ada claim ACTIVE yg linked (opsional)
  // → vendorRepo.updateStatus(id, data)
```

#### API Routes:

| Method | Path | File | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/master/vendors` | `server/api/master/vendors/index.get.ts` | List vendors + pagination |
| GET | `/api/master/vendors/:id` | `server/api/master/vendors/[id].get.ts` | Get vendor by ID |
| POST | `/api/master/vendors` | `server/api/master/vendors/index.post.ts` | Create vendor |
| PUT | `/api/master/vendors/:id` | `server/api/master/vendors/[id].put.ts` | Update vendor |
| PATCH | `/api/master/vendors/:id/status` | `server/api/master/vendors/[id]/status.patch.ts` | Toggle active/inactive |

**Contoh implementasi GET list:**

```typescript
// server/api/master/vendors/index.get.ts
import { z } from 'zod'
import { VENDOR_CLAIM_STATUSES } from '~~/shared/utils/constants'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])

  const query = await getValidatedQuery(event, z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).transform(v => v === 'true').optional()
  }).parse)

  const result = await vendorService.getVendors(query)

  return {
    success: true,
    data: result.items,
    pagination: result.pagination
  }
})
```

**Contoh implementasi POST create:**

```typescript
// server/api/master/vendors/index.post.ts
export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['ADMIN', 'QRCC'])
  const body = await readValidatedBody(event, insertVendorSchema.parse)

  try {
    const created = await vendorService.createVendor({
      ...body,
      createdBy: user.id,
      updatedBy: user.id
    })
    setResponseStatus(event, 201)
    return { success: true, data: created }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message === 'VENDOR_CODE_EXISTS') {
      throw createError({ statusCode: 409, statusMessage: 'Vendor code already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Internal server error' })
  }
})
```

---

### Task 1.2: Product Model CRUD

#### Repository: `server/repositories/product-model.repo.ts`

```typescript
findAll(filter: { search?: string, vendorId?: number, isActive?: boolean, page, limit })
findById(id: number)
findByNameAndVendor(name: string, vendorId: number)
insert(data: InsertProductModel)
update(id: number, data: UpdateProductModel)
updateStatus(id: number, data: UpdateProductModelStatus)
countByFilter(filter)
```

#### Service: `server/services/product-model.service.ts`

```typescript
getProductModels(filter) → list + pagination
getProductModelById(id) → single, throw if not found
createProductModel(data) → cek unique (name + vendorId), insert
updateProductModel(id, data) → pastikan exists, update
toggleProductModelStatus(id, data) → pastikan exists, toggle
```

#### API Routes:

| Method | Path | File |
|--------|------|------|
| GET | `/api/master/product-models` | `server/api/master/product-models/index.get.ts` |
| GET | `/api/master/product-models/:id` | `server/api/master/product-models/[id].get.ts` |
| POST | `/api/master/product-models` | `server/api/master/product-models/index.post.ts` |
| PUT | `/api/master/product-models/:id` | `server/api/master/product-models/[id].put.ts` |
| PATCH | `/api/master/product-models/:id/status` | `server/api/master/product-models/[id]/status.patch.ts` |

---

### Task 1.3: Defect Master CRUD

#### Repository: `server/repositories/defect.repo.ts`

```typescript
findAll(filter: { search?: string, isActive?: boolean, page, limit })
findById(id: number)
findByCode(code: string)
insert(data: InsertDefectMaster)
update(id: number, data: UpdateDefectMaster)
updateStatus(id: number, data: UpdateDefectMasterStatus)
countByFilter(filter)
```

#### Service: `server/services/defect.service.ts`

```typescript
getDefects(filter) → list + pagination
getDefectById(id) → single, throw if not found
createDefect(data) → cek unique code, insert
updateDefect(id, data) → pastikan exists, update
toggleDefectStatus(id, data) → pastikan exists, toggle
```

#### API Routes:

| Method | Path | File |
|--------|------|------|
| GET | `/api/master/defects` | `server/api/master/defects/index.get.ts` |
| GET | `/api/master/defects/:id` | `server/api/master/defects/[id].get.ts` |
| POST | `/api/master/defects` | `server/api/master/defects/index.post.ts` |
| PUT | `/api/master/defects/:id` | `server/api/master/defects/[id].put.ts` |
| PATCH | `/api/master/defects/:id/status` | `server/api/master/defects/[id]/status.patch.ts` |

---

### Task 1.4: Notification Master CRUD + Import Excel

#### Repository: `server/repositories/notification.repo.ts`

```typescript
findAll(filter: { search?, vendorId?, status?, branch?, page, limit })
findById(id: number)
findByCode(code: string)
findByCodeWithRelations(code: string)
  // → JOIN product_model + vendor + defect_master (untuk notification lookup)
insert(data: InsertNotificationMaster)
insertMany(data: InsertNotificationMaster[])  // untuk bulk import Excel
update(id: number, data: UpdateNotificationMaster)
updateStatus(id: number, data: UpdateNotificationMasterStatus)
countByFilter(filter)
```

#### Service: `server/services/notification.service.ts`

```typescript
getNotifications(filter) → list + pagination
getNotificationById(id) → single, throw if not found
lookupByCode(code: string) → joined data (notification + model + vendor + defects)
  // Ini dipakai oleh CS saat create claim
createNotification(data) → cek unique code, compute fiscal fields, insert
updateNotification(id, data) → pastikan exists, update
updateNotificationStatus(id, data) → pastikan exists, update status
importFromExcel(rows: ExcelRow[], userId: string)
  // → validasi setiap row, compute fiscal fields
  // → pisahkan valid/invalid rows
  // → insertMany valid rows
  // → return { imported: number, failed: { row, reason }[] }
```

**Fiscal Fields Computation (wajib di service layer):**

```typescript
import { getFiscalPeriodInfo } from '~~/shared/utils/fiscal'

function computeFiscalFields(date: Date) {
  const info = getFiscalPeriodInfo(date)
  return {
    fiscalYear: info.fiscalYear,
    fiscalHalf: info.fiscalHalf,
    fiscalLabel: info.fiscalLabel,
    calendarYear: info.calendarYear,
    calendarMonth: info.calendarMonth
  }
}
```

#### API Routes:

| Method | Path | File |
|--------|------|------|
| GET | `/api/master/notifications` | `server/api/master/notifications/index.get.ts` |
| GET | `/api/master/notifications/:id` | `server/api/master/notifications/[id].get.ts` |
| GET | `/api/notifications/lookup/:code` | `server/api/notifications/lookup/[code].get.ts` |
| POST | `/api/master/notifications` | `server/api/master/notifications/index.post.ts` |
| POST | `/api/master/notifications/import` | `server/api/master/notifications/import.post.ts` |
| PUT | `/api/master/notifications/:id` | `server/api/master/notifications/[id].put.ts` |
| PATCH | `/api/master/notifications/:id/status` | `server/api/master/notifications/[id]/status.patch.ts` |

### Checklist Eksekusi Fase 1 (Aktual)

- [x] Task 1.1: Vendor CRUD selesai (`server/repositories/vendor.repo.ts`, `server/services/vendor.service.ts`, `server/api/master/vendors/*`)
- [x] Task 1.2: Product Model CRUD selesai (`server/repositories/product-model.repo.ts`, `server/services/product-model.service.ts`, `server/api/master/product-models/*`)
- [x] Task 1.3: Defect Master CRUD selesai (`server/repositories/defect.repo.ts`, `server/services/defect.service.ts`, `server/api/master/defects/*`)
- [x] Task 1.4: Notification Master CRUD + Import selesai (`server/repositories/notification.repo.ts`, `server/services/notification.service.ts`, `server/api/master/notifications/*`, `server/api/notifications/lookup/[code].get.ts`)
- [x] `pnpm lint:fix` dijalankan
- [ ] `pnpm typecheck` belum lolos (error pre-existing di `app/components/ImportExcelModal.vue` terkait module/type `xlsx`, bukan akibat Fase 1)

---

## 5. Fase 2 -- Auth (Better-Auth)

> **Catatan**: Fase ini bisa dikerjakan paralel dengan Fase 1. Better-Auth sudah ada di dependencies plan tapi belum installed.

### Task 2.1: Install & Configure Better-Auth

```bash
pnpm add better-auth
```

Konfigurasi dasar di `server/utils/auth-config.ts`:
- Provider: **username/password** (via Username Plugin)
- Plugin: **Admin** (untuk user management)
- Database adapter: Drizzle + SQLite (tabel `user`, `session`, `account`, `verification` sudah ada di schema)
- Session: cookie-based, 7 hari expiry (`DEFAULT_SESSION_EXPIRY_DAYS`)
- Password: hashed, lock after 5 failed attempts (`MAX_FAILED_LOGIN_ATTEMPTS`)

### Task 2.2: Auth API Routes

| Method | Path | Deskripsi |
|--------|------|-----------|
| POST | `/api/auth/sign-in` | Login via username + password |
| POST | `/api/auth/sign-out` | Logout, invalidate session |
| GET | `/api/auth/session` | Get current session / user info |
| POST | `/api/auth/change-password` | User ubah password sendiri |

### Task 2.3: Server Middleware untuk Auth

File: `server/middleware/auth.ts`

```typescript
// Server middleware yang jalan sebelum semua API route
// Baca session cookie → lookup session → inject user ke event.context.auth
// Jika session invalid/expired → event.context.auth = null
// Route-specific auth check dilakukan di masing-masing API route via requireAuth()
export default defineEventHandler(async (event) => {
  // Skip non-API routes
  if (!event.path.startsWith('/api/')) return

  // Skip auth endpoints themselves
  if (event.path.startsWith('/api/auth/')) return

  // Read session, inject to context
  // TODO: Implement with Better-Auth session verification
  event.context.auth = null // placeholder
})
```

### Task 2.4: User Management Service

#### Repository: `server/repositories/user.repo.ts`

```typescript
findAll(filter: { search?, role?, branch?, isActive?, page, limit })
findById(id: string)
findByEmail(email: string)
findByUsername(username: string)
update(id: string, data: UpdateUserBusiness)
updateStatus(id: string, data: UpdateUserStatus)
countByFilter(filter)
```

#### Service: `server/services/user.service.ts`

```typescript
getUsers(filter) → list + pagination (ADMIN only)
getUserById(id) → single (ADMIN only, atau self)
updateUserBusiness(id, data) → update role/branch (ADMIN only)
toggleUserStatus(id, data) → activate/deactivate (ADMIN only)
getProfile(userId) → get own profile data
updateProfile(userId, data) → update own name/email
```

#### API Routes:

| Method | Path | File | Role |
|--------|------|------|------|
| GET | `/api/users` | `server/api/users/index.get.ts` | ADMIN |
| GET | `/api/users/:id` | `server/api/users/[id].get.ts` | ADMIN / self |
| PUT | `/api/users/:id` | `server/api/users/[id].put.ts` | ADMIN |
| PATCH | `/api/users/:id/status` | `server/api/users/[id]/status.patch.ts` | ADMIN |
| GET | `/api/profile` | `server/api/profile/index.get.ts` | All roles |
| PUT | `/api/profile` | `server/api/profile/index.put.ts` | All roles |

### Checklist Eksekusi Fase 2 (Aktual)

- [x] Task 2.1: Install & konfigurasi Better-Auth selesai (`better-auth`, `@better-auth/drizzle-adapter`, `server/utils/auth-config.ts`)
- [x] Task 2.2: Auth API routes selesai (`server/api/auth/sign-in.post.ts`, `server/api/auth/sign-out.post.ts`, `server/api/auth/session.get.ts`, `server/api/auth/change-password.post.ts`)
- [x] Task 2.3: Server middleware auth selesai (`server/middleware/auth.ts`, `server/types/h3.d.ts`, update `server/utils/auth.ts`)
- [x] Task 2.4: User management service + API selesai (`server/repositories/user.repo.ts`, `server/services/user.service.ts`, `server/api/users/*`, `server/api/profile/*`)
- [x] `pnpm lint:fix` dijalankan
- [x] `pnpm typecheck` dijalankan

---

## 6. Fase 3 -- Claim Lifecycle (CS + QRCC)

### Status Flow Diagram

```
          CS                     QRCC
          ┌──────┐
          │DRAFT │ ◄─── CS saves draft
          └──┬───┘
             │ CS submit
          ┌──▼──────┐
          │SUBMITTED│
          └──┬──────┘
             │ QRCC opens claim (auto)
          ┌──▼───────┐
          │IN_REVIEW │
          └──┬───┬───┘
             │   │
    foto OK  │   │ ada foto REJECT
             │   │
          ┌──▼┐ ┌▼────────────┐
          │APP│ │NEED_REVISION │
          │ROV│ └──────┬───────┘
          │ED │        │ CS re-submit
          └─┬─┘   ┌───▼──────┐
            │     │SUBMITTED  │ (kembali ke atas)
            │     └───────────┘
            │
          ┌─▼──────┐
          │ARCHIVED│ ◄─── Manual archive
          └────────┘
```

**Valid status transitions:**

```typescript
const VALID_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  DRAFT: ['SUBMITTED', 'ARCHIVED'],
  SUBMITTED: ['IN_REVIEW', 'ARCHIVED'],
  IN_REVIEW: ['APPROVED', 'NEED_REVISION'],
  NEED_REVISION: ['SUBMITTED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED'],
  ARCHIVED: []  // terminal state
}
```

---

### Task 3.1: Sequence Number Generator

#### Repository: `server/repositories/sequence.repo.ts`

```typescript
findByTypeAndDate(type: SequenceType, currentDate: string)
upsertAndIncrement(type: SequenceType, currentDate: string)
  // → INSERT OR UPDATE, increment lastSequence, return new value
```

#### Service: `server/services/sequence.service.ts`

```typescript
generateClaimNumber(): Promise<string>
  // → Format: CLM-YYYY-NNNN (e.g. CLM-2026-0001)
  // → YYYY = tahun sekarang
  // → NNNN = sequence 4-digit, reset per hari (atau per tahun — pilih satu)
  // → Harus atomic (gunakan db.transaction)

generateVendorClaimNumber(): Promise<string>
  // → Format: VC-YYYYMMDD-NNN (e.g. VC-20260408-001)
  // → Harus atomic
```

**Pattern untuk atomic sequence:**

```typescript
async function generateClaimNumber(): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  return await db.transaction(async (tx) => {
    // Upsert dan increment dalam satu transaction
    const seq = await sequenceRepo.upsertAndIncrement('CLAIM', dateStr, tx)
    const paddedSeq = String(seq).padStart(4, '0')
    return `CLM-${year}-${paddedSeq}`
  })
}
```

---

### Task 3.2: Claim Repository & Service (CS Side)

#### Repository: `server/repositories/claim.repo.ts`

```typescript
findAll(filter: ClaimFilter & { page, limit })
  // → JOIN vendor, product_model, defect_master untuk nama-nama
  // → Support filter: status, vendorId, branch, submittedBy, search (claimNumber)
  // → Support fiscal period filter
findById(id: number)
findByIdWithRelations(id: number)
  // → JOIN semua relasi: vendor, model, defect, notification + photos + history
findByClaimNumber(claimNumber: string)
findBySubmittedBy(userId: string, filter: { status?, page, limit })
  // → Untuk CS: hanya klaim milik sendiri
insert(data: InsertClaim, tx?: DbTransaction)
update(id: number, data: UpdateClaim, tx?: DbTransaction)
countByFilter(filter: ClaimFilter)
findApprovedByVendorNotInBatch(vendorId: number)
  // → Untuk vendor claim: klaim APPROVED yang belum masuk batch
```

#### Repository: `server/repositories/claim-photo.repo.ts`

```typescript
findByClaimId(claimId: number)
findById(id: number)
insert(data: InsertClaimPhoto, tx?: DbTransaction)
insertMany(data: InsertClaimPhoto[], tx?: DbTransaction)
update(id: number, data: UpdateClaimPhoto, tx?: DbTransaction)
deleteByClaimId(claimId: number, tx?: DbTransaction)
  // → Untuk replace foto saat revision
```

#### Repository: `server/repositories/claim-history.repo.ts`

```typescript
findByClaimId(claimId: number)
  // → ORDER BY createdAt DESC
insert(data: InsertClaimHistory, tx?: DbTransaction)
findAllWithUserInfo(filter: { claimId?, userId?, action?, page, limit })
  // → Untuk audit trail: JOIN user untuk nama
```

#### Service: `server/services/claim.service.ts`

```typescript
// ── CS Operations ──

getClaimsForCs(userId: string, filter)
  // → claimRepo.findBySubmittedBy(userId, filter)
  // → Return list + pagination

getClaimDetailForCs(claimId: number, userId: string)
  // → claimRepo.findByIdWithRelations(claimId)
  // → Verify claim.submittedBy === userId (CS hanya lihat milik sendiri)
  // → Return claim + photos + history

createClaim(data: CreateClaimPayload, user: AuthUser): Promise<Claim>
  // 1. Jika notification code diberikan:
  //    → notificationRepo.findByCode(code)
  //    → Jika found & status=NEW: ok, ambil data (modelId, vendorId, branch)
  //    → Jika found & status=USED: throw NOTIFICATION_ALREADY_USED
  //    → Jika not found: auto-create notification dengan status USED
  // 2. Compute fiscal fields dari current date
  // 3. Generate claim number via sequenceService
  // 4. Dalam db.transaction:
  //    a. claimRepo.insert(claimData)
  //    b. Jika notification baru dibuat → notificationRepo.insert(...)
  //    c. Jika notification existing → notificationRepo.updateStatus(id, USED)
  //    d. claimHistoryRepo.insert({ action: 'CREATE', fromStatus: '-', toStatus: data.submitAs })
  //    e. Jika submitAs === 'SUBMITTED':
  //       claimHistoryRepo.insert({ action: 'SUBMIT' })
  // 5. Return claim baru

saveDraft(claimId: number, data: Partial<UpdateClaim>, user: AuthUser)
  // → Verify: claim.claimStatus === 'DRAFT'
  // → Verify: claim.submittedBy === user.id
  // → claimRepo.update(claimId, data)

submitClaim(claimId: number, user: AuthUser)
  // → Verify status === 'DRAFT' || status === 'NEED_REVISION'
  // → Verify semua required photos sudah ada
  // → Verify semua required fields vendor sudah terisi
  // → Dalam transaction:
  //    a. claimRepo.update(claimId, { claimStatus: 'SUBMITTED' })
  //    b. claimHistoryRepo.insert({ action: 'SUBMIT' })

submitRevision(claimId: number, revisionData: RevisionPayload, user: AuthUser)
  // → Verify status === 'NEED_REVISION'
  // → Verify submittedBy === user.id
  // → Dalam transaction:
  //    a. Update claim fields yang direvisi
  //    b. Replace foto yang di-reject (delete old, insert new)
  //    c. claimRepo.update(claimId, { claimStatus: 'SUBMITTED' })
  //    d. claimHistoryRepo.insert({ action: 'SUBMIT', note: revisionData.revisionNote })
```

#### API Routes (CS):

| Method | Path | File | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/cs/claims` | `server/api/cs/claims/index.get.ts` | List klaim milik CS |
| GET | `/api/cs/claims/:id` | `server/api/cs/claims/[id].get.ts` | Detail klaim CS |
| POST | `/api/cs/claims` | `server/api/cs/claims/index.post.ts` | Create claim (draft/submit) |
| PUT | `/api/cs/claims/:id` | `server/api/cs/claims/[id].put.ts` | Update draft |
| POST | `/api/cs/claims/:id/submit` | `server/api/cs/claims/[id]/submit.post.ts` | Submit claim |
| POST | `/api/cs/claims/:id/revision` | `server/api/cs/claims/[id]/revision.post.ts` | Submit revision |
| POST | `/api/cs/claims/:id/photos` | `server/api/cs/claims/[id]/photos.post.ts` | Upload foto |
| GET | `/api/cs/notifications/lookup/:code` | `server/api/cs/notifications/lookup/[code].get.ts` | Lookup notification |
| GET | `/api/cs/stats` | `server/api/cs/stats.get.ts` | Activity stats untuk CS home |

---

### Task 3.3: Photo Upload Handler

File: `server/api/cs/claims/[id]/photos.post.ts`

```typescript
// Handle multipart form upload
// 1. readMultipartFormData(event)
// 2. Validate: max 5MB, JPG/PNG only
// 3. Sanitize filename
// 4. Save ke ./public/uploads/claims/{claimId}/{photoType}.{ext}
// 5. Generate thumbnail 300x300 (menggunakan sharp atau skip dulu)
// 6. Insert record ke claim_photo table
// 7. Return photo record
```

**Storage structure:**

```
public/uploads/claims/
  └── {claimId}/
      ├── CLAIM.jpg
      ├── CLAIM_ZOOM.jpg
      ├── ODF.jpg
      ├── PANEL_SN.jpg
      ├── WO_PANEL.jpg       (MOKA only)
      └── WO_PANEL_SN.jpg    (MOKA only)
```

### Checklist Eksekusi Fase 3 (Aktual)

- [x] Task 3.1: Sequence number generator selesai (`server/repositories/sequence.repo.ts`, `server/services/sequence.service.ts`)
- [x] Task 3.2: Claim repository + service (CS side) selesai (`server/repositories/claim.repo.ts`, `server/repositories/claim-photo.repo.ts`, `server/repositories/claim-history.repo.ts`, `server/services/claim.service.ts`, `server/api/cs/claims/*`, `server/api/cs/notifications/lookup/[code].get.ts`)
- [x] Task 3.3: Photo upload handler selesai (`server/services/claim-photo.service.ts`, `server/api/cs/claims/[id]/photos.post.ts`, `server/api/cs/claims/[id]/photos.get.ts`, `server/api/cs/claims/[id]/photos/[photoId].delete.ts`, `server/api/claims/[id]/photos.get.ts`)
- [x] Task 3.4: Claim review service (QRCC side) selesai (`server/repositories/photo-review.repo.ts`, `server/services/claim-review.service.ts`, `server/api/claims/index.get.ts`, `server/api/claims/[id].get.ts`, `server/api/claims/[id]/fields.put.ts`, `server/api/claims/[id]/photos/[photoId]/review.post.ts`, `server/api/claims/[id]/finalize.post.ts`)
- [x] `pnpm lint:fix` dijalankan
- [x] `pnpm typecheck` dijalankan

---

### Task 3.4: Claim Review Service (QRCC Side)

#### Repository: `server/repositories/photo-review.repo.ts`

```typescript
findByClaimPhotoId(claimPhotoId: number)
findByClaimId(claimId: number)
  // → JOIN claim_photo untuk mendapat semua review per klaim
insert(data: InsertPhotoReview, tx?: DbTransaction)
```

#### Service: `server/services/claim-review.service.ts`

```typescript
getClaimsForReview(filter)
  // → claimRepo.findAll({ status: ['SUBMITTED', 'IN_REVIEW', ...], ...filter })
  // → Return list + pagination

getClaimDetailForReview(claimId: number, user: AuthUser)
  // → claimRepo.findByIdWithRelations(claimId)
  // → Jika status === 'SUBMITTED':
  //     auto-transition ke IN_REVIEW
  //     claimRepo.update(claimId, { claimStatus: 'IN_REVIEW', updatedBy: user.id })
  //     claimHistoryRepo.insert({ action: 'REVIEW', fromStatus: 'SUBMITTED', toStatus: 'IN_REVIEW' })
  // → Return claim + photos + history + photo_reviews

updateClaimFields(claimId: number, data: Partial<UpdateClaim>, user: AuthUser)
  // → Verify status === 'IN_REVIEW'
  // → Hanya izinkan field editable: panelPartNumber, ocSerialNo, defectCode, odfNumber, version, week
  // → claimRepo.update(claimId, { ...data, updatedBy: user.id })
  // → claimHistoryRepo.insert({ action: 'UPDATE' })

reviewPhoto(claimPhotoId: number, decision: ClaimPhotoStatus, rejectReason: string | null, user: AuthUser)
  // → Verify: claim status === 'IN_REVIEW'
  // → photoReviewRepo.insert({ claimPhotoId, reviewedBy: user.id, status: decision, rejectReason })
  // → claimPhotoRepo.update(claimPhotoId, { status: decision, rejectReason })
  // → claimHistoryRepo.insert({ action: 'REVIEW_PHOTO' })

finalizeReview(claimId: number, user: AuthUser)
  // → Verify: semua foto sudah direview
  // → Determine final status:
  //     Jika ada foto REJECT → NEED_REVISION
  //     Jika semua VERIFIED → APPROVED
  // → Dalam transaction:
  //     a. claimRepo.update(claimId, { claimStatus: finalStatus })
  //     b. claimHistoryRepo.insert({ action: finalStatus === 'APPROVED' ? 'APPROVE' : 'REQUEST_REVISION' })
```

#### API Routes (Dashboard/QRCC):

| Method | Path | File | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/claims` | `server/api/claims/index.get.ts` | List semua claims (QRCC/ADMIN) |
| GET | `/api/claims/:id` | `server/api/claims/[id].get.ts` | Detail claim + auto IN_REVIEW |
| PUT | `/api/claims/:id/fields` | `server/api/claims/[id]/fields.put.ts` | Update editable fields (QRCC) |
| POST | `/api/claims/:id/photos/:photoId/review` | `server/api/claims/[id]/photos/[photoId]/review.post.ts` | Review single photo |
| POST | `/api/claims/:id/finalize` | `server/api/claims/[id]/finalize.post.ts` | Finalize review decision |

---

## 7. Fase 4 -- Vendor Claim Batching

### Task 4.1: Vendor Claim Repository & Service

#### Repository: `server/repositories/vendor-claim.repo.ts`

```typescript
findAll(filter: VendorClaimFilter & { page, limit })
  // → JOIN vendor untuk nama vendor
findById(id: number)
findByIdWithItems(id: number)
  // → JOIN vendor_claim_item + claim (per item)
insert(data: InsertVendorClaim, tx?: DbTransaction)
update(id: number, data: UpdateVendorClaim, tx?: DbTransaction)
countByFilter(filter)
```

#### Repository: `server/repositories/vendor-claim-item.repo.ts`

```typescript
findByVendorClaimId(vendorClaimId: number)
  // → JOIN claim untuk detail klaim per item
findById(id: number)
insertMany(data: InsertVendorClaimItem[], tx?: DbTransaction)
update(id: number, data: UpdateVendorClaimItem, tx?: DbTransaction)
countPendingByVendorClaimId(vendorClaimId: number)
```

#### Service: `server/services/vendor-claim.service.ts`

```typescript
getVendorClaims(filter) → list + pagination

getVendorClaimDetail(id: number) → claim + items + claim details

getAvailableClaimsForBatch(vendorId: number, periodFilter?)
  // → claimRepo.findApprovedByVendorNotInBatch(vendorId)
  // → Return list klaim APPROVED yang belum masuk batch

generateVendorClaim(payload: GenerateVendorClaimPayload, user: AuthUser)
  // payload: { vendorId, claimIds: number[] }
  // 1. Validate: semua claimIds harus APPROVED dan vendorId-nya match
  // 2. Validate: tidak ada claimId yang sudah masuk batch lain
  // 3. Generate vendor claim number via sequenceService
  // 4. Compute fiscal fields
  // 5. Build report snapshot (summary data untuk Excel)
  // 6. Dalam db.transaction:
  //    a. vendorClaimRepo.insert(vendorClaimData)
  //    b. vendorClaimItemRepo.insertMany(items)
  //    c. claimHistoryRepo.insert per claim ({ action: 'GENERATE_VENDOR_CLAIM' })
  // 7. Generate Excel file (opsional, bisa jadi endpoint terpisah)
  // 8. Return vendor claim baru

updateVendorDecision(itemId: number, decision: VendorDecisionPayload, user: AuthUser)
  // decision: { vendorDecision, compensation?, rejectReason? }
  // 1. Validate: item exists
  // 2. vendorClaimItemRepo.update(itemId, { vendorDecision, compensation, rejectReason, vendorDecisionBy: user.id, vendorDecisionAt: Date.now() })
  // 3. Check: apakah semua items sudah ada decision?
  //    → Jika masih ada PENDING: vendorClaimRepo.update(vcId, { status: 'PROCESSING' })
  //    → Jika semua terisi: vendorClaimRepo.update(vcId, { status: 'COMPLETED' })
  // 4. claimHistoryRepo.insert({ action: 'UPDATE_VENDOR_DECISION' })

exportToExcel(vendorClaimId: number)
  // → Generate Excel file menggunakan `xlsx` package (sudah di dependencies)
  // → Return buffer / file path
```

#### API Routes:

| Method | Path | File | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/vendor-claims` | `server/api/vendor-claims/index.get.ts` | List vendor claims |
| GET | `/api/vendor-claims/:id` | `server/api/vendor-claims/[id].get.ts` | Detail vendor claim + items |
| POST | `/api/vendor-claims` | `server/api/vendor-claims/index.post.ts` | Generate vendor claim batch |
| GET | `/api/vendor-claims/available-claims` | `server/api/vendor-claims/available-claims.get.ts` | Klaim APPROVED yg available |
| PUT | `/api/vendor-claims/:id/items/:itemId` | `server/api/vendor-claims/[id]/items/[itemId].put.ts` | Update vendor decision per item |
| GET | `/api/vendor-claims/:id/export` | `server/api/vendor-claims/[id]/export.get.ts` | Download Excel |

---

## 8. Fase 5 -- Reports & Analytics API

### Task 5.1: Report Service

#### Service: `server/services/report.service.ts`

Semua report query menggunakan fiscal period filtering. Helper `resolvePeriodFilter()` dari `shared/utils/fiscal.ts` sudah tersedia.

```typescript
getDashboardKpi(filter: ReportFilter): Promise<ExecutiveKpi>
  // Aggregate query:
  // - totalClaims, submittedClaims, inReviewClaims, etc. (COUNT per status)
  // - approvalRate (APPROVED / total * 100)
  // - avgReviewLeadTimeDays (AVG of submittedAt to APPROVED timestamp)
  // - vendorPendingItems (COUNT vendor_claim_item WHERE vendorDecision = PENDING)

getClaimsByVendor(filter: ReportFilter)
  // → GROUP BY vendorId, COUNT(*)

getClaimsByBranch(filter: ReportFilter)
  // → GROUP BY branch, COUNT(*), approval rate per branch

getTopDefects(filter: ReportFilter)
  // → GROUP BY defectCode, COUNT(*), ORDER BY count DESC, LIMIT 10

getMonthlyTrend(filter: ReportFilter)
  // → GROUP BY calendarYear, calendarMonth
  // → Inflow (new claims), Closure (approved), Backlog (cumulative pending)

getBranchPerformance(filter: ReportFilter): Promise<BranchPerformanceRow[]>
  // → Detail per branch: totalClaims, approved, revision, rejected, rates, avg lead time

getVendorPerformance(filter: ReportFilter): Promise<VendorPerformanceRow[]>
  // → Detail per vendor: totalClaims, acceptance rate, recovery amount, avg processing

getAgingAnalysis(filter: ReportFilter)
  // → Claims grouped by age buckets (0-7 days, 8-14, 15-30, 30+)

getDefectAnalysis(filter: ReportFilter)
  // → Defect breakdown by vendor and model
```

#### API Routes:

| Method | Path | File | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/reports/dashboard-kpi` | `server/api/reports/dashboard-kpi.get.ts` | KPI overview |
| GET | `/api/reports/claims-by-vendor` | `server/api/reports/claims-by-vendor.get.ts` | Vendor breakdown |
| GET | `/api/reports/claims-by-branch` | `server/api/reports/claims-by-branch.get.ts` | Branch breakdown |
| GET | `/api/reports/top-defects` | `server/api/reports/top-defects.get.ts` | Top defects |
| GET | `/api/reports/monthly-trend` | `server/api/reports/monthly-trend.get.ts` | Monthly trend |
| GET | `/api/reports/branches` | `server/api/reports/branches.get.ts` | Branch performance table |
| GET | `/api/reports/vendors` | `server/api/reports/vendors.get.ts` | Vendor performance table |
| GET | `/api/reports/aging` | `server/api/reports/aging.get.ts` | Aging analysis |
| GET | `/api/reports/defects` | `server/api/reports/defects.get.ts` | Defect analysis |

**Query filter standar untuk semua report:**

```typescript
const reportQuerySchema = z.object({
  mode: z.enum(PERIOD_FILTER_MODES).default('this_fiscal_half'),
  customStartDate: z.string().optional(),
  customEndDate: z.string().optional(),
  branch: z.string().optional(),
  vendorId: z.coerce.number().int().positive().optional(),
  granularity: z.enum(PERIOD_GRANULARITIES).default('monthly')
})
```

### Checklist Eksekusi Fase 5 (Aktual)

- [x] Task 5.1: Report service + endpoints selesai (`server/services/report.service.ts`, `server/api/reports/dashboard-kpi.get.ts`, `server/api/reports/claims-by-vendor.get.ts`, `server/api/reports/claims-by-branch.get.ts`, `server/api/reports/top-defects.get.ts`, `server/api/reports/monthly-trend.get.ts`, `server/api/reports/branches.get.ts`, `server/api/reports/vendors.get.ts`, `server/api/reports/aging.get.ts`, `server/api/reports/defects.get.ts`)
- [x] `pnpm lint:fix` dijalankan
- [x] `pnpm typecheck` dijalankan

---

## 9. Fase 6 -- Audit Trail & Settings

### Task 6.1: Audit Trail API

Audit trail sudah tersimpan di tabel `claim_history`. Endpoint ini hanya perlu query + filter + pagination.

#### Service: reuse `claimHistoryRepo`

```typescript
// Tambahkan ke claim.service.ts atau buat audit-trail.service.ts terpisah
getAuditTrail(filter: AuditTrailQuery): Promise<AuditTrailListResponse>
  // → claimHistoryRepo.findAllWithUserInfo(filter)
  // → JOIN user untuk nama actor
  // → JOIN claim untuk claimNumber
  // → Support filter: search, action, userRole, dateFrom, dateTo
  // → Support sort: createdAt asc/desc
  // → Return items + pagination meta
```

#### API Route:

| Method | Path | File | Role |
|--------|------|------|------|
| GET | `/api/audit-trail` | `server/api/audit-trail/index.get.ts` | QRCC, ADMIN |

### Task 6.2: Settings API

| Method | Path | File | Deskripsi |
|--------|------|------|-----------|
| GET | `/api/settings` | `server/api/settings/index.get.ts` | Get app settings (future) |
| PUT | `/api/settings` | `server/api/settings/index.put.ts` | Update settings (ADMIN) |
| POST | `/api/auth/change-password` | (Fase 2) | Change own password |

> Settings saat ini belum ada tabel dedicated. Bisa menggunakan key-value store sederhana atau runtime config.

---

## 10. Peta File Lengkap

### Repositories (12 files)

```
server/repositories/
├── vendor.repo.ts              # Fase 1.1
├── product-model.repo.ts       # Fase 1.2
├── defect.repo.ts              # Fase 1.3
├── notification.repo.ts        # Fase 1.4
├── claim.repo.ts               # Fase 3.2
├── claim-photo.repo.ts         # Fase 3.2
├── claim-history.repo.ts       # Fase 3.2
├── photo-review.repo.ts        # Fase 3.4
├── vendor-claim.repo.ts        # Fase 4.1
├── vendor-claim-item.repo.ts   # Fase 4.1
├── sequence.repo.ts            # Fase 3.1
└── user.repo.ts                # Fase 2.4
```

### Services (10 files)

```
server/services/
├── vendor.service.ts           # Fase 1.1
├── product-model.service.ts    # Fase 1.2
├── defect.service.ts           # Fase 1.3
├── notification.service.ts     # Fase 1.4
├── claim.service.ts            # Fase 3.2
├── claim-review.service.ts     # Fase 3.4
├── vendor-claim.service.ts     # Fase 4.1
├── sequence.service.ts         # Fase 3.1
├── report.service.ts           # Fase 5.1
└── user.service.ts             # Fase 2.4
```

### API Routes (total ~50 endpoints)

```
server/api/
├── auth/
│   ├── sign-in.post.ts                          # Fase 2
│   ├── sign-out.post.ts                         # Fase 2
│   ├── session.get.ts                           # Fase 2
│   └── change-password.post.ts                  # Fase 2
│
├── profile/
│   ├── index.get.ts                             # Fase 2
│   └── index.put.ts                             # Fase 2
│
├── users/
│   ├── index.get.ts                             # Fase 2
│   ├── [id].get.ts                              # Fase 2
│   ├── [id].put.ts                              # Fase 2
│   └── [id]/
│       └── status.patch.ts                      # Fase 2
│
├── master/
│   ├── vendors/
│   │   ├── index.get.ts                         # Fase 1.1
│   │   ├── index.post.ts                        # Fase 1.1
│   │   ├── [id].get.ts                          # Fase 1.1
│   │   ├── [id].put.ts                          # Fase 1.1
│   │   └── [id]/
│   │       └── status.patch.ts                  # Fase 1.1
│   ├── product-models/
│   │   ├── index.get.ts                         # Fase 1.2
│   │   ├── index.post.ts                        # Fase 1.2
│   │   ├── [id].get.ts                          # Fase 1.2
│   │   ├── [id].put.ts                          # Fase 1.2
│   │   └── [id]/
│   │       └── status.patch.ts                  # Fase 1.2
│   ├── defects/
│   │   ├── index.get.ts                         # Fase 1.3
│   │   ├── index.post.ts                        # Fase 1.3
│   │   ├── [id].get.ts                          # Fase 1.3
│   │   ├── [id].put.ts                          # Fase 1.3
│   │   └── [id]/
│   │       └── status.patch.ts                  # Fase 1.3
│   └── notifications/
│       ├── index.get.ts                         # Fase 1.4
│       ├── index.post.ts                        # Fase 1.4
│       ├── import.post.ts                       # Fase 1.4
│       ├── [id].get.ts                          # Fase 1.4
│       ├── [id].put.ts                          # Fase 1.4
│       └── [id]/
│           └── status.patch.ts                  # Fase 1.4
│
├── notifications/
│   └── lookup/
│       └── [code].get.ts                        # Fase 1.4 (public lookup)
│
├── cs/
│   ├── claims/
│   │   ├── index.get.ts                         # Fase 3.2
│   │   ├── index.post.ts                        # Fase 3.2
│   │   ├── [id].get.ts                          # Fase 3.2
│   │   ├── [id].put.ts                          # Fase 3.2
│   │   └── [id]/
│   │       ├── submit.post.ts                   # Fase 3.2
│   │       ├── revision.post.ts                 # Fase 3.2
│   │       ├── photos.post.ts                   # Fase 3.3
│   │       ├── photos.get.ts                    # Fase 3.3
│   │       └── photos/
│   │           └── [photoId].delete.ts          # Fase 3.3
│   ├── notifications/
│   │   └── lookup/
│   │       └── [code].get.ts                    # Fase 3.2
│   └── stats.get.ts                             # Fase 3.2
│
├── claims/
│   ├── index.get.ts                             # Fase 3.4
│   ├── [id].get.ts                              # Fase 3.4
│   └── [id]/
│       ├── fields.put.ts                        # Fase 3.4
│       ├── finalize.post.ts                     # Fase 3.4
│       └── photos/
│           └── [photoId]/
│               └── review.post.ts               # Fase 3.4
│
├── vendor-claims/
│   ├── index.get.ts                             # Fase 4.1
│   ├── index.post.ts                            # Fase 4.1
│   ├── available-claims.get.ts                  # Fase 4.1
│   ├── [id].get.ts                              # Fase 4.1
│   ├── [id]/
│   │   ├── items/
│   │   │   └── [itemId].put.ts                  # Fase 4.1
│   │   └── export.get.ts                        # Fase 4.1
│
├── reports/
│   ├── dashboard-kpi.get.ts                     # Fase 5.1
│   ├── claims-by-vendor.get.ts                  # Fase 5.1
│   ├── claims-by-branch.get.ts                  # Fase 5.1
│   ├── top-defects.get.ts                       # Fase 5.1
│   ├── monthly-trend.get.ts                     # Fase 5.1
│   ├── branches.get.ts                          # Fase 5.1
│   ├── vendors.get.ts                           # Fase 5.1
│   ├── aging.get.ts                             # Fase 5.1
│   └── defects.get.ts                           # Fase 5.1
│
└── audit-trail/
    └── index.get.ts                             # Fase 6.1
```

### Utility Files

```
server/utils/
├── auth.ts                     # Fase 0.4 — requireAuth, requireRole
├── pagination.ts               # Fase 0.4 — pagination helpers
└── error-codes.ts              # Fase 0.4 — centralized error codes
```

---

## 11. Checklist Validasi per Task

Gunakan checklist ini setelah menyelesaikan setiap task:

### Per Repository File:
- [ ] Semua fungsi return typed data (menggunakan Drizzle infer types)
- [ ] Tidak ada business logic (hanya CRUD + filter)
- [ ] Tidak ada import dari `h3` atau akses ke HTTP event
- [ ] Support optional `tx?: DbTransaction` parameter untuk transaction
- [ ] Filter query menggunakan Drizzle operators (`eq`, `and`, `like`, etc.)

### Per Service File:
- [ ] Semua operasi memanggil repository, BUKAN query langsung
- [ ] Error thrown sebagai plain `Error` dengan message dari `ErrorCode`
- [ ] Fiscal fields dihitung via `getFiscalPeriodInfo()` saat insert
- [ ] Status transitions divalidasi sesuai `VALID_TRANSITIONS` map
- [ ] Transaction digunakan untuk operasi multi-table
- [ ] Tidak ada import dari `h3`

### Per API Route:
- [ ] Auth check di awal (`requireAuth` atau `requireRole`)
- [ ] Input validation via Zod (`getValidatedQuery`, `readValidatedBody`, `getValidatedRouterParams`)
- [ ] Response format sesuai `ApiResponse<T>` atau `PaginatedResponse<T>`
- [ ] Error dari service di-catch dan di-convert ke `createError` dengan status code tepat
- [ ] Tidak ada query database langsung
- [ ] Tidak ada business logic

### Per Fase:
- [ ] `pnpm typecheck` lolos tanpa error
- [ ] `pnpm lint` lolos tanpa error
- [ ] API bisa ditest via browser/curl/Postman
- [ ] Data tersimpan di SQLite dan bisa diverifikasi via `pnpm db:studio`

---

## 12. Catatan Migrasi drizzle-zod

### Status Saat Ini

Semua 12 file schema menggunakan import dari `drizzle-zod`:
```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
```

### Yang Perlu Dilakukan

Ganti import ke official Drizzle ORM Zod support:
```typescript
import { createInsertSchema, createSelectSchema } from 'drizzle-orm/zod'
```

### Perubahan API

API-nya **identik** — `createInsertSchema`, `createSelectSchema`, dan `createUpdateSchema` tersedia di `drizzle-orm/zod` dengan signature yang sama. Refinements callback juga sama.

### Zod Version

Project ini menggunakan `zod@4.3.6`. Drizzle ORM zod support kompatibel dengan Zod v4. Namun perhatikan:
- Jika menggunakan Zod v4, import `z` dari `zod` (bukan `zod/v4`)
- Jika ada issue kompatibilitas, gunakan `createSchemaFactory` dari `drizzle-orm/zod` dengan custom Zod instance

```typescript
import { createSchemaFactory } from 'drizzle-orm/zod'
import { z } from 'zod'

const { createInsertSchema, createSelectSchema } = createSchemaFactory({ zodInstance: z })
```

---

## 13. Referensi Quick-Lookup

### Tabel Database (12 tabel)

| Tabel | PK | Unique | Soft Delete | Fiscal Columns |
|-------|-----|--------|-------------|----------------|
| `user` | `id` (text/UUID) | email, username | `isActive` | - |
| `session` | `id` (text) | token | - | - |
| `account` | `id` (text) | - | - | - |
| `verification` | `id` (text) | - | - | - |
| `vendor` | `id` (int AI) | code | `isActive` | - |
| `product_model` | `id` (int AI) | name+vendorId | `isActive` | - |
| `defect_master` | `id` (int AI) | code, name | `isActive` | - |
| `notification_master` | `id` (int AI) | notificationCode | status (EXPIRED) | YES |
| `claim` | `id` (int AI) | claimNumber | status (ARCHIVED) | YES |
| `claim_photo` | `id` (int AI) | claimId+photoType | - | - |
| `claim_history` | `id` (int AI) | - | - (immutable) | - |
| `vendor_claim` | `id` (int AI) | vendorClaimNo | - | YES |
| `vendor_claim_item` | `id` (int AI) | claimId | - | - |
| `photo_review` | `id` (int AI) | - | - (immutable) | - |
| `sequence_generator` | `id` (int AI) | type+currentDate | - | - |

### Zod Schemas yang Sudah Ada (dari schema files)

| Schema | File | Dipakai Untuk |
|--------|------|---------------|
| `insertVendorSchema` | `vendor.ts` | Create vendor API |
| `updateVendorSchema` | `vendor.ts` | Update vendor API |
| `updateVendorStatusSchema` | `vendor.ts` | Toggle vendor status API |
| `insertProductModelSchema` | `product-model.ts` | Create product model API |
| `updateProductModelSchema` | `product-model.ts` | Update product model API |
| `updateProductModelStatusSchema` | `product-model.ts` | Toggle product model status API |
| `insertDefectMasterSchema` | `defect-master.ts` | Create defect API |
| `updateDefectMasterSchema` | `defect-master.ts` | Update defect API |
| `updateDefectMasterStatusSchema` | `defect-master.ts` | Toggle defect status API |
| `insertNotificationMasterSchema` | `notification-master.ts` | Create notification API |
| `updateNotificationMasterSchema` | `notification-master.ts` | Update notification API |
| `updateNotificationMasterStatusSchema` | `notification-master.ts` | Toggle notification status API |
| `insertClaimSchema` | `claim.ts` | Create claim API |
| `updateClaimSchema` | `claim.ts` | Update claim API |
| `insertClaimPhotoSchema` | `claim-photo.ts` | Upload photo API |
| `updateClaimPhotoSchema` | `claim-photo.ts` | Update photo status API |
| `insertClaimHistorySchema` | `claim-history.ts` | Log history (service layer) |
| `insertVendorClaimSchema` | `vendor-claim.ts` | Generate vendor claim API |
| `updateVendorClaimSchema` | `vendor-claim.ts` | Update vendor claim API |
| `insertVendorClaimItemSchema` | `vendor-claim-item.ts` | Add items to batch (service) |
| `updateVendorClaimItemSchema` | `vendor-claim-item.ts` | Update vendor decision API |
| `insertPhotoReviewSchema` | `photo-review.ts` | Review photo API |
| `insertSequenceGeneratorSchema` | `sequence-generator.ts` | Sequence management (service) |
| `insertUserSchema` | `auth.ts` | Create user (auth) |
| `updateUserStatusSchema` | `auth.ts` | Toggle user status API |
| `updateUserBusinessSchema` | `auth.ts` | Update user role/branch API |

### Role-Based Route Access

| Route Group | CS | QRCC | MANAGEMENT | ADMIN |
|-------------|:--:|:----:|:----------:|:-----:|
| `/api/cs/*` | Y | - | - | - |
| `/api/claims/*` (review) | - | Y | - | Y |
| `/api/vendor-claims/*` | - | Y | - | Y |
| `/api/master/*` | - | Y | - | Y |
| `/api/reports/*` | - | Y | Y | Y |
| `/api/audit-trail` | - | Y | - | Y |
| `/api/users/*` | - | - | - | Y |
| `/api/profile/*` | Y | Y | Y | Y |
| `/api/auth/*` | All | All | All | All |

### Urutan Pengerjaan yang Disarankan

```
Fase 0 (Infrastruktur)          ← MULAI DARI SINI
  ├── [x] 0.1 Folder structure
  ├── [x] 0.2 Database migration
  ├── [x] 0.3 Seed script
  ├── [x] 0.4 Utility files
  └── [ ] 0.5 Migrasi drizzle-zod (ditunda di versi saat ini)

Fase 1 (Master Data) + Fase 2 (Auth)  ← PARALEL
  ├── [x] 1.1 Vendor CRUD
  ├── [x] 1.2 Product Model CRUD
  ├── [x] 1.3 Defect CRUD
  ├── [x] 1.4 Notification CRUD + Import
  ├── [x] 2.1 Better-Auth setup
  ├── [x] 2.2 Auth API routes
  ├── [x] 2.3 Server middleware
  └── [x] 2.4 User management

Fase 3 (Claim Lifecycle)          ← SETELAH Fase 1 + 2
  ├── [x] 3.1 Sequence generator
  ├── [x] 3.2 Claim CRUD (CS side)
  ├── [x] 3.3 Photo upload handler
  └── [x] 3.4 Claim review (QRCC side)

Fase 4 (Vendor Claim)             ← SETELAH Fase 3
  └── [x] 4.1 Vendor claim batching

Fase 5 (Reports)                  ← SETELAH Fase 3 + 4
  └── [x] 5.1 Report service + endpoints

Fase 6 (Audit + Settings)        ← SETELAH Fase 3
  ├── 6.1 Audit trail endpoint
  └── 6.2 Settings endpoint
```

---

> **Catatan Penutup**: Dokumen ini ditulis berdasarkan state codebase per 8 April 2026. Schema database, Zod validation schemas, shared types, dan frontend view models sudah tersedia dan stabil. Backend hanya perlu "menghidupkan" koneksi antara UI dan database sesuai arsitektur 3-layer di atas. Pastikan setiap perubahan yang dicommit lulus `pnpm typecheck` dan `pnpm lint`.

@prompt.md 

implementasikan bagian Fase 5 saja.

workflow:
- buatkan branch baru.
- cukup gunakan @task-backend.ms sebagai referensi, jangan scan file yang tidak berkaitan dengan task.
- implementasikan bagian task 5.1 saja.
- update checklist task-backend.md
- commit per task, lint::fix , typecheck
- jika sudah selesai semua baru push branch dan buatkan PR. 
