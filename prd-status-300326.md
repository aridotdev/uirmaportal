# PRD Status Frontend - 30/03/2026

Dokumen ini adalah checklist teknis frontend terhadap `prd.md` dan `pages.md`, disusun per route dan per area agar mudah dipakai sebagai acuan implementasi.

## Cara Baca

- `ID` adalah nomor identifikasi unik untuk setiap temuan.
- `Status PRD` memakai kategori: `Sesuai`, `Parsial`, `Belum sesuai`, `Tidak ada`, `Di luar PRD`.
- `Checklist` dipakai untuk tracking eksekusi tindak lanjut: `Belum dicek`, `Sudah sesuai`, `Perlu perbaikan`, `Tidak berlaku`.
- `Prioritas` memakai kategori: `High`, `Medium`, `Low`.
- `File` menunjuk file utama yang relevan terhadap temuan.

## Ringkasan Eksekutif

- Status keseluruhan frontend: **Parsial**.
- Coverage route inti sudah cukup luas, tetapi fidelity terhadap PRD masih belum konsisten.
- Area terkuat ada pada flow claim operasional dan konsistensi visual.
- Area terlemah ada pada auth, redirect, settings routing, role-aware navigation, dan detail list/filter/action.

## A. Summary Per Area

| ID | Area | Status PRD | Checklist | Catatan Singkat | Prioritas |
| --- | --- | --- | --- | --- | --- |
| SUM-001 | Public/Auth | Belum sesuai | Perlu perbaikan | Route ada, tetapi behavior inti belum sesuai PRD | High |
| SUM-002 | CS Workspace | Sesuai | Sudah sesuai | Flow utama dan kebutuhan detail sudah terpenuhi (Revision, Wizard, Home) | High |
| SUM-003 | Dashboard Workspace | Sesuai | Sudah sesuai | Fondasi role-aware dashboard (sidebar, state, home) sudah diimplementasikan (Sprint 1) | High |
| SUM-004 | Shared Components | Parsial | Perlu perbaikan | Fondasi reusable ada, tetapi belum digunakan konsisten | Medium |

## B. Checklist Route by Route

### B1. Public / Auth

| ID | Route | PRD Expectation | Status PRD | Checklist | Implementasi Saat Ini | Gap Utama | File | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-001 | `/` | Redirect otomatis sesuai role user | Belum sesuai | Perlu perbaikan | Masih loading screen visual | Halaman root belum membaca session user, belum menentukan role aktif, dan belum me-redirect ke `/cs` atau `/dashboard` sesuai role | `app/pages/index.vue` | High |
| PUB-002 | `/login` | Form login dengan validasi, error state, loading, redirect role-based | Belum sesuai | Perlu perbaikan | Form statis dengan aksi mock | Form belum punya validasi input, belum menampilkan state gagal/login processing, dan belum meneruskan user ke landing page sesuai role setelah autentikasi | `app/pages/login.vue` | High |

#### Detail Temuan Public / Auth

| ID | Temuan | Status PRD | Checklist | File | Catatan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| PUB-D-001 | Redirect role-based belum diimplementasikan pada halaman root | Belum sesuai | Perlu perbaikan | `app/pages/index.vue` | Root page masih berfungsi sebagai splash screen, bukan gatekeeper auth yang membaca role lalu redirect | High |
| PUB-D-002 | Login belum memiliki validasi form | Belum sesuai | Perlu perbaikan | `app/pages/login.vue` | Belum ada validasi untuk field username/email dan password sebelum submit | High |
| PUB-D-003 | Login belum memiliki feedback invalid credential / inactive / locked account | Belum sesuai | Perlu perbaikan | `app/pages/login.vue` | User belum mendapat pesan yang membedakan error login, akun nonaktif, atau akun terkunci | High |
| PUB-D-004 | Login belum memiliki loading state | Belum sesuai | Perlu perbaikan | `app/pages/login.vue` | Tombol submit dan form belum menampilkan kondisi in-progress saat request login berjalan | Medium |
| PUB-D-005 | Login redirect masih mock `navigateTo('cs')` | Belum sesuai | Perlu perbaikan | `app/pages/login.vue` | Redirect belum memakai hasil auth sebenarnya dan belum memetakan role ke route yang benar | High |

### B2. CS Workspace

| ID | Route | PRD Expectation | Status PRD | Checklist | Implementasi Saat Ini | Gap Utama | File | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CS-001 | `/cs` | Home CS dengan hero notification code, summary klaim user, quick filters | Sesuai | Sudah sesuai | Hero, entry point, dan komposisi home CS sudah tersedia sesuai kebutuhan aktual | Tidak ada gap utama untuk scope kebutuhan yang disepakati; halaman home CS dianggap sudah memenuhi ekspektasi saat ini | `app/pages/cs/index.vue` | Medium |
| CS-002 | `/cs/claims` | List klaim milik CS dengan kolom minimum, filter, search, pagination | Sesuai | Sudah sesuai | List, search, filter status, filter tanggal/periode, dan pagination sudah tersedia | Tidak ada gap utama untuk kebutuhan list klaim CS sesuai scope yang disepakati saat ini; entry pembuatan claim diposisikan dari halaman home CS | `app/pages/cs/claims/index.vue` | Medium |
| CS-003 | `/cs/claims/create` | Wizard 3 langkah dengan autosave, validation summary, sticky action footer | Sesuai | Sudah sesuai | Wizard 3 langkah, lookup notification, upload evidence, drag/drop, image preview aktual, sticky footer action, dan istilah field Panel Part Number sudah konsisten di form + review summary | Tidak ada gap utama; fitur wizard, autosave, validation summary lintas step, sticky action footer, drag/drop upload, image preview, validasi upload 5MB, dan konsistensi label Panel Part Number sudah berjalan | `app/pages/cs/claims/create.vue` | Medium |
| CS-004 | `/cs/claims/:id` | Detail claim dengan status, overview, gallery, review notes, history | Sesuai | Sudah sesuai | Header status, tab overview, gallery evidence, review note revisi, dan history sudah tersedia | Tidak ada gap utama untuk scope detail claim saat ini; peningkatan yang tersisa lebih ke konsistensi terminologi status foto dan pengayaan integrasi data nyata | `app/pages/cs/claims/[id]/index.vue` | Medium |
| CS-005 | `/cs/claims/:id/edit` | Revision flow dengan item reject, compare, marker revisi, submit revision | Sesuai | Sudah sesuai | Revision flow, side-by-side compare, dan wizard 3-step sudah tersedia di halaman aktual | Tidak ada gap utama; halaman revisi sudah mendukung wizard flow, side-by-side compare foto REJECT, dan marker field revisi | `app/pages/cs/claims/[id]/edit.vue` | High |
| CS-006 | `/cs/profile` | Profile ringkas dengan section security untuk ganti password | Sesuai | Sudah sesuai | Profile, edit basic info, dan change password sudah berada dalam satu halaman akun | Tidak ada gap utama untuk scope akun CS saat ini; fitur security masih terbatas pada change password sehingga masih tepat digabung sebagai section di halaman profile | `app/pages/cs/profile.vue` | Low |
| CS-007 | `/cs/security` | Tidak menjadi route terpisah; security digabung ke `/cs/profile` | Sesuai | Sudah sesuai | Layout CS hanya mengarahkan user ke profile dan tidak lagi bergantung pada route security terpisah | Tidak ada gap utama; information architecture area CS saat ini lebih sederhana dan sesuai kebutuhan karena change password ditempatkan di halaman profile | `app/layouts/cs.vue` | Low |

#### Detail Temuan CS Layout & Navigation

| ID | Temuan | Status PRD | Checklist | File | Catatan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| CS-D-001 | Menu CS sudah sesuai dengan model PRD | Sesuai | Sudah sesuai | `app/layouts/cs.vue` | Navigasi sudah memakai `Home`, `My Claims`, dan `Profile`. Label `Dashboard` sudah diganti menjadi `Home` sesuai spec | Low |
| CS-D-002 | Security CS diposisikan sebagai section di halaman profile, bukan route terpisah | Sesuai | Sudah sesuai | `app/layouts/cs.vue` | Struktur navigasi CS kini lebih sederhana; perubahan password diakses dari halaman profile sesuai scope akun CS saat ini | Low |
| CS-D-003 | Label `My Claims` sudah konsisten dengan istilah PRD | Sesuai | Sudah sesuai | `app/layouts/cs.vue` | Terminologi item klaim di navigasi CS sudah memakai `My Claims` dan tidak lagi menggunakan istilah lama `My Reports` | Low |

#### Detail Temuan CS Pages

| ID | Temuan | Status PRD | Checklist | File | Catatan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| CS-D-004 | Kolom minimum list claim CS sudah tersedia dan kebutuhan tabel inti sudah terpenuhi | Sesuai | Sudah sesuai | `app/pages/cs/claims/index.vue` | Kolom operasional utama untuk tracking klaim CS sudah tersedia dan dapat dipakai sesuai kebutuhan list harian | Low |
| CS-D-005 | Search/filter pada list claim CS sudah mencakup kebutuhan utama | Sesuai | Sudah sesuai | `app/pages/cs/claims/index.vue` | Keyword search lintas field, filter status, filter vendor/defect, serta filter tanggal/periode sudah tersedia untuk kebutuhan tracking operasional CS | Medium |
| CS-D-006 | Create claim sudah memiliki autosave indicator | Sesuai | Sudah sesuai | `app/pages/cs/claims/create.vue` | Wizard create claim kini menampilkan feedback visual autosave melalui status saving, saved, dan error saat user mengubah data atau upload evidence | Medium |
| CS-D-007 | Create claim sudah memiliki validation summary lintas step | Sesuai | Sudah sesuai | `app/pages/cs/claims/create.vue` | Error validasi sudah diringkas dalam validation summary lintas step dan dapat mengarahkan user kembali ke step yang bermasalah sebelum submit | Medium |
| CS-D-008 | Sticky action create claim sudah memakai reusable pattern | Sesuai | Sudah sesuai | `app/pages/cs/claims/create.vue` | Action footer sticky pada wizard create claim sudah memakai komponen shared `StickyActionBar` sehingga pola action tetap konsisten dengan arah standardisasi komponen | Low |
| CS-D-009 | Revision page sudah memiliki side-by-side compare foto lama vs baru | Sesuai | Sudah sesuai | `app/pages/cs/claims/[id]/edit.vue` | Sudah diimplementasikan melalui komponen `PhotoCompareCard` untuk memudahkan verifikasi revisi | Medium |
| CS-D-010 | Revision page sudah memakai pola wizard seperti create page | Sesuai | Sudah sesuai | `app/pages/cs/claims/[id]/edit.vue` | Flow revisi sudah dipandu menggunakan wizard 3-step bertahap | Medium |
| CS-D-011 | Terminologi status foto sudah seragam dengan status system REJECT | Sesuai | Sudah sesuai | `app/pages/cs/claims/[id]/index.vue` | Terminologi sudah diubah menjadi `REJECT` (tanpa "ed") agar konsisten dengan key system PRD | Low |

### B3. Dashboard Workspace

| ID | Route | PRD Expectation | Status PRD | Checklist | Implementasi Saat Ini | Gap Utama | File | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DB-001 | `/dashboard` | Dashboard role-aware untuk QRCC, Management, Admin | Sesuai | Sudah sesuai | Dashboard sudah role-aware (Sprint 1) | Dashboard konten, widget, dan CTA kini berubah berdasarkan role pengguna (QRCC, Management, Admin) | `app/pages/dashboard/index.vue` | High |
| DB-002 | `/dashboard/claims` | List claims dengan filter status, vendor, tanggal, branch, keyword | Parsial | Perlu perbaikan | Search, status filter, table tersedia | Table sudah usable, tetapi belum menyediakan filter vendor, tanggal, dan branch secara eksplisit sehingga review queue belum bisa dipilah seefisien kebutuhan operasional QRCC/Admin | `app/pages/dashboard/claims/index.vue` | High |
| DB-003 | `/dashboard/claims/:id` | Claim review detail dengan info, photo review, history, decision bar | Sesuai | Sudah sesuai | Salah satu halaman paling matang | Struktur utama review sudah memenuhi inti PRD; peningkatan yang tersisa lebih ke pengayaan UX evidence, bukan gap struktural utama | `app/pages/dashboard/claims/[id].vue` | Medium |
| DB-004 | `/dashboard/vendor-claims` | Vendor claim list dengan filter vendor, status, periode | Parsial | Perlu perbaikan | Table dan status filter tersedia | List batch vendor claim belum memiliki vendor filter dan period filter sehingga user belum bisa menyaring batch sesuai vendor dan rentang waktu dengan cepat | `app/pages/dashboard/vendor-claims/index.vue` | High |
| DB-005 | `/dashboard/vendor-claims/create` | Wizard create vendor claim | Parsial | Perlu perbaikan | Flow create sudah ada | Wizard sudah terbentuk, tetapi informasi seleksi klaim, ringkasan hasil batch, dan estimasi output belum sekuat yang diminta untuk mendukung keputusan batching | `app/pages/dashboard/vendor-claims/create.vue` | Medium |
| DB-006 | `/dashboard/vendor-claims/:id` | Detail vendor claim dengan summary, item table, vendor decision | Parsial | Perlu perbaikan | Detail tersedia | Detail batch sudah ada, tetapi summary accepted/rejected/pending dan total compensation belum tampil sekuat area kontrol utama seperti di spec | `app/pages/dashboard/vendor-claims/[id].vue` | Medium |
| DB-007 | `/dashboard/master/vendor` | CRUD vendor master | Parsial | Perlu perbaikan | Halaman tersedia | CRUD dasar sudah ada, tetapi area rule editor `requiredPhotos` dan `requiredFields` serta utilitas table/action belum sepenuhnya diekspos seperti kebutuhan master data operasional | `app/pages/dashboard/master/vendor.vue` | Medium |
| DB-008 | `/dashboard/master/product-model` | CRUD product model master | Parsial | Perlu perbaikan | Halaman tersedia | Struktur master tersedia, tetapi utilitas seperti sorting/visibility/action consistency belum sejelas dan sekuat spec table pattern | `app/pages/dashboard/master/product-model.vue` | Medium |
| DB-009 | `/dashboard/master/notification` | CRUD notification + import Excel preview | Parsial | Perlu perbaikan | Halaman tersedia | Master notification belum menyediakan flow import Excel dengan preview hasil import yang menjadi salah satu kebutuhan utama halaman ini | `app/pages/dashboard/master/notification.vue` | High |
| DB-010 | `/dashboard/master/defect` | CRUD defect master | Parsial | Perlu perbaikan | Halaman tersedia | CRUD tersedia, tetapi richness table interaction dan action pattern belum sepenuhnya konsisten dengan pola master data yang dispesifikasikan | `app/pages/dashboard/master/defect.vue` | Medium |
| DB-011 | `/dashboard/reports` | Report utama dengan filter, summary, table, export | Parsial | Perlu perbaikan | Reports dibuat sebagai workspace multi-tab | Area reports sudah lebih luas dari minimum spec, tetapi halaman utamanya belum berfungsi sebagai claim status report utama dengan filter, table detail, export, dan refresh seperti yang diminta | `app/pages/dashboard/reports.vue` | Medium |
| DB-012 | `/dashboard/audit-trail` | Audit trail dengan filter dan chronology kuat | Parsial | Perlu perbaikan | Halaman tersedia dan relatif kuat | Audit trail sudah cukup baik, tetapi perlu verifikasi lebih detail pada kelengkapan filter, ekspor, dan pola refresh agar benar-benar sesuai spec | `app/pages/dashboard/audit-trail.vue` | Medium |
| DB-013 | `/dashboard/users` | User management admin-only | Parsial | Perlu perbaikan | User list tersedia | User management sudah ada, tetapi filter utama masih berbasis role, bukan status aktif/nonaktif, dan action admin belum sepenuhnya mengikuti kebutuhan spec | `app/pages/dashboard/users/index.vue` | High |
| DB-014 | `/dashboard/settings` | Settings general dengan route-based navigation | Belum sesuai | Perlu perbaikan | Settings saat ini berada dalam satu halaman bertab internal berisi `General`, `Security`, dan `Appearance` | Implementasi aktual masih memusatkan seluruh pengaturan akun dalam `app/pages/dashboard/settings/index.vue`, sehingga belum mengikuti struktur route-based yang diminta PRD | `app/pages/dashboard/settings/index.vue` | High |
| DB-015 | `/dashboard/settings/security` | Security page terpisah | Tidak ada | Perlu perbaikan | Logic change password masih menjadi tab `Security` di halaman settings utama | Route security terpisah yang diwajibkan spec belum tersedia; change password belum dipisah ke file/route sendiri | `app/pages/dashboard/settings/index.vue` | High |
| DB-016 | `/dashboard/users/:id` | Tidak disebut di baseline PRD | Di luar PRD | Tidak berlaku | Extra screen tersedia | Halaman detail user ini tambahan di luar kebutuhan minimum PRD; boleh dipertahankan jika mendukung admin workflow | `app/pages/dashboard/users/[id].vue` | Low |
| DB-017 | `/dashboard/reports/branches` dkk | Tidak disebut di baseline route PRD utama | Di luar PRD | Tidak berlaku | Extra sub-report tersedia | Sub-report tambahan tidak salah, tetapi bukan bagian dari route minimum yang harus dipenuhi PRD | `app/pages/dashboard/reports.vue` | Low |

#### Detail Temuan Dashboard Layout & Navigation

| ID | Temuan | Status PRD | Checklist | File | Catatan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| DB-D-001 | Sidebar dashboard sudah role-aware | Sesuai | Sudah sesuai | `app/layouts/dashboard.vue` | Sidebar sudah memfilter struktur menu berdasarkan role aktif sesuai PRD | High |
| DB-D-002 | Label `Overview` tidak konsisten dengan istilah `Dashboard` di PRD | Parsial | Perlu perbaikan | `app/layouts/dashboard.vue` | Naming menu belum seragam dengan istilah resmi pada PRD dan page spec | Low |
| DB-D-003 | Navigasi `Users` masih dibungkus label `User Management` | Parsial | Perlu perbaikan | `app/layouts/dashboard.vue` | Makna masih dekat, tetapi tidak sepenuhnya konsisten dengan label route di PRD/pages spec | Low |
| DB-D-004 | Role `MANAGEMENT` sudah diarahkan ke menu analytics | Sesuai | Sudah sesuai | `app/layouts/dashboard.vue` | Menu Management sudah dibatasi ke Dashboard, Reports, dan Settings | High |
| DB-D-005 | Layout dashboard sudah menjadi source of truth berbasis role | Sesuai | Sudah sesuai | `app/layouts/dashboard.vue` | Konfigurasi menu sudah menggunakan sentralisasi mapping role-to-navigation | High |

#### Detail Temuan Dashboard Pages

| ID | Temuan | Status PRD | Checklist | File | Catatan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| DB-D-006 | Dashboard home belum role-specific | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/index.vue` | Konten home belum membedakan kebutuhan reviewer, management, dan admin secara tegas | High |
| DB-D-007 | Claims list belum memiliki vendor/date/branch filter lengkap | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/claims/index.vue` | User belum bisa memfilter queue review berdasarkan kombinasi vendor, tanggal, dan branch seperti yang diminta | High |
| DB-D-008 | Vendor claims list belum memiliki vendor dan period filter | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/vendor-claims/index.vue` | Penyaringan batch vendor masih terlalu dangkal untuk kebutuhan tracking batch | High |
| DB-D-009 | Notification master belum memiliki flow import Excel preview | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/master/notification.vue` | Fitur import penting masih missing dari user flow halaman notification master | High |
| DB-D-010 | Reports dibuat sebagai analytics workspace, bukan report table utama seperti spec | Parsial | Perlu perbaikan | `app/pages/dashboard/reports.vue` | Halaman lebih kaya dari minimum spec, tetapi belum menyajikan format report operasional utama secara langsung | Medium |
| DB-D-011 | Users page filter masih berbasis role, bukan status active/inactive seperti spec utama | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/users/index.vue` | Kebutuhan admin untuk memilah user aktif vs nonaktif belum menjadi filter utama | High |
| DB-D-012 | Settings saat ini memakai tab internal `General`, `Security`, dan `Appearance` dalam satu file | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/settings/index.vue` | Struktur aktual masih memakai `settingSections` + `activeSection`, sehingga belum mengikuti information architecture route-based yang dipisah per halaman | High |
| DB-D-013 | Settings masih memiliki `appearance`, `useColorMode()`, dan toggle light mode | Belum sesuai | Perlu perbaikan | `app/pages/dashboard/settings/index.vue` | Implementasi aktual masih menyediakan pengaturan theme mode dan accent preset, padahal guidance repo menetapkan dark-theme-only | High |

### B4. Shared Components

| ID | Komponen / Area | PRD Expectation | Status PRD | Checklist | Implementasi Saat Ini | Gap Utama | File | Prioritas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CMP-001 | Status badge system | Reusable status badge | Parsial | Perlu perbaikan | Komponen ada | Status badge reusable sudah dibuat, tetapi banyak halaman masih merender badge custom sendiri sehingga semantic color dan wording belum terkonsolidasi | `app/components/StatusBadge.vue` | Medium |
| CMP-002 | Stepper | Reusable multi-step stepper | Parsial | Perlu perbaikan | Komponen ada | Komponen stepper tersedia, tetapi halaman wizard penting masih memakai stepper custom sehingga perilaku dan tampilan lintas flow belum konsisten | `app/components/WorkflowStepper.vue` | Medium |
| CMP-003 | Sticky action bar | Reusable sticky action | Parsial | Perlu perbaikan | Komponen ada | Shared sticky action bar belum menjadi standar default pada semua critical flow yang membutuhkan action tetap di viewport | `app/components/StickyActionBar.vue` | Medium |
| CMP-004 | Photo evidence card | Reusable evidence card | Parsial | Perlu perbaikan | Komponen ada | Komponen evidence ada, tetapi capability evidence-centric seperti preview kuat, compare, dan pola review belum terasa seragam di seluruh flow | `app/components/PhotoEvidenceCard.vue` | Medium |
| CMP-005 | Timeline list | Reusable timeline/history | Parsial | Perlu perbaikan | Komponen ada | Timeline component belum dipakai sebagai pattern utama sehingga history presentation masih bervariasi antar halaman | `app/components/TimelineList.vue` | Low |

#### Detail Temuan Shared Components

| ID | Temuan | Status PRD | Checklist | File | Catatan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| CMP-D-001 | Shared components sudah tersedia tetapi belum menjadi pattern utama lintas halaman | Parsial | Perlu perbaikan | `app/components/StatusBadge.vue` | Banyak page masih membangun ulang pola yang seharusnya bisa distandarkan dari component layer | Medium |
| CMP-D-002 | Belum terlihat photo lightbox / zoom viewer reusable yang kuat | Belum sesuai | Perlu perbaikan | `app/components/PhotoEvidenceCard.vue` | UX evidence belum memiliki primitive reusable untuk zoom/lightbox yang dibutuhkan flow review | Medium |
| CMP-D-003 | Belum ada autosave indicator reusable yang jelas | Belum sesuai | Perlu perbaikan | `app/components` | Belum tersedia komponen atau pattern umum untuk menunjukkan draft tersimpan otomatis | Medium |

## C. Fokus Prioritas: Role-Aware Navigation

Karena prioritas yang dipilih pengguna adalah evaluasi teknis format checklist dengan identifikasi, maka bagian ini menandai temuan khusus yang paling penting untuk pekerjaan berikutnya.

| ID | Fokus | Status PRD | Checklist | Lokasi | Tindakan yang Disarankan | Prioritas |
| --- | --- | --- | --- | --- | --- | --- |
| NAV-001 | CS navigation sudah sesuai dengan model PRD | Sesuai | Sudah sesuai | `app/layouts/cs.vue` | Label `/cs` sudah dirapikan menjadi `Home` dan item navigasi sudah mengikuti model standar | Low |
| NAV-002 | Dashboard navigation sudah role-aware | Sesuai | Sudah sesuai | `app/layouts/dashboard.vue` | Sidebar sudah memfilter menu berdasarkan role aktif | High |
| NAV-003 | Menu role `MANAGEMENT` sudah dibatasi | Sesuai | Sudah sesuai | `app/layouts/dashboard.vue` | Menu Management dibatasi ke `Dashboard`, `Reports`, dan `Settings` | High |
| NAV-004 | Security CS sudah dipusatkan ke `/cs/profile` | Sesuai | Sudah sesuai | `app/layouts/cs.vue` | Tidak perlu route `/cs/security` terpisah selama kebutuhan security CS masih sebatas change password di halaman profile | Low |
| NAV-005 | Label navigasi belum konsisten dengan PRD/pages spec | Parsial | Perlu perbaikan | `app/layouts/dashboard.vue` | Samakan wording menu dengan istilah resmi produk dan page spec | Medium |

## D. Route yang Belum Sinkron atau Wajib Ditindak

| ID | Route | Status PRD | Checklist | Keterangan | File |
| --- | --- | --- | --- | --- | --- |
| RT-001 | `/` | Belum sesuai | Perlu perbaikan | Harus redirect otomatis sesuai role | `app/pages/index.vue` |
| RT-002 | `/login` | Belum sesuai | Perlu perbaikan | Harus menjadi login functional | `app/pages/login.vue` |
| RT-003 | `/cs/security` | Sesuai | Sudah sesuai | Tidak diperlukan sebagai route terpisah karena fungsi security CS saat ini digabung ke `/cs/profile` | `app/layouts/cs.vue` |
| RT-004 | `/dashboard/settings/security` | Tidak ada | Perlu perbaikan | Pada implementasi aktual, fungsi security masih berada sebagai tab internal di `/dashboard/settings`, sehingga route terpisah belum ada | `app/pages/dashboard/settings/index.vue` |

## E. Prioritas Implementasi yang Direkomendasikan

| ID | Urutan | Pekerjaan | Checklist | Dampak | Prioritas |
| --- | --- | --- | --- | --- | --- |
| REC-001 | 1 | Implement role-aware navigation pada `app/layouts/dashboard.vue` dan sederhanakan `app/layouts/cs.vue` | Perlu perbaikan | Tinggi | High |
| REC-002 | 2 | Rapikan auth flow pada `app/pages/index.vue` dan `app/pages/login.vue` | Perlu perbaikan | Tinggi | High |
| REC-003 | 3 | Pecah settings dari struktur tab internal (`General`, `Security`, `Appearance`) menjadi route-based sesuai spec dan hapus opsi appearance/light mode | Perlu perbaikan | Tinggi | High |
| REC-004 | 4 | Lengkapi filter dan kolom pada list utama (`claims`, `vendor-claims`, `users`) | Perlu perbaikan | Tinggi | High |
| REC-005 | 5 | Standardisasi shared component pada page implementation | Perlu perbaikan | Menengah | Medium |

## F. Verdict Akhir

- Frontend saat ini sudah cukup kuat sebagai **UI prototype** dan referensi visual.
- Frontend saat ini **belum sepenuhnya sesuai PRD** untuk dijadikan baseline implementasi final.
- Jika ingin mendekatkan ke PRD secara cepat, pekerjaan dengan leverage tertinggi adalah `role-aware navigation`, `auth flow`, dan `settings routing`.
