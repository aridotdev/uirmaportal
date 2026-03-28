# Report Fitur / Analytics & Reporting

Dokumen ini adalah source of truth untuk modul `Reports` dan `Analytics` pada aplikasi RMA Portal.

Fokus dokumen ini adalah:
- menyelaraskan pemahaman product, developer, QA, dan AI coding agent
- mendefinisikan report, KPI, metric, filter, hak akses, dan perilaku screen secara konsisten
- memastikan implementasi analytics tidak berhenti di level tabel data, tetapi benar-benar membantu `MANAGEMENT`, `QRCC`, dan `ADMIN` mengambil keputusan yang tepat

Dokumen ini harus diperlakukan sebagai acuan utama ketika:
- menambah halaman report baru
- mengubah definisi KPI
- mengubah filter atau cakupan data per role
- membuat query backend untuk analytics
- menulis prompt AI untuk implementasi fitur report

---

## 1. Tujuan Dokumen

Modul `Reports` pada aplikasi ini tidak hanya berfungsi sebagai daftar data claim, tetapi sebagai alat kontrol bisnis dan operasional untuk proses RMA.

Tujuan utama analytics & reporting pada aplikasi ini adalah:
- memberi visibilitas performa claim per `branch`, `vendor`, dan `periode waktu`
- membantu management mendeteksi penurunan kualitas lebih awal
- membantu QRCC memonitor bottleneck operasional
- membantu admin dan leadership mengambil keputusan berbasis data
- mendukung evaluasi cabang, vendor, dan efisiensi proses internal
- menyediakan export data yang konsisten untuk kebutuhan audit, review, dan tindak lanjut

---

## 2. Scope dan Batasan

### In Scope

Dokumen ini mencakup:
- halaman `Reports` di dashboard
- KPI cards
- analytics per cabang
- analytics per vendor
- analytics per periode waktu
- trend dan perbandingan performa
- aging dan backlog analytics
- defect analytics
- recovery / vendor decision analytics
- drill-down ke data detail claim
- filter, export, role access, dan definisi metric

### Out of Scope

Dokumen ini tidak mencakup:
- logging teknis level infrastruktur
- frontend analytics seperti click tracking
- custom report builder bebas
- email scheduler untuk report
- integrasi BI external seperti Power BI / Tableau
- predictive analytics berbasis machine learning
- financial settlement accounting penuh di luar domain vendor compensation
- report untuk modul lain yang tidak berkaitan dengan claim RMA

---

## 3. Ringkasan Modul Reports

Modul `Reports` adalah pusat analytics bisnis dan operasional untuk proses claim RMA.

Analytics harus mampu menjawab pertanyaan inti berikut:
- cabang mana yang paling bermasalah
- vendor mana yang kualitas atau responsnya menurun
- defect apa yang paling dominan
- apakah backlog sedang naik atau turun
- apakah performa proses internal membaik atau memburuk
- apakah vendor recovery berjalan efektif
- tindakan apa yang perlu diambil management minggu ini atau bulan ini

Karena itu, halaman report tidak boleh hanya menampilkan angka agregat. Modul ini harus membantu user:
- melihat tren
- membandingkan performa
- menemukan anomali
- masuk ke detail data untuk investigasi

---

## 4. User dan Hak Akses

### Role yang Diizinkan

| Role | Akses Reports | Cakupan Data | Catatan |
| --- | --- | --- | --- |
| `QRCC` | Ya | Semua branch | Fokus operasional dan monitoring proses |
| `MANAGEMENT` | Ya | Hanya branch milik user | Branch wajib terpasang di akun |
| `ADMIN` | Ya | Semua branch | Akses penuh termasuk kebutuhan kontrol dan validasi data |
| `CS` | Tidak | - | Tidak masuk scope dashboard reports |

### Aturan Akses

- `QRCC` dan `ADMIN` dapat melihat seluruh data sesuai filter.
- `MANAGEMENT` hanya dapat melihat data untuk `branch` yang terpasang pada akun.
- Untuk `MANAGEMENT`, filter `branch` harus auto-locked dan tidak dapat diubah.
- Semua export harus tetap mengikuti scope role yang berlaku.
- User tidak boleh bisa mengekspor data di luar scope aksesnya.

---

## 5. Tujuan Bisnis Analytics

Analytics pada aplikasi ini harus membantu 3 level keputusan:

### A. Keputusan Operasional Harian

Digunakan terutama oleh `QRCC`:
- claim mana yang pending terlalu lama
- branch mana yang sering kirim claim perlu revisi
- vendor claim mana yang belum selesai
- defect apa yang sedang dominan

### B. Keputusan Taktis Mingguan / Bulanan

Digunakan oleh `MANAGEMENT` dan `ADMIN`:
- cabang mana yang kinerjanya menurun
- vendor mana yang performanya buruk
- tren claim membaik atau memburuk
- apakah ada backlog yang perlu intervensi

### C. Keputusan Strategis

Digunakan oleh leadership / management:
- vendor mana yang perlu dievaluasi SLA atau kualitasnya
- branch mana yang perlu training atau kontrol mutu tambahan
- model/defect apa yang paling merugikan bisnis
- apakah recovery vendor efektif secara volume dan nominal

---

## 6. Daftar Halaman / Report

Dokumen ini menetapkan struktur target modul report sebagai berikut.

| Halaman / Report | URL | Access | Tujuan |
| --- | --- | --- | --- |
| Executive Overview | `/dashboard/reports` | `QRCC`, `MANAGEMENT`, `ADMIN` | Ringkasan KPI utama dan navigasi ke analisis detail |
| Branch Performance | `/dashboard/reports/branches` | `QRCC`, `MANAGEMENT`, `ADMIN` | Membandingkan performa per cabang |
| Vendor Performance | `/dashboard/reports/vendors` | `QRCC`, `MANAGEMENT`, `ADMIN` | Membandingkan kualitas dan recovery per vendor |
| Period Trend | `/dashboard/reports/trends` | `QRCC`, `MANAGEMENT`, `ADMIN` | Melihat tren claim, approval, revision, backlog dari waktu ke waktu |
| Aging & Backlog | `/dashboard/reports/aging` | `QRCC`, `MANAGEMENT`, `ADMIN` | Memantau claim yang menumpuk atau melewati SLA |
| Defect Analytics | `/dashboard/reports/defects` | `QRCC`, `MANAGEMENT`, `ADMIN` | Melihat defect dominan per vendor, cabang, model, periode |
| Recovery Analytics | `/dashboard/reports/recovery` | `QRCC`, `MANAGEMENT`, `ADMIN` | Menganalisis hasil vendor decision dan compensation |
| Report Detail Drill-down | reuse detail table | `QRCC`, `MANAGEMENT`, `ADMIN` | Menelusuri record claim pendukung analisis |

### Catatan MVP

Jika implementasi dilakukan bertahap, fase MVP cukup dimulai dari:
- `/dashboard/reports`
- analisa per `branch`
- analisa per `vendor`
- analisa per `periode waktu`
- export CSV
- detail drill-down

Halaman lain dapat masuk fase setelah MVP.

---

## 7. KPI dan Metric Utama

Analytics harus dibangun dari KPI yang jelas. Definisi di bawah ini adalah source of truth utama.

### 7.1 KPI Eksekutif Inti

| KPI | Definisi Bisnis | Rumus / Counting Rule | Level | Tujuan |
| --- | --- | --- | --- | --- |
| Total Claims | Jumlah seluruh claim dalam filter aktif | count(`claim.id`) | Claim | Mengukur volume kasus |
| Submitted Claims | Jumlah claim status `SUBMITTED` | count current status `SUBMITTED` | Claim | Mengukur antrean masuk |
| In Review Claims | Jumlah claim status `IN_REVIEW` | count current status `IN_REVIEW` | Claim | Mengukur beban review aktif |
| Need Revision Claims | Jumlah claim status `NEED_REVISION` | count current status `NEED_REVISION` | Claim | Mengukur kualitas input yang perlu diperbaiki |
| Approved Claims | Jumlah claim status `APPROVED` | count current status `APPROVED` | Claim | Mengukur outcome review internal |
| Archived Claims | Jumlah claim status `ARCHIVED` | count current status `ARCHIVED` | Claim | Mengukur data yang selesai ditutup |
| Revision Rate | Persentase claim yang berakhir atau sempat masuk `NEED_REVISION` | `need_revision_claims / total_claims` | Claim | Mengukur kualitas input dari branch/CS |
| Approval Rate | Persentase claim yang approved dari total claim masuk | `approved_claims / total_claims` | Claim | Mengukur kualitas claim dan efektivitas proses |
| Pending Backlog | Claim yang masih belum selesai | count status in open statuses | Claim | Mengukur beban kerja tersisa |
| Avg Claim Cycle Time | Rata-rata durasi dari submit sampai keputusan internal final | avg(`approved/revision_at - submitted_at`) | Claim | Mengukur kecepatan proses |
| Avg Review Lead Time | Rata-rata durasi dari `SUBMITTED` ke `IN_REVIEW` / final review | avg(review duration) | Claim | Mengukur respons QRCC |
| Vendor Pending Items | Jumlah item vendor claim dengan decision `PENDING` | count(`vendor_claim_item` pending) | Vendor claim item | Mengukur backlog vendor |
| Vendor Acceptance Rate | Persentase item vendor yang diterima | `accepted_items / decided_items` | Vendor claim item | Mengukur keberhasilan recovery |
| Vendor Rejection Rate | Persentase item vendor yang ditolak | `rejected_items / decided_items` | Vendor claim item | Mengukur kualitas klaim ke vendor |
| Recovery Amount | Total nominal kompensasi vendor yang diterima | sum(compensation accepted) | Vendor claim item | Mengukur manfaat finansial |
| Recovery Ratio | Rasio recovery terhadap total nilai eligible | `total_compensation / total_eligible_value` | Financial | Mengukur efektivitas recovery |

### 7.2 KPI Per Cabang

| KPI | Definisi | Catatan |
| --- | --- | --- |
| Total Claims per Branch | Jumlah claim dari branch tertentu | KPI volume dasar |
| Approval Rate per Branch | Proporsi claim branch yang approved | Indikator kualitas klaim / validitas kasus |
| Revision Rate per Branch | Proporsi claim branch yang perlu revisi | Indikator kualitas input dan kepatuhan proses |
| Avg Review Lead Time per Branch | Rata-rata waktu respons QRCC terhadap claim branch | Mengukur kecepatan penanganan |
| Avg Claim Cycle Time per Branch | Rata-rata durasi submit sampai final review | Mengukur efisiensi proses |
| Open Backlog per Branch | Jumlah claim branch yang masih open | Mengukur beban tersisa |
| Aging > SLA per Branch | Jumlah claim branch yang melewati SLA | Mengukur risiko operasional |
| Top Defect per Branch | Defect terbanyak di branch | Input untuk tindakan kualitas lokal |
| Top Vendor Contributor per Branch | Vendor yang paling banyak terkait claim di branch | Membantu investigasi sumber masalah |

### 7.3 KPI Per Vendor

| KPI | Definisi | Catatan |
| --- | --- | --- |
| Total Claims per Vendor | Jumlah claim yang terkait vendor tertentu | Volume dasar vendor |
| Approved Claims per Vendor | Jumlah claim approved yang siap/masuk proses vendor | Mengukur beban vendor |
| Vendor Acceptance Rate | Persentase keputusan vendor accepted | KPI inti supplier performance |
| Vendor Rejection Rate | Persentase keputusan vendor rejected | KPI inti supplier performance |
| Avg Vendor Decision Lead Time | Rata-rata durasi batch/vendor item sampai keputusan vendor | KPI SLA vendor |
| Total Compensation per Vendor | Nominal kompensasi diterima dari vendor | KPI finansial |
| Recovery Ratio per Vendor | Persentase nilai recovery terhadap nilai eligible | KPI efektivitas vendor |
| Repeat Defect Frequency | Frekuensi defect yang berulang untuk vendor yang sama | KPI kualitas vendor |
| Top Branch Contributor | Branch mana paling banyak memicu claim ke vendor tersebut | Membantu analisa pola distribusi |
| Top Model / Defect | Model/defect dominan pada vendor tersebut | Berguna untuk supplier review |

### 7.4 KPI Per Periode Waktu

| KPI | Definisi | Catatan |
| --- | --- | --- |
| Claim Inflow Trend | Tren claim baru masuk per hari/minggu/bulan | Memantau lonjakan kasus |
| Closure Trend | Tren claim selesai review internal | Mengukur throughput |
| Backlog Trend | Tren jumlah claim open | Mengukur akumulasi antrean |
| Revision Trend | Tren persentase claim yang perlu revisi | Mengukur kualitas input dari waktu ke waktu |
| Approval Trend | Tren approval rate | Mengukur stabilitas proses |
| Vendor Recovery Trend | Tren accepted/rejected/compensation vendor | Mengukur performa supplier |
| Defect Mix Trend | Perubahan komposisi defect antar periode | Mendeteksi masalah kualitas yang berubah |
| Aging Trend | Tren jumlah claim yang mendekati/melewati SLA | Mengukur risiko delay |

---

## 8. Definisi Formula dan Aturan Penghitungan

Bagian ini wajib diikuti agar query analytics konsisten.

### 8.1 Prinsip Umum

- Semua count utama pada report claim dihitung berdasarkan entitas `claim`.
- Semua count vendor decision dihitung berdasarkan entitas `vendor_claim_item`.
- Kecuali dinyatakan lain, status yang dipakai adalah `current latest status`.
- Filter tanggal default pada report claim menggunakan `claim.createdAt`.
- Jika di masa depan ditambahkan report berbasis SLA atau cycle time, timestamp bisnis yang dipakai harus eksplisit dan tidak boleh diasumsikan.

### 8.2 Open Statuses

Status yang dianggap `open`:
- `DRAFT`
- `SUBMITTED`
- `IN_REVIEW`
- `NEED_REVISION`

Status yang dianggap `closed`:
- `APPROVED`
- `ARCHIVED`

Catatan:
- Jika bisnis menganggap `APPROVED` masih open sampai vendor decision selesai, definisi ini harus dinyatakan khusus pada report tertentu, bukan mengubah definisi global tanpa dokumentasi.

### 8.3 Revision Rate

`Revision Rate = jumlah claim yang current status atau final review outcome-nya NEED_REVISION / total claim dalam filter`

Catatan:
- Untuk MVP, cukup pakai current status `NEED_REVISION`.
- Untuk fase lanjut, dapat ditambah metric historikal: claim yang pernah masuk revision minimal satu kali.

### 8.4 Approval Rate

`Approval Rate = jumlah claim current status APPROVED / total claim dalam filter`

### 8.5 Avg Review Lead Time

Definisi ideal:
- durasi dari `submitted_at` ke `review_started_at`
- atau dari `submitted_at` ke `approved_at / revision_at`

Untuk MVP:
- jika timestamp detail belum lengkap, boleh pakai event `claim_history` untuk menghitung:
  - `SUBMIT`
  - `REVIEW`
  - `APPROVE`
  - `REQUEST_REVISION`

### 8.6 Avg Claim Cycle Time

Definisi:
- durasi dari claim `SUBMITTED` sampai claim mendapat outcome internal final:
  - `APPROVED`, atau
  - `NEED_REVISION`

### 8.7 Vendor Acceptance Rate

`Vendor Acceptance Rate = accepted vendor items / total vendor items yang sudah diputuskan`

Dengan:
- accepted = `vendorDecision = ACCEPTED`
- rejected = `vendorDecision = REJECTED`
- decided items = accepted + rejected
- `PENDING` tidak masuk denominator

### 8.8 Recovery Amount

Definisi:
- total sum nominal kompensasi pada item vendor yang `ACCEPTED`

### 8.9 Recovery Ratio

Definisi ideal:
- `total compensation accepted / total eligible claim value`

Catatan:
- Jika nilai claim belum tersedia di schema, metric ini belum bisa dihitung akurat.
- Pada MVP boleh diganti sementara dengan `accepted items / total approved items sent to vendor`, tetapi label harus jelas dan tidak boleh menyesatkan.

---

## 9. Source of Truth Data

### Entitas Utama

| Entitas | Fungsi |
| --- | --- |
| `claim` | Sumber utama analytics claim |
| `claim_history` | Sumber event untuk cycle time, review activity, audit-based KPI |
| `vendor` | Dimensi vendor |
| `product_model` | Dimensi model produk |
| `notification_master` | Dimensi notification dan konteks sumber claim |
| `defect_master` | Dimensi defect |
| `vendor_claim` | Header batch vendor claim |
| `vendor_claim_item` | Sumber utama vendor decision analytics |
| `user` | Sumber role, branch, dan aktor proses |

### Aturan Source of Truth

- Jika ada perbedaan label UI dan enum backend, enum backend tetap source of truth final.
- Jika ada metric yang butuh lifecycle, gunakan `claim_history`, bukan hanya `claim.updatedAt`.
- Jika ada metric per vendor decision, gunakan `vendor_claim_item`, bukan hanya status claim.
- Semua agregasi harus mempertahankan scope role user.

---

## 10. Filter dan Dimensi

### Filter Global yang Wajib Didukung

| Filter | Tipe | Berlaku di | Catatan |
| --- | --- | --- | --- |
| Date Range | from/to | Semua report | Wajib tersedia |
| Period | daily/weekly/monthly | Trend report | Wajib untuk analisa tren |
| Branch | select | Branch, Executive, Aging, Defect | Auto-locked untuk `MANAGEMENT` |
| Vendor | select | Vendor, Executive, Defect, Recovery | Opsional tergantung report |
| Claim Status | select | Claim-based reports | Untuk fokus ke status tertentu |
| Vendor Decision | select | Recovery report | `PENDING`, `ACCEPTED`, `REJECTED` |
| Defect | select/search | Defect analytics | Untuk drill-down |
| Model | select/search | Vendor/Defect analytics | Untuk analisa model |
| Reviewer / User | select/search | Operational analytics fase lanjut | Tidak wajib untuk MVP |

### Aturan Filter

- Semua filter bersifat kombinatif.
- Export harus mengikuti filter aktif.
- Summary cards, charts, dan table harus menggunakan query filter yang konsisten.
- Jika filter menghasilkan nol data, UI harus menampilkan empty state yang informatif.
- Untuk `MANAGEMENT`, filter branch tetap tampil tetapi disabled/read-only.

---

## 11. Struktur Screen dan Kebutuhan Produk

### 11.1 Screen: Executive Overview

#### Status Implementasi

- ✅ Foundation FE-1.3 sudah diimplementasikan pada `app/pages/dashboard/reports/index.vue`
- ✅ Layout utama Executive Overview sudah tersedia dengan placeholder data mengikuti design style dashboard yang ada sekarang
- ✅ Section dasar yang sudah disiapkan: KPI cards, trend section, top branches, top vendors, top defects, filter controls dasar, dan action header
- ℹ️ Implementasi ini masih tahap foundation UI; integrasi API, reusable component terpisah, drill-down detail table, serta state loading/empty/error per-widget tetap mengikuti task fase berikutnya

#### URL

`/dashboard/reports`

#### Tujuan Screen

Memberi ringkasan KPI paling penting dan entry point untuk analisa lebih detail.

#### User Story

- sebagai `MANAGEMENT`, saya ingin melihat performa branch saya secara ringkas agar saya bisa cepat tahu kondisi bisnis
- sebagai `QRCC`, saya ingin melihat volume claim, backlog, dan tren agar saya tahu prioritas kerja
- sebagai `ADMIN`, saya ingin memonitor data keseluruhan agar bisa memvalidasi performa operasional dan kebutuhan audit

#### Informasi yang Harus Ada

- KPI cards:
  - Total Claims
  - Submitted
  - In Review
  - Need Revision
  - Approved
  - Pending Backlog
  - Avg Review Lead Time
  - Vendor Pending Items
- trend chart per periode
- top 5 branches by claim volume
- top 5 vendors by claim volume
- top defect summary

#### Aksi User

- ubah date range
- ubah period
- filter vendor
- filter branch
- klik KPI card untuk drill ke detail
- export data
- refresh

#### State yang Harus Didukung

- loading
- empty state
- error state
- no data in selected filter
- partial data jika beberapa widget gagal

#### Aturan Produk

- summary cards dan chart harus konsisten terhadap filter aktif
- warna status harus konsisten dengan status claim
- angka KPI harus selalu menampilkan angka final, bukan placeholder ambigu
- management hanya melihat branch sendiri

#### Acceptance Criteria

- user dapat memfilter data berdasarkan tanggal
- KPI cards berubah sesuai filter
- chart dapat berpindah daily/weekly/monthly
- export menghasilkan data sesuai filter aktif
- user dapat masuk ke data detail dari widget utama

### 11.2 Screen: Branch Performance

#### URL

`/dashboard/reports/branches`

#### Tujuan Screen

Membandingkan performa antar cabang dan membantu management mendeteksi cabang yang membutuhkan intervensi.

#### Informasi yang Harus Ada

- ranking branch
- total claims per branch
- approval rate per branch
- revision rate per branch
- avg cycle time per branch
- backlog open per branch
- aging > SLA per branch
- top defect per branch

#### Aksi User

- sort ranking
- filter periode
- klik satu branch untuk drill-down
- compare 2-5 branch

#### Aturan Produk

- `MANAGEMENT` hanya melihat branch sendiri, jadi ranking lintas branch tidak ditampilkan untuk role ini
- branch comparison penuh hanya untuk `QRCC` dan `ADMIN`

#### Acceptance Criteria

- ranking berubah sesuai filter
- branch detail dapat ditelusuri ke claim list
- data branch tidak bocor ke management di luar branch user

### 11.3 Screen: Vendor Performance

#### URL

`/dashboard/reports/vendors`

#### Tujuan Screen

Mengevaluasi kualitas vendor dan efektivitas recovery.

#### Informasi yang Harus Ada

- total claims per vendor
- approved claims sent to vendor
- vendor acceptance rate
- vendor rejection rate
- avg vendor decision lead time
- total compensation
- recovery ratio
- top defect per vendor
- top branch contributor

#### Aksi User

- filter vendor
- compare vendor
- lihat vendor scorecard
- drill ke batch vendor claim dan item detail

#### Acceptance Criteria

- user dapat melihat vendor yang performanya memburuk
- user dapat melihat vendor dengan kontribusi defect terbesar
- export vendor report menghormati filter aktif

### 11.4 Screen: Period Trend

#### URL

`/dashboard/reports/trends`

#### Tujuan Screen

Melihat tren performa dari waktu ke waktu untuk mengidentifikasi pola naik, turun, dan anomali.

#### Informasi yang Harus Ada

- claim inflow trend
- closure trend
- revision trend
- approval trend
- backlog trend
- vendor recovery trend
- defect mix trend

#### Aturan Produk

- period selector minimal mendukung `daily`, `weekly`, `monthly`
- grafik harus dapat dibandingkan dengan periode sebelumnya
- jika memungkinkan, tampilkan delta `% vs previous period`

### 11.5 Screen: Aging & Backlog

#### URL

`/dashboard/reports/aging`

#### Tujuan Screen

Membantu tim memprioritaskan claim yang menumpuk atau berisiko melewati SLA.

#### Informasi yang Harus Ada

- total backlog
- aging buckets:
  - 0-2 hari
  - 3-7 hari
  - 8-14 hari
  - >14 hari
- breakdown per status
- breakdown per branch
- breakdown per vendor
- daftar claim prioritas

#### Aturan Produk

- bucket aging harus dihitung konsisten
- definisi aging harus jelas:
  - untuk claim review: sejak `SUBMITTED`
  - untuk vendor pending: sejak item vendor claim dibuat / dikirim

#### Acceptance Criteria

- user dapat melihat claim mana yang paling urgent
- user dapat filter aging berdasarkan branch, vendor, dan status
- user dapat drill ke detail claim

### 11.6 Screen: Defect Analytics

#### Status Implementasi

- ✅ FE-4.1 sudah diimplementasikan pada `app/pages/dashboard/reports/defects.vue`
- ✅ Halaman sudah mencakup KPI strip, defect Pareto, tren defect, model mix, serta breakdown defect by vendor/branch
- ✅ Navigasi sub-report ke `/dashboard/reports/defects` sudah aktif pada tab reports
- ℹ️ Implementasi saat ini masih berbasis mock data UI; integrasi API, loading/empty/error state per-widget, dan drill-down detail mengikuti fase berikutnya

#### URL

`/dashboard/reports/defects`

#### Tujuan Screen

Mengidentifikasi defect paling dominan dan hubungannya dengan branch, vendor, model, dan periode.

#### Informasi yang Harus Ada

- top defect by count
- defect Pareto
- defect by vendor
- defect by branch
- defect by model
- tren defect dari waktu ke waktu

#### Aturan Produk

- defect analytics harus mendukung drill-down sampai daftar claim
- jika nama defect berubah di master, histori analytics harus tetap konsisten menurut source data saat itu atau mapping yang jelas

### 11.7 Screen: Recovery Analytics

#### URL

`/dashboard/reports/recovery`

#### Tujuan Screen

Menganalisis hasil vendor decision dan dampak finansial dari proses recovery.

#### Informasi yang Harus Ada

- total vendor items
- pending / accepted / rejected
- acceptance rate
- rejection rate
- total compensation
- compensation trend
- vendor ranking by recovery amount
- unresolved vendor items

#### Aturan Produk

- jika nominal finansial belum lengkap di MVP, screen tetap dapat hidup dengan count-based analytics
- label metric harus jujur terhadap data yang tersedia

---

## 12. Daftar KPI Cards Minimum untuk MVP

Jika implementasi dilakukan bertahap, maka MVP analytics minimal harus memiliki KPI berikut:

| KPI Card | Wajib di MVP |
| --- | --- |
| Total Claims | Ya |
| Submitted | Ya |
| In Review | Ya |
| Need Revision | Ya |
| Approved | Ya |
| Pending Backlog | Ya |
| Avg Review Lead Time | Ya, jika event data cukup |
| Vendor Pending Items | Ya |
| Vendor Acceptance Rate | Ya |
| Top Branch by Claim | Ya |
| Top Vendor by Claim | Ya |

---

## 13. Detail Table dan Drill-down

Detail table adalah komponen wajib pendukung analytics.

### Kolom Minimum Claim Detail

| Kolom | Sumber |
| --- | --- |
| Claim Number | `claim.claimNumber` |
| Vendor | `vendor.name` |
| Model | `product_model.name` |
| Notification | `notification_master.notificationCode` |
| Branch | `claim.branch` |
| Defect | `defect_master.name` atau `claim.defectCode` |
| Status | `claim.claimStatus` |
| Submitted By | `claim.submittedBy` |
| Created At | `claim.createdAt` |
| Updated At | `claim.updatedAt` |

### Aturan Detail Table

- harus mendukung server-side pagination
- harus konsisten dengan filter report aktif
- harus dapat dibuka dari widget, chart, ranking, atau KPI card
- harus menjadi alat investigasi, bukan hanya pelengkap visual

---

## 14. Export Rules

### Format Export

Untuk MVP, format export yang wajib didukung adalah:
- `CSV`

### Aturan Export

- export selalu mengikuti filter aktif
- export selalu mengikuti scope role
- export mengambil seluruh data sesuai filter, bukan hanya current page
- nama file harus konsisten dan informatif

### Contoh Nama File

- `claim-report-YYYYMMDD.csv`
- `branch-performance-YYYYMMDD.csv`
- `vendor-performance-YYYYMMDD.csv`
- `aging-report-YYYYMMDD.csv`

### Catatan Fase Lanjut

Fase setelah MVP dapat menambahkan:
- `XLSX`
- multi-sheet export
- scheduled export
- email report delivery

---

## 16. Non-Goals MVP

Fitur berikut tidak wajib pada MVP analytics:
- custom dashboard builder
- drag-and-drop widget
- scheduled report email
- forecast / predictive analytics
- machine learning anomaly detection
- per-user personal dashboard config
- benchmark eksternal antar perusahaan
- near real-time streaming analytics

---

## 17. Kebutuhan Data Tambahan untuk Fase Lanjut

Agar analytics lebih matang, sistem idealnya menyiapkan atau menambah data berikut:

### Timestamp Bisnis

- `submitted_at`
- `review_started_at`
- `approved_at`
- `revision_requested_at`
- `vendor_batch_created_at`
- `vendor_decision_at`

### Data Finansial

- estimated claim value
- compensation requested
- compensation approved
- unrecovered amount

### Denominator Bisnis

Agar bisa menghitung `claim rate` yang lebih benar, sistem idealnya punya salah satu:
- total unit sold
- total unit shipped
- total notification volume
- total service volume

Tanpa denominator, analytics rate masih bersifat volume absolut atau proxy.

---

## 18. Roadmap Implementasi

### Phase 1 - MVP Analytics

Wajib:
- executive overview
- KPI cards
- trend per periode
- analytics per branch
- analytics per vendor
- CSV export
- detail drill-down

### Phase 2 - Operational Intelligence

Direkomendasikan:
- aging & backlog report
- defect Pareto
- SLA monitoring
- per reviewer productivity

### Phase 3 - Decision Support

Direkomendasikan:
- vendor scorecard
- financial recovery analytics
- benchmark branch
- early warning dan anomaly detection sederhana

---

## 19. Task List Implementasi

Bagian ini memecah pekerjaan implementasi agar tim dapat mengeksekusi bertahap tanpa kehilangan konteks bisnis.

### 19.1 Frontend Task List

#### Phase 1 - MVP Analytics UI

- [x] buat ulang halaman `app/pages/dashboard/reports/index.vue` menjadi `Executive Overview` dengan foundation layout dan placeholder data untuk KPI cards, trend section, top branch, top vendor, dan top defect
- [x] tambahkan period selector `daily` / `weekly` / `monthly` yang konsisten dengan chart dan summary
- [ ] pertahankan filter global: date range, vendor, branch, status; pastikan `branch` auto-locked untuk `MANAGEMENT`
- [x] tambahkan widget `Pending Backlog`, `Vendor Pending Items`, dan `Vendor Acceptance Rate`
- [ ] buat komponen reusable untuk KPI card, ranking list, chart wrapper, dan empty/error state report
- [ ] buat drill-down interaction dari KPI card / ranking / chart ke detail table terfilter
- [ ] rapikan loading state agar tiap widget dapat tampil independent jika sebagian endpoint masih loading
- [ ] pertahankan export action yang mengikuti filter aktif

#### Phase 2 - Additional Screens UI

- [x] buat halaman `app/pages/dashboard/reports/branches.vue`
- [x] buat halaman `app/pages/dashboard/reports/vendors.vue`
- [x] buat halaman `app/pages/dashboard/reports/trends.vue`
- [x] buat halaman `app/pages/dashboard/reports/aging.vue`
- [x] buat halaman `app/pages/dashboard/reports/defects.vue`
- buat halaman `app/pages/dashboard/reports/recovery.vue`
- [x] tambahkan navigasi sub-report pada layout report atau tab internal yang konsisten dengan dashboard
- [x] buat tabel dan visualisasi yang mendukung compare mode untuk branch dan vendor

#### Phase 3 - UX, QA, dan Guardrail UI

- [ ] pastikan semua angka, label, tooltip, dan empty state sesuai definisi dokumen ini
- [ ] buat helper format percentage, duration, currency, dan delta period agar konsisten di semua screen
- [ ] pastikan error state tidak membocorkan data di luar scope role
- [ ] pastikan chart dan card tetap usable di desktop dan tablet minimum
- [ ] tambahkan test UI untuk role `QRCC`, `MANAGEMENT`, dan `ADMIN`

### 19.2 Backend Task List

#### Phase 1 - MVP Analytics API

- tetapkan kontrak endpoint report baru di `server/api/reports/*` untuk executive overview, branch analytics, vendor analytics, trend, dan drill-down detail
- buat service terpusat analytics, misalnya `server/services/report-analytics.service.ts`, agar definisi KPI tidak tersebar
- buat repository/query layer analytics terpisah dari report detail dasar jika query mulai kompleks
- implementasikan summary KPI: total claims, submitted, in review, need revision, approved, backlog
- implementasikan trend query dengan grouping `daily` / `weekly` / `monthly`
- implementasikan aggregation per branch
- implementasikan aggregation per vendor
- implementasikan top defect aggregation
- implementasikan vendor pending items dan vendor acceptance rate dari `vendor_claim_item`
- pastikan semua endpoint menegakkan role scope di backend, terutama pembatasan branch untuk `MANAGEMENT`
- pastikan export endpoint mengikuti filter dan role scope yang sama dengan screen

#### Phase 2 - Lifecycle Metrics dan Advanced Aggregation

- hitung `Avg Review Lead Time` dari `claim_history` event `SUBMIT`, `REVIEW`, `APPROVE`, dan `REQUEST_REVISION`
- hitung `Avg Claim Cycle Time` dari lifecycle event, bukan dari `updatedAt`
- implementasikan aging bucket dengan definisi yang eksplisit
- implementasikan defect Pareto dan defect trend
- implementasikan vendor recovery analytics dan compensation aggregation
- siapkan endpoint alert berbasis threshold yang terdokumentasi

#### Phase 3 - Data Quality dan Evolusi Schema

- evaluasi kebutuhan field timestamp bisnis tambahan: `submitted_at`, `review_started_at`, `approved_at`, `revision_requested_at`, `vendor_batch_created_at`, `vendor_decision_at`
- evaluasi kebutuhan field finansial: estimated claim value, compensation approved, unrecovered amount
- evaluasi kebutuhan denominator bisnis untuk claim rate yang lebih kuat
- tambah test untuk validasi formula KPI agar perubahan query tidak mengubah makna metric diam-diam
- dokumentasikan mapping label UI vs enum backend jika ada perbedaan istilah

### 19.3 Shared Task / Product-Engineering Alignment

- sinkronkan `doc/pages.md` jika struktur halaman report berubah
- sinkronkan middleware dan sidebar jika route report baru ditambahkan
- sinkronkan acceptance criteria QA berdasarkan dokumen ini
- jika menambah KPI baru, update dokumen ini terlebih dahulu atau bersamaan dengan implementasi
- jika ada metric yang belum bisa dihitung akurat karena keterbatasan schema, tandai jelas sebagai `fase lanjut` dan jangan memakai label yang misleading

---

## 20. Acceptance Criteria Global

Modul analytics dianggap memenuhi tujuan jika:
- management dapat melihat performa branch secara jelas
- QRCC dapat memonitor backlog dan bottleneck operasional
- admin dapat memvalidasi data lintas branch dan vendor
- semua angka report konsisten dengan filter aktif
- export selalu sesuai role scope dan filter
- ada drill-down dari widget analytics ke detail claim
- KPI memiliki definisi yang jelas dan konsisten
- tidak ada ambiguity antara label UI, query backend, dan definisi bisnis

---

## 21. Panduan untuk Developer dan AI Coding Agent

Saat mengimplementasikan atau mengubah fitur analytics, developer dan AI harus mengikuti prinsip berikut:

- perlakukan dokumen ini sebagai source of truth utama untuk definisi KPI
- jangan membuat metric baru tanpa definisi bisnis yang eksplisit
- jangan mengubah label KPI tanpa mengecek dampaknya ke backend, QA, dan prompt AI
- jika metric membutuhkan timestamp khusus, jangan menebak dari `updatedAt` tanpa persetujuan desain produk
- semua filter harus diterapkan konsisten pada cards, chart, table, dan export
- role scope wajib dijaga di backend, bukan hanya di UI
- jika data belum cukup untuk metric tertentu, tampilkan metric yang jujur atau tandai sebagai fase berikutnya
- jika ada perubahan schema, update dokumen ini secara konsisten

---

## 22. Ringkasan Status MVP Saat Ini

Berdasarkan implementasi saat ini, status frontend report adalah sebagai berikut:

- ✅ Halaman report yang sudah tersedia: `overview`, `branches`, `vendors`, `trends`, `aging`, `defects`
- ✅ Komponen reusable yang sudah tersedia: `RankingList`, `AnalyticsChart`
- ✅ Navigasi sub-report sudah aktif untuk halaman yang sudah diimplementasikan
- ℹ️ `recovery` masih belum diimplementasikan
- ℹ️ Integrasi backend analytics (`server/api/reports/*`) masih belum selesai; mayoritas screen masih menggunakan mock data
- ℹ️ Drill-down reusable, loading/empty/error state per-widget, dan export berbasis filter-role masih tahap lanjutan

Dengan kondisi saat ini, modul reports berada pada level:

- `UI coverage`: fase lanjutan sudah progres (hingga Defect Analytics)
- `data integration`: belum lengkap
- `production analytics readiness`: belum lengkap

Prioritas berikutnya untuk sinkron ke target dokumen ini:

1. implementasi `Recovery Analytics` (`/dashboard/reports/recovery`)
2. integrasi endpoint analytics backend untuk semua halaman report
3. implementasi drill-down table reusable + guardrail loading/empty/error
4. sinkronisasi export sesuai filter aktif dan role scope
