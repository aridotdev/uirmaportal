<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Building2,
  Download,
  Filter,
  Package,
  TrendingUp
} from 'lucide-vue-next'
import type { ReportSummary } from '~/utils/types'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Mock Report Data
// ──────────────────────────────────────────────

const reportData = ref<ReportSummary>({
  totalClaims: 342,
  approvedClaims: 218,
  rejectedClaims: 47,
  pendingClaims: 77,
  approvalRate: 63.7,
  averageProcessingDays: 3.2,
  claimsByVendor: [
    { vendor: 'MOKA', count: 156 },
    { vendor: 'MTC', count: 112 },
    { vendor: 'SDP', count: 74 }
  ],
  claimsByBranch: [
    { branch: 'Jakarta', count: 98 },
    { branch: 'Surabaya', count: 76 },
    { branch: 'Bandung', count: 63 },
    { branch: 'Medan', count: 57 },
    { branch: 'Makassar', count: 48 }
  ],
  monthlyTrend: [
    { month: 'Okt 2025', notificationQty: 120, claimQty: 88, ratio: 73.3 },
    { month: 'Nov 2025', notificationQty: 145, claimQty: 109, ratio: 75.2 },
    { month: 'Des 2025', notificationQty: 130, claimQty: 92, ratio: 70.8 },
    { month: 'Jan 2026', notificationQty: 155, claimQty: 118, ratio: 76.1 },
    { month: 'Feb 2026', notificationQty: 138, claimQty: 105, ratio: 76.1 },
    { month: 'Mar 2026', notificationQty: 162, claimQty: 130, ratio: 80.2 }
  ]
})

const selectedPeriod = ref('this_month')
const periods = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' }
]

const kpiCards = computed(() => [
  {
    label: 'Total Claims',
    value: reportData.value.totalClaims,
    trend: '+12.5%',
    trendUp: true,
    color: 'text-white',
    bgGlow: 'bg-white/5'
  },
  {
    label: 'Approved',
    value: reportData.value.approvedClaims,
    trend: '+8.3%',
    trendUp: true,
    color: 'text-[#B6F500]',
    bgGlow: 'bg-[#B6F500]/5'
  },
  {
    label: 'Pending Review',
    value: reportData.value.pendingClaims,
    trend: '-3.1%',
    trendUp: false,
    color: 'text-blue-400',
    bgGlow: 'bg-blue-500/5'
  },
  {
    label: 'Need Revision',
    value: reportData.value.rejectedClaims,
    trend: '+2.1%',
    trendUp: true,
    color: 'text-amber-400',
    bgGlow: 'bg-amber-500/5'
  }
])

const maxVendorCount = computed(() => {
  return Math.max(...reportData.value.claimsByVendor.map(v => v.count))
})

const maxBranchCount = computed(() => {
  return Math.max(...reportData.value.claimsByBranch.map(b => b.count))
})

const vendorColors: Record<string, string> = {
  MOKA: '#B6F500',
  MTC: '#3b82f6',
  SDP: '#f59e0b'
}

const maxTrendQty = computed(() => {
  return Math.max(
    ...reportData.value.monthlyTrend.flatMap(m => [m.notificationQty, m.claimQty])
  )
})
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            Reports & <span class="text-[#B6F500]">Analytics</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Ringkasan performa klaim RMA dan statistik operasional.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <Filter
              :size="14"
              class="text-white/30"
            />
            <select
              v-model="selectedPeriod"
              class="bg-transparent text-xs font-black uppercase tracking-widest text-white/60 outline-none appearance-none pr-2 cursor-pointer"
            >
              <option
                v-for="p in periods"
                :key="p.value"
                :value="p.value"
                class="bg-[#0a0a0a]"
              >
                {{ p.label }}
              </option>
            </select>
          </div>
          <button class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white">
            <Download :size="14" />
            Export
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(card, idx) in kpiCards"
          :key="idx"
          :class="['group relative overflow-hidden rounded-[28px] border border-white/10 p-6 transition-all hover:border-white/20', card.bgGlow]"
        >
          <div
            class="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-30"
            :class="card.bgGlow"
          />
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {{ card.label }}
          </p>
          <p :class="['mt-2 text-3xl font-black italic', card.color]">
            {{ String(card.value).padStart(2, '0') }}
          </p>
          <div class="mt-3 flex items-center gap-1.5">
            <component
              :is="card.trendUp ? ArrowUpRight : ArrowDownRight"
              :size="14"
              :class="card.trendUp ? 'text-emerald-400' : 'text-red-400'"
            />
            <span :class="['text-[10px] font-black uppercase tracking-widest', card.trendUp ? 'text-emerald-400' : 'text-red-400']">
              {{ card.trend }}
            </span>
            <span class="text-[8px] font-bold text-white/20 uppercase tracking-widest ml-1">vs last period</span>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Trend Chart -->
        <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
              <div class="bg-white/5 p-2 rounded-lg">
                <TrendingUp class="w-5 h-5 text-white/60" />
              </div>
              <h3 class="font-black text-lg uppercase tracking-tight">
                Monthly Trend
              </h3>
            </div>
            <div class="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span class="text-white/30">Notification</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full bg-[#B6F500]" />
                <span class="text-white/30">Claim</span>
              </div>
            </div>
          </div>

          <!-- Simplified Bar Chart -->
          <div class="space-y-4">
            <div
              v-for="m in reportData.monthlyTrend"
              :key="m.month"
              class="group"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-black uppercase tracking-widest text-white/30 w-20">{{ m.month.split(' ')[0] }}</span>
                <span class="text-[10px] font-black text-[#B6F500]">{{ m.ratio }}%</span>
              </div>
              <div class="flex gap-2">
                <div
                  class="h-3 rounded-full bg-white/10 transition-all duration-700"
                  :style="{ width: `${(m.notificationQty / maxTrendQty) * 100}%` }"
                />
                <div
                  class="h-3 rounded-full bg-[#B6F500] shadow-[0_0_8px_rgba(182,245,0,0.3)] transition-all duration-700"
                  :style="{ width: `${(m.claimQty / maxTrendQty) * 100}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Approval Rate Card -->
        <div class="space-y-8">
          <!-- Big Approval Rate -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-[#B6F500]/5 rounded-full blur-3xl pointer-events-none" />
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                <div class="bg-white/5 p-2 rounded-lg">
                  <BarChart3 class="w-5 h-5 text-white/60" />
                </div>
                <h3 class="font-black text-lg uppercase tracking-tight">
                  Approval Rate
                </h3>
              </div>
              <div class="flex items-end gap-4">
                <span class="text-7xl font-black italic text-[#B6F500] leading-none">
                  {{ reportData.approvalRate }}%
                </span>
                <div class="flex items-center gap-1 mb-2">
                  <ArrowUpRight
                    :size="16"
                    class="text-emerald-400"
                  />
                  <span class="text-xs font-black text-emerald-400">+4.2%</span>
                </div>
              </div>
              <div class="mt-6 h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  class="h-full bg-[#B6F500] shadow-[0_0_10px_#B6F500] rounded-full transition-all duration-1000"
                  :style="{ width: `${reportData.approvalRate}%` }"
                />
              </div>
              <div class="mt-4 flex justify-between text-[9px] font-black uppercase tracking-widest text-white/20">
                <span>0%</span>
                <span>Target: 75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <!-- Processing Time -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">
              Avg. Processing Time
            </p>
            <div class="flex items-end gap-2">
              <span class="text-5xl font-black italic text-white leading-none">
                {{ reportData.averageProcessingDays }}
              </span>
              <span class="text-lg font-bold text-white/30 mb-1">days</span>
            </div>
            <div class="mt-4 flex items-center gap-2">
              <ArrowDownRight
                :size="14"
                class="text-emerald-400"
              />
              <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">-0.5 days vs last month</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Vendor & Branch Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Claims by Vendor -->
        <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
          <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
            <div class="bg-white/5 p-2 rounded-lg">
              <Package class="w-5 h-5 text-white/60" />
            </div>
            <h3 class="font-black text-lg uppercase tracking-tight">
              Claims by Vendor
            </h3>
          </div>
          <div class="space-y-6">
            <div
              v-for="v in reportData.claimsByVendor"
              :key="v.vendor"
              class="group"
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
              <div class="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
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

        <!-- Claims by Branch -->
        <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
          <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
            <div class="bg-white/5 p-2 rounded-lg">
              <Building2 class="w-5 h-5 text-white/60" />
            </div>
            <h3 class="font-black text-lg uppercase tracking-tight">
              Claims by Branch
            </h3>
          </div>
          <div class="space-y-5">
            <div
              v-for="(b, idx) in reportData.claimsByBranch"
              :key="b.branch"
              class="group flex items-center gap-6"
            >
              <span class="text-sm font-black uppercase tracking-tight w-24 shrink-0">{{ b.branch }}</span>
              <div class="flex-1 h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  class="h-full rounded-full bg-[#B6F500] transition-all duration-700"
                  :style="{
                    width: `${(b.count / maxBranchCount) * 100}%`,
                    opacity: 1 - idx * 0.12
                  }"
                />
              </div>
              <span class="text-sm font-black italic text-white/60 w-8 text-right">{{ b.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
