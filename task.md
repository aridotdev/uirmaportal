# QRCC Review Claim Implementation Task

## Scope Implementasi

- selaraskan business logic QRCC review dengan `doc/7-flow.md:134`
- ubah detail review agar status final ditentukan sistem, bukan tombol manual
- tambahkan read-only behavior berdasarkan status claim
- persist review ke mock API dedicated
- rapikan history dan photo review agar data-driven

## Target Hasil Akhir

- buka claim `SUBMITTED` -> otomatis jadi `IN_REVIEW`
- QRCC bisa edit field tertentu di tab `Claim Info`
- QRCC wajib review semua foto
- `REJECT` wajib punya note
- tombol final hanya satu: `Selesai Review`
- outcome otomatis:
  - ada reject -> `NEED_REVISION`
  - semua verified -> `APPROVED`
- status non-reviewable jadi read-only
- history tercatat sesuai flow

## Rencana Implementasi Bertahap

- `1. Kunci state machine claim`
  - definisikan aturan status: `SUBMITTED -> IN_REVIEW -> NEED_REVISION | APPROVED`
  - pastikan `NEED_REVISION`, `APPROVED`, `ARCHIVED` read-only untuk QRCC
  - tambahkan helper/composable kecil untuk rule status agar tidak tercecer di page

- `2. Rapikan kontrak data mock API`
  - pertahankan `GET /api/claims`
  - pertahankan `GET /api/claims/:id`
  - tambahkan mock endpoint action, misalnya:
    - `POST /api/claims/:id/start-review`
    - `PATCH /api/claims/:id`
    - `POST /api/claims/:id/review`
  - tambahkan sumber data mock untuk:
    - claim photos
    - photo reviews
    - claim history

- `3. Implement auto start review`
  - saat QRCC buka detail claim dengan status `SUBMITTED`, trigger action start review
  - update claim ke `IN_REVIEW`
  - simpan history `START_REVIEW`
  - kalau claim sudah `IN_REVIEW`, jangan dobel menulis history

- `4. Ubah tab Claim Info jadi partial editable`
  - tetap read-only untuk:
    - `notificationCode`
    - `notificationDate`
    - `modelName`
    - `inch`
    - `vendor`
    - `branch`
  - editable untuk:
    - `panelSerialNo`
    - `ocSerialNo`
    - `defect`
    - `odfNumber`
    - `version`
    - `week`
  - perubahan field tidak mengubah status
  - idealnya ada tombol `Save Changes` terpisah atau autosave debounce ringan

- `5. Ubah photo review jadi source of truth`
  - tiap foto hanya punya 3 state: `PENDING`, `VERIFIED`, `REJECT`
  - saat `REJECT`, note wajib diisi
  - tombol verify/reject update local draft review dulu
  - final submit yang commit semuanya ke endpoint review
  - kalau mau lebih kuat, simpan per-foto langsung saat reviewer klik aksi

- `6. Ganti decision bar`
  - hapus tombol manual `Need Revision` dan `Approve Claim`
  - ganti jadi satu tombol `Selesai Review`
  - tombol aktif hanya jika:
    - tidak ada foto `PENDING`
    - semua foto `REJECT` punya note
  - submit logic:
    - ada `REJECT` -> `NEED_REVISION`
    - semua `VERIFIED` -> `APPROVED`

- `7. Tambahkan mode read-only per status`
  - `SUBMITTED`: practically akan segera jadi `IN_REVIEW` saat dibuka
  - `IN_REVIEW`: editable
  - `NEED_REVISION`: read-only untuk QRCC
  - `APPROVED`: read-only
  - `ARCHIVED`: read-only
  - tombol aksi, textarea, dan input harus ikut disable/hide sesuai status

- `8. Perbaiki claim history`
  - tampilkan history dari data mock/API, bukan generate lokal sederhana
  - minimal event:
    - `SUBMIT`
    - `START_REVIEW`
    - `REVIEW_PHOTO`
    - `REJECT`
    - `APPROVE`
    - nanti bisa tambah `REVISION_SUBMIT`
  - history harus merepresentasikan actor, waktu, note, dan perubahan status

- `9. Tambahkan validasi UX`
  - warning jika reject note kosong
  - indicator foto mana yang belum direview
  - indicator page read-only saat status tidak bisa direview
  - loading/error state untuk action submit review dan start review

- `10. Verifikasi akhir`
  - run `pnpm typecheck`
  - run `pnpm lint` kalau ingin sekalian rapikan
  - cek manual skenario utama:
    - submitted -> buka detail -> in review
    - review campuran -> selesai -> need revision
    - review semua verified -> selesai -> approved
    - buka approved/need revision -> read-only

## Acceptance Criteria

- membuka claim `SUBMITTED` mengubah status ke `IN_REVIEW`
- QRCC hanya bisa finalisasi setelah semua foto reviewed
- claim tidak bisa `APPROVED` jika ada minimal satu foto `REJECT`
- reject wajib punya note
- QRCC tidak bisa edit claim `NEED_REVISION`, `APPROVED`, `ARCHIVED`
- claim history mencatat minimal `START_REVIEW` dan hasil final review
- halaman detail tidak lagi bergantung pada mock lokal untuk status/history inti

## File yang Kemungkinan Akan Disentuh

- `app/pages/dashboard/claims/[id].vue`
- `server/api/claims/[id].get.ts`
- `server/api/claims/index.get.ts`
- `server/utils/claim-data.ts`
- kemungkinan file baru untuk mock review/history, misalnya:
  - `server/utils/claim-review-data.ts`
  - `server/api/claims/[id]/start-review.post.ts`
  - `server/api/claims/[id]/review.post.ts`

## Urutan Eksekusi yang Paling Aman

1. review file flow + baca halaman detail
2. desain kontrak endpoint action mock
3. implement state machine dan read-only rules
4. ubah decision bar jadi `Selesai Review`
5. sambungkan persistence review + history
6. validasi dan typecheck

## Prompt Saran untuk New Session

```text
Implementasikan seluruh logic bisnis QRCC review claim sesuai `doc/7-flow.md` bagian "Flow QRCC — Review Claim RMA".

Target:
- Buka claim `SUBMITTED` -> otomatis `IN_REVIEW` + buat history `START_REVIEW`
- `Claim Info` sebagian editable sesuai dokumen
- `Photo Review`: tiap foto wajib `VERIFIED` atau `REJECT`, dan `REJECT` wajib note
- Ganti decision bar menjadi satu tombol `Selesai Review`
- Finalisasi review:
  - ada foto reject -> `NEED_REVISION`
  - semua foto verified -> `APPROVED`
- Status `NEED_REVISION`, `APPROVED`, `ARCHIVED` harus read-only untuk QRCC
- History harus data-driven, bukan mock lokal sederhana
- Gunakan endpoint dedicated/mock API yang rapi
- Jalankan `pnpm typecheck` di akhir
```
