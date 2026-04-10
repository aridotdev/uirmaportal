### 4.3 Issues

#### HIGH

**H-DB1. Missing `updatedAt` default pada `session` dan `account` tables**
- **File**: `server/database/schema/auth.ts` (session ~line 43, account ~line 78)
- `updatedAt` punya `.$onUpdate()` tapi **tidak ada `.default()`**. Column `.notNull()` artinya INSERT tanpa explicit value akan gagal constraint violation.
- `user` dan `verification` tables sudah benar (ada `.default(sql\`...\`)`).
- **Fix**: Tambah `.default(sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`)` pada `updatedAt` di kedua table.

**H-DB2. Missing FK constraints pada semua user reference columns**
- **Files**: `claim.ts` (submittedBy, updatedBy), `claim-history.ts` (userId), `vendor.ts` (createdBy, updatedBy), `vendor-claim.ts` (createdBy, updatedBy), `vendor-claim-item.ts` (vendorDecisionBy), `product-model.ts` (createdBy, updatedBy), `defect-master.ts` (createdBy, updatedBy), `notification-master.ts` (createdBy, updatedBy), `photo-review.ts` (reviewedBy)
- Semua column ini menyimpan `user.id` tapi **tidak ada FK constraint**. Referential integrity tidak enforced di DB level.
- **Fix**: Tambah `.references(() => user.id, { onDelete: 'restrict' })` atau dokumentasikan sebagai keputusan arsitektur.

**H-DB3. Duplicate unique indexes pada columns yang sudah `.unique()`**
- **Files**: `vendor.ts` (code), `defect-master.ts` (name, code), `claim.ts` (claimNumber), `vendor-claim.ts` (vendorClaimNo), `notification-master.ts` (notificationCode)
- Setiap column ini punya `.unique()` (generate auto index) DAN explicit `uniqueIndex()` — menghasilkan **2 index identik** per column.
- Terlihat jelas di migration `0000_melodic_hex.sql` (e.g., `vendor_code_unique` DAN `vendor_code_idx`).
- **Fix**: Hapus salah satu — preferably hapus `.unique()` dari column def dan pertahankan explicit `uniqueIndex()` untuk naming consistency.

**H-DB4. Redundant index pada `vendor_claim_item.claimId`**
- **File**: `server/database/schema/vendor-claim-item.ts` (~line 33-34)
- Ada regular `index()` DAN `uniqueIndex()` pada column `claimId` yang sama. Unique index sudah cukup.
- **Fix**: Hapus non-unique `vendor_claim_item_claim_idx`.

#### MEDIUM

**M-DB1. Inkonsistensi timestamp default expression**
- Auth tables pakai `sql\`(cast(unixepoch('subsecond') * 1000 as integer))\`` (sub-second precision)
- Business tables pakai `sql\`(unixepoch() * 1000)\`` (second precision saja, selalu `xxx000`)
- **Fix**: Standardisasi ke satu approach. `(unixepoch() * 1000)` lebih simple dan cukup.

**M-DB2. `notification_master` tidak punya `isActive` soft-delete column**
- Semua master table lain (`vendor`, `product_model`, `defect_master`) punya `isActive`.
- `notification_master` hanya punya `status` (NEW/USED/EXPIRED) — tidak bisa soft-delete.
- **Fix**: Tambah `isActive` atau dokumentasikan bahwa status lifecycle cukup.

**M-DB3. Tidak ada Drizzle `relations()` untuk business tables**
- Hanya auth tables (user, session, account) yang punya `relations()` definitions.
- Business tables tidak bisa pakai Drizzle relational query API (`db.query.claim.findMany({ with: { vendor: true } })`).
- **Fix**: Tambah `relations()` exports untuk semua business tables.

**M-DB4. `claim.defectCode` FK references `defect_master.code` (natural key) bukan `defect_master.id`**
- **File**: `server/database/schema/claim.ts` (~line 30)
- Jika defect code diubah, semua claims yang reference akan inkonsisten (tidak ada ON UPDATE CASCADE).
- **Fix**: Consider reference ke `defect_master.id` atau tambah ON UPDATE CASCADE.

**M-DB5. `user.role` nullable tanpa default**
- **File**: `server/database/schema/auth.ts` (~line 24)
- User tanpa role (e.g., OAuth signup) akan punya `role = NULL`, menyebabkan masalah role-based access.
- **Fix**: Set default role (e.g., `'CS'`) atau pastikan app layer selalu assign role.

**M-DB6. Inkonsistensi Zod validation untuk date fields**
- `vendor_claim.submittedAt` expect raw number (`z.number().int().positive()`)
- `notification_master.notificationDate` pakai `z.coerce.date().transform(...)` pattern
- **Fix**: Standardisasi date/timestamp Zod validation pattern.

**M-DB7. Missing composite index `(vendorId, status)` pada `vendor_claim`**
- `claim` dan `notification_master` punya composite vendor+status index, tapi `vendor_claim` tidak.
- **Fix**: Tambah `index('vendor_claim_vendor_status_idx').on(table.vendorId, table.status)`.

#### LOW

**L-DB1.** `user.banned` nullable (three-state boolean) — tambah `.notNull()`.
**L-DB2.** `claim_photo.status` default pakai hardcoded string `'PENDING'` bukan constant.
**L-DB3.** `sequence_generator` tidak punya timestamps sama sekali — tambah minimal `updatedAt`.
**L-DB4.** `notification_master` missing `calendar_ym` composite index (claim & vendor_claim punya).
**L-DB5.** `notification_master` missing `fiscalYear + fiscalHalf` composite index (claim punya).
**L-DB6.** Column naming inkonsisten: auth tables pakai explicit snake_case (`'user_id'`), business tables pakai camelCase default — mixed naming di DB.
**L-DB7.** `server/database/index.ts`: redundant `!` assertion pada `process.env.DB_FILE_NAME!` (sudah ada `||` fallback).