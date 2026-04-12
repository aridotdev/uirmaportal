<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  Building2
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { dashboardNeonFilterSelectUi, dashboardNeonFilterButtonUi, dashboardNeonFilterInputUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard', middleware: 'auth'
})

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface BranchRow {
  rank: number
  branch: string
  totalClaims: number
  approvedClaims: number
  needRevision: number
  rejected: number
  approvalRate: number
  revisionRate: number
  avgLeadTimeDays: number
  trend: 'up' | 'down' | 'flat'
  trendDelta: string
}

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const branches = ref<BranchRow[]>([
  {
    rank: 1,
    branch: 'Jakarta',
    totalClaims: 98,
    approvedClaims: 71,
    needRevision: 8,
    rejected: 5,
    approvalRate: 72.4,
    revisionRate: 8.2,
    avgLeadTimeDays: 1.9,
    trend: 'up',
    trendDelta: '+6.1%'
  },
  {
    rank: 2,
    branch: 'Surabaya',
    totalClaims: 76,
    approvedClaims: 50,
    needRevision: 11,
    rejected: 6,
    approvalRate: 65.8,
    revisionRate: 14.5,
    avgLeadTimeDays: 2.3,
    trend: 'up',
    trendDelta: '+2.4%'
  },
  {
    rank: 3,
    branch: 'Bandung',
    totalClaims: 63,
    approvedClaims: 38,
    needRevision: 11,
    rejected: 4,
    approvalRate: 60.3,
    revisionRate: 17.5,
    avgLeadTimeDays: 2.7,
    trend: 'down',
    trendDelta: '-1.2%'
  },
  {
    rank: 4,
    branch: 'Medan',
    totalClaims: 57,
    approvedClaims: 32,
    needRevision: 11,
    rejected: 7,
    approvalRate: 56.1,
    revisionRate: 19.3,
    avgLeadTimeDays: 3.1,
    trend: 'down',
    trendDelta: '-3.5%'
  },
  {
    rank: 5,
    branch: 'Makassar',
    totalClaims: 48,
    approvedClaims: 30,
    needRevision: 6,
    rejected: 3,
    approvalRate: 62.5,
    revisionRate: 12.5,
    avgLeadTimeDays: 2.5,
    trend: 'flat',
    trendDelta: '+0.3%'
  }
])

const trendData = ref([
  { month: 'Oct-25', Jakarta: 18, Surabaya: 14, Bandung: 12, Medan: 9, Makassar: 8 },
  { month: 'Nov-25', Jakarta: 22, Surabaya: 18, Bandung: 14, Medan: 12, Makassar: 10 },
  { month: 'Dec-25', Jakarta: 16, Surabaya: 12, Bandung: 10, Medan: 8, Makassar: 7 },
  { month: 'Jan-26', Jakarta: 24, Surabaya: 20, Bandung: 16, Medan: 14, Makassar: 11 },
  { month: 'Feb-26', Jakarta: 20, Surabaya: 16, Bandung: 14, Medan: 11, Makassar: 9 },
  { month: 'Mar-26', Jakarta: 18, Surabaya: 14, Bandung: 11, Medan: 10, Makassar: 8 }
])

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

const search = ref('')

const filteredBranches = computed(() => {
  if (!search.value) return branches.value
  const q = search.value.toLowerCase()
  return branches.value.filter(b => b.branch.toLowerCase().includes(q))
})

// ──────────────────────────────────────────────
// Chart series
// ──────────────────────────────────────────────

const chartSeries = [
  { key: 'Jakarta', name: 'Jakarta', color: '#B6F500' },
  { key: 'Surabaya', name: 'Surabaya', color: '#60a5fa' },
  { key: 'Bandung', name: 'Bandung', color: '#f59e0b' },
  { key: 'Medan', name: 'Medan', color: '#f87171' },
  { key: 'Makassar', name: 'Makassar', color: '#a78bfa' }
]

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const rankingItems = computed(() =>
  filteredBranches.value.map(b => ({
    name: b.branch,
    count: b.totalClaims,
    approvalRate: b.approvalRate
  }))
)

const approvalRateColor = (rate: number) => {
  if (rate >= 70) return 'text-emerald-400'
  if (rate >= 60) return 'text-[#B6F500]'
  if (rate >= 50) return 'text-amber-400'
  return 'text-red-400'
}

const revisionRateColor = (rate: number) => {
  if (rate <= 10) return 'text-emerald-400'
  if (rate <= 15) return 'text-amber-400'
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
        <div class="flex items-start gap-4">
          <div>
            <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
              Branch <span class="text-[#B6F500]">Performance</span>
            </h1>
            <p class="mt-2 text-sm font-medium text-white/40">
              Compare branch performance by claim volume, approval rate, and review speed.
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <UInput
          v-model="search"
          placeholder="Search branches..."
          icon="i-lucide-bar-chart-3"
          size="sm"
          variant="none"
          :ui="dashboardNeonFilterInputUi"
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
          :ui="dashboardNeonFilterButtonUi"
        />
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Summary KPI Strip -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:gap-5">
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Branches
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ String(branches.length).padStart(2, '0') }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Avg Approval Rate
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ (branches.reduce((s, b) => s + b.approvalRate, 0) / branches.length).toFixed(1) }}%
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Avg Revision Rate
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ (branches.reduce((s, b) => s + b.revisionRate, 0) / branches.length).toFixed(1) }}%
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Avg Lead Time
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ (branches.reduce((s, b) => s + b.avgLeadTimeDays, 0) / branches.length).toFixed(1) }}d
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Chart + Ranking side-by-side -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <!-- Trend Chart -->
        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <ReportsAnalyticsChart
            title="Claim Volume by Branch (Last 6 Months)"
            :data="trendData"
            :series="chartSeries"
            x-key="month"
            x-label="Month"
            y-label="Claim Volume"
            :height="300"
            :show-legend="true"
          />
        </div>

        <!-- Ranking -->
        <div class="lg:col-span-4">
          <ReportsRankingList
            title="Top Branches"
            subtitle="by claim volume"
            type="branch"
            :items="rankingItems"
          />
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Detail Table -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
        <div class="flex items-center gap-3 border-b border-white/5 p-8 pb-6">
          <div class="rounded-lg bg-white/5 p-2">
            <Building2 class="h-5 w-5 text-white/60" />
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-tight">
              Branch Detail
            </h3>
            <p class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5">
              {{ filteredBranches.length }} branches found
            </p>
          </div>
        </div>

        <table class="w-full">
          <thead>
            <tr class="border-b border-white/5">
              <th class="px-8 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Rank
              </th>
              <th class="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Branch
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Total Claims
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Approved
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Need Revision
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Approval Rate
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Revision Rate
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Avg Lead Time
              </th>
              <th class="px-4 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in filteredBranches"
              :key="b.branch"
              class="group border-b border-white/5 last:border-0 transition-colors hover:bg-white/2"
            >
              <td class="px-8 py-4">
                <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black text-white/30">
                  {{ String(b.rank).padStart(2, '0') }}
                </span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#B6F500]/10">
                    <Building2
                      :size="14"
                      class="text-[#B6F500]/70"
                    />
                  </div>
                  <span class="text-sm font-black uppercase tracking-tight">{{ b.branch }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-black italic text-white/80">{{ b.totalClaims }}</span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-black text-emerald-400">{{ b.approvedClaims }}</span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-black text-amber-400">{{ b.needRevision }}</span>
              </td>
              <td class="px-4 py-4 text-right">
                <span
                  :class="['text-sm font-black italic', approvalRateColor(b.approvalRate)]"
                >
                  {{ b.approvalRate }}%
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <span
                  :class="['text-sm font-black italic', revisionRateColor(b.revisionRate)]"
                >
                  {{ b.revisionRate }}%
                </span>
              </td>
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-black text-purple-400">{{ b.avgLeadTimeDays }}d</span>
              </td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <component
                    :is="b.trend === 'down' ? ArrowDownRight : ArrowUpRight"
                    :size="12"
                    :class="b.trend === 'down' ? 'text-red-400' : 'text-emerald-400'"
                  />
                  <span
                    :class="[
                      'text-[10px] font-black',
                      b.trend === 'down' ? 'text-red-400' : 'text-emerald-400'
                    ]"
                  >
                    {{ b.trendDelta }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
