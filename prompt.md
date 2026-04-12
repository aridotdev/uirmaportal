## Task: Protect Admin/Master Pages with Auth Middleware

### Context
- Project: Nuxt 4 + TypeScript, file-based routing, route middleware in `app/middleware/`
- Issue source: `ref-prompt.md` (`No auth middleware pada admin pages — unprotected route access`)
- Goal: semua halaman admin/master wajib pakai `middleware: 'auth'` agar route tidak bisa diakses tanpa session.

### File Referensi (baca dulu)
- `app/middleware/auth.global.ts` (existing auth flow)
- `app/pages/dashboard/master/vendor.vue` (contoh page dengan `definePageMeta`)
- `app/pages/dashboard/master/product-model.vue` (contoh serupa)

### Scope (single batch)
- Semua halaman admin/master dashboard yang belum punya `middleware: 'auth'`
- Jika ditemukan wrapper page dashboard tanpa guard, tambahkan juga (contoh: `app/pages/dashboard/reports.vue`)

### Instruksi Spesifik
1. Cari semua `definePageMeta` di `app/pages/dashboard/**` dan `app/pages/cs/**`.
2. Untuk setiap page layout dashboard/cs yang belum ada middleware, ubah menjadi:
   - `definePageMeta({ layout: 'dashboard', middleware: 'auth' })`
   - atau `definePageMeta({ layout: 'cs', middleware: 'auth' })`
3. Jangan ubah logic UI, data table, styling, atau business flow. Hanya route guard metadata.
4. Konsistenkan format sesuai ESLint project (`commaDangle: 'never'`, `braceStyle: '1tbs'`).

### Expected Output
- Seluruh halaman admin/master/dashboard dan CS workspace terproteksi middleware auth.
- Tidak ada perubahan behavior selain proteksi route.

### Validation
- Jalankan `pnpm typecheck` (harus 0 error baru).
- Jalankan `pnpm lint` (harus 0 warning/error baru).
- Verifikasi cepat:
  - `grep -rn "definePageMeta" app/pages/dashboard app/pages/cs`
  - pastikan page dashboard/cs konsisten menuliskan `middleware: 'auth'`.
