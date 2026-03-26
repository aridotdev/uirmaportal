# Frontend Build Task Checklist

Dokumen ini membagi pekerjaan frontend menjadi 2 jalur paralel agar bisa dikerjakan oleh 2 AI agent tanpa banyak konflik file.

## Tujuan Sprint

- Menyelesaikan fondasi frontend untuk aplikasi RMA Portal dengan fokus pada alur operasional utama.
- Menjaga konsistensi visual dan UX antara area `CS` dan `Dashboard`.
- Menyiapkan struktur yang mudah dihubungkan ke backend nanti, tanpa harus menunggu API final.

## Cara Bagi Kerja ke 2 AI Agent

- Agent 1 fokus ke `foundation + reusable UI patterns`.
- Agent 2 fokus ke `screen completion + flow pages`.
- Hindari edit bersamaan pada file layout yang sama kecuali sudah disepakati lebih dulu.
- Jika ada komponen reusable baru, Agent 1 buat dulu lalu Agent 2 konsumsi komponen tersebut.

## Shared Rules

- [ ] Gunakan `Nuxt 4`, `TypeScript`, `Nuxt UI`, dan `Tailwind v4` sesuai pola repo.
- [ ] Pertahankan visual language dark theme: `#050505`, `#0a0a0a`, accent `#B6F500`.
- [ ] Gunakan semantic status color yang sudah didefinisikan di `CLAUDE.md`.
- [ ] Semua page wajib memakai `definePageMeta({ layout: 'cs' })` atau `definePageMeta({ layout: 'dashboard' })` bila relevan.
- [ ] Semua state penting harus punya versi `loading`, `empty`, `error`, dan `ready` bila applicable.
- [ ] Jangan ikat UI ke backend final; gunakan mock data/composables/view-model yang stabil.
- [x] Jalankan `pnpm lint` dan `pnpm typecheck` setelah scope utama selesai.

---

## Agent 1 - Foundation + Reusable UI

### A. UI Audit dan Standardisasi

- [x] Audit pattern yang berulang di screen yang sudah ada.
- [x] Identifikasi elemen yang layak dijadikan reusable component.
- [x] Catat file sumber utama untuk ekstraksi pattern:
  - [x] `app/pages/cs/index.vue`
  - [x] `app/pages/cs/claims/create.vue`
  - [x] `app/pages/dashboard/index.vue`
  - [x] `app/pages/dashboard/claims/index.vue`
  - [x] `app/pages/dashboard/claims/[id].vue`
  - [x] `app/layouts/cs.vue`
  - [x] `app/layouts/dashboard.vue`

### B. Bangun Reusable Components

- [x] Buat komponen `StatusBadge` untuk semua status utama claim, photo review, dan vendor claim.
- [x] Buat komponen `PageHeader` untuk title, description, actions, dan optional breadcrumbs.
- [x] Buat komponen `SectionCard` / `SurfaceCard` untuk wrapper blok konten yang konsisten.
- [x] Buat komponen `EmptyState` untuk tabel, list, dan gallery.
- [x] Buat komponen `LoadingState` / skeleton ringan untuk page section.
- [x] Buat komponen `FilterBar` yang bisa dipakai di halaman list.
- [x] Buat komponen `StatsCard` untuk KPI / angka ringkasan.
- [x] Buat komponen `StickyActionBar` untuk wizard dan review flow.
- [x] Buat komponen `TimelineList` untuk history / audit.
- [x] Buat komponen `PhotoEvidenceCard` untuk upload/review/preview evidence.
- [x] Buat komponen `WorkflowStepper` untuk flow wizard multi-step.

### C. Shared Data/Config Layer

- [x] Pindahkan status config yang berulang ke shared constants/composables.
- [x] Buat helper untuk label status, class status, dan icon status.
- [x] Buat mock helpers/view-model agar page tidak mapping data mentah secara acak di masing-masing file.
- [x] Buat struktur mock data frontend yang konsisten untuk:
  - [x] claims
  - [x] claim photos
  - [x] claim history
  - [x] vendor claims
  - [x] reports summary
  - [x] audit logs
  - [x] users
  - [x] settings/profile

### D. Layout Consistency

- [x] Rapikan konsistensi spacing, heading, dan sidebar interaction pada `app/layouts/cs.vue`.
- [x] Rapikan konsistensi spacing, heading, dan topbar/sidebar pada `app/layouts/dashboard.vue`.
- [x] Pastikan layout tetap usable di desktop kecil dan tablet.
- [x] Kurangi hardcoded UI duplication jika bisa dipindahkan ke component.

### E. Deliverables Agent 1

- [x] Semua reusable component tersedia dan terdokumentasi secara singkat di file/README internal bila perlu.
- [x] Shared status config dan mock helpers siap dipakai Agent 2.
- [x] Layout CS dan Dashboard sudah lebih konsisten.
- [x] Tidak ada error lint/typecheck dari perubahan foundation.

---

## Agent 2 - Screen Completion + Core Flows

### A. Finalisasi Core Claim Workflow

- [x] Review screen yang sudah ada dan sesuaikan dengan target UX di `prd.md` dan `pages.md`.
- [x] Rapikan `app/pages/login.vue` agar lebih siap sebagai halaman auth final frontend.
- [x] Finalisasi `app/pages/cs/index.vue` sebagai entry point CS yang cepat dan jelas.
- [x] Finalisasi `app/pages/cs/claims/index.vue` untuk list klaim milik CS.
- [x] Finalisasi `app/pages/cs/claims/create.vue` untuk wizard 3 langkah.
- [x] Finalisasi `app/pages/cs/claims/[id]/index.vue` untuk detail klaim.
- [x] Finalisasi `app/pages/cs/claims/[id]/edit.vue` untuk flow revisi.
- [x] Finalisasi `app/pages/dashboard/claims/index.vue` untuk review queue QRCC/Admin.
- [x] Finalisasi `app/pages/dashboard/claims/[id].vue` untuk detail review 3 tab.

### B. Tambahkan Screen yang Belum Ada

- [x] Buat `app/pages/cs/profile.vue`.
- [x] Buat `app/pages/dashboard/reports.vue`.
- [x] Buat `app/pages/dashboard/audit-trail.vue`.
- [x] Buat `app/pages/dashboard/users.vue`.
- [x] Buat `app/pages/dashboard/settings/index.vue`.
- [ ] Buat `app/pages/dashboard/settings/security.vue`.
- [ ] Jika memang dipakai oleh spesifikasi, pertimbangkan juga:
  - [ ] `app/pages/dashboard/settings/members.vue`
  - [ ] `app/pages/dashboard/settings/notifications.vue`

### C. Selesaikan Supporting Modules

- [x] Review konsistensi `vendor claims` pages yang sudah ada.
- [x] Review konsistensi `master data` pages yang sudah ada.
- [x] Tambahkan empty/loading/error states bila masih belum lengkap.
- [x] Pastikan CTA dan action hierarchy jelas di tiap page.
- [x] Pastikan table/list/filter UX mengikuti pola yang sama.

### D. UX Hardening Per Screen

- [x] Tambahkan validation summary pada flow form yang kompleks.
- [x] Tambahkan sticky action footer pada wizard/review page bila belum stabil.
- [x] Pastikan banner `NEED_REVISION` terlihat jelas di detail/revisi claim.
- [x] Pastikan review note / reject reason mudah ditemukan.
- [x] Pastikan mobile/tablet tidak rusak total meski aplikasi desktop-first.
- [x] Pastikan loading interaction terasa masuk akal dan tidak membingungkan user.

### E. Deliverables Agent 2

- [x] Semua halaman inti frontend sesuai scope prioritas sudah ada.
- [x] Alur CS dan QRCC bisa didemokan end-to-end dengan mock data.
- [x] Halaman baru mengikuti reusable components dari Agent 1.
- [x] Tidak ada page orphan tanpa layout/meta yang benar.

---

## Dependency Hand-off

### Agent 1 terlebih dahulu bila memungkinkan

- [x] `StatusBadge`
- [x] `PageHeader`
- [x] `SectionCard`
- [x] `EmptyState`
- [x] `LoadingState`
- [x] `WorkflowStepper`
- [x] `StickyActionBar`
- [x] shared status constants
- [x] shared mock helpers

### Agent 2 bisa mulai dulu pada file yang tidak blocked

- [ ] Build halaman yang benar-benar belum ada.
- [ ] Rapikan struktur page dan placeholder states.
- [ ] Integrasikan reusable component setelah Agent 1 selesai.

---

## Suggested Execution Order

### Agent 1

- [x] Step 1: audit duplication
- [x] Step 2: extract reusable components
- [x] Step 3: centralize status + mock helpers
- [x] Step 4: align layouts
- [x] Step 5: lint + typecheck

### Agent 2

- [x] Step 1: finish CS flow
- [x] Step 2: finish dashboard claim review flow
- [x] Step 3: add missing reports/audit/users/settings/profile pages
- [x] Step 4: align vendor/master modules
- [x] Step 5: lint + typecheck

---

## Final Verification Checklist

- [ ] Semua route prioritas bisa dibuka tanpa error runtime.
- [ ] Semua page utama punya loading/empty/error state minimum.
- [x] UI status badge konsisten antar modul.
- [ ] Tidak ada hardcoded style/config penting yang seharusnya bisa dibagi.
- [ ] Layout `cs` dan `dashboard` terasa satu produk yang sama.
- [x] `pnpm lint` lolos.
- [x] `pnpm typecheck` lolos.
- [ ] Demo flow utama bisa dijalankan dari login -> CS claim -> dashboard review.

---

## Rekomendasi Pembagian Tugas Singkat

### Agent 1 prompt ringkas

Kerjakan foundation frontend untuk RMA Portal: ekstrak reusable components, shared status config, mock helpers, dan rapikan konsistensi layout CS/Dashboard tanpa mengubah arah desain utama.

### Agent 2 prompt ringkas

Kerjakan screen completion frontend untuk RMA Portal: selesaikan alur claim CS dan dashboard review, lalu tambahkan halaman yang belum ada seperti profile, reports, audit trail, users, dan settings dengan memanfaatkan reusable patterns yang tersedia.
