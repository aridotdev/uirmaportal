<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { dashboardNeonSelectUi, dashboardNeonButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard'
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
    range: '0–2 hari',
    count: 34,
    percentage: 24.5,
    severity: 'safe',
    color: '#B6F500'
  },
  {
    label: 'Review',
    range: '3–7 hari',
    count: 52,
    percentage: 37.4,
    severity: 'warning',
    color: '#60a5fa'
  },
  {
    label: 'Attention',
    range: '8–14 hari',
    count: 41,
    percentage: 29.5,
    severity: 'critical',
    color: '#f59e0b'
  },
  {
    label: 'SLA Breach',
    range: '> 14 hari',
    count: 12,
    percentage: 8.6,
    severity: 'overdue',
    color: '#f87171'
  }
])

const agingClaims = ref<AgingClaim[]>([
  { claimId: 'CLM-2026-0312', branch: 'Medan', vendor: 'SDP', status: 'IN_REVIEW', daysOpen: 21, createdAt: '7 Mar 2026', bucket: '> 14 hari' },
  { claimId: 'CLM-2026-0287', branch: 'Bandung', vendor: 'MOKA', status: 'NEED_REVISION', daysOpen: 18, createdAt: '10 Mar 2026', bucket: '> 14 hari' },
  { claimId: 'CLM-2026-0301', branch: 'Surabaya', vendor: 'MTC', status: 'IN_REVIEW', daysOpen: 16, createdAt: '12 Mar 2026', bucket: '> 14 hari' },
  { claimId: 'CLM-2026-0334', branch: 'Makassar', vendor: 'SDP', status: 'IN_REVIEW', daysOpen: 15, createdAt: '13 Mar 2026', bucket: '> 14 hari' },
  { claimId: 'CLM-2026-0298', branch: 'Medan', vendor: 'MOKA', status: 'NEED_REVISION', daysOpen: 14, createdAt: '14 Mar 2026', bucket: '8–14 hari' },
  { claimId: 'CLM-2026-0355', branch: 'Jakarta', vendor: 'MTC', status: 'IN_REVIEW', daysOpen: 12, createdAt: '16 Mar 2026', bucket: '8–14 hari' },
  { claimId: 'CLM-2026-0371', branch: 'Surabaya', vendor: 'MOKA', status: 'NEED_REVISION', daysOpen: 11, createdAt: '17 Mar 2026', bucket: '8–14 hari' },
  { claimId: 'CLM-2026-0389', branch: 'Bandung', vendor: 'SDP', status: 'IN_REVIEW', daysOpen: 9, createdAt: '19 Mar 2026', bucket: '8–14 hari' },
  { claimId: 'CLM-2026-0401', branch: 'Jakarta', vendor: 'MOKA', status: 'IN_REVIEW', daysOpen: 6, createdAt: '22 Mar 2026', bucket: '3–7 hari' },
  { claimId: 'CLM-2026-0415', branch: 'Makassar', vendor: 'MTC', status: 'SUBMITTED', daysOpen: 5, createdAt: '23 Mar 2026', bucket: '3–7 hari' }
])

const agingTrendData = ref([
  { period: 'Okt-25', safe: 45, review: 38, attention: 29, overdue: 8 },
  { period: 'Nov-25', safe: 52, review: 44, attention: 31, overdue: 10 },
  { period: 'Des-25', safe: 38, review: 35, attention: 26, overdue: 7 },
  { period: 'Jan-26', safe: 58, review: 47, attention: 36, overdue: 11 },
  { period: 'Feb-26', safe: 50, review: 42, attention: 33, overdue: 9 },
  { period: 'Mar-26', safe: 34, review: 52, attention: 41, overdue: 12 }
])

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

const selectedBucket = ref('all')
const bucketOptions: SelectItem[] = [
  { label: 'All Buckets', value: 'all' },
  { label: '0–2 hari', value: '0-2' },
  { label: '3–7 hari', value: '3-7' },
  { label: '8–14 hari', value: '8-14' },
  { label: '> 14 hari', value: 'over14' }
]

// ──────────────────────────────────────────────
// Chart series
// ──────────────────────────────────────────────

const agingChartSeries = [
  { key: 'safe', name: '0–2 hari', color: '#B6F500' },
  { key: 'review', name: '3–7 hari', color: '#60a5fa' },
  { key: 'attention', name: '8–14 hari', color: '#f59e0b' },
  { key: 'overdue', name: '> 14 hari', color: '#f87171' }
]

// ──────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────

const totalBacklog = computed(() =>
  agingBuckets.value.reduce((s, b) => s + b.count, 0)
)

const slaBreachCount = computed(() =>
  agingBuckets.value.find(b => b.severity === 'overdue')?.count ?? 0
)

const slaBreachRate = computed(() =>
  ((slaBreachCount.value / totalBacklog.value) * 100).toFixed(1)
)

const avgAgingDays = computed(() => {
  const midpoints = [1, 5, 11, 21]
  const total = agingBuckets.value.reduce((s, b, i) => s + b.count * (midpoints[i] ?? 0), 0)
  return (total / totalBacklog.value).toFixed(1)
})

const filteredClaims = computed(() => {
  if (selectedBucket.value === 'all') return agingClaims.value
  const bucketMap: Record<string, string> = {
    '0-2': '0–2 hari',
    '3-7': '3–7 hari',
    '8-14': '8–14 hari',
    'over14': '> 14 hari'
  }
  return agingClaims.value.filter(c => c.bucket === bucketMap[selectedBucket.value])
})

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
  if (bucket === '> 14 hari') return 'text-red-400 bg-red-500/10'
  if (bucket === '8–14 hari') return 'text-amber-400 bg-amber-500/10'
  if (bucket === '3–7 hari') return 'text-blue-400 bg-blue-500/10'
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
            Distribusi umur klaim aktif dan penumpukan beban kerja berdasarkan durasi.
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
          v-model="selectedPeriod"
          :items="periodOptions"
          icon="i-lucide-calendar"
          size="sm"
          variant="none"
          class="w-40"
          :ui="dashboardNeonSelectUi"
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
      <!-- Summary KPI Strip -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Total Backlog
          </p>
          <p class="text-3xl font-black italic text-white">
            {{ String(totalBacklog).padStart(2, '0') }}
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <div class="flex items-center gap-1.5 mb-3">
            <AlertTriangle
              :size="10"
              class="text-red-400"
            />
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
              SLA Breach
            </p>
          </div>
          <p class="text-3xl font-black italic text-red-400">
            {{ slaBreachCount }}
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            SLA Breach Rate
          </p>
          <p class="text-3xl font-black italic text-amber-400">
            {{ slaBreachRate }}%
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Avg Aging
          </p>
          <p class="text-3xl font-black italic text-purple-400">
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
                distribusi saat ini
              </p>
            </div>
          </div>

          <div class="space-y-6">
            <div
              v-for="bucket in agingBuckets"
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
                  SLA Warning
                </p>
                <p class="text-sm font-black italic text-red-400 leading-tight">
                  {{ slaBreachCount }} klaim > 14 hari
                </p>
                <p class="mt-1.5 text-[10px] font-medium text-red-400/50 leading-relaxed">
                  Klaim ini telah melewati batas SLA. Segera tindak lanjuti.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Aging Trend Chart -->
        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <ReportsAnalyticsChart
            title="Aging Distribution Trend (6 Bulan)"
            :data="agingTrendData"
            :series="agingChartSeries"
            x-key="period"
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
                Klaim Berumur Lama
              </h3>
              <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
                {{ filteredClaims.length }} klaim ditemukan
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <ArrowUpRight
              :size="12"
              class="text-white/20"
            />
            <span class="text-[9px] font-black uppercase tracking-widest text-white/20">
              Diurutkan: Paling lama
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
                Dibuat
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Umur
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
