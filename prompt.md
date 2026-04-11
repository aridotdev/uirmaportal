## Task: Migrate settingsService dari useStorage('data') ke Database Table (Drizzle ORM)

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- **Problem**: `server/services/settings.service.ts` menyimpan settings via Nitro `useStorage('data')` yang default ke memory storage — settings hilang setiap server restart/deploy/crash.
- **Goal**: Migrate ke database table `app_settings` menggunakan pattern repo-service yang sudah dipakai seluruh codebase.
- File yang akan dibuat (baru):
  - `server/database/schema/app-settings.ts`
  - `server/repositories/settings.repo.ts`
- File yang akan diedit:
  - `server/database/schema/index.ts` — tambah export
  - `server/services/settings.service.ts` — rewrite pakai repo
  - `server/utils/error-codes.ts` — tambah error code settings jika perlu
- File referensi (baca dulu sebelum mulai):
  - `server/database/schema/vendor.ts` — REFERENSI UTAMA pattern schema (table def, Zod, types)
  - `server/repositories/vendor.repo.ts` — REFERENSI UTAMA pattern repository
  - `server/services/vendor.service.ts` — REFERENSI UTAMA pattern service
  - `server/api/settings/index.get.ts` — consumer GET (JANGAN ubah, pastikan tetap kompatibel)
  - `server/api/settings/index.put.ts` — consumer PUT (JANGAN ubah, pastikan tetap kompatibel)
  - `server/database/index.ts` — database import pattern
  - `server/utils/error-codes.ts` — error code pattern
  - `CLAUDE.md` — project conventions

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- IKUTI pattern file referensi PERSIS — naming, import style, export style.
- JANGAN ubah file API endpoints (`server/api/settings/`). Return type service HARUS tetap kompatibel dengan consumer existing.
- Schema: Drizzle `sqliteTable` + `drizzle-zod` (`createInsertSchema`, `createSelectSchema`)
- Repository: pure data access, no business logic
- Service: business logic, call repository, throw errors dari ErrorCode

### Existing Pattern (IKUTI PERSIS)
Baca `server/database/schema/vendor.ts`:
- Table: `sqliteTable('table_name', { ...columns }, table => [indexes])`
- Columns: `integer().primaryKey({ autoIncrement: true })`, `text().notNull()`, timestamp `integer({ mode: 'timestamp_ms' })` dengan `default(sql\`(unixepoch() * 1000)\`)`
- Zod: `createInsertSchema(table, { ...overrides }).omit({ id: true, createdAt: true })`
- Types: `type X = typeof table.$inferSelect`

Baca `server/repositories/vendor.repo.ts`:
- Import: `import db from '#server/database'`
- Object-based: `export const vendorRepo = { async findAll() { ... }, async findById() { ... } }`
- Return pattern: `rows[0] ?? null`

Baca `server/services/vendor.service.ts`:
- Import repo + ErrorCode + buildPaginationMeta
- Object-based: `export const vendorService = { ... }`
- Error: `throw new Error(ErrorCode.NOT_FOUND)`
- Export helper: `export function mapXxxErrorToHttp(error: unknown)`

### Instruksi

**1. Buat `server/database/schema/app-settings.ts`**

Buat tabel `app_settings` dengan design key-value per-group (1 row per settings group):

```
Kolom:
- id: integer primary key auto increment
- key: text not null, unique — settings group key (e.g. 'general', 'claim', 'auditTrail')
- value: text({ mode: 'json' }) not null — JSON value untuk group tersebut
- updatedBy: text not null — references user.id
- updatedAt: integer({ mode: 'timestamp_ms' }) not null, default now
- createdAt: integer({ mode: 'timestamp_ms' }) not null, default now
```

Indexes: `uniqueIndex` pada `key`.

Buat juga Zod schemas dan type exports mengikuti pattern vendor.ts.

**2. Edit `server/database/schema/index.ts`**

Tambahkan: `export * from './app-settings'`

**3. Buat `server/repositories/settings.repo.ts`**

Ikuti pattern `vendor.repo.ts` PERSIS. Methods:

- `findByKey(key: string)` — select satu row by key, return `row ?? null`
- `upsert(key: string, value: unknown, updatedBy: string)` — insert or update on conflict key. Gunakan `db.insert(...).values(...).onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy, updatedAt: new Date() } })`. Return row.
- `findAll()` — select semua rows, return array

**4. Rewrite `server/services/settings.service.ts`**

- Hapus semua `useStorage('data')` dan `SETTINGS_STORAGE_KEY`
- Import `settingsRepo` dari repo baru
- Pertahankan type `AppSettings` dan `UpdateSettingsInput` PERSIS seperti sekarang (consumer API endpoints bergantung pada ini)
- Pertahankan `DEFAULT_SETTINGS` sebagai fallback
- Pertahankan fungsi `mergeSettings()` internal (logic merge deep partial masih diperlukan)
- Rewrite `getSettings()`:
  - Fetch semua rows via `settingsRepo.findAll()`
  - Reconstruct object `AppSettings` dari rows: setiap row.key = property name, row.value = property value
  - Jika key tertentu belum ada di DB, gunakan default dari `DEFAULT_SETTINGS`
  - Set `updatedAt` dan `updatedBy` dari row yang paling terakhir diupdate
- Rewrite `updateSettings()`:
  - Untuk setiap group dalam input (general, claim, auditTrail) yang !== undefined:
    - Get current value via `settingsRepo.findByKey(groupKey)`
    - Merge current + input (untuk partial update dalam group)
    - Upsert via `settingsRepo.upsert(groupKey, mergedValue, userId)`
  - Return full settings object via `this.getSettings()`
- Pertahankan export `mapSettingsErrorToHttp` dan type exports

**5. (Opsional) Edit `server/utils/error-codes.ts`**

Tambahkan jika diperlukan:
```
SETTINGS_UPDATE_FAILED: 'SETTINGS_UPDATE_FAILED'
```

### Expected Output
- Settings persist di SQLite — survive server restart, deploy, crash
- `GET /api/settings` return format PERSIS sama seperti sebelumnya (consumer tidak break)
- `PUT /api/settings` dengan partial update tetap berfungsi (merge logic dipertahankan)
- Default settings tetap berlaku jika tabel kosong (fresh install)
- `pnpm db:generate` menghasilkan migration file baru untuk tabel `app_settings`
- Tidak ada sisa reference ke `useStorage('data')` di settings service
- Pattern 100% konsisten dengan entity lain (schema → repo → service)

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Jalankan: `pnpm db:generate` — harus generate migration baru untuk tabel `app_settings`
- Test manual: `PUT /api/settings` update settings → restart server → `GET /api/settings` return settings yang sudah diupdate (bukan default)
