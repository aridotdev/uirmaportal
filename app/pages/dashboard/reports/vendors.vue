<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  Package
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { dashboardNeonSelectUi, dashboardNeonButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface VendorRow {
  rank: number
  vendor: string
  color: string
  totalClaims: number
  acceptedClaims: number
  rejectedClaims: number
  pendingClaims: number
  acceptanceRate: number
  rejectionRate: number
  recoveryAmountIdr: number
  avgProcessingDays: number
  trend: 'up' | 'down' | 'flat'
  trendDelta: string
}

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const vendors = ref<VendorRow[]>([
  {
    rank: 1,
    vendor: 'MOKA',
    color: '#B6F500',
    totalClaims: 156,
    acceptedClaims: 122,
    rejectedClaims: 21,
    pendingClaims: 13,
    acceptanceRate: 78.2,
    rejectionRate: 13.5,
    recoveryAmountIdr: 184_500_000,
    avgProcessingDays: 3.2,
    trend: 'up',
    trendDelta: '+5.4%'
  },
  {
    rank: 2,
    vendor: 'MTC',
    color: '#3b82f6',
    totalClaims: 112,
    acceptedClaims: 89,
    rejectedClaims: 14,
    pendingClaims: 9,
    acceptanceRate: 79.5,
    rejectionRate: 12.5,
    recoveryAmountIdr: 132_000_000,
    avgProcessingDays: 3.7,
    trend: 'up',
    trendDelta: '+2.1%'
  },
  {
    rank: 3,
    vendor: 'SDP',
    color: '#f59e0b',
    totalClaims: 74,
    acceptedClaims: 47,
    rejectedClaims: 21,
    pendingClaims: 6,
    acceptanceRate: 63.5,
    rejectionRate: 28.4,
    recoveryAmountIdr: 62_300_000,
    avgProcessingDays: 5.1,
    trend: 'down',
    trendDelta: '-3.8%'
  }
])

const trendData = ref([
  { month: 'Oct-25', MOKA: 28, MTC: 22, SDP: 14 },
  { month: 'Nov-25', MOKA: 34, MTC: 26, SDP: 18 },
  { month: 'Dec-25', MOKA: 22, MTC: 18, SDP: 12 },
  { month: 'Jan-26', MOKA: 38, MTC: 28, SDP: 16 },
  { month: 'Feb-26', MOKA: 30, MTC: 22, SDP: 14 },
  { month: 'Mar-26', MOKA: 26, MTC: 18, SDP: 10 }
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

// ──────────────────────────────────────────────
// Chart series
// ──────────────────────────────────────────────

const chartSeries = [
  { key: 'MOKA', name: 'MOKA', color: '#B6F500' },
  { key: 'MTC', name: 'MTC', color: '#3b82f6' },
  { key: 'SDP', name: 'SDP', color: '#f59e0b' }
]

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const rankingItems = computed(() =>
  vendors.value.map(v => ({
    name: v.vendor,
    count: v.totalClaims,
    approvalRate: v.acceptanceRate,
    color: v.color
  }))
)

const formatIdr = (amount: number) => {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  return `Rp ${amount.toLocaleString('id-ID')}`
}

const acceptanceColor = (rate: number) => {
  if (rate >= 80) return 'text-emerald-400'
  if (rate >= 70) return 'text-[#B6F500]'
  if (rate >= 60) return 'text-amber-400'
  return 'text-red-400'
}

const rejectionColor = (rate: number) => {
  if (rate <= 10) return 'text-emerald-400'
  if (rate <= 20) return 'text-amber-400'
  return 'text-red-400'
}

const totalRecovery = computed(() =>
  vendors.value.reduce((s, v) => s + v.recoveryAmountIdr, 0)
)
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
              Vendor <span class="text-[#B6F500]">Performance</span>
            </h1>
            <p class="mt-2 text-sm font-medium text-white/40">
              Compare vendor performance by acceptance rate, rejection rate, and recovery value.
            </p>
          </div>
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
      <!-- Scorecards per Vendor -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          v-for="v in vendors"
          :key="v.vendor"
          class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a] p-8"
        >
          <!-- ambient glow -->
          <div
            class="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl opacity-10"
            :style="{ backgroundColor: v.color }"
          />

          <div class="relative z-10">
            <!-- Vendor name + rank -->
            <div class="flex items-start justify-between mb-6">
              <div>
                <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-1">
                  Rank #{{ v.rank }}
                </p>
                <h2
                  class="text-2xl font-black uppercase tracking-tight"
                  :style="{ color: v.color }"
                >
                  {{ v.vendor }}
                </h2>
              </div>
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                <Package
                  :size="18"
                  class="text-white/40"
                />
              </div>
            </div>

            <!-- Main Metrics -->
            <div class="space-y-4">
              <!-- Acceptance Rate -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[9px] font-black uppercase tracking-[0.15em] text-white/30">Acceptance Rate</span>
                  <span
                    :class="['text-sm font-black italic', acceptanceColor(v.acceptanceRate)]"
                  >
                    {{ v.acceptanceRate }}%
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    class="h-full rounded-full transition-all duration-700"
                    :style="{
                      width: `${v.acceptanceRate}%`,
                      backgroundColor: v.color,
                      boxShadow: `0 0 8px ${v.color}50`
                    }"
                  />
                </div>
              </div>

              <!-- Rejection Rate -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[9px] font-black uppercase tracking-[0.15em] text-white/30">Rejection Rate</span>
                  <span
                    :class="['text-sm font-black italic', rejectionColor(v.rejectionRate)]"
                  >
                    {{ v.rejectionRate }}%
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    class="h-full rounded-full bg-red-400 transition-all duration-700"
                    :style="{ width: `${v.rejectionRate}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="my-6 border-t border-white/5" />

            <!-- Secondary Metrics -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/20 mb-1">
                  Total
                </p>
                <p class="text-lg font-black italic text-white/80">
                  {{ v.totalClaims }}
                </p>
              </div>
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/20 mb-1">
                  Accepted
                </p>
                <p class="text-lg font-black italic text-emerald-400">
                  {{ v.acceptedClaims }}
                </p>
              </div>
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/20 mb-1">
                  Rejected
                </p>
                <p class="text-lg font-black italic text-red-400">
                  {{ v.rejectedClaims }}
                </p>
              </div>
            </div>

            <!-- Recovery -->
            <div class="mt-4 rounded-2xl border border-white/5 bg-white/2 px-4 py-3">
              <div class="flex items-center justify-between">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Recovery
                </p>
                <div class="flex items-center gap-1">
                  <component
                    :is="v.trend === 'down' ? ArrowDownRight : ArrowUpRight"
                    :size="10"
                    :class="v.trend === 'down' ? 'text-red-400' : 'text-emerald-400'"
                  />
                  <span
                    :class="['text-[9px] font-black', v.trend === 'down' ? 'text-red-400' : 'text-emerald-400']"
                  >
                    {{ v.trendDelta }}
                  </span>
                </div>
              </div>
              <p class="text-base font-black italic text-white/60 mt-1">
                {{ formatIdr(v.recoveryAmountIdr) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Summary KPI Strip -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Total Vendors
          </p>
          <p class="text-3xl font-black italic text-white">
            {{ String(vendors.length).padStart(2, '0') }}
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Avg Acceptance Rate
          </p>
          <p class="text-3xl font-black italic text-[#B6F500]">
            {{ (vendors.reduce((s, v) => s + v.acceptanceRate, 0) / vendors.length).toFixed(1) }}%
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Avg Rejection Rate
          </p>
          <p class="text-3xl font-black italic text-red-400">
            {{ (vendors.reduce((s, v) => s + v.rejectionRate, 0) / vendors.length).toFixed(1) }}%
          </p>
        </div>
        <div class="rounded-[28px] border border-white/5 bg-[#0a0a0a] p-5">
          <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25 mb-3">
            Total Recovery
          </p>
          <p class="text-3xl font-black italic text-emerald-400">
            {{ formatIdr(totalRecovery) }}
          </p>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- Chart + Ranking -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <ReportsAnalyticsChart
            title="Claim Volume by Vendor (Last 6 Months)"
            :data="trendData"
            :series="chartSeries"
            x-key="month"
            :height="300"
            :show-legend="true"
          />
        </div>

        <div class="lg:col-span-4">
          <ReportsRankingList
            title="Top Vendors"
            subtitle="by claim volume"
            type="vendor"
            :items="rankingItems"
          />
        </div>
      </div>
    </div>
  </div>
</template>
