# Task Card: Fix shared/types & shared/utils Issues

## Task: Perbaiki Type Definitions & Constants di Shared Layer

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit:
  - `shared/types/database.ts`
  - `shared/utils/constants.ts`
- File referensi (baca dulu sebelum mulai):
  - `server/database/schema/index.ts` — barrel file, lihat semua exported table variables
  - `server/database/schema/claim.ts` — schema `claim` table
  - `server/database/schema/claim-photo.ts` — schema `claimPhoto` table
  - `server/database/schema/claim-history.ts` — schema `claimHistory` table
  - `server/database/schema/vendor-claim.ts` — schema `vendorClaim` table
  - `server/database/schema/vendor-claim-item.ts` — schema `vendorClaimItem` table
  - `server/database/schema/photo-review.ts` — schema `photoReview` table
  - `server/database/schema/sequence-generator.ts` — schema `sequenceGenerator` table
  - `CLAUDE.md` — project conventions

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle `'never'`, braceStyle `'1tbs'`
- IKUTI pattern yang sudah ada di file persis — lihat cara master table types didefinisikan (Select + Insert pairs)
- JANGAN hapus type yang sudah ada. Hanya TAMBAHKAN yang kurang dan PERBAIKI yang salah.
- JANGAN ubah file schema (`server/database/schema/*`) — hanya edit file di `shared/`

### Existing Pattern (IKUTI PERSIS)
Baca `shared/types/database.ts` baris 30-47 dan perhatikan pattern ini:
```ts
// Vendor
export type Vendor = InferSelectModel<typeof vendor>
export type NewVendor = InferInsertModel<typeof vendor>
```
Semua type baru HARUS mengikuti pattern `Select` + `New` (insert) ini persis.

### Instruksi

**A. `shared/types/database.ts` — Tambah Transaction Table Types (CRITICAL)**

1. Tambahkan import untuk semua transaction table variables yang belum ada:
   ```ts
   import type {
     // ... existing imports ...

     // Transaction tables
     claim,
     claimPhoto,
     claimHistory,
     vendorClaim,
     vendorClaimItem,
     photoReview,
     sequenceGenerator
   } from '../../server/database/schema/index'
   ```

2. Tambahkan section baru `// TRANSACTION TABLE TYPES` setelah section AUTH, dengan types:
   ```ts
   // Claim
   export type Claim = InferSelectModel<typeof claim>
   export type NewClaim = InferInsertModel<typeof claim>

   // ClaimPhoto
   export type ClaimPhoto = InferSelectModel<typeof claimPhoto>
   export type NewClaimPhoto = InferInsertModel<typeof claimPhoto>

   // ClaimHistory
   export type ClaimHistory = InferSelectModel<typeof claimHistory>
   export type NewClaimHistory = InferInsertModel<typeof claimHistory>

   // VendorClaim
   export type VendorClaim = InferSelectModel<typeof vendorClaim>
   export type NewVendorClaim = InferInsertModel<typeof vendorClaim>

   // VendorClaimItem
   export type VendorClaimItem = InferSelectModel<typeof vendorClaimItem>
   export type NewVendorClaimItem = InferInsertModel<typeof vendorClaimItem>

   // PhotoReview
   export type PhotoReview = InferSelectModel<typeof photoReview>
   export type NewPhotoReview = InferInsertModel<typeof photoReview>

   // SequenceGenerator
   export type SequenceGenerator = InferSelectModel<typeof sequenceGenerator>
   export type NewSequenceGenerator = InferInsertModel<typeof sequenceGenerator>
   ```

**B. `shared/types/database.ts` — Perbaiki Union Types (MEDIUM)**

3. Tambahkan `TransactionTable` union type baru:
   ```ts
   export type TransactionTable
     = | Claim
       | ClaimPhoto
       | ClaimHistory
       | VendorClaim
       | VendorClaimItem
       | PhotoReview
       | SequenceGenerator
   ```

4. Update `DatabaseTable` agar mencakup transaction tables:
   ```ts
   export type DatabaseTable = MasterTable | UserTable | TransactionTable
   ```

5. Perluas `StatusTable` — tambahkan entity lain yang punya status field:
   ```ts
   export type StatusTable
     = | NotificationMaster
       | Claim        // punya field 'status'
       | VendorClaim  // punya field 'status'
   ```

6. Perluas `SoftDeleteTable` — tambahkan transaction tables yang punya `isActive`:
   Cek dulu apakah transaction tables punya `isActive`. Jika TIDAK ada yang punya, biarkan `SoftDeleteTable` apa adanya.

7. Perluas `TimestampedTable` — tambahkan transaction tables yang punya `createdAt`/`updatedAt`:
   ```ts
   export type TimestampedTable
     = | Vendor
       | ProductModel
       | NotificationMaster
       | DefectMaster
       | Claim
       | ClaimPhoto
       | ClaimHistory
       | VendorClaim
       | VendorClaimItem
       | PhotoReview
   ```
   (Cek schema dulu — hanya tambahkan yang benar-benar punya kedua field `createdAt` DAN `updatedAt`)

**C. `shared/types/database.ts` — Hapus Leaky Re-export (LOW)**

8. Hapus baris terakhir:
   ```ts
   // HAPUS baris ini:
   export * from '../utils/constants'
   ```
   TAPI sebelum hapus, cek dulu apakah ada file lain yang import constants dari `shared/types/database`. Jalankan:
   ```bash
   grep -r "from.*shared/types/database" --include="*.ts" --include="*.vue" -l
   ```
   Untuk setiap file yang ditemukan, cek apakah ia import constant (bukan type). Jika ada yang import constant dari path ini, ubah import-nya ke `shared/utils/constants` langsung. Baru kemudian hapus re-export-nya.

**D. `shared/utils/constants.ts` — Pindahkan Password ke Env (MEDIUM)**

9. Ganti hardcoded password:
   ```ts
   // SEBELUM:
   export const DEFAULT_INITIAL_PASSWORD = 'sharp1234'

   // SESUDAH:
   export const DEFAULT_INITIAL_PASSWORD = process.env.DEFAULT_SEED_PASSWORD || 'sharp1234'
   ```
   Ini memastikan production bisa override via env var, tapi dev tetap jalan tanpa `.env`.

10. Jika file `.env.example` ada di root project, tambahkan entry:
    ```
    # Seed script password (default: sharp1234)
    DEFAULT_SEED_PASSWORD=sharp1234
    ```

### Expected Output
- `shared/types/database.ts` memiliki Select + Insert types untuk SEMUA 7 transaction tables
- `TransactionTable` union type baru tersedia
- `StatusTable` mencakup `Claim` dan `VendorClaim`
- `TimestampedTable` mencakup transaction tables yang relevan
- `DatabaseTable` mencakup seluruh master + auth + transaction tables
- Tidak ada lagi `export * from '../utils/constants'` di `database.ts` (import constants langsung dari source-nya)
- `DEFAULT_INITIAL_PASSWORD` bisa di-override via environment variable
- Semua file yang sebelumnya import constants dari `shared/types/database` sudah di-update import path-nya

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Jalankan: `grep -r "from.*shared/types/database" --include="*.ts" -l` lalu verifikasi tidak ada yang import runtime values (constants/functions) dari path ini — hanya type imports
