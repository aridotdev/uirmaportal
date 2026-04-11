## Task: Extract Business Logic dari `report.repo.ts` ke `report.service.ts`

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- **Problem**: `server/repositories/report.repo.ts` (492 lines) berisi business logic computations yang melanggar layered architecture. `server/services/report.service.ts` (52 lines) hanya proxy call tanpa value-add.
- **Goal**: Repo hanya return raw data dari DB. Service yang melakukan computations (approval rate, lead time rounding, aging bucket fill, acceptance rate).
- File yang akan diedit:
  - `server/repositories/report.repo.ts` — strip business logic, return raw data
  - `server/services/report.service.ts` — pindahkan computations ke sini
- File referensi (baca dulu sebelum mulai):
  - `server/services/vendor.service.ts` — REFERENSI UTAMA pattern service (import repo, business logic di service)
  - `server/repositories/vendor.repo.ts` — REFERENSI UTAMA pattern repo (pure data access)
  - `CLAUDE.md` — project conventions

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- JANGAN ubah return types yang di-expose ke API consumers — interface `ExecutiveKpi`, `ClaimsByBranchRow`, dll HARUS tetap sama.
- JANGAN ubah API endpoints (`server/api/reports/`) — mereka memanggil `reportService`, jadi selama return type service tidak berubah, mereka aman.
- Pindahkan interface types ke service file (karena itu bentuk akhir business object, bukan shape data mentah).
- Repo boleh punya interface sendiri untuk raw data shapes (suffix `Raw`, contoh: `BranchCountsRaw`).

### Business Logic yang HARUS Dipindahkan ke Service

Berikut mapping **spesifik** — lakukan satu per satu:

**1. `getDashboardKpi`** (repo L110-174)
- Repo sekarang: query statusCounts + lead time subquery + vendorPending → hitung `approvalRate`, `avgReviewLeadTimeDays` rounding, assemble object
- **Repo baru**: return 3 raw results: `{ statusCounts, leadTimeAvgRaw, vendorPendingCount }`
  - `statusCounts`: array `{ status: string, count: number }[]`
  - `leadTimeAvgRaw`: raw avg number dari query (jangan round)
  - `vendorPendingCount`: `number`
- **Service baru**: terima raw data → build statusMap → hitung `totalClaims`, `approvalRate` (`Math.round((approved / total) * 10000) / 100`), round `avgReviewLeadTimeDays` → return `ExecutiveKpi`

**2. `getClaimsByBranch`** (repo L212-240)
- Repo sekarang: query counts → `.map()` hitung `approvalRate` per branch
- **Repo baru**: return array raw `{ branch, totalClaims, approvedClaims, rejectedClaims }` — TANPA `approvalRate`
- **Service baru**: `.map()` tambahkan `approvalRate` computation

**3. `getBranchPerformance`** (repo L290-352)
- Repo sekarang: 2 queries (counts + lead times) → build `leadTimeMap` → `.map()` hitung `approvalRate` + merge lead time
- **Repo baru**: return 2 raw arrays: `{ branchCounts, branchLeadTimes }`
  - `branchCounts`: `{ branch, totalClaims, approved, needRevision, inReview }[]`
  - `branchLeadTimes`: `{ branch, avgDays: number | null }[]`
- **Service baru**: build `leadTimeMap`, `.map()` hitung `approvalRate`, merge lead time → return `BranchPerformanceRow[]`

**4. `getVendorPerformance`** (repo L354-412)
- Repo sekarang: 2 queries (claimRows + decisionRows) → build `decisionMap` → `.map()` hitung `acceptanceRate`
- **Repo baru**: return 2 raw arrays: `{ vendorClaims, vendorDecisions }`
  - `vendorClaims`: `{ vendorId, vendorCode, vendorName, totalClaims }[]`
  - `vendorDecisions`: `{ vendorId, acceptedItems, rejectedItems, totalCompensation }[]`
- **Service baru**: build `decisionMap`, hitung `acceptanceRate` (`Math.round((accepted / totalDecided) * 10000) / 100`) → return `VendorPerformanceRow[]`

**5. `getAgingAnalysis`** (repo L414-455)
- Repo sekarang: SQL CASE bucket classification → fill missing buckets with default 0
- **Repo baru**: return raw array `{ bucket: string, count: number }[]` langsung dari query (SQL CASE boleh tetap di repo — itu query concern). HAPUS logika fill missing buckets (L445-454).
- **Service baru**: terima raw buckets → fill missing dengan `bucketOrder` dan default 0 → return `AgingBucket[]`

**6. Methods yang TIDAK perlu diubah** (sudah pure data access):
- `getClaimsByVendor` — repo hanya query + map fields, tidak ada computation
- `getTopDefects` — repo hanya query + map fields
- `getMonthlyTrend` — repo hanya query + map fields
- `getDefectAnalysis` — repo hanya query + map fields
- Service untuk method ini tetap proxy call (acceptable, karena memang tidak ada business logic)

### Instruksi Step-by-Step

1. Baca `server/repositories/report.repo.ts` dan `server/services/report.service.ts` sepenuhnya
2. Baca `server/services/vendor.service.ts` untuk memahami pattern service
3. Di `report.repo.ts`:
   - Untuk method #1-#5 di atas, ubah return type menjadi raw data (buat interface baru suffix `Raw` jika perlu)
   - Hapus semua post-processing: `Math.round()`, `approvalRate` computation, `leadTimeMap` building, `bucketOrder` fill, `decisionMap` building
   - Biarkan SQL queries tetap sama — yang berubah adalah apa yang di-return SETELAH query
4. Di `report.service.ts`:
   - Pindahkan semua interface types (`ExecutiveKpi`, `ClaimsByBranchRow`, `BranchPerformanceRow`, `VendorPerformanceRow`, `AgingBucket`) dari repo ke service
   - Untuk method #1-#5, terima raw data dari repo → lakukan computations → return typed result
   - Method #6 (yang tidak perlu diubah) tetap proxy call
   - Pertahankan `mapReportErrorToHttp` yang sudah ada
5. Update semua imports di file yang menggunakan types dari repo — cari dengan: `grep -r "from.*report.repo" server/`

### Expected Output
- `report.repo.ts` turun signifikan (estimasi ~350 lines) — hanya SQL queries + raw return
- `report.service.ts` naik (estimasi ~150-200 lines) — berisi semua business logic computations
- Semua API endpoints `/api/reports/*` tetap berfungsi identik — return format tidak berubah
- Repo hanya pure data access, service yang memiliki business logic
- Tidak ada perubahan behavior — hanya separation of concerns

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Verifikasi `grep -rn "Math.round\|approvalRate\|acceptanceRate\|bucketOrder\|leadTimeMap\|decisionMap" server/repositories/report.repo.ts` — harus 0 result (semua sudah pindah ke service)
- Verifikasi `grep -rn "from.*report.repo" server/` — pastikan tidak ada file lain yang import types lama yang sudah dipindahkan

- jalankan commit push dan PR
- 