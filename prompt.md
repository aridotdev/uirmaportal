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

