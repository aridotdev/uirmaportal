# Dashboard Workspace — Panduan Implementasi Teknis

> **Scope**: Frontend-only. Tidak menyentuh auth backend, session management, atau API layer.
> **Prasyarat**: CS Workspace sudah selesai (`SUM-002: Sesuai`).
> **Referensi**: `prd.md`, `pages.md`, `prd-status-300326.md`

---

## Daftar Isi

1. [Konteks & Arsitektur Saat Ini](#1-konteks--arsitektur-saat-ini)
2. [Sprint 1: Role-Aware Dashboard Foundation](#2-sprint-1-role-aware-dashboard-foundation)
3. [Sprint 2: Settings Workspace Alignment](#3-sprint-2-settings-workspace-alignment)
4. [Sprint 3: Operational List Pages](#4-sprint-3-operational-list-pages)
5. [Sprint 4: Shared Component Standardization](#5-sprint-4-shared-component-standardization)
6. [Referensi Design System](#6-referensi-design-system)
7. [Checklist Validasi](#7-checklist-validasi)

---

## 1. Konteks & Arsitektur Saat Ini

### 1.1 Tech Stack

- **Framework**: Nuxt 4, Vue 3 Composition API
- **UI**: Nuxt UI v4 (`UApp`, `UModal`, `UTabs`, `UInputMenu`, dll), TailwindCSS v4
- **Table**: TanStack Vue Table (`@tanstack/vue-table`)
- **Icons**: Lucide Vue Next
- **Charts**: `@unovis/vue` (VisXYContainer, VisLine, VisStackedBar, VisAxis)
- **Validation**: Zod (belum dipakai di frontend, tapi tersedia)
- **Font**: Plus Jakarta Sans (via `@nuxt/fonts`)

### 1.2 Struktur Direktori

```
app/
  app.vue                          # Root: UApp + NuxtLayout + NuxtPage
  app.config.ts                    # primary=green, neutral=slate
  layouts/
    cs.vue                         # CS workspace shell (sidebar + main)
    dashboard.vue                  # Dashboard shell (sidebar + topbar + main)
  composables/
    useCsStore.ts                  # CS data composable (contoh pattern)
  components/
    StatusBadge.vue                # Reusable status badge
    PageHeader.vue                 # Page header: title, desc, back, tag, actions
    FilterBar.vue                  # Search + filter container
    FilterPill.vue                 # Filter pill button
    EmptyState.vue                 # Empty data placeholder
    LoadingState.vue               # Loading skeleton (card/table/detail)
    SectionCard.vue                # Content section card container
    StatsCard.vue                  # KPI stat card
    StickyActionBar.vue            # Sticky footer action bar
    WorkflowStepper.vue            # Multi-step wizard stepper
    TimelineList.vue               # Audit timeline
    PhotoEvidenceCard.vue          # Photo card
    PhotoCompareCard.vue           # Side-by-side photo compare
    PhotoLightbox.vue              # Lightbox/zoom viewer
    DashboardTablePagination.vue   # Table pagination controls
    reports/
      AnalyticsChart.vue
      RankingList.vue
  pages/
    index.vue                      # Root redirect (splash saat ini)
    login.vue                      # Login page
    cs/...                         # CS workspace pages (SELESAI)
    dashboard/
      index.vue                    # Dashboard home
      claims/index.vue             # Claims list
      claims/[id].vue              # Claim review detail
      vendor-claims/index.vue      # Vendor claims list
      vendor-claims/create.vue     # Vendor claim wizard
      vendor-claims/[id].vue       # Vendor claim detail
      master/vendor.vue            # Master vendor
      master/product-model.vue     # Master product model
      master/notification.vue      # Master notification
      master/defect.vue            # Master defect
      reports.vue                  # Reports wrapper (tabs + NuxtPage)
      reports/index.vue            # Reports overview
      reports/branches.vue         # Branch report
      reports/vendors.vue          # Vendor report
      reports/trends.vue           # Trend report
      reports/aging.vue            # Aging report
      reports/defects.vue          # Defect report
      reports/recovery.vue         # Recovery report
      audit-trail.vue              # Audit trail
      users/index.vue              # User management
      users/[id].vue               # User detail
      settings/index.vue           # Settings General (profile read-only)
      settings/security.vue        # Settings Security (change password)
  utils/
    mock-data.ts                   # Semua mock data (claims, users, reports)
    types.ts                       # Frontend view model types
    status-config.ts               # Status color/icon/label configs
    select-ui.ts                   # Select helper UI
    audit-trail-config.ts          # Audit trail column/filter config
shared/
  utils/constants.ts               # Enums: roles, statuses, photo types, dll
  utils/fiscal.ts                  # Fiscal period helpers
  types/database.ts                # DB types + filter types
server/
  api/...                          # API routes (sudah ada, jangan diubah)
```

### 1.3 Design System Rules

| Aspek | Aturan |
|-------|--------|
| **Theme** | Dark-only. Base `#050505`, surface `#0a0a0a`. TIDAK ada light mode. |
| **Accent** | `#B6F500` (lime/yellow-green) untuk active states, CTA, highlights |
| **Status Colors** | blue=SUBMITTED/CREATED, indigo=IN_REVIEW, amber=NEED_REVISION/PROCESSING, emerald=APPROVED/COMPLETED/VERIFIED, zinc/white=DRAFT/ARCHIVED, red=REJECT/destructive |
| **Border** | `border-white/5` (subtle), `border-white/10` (card), `border-[#B6F500]/30` (hover accent) |
| **Radius** | Cards: `rounded-4xl` atau `rounded-[32px]`. Buttons: `rounded-2xl`. Pills: `rounded-full` |
| **Typography** | Headings: `font-black uppercase tracking-tighter italic`. Labels: `text-[10px] font-black uppercase tracking-[0.2em] text-white/20`. Body: `text-sm font-medium` |
| **Blur** | Dekorasi: `blur-[150px]` radial gradients. Sidebar: `backdrop-blur-xl` |
| **Scrollbar** | Custom webkit scrollbar dengan gradient `#B6F500` |

### 1.4 Pola Kode yang Sudah Ada

**Page meta (WAJIB pada setiap page dashboard)**:
```ts
definePageMeta({ layout: 'dashboard' })
```

**TanStack Table pattern**:
```ts
import { createColumnHelper, getCoreRowModel, getSortedRowModel, getPaginationRowModel, useVueTable, FlexRender } from '@tanstack/vue-table'

const columnHelper = createColumnHelper<RowType>()
const columns = [
  columnHelper.accessor('fieldName', {
    header: 'Label',
    enableSorting: true,
    cell: info => h('span', { class: '...' }, info.getValue())
  })
]

const table = useVueTable({
  data: filteredData,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: { get sorting() { return sorting.value }, get pagination() { return pagination.value } },
  onSortingChange: updater => { sorting.value = typeof updater === 'function' ? updater(sorting.value) : updater },
  onPaginationChange: updater => { pagination.value = typeof updater === 'function' ? updater(pagination.value) : updater }
})
```

**Search + debounce pattern**:
```ts
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined

watch(searchQuery, (value) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, 250)
}, { immediate: true })
```

**Status config pattern (SELALU gunakan dari `app/utils/status-config.ts`)**:
```ts
import { getClaimStatusConfig, getClaimStatusFilterClasses } from '~/utils/status-config'
// Jangan buat status config custom di page. Gunakan yang sudah ada.
```

### 1.5 Yang TIDAK Boleh Dilakukan

- JANGAN buat light mode atau toggle appearance
- JANGAN ubah file di `server/` kecuali diminta eksplisit
- JANGAN buat auth flow nyata (session, middleware, redirect login)
- JANGAN ubah file di `app/pages/cs/` (CS workspace sudah selesai)
- JANGAN pakai `reactive()` untuk data besar; gunakan `ref()` + `computed()`
- JANGAN buat komponen baru kalau sudah ada yang mirip di `app/components/`
- JANGAN hapus data/halaman yang sudah ada, hanya refactor dan perbaiki

---

## 2. Sprint 1: Role-Aware Dashboard Foundation

**File yang diubah**:
- `app/utils/role-navigation.ts` (BARU)
- `app/composables/useDashboardStore.ts` (BARU)
- `app/layouts/dashboard.vue` (REFACTOR)
- `app/pages/dashboard/index.vue` (REFACTOR)

**Closes**: DB-D-001, DB-D-002, DB-D-003, DB-D-004, DB-D-005, DB-D-006, NAV-002, NAV-003, NAV-005

### 2.1 Task 1: Buat `app/utils/role-navigation.ts`

File ini menjadi **single source of truth** untuk navigasi berdasarkan role. Semua logic menu sidebar dikendalikan dari sini.

```ts
// app/utils/role-navigation.ts
import type { Component } from 'vue'
import type { UserRole } from '~~/shared/utils/constants'
import {
  ClipboardList,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  Bell,
  FileBox,
  AlertCircle
} from 'lucide-vue-next'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface NavLink {
  label: string
  icon: Component
  to: string
  badge?: string
  exact?: boolean
}

export interface NavLinkWithChildren extends NavLink {
  children?: NavLink[]
  isOpen?: boolean
}

export interface NavGroup {
  category: string
  links: NavLinkWithChildren[]
}

// ──────────────────────────────────────────────
// Full Menu Definition
// ──────────────────────────────────────────────
// Setiap item punya `roles`: array role yang boleh melihat item tersebut.
// Jika tidak didefinisikan, berarti semua role bisa akses.

interface NavItemDef {
  label: string
  icon: Component
  to: string
  badge?: string
  exact?: boolean
  roles?: UserRole[]
  children?: NavItemDef[]
}

interface NavGroupDef {
  category: string
  items: NavItemDef[]
}

const FULL_MENU: NavGroupDef[] = [
  {
    category: 'Core',
    items: [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        to: '/dashboard',
        exact: true
        // Semua role bisa akses
      },
      {
        label: 'Reports',
        icon: FileText,
        to: '/dashboard/reports'
        // Semua role bisa akses
      }
    ]
  },
  {
    category: 'Operations',
    items: [
      {
        label: 'Claims',
        icon: ClipboardList,
        to: '/dashboard/claims',
        roles: ['QRCC', 'ADMIN']
      },
      {
        label: 'Vendor Claims',
        icon: Package,
        to: '/dashboard/vendor-claims',
        roles: ['QRCC', 'ADMIN']
      },
      {
        label: 'Master Data',
        icon: Database,
        to: '/dashboard/master',
        roles: ['QRCC', 'ADMIN'],
        children: [
          { label: 'Vendor', icon: Users, to: '/dashboard/master/vendor', roles: ['QRCC', 'ADMIN'] },
          { label: 'Product Model', icon: FileBox, to: '/dashboard/master/product-model', roles: ['QRCC', 'ADMIN'] },
          { label: 'Notification', icon: Bell, to: '/dashboard/master/notification', roles: ['QRCC', 'ADMIN'] },
          { label: 'Defect', icon: AlertCircle, to: '/dashboard/master/defect', roles: ['QRCC', 'ADMIN'] }
        ]
      }
    ]
  },
  {
    category: 'Administration',
    items: [
      {
        label: 'Users',
        icon: Users,
        to: '/dashboard/users',
        roles: ['ADMIN']
      },
      {
        label: 'Audit Trail',
        icon: History,
        to: '/dashboard/audit-trail',
        roles: ['QRCC', 'ADMIN']
      },
      {
        label: 'Settings',
        icon: Settings,
        to: '/dashboard/settings'
        // Semua role bisa akses
      }
    ]
  }
]

// ──────────────────────────────────────────────
// Builder Function
// ──────────────────────────────────────────────

/**
 * Bangun navigasi sidebar berdasarkan role aktif.
 * Hasilnya adalah array NavGroup yang sudah difilter.
 */
export function buildNavigationForRole(role: UserRole): NavGroup[] {
  const result: NavGroup[] = []

  for (const groupDef of FULL_MENU) {
    const filteredLinks: NavLinkWithChildren[] = []

    for (const item of groupDef.items) {
      // Cek akses role untuk item utama
      if (item.roles && !item.roles.includes(role)) continue

      const navItem: NavLinkWithChildren = {
        label: item.label,
        icon: item.icon,
        to: item.to,
        badge: item.badge,
        exact: item.exact
      }

      // Filter children jika ada
      if (item.children) {
        const filteredChildren = item.children.filter(
          child => !child.roles || child.roles.includes(role)
        )
        if (filteredChildren.length === 0) continue

        navItem.children = filteredChildren.map(child => ({
          label: child.label,
          icon: child.icon,
          to: child.to
        }))
        navItem.isOpen = false
      }

      filteredLinks.push(navItem)
    }

    // Hanya tambahkan group jika ada item visible
    if (filteredLinks.length > 0) {
      result.push({
        category: groupDef.category,
        links: filteredLinks
      })
    }
  }

  return result
}

// ──────────────────────────────────────────────
// Role Display Config
// ──────────────────────────────────────────────

export interface RoleDisplayConfig {
  label: string
  badgeClass: string
  landingPage: string
  dashboardTitle: string
  dashboardSubtitle: string
}

export const ROLE_DISPLAY: Record<UserRole, RoleDisplayConfig> = {
  ADMIN: {
    label: 'System Administrator',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    landingPage: '/dashboard',
    dashboardTitle: 'Admin Console',
    dashboardSubtitle: 'Full system access. Manage users, review claims, and monitor operations.'
  },
  QRCC: {
    label: 'QRCC Reviewer',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    landingPage: '/dashboard',
    dashboardTitle: 'Review Dashboard',
    dashboardSubtitle: 'Review pending claims, verify evidence, and manage vendor batches.'
  },
  MANAGEMENT: {
    label: 'Management',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    landingPage: '/dashboard',
    dashboardTitle: 'Analytics Overview',
    dashboardSubtitle: 'Monitor performance trends, reports, and operational metrics.'
  },
  CS: {
    label: 'CS Agent',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    landingPage: '/cs',
    dashboardTitle: 'CS Dashboard',
    dashboardSubtitle: ''
  }
}
```

**Aturan navigasi per role** (berdasarkan PRD Section 8.2):

| Role | Menu yang tampil |
|------|-----------------|
| **ADMIN** | Dashboard, Reports, Claims, Vendor Claims, Master Data (4 sub), Users, Audit Trail, Settings |
| **QRCC** | Dashboard, Reports, Claims, Vendor Claims, Master Data (4 sub), Audit Trail, Settings |
| **MANAGEMENT** | Dashboard, Reports, Settings |
| **CS** | Tidak masuk dashboard, pakai `/cs` layout |

### 2.2 Task 2: Buat `app/composables/useDashboardStore.ts`

Composable ini menjadi state management untuk dashboard workspace. Menyimpan mock role aktif, user profile, dan navigasi.

```ts
// app/composables/useDashboardStore.ts
import type { UserRole } from '~~/shared/utils/constants'
import { buildNavigationForRole, ROLE_DISPLAY } from '~/utils/role-navigation'
import type { NavGroup, RoleDisplayConfig } from '~/utils/role-navigation'

// ──────────────────────────────────────────────
// Mock current user (akan diganti auth session nanti)
// ──────────────────────────────────────────────

interface DashboardUser {
  id: string
  name: string
  email: string
  role: UserRole
  branch: string
  avatarUrl: string
}

// State disimpan di luar composable supaya shared antar komponen (singleton)
const _currentRole = ref<UserRole>('QRCC')

const _mockUsers: Record<UserRole, DashboardUser> = {
  ADMIN: {
    id: 'USR-002',
    name: 'Ahmad Fauzi',
    email: 'ahmad.fauzi@sharp.co.id',
    role: 'ADMIN',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Admin'
  },
  QRCC: {
    id: 'USR-003',
    name: 'Nadia Putri',
    email: 'nadia.putri@sharp.co.id',
    role: 'QRCC',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nadia'
  },
  MANAGEMENT: {
    id: 'USR-004',
    name: 'Budi Raharjo',
    email: 'budi.raharjo@sharp.co.id',
    role: 'MANAGEMENT',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Budi'
  },
  CS: {
    id: 'USR-001',
    name: 'Zaina Riddle',
    email: 'zaina@sharp.co.id',
    role: 'CS',
    branch: 'Jakarta',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix'
  }
}

export function useDashboardStore() {
  const currentRole = computed<UserRole>({
    get: () => _currentRole.value,
    set: (val: UserRole) => { _currentRole.value = val }
  })

  const currentUser = computed<DashboardUser>(() => _mockUsers[_currentRole.value])

  const roleDisplay = computed<RoleDisplayConfig>(() => ROLE_DISPLAY[_currentRole.value])

  const navigation = computed<NavGroup[]>(() => buildNavigationForRole(_currentRole.value))

  /**
   * Ganti role aktif (untuk development/testing).
   * Nanti akan diganti dengan session auth.
   */
  function switchRole(role: UserRole) {
    _currentRole.value = role
  }

  return {
    currentRole,
    currentUser,
    roleDisplay,
    navigation,
    switchRole
  }
}
```

### 2.3 Task 3: Refactor `app/layouts/dashboard.vue`

Ini adalah perubahan terbesar di Sprint 1. Layout harus:
1. Menggunakan `useDashboardStore()` untuk navigasi dan user data
2. Menampilkan menu berdasarkan role
3. Menambahkan role switcher (khusus dev mode) untuk testing
4. Memperbaiki label menu sesuai PRD

**Langkah-langkah implementasi:**

#### 3a. Ganti `menuGroups` reactive → computed dari composable

**Hapus** blok `menuGroups` yang hardcoded (baris 29-64 saat ini):
```ts
// HAPUS seluruh blok ini:
const menuGroups = reactive([
  { category: 'Core', links: [...] },
  { category: 'Operations', links: [...] },
  { category: 'Administration', links: [...] }
])
```

**Ganti dengan**:
```ts
const { currentUser, currentRole, roleDisplay, navigation, switchRole } = useDashboardStore()

// Navigation dari composable sudah role-aware
const menuGroups = computed(() => {
  // Tambahkan reactive isOpen state untuk dropdown items
  return navigation.value.map(group => ({
    ...group,
    links: group.links.map(link => ({
      ...link,
      isOpen: link.children ? openMenuState[link.to] ?? false : undefined
    }))
  }))
})

// State untuk dropdown menu yang terbuka
const openMenuState = reactive<Record<string, boolean>>({})

function toggleMenu(to: string) {
  openMenuState[to] = !openMenuState[to]
}
```

#### 3b. Update User Card di sidebar

**Hapus** hardcoded user card dan ganti dengan data dari composable:

```html
<!-- User Card (bawah sidebar) -->
<div class="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
  <div class="mb-4 flex items-center gap-3">
    <div class="h-10 w-10 overflow-hidden rounded-full border-2 border-[#B6F500]/30 bg-linear-to-tr from-gray-800 to-gray-900 shadow-inner">
      <img
        :src="currentUser.avatarUrl"
        :alt="currentUser.name"
      >
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-black">
        {{ currentUser.name }}
      </p>
      <p class="text-[9px] font-black uppercase tracking-widest text-[#B6F500] italic">
        {{ roleDisplay.label }}
      </p>
    </div>
  </div>

  <!-- Role Switcher (DEV ONLY — hapus sebelum production) -->
  <div class="mb-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-2">
    <p class="mb-1.5 text-center text-[8px] font-black uppercase tracking-widest text-amber-400/60">
      Dev: Switch Role
    </p>
    <div class="grid grid-cols-2 gap-1">
      <button
        v-for="role in (['ADMIN', 'QRCC', 'MANAGEMENT'] as const)"
        :key="role"
        :class="[
          'rounded-lg px-2 py-1 text-[9px] font-bold transition-all',
          currentRole === role
            ? 'bg-[#B6F500] text-black'
            : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
        ]"
        @click="switchRole(role)"
      >
        {{ role }}
      </button>
    </div>
  </div>

  <NuxtLink
    to="/login"
    class="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 py-2.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-400/10"
  >
    <LogOut :size="14" /> Sign Out
  </NuxtLink>
</div>
```

#### 3c. Update template sidebar nav loop

Template sidebar navigation loop perlu disesuaikan karena `menuGroups` sekarang computed. Ganti `@click="link.isOpen = !link.isOpen"` dengan `@click="toggleMenu(link.to)"` dan akses `openMenuState` untuk state dropdown.

```html
<!-- Dropdown toggle button -->
<button
  class="group relative flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300 text-white/40 hover:bg-white/5 hover:text-white"
  @click="toggleMenu(link.to)"
>
  <!-- ... icon, label ... -->
  <ChevronDown
    :size="16"
    :class="['transition-transform duration-300', link.isOpen ? 'rotate-180 text-[#B6F500]' : '']"
  />
</button>

<!-- Dropdown content -->
<div
  :class="[
    'grid transition-all duration-300 ease-in-out',
    link.isOpen || route.path.startsWith(link.to) ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
  ]"
>
```

#### 3d. Bersihkan import icons yang tidak lagi dipakai langsung

Setelah menu definition pindah ke `role-navigation.ts`, beberapa icon import di `dashboard.vue` bisa dihapus karena sudah diimport di file utils. Sisakan hanya yang dipakai langsung di template layout (Bell, LogOut, Menu, Search, X, ChevronDown).

### 2.4 Task 4: Refactor `app/pages/dashboard/index.vue`

Dashboard home harus menampilkan konten berbeda berdasarkan role. Bukan 3 page terpisah, tapi **satu page dengan conditional sections**.

#### Strategi: Widget-based Composition

```vue
<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { currentRole, roleDisplay } = useDashboardStore()

// Widget visibility berdasarkan role
const showReviewQueue = computed(() => ['QRCC', 'ADMIN'].includes(currentRole.value))
const showKpiCards = computed(() => true) // Semua role lihat KPI
const showRecentClaims = computed(() => ['QRCC', 'ADMIN'].includes(currentRole.value))
const showAnalyticsChart = computed(() => true) // Semua role lihat chart
const showSystemOverview = computed(() => currentRole.value === 'ADMIN')
const showQuickActions = computed(() => ['QRCC', 'ADMIN'].includes(currentRole.value))

// ... (data fetching dan table setup tetap sama)
</script>
```

#### Perubahan Header

**Saat ini**:
```html
<h2 class="...">Admin <span class="text-[#B6F500]">Console</span></h2>
<p class="...">Selamat datang kembali. Sistem mendeteksi 12 klaim baru butuh verifikasi QRCC.</p>
```

**Harus jadi**:
```html
<h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
  {{ roleDisplay.dashboardTitle.split(' ')[0] }}
  <span class="text-[#B6F500]">{{ roleDisplay.dashboardTitle.split(' ').slice(1).join(' ') }}</span>
</h2>
<p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
  {{ roleDisplay.dashboardSubtitle }}
</p>
```

#### KPI Cards per Role

**QRCC**: Pending Review, In Review, Approved Today, Revision Rate
**MANAGEMENT**: Total Claims (FH), Approval Rate, Avg Resolution Time, Vendor Claim Batches
**ADMIN**: Total Claims, Active Users, Pending Review, System Approval Rate

```ts
const kpiData = computed(() => {
  if (currentRole.value === 'MANAGEMENT') {
    return [
      { label: 'Total Claims (FH)', value: '1,842', trend: '+14%', icon: ClipboardList, color: '#B6F500' },
      { label: 'Approval Rate', value: '92.4%', trend: '+1.2%', icon: CheckCircle2, color: '#10b981' },
      { label: 'Avg Resolution', value: '3.2d', trend: '-0.5d', icon: Clock, color: '#3b82f6' },
      { label: 'Vendor Batches', value: '24', trend: '+3', icon: Package, color: '#f59e0b' }
    ]
  }

  if (currentRole.value === 'QRCC') {
    return [
      { label: 'Pending Review', value: '42', trend: '-8', icon: Clock, color: '#3b82f6' },
      { label: 'In Review', value: '7', trend: '+2', icon: Search, color: '#6366f1' },
      { label: 'Approved Today', value: '12', trend: '+4', icon: CheckCircle2, color: '#10b981' },
      { label: 'Revision Rate', value: '15.3%', trend: '-2.1%', icon: AlertCircle, color: '#f59e0b' }
    ]
  }

  // ADMIN (default)
  return [
    { label: 'Total RMA Claims', value: '1,842', trend: '+14%', icon: ClipboardList, color: '#B6F500' },
    { label: 'Active Users', value: '128', trend: '+4', icon: Users, color: '#f59e0b' },
    { label: 'Pending Review', value: '42', trend: '-8%', icon: Clock, color: '#3b82f6' },
    { label: 'Approval Rate', value: '92.4%', trend: '+1.2%', icon: CheckCircle2, color: '#10b981' }
  ]
})
```

#### Quick Actions per Role

```ts
const quickActions = computed(() => {
  if (currentRole.value === 'MANAGEMENT') {
    return [
      { label: 'View Reports', to: '/dashboard/reports', icon: FileText },
      { label: 'Export Data', action: 'export', icon: Download }
    ]
  }

  if (currentRole.value === 'QRCC') {
    return [
      { label: 'Review Claims', to: '/dashboard/claims', icon: ClipboardList },
      { label: 'Generate Vendor Claim', to: '/dashboard/vendor-claims/create', icon: Package }
    ]
  }

  // ADMIN
  return [
    { label: 'Audit Logs', to: '/dashboard/audit-trail', icon: Activity },
    { label: 'Generate Report', action: 'report', icon: FileText }
  ]
})
```

#### Template Sections dengan v-if

```html
<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="space-y-8 lg:space-y-10 xl:space-y-12">

      <!-- Header (role-aware) -->
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between ...">
        <!-- Title dari roleDisplay -->
        <!-- Quick action buttons dari quickActions -->
      </div>

      <!-- KPI Cards (semua role, data berbeda) -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 ...">
        <!-- Loop kpiData -->
      </div>

      <!-- Review Queue Widget — QRCC & ADMIN only -->
      <div v-if="showReviewQueue" class="...">
        <!-- Tabel recent claims yang butuh review -->
        <!-- CTA: "View All Claims" -->
      </div>

      <!-- Analytics Chart (semua role) -->
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-12 ...">
        <!-- Chart area -->
        <!-- Side panel: Top CS / Top Vendors / System Health tergantung role -->
      </div>

      <!-- Recent Claims Table — QRCC & ADMIN only -->
      <div v-if="showRecentClaims" class="...">
        <!-- TanStack table yang sudah ada -->
      </div>

      <!-- System Overview — ADMIN only -->
      <div v-if="showSystemOverview" class="...">
        <!-- User stats, system health, recent audit -->
      </div>

    </div>
  </div>
</template>
```

#### Side Panel per Role

Di area chart (grid 8+4), panel samping diubah:

| Role | Side Panel Content |
|------|-------------------|
| **QRCC** | Top Contributing Branches (claims volume) |
| **MANAGEMENT** | Vendor Performance Summary |
| **ADMIN** | System Health: Active Users, DB Size, Last Backup |

---

## 3. Sprint 2: Settings Workspace Alignment

**File yang diubah**:
- `app/pages/dashboard/settings/index.vue` (REFACTOR)
- `app/pages/dashboard/settings/security.vue` (BARU)

**Terkait**: DB-014, DB-015, DB-D-012, DB-D-013

### 3.1 Implementasi Aktual

Settings dashboard sekarang sudah **route-based** sesuai target PRD:
- `/dashboard/settings` → General (profile read-only)
- `/dashboard/settings/security` → Security (change password)

Sidebar settings sudah memakai `NuxtLink` dan active state berbasis `useRoute()`.

### 3.2 Detail Scope per Halaman

**General (`settings/index.vue`)**:
1. menampilkan profile read-only berbasis `MOCK_USER_PROFILE`
2. tetap memiliki loading state dan error state untuk profile

**Security (`settings/security.vue`)**:
1. logic change password dipisah ke route/file terpisah
2. validasi password aktif (required, min 8 karakter, tidak sama dengan password lama, confirm harus match)
3. visibility toggle + success banner + simulated submit loading tetap tersedia

### 3.3 Konsistensi Dark-Only

Alignment Sprint 2 juga sudah memenuhi dark-only rules repo:
1. tab `Appearance` dihapus
2. `useColorMode()` dihapus dari settings
3. toggle light/dark dihapus
4. icon `<Sun />` dan `<Moon />` tidak lagi dipakai di settings

---

## 4. Sprint 3: Operational List Pages

**File yang diubah**:
- `app/pages/dashboard/claims/index.vue` (REFACTOR)
- `app/pages/dashboard/vendor-claims/index.vue` (REFACTOR)
- `app/pages/dashboard/users/index.vue` (REFACTOR)

**Closes**: DB-D-007, DB-D-008, DB-D-011

### 4.1 Task 1: Claims List — Tambah Filter Lengkap

**File**: `app/pages/dashboard/claims/index.vue`
**Gap**: Belum ada filter vendor, date/periode, dan branch.

#### 4.1a. Tambahkan filter state

Di bawah `statusFilter`, tambahkan:

```ts
// Filter state baru
const vendorFilter = ref<string>('ALL')
const branchFilter = ref<string>('ALL')
const dateFrom = ref<string>('')
const dateTo = ref<string>('')

// Options dari data
const vendorOptions = computed(() => {
  const vendors = [...new Set(data.value.map(c => c.vendor))].sort()
  return ['ALL', ...vendors]
})

const branchOptions = computed(() => {
  const branches = [...new Set(data.value.map(c => c.branch))].sort()
  return ['ALL', ...branches]
})
```

#### 4.1b. Update filter pipeline

**Saat ini** `filteredClaims` hanya filter status. Harus ditambah:

```ts
const filteredClaims = computed(() => {
  let result = searchScopedClaims.value

  // Status filter
  if (statusFilter.value !== 'ALL') {
    result = result.filter(claim => claim.claimStatus === statusFilter.value)
  }

  // Vendor filter
  if (vendorFilter.value !== 'ALL') {
    result = result.filter(claim => claim.vendor === vendorFilter.value)
  }

  // Branch filter
  if (branchFilter.value !== 'ALL') {
    result = result.filter(claim => claim.branch === branchFilter.value)
  }

  // Date range filter
  if (dateFrom.value) {
    const from = new Date(dateFrom.value)
    result = result.filter(claim => claim.createdAt >= from)
  }
  if (dateTo.value) {
    const to = new Date(dateTo.value)
    to.setHours(23, 59, 59, 999)
    result = result.filter(claim => claim.createdAt <= to)
  }

  return result
})

const hasActiveFilters = computed(() =>
  normalizedSearchQuery.value.length > 0
  || statusFilter.value !== 'ALL'
  || vendorFilter.value !== 'ALL'
  || branchFilter.value !== 'ALL'
  || dateFrom.value !== ''
  || dateTo.value !== ''
)

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
  vendorFilter.value = 'ALL'
  branchFilter.value = 'ALL'
  dateFrom.value = ''
  dateTo.value = ''
}
```

#### 4.1c. Tambahkan filter UI di template

Di bawah status filter pills, tambahkan baris filter baru:

```html
<!-- Filter Row 2: Vendor, Branch, Date Range -->
<div class="flex flex-wrap items-center gap-3 mt-4">
  <!-- Vendor Filter -->
  <div class="flex items-center gap-2">
    <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Vendor</span>
    <select
      v-model="vendorFilter"
      class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 outline-none transition-all focus:border-[#B6F500]/50"
    >
      <option v-for="v in vendorOptions" :key="v" :value="v">
        {{ v === 'ALL' ? 'All Vendors' : v }}
      </option>
    </select>
  </div>

  <!-- Branch Filter -->
  <div class="flex items-center gap-2">
    <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Branch</span>
    <select
      v-model="branchFilter"
      class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 outline-none transition-all focus:border-[#B6F500]/50"
    >
      <option v-for="b in branchOptions" :key="b" :value="b">
        {{ b === 'ALL' ? 'All Branches' : b }}
      </option>
    </select>
  </div>

  <!-- Date Range -->
  <div class="flex items-center gap-2">
    <span class="text-[10px] font-black uppercase tracking-widest text-white/20">From</span>
    <input
      v-model="dateFrom"
      type="date"
      class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 outline-none transition-all focus:border-[#B6F500]/50"
    >
    <span class="text-[10px] font-black uppercase tracking-widest text-white/20">To</span>
    <input
      v-model="dateTo"
      type="date"
      class="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60 outline-none transition-all focus:border-[#B6F500]/50"
    >
  </div>
</div>
```

**Styling note**: `<select>` dan `<input type="date">` di dark theme memerlukan custom styling. Tambahkan class dark supaya background dan text terlihat:
```css
select option {
  background: #0a0a0a;
  color: white;
}
```

Atau lebih baik: gunakan komponen `USelectMenu` dari Nuxt UI untuk dropdown filter agar konsisten dengan design system. Contoh pattern sudah ada di `audit-trail.vue` (baris yang menggunakan USelectMenu untuk action filter).

#### 4.1d. Reset pagination saat filter berubah

```ts
watch([searchQuery, statusFilter, vendorFilter, branchFilter, dateFrom, dateTo], () => {
  pagination.value.pageIndex = 0
})
```

### 4.2 Task 2: Vendor Claims List — Tambah Vendor & Period Filter

**File**: `app/pages/dashboard/vendor-claims/index.vue`
**Gap**: Belum ada vendor filter dan period filter.

Halaman ini saat ini menggunakan **manual pagination** (computed slice), bukan TanStack. Pattern ini boleh dipertahankan karena data vendor claims biasanya lebih sedikit.

#### 4.2a. Tambahkan filter state

```ts
// Tambahkan di bawah statusFilter yang sudah ada
const vendorFilter = ref<string>('ALL')
const periodFilter = ref<string>('ALL')

const vendorOptions = computed(() => {
  const vendors = [...new Set(vendorClaims.map(vc => vc.vendorName))].sort()
  return ['ALL', ...vendors]
})

// Period options berdasarkan fiscal
const periodOptions = ['ALL', '2025FH', '2025LH', '2026FH'] as const
```

#### 4.2b. Update filter pipeline

```ts
const filteredVendorClaims = computed(() => {
  let result = vendorClaims

  // Status filter (sudah ada)
  if (statusFilter.value !== 'ALL') {
    result = result.filter(vc => vc.status === statusFilter.value)
  }

  // Vendor filter (BARU)
  if (vendorFilter.value !== 'ALL') {
    result = result.filter(vc => vc.vendorName === vendorFilter.value)
  }

  // Period filter (BARU) — cocokkan dengan fiscalLabel di mock data
  if (periodFilter.value !== 'ALL') {
    result = result.filter(vc => vc.fiscalLabel === periodFilter.value)
  }

  return result
})
```

#### 4.2c. Tambahkan filter dropdown di template

Tambahkan di bawah status filter pills. Gunakan pattern yang sama dengan claims list (select dropdown atau USelectMenu).

### 4.3 Task 3: Users Page — Filter Active/Inactive Sebagai Primary

**File**: `app/pages/dashboard/users/index.vue`
**Gap**: Filter utama masih role, bukan active/inactive status.

#### 4.3a. Tambahkan status filter

```ts
// Tambahkan di bawah roleFilter yang sudah ada
type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE'
const statusFilter = ref<StatusFilterType>('ALL')
```

#### 4.3b. Update filter pipeline

Saat ini filter hanya berdasarkan role. Tambahkan status:

```ts
const filteredUsers = computed(() => {
  let result = searchScopedUsers.value

  // Status filter (BARU — ini jadi PRIMARY filter)
  if (statusFilter.value !== 'ALL') {
    result = result.filter(user =>
      statusFilter.value === 'ACTIVE' ? user.isActive : !user.isActive
    )
  }

  // Role filter (sudah ada, tetap sebagai secondary)
  if (roleFilter.value !== 'ALL') {
    result = result.filter(user => user.role === roleFilter.value)
  }

  return result
})
```

#### 4.3c. Tambahkan status pills di template

Letakkan **sebelum** role filter pills:

```html
<!-- Status Filter (PRIMARY) -->
<div class="flex items-center gap-2 mb-3">
  <span class="text-[10px] font-black uppercase tracking-widest text-white/20 mr-2">Status</span>
  <button
    v-for="status in (['ALL', 'ACTIVE', 'INACTIVE'] as const)"
    :key="status"
    :class="[
      'rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest italic transition-all',
      statusFilter === status
        ? status === 'ALL'
          ? 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]'
          : status === 'ACTIVE'
            ? 'border-emerald-400 bg-emerald-400 text-black shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
            : 'border-red-400 bg-red-400 text-black shadow-[0_10px_28px_rgba(248,113,113,0.28)]'
        : 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07]'
    ]"
    @click="statusFilter = status"
  >
    {{ status === 'ALL' ? 'All' : status }}
  </button>
</div>

<!-- Role Filter (SECONDARY, sudah ada) -->
<div class="flex items-center gap-2">
  <span class="text-[10px] font-black uppercase tracking-widest text-white/20 mr-2">Role</span>
  <!-- ... role pills yang sudah ada ... -->
</div>
```

#### 4.3d. Update hasActiveFilters dan resetFilters

```ts
const hasActiveFilters = computed(() =>
  normalizedSearchQuery.value.length > 0
  || statusFilter.value !== 'ALL'
  || roleFilter.value !== 'ALL'
)

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
  roleFilter.value = 'ALL'
}
```

---

## 5. Sprint 4: Shared Component Standardization

**Focus**: Audit penggunaan shared components di semua dashboard pages, dan standardisasi pola yang belum konsisten.

### 5.1 Task 1: StatusBadge — Konsolidasi penggunaan

**Problem**: Banyak page masih merender badge custom sendiri (inline `<span>` dengan status classes) alih-alih pakai `<StatusBadge>`.

**File yang perlu diaudit dan diubah**:

| File | Issue | Action |
|------|-------|--------|
| `dashboard/index.vue` | Inline status badge di table cell | Ganti cell renderer dengan `StatusBadge` |
| `dashboard/claims/index.vue` | Inline status badge di table cell | Ganti cell renderer dengan `StatusBadge` |
| `dashboard/vendor-claims/index.vue` | Custom status span | Ganti dengan `StatusBadge variant="vendor-claim"` |
| `dashboard/users/index.vue` | Role badge custom | Tetap custom (bukan status, tapi role) — OK |

**Contoh perubahan di table cell renderer**:

```ts
// SEBELUM (inline custom badge)
columnHelper.accessor('claimStatus', {
  header: 'Status',
  cell: info => h('span', {
    class: ['inline-block rounded-full border px-4 py-1.5 text-[9px] font-black uppercase ...', statusConfigs[info.getValue()]]
  }, info.getValue().replace('_', ' '))
})

// SESUDAH (pakai StatusBadge)
import StatusBadge from '~/components/StatusBadge.vue'

columnHelper.accessor('claimStatus', {
  header: 'Status',
  cell: info => h(StatusBadge, {
    status: info.getValue(),
    variant: 'claim',
    size: 'sm'
  })
})
```

### 5.2 Task 2: PageHeader — Standardisasi header pattern

**Problem**: Setiap page bikin header sendiri-sendiri dengan pattern yang mirip tapi tidak identik.

**Action**: Audit semua dashboard pages, dan ganti header section yang bisa digantikan `<PageHeader>`. Kandidat:

| Page | Saat ini | Gunakan PageHeader? |
|------|----------|-------------------|
| `/dashboard` | Custom hero header | TIDAK — terlalu custom, biarkan |
| `/dashboard/claims` | Custom header | YA — `<PageHeader title="Claims" description="..." />` |
| `/dashboard/vendor-claims` | Custom header | YA |
| `/dashboard/users` | Custom header | YA |
| `/dashboard/audit-trail` | Custom header | YA |
| `/dashboard/settings` | Custom header | TIDAK — punya own layout |
| Master pages | Custom header | YA |

### 5.3 Task 3: EmptyState & LoadingState — Konsistensi

**Problem**: Tidak semua halaman punya empty state dan loading state yang konsisten.

**Action**: Pastikan setiap list page memiliki:

```html
<!-- Loading State -->
<LoadingState v-if="isLoading" variant="table" :rows="5" />

<!-- Empty State (setelah filter) -->
<EmptyState
  v-else-if="filteredData.length === 0 && hasActiveFilters"
  title="Tidak ada data ditemukan"
  description="Coba ubah filter atau kata kunci pencarian."
  action-label="Reset Filter"
  @action="resetFilters"
/>

<!-- Empty State (tanpa filter) -->
<EmptyState
  v-else-if="data.length === 0"
  title="Belum ada data"
  description="Data akan muncul saat sudah tersedia."
/>

<!-- Table (ada data) -->
<div v-else>
  <!-- table content -->
</div>
```

### 5.4 Task 4: Filter Pattern — Gunakan FilterBar

**Problem**: Setiap halaman buat search bar sendiri. `<FilterBar>` sudah ada tapi belum dipakai konsisten.

**Action**: Ganti custom search bar di list pages dengan `<FilterBar>`:

```html
<FilterBar
  v-model:search="searchQuery"
  v-model:refreshing="isRefreshing"
  search-placeholder="Cari claim number, vendor, model..."
  :show-refresh="true"
  :show-reset="hasActiveFilters"
  :has-active-filters="hasActiveFilters"
  @refresh="handleRefresh"
  @reset="resetFilters"
>
  <!-- Status filter pills -->
  <template #default>
    <button
      v-for="status in statusOptions"
      :key="status"
      :class="[...]"
      @click="statusFilter = status"
    >
      {{ getStatusLabel(status) }}
    </button>
  </template>

  <template #summary>
    <span class="text-xs text-white/30 italic">{{ activeFilterSummary }}</span>
  </template>
</FilterBar>
```

---

## 6. Referensi Design System

### 6.1 Tailwind Class Patterns

**Card container**:
```
rounded-4xl border border-white/5 bg-[#0a0a0a] p-6 lg:p-8
```

**Card with hover**:
```
rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all
hover:border-[#B6F500]/30 hover:bg-white/10
```

**KPI value**:
```
text-3xl font-black tracking-tighter italic 2xl:text-4xl
```

**Category label**:
```
text-[10px] font-black uppercase tracking-[0.2em] text-white/20
```

**Accent button (primary CTA)**:
```
rounded-2xl bg-[#B6F500] px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.2em]
text-black italic shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95
```

**Ghost button**:
```
rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-[10px] font-black uppercase
tracking-widest italic transition-all hover:bg-white/10
```

**Filter pill (active)**:
```
rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest italic
bg-[#B6F500] text-black border-[#B6F500] shadow-[0_10px_28px_rgba(182,245,0,0.28)]
```

**Filter pill (idle)**:
```
rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-widest italic
border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07]
```

**Table row**:
```
group cursor-pointer border-b border-white/5 transition-all duration-300
hover:bg-white/[0.03]
```

**Table header**:
```
text-left text-[10px] font-black uppercase tracking-widest text-white/20
```

### 6.2 Status Colors Reference

```ts
// Dari app/utils/status-config.ts — SELALU gunakan ini:
import {
  getClaimStatusConfig,
  getPhotoStatusConfig,
  getVendorClaimStatusConfig,
  getClaimStatusFilterClasses,
  getVendorClaimFilterClasses,
  ACCENT_FILTER_ACTIVE,
  ACCENT_FILTER_IDLE
} from '~/utils/status-config'
```

### 6.3 Icon Usage

```ts
// SELALU import dari lucide-vue-next
import { IconName } from 'lucide-vue-next'

// Ukuran standar:
// - Sidebar menu icon: :size="18"
// - Sidebar submenu icon: :size="14"
// - Button icon: :size="16"
// - KPI card icon: :size="24"
// - Empty state icon: :size="48"
// - Inline text icon: :size="14"
```

### 6.4 Animation Patterns

```
// Stagger animation untuk sections
animate-in fade-in slide-in-from-bottom-4 duration-700
animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100
animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200
```

---

## 7. Checklist Validasi

Setelah setiap sprint selesai, jalankan checklist ini:

### Sprint 1 Checklist

- [x] `pnpm typecheck` lulus tanpa error
- [x] `pnpm lint` lulus tanpa error
- [x] `/dashboard` menampilkan header berbeda untuk ADMIN, QRCC, MANAGEMENT
- [x] KPI cards menampilkan data berbeda per role
- [x] Sidebar menu berubah saat role di-switch
- [x] MANAGEMENT hanya melihat: Dashboard, Reports, Settings
- [x] QRCC melihat: Dashboard, Reports, Claims, Vendor Claims, Master Data, Audit Trail, Settings
- [x] ADMIN melihat semua menu termasuk Users
- [x] Label sidebar: "Dashboard" (bukan "Overview"), "Users" (bukan "User Management")
- [x] Role switcher berfungsi di sidebar bawah
- [x] Mobile menu tetap berfungsi
- [x] Tidak ada regresi visual pada halaman dashboard lainnya

### Sprint 2 Checklist

- [x] `pnpm typecheck` lulus
- [x] `/dashboard/settings` menampilkan halaman `General` (profile read-only)
- [x] `/dashboard/settings/security` tersedia sebagai halaman `Security` terpisah
- [x] Navigasi settings sudah route-based (NuxtLink)
- [x] `app/pages/dashboard/settings/security.vue` sudah tersedia
- [x] Password validation berfungsi (min 8 char, match, dll)
- [x] Tab `Appearance` sudah dihapus
- [x] `useColorMode()` dan light-mode toggle sudah dihapus

### Sprint 3 Checklist

- [ ] `/dashboard/claims` memiliki filter: status, vendor, branch, date range
- [ ] Reset filter mengembalikan semua filter ke default
- [ ] Filter summary text akurat
- [ ] `/dashboard/vendor-claims` memiliki filter: status, vendor, period
- [ ] `/dashboard/users` filter utama adalah Active/Inactive
- [ ] Role filter tetap ada sebagai filter sekunder
- [ ] Pagination reset saat filter berubah
- [ ] Empty state muncul saat filter menghasilkan 0 data

### Sprint 4 Checklist

- [ ] `StatusBadge` digunakan di semua table cell yang menampilkan status
- [ ] `PageHeader` digunakan di halaman-halaman yang sesuai
- [ ] `EmptyState` dan `LoadingState` ada di semua list pages
- [ ] `FilterBar` digunakan secara konsisten di list pages
- [ ] Tidak ada duplikasi status color definition di individual pages

### Command untuk Validasi

```bash
pnpm typecheck        # TypeScript check
pnpm lint             # ESLint check
pnpm lint:fix         # Auto-fix lint issues
pnpm dev              # Manual visual check di browser
```

---

## Urutan Eksekusi yang Direkomendasikan

```
Sprint 1 (Foundation) [DONE]
├── [x] 1. Buat app/utils/role-navigation.ts 
├── [x] 2. Buat app/composables/useDashboardStore.ts
├── [x] 3. Refactor app/layouts/dashboard.vue
├── [x] 4. Refactor app/pages/dashboard/index.vue
└── [x] 5. Validate: typecheck + lint + visual

Sprint 2 (Settings Alignment)
├── 1. Verifikasi implementasi aktual app/pages/dashboard/settings/index.vue
├── 2. Catat gap terhadap PRD (route-based security + dark-only)
├── 3. Jika lanjut refactor: buat app/pages/dashboard/settings/security.vue
├── 4. Jika lanjut refactor: hapus appearance remnants
└── 5. Validate: typecheck + lint + visual

Sprint 3 (List Pages)
├── 1. Refactor app/pages/dashboard/claims/index.vue
├── 2. Refactor app/pages/dashboard/vendor-claims/index.vue
├── 3. Refactor app/pages/dashboard/users/index.vue
└── 4. Validate: typecheck + lint + visual

Sprint 4 (Consistency)
├── 1. Audit + replace inline badges dengan StatusBadge
├── 2. Audit + apply PageHeader
├── 3. Audit + apply EmptyState/LoadingState
├── 4. Audit + apply FilterBar
└── 5. Final validate: typecheck + lint + full visual review
```

Setiap sprint bisa dikerjakan independen, tapi **urutan 1→2→3→4 optimal** karena Sprint 1 membuat fondasi yang dipakai Sprint 2-4.

@prompt.md implementasikan bagian Sprint 2 (Settings Alignment) saja.

workflow:
- buatkan branch baru.
- implementasikan bagian Sprint 2 (Settings Alignment) saja.
- commit per task, lint::fix , typecheck
- jika sudah selesai semua baru push branch dan buatkan PR.
