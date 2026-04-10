# Cara Prompt — Delegation Strategy ke Model AI Murah

> **Prinsip Utama: "Otak Mahal, Tangan Murah"**
>
> Model mahal (Opus) → merencanakan, mendesain arsitektur, mereview
> Model murah (Sonnet/Haiku/4o-mini) → menulis kode per-task berdasarkan instruksi presisi

---

## Daftar Isi

1. [Prinsip Delegation](#1-prinsip-delegation)
2. [Format Task Card](#2-format-task-card)
3. [Cara Pecah finalisasi-be.md Jadi Batch](#3-cara-pecah-finalisasi-bemd-jadi-batch)
4. [Template Prompt Universal](#4-template-prompt-universal)
5. [Workflow Optimal](#5-workflow-optimal)
6. [Strategi Khusus OpenCode](#6-strategi-khusus-opencode)
7. [Contoh Prompt Siap Pakai per Fase](#7-contoh-prompt-siap-pakai-per-fase)
8. [Urutan Eksekusi Rekomendasi](#8-urutan-eksekusi-rekomendasi)
9. [Tips Hemat Token](#9-tips-hemat-token)

---

## 1. Prinsip Delegation

Model murah sangat bagus mengikuti pattern yang sudah ada — mereka gagal ketika harus **menentukan** pattern sendiri.

Maka:
- **Berikan contoh file** yang sudah benar sebagai referensi, bukan instruksi abstrak
- **Satu task per prompt** — jangan gabung banyak task sekaligus
- **Validasi otomatis** — selalu akhiri dengan perintah `pnpm typecheck && pnpm lint`

Daripada bilang:
> "Buatkan API endpoint dengan pattern repository-service-handler"

Lebih baik:
> "Baca file `server/api/master/vendors/index.get.ts`, `server/services/vendor.service.ts`, dan `server/repositories/vendor.repo.ts`. Buat endpoint yang **persis sama pattern-nya** untuk entity `XYZ`."

---

## 2. Format Task Card

Setiap task yang didelegasikan ke model murah harus berformat self-contained seperti ini:

```markdown
## Task: [Nama Task]

### Context
- Project: Nuxt 4 + Nitro backend, Drizzle ORM + SQLite, Better-Auth
- File yang akan diedit: `path/to/file.ts`
- File referensi (baca dulu): `path/to/related-file.ts`

### Existing Pattern (IKUTI PERSIS)
<paste contoh kode dari file sejenis yang sudah ada, atau arahkan ke path file>

### Instruksi Spesifik
1. Lakukan X
2. Lakukan Y
3. Jangan lakukan Z

### Expected Output
<deskripsi hasil yang diharapkan>

### Validation
- Jalankan `pnpm typecheck` — harus 0 error
- Jalankan `pnpm lint` — harus 0 warning baru
```

---

## 3. Cara Pecah finalisasi-be.md Jadi Batch

Jangan berikan seluruh `finalisasi-be.md` ke model murah sekaligus. Pecah per-fase, bahkan per-subtask:

| Batch | Task | Input ke Model Murah |
|---|---|---|
| 1a | Fix seed script | Paste isi `seed.ts` + schema `auth.ts` + instruksi buat account records |
| 1b | Wire `useAuthSession` | Paste isi composable lama + endpoint `sign-in.post.ts` + `session.get.ts` |
| 2a | Wire vendor master page | Paste page lama + contoh page yang sudah wired (misal CS claims) |
| 2b | Wire defect master page | Sama pattern, beda endpoint |
| ... | ... | ... |

---

## 4. Template Prompt Universal

Template ini bisa dipakai berulang-ulang untuk semua task:

```markdown
Kamu adalah developer backend untuk project Nuxt 4.
Baca CLAUDE.md di root project untuk context lengkap.

## Aturan:
- IKUTI pattern yang sudah ada persis, jangan buat pattern baru
- Package manager: pnpm
- TypeScript strict mode
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: { success: true, data, pagination? }
- Error handling: throw createError({ statusCode, statusMessage })
- Auth: gunakan requireAuth() / requireRole() dari server/utils/auth.ts
- Validasi: gunakan Zod schema, getValidatedBody/getValidatedQuery

## Task:
[INSTRUKSI SPESIFIK DI SINI]

## File Referensi:
[PASTE ISI FILE YANG JADI CONTOH, atau arahkan path-nya]

## File yang Diedit:
[PATH FILE]

## Setelah Selesai:
- Jalankan: pnpm typecheck
- Jalankan: pnpm lint
- Pastikan tidak ada error
```

---

## 5. Workflow Optimal

```
┌─────────────────────────────────────────────┐
│  MODEL MAHAL (Opus) — sekali di awal        │
│  - Buat finalisasi-be.md (sudah done)       │
│  - Review arsitektur & patterns             │
│  - Pecah jadi task cards                    │
│  - Review hasil akhir (setelah semua done)  │
└────────────────┬────────────────────────────┘
                 │ Task cards
    ┌────────────┼────────────────┐
    ▼            ▼                ▼
┌────────┐ ┌────────┐      ┌────────┐
│ Sonnet │ │ Sonnet │ ...  │ Sonnet │  ← Model murah
│ Task 1 │ │ Task 2 │      │ Task N │     paralel
└───┬────┘ └───┬────┘      └───┬────┘
    │          │                │
    ▼          ▼                ▼
┌─────────────────────────────────────────────┐
│  MODEL MAHAL (Opus) — sekali di akhir       │
│  - Review semua perubahan                   │
│  - Cek konsistensi antar-file               │
│  - Integration test                         │
│  - Fix edge cases yang terlewat             │
└─────────────────────────────────────────────┘
```

---

## 6. Strategi Khusus OpenCode

Karena model murah di OpenCode punya akses ke file system, **tidak perlu paste file content**. Cukup arahkan ke path:

```
Baca file-file berikut untuk memahami pattern yang dipakai:
- server/api/master/vendors/index.get.ts (contoh GET list endpoint)
- server/api/master/vendors/index.post.ts (contoh POST endpoint)
- server/services/vendor.service.ts (contoh service layer)
- server/repositories/vendor.repo.ts (contoh repository)
- CLAUDE.md (project conventions)

Lalu kerjakan:
[TASK SPESIFIK]

Ikuti pattern yang PERSIS SAMA dengan file referensi di atas.
Setelah selesai jalankan: pnpm typecheck && pnpm lint
```

---

## 7. Contoh Prompt Siap Pakai per Fase

> **Catatan:** Setiap prompt di bawah sudah mengikuti format Task Card dari Bagian 2.
> Aturan universal di-embed langsung di setiap prompt agar self-contained.
> Copy-paste satu prompt per session ke OpenCode dengan model murah.

---

### Fase 1.1 — Fix Seed Script (DONE)

````
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
````

---

### Fase 1.2 — Wire useAuthSession ke Real API (DONE)

> **Catatan best practice `$fetch` vs `useFetch` vs `useAsyncData`:**
> (Ref: https://masteringnuxt.com/blog/when-to-use-fetch-usefetch-or-useasyncdata-in-nuxt-a-comprehensive-guide)
>
> | Tool | Kapan Pakai |
> |---|---|
> | `useFetch` | SSR-friendly GET dari satu endpoint. Data di-fetch sekali di server, lalu hydrate ke client — **tidak double-fetch**. |
> | `useAsyncData` | SSR-friendly untuk operasi async kompleks (multi-fetch, transformasi). Sama seperti `useFetch` tapi lebih fleksibel. |
> | `$fetch` | Client-only event-driven actions (form submit, button click) ATAU server-side internal calls. **Jangan pakai di component/composable top-level untuk GET** — akan double-fetch (sekali di server, sekali lagi di client saat hydration). |
>
> **Kesimpulan untuk auth composable:**
> - `login()` = user-triggered POST → **`$fetch`** (benar)
> - `logout()` = user-triggered POST → **`$fetch`** (benar)
> - `fetchSession()` = GET yang dipanggil saat init (SSR + page refresh) → **`useAsyncData` + `$fetch`** agar data tidak double-fetch saat hydration

````
## Task: Wire useAuthSession.ts — Ganti Mock Login dengan Real Better-Auth API

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/composables/useAuthSession.ts`
- File referensi (baca dulu sebelum mulai):
  - `server/api/auth/sign-in.post.ts` — endpoint login (lihat request/response format)
  - `server/api/auth/session.get.ts` — endpoint cek session aktif
  - `server/api/auth/sign-out.post.ts` — endpoint logout
  - `server/middleware/auth.ts` — cara server resolve session dari cookie/header
  - `server/utils/auth.ts` — interface `AuthUser` (id, name, email, role, branch)

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- **Data fetching rules (PENTING — ikuti best practice Nuxt):**
  - `$fetch` → HANYA untuk user-triggered mutations (POST/PUT/PATCH/DELETE) yang dipanggil dari event handler (click, submit). JANGAN pakai `$fetch` langsung di top-level composable/component untuk GET — ini akan menyebabkan double-fetch saat SSR hydration.
  - `useAsyncData` + `$fetch` → untuk GET calls yang perlu SSR-safe (dipanggil saat init, page load, atau page refresh). `useAsyncData` memastikan data di-fetch sekali di server lalu di-hydrate ke client tanpa fetch ulang.
  - `useFetch` → shorthand untuk `useAsyncData` + `$fetch` jika hanya fetch satu URL sederhana.
- State management: gunakan `useState` (SSR-safe shared state) untuk user session
- HAPUS SEMUA mock data, setTimeout simulasi, dan hardcoded users
- JANGAN buat pattern baru. Lihat bagaimana `useCsStore.ts` memakai `$fetch` untuk mutations dan `useFetch` untuk list data.

### Existing Pattern
Baca `app/composables/useCsStore.ts` dan perhatikan:
- **GET (SSR-safe):** `useFetch<CsClaimListItem[]>('/api/cs/claims', { default: () => [] })` — data tidak double-fetch
- **Mutations (client-only):** `await $fetch('/api/cs/claims', { method: 'POST', body: payload })` — dipanggil dari function, bukan top-level
- Cara error handling: `try/catch` dengan `e.data?.message` atau `e.statusMessage`
- Cara loading state dikelola: `loading.value = true` di awal, `finally { loading.value = false }`
- Setelah mutation berhasil: `refreshClaims()` (dari useFetch) + `refreshNuxtData()` untuk invalidate cache

Kode yang kamu tulis HARUS mengikuti pattern ini:
- GET di top-level → `useAsyncData` atau `useFetch`
- Mutations di event handler → `$fetch`

### Instruksi
1. Hapus seluruh `mockUsers` map dan `setTimeout` login simulation
2. Buat SSR-safe shared state dengan `useState<AuthUser | null>('auth-user', () => null)`
   - Gunakan `useState` (bukan `ref`) karena session state perlu di-share antar komponen DAN harus SSR-safe (survive hydration)
3. Implementasi session fetch dengan `useAsyncData`:
   ```ts
   const { data: sessionData, refresh: refreshSession, status } = await useAsyncData(
     'auth-session',
     () => $fetch('/api/auth/session'),
     { lazy: true }
   )
   ```
   - Watch `sessionData` → populate `user` state dari response (map ke AuthUser: id, name, email, role, branch)
   - Jika response null/error (401), set `user.value = null`
   - `lazy: true` agar tidak blocking navigation — session check berjalan di background
   - **KENAPA `useAsyncData` dan bukan `$fetch` langsung?** Karena `$fetch` di top-level akan double-fetch: sekali di server, sekali lagi di client saat hydration. `useAsyncData` mencegah ini — data di-fetch di server lalu di-hydrate ke client via Nuxt payload.
4. Implementasi `login(username: string, password: string)`:
   - Call `$fetch('/api/auth/sign-in', { method: 'POST', body: { username, password } })`
   - Setelah berhasil, call `await refreshSession()` untuk populate user state dari API
   - Return boolean sukses/gagal
   - **KENAPA `$fetch`?** Karena login adalah user-triggered action (form submit), bukan data yang perlu SSR.
5. Implementasi `logout()`:
   - Call `$fetch('/api/auth/sign-out', { method: 'POST' })`
   - Set `user.value = null`
   - Redirect ke `/login` via `navigateTo('/login')`
   - **KENAPA `$fetch`?** Sama — user-triggered action.
6. Expose computed: `isAuthenticated`, `role`, `branch`, `userName`
7. Session auto-refresh sudah ditangani oleh `useAsyncData` saat composable pertama kali dipanggil (server-side atau client-side navigation)

### Decision Table (Ringkasan)
| Function | Method | Alasan |
|---|---|---|
| Session check (init/refresh) | `useAsyncData` + `$fetch` | SSR-safe, prevent double-fetch saat hydration |
| `login()` | `$fetch` POST | User-triggered action (form submit), client-only |
| `logout()` | `$fetch` POST | User-triggered action (button click), client-only |
| `refreshSession()` | `refresh()` dari `useAsyncData` | Re-fetch session setelah login/logout tanpa buat request baru |

### Expected Output
- Login page (`/login`) bisa login dengan username `cs_staff` password `password` (dari seed)
- Setelah login, session persist across page refresh (cookie-based, session di-hydrate dari server)
- `user` reactive state berisi data dari database (bukan hardcode)
- Tidak ada double-fetch: session hanya di-fetch sekali saat SSR, lalu di-hydrate ke client
- Logout redirect ke `/login` dan clear session
- Jika akses halaman protected tanpa session, behavior tetap konsisten (composable return null user)

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka browser → login → refresh page → session masih ada → logout → redirect ke /login
- **Cek Network tab:** saat page refresh setelah login, `/api/auth/session` hanya dipanggil SEKALI (bukan dua kali). Ini membuktikan `useAsyncData` bekerja dengan benar.
````

---

### Fase 1.3 — Wire useDashboardStore ke Real Auth (DONE)

````
## Task: Wire useDashboardStore.ts — Ganti Mock Role Switcher dengan Real Auth Session

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/composables/useDashboardStore.ts`
- File referensi (baca dulu sebelum mulai):
  - `app/composables/useAuthSession.ts` — sudah di-wire ke real API (task sebelumnya)
  - `app/layouts/dashboard.vue` — consumer utama composable ini (lihat apa yang dipakai)

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- HAPUS semua `_mockUsers` dan hardcoded role data
- Dev-only role switcher HANYA jika `import.meta.dev === true`
- JANGAN buat pattern baru. Ikuti cara useAuthSession expose reactive state.

### Existing Pattern
Baca `app/composables/useAuthSession.ts` (versi baru yang sudah di-wire) dan perhatikan:
- Cara expose reactive state: `user`, `isAuthenticated`, `role`
- Cara composable return object dengan computed properties

Kode yang kamu tulis HARUS mengikuti pattern reactive state ini.

### Instruksi
1. Hapus `_mockUsers` record dan semua hardcoded user data
2. Import `useAuthSession` dan gunakan sebagai source of truth untuk `currentUser`
3. `currentUser` harus computed dari `useAuthSession().user`
4. `currentRole` harus computed dari `useAuthSession().role`
5. Untuk dev-only role switcher (jika dipertahankan):
   - Wrap dalam `if (import.meta.dev)` check
   - `switchRole()` harus melakukan real sign-in ke user lain (call login dengan username user role tersebut), bukan swap lokal
6. Pastikan semua consumer existing (`dashboard.vue`) tidak break — pertahankan return interface yang sama

### Expected Output
- Dashboard layout menampilkan nama dan role user yang sedang login (dari database, bukan hardcode)
- Jika user login sebagai QRCC, dashboard menampilkan menu QRCC. Jika ADMIN, menu ADMIN. Dst.
- Dev role switcher (jika ada) benar-benar re-login ke user lain, bukan swap data lokal
- Tidak ada sisa `_mockUsers` atau hardcoded user data di file

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: login sebagai cs_staff → navigasi ke dashboard → nama dan role tampil benar
````

---

### Fase 1.4 — Buat .env.example & Amankan Secrets (DONE)

````
## Task: Buat .env.example dan Verifikasi .gitignore

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth
- File yang akan dibuat: `.env.example` (baru)
- File yang akan diperiksa: `.gitignore`

### Aturan (WAJIB diikuti)
- .env.example HARUS berisi placeholder values, BUKAN secret asli
- .env HARUS ada di .gitignore
- JANGAN ubah file .env yang sudah ada

### Instruksi
1. Buat file `.env.example` di root project dengan isi:
   ```
   # Database
   DB_FILE_NAME=file:local.db

   # Better Auth (WAJIB diganti dengan random string min 32 karakter)
   BETTER_AUTH_SECRET=generate-a-random-secret-min-32-chars
   BETTER_AUTH_URL=http://localhost:3000

   # File Storage
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE_MB=10

   # Logging
   LOG_LEVEL=info
   ```
2. Baca `.gitignore` — verifikasi `.env` sudah ada di dalamnya
3. Jika `.env` BELUM ada di `.gitignore`, tambahkan baris `.env` ke `.gitignore`
4. Verifikasi juga bahwa `local.db`, `uploads/`, dan `backups/` ada di `.gitignore`. Tambahkan jika belum.

### Expected Output
- File `.env.example` ada di root project dengan placeholder values
- `.gitignore` meng-ignore `.env`, `local.db`, `uploads/`, `backups/`
- Developer baru bisa copy `.env.example` ke `.env` lalu isi secrets sendiri

### Validation
- Jalankan: `cat .env.example` — harus menampilkan placeholder, bukan secret asli
- Jalankan: `grep -n '.env' .gitignore` — harus menemukan entry `.env`
````

---

### Fase 2.1 — Wire Master Vendor Page

````
## Task: Wire Vendor Master Page — Ganti Mock Data dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/pages/dashboard/master/vendor.vue`
- File referensi (baca dulu sebelum mulai):
  - `app/composables/useCsStore.ts` — contoh pattern `useFetch` dan `$fetch` yang sudah berhasil
  - `app/pages/cs/claims/index.vue` — contoh page yang sudah wire ke real API
  - `server/api/master/vendors/index.get.ts` — endpoint GET list (lihat query params dan response format)
  - `server/api/master/vendors/index.post.ts` — endpoint POST create
  - `server/api/master/vendors/[id].put.ts` — endpoint PUT update
  - `server/api/master/vendors/[id]/status.patch.ts` — endpoint PATCH toggle status

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Error handling: try/catch dengan toast notification untuk user feedback
- Gunakan `useFetch` untuk data list (reactive), `$fetch` untuk mutations (POST/PUT/PATCH)
- HAPUS semua inline `ref([...])` mock data dan mock imports
- JANGAN buat pattern baru. IKUTI pattern dari file referensi persis.

### Existing Pattern
Baca `app/composables/useCsStore.ts` dan perhatikan:
- List data: `useFetch('/api/cs/claims', { query: computedQueryParams })`
- Create: `await $fetch('/api/cs/claims', { method: 'POST', body: payload })`
- Response destructuring: `data.value?.data` untuk items, `data.value?.pagination` untuk meta
- Setelah mutation berhasil: call `refresh()` dari useFetch untuk reload data

Baca `app/pages/cs/claims/index.vue` dan perhatikan:
- Cara `pending` dari useFetch dipakai untuk loading state
- Cara `error` dari useFetch dipakai untuk error state

Kode yang kamu tulis HARUS mengikuti pattern ini persis.

### Instruksi
1. Ganti `ref([...])` vendor list dengan `useFetch('/api/master/vendors', { query: { page, limit, search, isActive } })`
2. Wire form submit (create) ke `$fetch('/api/master/vendors', { method: 'POST', body: formData })`
3. Wire form submit (edit) ke `$fetch('/api/master/vendors/${id}', { method: 'PUT', body: formData })`
4. Wire status toggle ke `$fetch('/api/master/vendors/${id}/status', { method: 'PATCH', body: { isActive } })`
5. Setelah setiap mutation berhasil, call `refresh()` untuk reload vendor list
6. Pertahankan semua existing UI (tabel, form modal, search, pagination) — hanya ganti data source
7. Hapus semua import mock data

### Expected Output
- Halaman vendor list menampilkan data dari database (bukan hardcode)
- Bisa create vendor baru via form → data muncul di list setelah save
- Bisa edit vendor existing → perubahan tersimpan dan ter-reflect di list
- Bisa toggle status active/inactive → badge status berubah
- Search/filter berfungsi (query dikirim ke API)
- Pagination berfungsi (page/limit dikirim ke API)
- Loading state tampil saat data sedang di-fetch
- Error state tampil jika API gagal

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/dashboard/master/vendor` → data tampil dari DB → coba CRUD → semua operasi berhasil
````

---

### Fase 2.2 — Wire Master Product Model Page

````
## Task: Wire Product Model Master Page — Ganti Mock Data dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/pages/dashboard/master/product-model.vue`
- File referensi (baca dulu sebelum mulai):
  - `app/pages/dashboard/master/vendor.vue` — contoh page master yang SUDAH wire ke real API (dari task sebelumnya). INI REFERENSI UTAMA.
  - `server/api/master/product-models/index.get.ts` — endpoint GET list
  - `server/api/master/product-models/index.post.ts` — endpoint POST create
  - `server/api/master/product-models/[id].put.ts` — endpoint PUT update
  - `server/api/master/product-models/[id]/status.patch.ts` — endpoint PATCH toggle status

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Error handling: try/catch dengan toast notification untuk user feedback
- Gunakan `useFetch` untuk data list, `$fetch` untuk mutations
- HAPUS semua inline mock data dan mock imports
- JANGAN buat pattern baru. IKUTI pattern dari `vendor.vue` yang sudah di-wire PERSIS.

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` (versi yang sudah di-wire) dan perhatikan:
- Cara useFetch dipanggil dengan query params reactive
- Cara form submit memanggil $fetch POST/PUT
- Cara status toggle memanggil $fetch PATCH
- Cara refresh() dipanggil setelah mutation
- Cara loading/error state dihandle

Kode yang kamu tulis HARUS mengikuti pattern vendor.vue ini PERSIS — hanya beda endpoint path dan field names.

### Instruksi
1. Ganti semua mock data dengan `useFetch('/api/master/product-models', { query: ... })`
2. Wire create form ke `POST /api/master/product-models`
3. Wire edit form ke `PUT /api/master/product-models/:id`
4. Wire status toggle ke `PATCH /api/master/product-models/:id/status`
5. Setelah mutation, call `refresh()`
6. Pertahankan semua existing UI — hanya ganti data source
7. Hapus semua mock imports

### Expected Output
- Halaman product model menampilkan data dari database
- CRUD operations (create, read, update, toggle status) semua berfungsi melalui real API
- Search, filter, dan pagination berfungsi
- Loading dan error states tampil dengan benar
- Tidak ada sisa mock data di file

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/dashboard/master/product-model` → data tampil dari DB → coba CRUD
````

---

### Fase 2.3 — Wire Master Defect Page

````
## Task: Wire Defect Master Page — Ganti Mock Data dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/pages/dashboard/master/defect.vue`
- File referensi (baca dulu sebelum mulai):
  - `app/pages/dashboard/master/vendor.vue` — REFERENSI UTAMA (sudah wire ke real API)
  - `server/api/master/defects/index.get.ts` — endpoint GET list
  - `server/api/master/defects/index.post.ts` — endpoint POST create
  - `server/api/master/defects/[id].put.ts` — endpoint PUT update
  - `server/api/master/defects/[id]/status.patch.ts` — endpoint PATCH toggle status
  - `server/api/master/defects/[id].get.ts` — endpoint GET detail

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Error handling: try/catch dengan toast notification
- Gunakan `useFetch` untuk list, `$fetch` untuk mutations
- HAPUS semua mock data. IKUTI pattern `vendor.vue` PERSIS.

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` (versi yang sudah di-wire).
Kode yang kamu tulis HARUS mengikuti pattern yang PERSIS SAMA — hanya beda endpoint `/api/master/defects` dan field names (code, name vs vendor fields).

### Instruksi
1. Ganti semua mock data dengan `useFetch('/api/master/defects', { query: ... })`
2. Wire create form ke `POST /api/master/defects`
3. Wire edit form ke `PUT /api/master/defects/:id`
4. Wire status toggle ke `PATCH /api/master/defects/:id/status`
5. Call `refresh()` setelah setiap mutation
6. Pertahankan semua existing UI, hanya ganti data source
7. Hapus semua mock imports

### Expected Output
- Halaman defect master menampilkan data dari database
- CRUD dan toggle status berfungsi melalui real API
- Search, filter, pagination berfungsi
- Loading dan error states tampil benar
- Zero mock data references di file

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/dashboard/master/defect` → CRUD berfungsi
````

---

### Fase 2.4 — Wire Master Notification Page

````
## Task: Wire Notification Master Page — Ganti Mock Data dengan Real API Calls (Termasuk Excel Import)

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/pages/dashboard/master/notification.vue`
- File referensi (baca dulu sebelum mulai):
  - `app/pages/dashboard/master/vendor.vue` — REFERENSI UTAMA (sudah wire ke real API)
  - `server/api/master/notifications/index.get.ts` — endpoint GET list
  - `server/api/master/notifications/index.post.ts` — endpoint POST create
  - `server/api/master/notifications/[id].put.ts` — endpoint PUT update
  - `server/api/master/notifications/[id]/status.patch.ts` — endpoint PATCH toggle status
  - `server/api/master/notifications/import.post.ts` — endpoint POST import Excel
  - `server/api/master/notifications/[id].get.ts` — endpoint GET detail

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Error handling: try/catch dengan toast notification
- Gunakan `useFetch` untuk list, `$fetch` untuk mutations
- HAPUS semua mock data. IKUTI pattern `vendor.vue` PERSIS untuk CRUD.

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` (versi yang sudah di-wire) untuk CRUD pattern.
Untuk Excel import, baca `server/api/master/notifications/import.post.ts` untuk memahami expected request format (multipart/form-data atau JSON array).

Kode CRUD harus PERSIS sama pattern-nya dengan vendor.vue. Import Excel adalah tambahan.

### Instruksi
1. Ganti semua mock data dengan `useFetch('/api/master/notifications', { query: ... })`
2. Wire create form ke `POST /api/master/notifications`
3. Wire edit form ke `PUT /api/master/notifications/:id`
4. Wire status toggle ke `PATCH /api/master/notifications/:id/status`
5. Wire Excel import modal ke `POST /api/master/notifications/import`:
   - Kirim file sebagai FormData atau parsed JSON array (sesuai endpoint expectation)
   - Tampilkan result (jumlah berhasil/gagal) setelah import selesai
6. Call `refresh()` setelah setiap mutation dan setelah import
7. Pertahankan semua existing UI, hanya ganti data source
8. Hapus semua mock imports dan inline mock relations

### Expected Output
- Halaman notification master menampilkan data dari database
- CRUD dan toggle status berfungsi melalui real API
- Excel import berfungsi: upload file → API proses → result ditampilkan → list refresh
- Search, filter, pagination berfungsi
- Loading dan error states tampil benar
- Zero mock data references di file

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/dashboard/master/notification` → CRUD + import Excel berfungsi
````

---

### Fase 2.5 — Wire User Management Pages

````
## Task: Wire User Management Pages — Ganti MOCK_AUTH_USERS dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit:
  - `app/pages/dashboard/users/index.vue`
  - `app/pages/dashboard/users/[id].vue`
- File referensi (baca dulu sebelum mulai):
  - `app/pages/dashboard/master/vendor.vue` — REFERENSI UTAMA untuk list + CRUD pattern
  - `server/api/users/index.get.ts` — endpoint GET user list (lihat query params: page, limit, search, role, isActive)
  - `server/api/users/[id].get.ts` — endpoint GET user detail
  - `server/api/users/[id].put.ts` — endpoint PUT update user (role, branch, dll)
  - `server/api/users/[id]/status.patch.ts` — endpoint PATCH toggle active status

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Error handling: try/catch dengan toast notification
- Gunakan `useFetch` untuk list/detail, `$fetch` untuk mutations
- HAPUS semua `MOCK_AUTH_USERS` imports dan inline mock data
- IKUTI pattern `vendor.vue` PERSIS.

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` (versi yang sudah di-wire).
- List page: useFetch dengan query params → table render → pagination
- Detail page: useFetch dengan route param id → form → $fetch PUT untuk save

Kode yang kamu tulis HARUS mengikuti pattern ini persis.

### Instruksi
1. **index.vue**: Ganti `MOCK_AUTH_USERS` dengan `useFetch('/api/users', { query: { page, limit, search, role, isActive } })`
2. **index.vue**: Wire status toggle ke `$fetch('/api/users/${id}/status', { method: 'PATCH', body: { isActive } })`
3. **[id].vue**: Ganti `MOCK_AUTH_USERS.find()` dengan `useFetch('/api/users/${id}')`
4. **[id].vue**: Wire edit form save ke `$fetch('/api/users/${id}', { method: 'PUT', body: formData })`
5. Setelah mutation, call `refresh()`
6. Hapus semua mock imports

### Expected Output
- User list page menampilkan users dari database dengan pagination
- Filter by role dan status berfungsi
- Search by name/email berfungsi
- User detail page menampilkan data real dari API
- Edit user (role, branch, status) tersimpan ke database
- Toggle active/inactive berfungsi
- Hanya ADMIN role yang bisa akses halaman ini (backend sudah enforce, frontend tampilkan error jika 403)

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: login sebagai admin → buka `/dashboard/users` → data tampil → edit user → save berhasil
````

---

### Fase 2.6 — Wire Vendor Claims Pages

````
## Task: Wire Vendor Claims Pages — Ganti Mock Batches dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit:
  - `app/pages/dashboard/vendor-claims/index.vue`
  - `app/pages/dashboard/vendor-claims/[id].vue`
  - `app/pages/dashboard/vendor-claims/create.vue`
- File referensi (baca dulu sebelum mulai):
  - `app/pages/dashboard/master/vendor.vue` — REFERENSI UTAMA untuk list pattern
  - `app/composables/useCsStore.ts` — contoh pattern $fetch untuk mutations
  - `server/api/vendor-claims/index.get.ts` — endpoint GET list
  - `server/api/vendor-claims/[id].get.ts` — endpoint GET detail (lihat response structure)
  - `server/api/vendor-claims/index.post.ts` — endpoint POST create batch
  - `server/api/vendor-claims/available-claims.get.ts` — endpoint GET approved claims available for batching
  - `server/api/vendor-claims/[id]/items/[itemId].put.ts` — endpoint PUT update vendor decision per item
  - `server/api/vendor-claims/[id]/export.get.ts` — endpoint GET Excel export (returns blob)

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Error handling: try/catch dengan toast notification
- Gunakan `useFetch` untuk list/detail, `$fetch` untuk mutations
- HAPUS semua `mockBatches`, inline mock arrays, dan fake save delays
- IKUTI pattern dari file referensi PERSIS.

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` untuk list + pagination pattern.
Baca `app/composables/useCsStore.ts` untuk cara $fetch POST/PUT digunakan.

Kode yang kamu tulis HARUS mengikuti pattern ini.

### Instruksi
1. **index.vue**: Ganti mock vendor claim list dengan `useFetch('/api/vendor-claims', { query: { page, limit, status, vendorId } })`
2. **[id].vue**: Ganti `mockBatches.find()` dengan `useFetch('/api/vendor-claims/${id}')`
3. **[id].vue**: Wire item decision update ke `$fetch('/api/vendor-claims/${id}/items/${itemId}', { method: 'PUT', body: { vendorDecision, compensation, rejectReason } })`
4. **[id].vue**: Wire Excel export button ke `$fetch('/api/vendor-claims/${id}/export')` — handle blob response untuk download
5. **create.vue**: Fetch available claims via `useFetch('/api/vendor-claims/available-claims', { query: { vendorId } })`
6. **create.vue**: Wire batch creation submit ke `$fetch('/api/vendor-claims', { method: 'POST', body: { vendorId, claimIds } })`
7. Setelah create berhasil, redirect ke detail page (`navigateTo('/dashboard/vendor-claims/${newId}')`)
8. Hapus semua mock data dan fake save logic

### Expected Output
- Vendor claim list menampilkan data dari database dengan pagination dan filter
- Detail page menampilkan batch info + items dari API
- Bisa update vendor decision (APPROVED/REJECTED) per item → tersimpan ke DB
- Excel export menghasilkan file download
- Create wizard: pilih vendor → lihat available claims dari DB → submit → batch terbuat
- Setelah create, redirect ke detail page batch baru
- Tidak ada sisa mock data di ketiga file

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/dashboard/vendor-claims` → list, detail, create, dan export semua berfungsi
````

---

### Fase 2.7 — Wire Report Pages

````
## Task: Wire Semua Report Pages — Ganti Inline Mock Data dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit (7 file):
  - `app/pages/dashboard/reports/index.vue`
  - `app/pages/dashboard/reports/vendors.vue`
  - `app/pages/dashboard/reports/branches.vue`
  - `app/pages/dashboard/reports/aging.vue`
  - `app/pages/dashboard/reports/trends.vue`
  - `app/pages/dashboard/reports/defects.vue`
  - `app/pages/dashboard/reports/recovery.vue`
- File referensi (baca dulu sebelum mulai):
  - `server/api/reports/dashboard-kpi.get.ts` — lihat response format KPI data
  - `server/api/reports/vendors.get.ts` — lihat response format vendor report
  - `server/api/reports/branches.get.ts` — lihat response format branch report
  - `server/api/reports/aging.get.ts` — lihat response format aging analysis
  - `server/api/reports/monthly-trend.get.ts` — lihat response format trend data
  - `server/api/reports/defects.get.ts` — lihat response format defect analysis
  - `server/api/reports/top-defects.get.ts` — lihat response format top defects
  - `server/api/reports/claims-by-vendor.get.ts` — lihat response format
  - `server/api/reports/claims-by-branch.get.ts` — lihat response format
  - `app/pages/dashboard/master/vendor.vue` — contoh useFetch pattern (REFERENSI UTAMA)
  - `shared/utils/fiscal.ts` — fiscal period filter utilities

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data }`
- Error handling: try/catch, tampilkan error state jika API gagal
- Gunakan `useFetch` dengan reactive query params (period filter berubah → auto refetch)
- HAPUS semua inline `ref([...])` mock arrays dan `MOCK_CLAIMS` imports
- JANGAN ubah chart component props/structure — hanya ganti data source yang feed ke chart

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` untuk useFetch pattern.
Baca endpoint response formats di file referensi untuk memahami structure data yang akan diterima.

Report pages biasanya punya period filter (fiscal half/year/custom). Kirim filter sebagai query params ke API.

### Instruksi
1. **index.vue**: Ganti `MOCK_CLAIMS` dengan `useFetch('/api/reports/dashboard-kpi', { query: periodFilter })`
2. **vendors.vue**: Ganti inline mock dengan `useFetch('/api/reports/vendors', { query: periodFilter })` dan/atau `/api/reports/claims-by-vendor`
3. **branches.vue**: Ganti inline mock dengan `useFetch('/api/reports/branches', { query: periodFilter })` dan/atau `/api/reports/claims-by-branch`
4. **aging.vue**: Ganti inline mock dengan `useFetch('/api/reports/aging', { query: periodFilter })`
5. **trends.vue**: Ganti inline mock dengan `useFetch('/api/reports/monthly-trend', { query: periodFilter })`
6. **defects.vue**: Ganti inline mock dengan `useFetch('/api/reports/defects', { query: periodFilter })` dan/atau `/api/reports/top-defects`
7. **recovery.vue**: Ganti mock dengan `useFetch('/api/reports/vendors', { query: periodFilter })` (recovery rate data)
8. Untuk setiap page: pastikan period filter dropdown mengirim query params yang benar (fiscalYear, fiscalHalf, mode, startDate, endDate)
9. Pastikan chart components menerima data format yang sesuai dari API response — map jika perlu
10. Hapus semua mock data imports dan inline mock arrays

### Expected Output
- Semua 7 report pages menampilkan data dari database
- Period filter (this fiscal half, last fiscal half, dll) berfungsi — mengubah filter me-refresh data
- Charts (bar, line, pie) render data yang benar dari API
- KPI cards menampilkan angka real
- Loading state tampil saat fetching
- Jika database kosong, tampilkan empty state (bukan error)
- Zero mock data references di semua report files

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka setiap report page → data tampil → ubah period filter → data berubah
````

---

### Fase 2.8 — Wire Audit Trail

````
## Task: Wire Audit Trail — Ganti Mock Data di useAuditTrail Composable

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/composables/useAuditTrail.ts`
- File referensi (baca dulu sebelum mulai):
  - `server/api/audit-trail/index.get.ts` — endpoint GET audit trail (lihat query params dan response format)
  - `app/composables/useCsStore.ts` — contoh pattern useFetch/$fetch

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Gunakan `useFetch` dengan reactive query params
- HAPUS semua mock functions (`getMockAuditTrailSorted`), mock maps (`MOCK_CLAIM_NUMBER_MAP`, `MOCK_ACTOR_NAME_MAP`), dan `setTimeout` fake delays
- JANGAN ubah return interface composable agar page consumer tidak break

### Existing Pattern
Baca `app/composables/useCsStore.ts` dan perhatikan:
- Cara `useFetch` dipanggil dengan computed query params
- Cara data di-destructure dari response

Baca `server/api/audit-trail/index.get.ts` dan perhatikan:
- Query params yang diterima: `page`, `limit`, `action`, `entityType`, `actorId`, `startDate`, `endDate`, `search`
- Response format: `{ success, data: AuditEntry[], pagination }`

### Instruksi
1. Ganti `getMockAuditTrailSorted()` call dengan `useFetch('/api/audit-trail', { query: computedFilters })`
2. Map filter state (yang sudah ada di composable) ke query params sesuai API expectation
3. Hapus `MOCK_CLAIM_NUMBER_MAP` dan `MOCK_ACTOR_NAME_MAP` — API sudah return enriched data (claim number dan actor name included)
4. Hapus semua `setTimeout` fake delay
5. Pertahankan return interface composable: `{ entries, loading, error, filters, pagination, ... }`
6. Wire pagination: `page` dan `limit` dikirim sebagai query params
7. Wire CSV export: generate dari real data yang di-fetch (bukan mock)

### Expected Output
- Audit trail page menampilkan data real dari database
- Filter by action, entity type, date range, dan search berfungsi — auto refetch saat filter berubah
- Pagination berfungsi
- CSV export menghasilkan file dari data real
- Loading state tampil saat fetching
- Tidak ada sisa mock references di composable

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/dashboard/audit-trail` → data tampil → filter berfungsi → pagination berfungsi
````

---

### Fase 2.9 — Wire Settings & Profile Pages

````
## Task: Wire Settings dan Profile Pages — Ganti Mock Data dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit:
  - `app/pages/dashboard/settings/index.vue`
  - `app/pages/dashboard/settings/security.vue` (jika ada)
  - `app/pages/cs/profile.vue`
- File referensi (baca dulu sebelum mulai):
  - `server/api/settings/index.get.ts` — endpoint GET settings
  - `server/api/settings/index.put.ts` — endpoint PUT update settings
  - `server/api/profile/index.get.ts` — endpoint GET profile
  - `server/api/profile/index.put.ts` — endpoint PUT update profile
  - `server/api/auth/change-password.post.ts` — endpoint POST change password
  - `app/pages/dashboard/master/vendor.vue` — REFERENSI UTAMA untuk useFetch/$fetch pattern

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data }`
- Error handling: try/catch dengan toast notification
- Gunakan `useFetch` untuk GET data, `$fetch` untuk mutations
- HAPUS semua `MOCK_USER_PROFILE` dan inline mock data
- IKUTI pattern dari file referensi PERSIS.

### Existing Pattern
Baca `app/pages/dashboard/master/vendor.vue` untuk useFetch/$fetch pattern.

### Instruksi
1. **dashboard/settings/index.vue**: Ganti mock settings dengan `useFetch('/api/settings')`
2. **dashboard/settings/index.vue**: Wire save button ke `$fetch('/api/settings', { method: 'PUT', body: settingsData })`
3. **dashboard/settings/security.vue** (jika ada): Wire change password form ke `$fetch('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } })`
4. **cs/profile.vue**: Ganti inline mock user data dengan `useFetch('/api/profile')`
5. **cs/profile.vue**: Wire profile edit form ke `$fetch('/api/profile', { method: 'PUT', body: profileData })`
6. **cs/profile.vue**: Wire change password section ke `$fetch('/api/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } })`
7. Hapus semua mock imports dan inline mock data

### Expected Output
- Settings page load data dari Nitro KV storage, save kembali via PUT
- Profile page menampilkan data user yang sedang login dari database
- Edit profile (name, dll) tersimpan ke database
- Change password berfungsi: current password divalidasi, new password di-hash dan disimpan
- Toast notification muncul saat save berhasil atau gagal
- Tidak ada sisa mock data di ketiga file

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka settings → save → reload → data persist. Profile → edit → save. Change password → login ulang dengan password baru.
````

---

### Fase 2.10 — Cleanup Mock Data

````
## Task: Cleanup Semua Sisa Mock Data dari Codebase

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- Scope: seluruh directory `app/`
- Prerequisite: SEMUA page sudah di-wire ke real API (Fase 2.1–2.9 selesai)

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- HATI-HATI: Jangan hapus file yang MASIH di-import. CEK DULU semua references sebelum delete.
- Jangan hapus mock data yang dipakai di test files (jika ada di `tests/`)
- JANGAN ubah file backend (`server/`) — scope hanya `app/`

### Instruksi
1. Grep seluruh `app/` untuk kata `mock`, `MOCK`, `Mock` — list semua file dan baris yang match
2. Untuk setiap match, verifikasi bahwa itu memang mock data yang harus dihapus (bukan variabel name yang kebetulan mengandung kata "mock")
3. Hapus semua mock imports dan references
4. Jika file `app/utils/mock-data.ts` ada dan sudah tidak di-import di manapun, hapus file tersebut
5. Jika directory `app/test-fixtures/` ada dan sudah tidak di-import di manapun, hapus directory tersebut
6. Grep untuk pattern `setTimeout` di `app/` — hapus semua yang mensimulasi API delay (biasanya `setTimeout(() => { ... }, 400)` atau serupa)
7. Final verification: grep ulang untuk `mock`, `MOCK`, `Mock`, `setTimeout` di `app/` — harus zero relevant matches

### Expected Output
- Zero references ke mock data di seluruh `app/` directory
- Tidak ada file mock-data.ts atau test-fixtures/ yang orphan
- Tidak ada setTimeout yang mensimulasi API delay
- Semua page masih berfungsi normal (data dari real API)
- Build berhasil tanpa error

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Jalankan: `grep -ri "mock" app/ --include="*.vue" --include="*.ts" -l` — harus 0 result (atau hanya false positives)
- Jalankan: `pnpm build` — harus berhasil tanpa error
````

---

### Fase 2.11 — Wire CS Reference Data di useCsStore

````
## Task: Wire Reference Data di useCsStore — Ganti CS_MOCK_* dengan Real API Calls

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan diedit: `app/composables/useCsStore.ts`
- File referensi (baca dulu sebelum mulai):
  - `server/api/master/vendors/index.get.ts` — endpoint GET vendor list
  - `server/api/master/product-models/index.get.ts` — endpoint GET product model list
  - `server/api/master/defects/index.get.ts` — endpoint GET defect list

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua response API format: `{ success: true, data, pagination? }`
- Gunakan `useFetch` untuk reference data (reactive, auto-fetch)
- HAPUS semua `CS_MOCK_*` imports dari `~/test-fixtures/cs`
- JANGAN ubah CRUD calls yang sudah berfungsi (create, update, submit claim, dll)

### Existing Pattern
Baca bagian CRUD di `useCsStore.ts` yang sudah wire ke API — perhatikan cara `useFetch` dan `$fetch` dipakai. Reference data harus mengikuti pattern yang sama.

### Instruksi
1. Ganti `CS_MOCK_VENDORS` dengan `useFetch('/api/master/vendors', { query: { isActive: true, limit: 100 } })`
2. Ganti `CS_MOCK_MODELS` dengan `useFetch('/api/master/product-models', { query: { isActive: true, limit: 100 } })`
3. Ganti `CS_MOCK_DEFECTS` dengan `useFetch('/api/master/defects', { query: { isActive: true, limit: 100 } })`
4. Branch list: derive dari vendor/model data, atau hardcode daftar branch yang valid (tanyakan bisnis). Alternatif: buat endpoint `GET /api/reference/branches`
5. Hapus semua `CS_MOCK_*` imports
6. Pastikan claim create form masih berfungsi — dropdown vendor, model, defect terisi dari API data

### Expected Output
- Dropdown vendor di claim create form menampilkan vendors dari database (hanya yang active)
- Dropdown product model menampilkan models dari database (hanya yang active)
- Dropdown defect menampilkan defects dari database (hanya yang active)
- Claim create flow tetap berfungsi end-to-end
- Tidak ada sisa CS_MOCK_* references

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: buka `/cs/claims/create` → dropdown vendor/model/defect terisi → buat claim → berhasil
````

---

### Fase 3 — Security & Validation Hardening

````
## Task: Security & Validation Hardening — Buat Utility Files Baru

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan dibuat (baru):
  - `server/utils/sanitize.ts`
  - `server/utils/response.ts`
  - `server/middleware/security-headers.ts`
  - `server/api/_health.get.ts`
- File yang akan diedit:
  - `server/utils/error-codes.ts` — tambah error code baru
- File referensi (baca dulu sebelum mulai):
  - `server/utils/pagination.ts` — contoh pattern utility file (lihat structure: import, schema, function, export)
  - `server/utils/error-codes.ts` — lihat pattern existing error codes
  - `server/utils/auth.ts` — contoh pattern utility yang throw createError
  - `server/middleware/auth.ts` — contoh pattern middleware
  - `server/api/master/vendors/index.get.ts` — contoh API route handler (lihat response format)
  - `server/database/index.ts` — database import pattern

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Semua utility function harus type-safe dengan parameter dan return types explicit
- JANGAN ubah file existing kecuali `error-codes.ts`
- IKUTI pattern dari file referensi PERSIS — naming convention, export style, comment style.

### Existing Pattern
Baca `server/utils/pagination.ts` dan perhatikan:
- Import style (import { z } from 'zod')
- Export pattern (named exports, no default)
- Function signature dengan explicit types
- Zod schema defined then exported

Baca `server/middleware/auth.ts` dan perhatikan:
- `export default defineEventHandler(async (event) => { ... })`
- Early return pattern untuk skip certain paths
- Event context usage

Kode yang kamu tulis HARUS mengikuti conventions ini.

### Instruksi
1. **`server/utils/sanitize.ts`**: Buat 2 fungsi:
   - `sanitizeString(input: string): string` — trim + collapse multiple whitespace
   - `sanitizeSearchQuery(input: string): string` — escape SQLite LIKE wildcards (`%`, `_`, `\`) + trim
2. **`server/utils/response.ts`**: Buat 2 fungsi:
   - `successResponse<T>(data: T, pagination?: PaginationMeta)` — return `{ success: true, data, pagination? }`
   - `errorResponse(code: string, message: string, details?: unknown)` — return `{ success: false, error: { code, message, details? } }`
   - Import `PaginationMeta` type dari pagination.ts (atau define inline jika tidak exported)
3. **`server/middleware/security-headers.ts`**: Buat middleware yang set headers:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
4. **`server/api/_health.get.ts`**: Buat health check endpoint:
   - Query database dengan simple `SELECT 1` untuk cek connectivity
   - Return `{ status: 'ok', checks: { database: true }, timestamp, uptime }`
   - Jika DB check gagal, return 503 dengan `{ status: 'error', checks: { database: false } }`
   - Endpoint ini TIDAK memerlukan auth (tambahkan note di kode)
5. **`server/utils/error-codes.ts`**: Tambahkan `CONCURRENT_MODIFICATION: 'CONCURRENT_MODIFICATION'` di object ErrorCode

### Expected Output
- `sanitize.ts`: 2 exported functions, type-safe, no side effects
- `response.ts`: 2 exported functions yang bisa dipakai di semua API route handlers
- `security-headers.ts`: Middleware yang otomatis set security headers di semua response
- `_health.get.ts`: Endpoint `GET /api/_health` yang return status tanpa auth
- `error-codes.ts`: Punya entry `CONCURRENT_MODIFICATION` baru

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: `curl http://localhost:3000/api/_health` — return JSON `{ status: 'ok', ... }`
- Test manual: cek response headers di browser DevTools — security headers muncul
````

---

### Fase 5 — Audit Log System

````
## Task: Buat Audit Log System — Schema, Repository, Service, dan Logger

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan dibuat (baru):
  - `server/database/schema/audit-log.ts`
  - `server/repositories/audit-log.repo.ts`
  - `server/services/audit.service.ts`
  - `server/utils/logger.ts`
- File yang akan diedit:
  - `server/database/schema/index.ts` — tambah export audit-log
- File referensi (baca dulu sebelum mulai):
  - `server/database/schema/claim-history.ts` — REFERENSI UTAMA untuk schema pattern
  - `server/repositories/claim-history.repo.ts` — REFERENSI UTAMA untuk repository pattern
  - `server/services/claim.service.ts` — contoh service pattern (lihat error handling, transaction usage)
  - `server/database/schema/index.ts` — lihat cara export schema dan types
  - `server/utils/pagination.ts` — utility yang akan dipakai di repo (calcOffset, buildPaginationMeta)
  - `server/database/index.ts` — database instance import

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Schema: ikuti pattern Drizzle sqliteTable + drizzle-zod (createInsertSchema, createSelectSchema)
- Repository: pure data access, no business logic, accept optional `tx?: DbTransaction`
- Service: business logic, call repository, throw errors dari ErrorCode
- IKUTI pattern dari file referensi PERSIS — file structure, naming, import style, export style.

### Existing Pattern
Baca `server/database/schema/claim-history.ts` dan perhatikan:
- Table definition: `sqliteTable('table_name', { ... columns }, table => [ ...indexes ])`
- Column patterns: `integer().primaryKey({ autoIncrement: true })`, `text().notNull()`, timestamp dengan `default(sql\`...\`)`
- Zod schema: `createInsertSchema(table, { ...overrides }).omit({ id: true, createdAt: true })`
- Type exports: `type X = typeof table.$inferSelect`

Baca `server/repositories/claim-history.repo.ts` dan perhatikan:
- Class-based atau object-based repository pattern
- Methods: `findAll(filters, page, limit)`, `findById(id)`, `insert(data)`, `count(filters)`
- Return type: `Promise<[items, total]>` untuk list queries
- Optional `tx?: DbTransaction` parameter

Kode yang kamu tulis HARUS mengikuti conventions ini PERSIS.

### Instruksi
1. **`server/database/schema/audit-log.ts`**: Buat tabel `audit_log` dengan kolom:
   - `id`: integer primary key auto increment
   - `action`: text not null (CREATE, UPDATE, DELETE, STATUS_CHANGE, LOGIN, LOGOUT, dll)
   - `entityType`: text not null (claim, vendor, user, vendorClaim, setting, dll)
   - `entityId`: text not null (ID of affected entity)
   - `actorId`: text not null (user.id who performed action)
   - `actorName`: text not null (denormalized for read perf)
   - `changes`: text mode json, nullable (object: `{ field: { from, to } }`)
   - `metadata`: text mode json, nullable (extra context)
   - `ipAddress`: text, nullable
   - `createdAt`: integer timestamp_ms with default
   - Indexes: `(entity_type, entity_id)`, `(actor_id)`, `(created_at)`, `(action)`
   - Buat insertSchema, selectSchema, dan type exports seperti pattern claim-history
2. **`server/database/schema/index.ts`**: Tambahkan `export * from './audit-log'`
3. **`server/repositories/audit-log.repo.ts`**: Buat repository dengan methods:
   - `insert(data)` — insert satu audit log entry
   - `findAll(filters, page, limit)` — list dengan filter (action, entityType, actorId, dateRange, search) + pagination
   - `count(filters)` — count untuk pagination
   - Ikuti pattern claim-history.repo PERSIS
4. **`server/services/audit.service.ts`**: Buat service dengan function:
   - `logAudit(params: { action, entityType, entityId, actorId, actorName, changes?, metadata?, ipAddress? })` — simple wrapper yang call repo.insert
   - `getAuditTrail(filters, page, limit)` — call repo.findAll + buildPaginationMeta
5. **`server/utils/logger.ts`**: Buat structured logger:
   - `createLogger(context: string)` — return object dengan `info`, `warn`, `error` methods
   - Format output: `[LEVEL] [context] message { ...data }` untuk dev, JSON untuk production
   - Cek `process.env.NODE_ENV` untuk format selection
   - Jangan log sensitive data (contoh: filter password fields)

### Expected Output
- Tabel `audit_log` bisa di-generate migration-nya via `pnpm db:generate`
- Repository bisa insert dan query audit logs dengan filters dan pagination
- Service `logAudit()` bisa dipanggil dari service lain untuk mencatat aksi
- Logger bisa dipakai di mana saja: `const log = createLogger('claim.service'); log.info('Claim created', { claimId })`
- Semua file mengikuti pattern existing dengan konsisten

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Jalankan: `pnpm db:generate` — harus generate migration file baru untuk tabel audit_log
````

---

### Fase 7 — File Upload & Storage

````
## Task: Implementasi File Upload & Storage untuk Claim Photos

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan dibuat (baru):
  - `server/utils/storage.ts`
  - `server/api/uploads/[...path].get.ts`
- File yang akan diedit/diverifikasi:
  - API endpoints di `server/api/cs/claims/` yang handle photo upload
- File referensi (baca dulu sebelum mulai):
  - `server/database/schema/claim-photo.ts` — schema tabel claimPhoto (lihat kolom filePath, mimeType, size)
  - `server/repositories/claim-photo.repo.ts` — repository untuk photo records
  - `server/utils/pagination.ts` — contoh pattern utility file
  - `server/utils/auth.ts` — contoh requireAuth usage
  - `server/api/master/vendors/index.post.ts` — contoh POST handler pattern

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Error handling: throw createError() dengan status codes yang tepat
- Auth: semua upload/download endpoints memerlukan auth (requireAuth)
- Validasi ketat: file type (JPEG/PNG/WebP ONLY), max size (10MB), file content check
- IKUTI pattern utility dan API route dari file referensi PERSIS.

### Existing Pattern
Baca `server/utils/pagination.ts` untuk utility file structure.
Baca `server/api/master/vendors/index.post.ts` untuk POST handler pattern.

### Instruksi
1. **`server/utils/storage.ts`**: Buat file upload utility:
   - Gunakan Node.js `fs/promises` untuk file operations (mkdir, writeFile, readFile, unlink)
   - Config: `UPLOAD_DIR` dari `process.env.UPLOAD_DIR || './uploads'`, `MAX_FILE_SIZE` dari env
   - `ALLOWED_MIME_TYPES`: `['image/jpeg', 'image/png', 'image/webp']`
   - Function `saveUpload(file: Buffer, originalName: string, mimeType: string): Promise<UploadResult>`
     - Validate: size < MAX_FILE_SIZE, mimeType in ALLOWED_MIME_TYPES
     - Generate safe filename: `${crypto.randomUUID()}${extname(originalName)}`
     - Organize by date: `YYYY-MM-DD/filename.ext`
     - Create directory if not exists
     - Write file
     - Return: `{ filename, originalName, mimeType, size, path }`
   - Function `deleteUpload(filePath: string): Promise<void>` — hapus file dari disk
   - Function `getUploadPath(relativePath: string): string` — resolve full path
   - Export interface `UploadResult`
2. **`server/api/uploads/[...path].get.ts`**: Buat endpoint serve files:
   - Require auth (requireAuth)
   - Read `path` param dari route
   - Resolve full path via `getUploadPath(path)`
   - Validate path tidak keluar dari UPLOAD_DIR (prevent path traversal: reject `..`)
   - Read file dari disk
   - Set `Content-Type` header sesuai file extension
   - Set cache header: `Cache-Control: private, max-age=86400`
   - Return file buffer/stream
3. **Verifikasi photo upload endpoint**: Cek apakah `server/api/cs/claims/[id]/photos` sudah ada.
   - Jika sudah ada: update untuk menggunakan `saveUpload()` dari storage.ts
   - Jika belum: buat endpoint yang accept multipart/form-data, validate, save, dan create claimPhoto record

### Expected Output
- File upload utility tersedia dan type-safe
- Upload: `POST /api/cs/claims/:id/photos` accept image file → save ke disk → create DB record → return photo metadata
- Download: `GET /api/uploads/2026-04-10/uuid.jpg` serve file dengan correct Content-Type
- Path traversal dilindungi (request `../../../etc/passwd` ditolak)
- File type dan size divalidasi ketat
- Files disimpan terorganisir per tanggal di UPLOAD_DIR

### Validation
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
- Test manual: upload foto via curl/Postman → file tersimpan di uploads/ → GET /api/uploads/... return image
````

---

### Fase 8 — Testing Setup

````
## Task: Setup Testing Framework dan Buat Unit Tests Pertama

### Context
- Project: Nuxt 4 + Nitro, Drizzle ORM + libsql/SQLite, Better-Auth, Zod
- File yang akan dibuat (baru):
  - `vitest.config.ts`
  - `tests/setup.ts`
  - `tests/unit/utils/status-transitions.test.ts`
  - `tests/unit/utils/pagination.test.ts`
  - `tests/unit/utils/fiscal.test.ts`
- File yang akan diedit:
  - `package.json` — tambah test scripts
- File referensi (baca dulu sebelum mulai — INI YANG AKAN DI-TEST):
  - `server/utils/status-transitions.ts` — claim & vendor claim status transition logic
  - `server/utils/pagination.ts` — pagination utility (calcOffset, buildPaginationMeta, schema)
  - `shared/utils/fiscal.ts` — fiscal period utilities (getFiscalPeriodInfo, ranges, resolvers)

### Aturan (WAJIB diikuti)
- Package manager: pnpm. TypeScript strict mode.
- ESLint: commaDangle 'never', braceStyle '1tbs'
- Test framework: Vitest (BUKAN Jest)
- Test file naming: `*.test.ts`
- Test structure: `describe` → `it` blocks dengan clear descriptions
- JANGAN install package lain selain vitest
- Semua test harus PASS — jangan buat test yang expected to fail

### Instruksi
1. **Install Vitest**: `pnpm add -D vitest`
2. **`vitest.config.ts`**: Buat config:
   ```ts
   import { defineConfig } from 'vitest/config'
   export default defineConfig({
     test: {
       environment: 'node',
       include: ['tests/**/*.test.ts'],
       globals: true
     }
   })
   ```
3. **`package.json`**: Tambahkan scripts:
   - `"test": "vitest"`
   - `"test:run": "vitest run"`
4. **`tests/setup.ts`**: Buat file setup minimal (bisa kosong dulu atau setup global mocks jika perlu)
5. **`tests/unit/utils/status-transitions.test.ts`**: Test semua status transition rules:
   - Test semua VALID claim transitions (DRAFT→SUBMITTED, SUBMITTED→IN_REVIEW, dll)
   - Test semua INVALID claim transitions (DRAFT→APPROVED, ARCHIVED→SUBMITTED, dll)
   - Test semua VALID vendor claim transitions
   - Test semua INVALID vendor claim transitions
   - Test `canTransitionClaimStatus()` return true/false correctly
   - Test `canTransitionVendorClaimStatus()` return true/false correctly
6. **`tests/unit/utils/pagination.test.ts`**: Test pagination utilities:
   - `calcOffset(1, 20)` → 0, `calcOffset(2, 20)` → 20, `calcOffset(3, 10)` → 20
   - `buildPaginationMeta(100, 1, 20)` → `{ page: 1, limit: 20, total: 100, totalPages: 5 }`
   - `buildPaginationMeta(0, 1, 20)` → `{ totalPages: 0 }`
   - `buildPaginationMeta(21, 2, 20)` → `{ totalPages: 2 }`
   - Zod schema validation: valid inputs pass, invalid inputs (page=0, limit=101) fail
7. **`tests/unit/utils/fiscal.test.ts`**: Test fiscal period logic:
   - `getFiscalPeriodInfo('2025-04-01')` → `{ fiscalYear: 2025, fiscalHalf: 'FH', fiscalLabel: '2025FH' }`
   - `getFiscalPeriodInfo('2025-10-01')` → `{ fiscalYear: 2025, fiscalHalf: 'LH', fiscalLabel: '2025LH' }`
   - `getFiscalPeriodInfo('2026-03-31')` → `{ fiscalYear: 2025, fiscalHalf: 'LH', fiscalLabel: '2025LH' }`
   - `getFiscalPeriodInfo('2026-01-15')` → `{ fiscalYear: 2025, fiscalHalf: 'LH' }`
   - Edge cases: Jan 1, Mar 31, Apr 1, Sep 30, Oct 1, Dec 31
   - `getFiscalHalfRange(2025, 'FH')` → Apr 1 to Sep 30
   - `parseFiscalLabel('2025FH')` → `{ fiscalYear: 2025, fiscalHalf: 'FH' }`
   - `parseFiscalLabel('invalid')` → `null`
   - `resolvePeriodFilter('this_fiscal_half', referenceDate)` → correct date range

### Expected Output
- `pnpm test:run` executes all 3 test files dan semua PASS
- Status transitions: ~20+ test cases covering all valid/invalid paths
- Pagination: ~8+ test cases covering normal + edge cases
- Fiscal: ~15+ test cases covering all halves, edge dates, and period resolution
- Zero test failures

### Validation
- Jalankan: `pnpm test:run` — semua test PASS, zero failures
- Jalankan: `pnpm typecheck` — harus 0 error
- Jalankan: `pnpm lint` — harus 0 warning baru
````

---

## 8. Urutan Eksekusi Rekomendasi

```
SESSION 1 (Opus) — SUDAH SELESAI
  → Buat finalisasi-be.md
  → Buat cara-prompt.md

SESSION 2 (Sonnet) — Fase 1: Auth Fix
  → Prompt 1.1: Fix seed script
  → Prompt 1.2: Wire useAuthSession
  → Prompt 1.3: Wire useDashboardStore
  → Prompt 1.4: Buat .env.example

SESSION 3 (Sonnet) — Fase 2 batch 1: Master Data
  → Prompt 2.1: Wire vendor master page
  → Prompt 2.2: Wire product-model master page
  → Prompt 2.3: Wire defect master page
  → Prompt 2.4: Wire notification master page

SESSION 4 (Sonnet) — Fase 2 batch 2: Other Pages
  → Prompt 2.5: Wire user management pages
  → Prompt 2.6: Wire vendor claims pages
  → Prompt 2.7: Wire report pages
  → Prompt 2.8: Wire audit trail
  → Prompt 2.9: Wire settings & profile

SESSION 5 (Opus) — Mid Review
  → "Review semua perubahan sejak commit terakhir.
      Baca finalisasi-be.md untuk context.
      Cek konsistensi, missing edge cases, security gaps."

SESSION 6 (Sonnet) — Fase 2.10 + 3: Cleanup & Hardening
  → Prompt 2.10: Cleanup mock data
  → Prompt Fase 3: Security & validation hardening

SESSION 7 (Sonnet) — Fase 5 + 7: Audit & Upload
  → Prompt Fase 5: Audit log system
  → Prompt Fase 7: File upload & storage

SESSION 8 (Sonnet) — Fase 8: Testing
  → Prompt: Testing setup + first test files
  → Lanjutkan test per-service

SESSION 9 (Opus) — Final Review
  → Full review + integration check
  → Fix edge cases
  → Finalisasi deployment config
```

---

## 9. Tips Hemat Token

| DO (Hemat) | DON'T (Boros) |
|---|---|
| Arahkan ke file path, biarkan model baca sendiri | Paste seluruh file content di prompt |
| Satu task per prompt session | Berikan 10 task sekaligus |
| "Ikuti pattern di file X" | Jelaskan pattern dari nol panjang lebar |
| Verifikasi dengan `pnpm typecheck` | Minta model "pastikan benar" tanpa command |
| Gunakan Opus hanya untuk review & planning | Gunakan Opus untuk menulis boilerplate |
| Berikan constraint jelas ("jangan ubah file Y") | Biarkan model menebak scope perubahan |
| Mulai session baru per batch task | Satu session panjang dengan banyak back-and-forth |

---

> **Ringkasan:** Kunci efisiensi adalah memberikan **task kecil + file referensi yang jelas + validation command** ke model murah. Hanya pakai model mahal untuk **planning awal** dan **review akhir**. File `finalisasi-be.md` berfungsi sebagai master plan yang dipecah jadi task cards individual untuk setiap session model murah.
