# Daftar Halaman RMA Portal

## Public / Auth

| Pages | URL | Fitur |
| ----- | --- | ----- |
| Login | `/login` | Form login dengan field username & password, checkbox remember session, validasi Zod, error state, loading state, visual branding single-card, redirect otomatis sesuai role setelah login |
| Index (Redirect) | `/` | Halaman redirect otomatis ke halaman sesuai role user |

## CS (Customer Service) — Layout: `cs`

| Pages | URL | Fitur |
| ----- | --- | ----- |
| CS Home | `/cs` | Hero section dengan input field notification number dan button "Search" untuk membuat claim RMA baru, badge "System Online", deskripsi sistem, serta personal claim overview yang fleksibel (mis. recent claims, summary cards, recent activity, atau quick status shortcuts) selama entry flow utama tetap jelas |
| CS Claim List | `/cs/claims` | Tabel daftar claim milik CS (kolom minimum: Claim Number, Notification Code, Model, Vendor, Defect, Last Update, Status), keyword search lintas field (claim number/notification code/model/vendor/defect), filter status (Draft/Submitted/In Review/Need Revision/Approved/Archived), filter tanggal/periode, pagination, empty state untuk hasil kosong, entry pembuatan claim dipusatkan dari CS Home |
| CS Claim Create | `/cs/claims/create` | Wizard 3 langkah dengan `WorkflowStepper`, autosave feedback, validation summary, sticky action footer: **Step 1** - lookup notification/manual fallback + defect info (model, inch, branch, vendor, panel part number, OC SN, defect type, vendor required fields), **Step 2** - upload foto evidence dinamis berdasarkan vendor config (drag/drop, preview, remove, validasi 5MB), **Step 3** - review summary, button Save as Draft & Submit to QRCC |
| CS Claim Detail | `/cs/claims/[id]` | Detail claim dengan status badge, overview info, photo evidence gallery, review notes, timeline/history, lightbox preview, dan CTA "Revise Claim" jika status NEED_REVISION |
| CS Claim Edit (Revise) | `/cs/claims/[id]/edit` | Revision wizard 3 langkah untuk status NEED_REVISION: alert revision note, timeline history, context read-only, marker field revisi, side-by-side compare foto lama vs baru, upload ulang untuk item `REJECT`, sticky action footer, submit revision |
| CS Profile | `/cs/profile` | Halaman akun ringkas dalam satu page: profile card, personal information edit, statistik sederhana, session info, dan section security untuk change password; tidak ada route `/cs/security` terpisah selama scope security CS hanya ganti password |

## Dashboard — Layout: `dashboard` (sidebar collapsible + resizable)

### Home & Overview

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Dashboard Home | `/dashboard` | All | Dashboard role-aware untuk QRCC, MANAGEMENT, dan ADMIN dengan KPI cards, summary operasional, trend/analytics section, quick actions, dan recent activity yang berubah sesuai role |

### Claims Management

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Claims List | `/dashboard/claims` | QRCC, ADMIN | Tabel semua claim dengan search keyword, filter status/vendor/branch/date range, summary filter aktif, reset state, refresh, pagination, dan empty state hasil filter |
| Claim Detail | `/dashboard/claims/[id]` | QRCC, ADMIN | Detail claim lengkap dengan 3 tabs: **Claim Info**, **Photo Review**, **Claim History**; mendukung auto-start review dari SUBMITTED ke IN_REVIEW, edit field tertentu, review foto per item (VERIFIED/REJECT + note), history API-driven, dan final submit review yang menentukan APPROVED / NEED_REVISION |

### Vendor Claims

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Vendor Claims List | `/dashboard/vendor-claims` | QRCC, ADMIN | Tabel vendor claims dengan filter status/vendor/period fiskal, reset state, pagination, CTA "Create Vendor Claim", dan refresh |
| Vendor Claim Detail | `/dashboard/vendor-claims/[id]` | QRCC, ADMIN | Header batch + status, summary cards (total items, pending, accepted, rejected, total compensation), tabel claim items, modal input keputusan vendor (ACCEPTED/REJECTED + compensation/reject reason), dan action complete batch saat semua item sudah diputuskan |
| Vendor Claim Create | `/dashboard/vendor-claims/create` | QRCC, ADMIN | Wizard 3 langkah dengan `WorkflowStepper` dan sticky action bar: **Step 1** - pilih vendor aktif, **Step 2** - checklist klaim approved milik vendor (select all, info panel part number/OC SN/branch/defect), **Step 3** - review & generate (selected count, unique model/defect/branch summary, estimasi nomor batch, save draft, generate) |

### Master Data

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Master Vendor | `/dashboard/master/vendor` | QRCC, ADMIN | CRUD tabel vendor dengan search, filter status, sorting, refresh, modal add/edit, activate/deactivate, dan rule editor `requiredPhotos` + `requiredFields` |
| Master Product Model | `/dashboard/master/product-model` | QRCC, ADMIN | CRUD tabel product model dengan search, filter status, sorting, refresh, modal add/edit, activate/deactivate, dan pagination |
| Master Notification | `/dashboard/master/notification` | QRCC, ADMIN | CRUD tabel notification dengan search, filter status, sorting, refresh, modal add/edit, pagination, serta `Import Excel` yang sudah aktif dengan preview valid/invalid rows dan import valid rows |
| Master Defect | `/dashboard/master/defect` | QRCC, ADMIN | CRUD tabel defect dengan search, filter status, sorting, refresh, modal add/edit, activate/deactivate, dan pagination |

### Reports & Audit

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Reports | `/dashboard/reports` | All | Report overview utama dengan filter period fiskal/vendor/branch, KPI cards, charts, summary analytics, tabel detail claim, refresh, dan export CSV; tersedia juga sub-report tambahan seperti branches/vendors/trends/aging/defects/recovery |
| Audit Trail | `/dashboard/audit-trail` | QRCC, ADMIN | Tabel audit trail dengan search, filter action/role/date, quick date presets, chronology kuat, export CSV, refresh, detail event drawer, dan pagination |

### User Management

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Users | `/dashboard/users` | ADMIN | Tabel user management (kolom: Name sortable, Email, Username, Role badge, Branch, Status Active/Inactive, Created, Actions dropdown), search by name, filter status (Active/Inactive), modal create user, modal change role, modal activate/deactivate user (disabled untuk diri sendiri), pagination, button refresh |

### Settings

| Pages | URL | Role Access | Fitur |
| ----- | --- | ----------- | ----- |
| Settings (Layout) | `/dashboard/settings` | All | Navigation sidebar route-based: General, Security |
| Settings General | `/dashboard/settings` | All | Profile read-only: Name, Email, Username, Role badge, Branch. Semua field disabled (managed by admin) |
| Settings Security | `/dashboard/settings/security` | All | Form change password: current password, new password, confirm new password, validasi (min 8 char, new ≠ current, confirm = new), error alert, success toast |
