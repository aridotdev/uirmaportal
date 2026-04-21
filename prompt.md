# Implementasi Checklist - C-FE8 Master Data Pages

## Instruksi utama
- JANGAN ubah UI yang sudah ada.
- Pertahankan layout, hierarchy, styling, copy, spacing, komponen visual, dan alur interaksi yang sudah ada.
- Fokus implementasi hanya pada penggantian data flow mock/local-only menjadi real API integration.
- Jika ada penyesuaian UI kecil yang terpaksa dilakukan agar wiring API berfungsi, batasi seminimal mungkin dan jangan mengubah tampilan visual secara signifikan.

## Keputusan eksplisit yang sudah dikonfirmasi
1. `notification.vue` harus mengambil reference data `vendor` dan `product model` dari API, bukan hardcoded lokal.
2. Saat update `product-model`, frontend harus selalu mengirim full payload (`name`, `inch`, `vendorId`) untuk menghindari celah duplicate check backend yang hanya aktif bila `name` dan `vendorId` sama-sama dikirim.

## Scope utama
Wire 4 halaman master data agar tidak lagi menggunakan mock/local-only mutation:
- `app/pages/dashboard/master/product-model.vue`
- `app/pages/dashboard/master/notification.vue`
- `app/pages/dashboard/master/defect.vue`
- `app/pages/dashboard/master/index.vue`

Catatan:
- `app/pages/dashboard/master/vendor.vue` sudah relatif wired ke API dan dijadikan referensi pola implementasi.
- Fokus C-FE8 adalah menghilangkan mock/local-only flow pada master pages.
- Jangan ubah visual design secara besar; pertahankan UI/UX yang ada, cukup ganti data flow menjadi real API.

## Referensi endpoint backend yang tersedia

### Vendor
- `GET /api/master/vendors`
- `POST /api/master/vendors`
- `PUT /api/master/vendors/:id`
- `PATCH /api/master/vendors/:id/status`

### Product Model
- `GET /api/master/product-models`
- `POST /api/master/product-models`
- `PUT /api/master/product-models/:id`
- `PATCH /api/master/product-models/:id/status`

### Defect
- `GET /api/master/defects`
- `POST /api/master/defects`
- `PUT /api/master/defects/:id`
- `PATCH /api/master/defects/:id/status`

### Notification
- `GET /api/master/notifications`
- `POST /api/master/notifications`
- `PUT /api/master/notifications/:id`
- `PATCH /api/master/notifications/:id/status`
- `POST /api/master/notifications/import`

## Target hasil implementasi
- Semua list master memakai `useFetch(...)` ke endpoint real.
- Semua create/edit/status toggle memakai `$fetch(...)` ke endpoint real.
- Semua mock arrays dan `setTimeout(...)` fake refresh / fake mutation dihapus dari 3 halaman CRUD target.
- Dropdown relasi vendor/model pada halaman terkait mengambil data dari API.
- Loading, error, empty, dan toast tetap konsisten dengan pola existing page.
- `master/index.vue` tidak lagi memakai count hardcoded.

---

## Checklist detail per file

## 1) `app/pages/dashboard/master/defect.vue`

### Data source
- Ganti `defectList = ref([...mock])` menjadi data dari `useFetch('/api/master/defects', { query })`.
- Pertahankan filter `status` + `search`, tetapi query harus diterjemahkan menjadi:
  - `page`
  - `limit`
  - `search`
  - `isActive=true/false` bila filter bukan `ALL`

### Mutations
- `handleUpsert()`:
  - mode create -> `POST /api/master/defects`
  - mode edit -> `PUT /api/master/defects/:id`
- `handleToggleStatus()`:
  - `PATCH /api/master/defects/:id/status`
- Setelah mutasi sukses:
  - `await refresh()`
  - tutup modal terkait
  - tampilkan toast sukses
- Saat gagal:
  - tampilkan toast error dengan pesan dari server bila tersedia

### Cleanup
- Hapus:
  - mock `defectList`
  - semua `setTimeout(...)`
  - ID generation `Date.now()` untuk create
  - fake refresh logic
- Pertahankan:
  - tabel
  - modal detail/edit/status
  - validasi zod lokal
  - styling existing

### UI states
- `isLoading` dipisah lebih aman bila perlu:
  - fetch list
  - upsert mutation
  - status mutation
- Minimal jangan gunakan satu loading state yang membingungkan antar operasi.

---

## 2) `app/pages/dashboard/master/product-model.vue`

### Data source
- Ganti `productModelList = ref([...mock])` dengan `useFetch('/api/master/product-models', { query })`.
- `vendorOptions` juga harus real, ambil dari `GET /api/master/vendors`.
- Query list product model:
  - `page`
  - `limit`
  - `search`
  - `vendorId` bila ada filter vendor nanti dipakai
  - `isActive=true/false` bila filter bukan `ALL`

### Mutations
- `handleUpsert()`:
  - create -> `POST /api/master/product-models`
  - edit -> `PUT /api/master/product-models/:id`
- `handleToggleStatus()`:
  - `PATCH /api/master/product-models/:id/status`

### Keputusan penting yang wajib diikuti
- Saat edit product model, selalu kirim payload lengkap:
  - `name`
  - `inch`
  - `vendorId`
  - `updatedBy` bila sebelumnya dikirim manual
- Jangan kirim partial payload minimal untuk edit.

### Cleanup
- Hapus:
  - mock `productModelList`
  - hardcoded `vendorOptions`
  - `setTimeout(...)`
  - `Date.now()` ID generation
  - fake refresh
- Pertahankan:
  - tabel dan modal existing
  - validasi zod lokal
  - struktur filter/search/pagination

### UI states
- Pastikan ada fallback saat vendor list belum tersedia.
- Saat render nama vendor di table/detail/modal, resolve dari `vendorOptions` hasil API.
- Kalau relasi vendor belum ditemukan, tampilkan fallback seperti `Unknown`.

---

## 3) `app/pages/dashboard/master/notification.vue`

### Data source utama
- Ganti `notificationList = ref([...mock])` dengan `useFetch('/api/master/notifications', { query })`.

### Reference data wajib
- Ambil `vendors` dari `GET /api/master/vendors`
- Ambil `productModels` dari `GET /api/master/product-models`
- Jangan pakai lagi array hardcoded `vendors` dan `productModels`

### Query list notification
- Query harus mengikuti backend:
  - `page`
  - `limit`
  - `search`
  - `vendorId`
  - `status`
  - `branch`
- Filter UI yang saat ini ada harus dipetakan ke query server secara konsisten.

### Stats
- Ubah stats agar berbasis data fetch nyata.
- Jika hanya memakai halaman ter-pagination, ada 2 opsi:
  1. sementara hitung dari item pada page aktif
  2. atau ambil total dari pagination + breakdown dari data aktif bila belum ada endpoint agregat
- Untuk scope sekarang, pilihan aman: stats berbasis data yang sedang termuat, selama tidak misleading secara wording.
- Bila label sekarang mengesankan total global, sesuaikan copy atau hitung dengan hati-hati.

### Mutations
- `handleUpsert()`:
  - create -> `POST /api/master/notifications`
  - edit -> `PUT /api/master/notifications/:id`
- `status toggle / status update`:
  - `PATCH /api/master/notifications/:id/status`
- `handleImportRows()` / submit import:
  - kirim ke `POST /api/master/notifications/import`
  - body mengikuti kontrak backend: `{ rows: [...] }`

### Import flow
- Validasi client-side boleh dipertahankan sebagai UX pre-check.
- Tetapi source of truth import harus backend.
- Mapping vendor/model saat import harus memakai reference data hasil fetch, bukan hardcoded lokal.
- Setelah import sukses:
  - tampilkan summary `imported` dan `failed`
  - refresh list notification
  - tutup modal bila relevan atau tampilkan hasil import sesuai UX existing

### Cleanup
- Hapus:
  - mock `notificationList`
  - hardcoded `vendors`
  - hardcoded `productModels`
  - fake `setTimeout(...)`
  - local-only insert/update list mutation
- Pertahankan:
  - modal import
  - modal detail/upsert
  - tampilan tabel dan stats card
  - date handling yang sudah cocok dengan UI saat ini

### Catatan implementasi penting
- `notificationDate` harus tetap kompatibel dengan schema backend yang menerima/coerce date.
- Saat create/edit, pastikan payload yang dikirim sesuai format yang diharapkan schema backend.
- Saat menampilkan nama vendor/model di table/detail, resolve dari reference data API.

---

## 4) `app/pages/dashboard/master/index.vue`

### Tujuan
- Ganti count hardcoded:
  - vendor
  - product model
  - notification
  - defect

### Opsi implementasi yang direkomendasikan
- Ambil total dari `pagination.total` masing-masing endpoint list:
  - `/api/master/vendors?page=1&limit=1`
  - `/api/master/product-models?page=1&limit=1`
  - `/api/master/notifications?page=1&limit=1`
  - `/api/master/defects?page=1&limit=1`
- Karena belum ada endpoint agregat khusus, ini cukup untuk scope sekarang.

### Catatan
- Fetch bisa dilakukan paralel.
- Jika salah satu gagal, fallback count jangan memecahkan page; tampilkan `--` atau pertahankan placeholder yang aman.

---

## Pola implementasi yang harus diikuti

### Gunakan `vendor.vue` sebagai template referensi
- `app/pages/dashboard/master/vendor.vue` sudah punya pola yang benar untuk:
  - `useFetch` list
  - query computed
  - refresh setelah mutation
  - toast success/error
  - loading + fetch error message
- Samakan pola `product-model`, `defect`, dan semampunya `notification` dengan page ini.

### Error handling
- Selalu tangkap error mutation.
- Tampilkan pesan yang ramah user.
- Gunakan pesan server bila tersedia (`statusMessage` / `message`) sebelum fallback generik.

### Pagination dan filter
- Reset `pageIndex` ke 0 ketika filter/search berubah.
- Gunakan `pagination.totalPages` dari backend bila tersedia.
- Hindari filter client-side penuh atas data yang sudah server-paginated; filtering utama harus dipindahkan ke query API.

### Type handling
- Minimalkan type lokal yang duplikatif bila bisa derive dari response shape.
- Tidak wajib refactor besar sekarang, tapi jangan tambah mock-type baru bila tidak perlu.

### Loading state
- Idealnya pisahkan:
  - pending fetch list
  - mutation create/update
  - mutation toggle status
  - import notification
- Tujuannya agar loading antar aksi tidak saling mengganggu.

### Non-goals
- Jangan redesign UI besar-besaran.
- Jangan refactor seluruh data table abstraction sekarang.
- Jangan mengubah backend contract kecuali benar-benar diperlukan.
- Jangan mengerjakan isu lain di luar C-FE8, kecuali perbaikan kecil yang langsung diperlukan agar wiring API berfungsi.

---

## Acceptance checklist

### Defect page
- [x] List defect datang dari API
- [x] Create defect via API
- [x] Edit defect via API
- [x] Toggle status defect via API
- [x] Tidak ada mock array / fake timeout tersisa

### Product model page
- [ ] List product model datang dari API
- [ ] Vendor options datang dari API
- [ ] Create product model via API
- [ ] Edit product model via API
- [ ] Edit product model mengirim full payload
- [ ] Toggle status product model via API
- [ ] Tidak ada mock array / fake timeout tersisa

### Notification page
- [ ] List notification datang dari API
- [ ] Vendor options datang dari API
- [ ] Product model options datang dari API
- [ ] Create notification via API
- [ ] Edit notification via API
- [ ] Status update notification via API
- [ ] Import notification via API
- [ ] Tidak ada mock array / hardcoded relation list / fake timeout tersisa

### Master index
- [ ] Count cards tidak hardcoded lagi
- [ ] Count diambil dari total endpoint real atau fallback aman

### Verification
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [ ] Smoke check manual:
  - buka 4 halaman master
  - create/edit/toggle tiap entity
  - import notification
  - refresh halaman untuk memastikan perubahan persist
