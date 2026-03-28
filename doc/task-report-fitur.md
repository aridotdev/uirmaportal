# Task List: Reports & Analytics Feature

Dokumen ini mendetailkan langkah-langkah implementasi fitur `Reports` dan `Analytics` berdasarkan dokumen `doc/report-fitur.md`. Tugas dibagi menjadi beberapa fase dengan pembagian kerja antara **BackEnd (BE)** dan **FrontEnd (FE)**.

## Fase 1: Foundation & API Analytics Dasar

Fokus pada penyediaan data agregat untuk KPI utama dan setup komponen UI reusable.

| Task ID | Component / File | Deskripsi Tugas | Owner |
| :--- | :--- | :--- | :--- |
| **BE-1.1** | `server/api/reports/summary.get.ts` | Buat API untuk data KPI di Executive Overview (Total, Submitted, In Review, dll). | **BE** |
| **BE-1.2** | `server/utils/reports.ts` | Buat helper/utility query untuk menghitung `Approval Rate` dan `Revision Rate`. | **BE** |
| **BE-1.3** | `server/api/reports/branches.get.ts` | Buat API agregasi data per-cabang (ranking branch by claims). | **BE** |
| **FE-1.1** | `app/components/reports/KpiCard.vue` | Implementasi komponen card KPI dengan status warna sesuai desain. | **FE** |
| **FE-1.2** | `app/components/reports/ReportFilterBar.vue` | Buat filter bar global (Date Range, Branch, Vendor, Status). | **FE** |
| **FE-1.3** ✅ | `app/pages/dashboard/reports/index.vue` | Setup layout utama halaman Executive Overview dengan placeholder data. **Status:** selesai diimplementasikan dengan placeholder data dan style dashboard existing. | **FE** |

## Fase 2: Core Reporting Pages (MVP)

Implementasi halaman-halaman utama sesuai cakupan MVP.

| Task ID | Component / File | Deskripsi Tugas | Owner |
| :--- | :--- | :--- | :--- |
| **BE-2.1** | `server/api/reports/vendors.get.ts` | Buat API untuk performa vendor (Acceptance Rate, Rejection Rate, Recovery). | **BE** |
| **FE-2.1** ✅| `app/pages/dashboard/reports/branches.vue` | Implementasi halaman Branch Performance dengan tabel ranking. | **FE** |
| **FE-2.2** ✅| `app/pages/dashboard/reports/vendors.vue` | Implementasi halaman Vendor Performance (scorecard & ranking). | **FE** |
| **FE-2.3** ✅| `app/components/reports/RankingList.vue` | Komponen untuk menampilkan Top 5 Branches/Vendors di overview. | **FE** |
| **FE-2.4** ✅| `app/components/reports/AnalyticsChart.vue` | Integrasi chart library (v-chart/chart.js) untuk visualisasi tren dasar. | **FE** |

## Fase 3: Trends & Operational Intelligence

Analisis lebih mendalam terkait tren waktu dan penumpukan beban kerja (backlog).

| Task ID | Component / File | Deskripsi Tugas | Owner |
| :--- | :--- | :--- | :--- |
| **BE-3.1** | `server/api/reports/trends.get.ts` | Buat API data tren harian/mingguan/bulanan untuk inflow dan closure. | **BE** |
| **BE-3.2** | `server/api/reports/aging.get.ts` | Buat API untuk aging buckets (0-2, 3-7, 8-14, >14 hari). | **BE** |
| **FE-3.1** ✅ | `app/pages/dashboard/reports/trends.vue` | Implementasi halaman Period Trend dengan multi-chart toggle. **Status:** selesai — granularity toggle (harian/mingguan/bulanan), 3 chart mode (inflow/backlog/approval rate), KPI strip, data table. | **FE** |
| **FE-3.2** ✅ | `app/pages/dashboard/reports/aging.vue` | Implementasi halaman Aging & Backlog dengan bucket visualization. **Status:** selesai — 4 aging bucket bars, trend chart 6 bulan, SLA warning box, tabel klaim detail dengan filter bucket. | **FE** |

## Fase 4: Defect Analytics & Financial Recovery

Analisis teknis terkait kerusakan produk dan pemulihan biaya dari vendor.

| Task ID | Component / File | Deskripsi Tugas | Owner |
| :--- | :--- | :--- | :--- |
| **BE-4.1** | `server/api/reports/defects.get.ts` | Buat API untuk defect Pareto dan top defects by vendor/branch. | **BE** |
| **BE-4.2** | `server/api/reports/recovery.get.ts` | Buat API analytics finansial (Recovery Amount, Ratio per Vendor). | **BE** |
| **FE-4.1** | `app/pages/dashboard/reports/defects.vue` | Implementasi halaman Defect Analytics (Top Defect, Model Mix). | **FE** |
| **FE-4.2** | `app/pages/dashboard/reports/recovery.vue` | Implementasi halaman Recovery Analytics dengan KPI finansial. | **FE** |

## Fase 5: Export, Drill-down & Guardrails

Penyelesaian fitur pendukung dan keamanan akses data.

| Task ID | Component / File | Deskripsi Tugas | Owner |
| :--- | :--- | :--- | :--- |
| **BE-5.1** | `server/api/reports/export.get.ts` | Implementasi export CSV yang menghormati filter dan role-access. | **BE** |
| **BE-5.2** | Middleware / Auth Logic | Terapkan auto-lock filter branch untuk role `MANAGEMENT`. | **BE** |
| **FE-5.1** | `app/components/reports/DrillDownTable.vue` | Reusable table untuk melihat record detail claim dari widget analytics. | **FE** |
| **FE-5.2** | All Pages | Implementasi Loading, Empty, dan Error states di tiap widget. | **FE** |
| **FE-5.3** | Integration | Pastikan semua aksi export memanggil API dengan filter yang benar. | **FE** |

---

## Aturan Implementasi (Shared Rules)

1.  **Role Access**:
    *   `ADMIN`, `QRCC` & `MANAGEMENT`: Data All Branch.
2.  **Date Match**: Filter default selalu menggunakan `claim.createdAt`.
3.  **Consistency**: Warna status di chart/badge harus sama dengan warna status di modul Claim utama.
4.  **Performance**: Gunakan agregasi database (Drizzle ORM/SQLite) sebisa mungkin, hindari memproses ribuan row di memori aplikasi.
