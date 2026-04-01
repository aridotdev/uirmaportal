# Audit Trail MVP Design for RMA Claim

## Tujuan Dokumen

Dokumen ini adalah desain MVP audit trail untuk aplikasi RMA dengan asumsi belum ada implementasi apa pun. Fokusnya adalah merancang audit trail bisnis yang:

- cukup kuat untuk kebutuhan operasional dan audit internal
- realistis untuk dibangun di MVP
- konsisten dengan schema yang sudah tersedia di `server/database/schema/claim-history.ts`
- mudah diperluas tanpa redesign besar saat flow bisnis bertambah

Dokumen ini tidak membahas logging teknis seperti HTTP access log, error log, tracing infrastruktur, atau analytics frontend.

---

## Prinsip Dasar

### 1. Audit trail adalah business event log per claim

Audit trail dipakai untuk menjawab pertanyaan berikut pada satu timeline claim:

- siapa melakukan aksi
- kapan aksi dilakukan
- event bisnis apa yang terjadi
- status claim berubah dari apa ke apa
- konteks bisnis minimum dari aksi tersebut apa

Audit trail bukan source of truth utama status domain. Status utama tetap berada di tabel `claim`, sementara `claim_history` berfungsi sebagai jejak kronologis yang audit-friendly.

### 2. Hanya event material yang dicatat

Yang wajib tercatat:

- create draft claim
- update draft atau revision yang material
- upload atau delete evidence photo
- submit claim
- start review
- review per photo
- final review result
- submit revision
- generate vendor claim batch
- update vendor decision
- archive claim bila feature itu nanti diaktifkan

Yang tidak perlu masuk audit trail:

- buka halaman
- refresh list
- filter dan sort
- pencarian data
- load detail read-only

### 3. Event status dan non-status sama-sama penting

Best practice audit trail tidak hanya mencatat perpindahan status. Event yang tidak mengubah status tetapi material untuk proses bisnis tetap harus tercatat.

Contoh:

- upload photo saat claim masih `DRAFT`
- review satu photo saat claim `IN_REVIEW`
- claim dimasukkan ke vendor batch saat status claim tetap `APPROVED`
- vendor decision diisi atau diedit saat status claim tetap `APPROVED`

### 4. Audit trail harus ditulis di transaksi yang sama

Setiap perubahan utama pada domain dan penulisan `claim_history` harus berada dalam transaksi database yang sama agar tidak terjadi kondisi:

- status claim berubah tetapi history tidak tertulis
- history tertulis tetapi perubahan domain gagal commit

### 5. Desain MVP memaksimalkan schema yang ada

Untuk MVP, schema `claim_history` yang sudah ada sudah cukup baik karena memuat:

- `claimId`
- `action`
- `fromStatus`
- `toStatus`
- `userId`
- `userRole`
- `note`
- `createdAt`

Karena schema belum punya kolom metadata JSON, seluruh konteks tambahan harus dirancang masuk ke `note` dengan format yang konsisten dan mudah dibaca.

---

## Source of Truth Schema

### Tabel yang dipakai

Audit trail MVP memakai schema existing di `server/database/schema/claim-history.ts`.

Field aktif yang menjadi kontrak desain:

- `id`
- `claimId`
- `action`
- `fromStatus`
- `toStatus`
- `userId`
- `userRole`
- `note`
- `createdAt`

### Action enum yang valid

Action harus memakai enum resmi dari `shared/utils/constants.ts`:

- `CREATE`
- `SUBMIT`
- `REVIEW`
- `APPROVE`
- `REJECT`
- `REQUEST_REVISION`
- `ARCHIVE`
- `UPDATE`
- `UPLOAD_PHOTO`
- `REVIEW_PHOTO`
- `GENERATE_VENDOR_CLAIM`
- `UPDATE_VENDOR_DECISION`

### Status claim yang valid

Status claim yang relevan untuk audit trail:

- `DRAFT`
- `SUBMITTED`
- `IN_REVIEW`
- `NEED_REVISION`
- `APPROVED`
- `ARCHIVED`

---

## Keputusan Desain Penting

### 1. Event `CREATE` menggunakan `DRAFT -> DRAFT`

Secara konsep industri, event create kadang ditulis sebagai `'' -> DRAFT`. Namun schema insert di `server/database/schema/claim-history.ts` memakai validasi:

- `fromStatus: z.string().min(1)`
- `toStatus: z.string().min(1)`

Artinya `fromStatus` kosong tidak valid untuk kontrak input yang berlaku saat ini.

Karena desain MVP harus mengikuti schema yang sudah ada, maka keputusan desain adalah:

- `CREATE` memakai `fromStatus = 'DRAFT'`
- `CREATE` memakai `toStatus = 'DRAFT'`
- konteks pembuatan record baru dijelaskan melalui `action = CREATE` dan `note`

Ini adalah kompromi yang aman, konsisten dengan schema, dan cukup jelas untuk auditor bila note ditulis dengan benar.

### 2. `REJECT` tidak dipakai sebagai final review action claim pada MVP

Walau enum memiliki `REJECT`, pada MVP alur review claim lebih jelas jika:

- penolakan per photo direkam sebagai `REVIEW_PHOTO`
- hasil akhir review claim yang butuh perbaikan direkam sebagai `REQUEST_REVISION`

Action `REJECT` disimpan sebagai cadangan untuk use case lain di masa depan bila domain nanti benar-benar punya terminal rejection claim.

### 3. Vendor flow tetap ditulis per claim, bukan hanya per batch

Saat claim masuk batch vendor atau decision vendor berubah, row audit trail tetap ditulis per `claimId`, bukan hanya di entitas batch. Tujuannya agar auditor bisa membaca lifecycle lengkap hanya dari timeline claim tanpa harus menelusuri batch terlebih dahulu.

---

## Objective MVP

Audit trail MVP harus mampu mendukung kebutuhan berikut:

- timeline per claim yang utuh dari draft sampai vendor decision
- investigasi operasional sederhana tanpa join banyak tabel secara manual
- tampilan UI audit trail di claim detail dan halaman audit trail global
- filtering dasar berdasarkan claim, action, actor, role, dan rentang tanggal
- fondasi yang aman untuk ekspansi ke metadata terstruktur di fase berikutnya

---

## Aktor dan Tanggung Jawab

### CS

CS adalah aktor utama pada fase awal claim:

- create draft
- update draft
- upload evidence
- delete evidence
- submit claim
- update data revisi
- upload ulang evidence revisi
- submit revision

### QRCC

QRCC adalah aktor utama pada fase review dan vendor processing:

- start review
- review per photo
- approve claim
- request revision
- generate vendor claim batch
- update vendor decision

### ADMIN

ADMIN dapat menjalankan aksi yang sama dengan QRCC pada konteks operasional tertentu. Role yang tersimpan di `userRole` harus berupa snapshot saat event terjadi, bukan hasil lookup saat read.

### System

Untuk MVP ini belum dirancang system actor khusus karena schema saat ini mewajibkan `userId` terisi dan belum ada policy user sistem. Semua event audit trail diasumsikan berasal dari user internal yang sedang login.

---

## Kontrak Pengisian Field

### `claimId`

- wajib berisi claim yang terdampak
- untuk event vendor batch, tetap tulis satu row per claim item

### `action`

- wajib salah satu dari `CLAIM_HISTORY_ACTIONS`
- tidak boleh menambahkan string bebas di luar enum

### `fromStatus`

- status claim sesaat sebelum event dicatat
- pada event non-status, nilainya sama dengan status aktif claim saat itu
- pada `CREATE`, nilainya `DRAFT` agar sesuai schema insert saat ini

### `toStatus`

- status claim sesaat setelah event selesai
- pada event non-status, nilainya sama dengan `fromStatus`

### `userId`

- user internal pelaku aksi
- wajib snapshot actor aktual dari session yang sah

### `userRole`

- role pelaku saat aksi dilakukan
- tidak boleh dihitung ulang saat pembacaan history

### `note`

- bersifat opsional di schema, tetapi untuk desain MVP dianggap wajib secara bisnis pada semua event material
- harus singkat, deskriptif, dan konsisten
- dipakai untuk membawa konteks tambahan karena belum ada metadata JSON

### `createdAt`

- diisi otomatis database
- dipakai sebagai urutan waktu utama pada timeline

---

## Rule Baku `fromStatus` dan `toStatus`

### Rule A - Event mengubah status

Jika event memindahkan claim ke status lain:

- `fromStatus = status sebelum aksi`
- `toStatus = status sesudah aksi`

Contoh:

- `DRAFT -> SUBMITTED`
- `SUBMITTED -> IN_REVIEW`
- `IN_REVIEW -> APPROVED`
- `IN_REVIEW -> NEED_REVISION`
- `NEED_REVISION -> SUBMITTED`

### Rule B - Event material tanpa perubahan status

Jika event penting tetapi tidak memindahkan status claim:

- `fromStatus = status saat ini`
- `toStatus = status saat ini`

Contoh:

- `DRAFT -> DRAFT` untuk upload photo draft
- `IN_REVIEW -> IN_REVIEW` untuk review photo
- `APPROVED -> APPROVED` untuk generate vendor claim
- `APPROVED -> APPROVED` untuk update vendor decision

### Rule C - Event create

Untuk MVP ini:

- `CREATE = DRAFT -> DRAFT`

Alasan:

- sesuai validation schema insert yang mensyaratkan minimal 1 karakter
- tidak memerlukan pengecualian khusus pada layer schema
- tetap mudah dikenali auditor karena action `CREATE` eksplisit

---

## Event Matrix MVP

### A. Claim lifecycle by CS

| No | Event bisnis | Actor | Action | fromStatus | toStatus | Wajib dicatat | Template note |
| -- | ------------ | ----- | ------ | ---------- | -------- | ------------- | ------------- |
| 1 | Create draft claim | `CS` | `CREATE` | `DRAFT` | `DRAFT` | Ya | `Claim draft created` |
| 2 | Update draft claim | `CS` | `UPDATE` | `DRAFT` | `DRAFT` | Ya | `Draft updated: {changedFields}` |
| 3 | Upload photo in draft | `CS` | `UPLOAD_PHOTO` | `DRAFT` | `DRAFT` | Ya | `Photo {photoType} uploaded` |
| 4 | Delete photo in draft | `CS` | `UPDATE` | `DRAFT` | `DRAFT` | Ya | `Photo {photoType} deleted` |
| 5 | Submit claim | `CS` | `SUBMIT` | `DRAFT` | `SUBMITTED` | Ya | `Claim submitted for review` |
| 6 | Update revision data | `CS` | `UPDATE` | `NEED_REVISION` | `NEED_REVISION` | Ya | `Revision data updated: {changedFields}` |
| 7 | Upload photo in revision | `CS` | `UPLOAD_PHOTO` | `NEED_REVISION` | `NEED_REVISION` | Ya | `Photo {photoType} uploaded for revision` |
| 8 | Delete photo in revision | `CS` | `UPDATE` | `NEED_REVISION` | `NEED_REVISION` | Ya | `Revision photo {photoType} deleted` |
| 9 | Submit revision | `CS` | `SUBMIT` | `NEED_REVISION` | `SUBMITTED` | Ya | `Revision submitted` |

### B. Claim lifecycle by QRCC or ADMIN

| No | Event bisnis | Actor | Action | fromStatus | toStatus | Wajib dicatat | Template note |
| -- | ------------ | ----- | ------ | ---------- | -------- | ------------- | ------------- |
| 10 | Start review | `QRCC`, `ADMIN` | `REVIEW` | `SUBMITTED` | `IN_REVIEW` | Ya | `Claim review started` |
| 11 | Update claim field during review | `QRCC`, `ADMIN` | `UPDATE` | `IN_REVIEW` | `IN_REVIEW` | Ya | `Claim fields updated during review: {changedFields}` |
| 12 | Verify photo | `QRCC`, `ADMIN` | `REVIEW_PHOTO` | `IN_REVIEW` | `IN_REVIEW` | Ya | `Photo {photoType} verified` |
| 13 | Reject photo | `QRCC`, `ADMIN` | `REVIEW_PHOTO` | `IN_REVIEW` | `IN_REVIEW` | Ya | `Photo {photoType} rejected: {reason}` |
| 14 | Final approve | `QRCC`, `ADMIN` | `APPROVE` | `IN_REVIEW` | `APPROVED` | Ya | `All photos verified - claim approved` |
| 15 | Request revision | `QRCC`, `ADMIN` | `REQUEST_REVISION` | `IN_REVIEW` | `NEED_REVISION` | Ya | `One or more photos rejected - revision required` |

### C. Vendor claim lifecycle

| No | Event bisnis | Actor | Action | fromStatus | toStatus | Wajib dicatat | Template note |
| -- | ------------ | ----- | ------ | ---------- | -------- | ------------- | ------------- |
| 16 | Generate vendor claim batch | `QRCC`, `ADMIN` | `GENERATE_VENDOR_CLAIM` | `APPROVED` | `APPROVED` | Ya | `Included in vendor claim {vendorClaimNo}` |
| 17 | Vendor decision accepted | `QRCC`, `ADMIN` | `UPDATE_VENDOR_DECISION` | `APPROVED` | `APPROVED` | Ya | `Vendor decision ACCEPTED, compensation={amount}` |
| 18 | Vendor decision rejected | `QRCC`, `ADMIN` | `UPDATE_VENDOR_DECISION` | `APPROVED` | `APPROVED` | Ya | `Vendor decision REJECTED, reason={reason}` |
| 19 | Vendor decision edited | `QRCC`, `ADMIN` | `UPDATE_VENDOR_DECISION` | `APPROVED` | `APPROVED` | Ya | `Vendor decision changed from {old} to {new}, compensation={amount}, reason={reason}` |

### D. Administrative terminal event

| No | Event bisnis | Actor | Action | fromStatus | toStatus | Wajib dicatat | Template note |
| -- | ------------ | ----- | ------ | ---------- | -------- | ------------- | ------------- |
| 20 | Archive claim | `ADMIN`, `QRCC` | `ARCHIVE` | `{currentStatus}` | `ARCHIVED` | Ya bila feature ada | `Claim archived: {reason}` |

---

## Flow End-to-End yang Harus Terlihat di Timeline

### Scenario 1 - Happy path tanpa revisi

Urutan minimum yang diharapkan auditor lihat:

1. `CREATE`
2. `UPDATE` bila draft sempat diedit
3. `UPLOAD_PHOTO` satu atau beberapa kali
4. `SUBMIT`
5. `REVIEW`
6. `REVIEW_PHOTO` untuk setiap photo wajib
7. `APPROVE`
8. `GENERATE_VENDOR_CLAIM`
9. `UPDATE_VENDOR_DECISION`

### Scenario 2 - Perlu revisi lalu disubmit ulang

Urutan minimum:

1. `CREATE`
2. `UPLOAD_PHOTO`
3. `SUBMIT`
4. `REVIEW`
5. `REVIEW_PHOTO` verified dan/atau rejected
6. `REQUEST_REVISION`
7. `UPDATE` untuk perbaikan data bila ada
8. `UPLOAD_PHOTO` untuk upload ulang bila ada
9. `SUBMIT`
10. `REVIEW`
11. `REVIEW_PHOTO`
12. `APPROVE`

### Scenario 3 - Vendor decision berubah

Urutan minimum sesudah claim approved:

1. `GENERATE_VENDOR_CLAIM`
2. `UPDATE_VENDOR_DECISION` initial
3. `UPDATE_VENDOR_DECISION` edited bila keputusan vendor direvisi

---

## Desain Format Note

### Prinsip format

Format `note` harus memenuhi 3 syarat:

- mudah dibaca auditor dan user bisnis
- cukup konsisten untuk difilter atau dicari
- tidak terlalu verbose untuk timeline UI

### Rekomendasi format MVP

Gunakan kalimat natural yang memuat token penting secara konsisten.

Contoh yang disarankan:

- `Claim draft created`
- `Draft updated: panelPartNumber, defectCode`
- `Photo ODF uploaded`
- `Photo ODF deleted`
- `Claim submitted for review`
- `Claim review started`
- `Photo CLAIM verified`
- `Photo ODF rejected: image not clear`
- `All photos verified - claim approved`
- `One or more photos rejected - revision required`
- `Included in vendor claim VC-20260327-0001`
- `Vendor decision ACCEPTED, compensation=500000`
- `Vendor decision REJECTED, reason=Packaging mismatch`

### Aturan isi note per tipe event

#### `UPDATE`

- sebut nama field penting yang berubah
- tidak perlu menyimpan old value dan new value pada MVP
- jangan pakai note generik seperti `updated` atau `success`

#### `UPLOAD_PHOTO`

- wajib menyebut `photoType`
- bila konteks revisi, sebut bahwa upload dilakukan untuk revision

#### `REVIEW_PHOTO`

- wajib menyebut `photoType`
- bila reject, wajib menyebut alasan singkat

#### `GENERATE_VENDOR_CLAIM`

- wajib menyebut `vendorClaimNo`

#### `UPDATE_VENDOR_DECISION`

- wajib menyebut hasil decision
- bila `ACCEPTED`, sertakan `compensation`
- bila `REJECTED`, sertakan `reason`
- bila edit, sebisa mungkin sebut old decision dan new decision

---

## Arsitektur Penulisan History

### Tempat penulisan

Audit trail harus ditulis di service layer, bukan di controller atau component frontend.

Alasan:

- service layer punya konteks bisnis lengkap
- lebih mudah digabungkan dalam transaksi database
- lebih mudah dijaga konsistensinya lintas endpoint dan UI entry point

### Pola yang direkomendasikan

Setiap service yang memodifikasi claim atau proses turunannya mengikuti pola:

1. load current state claim
2. validasi rule bisnis
3. hitung target state dan konteks note
4. simpan perubahan domain
5. simpan row `claim_history` di transaksi yang sama

### Helper yang direkomendasikan untuk MVP

Walau belum wajib, MVP sebaiknya sejak awal memakai helper terpusat seperti:

```ts
recordClaimHistory({
  claimId,
  action,
  fromStatus,
  toStatus,
  userId,
  userRole,
  note
})
```

Helper ini menjaga konsistensi:

- validasi action
- format data minimal
- format note builder per event
- lokasi penulisan audit trail yang seragam

---

## Data Konteks yang Harus Disiapkan Service

### Minimal mandatory

- `claimId`
- `currentStatus`
- `userId`
- `userRole`
- `action`

### Strongly recommended

- `nextStatus` bila event mengubah status
- `changedFields` untuk `UPDATE`
- `photoType` untuk event photo
- `reason` untuk reject atau revision
- `vendorClaimNo` untuk batch vendor
- `vendorDecision`, `compensation`, `rejectReason` untuk decision vendor

### Kenapa ini penting

Tanpa data konteks yang cukup, service akan cenderung menulis note yang terlalu generik dan audit trail cepat kehilangan nilai investigasi.

---

## Desain Query dan Konsumsi UI

### Use case UI MVP

Audit trail dipakai minimal oleh dua area UI:

- tab history pada detail claim
- halaman audit trail global di dashboard

### Query per claim

Kebutuhan minimum:

- filter berdasarkan `claimId`
- sort `createdAt ASC` untuk timeline kronologis
- sort `createdAt DESC` untuk tabel investigasi cepat bila perlu

### Query halaman audit trail global

Filter minimum yang direkomendasikan:

- claim number atau claim id
- action
- user id atau nama actor bila nanti tersedia join user
- user role
- date range

Kolom minimum untuk tabel:

- waktu
- claim reference
- action
- from status
- to status
- actor
- role
- note

### Prinsip tampilan

- timeline claim harus mudah dipindai tanpa membaca tabel lain
- action non-status tetap terlihat jelas
- perubahan status harus diberi penekanan visual lebih tinggi daripada update minor

---

## Contoh Payload MVP

### Create draft

```json
{
  "claimId": 101,
  "action": "CREATE",
  "fromStatus": "DRAFT",
  "toStatus": "DRAFT",
  "userId": "usr_cs_001",
  "userRole": "CS",
  "note": "Claim draft created"
}
```

### Submit claim

```json
{
  "claimId": 101,
  "action": "SUBMIT",
  "fromStatus": "DRAFT",
  "toStatus": "SUBMITTED",
  "userId": "usr_cs_001",
  "userRole": "CS",
  "note": "Claim submitted for review"
}
```

### Reject photo during review

```json
{
  "claimId": 101,
  "action": "REVIEW_PHOTO",
  "fromStatus": "IN_REVIEW",
  "toStatus": "IN_REVIEW",
  "userId": "usr_qrcc_002",
  "userRole": "QRCC",
  "note": "Photo ODF rejected: image not clear"
}
```

### Request revision

```json
{
  "claimId": 101,
  "action": "REQUEST_REVISION",
  "fromStatus": "IN_REVIEW",
  "toStatus": "NEED_REVISION",
  "userId": "usr_qrcc_002",
  "userRole": "QRCC",
  "note": "One or more photos rejected - revision required"
}
```

### Generate vendor claim

```json
{
  "claimId": 101,
  "action": "GENERATE_VENDOR_CLAIM",
  "fromStatus": "APPROVED",
  "toStatus": "APPROVED",
  "userId": "usr_qrcc_002",
  "userRole": "QRCC",
  "note": "Included in vendor claim VC-20260327-0001"
}
```

### Vendor decision accepted

```json
{
  "claimId": 101,
  "action": "UPDATE_VENDOR_DECISION",
  "fromStatus": "APPROVED",
  "toStatus": "APPROVED",
  "userId": "usr_qrcc_002",
  "userRole": "QRCC",
  "note": "Vendor decision ACCEPTED, compensation=500000"
}
```

---

## Acceptance Criteria MVP

### Data correctness

- setiap event material menghasilkan satu row history
- setiap perubahan status claim menghasilkan satu row history
- semua row memakai action enum resmi
- `fromStatus` dan `toStatus` selalu terisi valid
- `userId` dan `userRole` selalu terisi
- note terisi untuk semua event material

### Audit readability

- auditor bisa membaca lifecycle claim secara kronologis dari satu timeline
- event photo review dan vendor decision bisa dipahami tanpa menebak konteks
- generate vendor claim tetap bisa ditelusuri ke claim asal

### Engineering quality

- history ditulis pada transaksi yang sama dengan perubahan utama
- tidak ada event material yang mengubah state domain tanpa audit trail
- format note konsisten antar service
- create event tidak melanggar validation schema existing

---

## Non-Goal MVP

Hal berikut sengaja tidak dimasukkan ke desain MVP:

- metadata JSON terstruktur pada `claim_history`
- system actor otomatis untuk background job
- correlation id atau request id
- event sourcing penuh
- audit log untuk read access
- diff old/new value lengkap di semua field

Ini bisa ditambahkan pada fase berikutnya jika kebutuhan audit dan analytics meningkat.

---

## Roadmap Setelah MVP

Jika MVP berjalan baik dan kebutuhan audit bertambah, evolusi yang paling masuk akal adalah:

1. tambah helper note builder yang lebih terstruktur
2. tambah metadata JSON untuk field penting seperti `photoType`, `vendorClaimNo`, `decision`, dan `changedFields`
3. definisikan actor `SYSTEM` yang resmi untuk job otomatis
4. tambahkan request correlation untuk investigasi lintas service
5. pisahkan entity-level audit bila nanti audit trail tidak lagi cukup direpresentasikan hanya oleh `claimId`

---

## Ringkasan Desain

Desain MVP audit trail RMA ini mengambil pendekatan yang sederhana tetapi kuat:

- tetap memakai schema `claim_history` yang sudah ada
- mencatat semua event bisnis material, bukan hanya perubahan status
- memaksa konsistensi `action`, `fromStatus`, `toStatus`, dan `note`
- menulis event di service layer dalam transaksi yang sama
- mengoptimalkan `note` sebagai carrier konteks sampai metadata terstruktur benar-benar diperlukan

Keputusan paling penting dalam desain ini adalah memakai `CREATE` dengan `DRAFT -> DRAFT` agar tetap selaras dengan kontrak validasi schema existing. Dengan keputusan itu, MVP bisa dibangun tanpa perubahan schema, tetapi tetap menghasilkan audit trail yang jelas, aman, dan cukup audit-friendly untuk aplikasi RMA.
