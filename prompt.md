# Database Schema Fix — Task Cards

> **Instruksi:** Jalankan task card satu per satu secara berurutan.
> Setiap task sudah self-contained. Baca CLAUDE.md di root untuk project context.
>
> **Urutan eksekusi:** Task 1 → 2 → 3 → 4 → 5 → 6 → 7

---

## Task 1: Fix Column Defaults & Constraints (H-DB1, M-DB5, L-DB1, L-DB7) (DONE)

### File yang diedit
- `server/database/schema/auth.ts`
- `server/database/index.ts`

### Instruksi

Baca `server/database/schema/auth.ts` lalu lakukan 3 fix:

**1a. `session.updatedAt` (line ~47) — tambah `.default()`:**
```
// SEBELUM:
updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
  .$onUpdate(() => new Date())
  .notNull(),

// SESUDAH:
updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
  .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
  .$onUpdate(() => new Date())
  .notNull(),
```

**1b. `account.updatedAt` (line ~83) — tambah `.default()` sama persis:**
```
// SEBELUM:
updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
  .$onUpdate(() => new Date())
  .notNull()

// SESUDAH:
updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
  .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
  .$onUpdate(() => new Date())
  .notNull()
```

**1c. `user.role` (line ~24) — tambah default role:**
```
// SEBELUM:
role: text('role').$type<UserRole>(),

// SESUDAH:
role: text('role').$type<UserRole>().default('CS'),
```

**1d. `user.banned` (line ~25) — tambah `.notNull()`:**
```
// SEBELUM:
banned: integer('banned', { mode: 'boolean' }).default(false),

// SESUDAH:
banned: integer('banned', { mode: 'boolean' }).default(false).notNull(),
```

**1e. Baca `server/database/index.ts` — hapus redundant `!` assertion:**
```
// SEBELUM:
const db = drizzle({ connection: { url: process.env.DB_FILE_NAME! || 'file:local.db' }, schema })

// SESUDAH:
const db = drizzle({ connection: { url: process.env.DB_FILE_NAME || 'file:local.db' }, schema })
```

### Validation
```bash
pnpm typecheck && pnpm lint
```

---

## Task 2: Hapus Duplicate Indexes (H-DB3, H-DB4)

### Context
Beberapa column punya `.unique()` pada column definition (yang otomatis buat index) DAN juga punya explicit `uniqueIndex()` di table indexes — menghasilkan 2 index identik. Hapus `.unique()` dari column, pertahankan explicit `uniqueIndex()`.

### File yang diedit
- `server/database/schema/vendor.ts`
- `server/database/schema/defect-master.ts`
- `server/database/schema/claim.ts`
- `server/database/schema/vendor-claim.ts`
- `server/database/schema/notification-master.ts`
- `server/database/schema/vendor-claim-item.ts`

### Instruksi

Baca setiap file, lalu hapus `.unique()` dari column definition jika column tersebut SUDAH punya explicit `uniqueIndex()` di bagian indexes.

**vendor.ts:**
```
// SEBELUM:
code: text().notNull().unique(),
// SESUDAH (hapus .unique() karena sudah ada uniqueIndex('vendor_code_idx')):
code: text().notNull(),
```

**defect-master.ts:**
```
// SEBELUM:
code: text().notNull().unique(),
name: text().notNull().unique(),
// SESUDAH (hapus .unique() karena ada uniqueIndex untuk keduanya):
code: text().notNull(),
name: text().notNull(),
```

**claim.ts:**
```
// SEBELUM:
claimNumber: text().notNull().unique(),
// SESUDAH:
claimNumber: text().notNull(),
```

**vendor-claim.ts:**
```
// SEBELUM:
vendorClaimNo: text().notNull().unique(),
// SESUDAH:
vendorClaimNo: text().notNull(),
```

**notification-master.ts:**
```
// SEBELUM:
notificationCode: text().notNull().unique(),
// SESUDAH:
notificationCode: text().notNull(),
```

**vendor-claim-item.ts — hapus redundant non-unique index (H-DB4):**
Column `claimId` punya `index('vendor_claim_item_claim_idx')` DAN `uniqueIndex('vendor_claim_item_claim_unique_idx')`. Unique index sudah cukup.
```
// SEBELUM (di bagian indexes):
  index('vendor_claim_item_vendor_claim_idx').on(table.vendorClaimId),
  index('vendor_claim_item_claim_idx').on(table.claimId),
  uniqueIndex('vendor_claim_item_claim_unique_idx').on(table.claimId)

// SESUDAH (hapus baris index non-unique pada claimId):
  index('vendor_claim_item_vendor_claim_idx').on(table.vendorClaimId),
  uniqueIndex('vendor_claim_item_claim_unique_idx').on(table.claimId)
```

### Validation
```bash
pnpm typecheck && pnpm lint
```

---

## Task 3: Tambah FK Constraints pada User Reference Columns (H-DB2)

### Context
Semua column `createdBy`, `updatedBy`, `submittedBy`, `userId`, `reviewedBy`, `vendorDecisionBy` menyimpan `user.id` tapi tidak ada FK constraint. Tambahkan `.references(() => user.id, { onDelete: 'restrict' })`.

### File yang diedit (9 file)
- `server/database/schema/claim.ts`
- `server/database/schema/claim-history.ts`
- `server/database/schema/vendor.ts`
- `server/database/schema/vendor-claim.ts`
- `server/database/schema/vendor-claim-item.ts`
- `server/database/schema/product-model.ts`
- `server/database/schema/defect-master.ts`
- `server/database/schema/notification-master.ts`
- `server/database/schema/photo-review.ts`

### Instruksi

Di setiap file, import `user` table lalu tambahkan `.references(() => user.id, { onDelete: 'restrict' })` pada semua column yang menyimpan `user.id`.

**Pattern yang sama untuk semua file:**
```ts
import { user } from './auth'

// Pada setiap column yang ada komentar "// references user.id":
// SEBELUM:
submittedBy: text().notNull(), // references user.id
// SESUDAH:
submittedBy: text().notNull().references(() => user.id, { onDelete: 'restrict' }),
```

**Daftar lengkap column per file:**

| File | Columns |
|------|---------|
| `claim.ts` | `submittedBy`, `updatedBy` |
| `claim-history.ts` | `userId` |
| `vendor.ts` | `createdBy`, `updatedBy` |
| `vendor-claim.ts` | `createdBy`, `updatedBy` |
| `vendor-claim-item.ts` | `vendorDecisionBy` (NULLABLE — jangan tambah notNull) |
| `product-model.ts` | `createdBy`, `updatedBy` |
| `defect-master.ts` | `createdBy`, `updatedBy` |
| `notification-master.ts` | `createdBy`, `updatedBy` |
| `photo-review.ts` | `reviewedBy` |

**PENTING:**
- `vendor-claim-item.vendorDecisionBy` nullable — gunakan `.references(() => user.id, { onDelete: 'restrict' })` TANPA `.notNull()`
- Hapus komentar `// references user.id` setelah FK ditambahkan (sudah self-documenting)
- Jika file sudah import dari `./vendor` atau `./claim`, tambahkan `user` import dari `./auth` sebagai import baru

### Validation
```bash
pnpm typecheck && pnpm lint
```

---

## Task 4: Standardisasi Timestamp & Zod Patterns (M-DB1, M-DB6, L-DB2)

### Context
- Auth tables pakai `(cast(unixepoch('subsecond') * 1000 as integer))` — sub-second
- Business tables pakai `(unixepoch() * 1000)` — second precision
- Standardisasi semua ke `(unixepoch() * 1000)` yang lebih simple dan cukup

### File yang diedit
- `server/database/schema/auth.ts`
- `server/database/schema/claim-photo.ts`

### Instruksi

**4a. `auth.ts` — ganti semua timestamp default ke format simple:**

Cari SEMUA occurrence dari:
```
sql`(cast(unixepoch('subsecond') * 1000 as integer))`
```
Ganti dengan:
```
sql`(unixepoch() * 1000)`
```

Ada 6 occurrences di `auth.ts` (user 2x, session 1x, account 1x, verification 2x). Ganti SEMUA.

**4b. `claim-photo.ts` — ganti hardcoded string default ke constant:**

Baca `server/database/schema/claim-photo.ts`. Pada column `status`:
```
// SEBELUM:
status: text().notNull().default('PENDING').$type<ClaimPhotoStatus>(),

// SESUDAH (import CLAIM_PHOTO_STATUSES sudah ada di file):
status: text().notNull().default(CLAIM_PHOTO_STATUSES[0]).$type<ClaimPhotoStatus>(),
```

Verifikasi dulu bahwa `CLAIM_PHOTO_STATUSES[0]` memang `'PENDING'` dengan membaca `shared/utils/constants.ts`. Jika bukan, gunakan index yang benar.

### Validation
```bash
pnpm typecheck && pnpm lint
```

---

## Task 5: Tambah Missing Indexes & Columns (M-DB2, M-DB7, L-DB3, L-DB4, L-DB5)

### File yang diedit
- `server/database/schema/notification-master.ts`
- `server/database/schema/vendor-claim.ts`
- `server/database/schema/sequence-generator.ts`

### Instruksi

**5a. `vendor-claim.ts` — tambah composite index `(vendorId, status)` (M-DB7):**

Di bagian table indexes, tambahkan:
```ts
index('vendor_claim_vendor_status_idx').on(table.vendorId, table.status)
```

**5b. `notification-master.ts` — tambah 2 missing indexes (L-DB4, L-DB5):**

Di bagian table indexes, tambahkan:
```ts
index('notification_master_calendar_ym_idx').on(table.calendarYear, table.calendarMonth),
index('notification_master_fiscal_year_half_idx').on(table.fiscalYear, table.fiscalHalf)
```

**5c. `sequence-generator.ts` — tambah `updatedAt` column (L-DB3):**

Tambahkan import `sql` dari `drizzle-orm` dan `integer` mode timestamp:
```ts
import { sql } from 'drizzle-orm'
```

Tambahkan column `updatedAt` di table definition:
```ts
updatedAt: integer({ mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)
  .$onUpdateFn(() => new Date())
```

**5d. `notification-master.ts` — tambah `isActive` column (M-DB2):**

Tambah column setelah `status`:
```ts
isActive: integer({ mode: 'boolean' }).notNull().default(true),
```

Tambah index:
```ts
index('notification_master_is_active_idx').on(table.isActive)
```

Update Zod schemas:
- `insertNotificationMasterSchema`: tambah `isActive` di `.omit()` (jangan terima saat insert, default true)
- Buat `updateNotificationMasterStatusSchema` baru atau update yang ada agar juga support `isActive` toggle

### Validation
```bash
pnpm typecheck && pnpm lint
```

---

## Task 6: Tambah Drizzle Relations untuk Business Tables (M-DB3)

### Context
Hanya auth tables yang punya `relations()`. Business tables belum bisa pakai Drizzle relational query API. Tambahkan `relations()` untuk semua business tables.

### File yang diedit (10 file)
- `server/database/schema/vendor.ts`
- `server/database/schema/product-model.ts`
- `server/database/schema/defect-master.ts`
- `server/database/schema/notification-master.ts`
- `server/database/schema/claim.ts`
- `server/database/schema/claim-photo.ts`
- `server/database/schema/claim-history.ts`
- `server/database/schema/vendor-claim.ts`
- `server/database/schema/vendor-claim-item.ts`
- `server/database/schema/photo-review.ts`

### Referensi pattern
Baca `server/database/schema/auth.ts` dan lihat bagaimana `userRelations`, `sessionRelations`, `accountRelations` didefinisikan. Ikuti pattern PERSIS.

### Instruksi

Tambahkan `import { relations } from 'drizzle-orm'` dan definisikan `relations()` di setiap file. Nama export: `<tableName>Relations`.

**Daftar relasi yang harus dibuat:**

```ts
// vendor.ts
export const vendorRelations = relations(vendor, ({ many }) => ({
  productModels: many(productModel),
  claims: many(claim),
  vendorClaims: many(vendorClaim),
  notifications: many(notificationMaster)
}))

// product-model.ts
export const productModelRelations = relations(productModel, ({ one, many }) => ({
  vendor: one(vendor, { fields: [productModel.vendorId], references: [vendor.id] }),
  claims: many(claim),
  notifications: many(notificationMaster)
}))

// defect-master.ts (no FK pointing to it, claims reference by code)
// Skip relations jika tidak ada FK-based relation. Atau tambahkan empty jika ingin future-proof.

// notification-master.ts
export const notificationMasterRelations = relations(notificationMaster, ({ one, many }) => ({
  vendor: one(vendor, { fields: [notificationMaster.vendorId], references: [vendor.id] }),
  model: one(productModel, { fields: [notificationMaster.modelId], references: [productModel.id] }),
  claims: many(claim)
}))

// claim.ts
export const claimRelations = relations(claim, ({ one, many }) => ({
  notification: one(notificationMaster, { fields: [claim.notificationId], references: [notificationMaster.id] }),
  model: one(productModel, { fields: [claim.modelId], references: [productModel.id] }),
  vendor: one(vendor, { fields: [claim.vendorId], references: [vendor.id] }),
  photos: many(claimPhoto),
  history: many(claimHistory),
  vendorClaimItem: many(vendorClaimItem)
}))

// claim-photo.ts
export const claimPhotoRelations = relations(claimPhoto, ({ one, many }) => ({
  claim: one(claim, { fields: [claimPhoto.claimId], references: [claim.id] }),
  reviews: many(photoReview)
}))

// claim-history.ts
export const claimHistoryRelations = relations(claimHistory, ({ one }) => ({
  claim: one(claim, { fields: [claimHistory.claimId], references: [claim.id] })
}))

// vendor-claim.ts
export const vendorClaimRelations = relations(vendorClaim, ({ one, many }) => ({
  vendor: one(vendor, { fields: [vendorClaim.vendorId], references: [vendor.id] }),
  items: many(vendorClaimItem)
}))

// vendor-claim-item.ts
export const vendorClaimItemRelations = relations(vendorClaimItem, ({ one }) => ({
  vendorClaim: one(vendorClaim, { fields: [vendorClaimItem.vendorClaimId], references: [vendorClaim.id] }),
  claim: one(claim, { fields: [vendorClaimItem.claimId], references: [claim.id] })
}))

// photo-review.ts
export const photoReviewRelations = relations(photoReview, ({ one }) => ({
  claimPhoto: one(claimPhoto, { fields: [photoReview.claimPhotoId], references: [claimPhoto.id] })
}))
```

**PENTING:**
- Import table references yang diperlukan dari file lain (e.g., `import { claim } from './claim'`)
- JANGAN buat circular import. Jika ada circular dependency, pindahkan relations ke file terpisah `server/database/schema/relations.ts` dan export dari `index.ts`
- Jika ada circular import error saat typecheck, buat file `relations.ts` yang import semua tables dan definisikan semua relations di satu tempat

### Validation
```bash
pnpm typecheck && pnpm lint
```

---

## Task 7: Fix defectCode FK Reference (M-DB4)

### Context
`claim.defectCode` references `defect_master.code` (natural key). Jika defect code diubah, claims yang reference akan inkonsisten. Lebih aman reference ke `defect_master.id`.

### File yang diedit
- `server/database/schema/claim.ts`

### Instruksi

**HANYA lakukan jika team sudah setuju untuk change FK target.** Jika ragu, skip task ini.

```ts
// SEBELUM:
defectCode: text().notNull().references(() => defectMaster.code, { onDelete: 'restrict' }),

// SESUDAH — ganti column name dan FK target:
defectId: integer().notNull().references(() => defectMaster.id, { onDelete: 'restrict' }),
```

Jika column diganti dari `defectCode` (text) ke `defectId` (integer):
1. Update semua Zod schema di file ini (`insertClaimSchema`, `updateClaimSchema`)
2. Grep seluruh codebase untuk `defectCode` dan update semua references
3. Tambah index: `index('claim_defect_idx').on(table.defectId)`
4. Update relations di Task 6 jika sudah dikerjakan

**ALTERNATIF (lebih safe):** Tetap pakai `defectCode` tapi tambahkan ON UPDATE CASCADE:
```ts
defectCode: text().notNull().references(() => defectMaster.code, { onDelete: 'restrict', onUpdate: 'cascade' }),
```

### Validation
```bash
pnpm typecheck && pnpm lint
```

**PENTING:** Setelah semua task selesai, generate migration baru:
```bash
pnpm db:generate
```
Review migration SQL yang dihasilkan untuk memastikan semua perubahan benar.
