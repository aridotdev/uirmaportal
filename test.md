# Checklist Belum Selesai (Actionable)

## Bisa ditandai sekarang (jika mengikuti catatan dokumen)

- [ ] `Task 0.5` migrasi import `drizzle-zod` -> `drizzle-orm/zod` (masih ditunda karena kompatibilitas versi).
- [ ] `pnpm typecheck` Fase 1 masih ada error pre-existing (`xlsx` di `app/components/ImportExcelModal.vue`).

## Perlu verifikasi manual (belum bisa otomatis dari catatan saat ini)

- [ ] Uji API Fase 6 via browser/curl/Postman.
- [ ] Verifikasi persistensi settings via `pnpm db:studio` (catatan: implementasi saat ini pakai Nitro storage key-value).

## Checklist Validasi Umum yang masih kosong

- [ ] Service: semua operasi memanggil repository (tanpa query langsung).
- [ ] Service: error dilempar sebagai plain `Error` dengan message dari `ErrorCode`.
- [ ] Service: fiscal fields dihitung via `getFiscalPeriodInfo()` saat insert.
- [ ] Service: status transitions divalidasi sesuai `VALID_TRANSITIONS`.
- [ ] Service: transaction dipakai untuk operasi multi-table.
- [ ] API bisa dites via browser/curl/Postman.
- [ ] Data tersimpan di SQLite dan terverifikasi via `pnpm db:studio`.

## Saran urutan cek cepat

1. Uji endpoint Fase 6 (`/api/audit-trail`, `/api/settings`) dengan akun role sesuai.
2. Validasi data settings setelah update (GET -> PUT -> GET konsisten).
3. Jalankan `pnpm lint` dan `pnpm typecheck` ulang.
4. Jika semua valid, update checklist di `task-backend.md`.
