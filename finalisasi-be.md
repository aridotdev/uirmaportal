# Finalisasi Backend — Production-Ready Plan

> **Project:** uirmaportal (RMA Claim Management System)
> **Stack:** Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod, TypeScript
> **Dibuat:** 10 April 2026
> **Status:** Backend sudah ada (~70 API route, 13 schema, 11 service, 13 repo). Dokumen ini adalah rencana finalisasi menuju **production-ready**.

---

## Daftar Isi

1. [Ringkasan State Saat Ini](#1-ringkasan-state-saat-ini)
2. [Fase 1 — Auth & Seed Fix (Critical Path)](#fase-1--auth--seed-fix-critical-path)
3. [Fase 2 — Frontend-Backend Wiring](#fase-2--frontend-backend-wiring)
4. [Fase 3 — Data Integrity & Validation Hardening](#fase-3--data-integrity--validation-hardening)
5. [Fase 4 — Security Hardening](#fase-4--security-hardening)
6. [Fase 5 — Error Handling & Observability](#fase-5--error-handling--observability)
7. [Fase 6 — Performance & Scalability](#fase-6--performance--scalability)
8. [Fase 7 — File Upload & Storage](#fase-7--file-upload--storage)
9. [Fase 8 — Testing](#fase-8--testing)
10. [Fase 9 — Database Production Readiness](#fase-9--database-production-readiness)
11. [Fase 10 — Deployment & DevOps](#fase-10--deployment--devops)
12. [Fase 11 — Dependency Cleanup & Maintenance](#fase-11--dependency-cleanup--maintenance)
13. [Checklist Final](#checklist-final)
14. [Prioritas & Timeline Rekomendasi](#prioritas--timeline-rekomendasi)

---

## 1. Ringkasan State Saat Ini

### Yang Sudah Ada

| Layer | Count | Detail |
|---|---|---|
| Database Schema | 13 tabel | user, session, account, verification, vendor, productModel, defectMaster, notificationMaster, claim, claimPhoto, claimHistory, vendorClaim, vendorClaimItem, photoReview, sequenceGenerator |
| API Routes | ~70 file | Auth (4), Master CRUD (20), Claims (16), Vendor Claims (6), Reports (9), Audit (1), Settings (2), Profile (2), Users (3) |
| Services | 11 file | claim, claim-review, vendor-claim, vendor, product-model, defect, notification, user, report, settings, sequence |
| Repositories | 13 file | Semua entity punya repo dedicated |
| Server Utils | 6 file | auth, auth-config, error-codes, status-transitions, pagination, request-headers |
| Middleware | 1 file | Auth session resolver |
| Shared Utils | 2 file | fiscal.ts (449 baris), constants.ts |

### Gap Kritis

| # | Gap | Severity | Impact |
|---|---|---|---|
| G1 | Seed script tidak membuat `account` records → Better-Auth login gagal | **BLOCKER** | Auth tidak bisa dipakai sama sekali |
| G2 | `useAuthSession.ts` masih mock (`setTimeout` + hardcoded users) | **BLOCKER** | Tidak ada auth flow nyata |
| G3 | `useDashboardStore.ts` masih mock role switcher | **HIGH** | Dashboard tidak role-aware |
| G4 | ~28 halaman masih pakai mock data meskipun API sudah ada | **HIGH** | Backend tidak terpakai |
| G5 | Tidak ada `.env.example` — `.env` berisi secret yang committed | **HIGH** | Security risk |
| G6 | Tidak ada file upload/storage implementation (foto claim) | **HIGH** | Core feature tidak jalan |
| G7 | Tidak ada automated testing | **HIGH** | Regresi tidak terdeteksi |
| G8 | `drizzle-zod` masih pakai versi deprecated (package terpisah) | **MEDIUM** | Akan break di future update |
| G9 | Tidak ada rate limiting selain login | **MEDIUM** | DDoS / abuse risk |
| G10 | Tidak ada audit trail logging dari backend | **MEDIUM** | Compliance gap |

---

## Fase 1 — Auth & Seed Fix (Critical Path)

**Tujuan:** Login flow berjalan end-to-end dari browser ke Better-Auth ke database.

### 1.1 Fix Seed Script — Buat Account Records

```
File: server/database/seed.ts
```

**Problem:** Seed hanya insert ke tabel `user`, bukan `account`. Better-Auth memerlukan record di tabel `account` dengan `providerId: 'credential'` dan `password` yang di-hash menggunakan library internal Better-Auth.

**Tasks:**
- [ ] Import password hashing dari `better-auth/crypto` atau gunakan `auth.api.signUpEmail()` secara programatik di seed
- [ ] Untuk setiap user di seed, buat account record:
  ```ts
  {
    id: generateId(),           // UUID
    accountId: user.id,         // same as user.id
    providerId: 'credential',   // Better-Auth convention
    userId: user.id,
    password: await hashPassword('password'), // hashed
    createdAt: new Date(),
    updatedAt: new Date()
  }
  ```
- [ ] Alternatif (lebih robust): Gunakan `auth.api.signUpEmail({ body: { ... } })` di seed agar Better-Auth yang handle hashing dan record creation. Ini garantee kompatibel.
- [ ] Tambahkan username-based account juga (karena plugin `username()` aktif)
- [ ] Verifikasi: setelah seed, cek tabel `account` punya 4 rows, masing-masing dengan hashed password

### 1.2 Wire `useAuthSession.ts` ke Real API

```
File: app/composables/useAuthSession.ts
```

**Problem:** Composable ini sepenuhnya mock. Menggunakan `setTimeout(800)` dan `mockUsers` map.

**Tasks:**
- [ ] Replace `login()` function:
  ```ts
  async function login(username: string, password: string) {
    loading.value = true
    error.value = null
    try {
      // Better-Auth sign-in via username plugin
      const res = await $fetch('/api/auth/sign-in', {
        method: 'POST',
        body: { username, password }
      })
      // Fetch session to get full user data
      await fetchSession()
      return true
    } catch (e: any) {
      error.value = e.data?.message || 'Login gagal'
      return false
    } finally {
      loading.value = false
    }
  }
  ```
- [ ] Tambah `fetchSession()` yang memanggil `GET /api/auth/session`
- [ ] Replace `logout()` untuk call `POST /api/auth/sign-out`
- [ ] Session state: gunakan `useFetch('/api/auth/session')` + `useCookie` untuk track login state
- [ ] Auto-redirect: jika session expired, redirect ke `/login`
- [ ] Expose reactive `user`, `role`, `isAuthenticated`, `branch` dari session data

### 1.3 Wire `useDashboardStore.ts` ke Real Auth

```
File: app/composables/useDashboardStore.ts
```

**Tasks:**
- [ ] Hapus `_mockUsers` dan mock role switcher
- [ ] Ganti dengan: `const { user } = useAuthSession()`
- [ ] Keep dev-only role switcher hanya di `import.meta.dev` mode, dengan memanggil real sign-in ke user berbeda
- [ ] Pastikan `currentUser` reactive dan berubah saat session berubah

### 1.4 Buat `.env.example`

```
File: .env.example (baru)
```

**Tasks:**
- [ ] Buat file `.env.example`:
  ```env
  # Database
  DB_FILE_NAME=file:local.db

  # Better Auth
  BETTER_AUTH_SECRET=generate-a-random-secret-min-32-chars
  BETTER_AUTH_URL=http://localhost:3000

  # File Storage (Fase 7)
  UPLOAD_DIR=./uploads
  MAX_FILE_SIZE_MB=10

  # Optional: Logging
  LOG_LEVEL=info
  ```
- [ ] Tambahkan `.env` ke `.gitignore` (verifikasi sudah ada)
- [ ] Hapus secret dari git history jika `.env` pernah di-commit (gunakan `git filter-branch` atau BFG)

---

## Fase 2 — Frontend-Backend Wiring

**Tujuan:** Semua ~28 halaman yang masih mock data di-wire ke real API endpoints yang sudah ada.

### 2.1 Master Data Pages

| Page | Current | Target API | Priority |
|---|---|---|---|
| `/dashboard/master/vendor` | Inline mock | `GET/POST/PUT /api/master/vendors` | HIGH |
| `/dashboard/master/product-model` | Inline mock | `GET/POST/PUT /api/master/product-models` | HIGH |
| `/dashboard/master/defect` | Inline mock | `GET/POST/PUT /api/master/defects` | HIGH |
| `/dashboard/master/notification` | Inline mock | `GET/POST/PUT /api/master/notifications` + import | HIGH |

**Pattern yang sudah proven (dari CS claims):**
```ts
// Di page atau composable:
const { data, refresh } = useFetch('/api/master/vendors', {
  query: { page, limit, search, isActive }
})

// Untuk create/update:
await $fetch('/api/master/vendors', { method: 'POST', body: formData })
await refresh()
```

**Tasks per page:**
- [ ] Replace `ref([...])` dengan `useFetch()` ke endpoint terkait
- [ ] Wire form submit ke `POST`/`PUT` endpoints
- [ ] Wire status toggle ke `PATCH .../status` endpoints
- [ ] Wire notification import ke `POST /api/master/notifications/import`
- [ ] Handle loading states (sudah ada `LoadingState` component)
- [ ] Handle error states (sudah ada `EmptyState` component)

### 2.2 User Management Pages

| Page | Current | Target API |
|---|---|---|
| `/dashboard/users/index` | `MOCK_AUTH_USERS` | `GET /api/users` |
| `/dashboard/users/[id]` | `MOCK_AUTH_USERS.find()` | `GET /api/users/:id`, `PUT /api/users/:id`, `PATCH /api/users/:id/status` |

**Tasks:**
- [ ] Wire user list ke `GET /api/users?page=&limit=&search=&role=&isActive=`
- [ ] Wire user detail + edit form ke `GET/PUT /api/users/:id`
- [ ] Wire status toggle (ban/unban) ke `PATCH /api/users/:id/status`
- [ ] Pastikan hanya ADMIN role yang bisa akses (sudah di-guard di backend)

### 2.3 Vendor Claims Pages

| Page | Current | Target API |
|---|---|---|
| `/dashboard/vendor-claims/index` | Inline mock | `GET /api/vendor-claims` |
| `/dashboard/vendor-claims/[id]` | `mockBatches` | `GET /api/vendor-claims/:id` |
| `/dashboard/vendor-claims/create` | Mock save | `GET /api/vendor-claims/available-claims`, `POST /api/vendor-claims` |

**Tasks:**
- [ ] Wire vendor claim list dengan pagination dan filter
- [ ] Wire detail page: tampilkan items, update decisions (`PUT /api/vendor-claims/:id/items/:itemId`)
- [ ] Wire create wizard: fetch available claims, submit batch creation
- [ ] Wire Excel export (`GET /api/vendor-claims/:id/export` returns blob)

### 2.4 Report Pages

| Page | Current | Target API |
|---|---|---|
| `/dashboard/reports/index` | `MOCK_CLAIMS` | `GET /api/reports/dashboard-kpi` |
| `/dashboard/reports/vendors` | Inline mock | `GET /api/reports/vendors`, `GET /api/reports/claims-by-vendor` |
| `/dashboard/reports/branches` | Inline mock | `GET /api/reports/branches`, `GET /api/reports/claims-by-branch` |
| `/dashboard/reports/aging` | Inline mock | `GET /api/reports/aging` |
| `/dashboard/reports/trends` | Inline mock | `GET /api/reports/monthly-trend` |
| `/dashboard/reports/defects` | Inline mock | `GET /api/reports/defects`, `GET /api/reports/top-defects` |
| `/dashboard/reports/recovery` | Mock data | `GET /api/reports/vendors` (recovery rate) |

**Tasks:**
- [ ] Buat composable `useReportData(endpoint, params)` yang wraps `useFetch` dengan:
  - Period filter (fiscal half/year/custom) → query params
  - Auto-refresh ketika filter berubah
  - Loading/error state
- [ ] Wire setiap report page ke endpoint masing-masing
- [ ] Pastikan chart components menerima data format yang sesuai dari API response

### 2.5 Audit Trail Page

```
File: app/pages/dashboard/audit-trail.vue + app/composables/useAuditTrail.ts
```

**Tasks:**
- [ ] Ganti `getMockAuditTrailSorted()` dengan `useFetch('/api/audit-trail')` di `useAuditTrail.ts`
- [ ] Wire filter params (action, userId, dateRange, search) ke query params
- [ ] Hapus `MOCK_CLAIM_NUMBER_MAP`, `MOCK_ACTOR_NAME_MAP` — API sudah return enriched data
- [ ] Wire CSV export ke backend atau implementasi client-side dari real data

### 2.6 Settings & Profile Pages

| Page | Current | Target API |
|---|---|---|
| `/dashboard/settings/index` | Mock | `GET/PUT /api/settings` |
| `/dashboard/settings/security` | Mock | `POST /api/auth/change-password` |
| `/cs/profile` | Inline mock | `GET/PUT /api/profile` |

**Tasks:**
- [ ] Wire settings page ke Nitro KV storage endpoints
- [ ] Wire change password ke `POST /api/auth/change-password`
- [ ] Wire profile page ke `GET/PUT /api/profile`

### 2.7 CS Reference Data Wiring

```
File: app/composables/useCsStore.ts
```

**Problem:** CRUD calls sudah wire ke API, tapi `referenceData` (vendors, models, defects, branches) masih dari `CS_MOCK_*`.

**Tasks:**
- [ ] Tambah API calls untuk reference data:
  ```ts
  const { data: vendors } = useFetch('/api/master/vendors?isActive=true&limit=100')
  const { data: models } = useFetch('/api/master/product-models?isActive=true&limit=100')
  const { data: defects } = useFetch('/api/master/defects?isActive=true&limit=100')
  ```
- [ ] Branch list: tambahkan `GET /api/reference/branches` endpoint atau derive dari user data
- [ ] Hapus semua `CS_MOCK_*` imports dan `test-fixtures/cs` file setelah wiring selesai

### 2.8 Cleanup Mock Data

**Tasks:**
- [ ] Hapus `app/utils/mock-data.ts` setelah semua page di-wire
- [ ] Hapus `app/test-fixtures/` directory
- [ ] Grep seluruh codebase untuk sisa `mock`, `MOCK`, `Mock` di `app/` — pastikan zero references
- [ ] Grep untuk `setTimeout.*delay` pattern yang mensimulasi API latency — hapus semua

---

## Fase 3 — Data Integrity & Validation Hardening

**Tujuan:** Semua data yang masuk ke database telah divalidasi secara ketat; constraint di level DB memperkuat constraint di level aplikasi.

### 3.1 Migrate `drizzle-zod` ke `drizzle-orm/zod`

```
Problem: Package `drizzle-zod` (v0.8.3) sudah deprecated. Harus migrate ke built-in `drizzle-orm/zod`.
```

**Tasks:**
- [ ] Ganti semua import `from 'drizzle-zod'` → `from 'drizzle-orm/zod'`
- [ ] Cek apakah API `createInsertSchema` / `createSelectSchema` berubah di versi baru
- [ ] Jalankan `pnpm typecheck` setelah migrasi
- [ ] Hapus `drizzle-zod` dari `package.json`
- [ ] `pnpm install` untuk clean dependency tree

### 3.2 Input Sanitization Layer

**Tasks:**
- [ ] Buat utility `server/utils/sanitize.ts`:
  ```ts
  export function sanitizeString(input: string): string {
    return input.trim().replace(/\s+/g, ' ')
  }

  export function sanitizeSearchQuery(input: string): string {
    // Escape SQLite LIKE wildcards & strip dangerous chars
    return input.replace(/[%_\\]/g, '\\$&').trim()
  }
  ```
- [ ] Terapkan di semua service sebelum data masuk ke repo
- [ ] Tambahkan max length validation di semua string fields:
  - `name`: max 255
  - `email`: max 320
  - `claimNumber`: max 20
  - `branch`: max 100
  - `description/notes`: max 2000
  - Semua text field lainnya: max 500 kecuali ada alasan khusus
- [ ] Tambahkan `.transform()` di Zod schema untuk auto-trim

### 3.3 Database Constraints Review

**Tasks:**
- [ ] Audit semua foreign key constraints — pastikan `ON DELETE` behavior benar:
  - `claim.vendorId` → `RESTRICT` (sudah benar)
  - `vendorClaimItem.vendorClaimId` → `CASCADE` (sudah benar)
  - `session.userId` → `CASCADE` (sudah benar)
  - `account.userId` → `CASCADE` (sudah benar)
- [ ] Tambahkan CHECK constraints di level DB (via Drizzle):
  ```ts
  // Contoh: inch harus positif
  inch: integer().notNull().check(sql`inch > 0`)
  // Contoh: calendarMonth 1-12
  calendarMonth: integer().notNull().check(sql`calendar_month BETWEEN 1 AND 12`)
  ```
- [ ] Tambahkan composite unique constraints yang belum ada:
  - `notificationMaster`: unique on `notificationCode` (sudah ada?)
  - `vendorClaimItem`: unique on `claimId` (sudah ada ✓)
- [ ] Generate dan push migration baru setelah perubahan: `pnpm db:generate && pnpm db:push`

### 3.4 Concurrency & Race Condition Protection

**Tasks:**
- [ ] Sequence generator sudah pakai transaction ✓ — verifikasi proper locking
- [ ] Claim status transition: tambahkan **optimistic locking** via `updatedAt` check:
  ```ts
  // Di service saat update status:
  const result = await db.update(claim)
    .set({ claimStatus: newStatus, updatedAt: new Date() })
    .where(and(
      eq(claim.id, claimId),
      eq(claim.updatedAt, expectedUpdatedAt) // Optimistic lock
    ))
  if (result.rowsAffected === 0) {
    throw new Error(ErrorCode.CONCURRENT_MODIFICATION)
  }
  ```
- [ ] Tambahkan `ErrorCode.CONCURRENT_MODIFICATION` di error-codes
- [ ] Notification usage: pastikan tidak bisa double-claim dalam concurrent request (sudah unique constraint di `vendorClaimItem.claimId`)

---

## Fase 4 — Security Hardening

**Tujuan:** Sistem aman dari common web vulnerabilities dan mengikuti OWASP best practices.

### 4.1 Route-Level Authorization Matrix

Buat file `server/utils/route-guards.ts` yang memvalidasi akses per endpoint:

```ts
// Definisi matrix:
const ROUTE_ACCESS: Record<string, UserRole[]> = {
  // CS endpoints
  'POST /api/cs/claims': ['CS'],
  'GET /api/cs/claims': ['CS'],

  // Dashboard claims (review)
  'GET /api/claims': ['QRCC', 'MANAGEMENT', 'ADMIN'],
  'POST /api/claims/:id/start-review': ['QRCC'],
  'POST /api/claims/:id/finalize': ['QRCC'],

  // Master data
  'GET /api/master/*': ['QRCC', 'MANAGEMENT', 'ADMIN'],
  'POST /api/master/*': ['ADMIN'],
  'PUT /api/master/*': ['ADMIN'],

  // Users
  'GET /api/users': ['ADMIN'],
  'PUT /api/users/*': ['ADMIN'],

  // Reports
  'GET /api/reports/*': ['QRCC', 'MANAGEMENT', 'ADMIN'],

  // Vendor claims
  'GET /api/vendor-claims': ['QRCC', 'MANAGEMENT', 'ADMIN'],
  'POST /api/vendor-claims': ['QRCC', 'ADMIN'],
}
```

**Tasks:**
- [ ] Buat file matrix di atas
- [ ] Review semua API route handler — pastikan setiap satu memanggil `requireRole()` dengan roles yang tepat
- [ ] Tambahkan route guard middleware yang enforce matrix secara otomatis (optional tapi recommended)
- [ ] Ownership check: CS user hanya bisa akses claim miliknya sendiri (`submittedBy === user.id`)
  - Sudah partial di `claim.service.ts`, verifikasi komprehensif
- [ ] Pastikan `MANAGEMENT` role read-only (tidak bisa create/update/delete)

### 4.2 CORS & Security Headers

```
File: nuxt.config.ts + server/middleware/security-headers.ts (baru)
```

**Tasks:**
- [ ] Tambahkan security headers middleware:
  ```ts
  export default defineEventHandler((event) => {
    setResponseHeaders(event, {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    })
  })
  ```
- [ ] Konfigurasikan CORS di `nuxt.config.ts` (atau di Nitro config) — restrict origin ke domain produksi
- [ ] Tambahkan CSP (Content-Security-Policy) header yang sesuai

### 4.3 Rate Limiting & Abuse Prevention

**Tasks:**
- [ ] Rate limit sudah ada untuk login ✓ — Extend ke endpoint sensitif lainnya:
  - `POST /api/cs/claims` → max 30/menit per user
  - `POST /api/master/notifications/import` → max 5/menit
  - `POST /api/cs/claims/:id/photos` → max 60/menit per user
  - Semua `POST/PUT/PATCH/DELETE` → max 100/menit per user
- [ ] Implementasi via `unstorage` (sudah available di Nitro) atau middleware custom:
  ```ts
  // server/utils/rate-limit.ts
  const storage = useStorage('rate-limit')

  export async function checkRateLimit(key: string, max: number, windowSec: number) {
    const current = await storage.getItem<number>(key) || 0
    if (current >= max) {
      throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
    }
    await storage.setItem(key, current + 1, { ttl: windowSec })
  }
  ```
- [ ] Tambahkan request body size limit di Nitro config:
  ```ts
  // nuxt.config.ts
  nitro: {
    routeRules: {
      '/api/**': { headers: { 'x-max-body-size': '10mb' } }
    }
  }
  ```

### 4.4 Secrets Management

**Tasks:**
- [ ] Verifikasi `.env` ada di `.gitignore`
- [ ] Buat `.env.example` dengan placeholder values (Fase 1.4)
- [ ] Generate `BETTER_AUTH_SECRET` baru yang kuat (min 32 chars, cryptographically random)
- [ ] Jika `.env` pernah committed, **rotate semua secrets**
- [ ] Untuk production: gunakan environment variables dari platform (bukan file)

### 4.5 Session Security

**Tasks:**
- [ ] Verifikasi Better-Auth session cookie settings:
  - `httpOnly: true` ✓ (default Better-Auth)
  - `secure: true` di production
  - `sameSite: 'lax'` atau `'strict'`
- [ ] Implement session invalidation on password change (sudah ada `change-password` endpoint — pastikan all sessions cleared)
- [ ] Implement idle timeout: session expires setelah X jam inactivity
- [ ] Implement max concurrent sessions per user (optional)

---

## Fase 5 — Error Handling & Observability

**Tujuan:** Semua error ditangani gracefully, ter-log, dan bisa di-debug. Tidak ada unhandled promise rejection atau silent failure.

### 5.1 Structured Error Response

**Current pattern sudah bagus** — `{ statusCode, statusMessage }` via `createError()`. Enhance:

**Tasks:**
- [ ] Standardisasi response envelope di semua endpoint:
  ```ts
  // Success:
  { success: true, data: T, pagination?: PaginationMeta }

  // Error:
  { success: false, error: { code: string, message: string, details?: unknown } }
  ```
- [ ] Buat `server/utils/response.ts`:
  ```ts
  export function successResponse<T>(data: T, pagination?: PaginationMeta) {
    return { success: true as const, data, ...(pagination && { pagination }) }
  }

  export function errorResponse(code: string, message: string, details?: unknown) {
    return { success: false as const, error: { code, message, details } }
  }
  ```
- [ ] Buat global error handler Nitro plugin:
  ```ts
  // server/plugins/error-handler.ts
  export default defineNitroPlugin((nitro) => {
    nitro.hooks.hook('error', (error, { event }) => {
      console.error(`[API Error] ${event?.path}:`, error)
    })
  })
  ```
- [ ] Zod validation errors harus return field-level detail:
  ```ts
  catch (e) {
    if (e instanceof ZodError) {
      throw createError({
        statusCode: 422,
        data: { code: 'VALIDATION_FAILED', issues: e.issues }
      })
    }
  }
  ```

### 5.2 Audit Trail — Backend-Driven Logging

**Problem:** `claimHistory` table ada di schema, tapi perlu verifikasi semua action benar-benar di-log.

**Tasks:**
- [ ] Verifikasi bahwa semua claim state changes menulis ke `claimHistory`:
  - Create (DRAFT) ✓
  - Submit (→ SUBMITTED)
  - Start Review (→ IN_REVIEW)
  - Photo Review
  - Finalize (→ APPROVED / NEED_REVISION)
  - Revision Submit (→ SUBMITTED)
  - Archive
- [ ] Tambahkan audit logging untuk non-claim actions:
  - Master data CRUD (vendor, product model, defect, notification)
  - User management (create, update, toggle status)
  - Vendor claim lifecycle
  - Settings changes
- [ ] Buat tabel `auditLog` yang generik (terpisah dari `claimHistory`):
  ```ts
  export const auditLog = sqliteTable('audit_log', {
    id: integer().primaryKey({ autoIncrement: true }),
    action: text().notNull(),       // 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | ...
    entityType: text().notNull(),   // 'claim' | 'vendor' | 'user' | ...
    entityId: text().notNull(),     // ID of the entity
    actorId: text().notNull(),      // user.id who performed action
    actorName: text().notNull(),    // Denormalized for read performance
    changes: text({ mode: 'json' }), // { field: { from, to } } diff
    metadata: text({ mode: 'json' }), // Extra context
    ipAddress: text(),
    createdAt: integer({ mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
  })
  ```
- [ ] Buat `server/services/audit.service.ts` dengan helper:
  ```ts
  export async function logAudit(params: {
    action: string
    entityType: string
    entityId: string
    actorId: string
    actorName: string
    changes?: Record<string, { from: unknown, to: unknown }>
    metadata?: Record<string, unknown>
    ipAddress?: string
  }) { ... }
  ```
- [ ] Integrasikan `logAudit()` di semua service layer yang melakukan write operations
- [ ] Wire `/api/audit-trail` endpoint ke tabel `auditLog` baru (bukan `claimHistory` saja)

### 5.3 Application Logging

**Tasks:**
- [ ] Buat `server/utils/logger.ts` dengan structured logging:
  ```ts
  type LogLevel = 'debug' | 'info' | 'warn' | 'error'

  export function createLogger(context: string) {
    return {
      info: (message: string, data?: Record<string, unknown>) =>
        log('info', context, message, data),
      warn: (message: string, data?: Record<string, unknown>) =>
        log('warn', context, message, data),
      error: (message: string, error?: unknown, data?: Record<string, unknown>) =>
        log('error', context, message, { ...data, error: serializeError(error) }),
    }
  }

  // Output: JSON lines for production, pretty for dev
  ```
- [ ] Tambahkan logging di titik-titik kritis:
  - Auth: login success/failure, session created/expired
  - Claims: status transitions, photo uploads
  - Errors: semua caught errors di service layer
  - Performance: slow queries (> 500ms)
- [ ] Jangan log sensitive data (passwords, tokens, full request bodies)
- [ ] Untuk production: pertimbangkan kirim ke logging service (Loki, CloudWatch, etc.)

### 5.4 Health Check Endpoint

**Tasks:**
- [ ] Buat `server/api/_health.get.ts`:
  ```ts
  export default defineEventHandler(async () => {
    const checks = {
      database: false,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }

    try {
      // Simple DB connectivity check
      await db.select({ count: sql`1` }).from(user).limit(1)
      checks.database = true
    } catch (e) {
      checks.database = false
    }

    const allHealthy = Object.values(checks).every(v =>
      typeof v === 'boolean' ? v : true
    )

    if (!allHealthy) {
      throw createError({ statusCode: 503, data: checks })
    }

    return { status: 'ok', checks }
  })
  ```
- [ ] Exclude dari auth middleware (sudah, karena bukan `/api/auth/` prefix — perlu tambahkan exception)

---

## Fase 6 — Performance & Scalability

**Tujuan:** Response time < 200ms untuk semua CRUD, < 500ms untuk reports. Efisien di SQLite single-file.

### 6.1 Query Optimization

**Tasks:**
- [ ] Audit semua repository queries — pastikan pakai index yang sudah didefinisikan
- [ ] Tambahkan index yang missing:
  ```sql
  -- Untuk report queries yang join claim + vendor + defect:
  CREATE INDEX IF NOT EXISTS claim_defect_code_idx ON claim(defect_code);
  CREATE INDEX IF NOT EXISTS claim_branch_idx ON claim(branch);
  CREATE INDEX IF NOT EXISTS claim_created_at_idx ON claim(created_at);

  -- Untuk audit trail:
  CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_id);
  CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log(created_at);
  ```
- [ ] Review N+1 query patterns di service layer:
  - `report.service.ts`: apakah ada loop query? Ganti dengan JOIN atau subquery
  - Claim list: apakah photo count di-query per-claim? Gunakan subquery
- [ ] SQLite-specific: gunakan `PRAGMA journal_mode=WAL` untuk better read concurrency:
  ```ts
  // server/database/index.ts
  // Setelah init db:
  db.run(sql`PRAGMA journal_mode=WAL`)
  db.run(sql`PRAGMA busy_timeout=5000`)
  db.run(sql`PRAGMA synchronous=NORMAL`)
  db.run(sql`PRAGMA cache_size=-64000`) // 64MB cache
  db.run(sql`PRAGMA foreign_keys=ON`)
  ```

### 6.2 API Response Caching

**Tasks:**
- [ ] Tambahkan caching untuk data yang jarang berubah:
  ```ts
  // nuxt.config.ts → nitro.routeRules
  nitro: {
    routeRules: {
      '/api/master/vendors': { swr: 60 },        // Cache 60 detik
      '/api/master/product-models': { swr: 60 },
      '/api/master/defects': { swr: 60 },
      '/api/reports/**': { swr: 300 },            // Cache 5 menit
    }
  }
  ```
- [ ] Implement cache invalidation: saat master data di-update, purge related cache
- [ ] Untuk reports yang expensive: pertimbangkan materialized views atau pre-computed aggregates

### 6.3 Pagination & Lazy Loading

**Tasks:**
- [ ] Verifikasi semua list endpoints return pagination metadata ✓
- [ ] Pastikan default limit = 20, max limit = 100 ✓
- [ ] Report endpoints yang return large datasets: tambahkan streaming response option atau server-side pagination
- [ ] Excel export (`/api/vendor-claims/:id/export`): gunakan streaming untuk large exports

---

## Fase 7 — File Upload & Storage

**Tujuan:** Claim photos bisa di-upload, disimpan, dan diakses secara aman.

### 7.1 Storage Layer

**Tasks:**
- [ ] Buat `server/utils/storage.ts`:
  ```ts
  import { createStorage } from 'unstorage'
  import fsDriver from 'unstorage/drivers/fs'
  import { randomUUID } from 'crypto'
  import path from 'path'

  const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
  const MAX_FILE_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024

  const storage = createStorage({
    driver: fsDriver({ base: UPLOAD_DIR })
  })

  export interface UploadResult {
    filename: string        // UUID-based filename
    originalName: string
    mimeType: string
    size: number
    path: string            // Relative path from UPLOAD_DIR
  }

  export async function saveUpload(
    file: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    // Validate
    if (file.length > MAX_FILE_SIZE) throw new Error('FILE_TOO_LARGE')
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) throw new Error('INVALID_FILE_TYPE')

    // Generate safe filename
    const ext = path.extname(originalName).toLowerCase()
    const filename = `${randomUUID()}${ext}`
    const datePath = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const fullPath = `${datePath}/${filename}`

    await storage.setItemRaw(fullPath, file)

    return { filename, originalName, mimeType, size: file.length, path: fullPath }
  }

  const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp'
  ]
  ```

### 7.2 Photo Upload API

**Tasks:**
- [ ] Verifikasi/update `POST /api/cs/claims/:id/photos` endpoint:
  - Accept `multipart/form-data`
  - Validate: file type (JPEG/PNG/WebP only), max size (10MB), max count per claim
  - Save file via storage utility
  - Create `claimPhoto` record dengan `filePath` pointing ke stored file
  - Return photo metadata
- [ ] Buat `GET /api/uploads/:path` endpoint untuk serve files:
  - Check auth (user harus login)
  - Check ownership (optional: user hanya bisa lihat foto claim-nya)
  - Stream file dari storage
  - Set proper `Content-Type` dan caching headers
- [ ] Buat `DELETE /api/cs/claims/:id/photos/:photoId` (jika belum ada):
  - Hapus file dari storage
  - Soft-delete atau hard-delete record dari DB
  - Hanya boleh untuk claim status DRAFT atau NEED_REVISION

### 7.3 Image Processing (Optional tapi Recommended)

**Tasks:**
- [ ] Install `sharp` untuk image processing: `pnpm add sharp`
- [ ] Compress/resize uploaded images:
  - Max dimension: 2048px (preserve aspect ratio)
  - Quality: 85% JPEG
  - Generate thumbnail (300px) untuk list views
- [ ] Store both original dan thumbnail paths di `claimPhoto` record
- [ ] Serve thumbnail untuk list/grid views, original untuk detail/lightbox

---

## Fase 8 — Testing

**Tujuan:** Confidence level tinggi bahwa semua API endpoint bekerja sesuai spec.

### 8.1 Setup Testing Framework

**Tasks:**
- [ ] Install Vitest + test utilities:
  ```bash
  pnpm add -D vitest @nuxt/test-utils happy-dom
  ```
- [ ] Tambahkan script di `package.json`:
  ```json
  {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
  ```
- [ ] Buat `vitest.config.ts`:
  ```ts
  import { defineConfig } from 'vitest/config'

  export default defineConfig({
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      setupFiles: ['tests/setup.ts'],
      globals: true
    }
  })
  ```
- [ ] Buat `tests/setup.ts`: setup test database (in-memory SQLite), seed minimal data

### 8.2 Unit Tests — Services & Utils

**Target: Semua business logic di service layer.**

```
tests/
  unit/
    services/
      claim.service.test.ts
      claim-review.service.test.ts
      vendor-claim.service.test.ts
      sequence.service.test.ts
      vendor.service.test.ts
      notification.service.test.ts
    utils/
      status-transitions.test.ts
      pagination.test.ts
      fiscal.test.ts
      sanitize.test.ts
```

**Priority test cases:**
- [ ] Claim status transitions: semua valid transitions, reject invalid ones
- [ ] Sequence generation: concurrent access, format correctness, no duplicates
- [ ] Fiscal period: edge cases (Jan 1, Mar 31, Apr 1, Sep 30, Oct 1, Dec 31)
- [ ] Pagination: edge cases (page 0, negative, beyond total)
- [ ] Validation schemas: valid input passes, invalid input fails with correct error

### 8.3 Integration Tests — API Routes

**Target: Semua endpoints di-test end-to-end.**

```
tests/
  integration/
    auth.test.ts           # Login, logout, session, change-password
    master-vendors.test.ts # CRUD + status toggle
    master-defects.test.ts
    master-models.test.ts
    master-notifications.test.ts
    cs-claims.test.ts      # Create, update, submit, revision flow
    claim-review.test.ts   # QRCC review workflow
    vendor-claims.test.ts  # Batch creation, item decisions
    reports.test.ts        # All report endpoints
    audit-trail.test.ts
    users.test.ts          # CRUD + auth guards
```

**Per test file pattern:**
```ts
describe('POST /api/master/vendors', () => {
  it('should create a vendor when admin', async () => { ... })
  it('should return 403 when CS role', async () => { ... })
  it('should return 401 when unauthenticated', async () => { ... })
  it('should return 422 for invalid input', async () => { ... })
  it('should return 409 for duplicate code', async () => { ... })
})
```

### 8.4 Coverage Target

| Layer | Target |
|---|---|
| Utils/shared | > 95% |
| Services | > 85% |
| API Routes | > 80% |
| Repositories | > 70% (mostly tested through integration) |

---

## Fase 9 — Database Production Readiness

**Tujuan:** Database migration, backup, dan recovery strategy yang solid.

### 9.1 Migration Strategy

**Tasks:**
- [ ] Verifikasi migration files sudah generated dan up-to-date:
  ```bash
  pnpm db:generate  # Generate migration SQL
  pnpm db:migrate   # Apply migrations
  ```
- [ ] Buat migration untuk perubahan schema baru (audit_log table, new indexes, etc.)
- [ ] Dokumentasikan migration procedure di `DEPLOYMENT.md`
- [ ] **JANGAN PAKAI `db:push` di production** — selalu gunakan `db:migrate`

### 9.2 Backup Strategy

**Tasks:**
- [ ] Buat backup script `scripts/backup-db.sh`:
  ```bash
  #!/bin/bash
  BACKUP_DIR="./backups"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  mkdir -p $BACKUP_DIR
  cp local.db "$BACKUP_DIR/backup_${TIMESTAMP}.db"
  # Retain last 30 backups
  ls -t $BACKUP_DIR/backup_*.db | tail -n +31 | xargs rm -f 2>/dev/null
  echo "Backup created: backup_${TIMESTAMP}.db"
  ```
- [ ] Untuk production: schedule backup via cron (daily + before deploy)
- [ ] Test restore procedure: backup → wipe → restore → verify data integrity

### 9.3 Data Seeding untuk Different Environments

**Tasks:**
- [ ] Refactor `seed.ts` menjadi environment-aware:
  - `seed:dev` — Full dummy data (4 users, sample claims, vendor claims, dll)
  - `seed:staging` — Minimal master data + admin user only
  - `seed:prod` — Hanya admin user initial setup
- [ ] Buat `scripts/seed-demo-data.ts` terpisah untuk data demo yang lebih kaya (50+ claims, multiple fiscal periods, semua status)

### 9.4 Database Upgrade Path (Future)

**Catatan untuk scaling ke depan jika SQLite tidak cukup:**
- SQLite cocok untuk < 100 concurrent users dan < 10GB data
- Jika perlu upgrade: Drizzle ORM support PostgreSQL dan MySQL
- Migration path: export SQLite → import PostgreSQL menggunakan `pgloader` atau custom script
- Schema sudah portable karena menggunakan Drizzle abstraction layer

---

## Fase 10 — Deployment & DevOps

**Tujuan:** Aplikasi bisa di-deploy ke production environment dengan confidence.

### 10.1 Production Build Configuration

```
File: nuxt.config.ts
```

**Tasks:**
- [ ] Tambahkan Nitro production settings:
  ```ts
  nitro: {
    preset: 'node-server', // atau 'bun', 'deno', sesuai platform
    compressPublicAssets: true,
    minify: true,
    timing: false, // disable di production
    storage: {
      'rate-limit': { driver: 'memory' },
      'cache': { driver: 'memory' }
    }
  }
  ```
- [ ] Tambahkan runtime config untuk secrets:
  ```ts
  runtimeConfig: {
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    dbFileName: process.env.DB_FILE_NAME,
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    public: {
      appName: 'RMA Portal',
      appVersion: '1.0.0'
    }
  }
  ```
- [ ] Verifikasi build berhasil tanpa error: `pnpm build`
- [ ] Test production build: `pnpm preview`

### 10.2 Dockerfile

```
File: Dockerfile (baru)
```

**Tasks:**
- [ ] Buat multi-stage Dockerfile:
  ```dockerfile
  # Build stage
  FROM node:20-alpine AS builder
  RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install --frozen-lockfile
  COPY . .
  RUN pnpm build

  # Production stage
  FROM node:20-alpine AS runner
  RUN apk add --no-cache sqlite-libs
  WORKDIR /app
  COPY --from=builder /app/.output ./.output
  COPY --from=builder /app/server/database/migrations ./migrations

  # Create directories
  RUN mkdir -p /app/data /app/uploads

  ENV NODE_ENV=production
  ENV DB_FILE_NAME=file:/app/data/rma.db
  ENV UPLOAD_DIR=/app/uploads
  ENV HOST=0.0.0.0
  ENV PORT=3000

  EXPOSE 3000

  CMD ["node", ".output/server/index.mjs"]
  ```
- [ ] Buat `.dockerignore`:
  ```
  node_modules/
  .output/
  .nuxt/
  local.db
  uploads/
  backups/
  .env
  ```

### 10.3 Docker Compose (Development)

```
File: docker-compose.yml (baru)
```

**Tasks:**
- [ ] Buat docker-compose untuk dev/staging:
  ```yaml
  version: '3.8'
  services:
    app:
      build: .
      ports:
        - "3000:3000"
      volumes:
        - db-data:/app/data
        - uploads:/app/uploads
      environment:
        - DB_FILE_NAME=file:/app/data/rma.db
        - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
        - BETTER_AUTH_URL=http://localhost:3000
        - UPLOAD_DIR=/app/uploads
      restart: unless-stopped

  volumes:
    db-data:
    uploads:
  ```

### 10.4 CI/CD Pipeline

**Tasks:**
- [ ] Buat `.github/workflows/ci.yml`:
  ```yaml
  name: CI
  on: [push, pull_request]
  jobs:
    lint-and-typecheck:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: pnpm }
        - run: pnpm install --frozen-lockfile
        - run: pnpm lint
        - run: pnpm typecheck

    test:
      runs-on: ubuntu-latest
      needs: lint-and-typecheck
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with: { node-version: 20, cache: pnpm }
        - run: pnpm install --frozen-lockfile
        - run: pnpm test:run
        - run: pnpm build
  ```
- [ ] Buat `.github/workflows/deploy.yml` untuk auto-deploy ke staging/production

---

## Fase 11 — Dependency Cleanup & Maintenance

### 11.1 Remove Deprecated Dependencies

**Tasks:**
- [ ] Migrate `drizzle-zod` → `drizzle-orm/zod` (sudah di Fase 3.1)
- [ ] Remove `drizzle-zod` dari `package.json`
- [ ] Audit `pnpm audit` untuk security vulnerabilities
- [ ] Update dependencies ke latest compatible versions

### 11.2 Code Quality

**Tasks:**
- [ ] Jalankan `pnpm lint:fix` dan resolve semua warnings
- [ ] Jalankan `pnpm typecheck` dan resolve semua errors
- [ ] Remove semua `// TODO` comments yang sudah terselesaikan
- [ ] Remove semua commented-out code
- [ ] Pastikan semua file mengikuti `.editorconfig` rules

### 11.3 Documentation

**Tasks:**
- [ ] Update `CLAUDE.md` dengan backend architecture dan endpoint catalog terbaru
- [ ] Buat `DEPLOYMENT.md` dengan deployment procedure step-by-step
- [ ] Buat `API.md` atau gunakan Swagger/OpenAPI auto-generation dari Zod schemas
- [ ] Update `prd.md` → mark completed items, remove outdated sections

---

## Checklist Final

### Pre-Production Checklist

```
Auth & Session
  [ ] Login flow works end-to-end (browser → Better-Auth → DB → session cookie)
  [ ] Logout properly invalidates session
  [ ] Session persists across page refresh
  [ ] Role-based access control enforced on all endpoints
  [ ] Password change invalidates old sessions

Data Layer
  [ ] All schema migrations applied cleanly
  [ ] All foreign key constraints verified
  [ ] Seed script creates proper account records
  [ ] Optimistic locking on claim status changes
  [ ] No N+1 queries in list endpoints

Frontend Integration
  [ ] Zero mock data references in production code
  [ ] All pages call real API endpoints
  [ ] Loading states displayed during API calls
  [ ] Error states handled gracefully
  [ ] Form validation matches backend Zod schemas

Security
  [ ] No secrets in git history
  [ ] .env.example exists with placeholder values
  [ ] Security headers set (HSTS, X-Frame-Options, etc.)
  [ ] Rate limiting on all write endpoints
  [ ] Input sanitization on all text fields
  [ ] File upload validates type, size, and content
  [ ] CORS configured for production domain only

Observability
  [ ] Health check endpoint responds correctly
  [ ] Structured logging in all services
  [ ] Audit trail captures all write operations
  [ ] Error responses are consistent and informative

Performance
  [ ] SQLite WAL mode enabled
  [ ] Database indexes cover all query patterns
  [ ] API response caching for reference data
  [ ] Pagination enforced on all list endpoints

Deployment
  [ ] `pnpm build` succeeds without errors
  [ ] `pnpm preview` works correctly
  [ ] Dockerfile tested and working
  [ ] Backup/restore procedure documented and tested
  [ ] CI pipeline runs lint, typecheck, tests, and build

Testing
  [ ] Unit tests for all services and utils
  [ ] Integration tests for all API endpoints
  [ ] Auth flow tested (login, logout, role guards, session expiry)
  [ ] Claim lifecycle tested end-to-end
  [ ] Coverage meets target thresholds
```

---

## Prioritas & Timeline Rekomendasi

```
Sprint 1 (3-4 hari) — CRITICAL PATH
├── Fase 1: Auth & Seed Fix
│   ├── 1.1 Fix seed script (account records)
│   ├── 1.2 Wire useAuthSession ke real API
│   ├── 1.3 Wire useDashboardStore ke real auth
│   └── 1.4 Buat .env.example
└── Fase 4.4: Secrets management (.gitignore, rotate)

Sprint 2 (5-7 hari) — FRONTEND WIRING
├── Fase 2.1: Master data pages (4 pages)
├── Fase 2.2: User management pages (2 pages)
├── Fase 2.3: Vendor claims pages (3 pages)
├── Fase 2.4: Report pages (7 pages)
├── Fase 2.5: Audit trail page
├── Fase 2.6: Settings & profile pages
├── Fase 2.7: CS reference data wiring
└── Fase 2.8: Cleanup mock data

Sprint 3 (3-4 hari) — HARDENING
├── Fase 3.1: Migrate drizzle-zod
├── Fase 3.2: Input sanitization
├── Fase 3.3: DB constraints review
├── Fase 3.4: Concurrency protection
├── Fase 4.1: Route authorization matrix
├── Fase 4.2: Security headers
├── Fase 4.3: Rate limiting
└── Fase 4.5: Session security

Sprint 4 (3-4 hari) — OBSERVABILITY & FILES
├── Fase 5.1: Structured error response
├── Fase 5.2: Audit trail backend logging
├── Fase 5.3: Application logging
├── Fase 5.4: Health check
├── Fase 6.1: Query optimization
├── Fase 6.2: API caching
└── Fase 7: File upload & storage

Sprint 5 (4-5 hari) — TESTING & DEPLOYMENT
├── Fase 8: Full testing suite
├── Fase 9: Database production readiness
├── Fase 10: Deployment & DevOps
└── Fase 11: Cleanup & documentation

Total estimasi: 18-24 hari kerja
```

---

> **Catatan:** Dokumen ini adalah living document. Update status checklist seiring progress. Setiap fase bisa dikerjakan secara paralel oleh engineer berbeda selama dependency antar fase diperhatikan (terutama Fase 1 harus selesai duluan karena blocking semua frontend wiring).
