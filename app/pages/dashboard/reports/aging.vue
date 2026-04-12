<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { resolvePeriodFilter, type PeriodFilterMode } from '~~/shared/utils/fiscal'
import { dashboardNeonFilterSelectUi, dashboardNeonFilterButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard', middleware: 'auth'
})

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AgingBucket {
  label: string
  range: string
  count: number
  percentage: number
  severity: 'safe' | 'warning' | 'critical' | 'overdue'
  color: string
}

interface AgingClaim {
  claimId: string
  branch: string
  vendor: string
  status: string
  daysOpen: number
  createdAt: string
  bucket: string
}

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const agingBuckets = ref<AgingBucket[]>([
  {
    label: 'On Track',
    range: '0-2 days',
    count: 34,
    percentage: 24.5,
    severity: 'safe',
    color: '#B6F500'
  },
  {
    label: 'Review',
    range: '3-7 days',
    count: 52,
    percentage: 37.4,
    severity: 'warning',
    color: '#60a5fa'
  },
  {
    label: 'Attention',
    range: '8-14 days',
    count: 41,
    percentage: 29.5,
    severity: 'critical',
    color: '#f59e0b'
  },
  {
    label: 'SLA Breach',
    range: '> 14 days',
    count: 12,
    percentage: 8.6,
    severity: 'overdue',
    color: '#f87171'
  }
])

const agingClaims = ref<AgingClaim[]>([
  { claimId: 'CLM-2026-0312', branch: 'Medan', vendor: 'SDP', status: 'IN_REVIEW', daysOpen: 21, createdAt: '7 Mar 2026', bucket: '> 14 days' },
  { claimId: 'CLM-2026-0287', branch: 'Bandung', vendor: 'MOKA', status: 'NEED_REVISION', daysOpen: 18, createdAt: '10 Mar 2026', bucket: '> 14 days' },
  { claimId: 'CLM-2026-0301', branch: 'Surabaya', vendor: 'MTC', status: 'IN_REVIEW', daysOpen: 16, createdAt: '12 Mar 2026', bucket: '> 14 days' },
  { claimId: 'CLM-2026-0334', branch: 'Makassar', vendor: 'SDP', status: 'IN_REVIEW', daysOpen: 15, createdAt: '13 Mar 2026', bucket: '> 14 days' },
  { claimId: 'CLM-2026-0298', branch: 'Medan', vendor: 'MOKA', status: 'NEED_REVISION', daysOpen: 14, createdAt: '14 Mar 2026', bucket: '8-14 days' },
  { claimId: 'CLM-2026-0355', branch: 'Jakarta', vendor: 'MTC', status: 'IN_REVIEW', daysOpen: 12, createdAt: '16 Mar 2026', bucket: '8-14 days' },
  { claimId: 'CLM-2026-0371', branch: 'Surabaya', vendor: 'MOKA', status: 'NEED_REVISION', daysOpen: 11, createdAt: '17 Mar 2026', bucket: '8-14 days' },
  { claimId: 'CLM-2026-0389', branch: 'Bandung', vendor: 'SDP', status: 'IN_REVIEW', daysOpen: 9, createdAt: '19 Mar 2026', bucket: '8-14 days' },
  { claimId: 'CLM-2026-0401', branch: 'Jakarta', vendor: 'MOKA', status: 'IN_REVIEW', daysOpen: 6, createdAt: '22 Mar 2026', bucket: '3-7 days' },
  { claimId: 'CLM-2026-0415', branch: 'Makassar', vendor: 'MTC', status: 'SUBMITTED', daysOpen: 5, createdAt: '23 Mar 2026', bucket: '3-7 days' }
])

const agingTrendData = ref([
  { period: 'Oct-25', safe: 45, review: 38, attention: 29, overdue: 8 },
  { period: 'Nov-25', safe: 52, review: 44, attention: 31, overdue: 10 },
  { period: 'Dec-25', safe: 38, review: 35, attention: 26, overdue: 7 },
  { period: 'Jan-26', safe: 58, review: 47, attention: 36, overdue: 11 },
  { period: 'Feb-26', safe: 50, review: 42, attention: 33, overdue: 9 },
  { period: 'Mar-26', safe: 34, review: 52, attention: 41, overdue: 12 }
])

const branchFactors: Record<string, number> = {
  all: 1,
  jakarta: 1.12,
  surabaya: 1,
  bandung: 0.94,
  medan: 0.9,
  makassar: 0.84
}

const parseReadableDate = (value: string): Date => {
  const [day, monthLabel, year] = value.split(' ')
  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  }
  return new Date(Number(year ?? '0'), monthMap[monthLabel ?? ''] ?? 0, Number(day ?? '1'))
}

const parsePeriodMonth = (value: string): Date => {
  const [monthLabel, yearLabel] = value.split('-')
  const monthMap: Record<string, number> = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11
  }
  return new Date(2000 + Number(yearLabel ?? '0'), monthMap[monthLabel ?? ''] ?? 0, 1)
}

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

const selectedPeriod = ref('this_fiscal_half')
const periodOptions: SelectItem[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Fiscal Half', value: 'this_fiscal_half' },
  { label: 'Last Fiscal Half', value: 'last_fiscal_half' },
  { label: 'This Fiscal Year', value: 'this_fiscal_year' },
  { label: 'Last Fiscal Year', value: 'last_fiscal_year' },
  { label: 'This Calendar Year', value: 'this_calendar_year' }
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

const selectedBucket = ref('all')
const bucketOptions: SelectItem[] = [
  { label: 'All Buckets', value: 'all' },
  { label: '0-2 days', value: '0-2' },
  { label: '3-7 days', value: '3-7' },
  { label: '8-14 days', value: '8-14' },
  { label: '> 14 days', value: 'over14' }
]

// ──────────────────────────────────────────────
// Chart series
// ──────────────────────────────────────────────

const agingChartSeries = [
  { key: 'safe', name: '0-2 days', color: '#B6F500' },
  { key: 'review', name: '3-7 days', color: '#60a5fa' },
  { key: 'attention', name: '8-14 days', color: '#f59e0b' },
  { key: 'overdue', name: '> 14 days', color: '#f87171' }
]

const filteredAgingClaimsByPeriodBranch = computed(() => {
  let result = [...agingClaims.value]

  if (selectedPeriod.value && selectedPeriod.value !== 'all') {
    const range = resolvePeriodFilter(selectedPeriod.value as PeriodFilterMode)
    result = result.filter((claim) => {
      const d = parseReadableDate(claim.createdAt)
      return d >= range.startDate && d <= range.endDate
    })
  }

  if (selectedBranch.value !== 'all') {
    result = result.filter(claim => claim.branch.toLowerCase() === selectedBranch.value)
  }

  return result
})

const filteredAgingTrendData = computed(() => {
  let result = [...agingTrendData.value]
  if (selectedPeriod.value && selectedPeriod.value !== 'all') {
    const range = resolvePeriodFilter(selectedPeriod.value as PeriodFilterMode)
    result = result.filter((row) => {
      const d = parsePeriodMonth(row.period)
      return d >= range.startDate && d <= range.endDate
    })
  }

  const factor = branchFactors[selectedBranch.value] ?? 1
  return result.map(row => ({
    ...row,
    safe: Math.max(0, Math.round(row.safe * factor)),
    review: Math.max(0, Math.round(row.review * factor)),
    attention: Math.max(0, Math.round(row.attention * factor)),
    overdue: Math.max(0, Math.round(row.overdue * factor))
  }))
})

const filteredBuckets = computed(() => {
  const totals = filteredAgingClaimsByPeriodBranch.value.reduce<Record<string, number>>((acc, claim) => {
    acc[claim.bucket] = (acc[claim.bucket] ?? 0) + 1
    return acc
  }, {})
  const total = filteredAgingClaimsByPeriodBranch.value.length

  return agingBuckets.value.map((bucket) => {
    const count = totals[bucket.range] ?? 0
    const percentage = total ? Number(((count / total) * 100).toFixed(1)) : 0
    return {
      ...bucket,
      count,
      percentage
    }
  })
})

// ──────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────

const totalBacklog = computed(() =>
  filteredBuckets.value.reduce((s, b) => s + b.count, 0)
)

const slaBreachCount = computed(() =>
  filteredBuckets.value.find(b => b.severity === 'overdue')?.count ?? 0
)

const slaBreachRate = computed(() =>
  totalBacklog.value ? ((slaBreachCount.value / totalBacklog.value) * 100).toFixed(1) : '0.0'
)

const avgAgingDays = computed(() => {
  const midpoints = [1, 5, 11, 21]
  const total = filteredBuckets.value.reduce((s, b, i) => s + b.count * (midpoints[i] ?? 0), 0)
  if (!totalBacklog.value) return '0.0'
  return (total / totalBacklog.value).toFixed(1)
})

const filteredClaims = computed(() => {
  if (selectedBucket.value === 'all') return filteredAgingClaimsByPeriodBranch.value
  const bucketMap: Record<string, string> = {
    '0-2': '0-2 days',
    '3-7': '3-7 days',
    '8-14': '8-14 days',
    'over14': '> 14 days'
  }
  return filteredAgingClaimsByPeriodBranch.value.filter(c => c.bucket === bucketMap[selectedBucket.value])
})

function exportCsv() {
  if (!filteredClaims.value.length) return
  const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
  const headers = ['Claim ID', 'Branch', 'Vendor', 'Status', 'Created At', 'Age (Days)', 'Bucket']
  const rows = filteredClaims.value.map(claim => [
    claim.claimId,
    claim.branch,
    claim.vendor,
    claim.status,
    claim.createdAt,
    claim.daysOpen,
    claim.bucket
  ])
  const csv = [headers.map(escapeCsv).join(','), ...rows.map(row => row.map(escapeCsv).join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `aging-report-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const severityColors: Record<string, string> = {
  safe: 'text-[#B6F500] bg-[#B6F500]/10 border-[#B6F500]/20',
  warning: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  critical: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  overdue: 'text-red-400 bg-red-500/10 border-red-500/20'
}

const statusColors: Record<string, string> = {
  SUBMITTED: 'text-blue-400 bg-blue-500/10',
  IN_REVIEW: 'text-cyan-400 bg-cyan-500/10',
  NEED_REVISION: 'text-amber-400 bg-amber-500/10',
  APPROVED: 'text-emerald-400 bg-emerald-500/10'
}

const bucketBadgeColor = (bucket: string): string => {
  if (bucket === '> 14 days') return 'text-red-400 bg-red-500/10'
  if (bucket === '8-14 days') return 'text-amber-400 bg-amber-500/10'
  if (bucket === '3-7 days') return 'text-blue-400 bg-blue-500/10'
  return 'text-[#B6F500] bg-[#B6F500]/10'
}

const daysColor = (days: number): string => {
  if (days > 14) return 'text-red-400'
  if (days > 7) return 'text-amber-400'
  if (days > 2) return 'text-blue-400'
  return 'text-[#B6F500]'
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
            Aging & <span class="text-[#B6F500]">Backlog</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            See how active claims are distributed by age so teams can spot backlog risk early.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <USelect
          v-model="selectedBucket"
          :items="bucketOptions"
          icon="i-lucide-layers"
          size="sm"
          variant="none"
          class="w-36"
          :ui="dashboardNeonFilterSelectUi"
        />
        <USelect
          v-model="selectedBranch"
          :items="branchOptions"
          icon="i-lucide-building-2"
          size="sm"
          variant="none"
          class="w-40"
          :ui="dashboardNeonFilterSelectUi"
        />
        <USelect
          v-model="selectedPeriod"
          :items="periodOptions"
          icon="i-lucide-calendar"
          size="sm"
          variant="none"
          class="w-40"
          :ui="dashboardNeonFilterSelectUi"
        />
        <UButton
          icon="i-lucide-download"
          label="Export"
          size="sm"
          variant="soft"
          color="neutral"
          :disabled="filteredClaims.length === 0"
          :ui="dashboardNeonFilterButtonUi"
          @click="exportCsv"
        />
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Summary KPI Strip -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:gap-5">
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Backlog
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ String(totalBacklog).padStart(2, '0') }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <div class="relative z-10 mb-3 flex items-center gap-1.5">
            <AlertTriangle
              :size="10"
              class="text-red-400"
            />
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
              SLA Breach
            </p>
          </div>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ slaBreachCount }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            SLA Breach Rate
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ slaBreachRate }}%
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Avg Aging
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ avgAgingDays }}d
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Bucket Visualization + Chart -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Bucket Bars -->
        <div class="lg:col-span-4 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
            <div class="rounded-lg bg-white/5 p-2">
              <Clock class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Aging Buckets
              </h3>
              <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
                current distribution
              </p>
            </div>
          </div>

          <div class="space-y-6">
            <div
              v-for="bucket in filteredBuckets"
              :key="bucket.label"
              class="group cursor-pointer"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div
                    class="h-2.5 w-2.5 rounded-full"
                    :style="{ backgroundColor: bucket.color }"
                  />
                  <div>
                    <span class="text-xs font-black uppercase tracking-tight">{{ bucket.label }}</span>
                    <span class="ml-2 text-[9px] font-bold text-white/30">{{ bucket.range }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'text-[9px] font-black px-2 py-0.5 rounded-full border',
                      severityColors[bucket.severity]
                    ]"
                  >
                    {{ bucket.percentage }}%
                  </span>
                  <span class="text-sm font-black italic text-white/60">{{ bucket.count }}</span>
                </div>
              </div>
              <div class="h-3 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{
                    width: `${bucket.percentage}%`,
                    backgroundColor: bucket.color,
                    boxShadow: `0 0 8px ${bucket.color}40`
                  }"
                />
              </div>
            </div>
          </div>

          <!-- SLA Warning Box -->
          <div class="mt-8 rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
            <div class="flex items-start gap-3">
              <AlertTriangle
                :size="16"
                class="text-red-400 mt-0.5 shrink-0"
              />
              <div>
                <p class="text-[9px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-1">
                  SLA Alert
                </p>
                <p class="text-sm font-black italic text-red-400 leading-tight">
                  {{ slaBreachCount }} claims are over 14 days old
                </p>
                <p class="mt-1.5 text-[10px] font-medium text-red-400/50 leading-relaxed">
                  These claims are past the SLA and need immediate follow-up.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Aging Trend Chart -->
        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <ReportsAnalyticsChart
            title="Aging Distribution Trend (Last 6 Months)"
            :data="filteredAgingTrendData"
            :series="agingChartSeries"
            x-key="period"
            x-label="Period"
            y-label="Claim Count"
            :height="340"
            :show-legend="true"
          />
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Aging Claims Detail Table -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
        <div class="flex items-center justify-between border-b border-white/5 p-8 pb-6">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-amber-500/10 p-2">
              <Clock class="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Aging Claim Details
              </h3>
              <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
                {{ filteredClaims.length }} claims found
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <ArrowUpRight
              :size="12"
              class="text-white/20"
            />
            <span class="text-[9px] font-black uppercase tracking-widest text-white/20">
              Sorted by oldest first
            </span>
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="px-8 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Claim ID
              </th>
              <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Branch
              </th>
              <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Vendor
              </th>
              <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Status
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Created
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Age
              </th>
              <th class="px-8 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Bucket
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="claim in filteredClaims"
              :key="claim.claimId"
              class="group border-b border-white/5 last:border-0 transition-colors hover:bg-white/2"
            >
              <td class="px-8 py-4">
                <span class="font-mono text-[11px] font-black text-white/60">
                  {{ claim.claimId }}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-black uppercase tracking-tight">{{ claim.branch }}</span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-bold text-white/50">{{ claim.vendor }}</span>
              </td>
              <td class="px-4 py-4">
                <span
                  :class="[
                    'rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider',
                    statusColors[claim.status] ?? 'text-white/40 bg-white/5'
                  ]"
                >
                  {{ claim.status.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-xs font-bold text-white/35">{{ claim.createdAt }}</span>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <component
                    :is="claim.daysOpen > 7 ? ArrowUpRight : ArrowDownRight"
                    :size="11"
                    :class="daysColor(claim.daysOpen)"
                  />
                  <span
                    :class="['text-sm font-black italic', daysColor(claim.daysOpen)]"
                  >
                    {{ claim.daysOpen }}d
                  </span>
                </div>
              </td>
              <td class="px-8 py-4 text-right">
                <span
                  :class="[
                    'rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider',
                    bucketBadgeColor(claim.bucket)
                  ]"
                >
                  {{ claim.bucket }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
