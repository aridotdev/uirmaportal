<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Activity,
  CalendarDays
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { dashboardNeonSelectUi, dashboardNeonButtonUi, dashboardNeonGhostButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface TrendRow extends Record<string, unknown> {
  period: string
  inflow: number
  closure: number
  backlog: number
  approvalRate: number
}

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const dailyData = ref<TrendRow[]>([
  { period: '18 Mar', inflow: 8, closure: 6, backlog: 119, approvalRate: 62.5 },
  { period: '19 Mar', inflow: 11, closure: 9, backlog: 121, approvalRate: 66.7 },
  { period: '20 Mar', inflow: 7, closure: 10, backlog: 118, approvalRate: 71.4 },
  { period: '21 Mar', inflow: 14, closure: 8, backlog: 124, approvalRate: 57.1 },
  { period: '22 Mar', inflow: 5, closure: 7, backlog: 122, approvalRate: 80.0 },
  { period: '24 Mar', inflow: 9, closure: 11, backlog: 120, approvalRate: 72.7 },
  { period: '25 Mar', inflow: 12, closure: 8, backlog: 124, approvalRate: 62.5 },
  { period: '26 Mar', inflow: 6, closure: 9, backlog: 121, approvalRate: 77.8 },
  { period: '27 Mar', inflow: 10, closure: 7, backlog: 124, approvalRate: 60.0 },
  { period: '28 Mar', inflow: 8, closure: 10, backlog: 122, approvalRate: 70.0 }
])

const weeklyData = ref<TrendRow[]>([
  { period: 'W40-25', inflow: 42, closure: 38, backlog: 110, approvalRate: 64.3 },
  { period: 'W41-25', inflow: 55, closure: 47, backlog: 118, approvalRate: 66.0 },
  { period: 'W42-25', inflow: 38, closure: 52, backlog: 104, approvalRate: 71.2 },
  { period: 'W43-25', inflow: 61, closure: 44, backlog: 121, approvalRate: 59.8 },
  { period: 'W44-25', inflow: 48, closure: 55, backlog: 114, approvalRate: 68.5 },
  { period: 'W45-25', inflow: 52, closure: 49, backlog: 117, approvalRate: 63.3 },
  { period: 'W46-25', inflow: 44, closure: 58, backlog: 103, approvalRate: 72.4 },
  { period: 'W47-25', inflow: 67, closure: 51, backlog: 119, approvalRate: 57.9 }
])

const monthlyData = ref<TrendRow[]>([
  { period: 'Oct-25', inflow: 52, closure: 48, backlog: 120, approvalRate: 62.3 },
  { period: 'Nov-25', inflow: 68, closure: 55, backlog: 133, approvalRate: 58.7 },
  { period: 'Dec-25', inflow: 45, closure: 62, backlog: 116, approvalRate: 67.8 },
  { period: 'Jan-26', inflow: 71, closure: 58, backlog: 129, approvalRate: 61.2 },
  { period: 'Feb-26', inflow: 60, closure: 65, backlog: 124, approvalRate: 65.4 },
  { period: 'Mar-26', inflow: 46, closure: 51, backlog: 119, approvalRate: 63.7 }
])

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

const selectedGranularity = ref('monthly')
const granularityOptions: SelectItem[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
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
// Computed active dataset
// ──────────────────────────────────────────────

const activeData = computed<TrendRow[]>(() => {
  if (selectedGranularity.value === 'daily') return dailyData.value
  if (selectedGranularity.value === 'weekly') return weeklyData.value
  return monthlyData.value
})

// ──────────────────────────────────────────────
// Chart series
// ──────────────────────────────────────────────

const inflowClosureSeries = [
  { key: 'inflow', name: 'Claims Received', color: '#B6F500' },
  { key: 'closure', name: 'Claims Closed', color: '#60a5fa' }
]

const backlogSeries = [
  { key: 'backlog', name: 'Active Backlog', color: '#f59e0b' }
]

const approvalRateSeries = [
  { key: 'approvalRate', name: 'Approval Rate (%)', color: '#a78bfa' }
]

// ──────────────────────────────────────────────
// Summary KPIs
// ──────────────────────────────────────────────

const summaryKpis = computed(() => {
  const data = activeData.value
  const totalInflow = data.reduce((s, d) => s + d.inflow, 0)
  const totalClosure = data.reduce((s, d) => s + d.closure, 0)
  const avgBacklog = Math.round(data.reduce((s, d) => s + d.backlog, 0) / data.length)
  const avgApproval = (data.reduce((s, d) => s + d.approvalRate, 0) / data.length).toFixed(1)
  const netFlow = totalInflow - totalClosure
  return { totalInflow, totalClosure, avgBacklog, avgApproval, netFlow }
})

// ──────────────────────────────────────────────
// Active chart toggle
// ──────────────────────────────────────────────

const activeChart = ref<'inflow' | 'backlog' | 'approval'>('inflow')
const chartTabs = [
  { key: 'inflow', label: 'Inflow vs Closure' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'approval', label: 'Approval Rate' }
] as const

const activeChartSeries = computed(() => {
  if (activeChart.value === 'backlog') return backlogSeries
  if (activeChart.value === 'approval') return approvalRateSeries
  return inflowClosureSeries
})

const approvalRateColor = (rate: number): string => {
  if (rate >= 70) return 'text-emerald-400'
  if (rate >= 60) return 'text-[#B6F500]'
  if (rate >= 50) return 'text-amber-400'
  return 'text-red-400'
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
            Period <span class="text-[#B6F500]">Trends</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Track claim inflow, closures, and backlog over time.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <USelect
          v-model="selectedGranularity"
          :items="granularityOptions"
          icon="i-lucide-calendar-days"
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
          v-model="selectedVendor"
          :items="vendorOptions"
          icon="i-lucide-package"
          size="sm"
          variant="none"
          class="w-36"
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
      <!-- Summary KPI Strip -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-5 xl:gap-5">
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Received
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ String(summaryKpis.totalInflow).padStart(2, '0') }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Closed
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ String(summaryKpis.totalClosure).padStart(2, '0') }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Net Flow
          </p>
          <div class="relative z-10 flex items-center gap-1.5">
            <component
              :is="summaryKpis.netFlow > 0 ? TrendingUp : TrendingDown"
              :size="14"
              :class="summaryKpis.netFlow > 0 ? 'text-red-400' : 'text-emerald-400'"
            />
            <p class="text-3xl font-black italic text-white">
              {{ summaryKpis.netFlow > 0 ? '+' : '' }}{{ summaryKpis.netFlow }}
            </p>
          </div>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Avg Backlog
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ summaryKpis.avgBacklog }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Avg Approval Rate
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ summaryKpis.avgApproval }}%
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Multi-chart Toggle Area -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
        <!-- Chart Tabs -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div class="rounded-lg bg-white/5 p-2">
              <Activity class="h-5 w-5 text-white/60" />
            </div>
            <h3 class="text-lg font-black uppercase tracking-tight">
              Trend Analysis
            </h3>
          </div>
          <div class="flex items-center gap-1 rounded-2xl border border-white/5 bg-white/3 p-1">
            <button
              v-for="tab in chartTabs"
              :key="tab.key"
              :class="[
                'rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all duration-200',
                activeChart === tab.key
                  ? 'bg-[#B6F500] text-black'
                  : 'text-white/30 hover:text-white/60'
              ]"
              @click="activeChart = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <ReportsAnalyticsChart
          :data="activeData"
          :series="activeChartSeries"
          x-key="period"
          :height="320"
          :show-legend="true"
        />
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Data Table -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
        <div class="flex items-center gap-3 border-b border-white/5 p-8 pb-6">
          <div class="rounded-lg bg-white/5 p-2">
            <CalendarDays class="h-5 w-5 text-white/60" />
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-tight">
              Data Detail
            </h3>
            <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
              {{ activeData.length }} periods
            </p>
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="px-8 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Period
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Claims Received
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Claims Closed
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Net Flow
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Backlog
              </th>
              <th class="px-8 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Approval Rate
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in activeData"
              :key="idx"
              class="group border-b border-white/5 last:border-0 transition-colors hover:bg-white/2"
            >
              <td class="px-8 py-4">
                <span class="text-sm font-black uppercase tracking-tight text-white/70">
                  {{ row.period }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <ArrowUpRight
                    :size="11"
                    class="text-[#B6F500]/60"
                  />
                  <span class="text-sm font-black italic text-[#B6F500]">{{ row.inflow }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <ArrowDownRight
                    :size="11"
                    class="text-blue-400/60"
                  />
                  <span class="text-sm font-black italic text-blue-400">{{ row.closure }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <span
                  :class="[
                    'text-sm font-black italic',
                    row.inflow - row.closure > 0 ? 'text-red-400' : 'text-emerald-400'
                  ]"
                >
                  {{ row.inflow - row.closure > 0 ? '+' : '' }}{{ (Number(row.inflow) || 0) - (Number(row.closure) || 0) }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-black italic text-amber-400">{{ row.backlog }}</span>
              </td>
              <td class="px-8 py-4 text-right">
                <span
                  :class="['text-sm font-black italic', approvalRateColor(row.approvalRate)]"
                >
                  {{ row.approvalRate }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
