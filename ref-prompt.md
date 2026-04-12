## ISSUES

semua issue di @review.md
| `FRONTEND_DETAIL_PAGE_GUARDS` | `Dashboard claims/[id] no 404 handling` | Section 6.19 (CRITICAL table) |
| `FRONTEND_CS_CREATE_BLOCKERS` | `photo uploads via JSON body` | Section 6.19 (CRITICAL table) |
| `FRONTEND_REPORT_FILTER_EXPORT_BLOCKERS` | `Report filters non-functional` | Section 6.14 |

## Contoh pattern Task Card

## Task: Fix Seed Script — Buat Account Records untuk Better-Auth

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `server/database/seed.ts`
- File referensi (baca dulu sebelum mulai):
  - `server/database/schema/auth.ts` — schema tabel user, account, session
  - `server/utils/auth-config.ts` — konfigurasi Better-Auth (plugin username + admin aktif)

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Seed harus idempotent — bisa dijalankan ulang tanpa error (pakai onConflictDoNothing)
- JANGAN ubah data user yang sudah ada. Hanya TAMBAHKAN account creation.
- JANGAN buat pattern baru. IKUTI pattern yang sudah ada di seed.ts.

### Existing Pattern
Baca `server/database/seed.ts` dan perhatikan:
- Cara user records dibuat: array of objects → loop `for...of` → `db.insert(schema.user).values(u).onConflictDoNothing()`
- Cara seed runner di-structure: `async function seed()` dengan step-by-step `console.log`
- Import schema: `import * as schema from './schema'`

Kode yang kamu tulis HARUS mengikuti pattern ini persis.

### Instruksi
1. Import password hashing dari Better-Auth (`better-auth/crypto` atau gunakan Scrypt/bcrypt yang kompatibel dengan Better-Auth)
2. Setelah section "// 1. Users" loop, tambahkan section baru "// 1b. Accounts" 
3. Untuk setiap user, buat record `account` dengan:
   - `id`: generate UUID (gunakan `crypto.randomUUID()`)
   - `accountId`: sama dengan `user.id`
   - `providerId`: `'credential'`
   - `userId`: sama dengan `user.id`
   - `password`: hash dari string `'sharp1234'` menggunakan Better-Auth compatible hasher
   - `createdAt` dan `updatedAt`: `new Date()`
4. Insert setiap account dengan `db.insert(schema.account).values(acc).onConflictDoNothing()`
5. Tambahkan console.log step yang konsisten dengan pattern existing

### Expected Output
- Setelah `pnpm db:seed`, tabel `account` memiliki 4 rows (satu per user seed)
- Setiap account row punya `providerId = 'credential'` dan field `sharp1234` yang ter-hash (bukan plaintext)
- Login via `POST /api/auth/sign-in` dengan body `{ username: 'cs_staff', password: 'sharp1234' }` berhasil return session
- Seed tetap idempotent — menjalankan `pnpm db:seed` dua kali berturut-turut tidak error

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Jalankan: `pnpm db:seed` — harus sukses tanpa error
- Verifikasi manual: `pnpm db:studio` lalu cek tabel `account` punya 4 rows
- update @review.md tentang issue ini
- commit, push, dan buat PR
````

buatkan prompt template task card  yang ringkas namun efektif seperi contoh di @ref-prompt.md untuk memperbaiki issue di @ref-prompt.md dan buat agar bisa di delegasikan ke model ai murah. 
jika task nya sedikit, gabungkan menjadi 1 task card saja. jika banyak pisahkan menjadi beberapa task card. 
buatkan output di @prompt.md.
- jangan sampai merusak kode yang sudah ada
- jika task card simple, tidak perlu expected result

