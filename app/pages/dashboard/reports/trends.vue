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
import { dashboardNeonSelectUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface TrendRow extends Record<string, unknown> {
  period: string
  masuk: number
  selesai: number
  antrean: number
  approvalRate: number
}

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const dailyData = ref<TrendRow[]>([
  { period: '18 Mar', masuk: 8, selesai: 6, antrean: 119, approvalRate: 62.5 },
  { period: '19 Mar', masuk: 11, selesai: 9, antrean: 121, approvalRate: 66.7 },
  { period: '20 Mar', masuk: 7, selesai: 10, antrean: 118, approvalRate: 71.4 },
  { period: '21 Mar', masuk: 14, selesai: 8, antrean: 124, approvalRate: 57.1 },
  { period: '22 Mar', masuk: 5, selesai: 7, antrean: 122, approvalRate: 80.0 },
  { period: '24 Mar', masuk: 9, selesai: 11, antrean: 120, approvalRate: 72.7 },
  { period: '25 Mar', masuk: 12, selesai: 8, antrean: 124, approvalRate: 62.5 },
  { period: '26 Mar', masuk: 6, selesai: 9, antrean: 121, approvalRate: 77.8 },
  { period: '27 Mar', masuk: 10, selesai: 7, antrean: 124, approvalRate: 60.0 },
  { period: '28 Mar', masuk: 8, selesai: 10, antrean: 122, approvalRate: 70.0 }
])

const weeklyData = ref<TrendRow[]>([
  { period: 'W40-25', masuk: 42, selesai: 38, antrean: 110, approvalRate: 64.3 },
  { period: 'W41-25', masuk: 55, selesai: 47, antrean: 118, approvalRate: 66.0 },
  { period: 'W42-25', masuk: 38, selesai: 52, antrean: 104, approvalRate: 71.2 },
  { period: 'W43-25', masuk: 61, selesai: 44, antrean: 121, approvalRate: 59.8 },
  { period: 'W44-25', masuk: 48, selesai: 55, antrean: 114, approvalRate: 68.5 },
  { period: 'W45-25', masuk: 52, selesai: 49, antrean: 117, approvalRate: 63.3 },
  { period: 'W46-25', masuk: 44, selesai: 58, antrean: 103, approvalRate: 72.4 },
  { period: 'W47-25', masuk: 67, selesai: 51, antrean: 119, approvalRate: 57.9 }
])

const monthlyData = ref<TrendRow[]>([
  { period: 'Okt-25', masuk: 52, selesai: 48, antrean: 120, approvalRate: 62.3 },
  { period: 'Nov-25', masuk: 68, selesai: 55, antrean: 133, approvalRate: 58.7 },
  { period: 'Des-25', masuk: 45, selesai: 62, antrean: 116, approvalRate: 67.8 },
  { period: 'Jan-26', masuk: 71, selesai: 58, antrean: 129, approvalRate: 61.2 },
  { period: 'Feb-26', masuk: 60, selesai: 65, antrean: 124, approvalRate: 65.4 },
  { period: 'Mar-26', masuk: 46, selesai: 51, antrean: 119, approvalRate: 63.7 }
])

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────

const selectedGranularity = ref('monthly')
const granularityOptions: SelectItem[] = [
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' }
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
  { key: 'masuk', name: 'Klaim Masuk', color: '#B6F500' },
  { key: 'selesai', name: 'Klaim Selesai', color: '#60a5fa' }
]

const backlogSeries = [
  { key: 'antrean', name: 'Antrean Aktif', color: '#f59e0b' }
]

const approvalRateSeries = [
  { key: 'approvalRate', name: 'Approval Rate (%)', color: '#a78bfa' }
]

// ──────────────────────────────────────────────
// Summary KPIs
// ──────────────────────────────────────────────

const summaryKpis = computed(() => {
  const data = activeData.value
  const totalMasuk = data.reduce((s, d) => s + d.masuk, 0)
  const totalSelesai = data.reduce((s, d) => s + d.selesai, 0)
  const avgAntrean = Math.round(data.reduce((s, d) => s + d.antrean, 0) / data.length)
  const avgApproval = (data.reduce((s, d) => s + d.approvalRate, 0) / data.length).toFixed(1)
  const netFlow = totalMasuk - totalSelesai
  return { totalMasuk, totalSelesai, avgAntrean, avgApproval, netFlow }
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
            Analisis tren inflow, closure, dan backlog per periode waktu.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
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
            class="text-white/40"
          />
          <UButton
            icon="i-lucide-download"
            label="Export"
            size="sm"
            variant="soft"
            color="neutral"
          />
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Summary KPI Strip -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Total Masuk
          </p>
          <p class="text-3xl font-black italic text-[#B6F500]">
            {{ String(summaryKpis.totalMasuk).padStart(2, '0') }}
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Total Selesai
          </p>
          <p class="text-3xl font-black italic text-blue-400">
            {{ String(summaryKpis.totalSelesai).padStart(2, '0') }}
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Net Flow
          </p>
          <div class="flex items-center gap-1.5">
            <component
              :is="summaryKpis.netFlow > 0 ? TrendingUp : TrendingDown"
              :size="14"
              :class="summaryKpis.netFlow > 0 ? 'text-red-400' : 'text-emerald-400'"
            />
            <p
              :class="[
                'text-3xl font-black italic',
                summaryKpis.netFlow > 0 ? 'text-red-400' : 'text-emerald-400'
              ]"
            >
              {{ summaryKpis.netFlow > 0 ? '+' : '' }}{{ summaryKpis.netFlow }}
            </p>
          </div>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Avg Antrean
          </p>
          <p class="text-3xl font-black italic text-amber-400">
            {{ summaryKpis.avgAntrean }}
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Avg Approval Rate
          </p>
          <p class="text-3xl font-black italic text-purple-400">
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
              {{ activeData.length }} periode
            </p>
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="px-8 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Periode
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Klaim Masuk
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Klaim Selesai
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Net Flow
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Antrean
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
                  <span class="text-sm font-black italic text-[#B6F500]">{{ row.masuk }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <ArrowDownRight
                    :size="11"
                    class="text-blue-400/60"
                  />
                  <span class="text-sm font-black italic text-blue-400">{{ row.selesai }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <span
                  :class="[
                    'text-sm font-black italic',
                    row.masuk - row.selesai > 0 ? 'text-red-400' : 'text-emerald-400'
                  ]"
                >
                  {{ row.masuk - row.selesai > 0 ? '+' : '' }}{{ row.masuk - row.selesai }}
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-black italic text-amber-400">{{ row.antrean }}</span>
              </td>
              <td class="px-8 py-4 text-right">
                <span
                  :class="[
                    'text-sm font-black italic',
                    row.approvalRate >= 70 ? 'text-emerald-400'
                    : row.approvalRate >= 60 ? 'text-[#B6F500]'
                    : row.approvalRate >= 50 ? 'text-amber-400'
                    : 'text-red-400'
                  ]"
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
