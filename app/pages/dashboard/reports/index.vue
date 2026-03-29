<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileWarning,
  Inbox,
  Package,
  ShieldAlert,
  TrendingUp,
  AlertTriangle,
  Bug
} from 'lucide-vue-next'
import type { ReportSummary } from '~/utils/types'
import type { SelectItem } from '@nuxt/ui'
import { dashboardNeonSelectUi, dashboardNeonButtonUi, dashboardNeonGhostButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Mock Executive Overview Data
// ──────────────────────────────────────────────

const reportData = ref<ReportSummary>({
  kpi: {
    totalClaims: 342,
    submittedClaims: 58,
    inReviewClaims: 34,
    needRevisionClaims: 47,
    approvedClaims: 218,
    pendingBacklog: 139,
    avgReviewLeadTimeDays: 2.4,
    vendorPendingItems: 63,
    approvalRate: 63.7,
    revisionRate: 13.7,
    vendorAcceptanceRate: 78.2
  },
  claimsByVendor: [
    { vendor: 'MOKA', count: 156 },
    { vendor: 'MTC', count: 112 },
    { vendor: 'SDP', count: 74 }
  ],
  claimsByBranch: [
    { branch: 'Jakarta', count: 98, approvalRate: 72.4, revisionRate: 8.2 },
    { branch: 'Surabaya', count: 76, approvalRate: 65.8, revisionRate: 14.5 },
    { branch: 'Bandung', count: 63, approvalRate: 60.3, revisionRate: 17.5 },
    { branch: 'Medan', count: 57, approvalRate: 56.1, revisionRate: 19.3 },
    { branch: 'Makassar', count: 48, approvalRate: 62.5, revisionRate: 12.5 }
  ],
  topDefects: [
    { defect: 'Panel Crack', count: 89 },
    { defect: 'Dead Pixel', count: 67 },
    { defect: 'Backlight Bleeding', count: 52 },
    { defect: 'Color Distortion', count: 41 },
    { defect: 'Power Failure', count: 34 }
  ],
  monthlyTrend: [
    { month: 'Oct-25', inflow: 52, closure: 48, backlog: 120 },
    { month: 'Nov-25', inflow: 68, closure: 55, backlog: 133 },
    { month: 'Dec-25', inflow: 45, closure: 62, backlog: 116 },
    { month: 'Jan-26', inflow: 71, closure: 58, backlog: 129 },
    { month: 'Feb-26', inflow: 60, closure: 65, backlog: 124 },
    { month: 'Mar-26', inflow: 46, closure: 51, backlog: 119 }
  ],
  exceptions: [
    {
      label: 'Highest Revision Rate',
      value: 'Medan — 19.3%',
      detail: 'This branch has the highest revision rate. Review input quality and handoff accuracy.',
      severity: 'warning'
    },
    {
      label: 'Highest Rejection Rate',
      value: 'SDP — 28.4%',
      detail: 'SDP has the highest rejection rate this month.',
      severity: 'critical'
    },
    {
      label: 'Aging > SLA',
      value: '12 claims > 14 days',
      detail: '12 claims have passed the 14-day SLA without a decision.',
      severity: 'critical'
    }
  ]
})

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

const selectedPeriod = ref('this_month')
const periodOptions: SelectItem[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' }
]

const selectedBranch = ref('all')
const branchOptions: SelectItem[] = [
  { label: 'All Branches', value: 'all' },
  { label: 'Jakarta', value: 'jakarta' },
  { label: 'Surabaya', value: 'surabaya' },
  { label: 'Bandung', value: 'bandung' },
  { label: 'Medan', value: 'medan' },
  { label: 'Makassar', value: 'makassar' }
]

const selectedVendor = ref('all')
const vendorOptions: SelectItem[] = [
  { label: 'All Vendors', value: 'all' },
  { label: 'MOKA', value: 'moka' },
  { label: 'MTC', value: 'mtc' },
  { label: 'SDP', value: 'sdp' }
]

// ──────────────────────────────────────────────
// KPI Cards Config
// ──────────────────────────────────────────────

const kpiCards = computed(() => [
  {
    label: 'Total Claims',
    value: reportData.value.kpi.totalClaims,
    trend: '+12.5%',
    trendUp: true,
    icon: BarChart3,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'Submitted',
    value: reportData.value.kpi.submittedClaims,
    trend: '+5.2%',
    trendUp: true,
    icon: Inbox,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'In Review',
    value: reportData.value.kpi.inReviewClaims,
    trend: '-2.8%',
    trendUp: false,
    icon: Eye,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'Need Revision',
    value: reportData.value.kpi.needRevisionClaims,
    trend: '+2.1%',
    trendUp: true,
    icon: FileWarning,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'Approved',
    value: reportData.value.kpi.approvedClaims,
    trend: '+8.3%',
    trendUp: true,
    icon: CheckCircle2,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'Pending Backlog',
    value: reportData.value.kpi.pendingBacklog,
    trend: '-4.1%',
    trendUp: false,
    icon: Clock,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'Avg Review Lead Time',
    value: `${reportData.value.kpi.avgReviewLeadTimeDays}d`,
    trend: '-0.3d',
    trendUp: false,
    icon: TrendingUp,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  },
  {
    label: 'Vendor Pending',
    value: reportData.value.kpi.vendorPendingItems,
    trend: '+6',
    trendUp: true,
    icon: Package,
    color: 'text-white',
    bgGlow: 'bg-white/5',
    borderGlow: 'hover:border-white/20'
  }
])

// ──────────────────────────────────────────────
// Computed Chart Helpers
// ──────────────────────────────────────────────

const trendCategories = {
  inflow: {
    name: 'Claims Received',
    color: '#B6F500'
  },
  closure: {
    name: 'Claims Closed',
    color: '#60a5fa'
  },
  backlog: {
    name: 'Backlog',
    color: '#94a3b8'
  }
} as const

const trendXFormatter = (tick: number) => {
  return reportData.value.monthlyTrend[tick]?.month ?? ''
}

const maxVendorCount = computed(() => {
  return Math.max(...reportData.value.claimsByVendor.map(v => v.count))
})

const maxBranchCount = computed(() => {
  return Math.max(...reportData.value.claimsByBranch.map(b => b.count))
})

const maxDefectCount = computed(() => {
  return Math.max(...reportData.value.topDefects.map(d => d.count))
})

const vendorColors: Record<string, string> = {
  MOKA: '#B6F500',
  MTC: '#3b82f6',
  SDP: '#f59e0b'
}

const exceptionIcons: Record<string, typeof AlertTriangle> = {
  warning: AlertTriangle,
  critical: ShieldAlert,
  info: Eye
}

const exceptionColors: Record<string, string> = {
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
}
</script>

<template>
  <div class="">
    <div class="mx-auto max-w-[1400px] space-y-8">
      <!-- ═══════════════════════════════════════════ -->
      <!-- Header -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            Reports & <span class="text-[#B6F500]">Analytics</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Executive overview of key KPIs, with quick access to deeper analysis.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <USelect
          v-model="selectedPeriod"
          :items="periodOptions"
          icon="i-lucide-calendar"
          size="sm"
          variant="none"
          class="w-40"
          :ui="dashboardNeonSelectUi"
        />
        <USelect
          v-model="selectedBranch"
          :items="branchOptions"
          icon="i-lucide-building-2"
          size="sm"
          variant="none"
          class="w-40"
          :ui="dashboardNeonSelectUi"
        />
        <USelect
          v-model="selectedVendor"
          :items="vendorOptions"
          icon="i-lucide-package"
          size="sm"
          variant="none"
          class="w-40"
          :ui="dashboardNeonSelectUi"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          size="sm"
          variant="ghost"
          color="neutral"
          :ui="dashboardNeonGhostButtonUi"
        />
        <UButton
          icon="i-lucide-download"
          label="Export"
          size="sm"
          variant="soft"
          color="neutral"
          :ui="dashboardNeonButtonUi"
        />
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- KPI Cards Grid (8 cards) -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:gap-5">
        <div
          v-for="(card, idx) in kpiCards"
          :key="idx"
          :class="[
            'group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 p-5 transition-all duration-300',
            card.bgGlow,
            card.borderGlow
          ]"
        >
          <!-- Ambient glow -->
          <div
            class="absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40"
            :class="card.bgGlow"
          />

          <!-- Icon -->
          <div class="relative z-10 mb-4 flex items-center justify-between">
            <div class="rounded-xl bg-white/5 p-2.5 transition-all group-hover:bg-white/10">
              <component
                :is="card.icon"
                :size="16"
                class="text-white/40"
              />
            </div>
            <div class="flex items-center gap-1">
              <component
                :is="card.trendUp ? ArrowUpRight : ArrowDownRight"
                :size="12"
                :class="[
                  card.label === 'Pending Backlog' || card.label === 'Need Revision' || card.label === 'Vendor Pending'
                    ? (card.trendUp ? 'text-red-400' : 'text-emerald-400')
                    : (card.trendUp ? 'text-emerald-400' : 'text-red-400')
                ]"
              />
              <span
                :class="[
                  'text-[10px] font-black uppercase tracking-widest',
                  card.label === 'Pending Backlog' || card.label === 'Need Revision' || card.label === 'Vendor Pending'
                    ? (card.trendUp ? 'text-red-400' : 'text-emerald-400')
                    : (card.trendUp ? 'text-emerald-400' : 'text-red-400')
                ]"
              >
                {{ card.trend }}
              </span>
            </div>
          </div>

          <!-- Label + Value -->
          <p class="relative z-10 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            {{ card.label }}
          </p>
          <p
            :class="['relative z-10 mt-1 text-2xl font-black italic xl:text-3xl', card.color]"
          >
            {{ typeof card.value === 'number' ? String(card.value).padStart(2, '0') : card.value }}
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Rate Cards Row -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <!-- Approval Rate -->
        <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-[#B6F500]/5 blur-3xl pointer-events-none" />
          <div class="relative z-10">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
              Approval Rate
            </p>
            <div class="flex items-end gap-3">
              <span class="text-5xl font-black italic text-[#B6F500] leading-none">
                {{ reportData.kpi.approvalRate }}%
              </span>
              <div class="flex items-center gap-1 mb-1">
                <ArrowUpRight
                  :size="14"
                  class="text-emerald-400"
                />
                <span class="text-[10px] font-black text-emerald-400">+4.2%</span>
              </div>
            </div>
            <div class="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
              <div
                class="h-full rounded-full bg-[#B6F500] shadow-[0_0_10px_#B6F500] transition-all duration-1000"
                :style="{ width: `${reportData.kpi.approvalRate}%` }"
              />
            </div>
            <div class="mt-3 flex justify-between text-[8px] font-black uppercase tracking-widest text-white/15">
              <span>0%</span>
              <span>Target: 75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Revision Rate -->
        <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
          <div class="relative z-10">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
              Revision Rate
            </p>
            <div class="flex items-end gap-3">
              <span class="text-5xl font-black italic text-amber-400 leading-none">
                {{ reportData.kpi.revisionRate }}%
              </span>
              <div class="flex items-center gap-1 mb-1">
                <ArrowUpRight
                  :size="14"
                  class="text-red-400"
                />
                <span class="text-[10px] font-black text-red-400">+1.8%</span>
              </div>
            </div>
            <div class="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
              <div
                class="h-full rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] transition-all duration-1000"
                :style="{ width: `${reportData.kpi.revisionRate}%` }"
              />
            </div>
            <div class="mt-3 flex justify-between text-[8px] font-black uppercase tracking-widest text-white/15">
              <span>0%</span>
              <span>Target: &lt;10%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Vendor Acceptance Rate -->
        <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div class="relative z-10">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">
              Vendor Acceptance Rate
            </p>
            <div class="flex items-end gap-3">
              <span class="text-5xl font-black italic text-blue-400 leading-none">
                {{ reportData.kpi.vendorAcceptanceRate }}%
              </span>
              <div class="flex items-center gap-1 mb-1">
                <ArrowDownRight
                  :size="14"
                  class="text-red-400"
                />
                <span class="text-[10px] font-black text-red-400">-2.1%</span>
              </div>
            </div>
            <div class="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
              <div
                class="h-full rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.4)] transition-all duration-1000"
                :style="{ width: `${reportData.kpi.vendorAcceptanceRate}%` }"
              />
            </div>
            <div class="mt-3 flex justify-between text-[8px] font-black uppercase tracking-widest text-white/15">
              <span>0%</span>
              <span>Target: 85%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Trend Chart & Exception Highlights -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Trend Chart -->
        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-white/5 p-2">
                <TrendingUp class="h-5 w-5 text-white/60" />
              </div>
              <h3 class="text-lg font-black uppercase tracking-tight">
                Claim Trend
              </h3>
            </div>
            <div class="flex items-center gap-5 text-[9px] font-black uppercase tracking-widest">
              <div class="flex items-center gap-2">
                <div class="h-2.5 w-2.5 rounded-full bg-[#B6F500]" />
                <span class="text-white/30">Claims Received</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span class="text-white/30">Claims Closed</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span class="text-white/30">Backlog</span>
              </div>
            </div>
          </div>

          <ClientOnly>
            <LineChart
              :data="reportData.monthlyTrend"
              :categories="trendCategories"
              :height="340"
              :x-formatter="trendXFormatter"
              x-label="Months"
              y-label="Qty"
              :line-width="3"
              :hide-legend="true"
              :y-grid-line="false"
              :x-grid-line="false"
              :x-domain-line="false"
              :y-domain-line="false"
              :x-tick-line="false"
              :y-tick-line="false"
              :x-num-ticks="6"
              :y-num-ticks="6"
              :x-axis-config="{
                tickTextColor: 'rgba(255,255,255,0.35)',
                tickTextFontSize: '10px'
              }"
              :y-axis-config="{
                tickTextColor: 'rgba(255,255,255,0.35)',
                tickTextFontSize: '10px'
              }"
              :tooltip="{ followCursor: true }"
              class="rounded-3xl border border-white/5 bg-white/2 p-4"
            />
            <template #fallback>
              <div class="h-[340px] animate-pulse rounded-3xl border border-white/5 bg-white/2" />
            </template>
          </ClientOnly>
        </div>

        <!-- Exception Highlights -->
        <div class="lg:col-span-4 space-y-5">
          <div class="flex items-center gap-3 mb-2">
            <div class="rounded-lg bg-red-500/10 p-2">
              <ShieldAlert class="h-5 w-5 text-red-400" />
            </div>
            <h3 class="text-lg font-black uppercase tracking-tight">
              Exceptions
            </h3>
          </div>

          <div
            v-for="(exc, idx) in reportData.exceptions"
            :key="idx"
            :class="[
              'group cursor-pointer rounded-3xl border p-5 transition-all duration-300 hover:scale-[1.01]',
              exceptionColors[exc.severity]
            ]"
          >
            <div class="flex items-start gap-3">
              <component
                :is="exceptionIcons[exc.severity]"
                :size="18"
                class="mt-0.5 shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                  {{ exc.label }}
                </p>
                <p class="mt-1 text-sm font-black italic leading-tight">
                  {{ exc.value }}
                </p>
                <p class="mt-2 text-[10px] font-medium leading-relaxed opacity-60">
                  {{ exc.detail }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Bottom Row: Top 5 Branches + Vendors + Defects -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <!-- Top 5 Branches by Claim Volume -->
        <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
            <div class="rounded-lg bg-white/5 p-2">
              <Building2 class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Top Branches
              </h3>
              <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
                by claim volume
              </p>
            </div>
          </div>
          <div class="space-y-5">
            <div
              v-for="(b, idx) in reportData.claimsByBranch"
              :key="b.branch"
              class="group cursor-pointer"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[9px] font-black text-white/30">
                    {{ String(idx + 1).padStart(2, '0') }}
                  </span>
                  <span class="text-xs font-black uppercase tracking-tight">{{ b.branch }}</span>
                </div>
                <span class="text-sm font-black italic text-white/70">{{ b.count }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                <div
                  class="h-full rounded-full bg-[#B6F500] transition-all duration-700"
                  :style="{
                    width: `${(b.count / maxBranchCount) * 100}%`,
                    opacity: 1 - idx * 0.15
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Top 5 Vendors by Claim Volume -->
        <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
            <div class="rounded-lg bg-white/5 p-2">
              <Package class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Top Vendors
              </h3>
              <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
                by claim volume
              </p>
            </div>
          </div>
          <div class="space-y-6">
            <div
              v-for="v in reportData.claimsByVendor"
              :key="v.vendor"
              class="group cursor-pointer"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-black uppercase tracking-tight">{{ v.vendor }}</span>
                <span
                  class="text-lg font-black italic"
                  :style="{ color: vendorColors[v.vendor] || '#fff' }"
                >
                  {{ v.count }}
                </span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                <div
                  class="h-full rounded-full transition-all duration-700 group-hover:shadow-[0_0_12px]"
                  :style="{
                    width: `${(v.count / maxVendorCount) * 100}%`,
                    backgroundColor: vendorColors[v.vendor] || '#fff',
                    boxShadow: `0 0 8px ${vendorColors[v.vendor]}40`
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Top 5 Defects -->
        <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
            <div class="rounded-lg bg-white/5 p-2">
              <Bug class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Top Defects
              </h3>
              <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
                by frequency
              </p>
            </div>
          </div>
          <div class="space-y-5">
            <div
              v-for="(d, idx) in reportData.topDefects"
              :key="d.defect"
              class="group cursor-pointer"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[9px] font-black text-white/30">
                    {{ String(idx + 1).padStart(2, '0') }}
                  </span>
                  <span class="text-xs font-black uppercase tracking-tight">{{ d.defect }}</span>
                </div>
                <span class="text-sm font-black italic text-white/70">{{ d.count }}</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                <div
                  class="h-full rounded-full bg-[#f59e0b] transition-all duration-700"
                  :style="{
                    width: `${(d.count / maxDefectCount) * 100}%`,
                    opacity: 1 - idx * 0.15
                  }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
