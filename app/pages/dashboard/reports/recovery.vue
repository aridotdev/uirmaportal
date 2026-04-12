<script setup lang="ts">
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Package
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { resolvePeriodFilter, type PeriodFilterMode } from '~~/shared/utils/fiscal'
import { dashboardNeonFilterSelectUi, dashboardNeonFilterButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard', middleware: 'auth'
})

const toast = useToast()

interface RecoveryVendorRow {
  vendor: string
  color: string
  totalItems: number
  acceptedItems: number
  rejectedItems: number
  pendingItems: number
  compensationAcceptedIdr: number
  eligibleValueIdr: number
  unresolvedValueIdr: number
  avgDecisionDays: number
  trend: 'up' | 'down' | 'flat'
  trendDelta: string
}

interface RecoveryTrendRow {
  period: string
  acceptedItems: number
  rejectedItems: number
  pendingItems: number
  compensationAcceptedMio: number
  eligibleValueMio: number
}

const vendorRecovery = ref<RecoveryVendorRow[]>([
  {
    vendor: 'MOKA',
    color: '#B6F500',
    totalItems: 188,
    acceptedItems: 129,
    rejectedItems: 29,
    pendingItems: 30,
    compensationAcceptedIdr: 214_600_000,
    eligibleValueIdr: 286_200_000,
    unresolvedValueIdr: 41_500_000,
    avgDecisionDays: 4.2,
    trend: 'up',
    trendDelta: '+6.3%'
  },
  {
    vendor: 'MTC',
    color: '#60a5fa',
    totalItems: 144,
    acceptedItems: 97,
    rejectedItems: 21,
    pendingItems: 26,
    compensationAcceptedIdr: 158_300_000,
    eligibleValueIdr: 223_700_000,
    unresolvedValueIdr: 33_800_000,
    avgDecisionDays: 4.9,
    trend: 'up',
    trendDelta: '+2.4%'
  },
  {
    vendor: 'SDP',
    color: '#f59e0b',
    totalItems: 102,
    acceptedItems: 54,
    rejectedItems: 26,
    pendingItems: 22,
    compensationAcceptedIdr: 81_900_000,
    eligibleValueIdr: 156_500_000,
    unresolvedValueIdr: 39_700_000,
    avgDecisionDays: 6.3,
    trend: 'down',
    trendDelta: '-3.1%'
  }
])

const trendData = ref<RecoveryTrendRow[]>([
  { period: 'Oct-25', acceptedItems: 39, rejectedItems: 16, pendingItems: 24, compensationAcceptedMio: 68, eligibleValueMio: 96 },
  { period: 'Nov-25', acceptedItems: 46, rejectedItems: 19, pendingItems: 28, compensationAcceptedMio: 79, eligibleValueMio: 108 },
  { period: 'Dec-25', acceptedItems: 34, rejectedItems: 14, pendingItems: 22, compensationAcceptedMio: 61, eligibleValueMio: 90 },
  { period: 'Jan-26', acceptedItems: 52, rejectedItems: 22, pendingItems: 31, compensationAcceptedMio: 91, eligibleValueMio: 126 },
  { period: 'Feb-26', acceptedItems: 44, rejectedItems: 18, pendingItems: 27, compensationAcceptedMio: 77, eligibleValueMio: 109 },
  { period: 'Mar-26', acceptedItems: 38, rejectedItems: 17, pendingItems: 25, compensationAcceptedMio: 68, eligibleValueMio: 100 }
])

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

const selectedVendor = ref('all')
const vendorOptions: SelectItem[] = [
  { label: 'All Vendors', value: 'all' },
  { label: 'MOKA', value: 'moka' },
  { label: 'MTC', value: 'mtc' },
  { label: 'SDP', value: 'sdp' }
]

const selectedDecision = ref('all')
const decisionOptions: SelectItem[] = [
  { label: 'All Decisions', value: 'all' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Pending', value: 'pending' }
]

const activeChart = ref<'decision' | 'compensation'>('decision')

const chartTabs = [
  { key: 'decision', label: 'Decision Mix Trend' },
  { key: 'compensation', label: 'Compensation Trend' }
] as const

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
  const year = 2000 + Number(yearLabel ?? '0')
  return new Date(year, monthMap[monthLabel ?? ''] ?? 0, 1)
}

const branchFactors: Record<string, number> = {
  all: 1,
  jakarta: 1.12,
  surabaya: 1,
  bandung: 0.93,
  medan: 0.88,
  makassar: 0.84
}

const filteredTrendData = computed(() => {
  let result = [...trendData.value]

  if (selectedPeriod.value && selectedPeriod.value !== 'all') {
    const range = resolvePeriodFilter(selectedPeriod.value as PeriodFilterMode)
    result = result.filter((item) => {
      const d = parsePeriodMonth(item.period)
      return d >= range.startDate && d <= range.endDate
    })
  }

  const branchFactor = branchFactors[selectedBranch.value] ?? 1
  return result.map(item => ({
    ...item,
    acceptedItems: Math.max(0, Math.round(item.acceptedItems * branchFactor)),
    rejectedItems: Math.max(0, Math.round(item.rejectedItems * branchFactor)),
    pendingItems: Math.max(0, Math.round(item.pendingItems * branchFactor)),
    compensationAcceptedMio: Math.max(0, Math.round(item.compensationAcceptedMio * branchFactor)),
    eligibleValueMio: Math.max(0, Math.round(item.eligibleValueMio * branchFactor))
  }))
})

const periodBranchFactor = computed(() => {
  const allAccepted = trendData.value.reduce((sum, row) => sum + row.acceptedItems, 0)
  const filteredAccepted = filteredTrendData.value.reduce((sum, row) => sum + row.acceptedItems, 0)
  if (!allAccepted) return 1
  return filteredAccepted / allAccepted
})

const filteredVendors = computed(() => {
  let result = vendorRecovery.value.map((vendor) => {
    const scaledTotalItems = Math.max(0, Math.round(vendor.totalItems * periodBranchFactor.value))
    const acceptedItems = Math.max(0, Math.round(vendor.acceptedItems * periodBranchFactor.value))
    const rejectedItems = Math.max(0, Math.round(vendor.rejectedItems * periodBranchFactor.value))
    const pendingItems = Math.max(0, scaledTotalItems - acceptedItems - rejectedItems)
    const compensationAcceptedIdr = Math.max(0, Math.round(vendor.compensationAcceptedIdr * periodBranchFactor.value))
    const eligibleValueIdr = Math.max(0, Math.round(vendor.eligibleValueIdr * periodBranchFactor.value))
    const unresolvedValueIdr = Math.max(0, Math.round(vendor.unresolvedValueIdr * periodBranchFactor.value))

    return {
      ...vendor,
      totalItems: scaledTotalItems,
      acceptedItems,
      rejectedItems,
      pendingItems,
      compensationAcceptedIdr,
      eligibleValueIdr,
      unresolvedValueIdr
    }
  })

  if (selectedVendor.value !== 'all') {
    result = result.filter((vendor) => {
      return vendor.vendor.toLowerCase() === selectedVendor.value
    })
  }

  return result
})

const totalVendorItems = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.totalItems, 0)
)

const acceptedItems = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.acceptedItems, 0)
)

const rejectedItems = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.rejectedItems, 0)
)

const pendingItems = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.pendingItems, 0)
)

const decidedItems = computed(() => acceptedItems.value + rejectedItems.value)

const acceptanceRate = computed(() => {
  if (decidedItems.value === 0) return 0
  return Number(((acceptedItems.value / decidedItems.value) * 100).toFixed(1))
})

const rejectionRate = computed(() => {
  if (decidedItems.value === 0) return 0
  return Number(((rejectedItems.value / decidedItems.value) * 100).toFixed(1))
})

const totalCompensation = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.compensationAcceptedIdr, 0)
)

const totalEligibleValue = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.eligibleValueIdr, 0)
)

const recoveryRatio = computed(() => {
  if (totalEligibleValue.value === 0) return 0
  return Number(((totalCompensation.value / totalEligibleValue.value) * 100).toFixed(1))
})

const totalUnresolvedValue = computed(() =>
  filteredVendors.value.reduce((sum, row) => sum + row.unresolvedValueIdr, 0)
)

const avgDecisionLeadTime = computed(() => {
  if (filteredVendors.value.length === 0) return '0.0'
  const total = filteredVendors.value.reduce((sum, row) => sum + row.avgDecisionDays, 0)
  return (total / filteredVendors.value.length).toFixed(1)
})

const rankingItems = computed(() =>
  [...filteredVendors.value]
    .sort((a, b) => b.compensationAcceptedIdr - a.compensationAcceptedIdr)
    .map(item => ({
      name: item.vendor,
      count: Math.round(item.compensationAcceptedIdr / 1_000_000),
      approvalRate: Number(((item.compensationAcceptedIdr / item.eligibleValueIdr) * 100).toFixed(1)),
      color: item.color
    }))
)

const decisionSeries = [
  { key: 'acceptedItems', name: 'Accepted', color: '#B6F500' },
  { key: 'rejectedItems', name: 'Rejected', color: '#f87171' },
  { key: 'pendingItems', name: 'Pending', color: '#60a5fa' }
]

const compensationSeries = [
  { key: 'compensationAcceptedMio', name: 'Compensation (M)', color: '#B6F500' },
  { key: 'eligibleValueMio', name: 'Eligible Value (M)', color: '#a78bfa' }
]

const activeSeries = computed(() =>
  activeChart.value === 'compensation' ? compensationSeries : decisionSeries
)

const decisionBadgeClass = computed(() => {
  if (selectedDecision.value === 'accepted') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (selectedDecision.value === 'rejected') return 'text-red-400 bg-red-500/10 border-red-500/20'
  if (selectedDecision.value === 'pending') return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
  return 'text-white/50 bg-white/5 border-white/10'
})

const visibleRows = computed(() => {
  if (selectedDecision.value === 'accepted') {
    return filteredVendors.value.filter(v => v.acceptedItems > 0)
  }
  if (selectedDecision.value === 'rejected') {
    return filteredVendors.value.filter(v => v.rejectedItems > 0)
  }
  if (selectedDecision.value === 'pending') {
    return filteredVendors.value.filter(v => v.pendingItems > 0)
  }
  return filteredVendors.value
})

const decisionCountByFilter = computed(() => {
  if (selectedDecision.value === 'accepted') return acceptedItems.value
  if (selectedDecision.value === 'rejected') return rejectedItems.value
  if (selectedDecision.value === 'pending') return pendingItems.value
  return totalVendorItems.value
})

const formatIdr = (amount: number) => {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(2)}M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  return `Rp ${amount.toLocaleString('id-ID')}`
}

const recoveryRatioColor = (ratio: number): string => {
  if (ratio >= 75) return 'text-emerald-400'
  if (ratio >= 65) return 'text-[#B6F500]'
  if (ratio >= 50) return 'text-amber-400'
  return 'text-red-400'
}

const isExporting = ref(false)

const handleExport = async () => {
  if (isExporting.value) return
  isExporting.value = true

  if (!visibleRows.value.length) {
    isExporting.value = false
    return
  }

  try {
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`
    const headers = ['Vendor', 'Total Items', 'Accepted', 'Rejected', 'Pending', 'Acceptance Rate', 'Recovery Ratio', 'Accepted Compensation', 'Eligible Value', 'Unresolved Value', 'Avg Decision Days']
    const rows = visibleRows.value.map((row) => {
      const acceptedRate = ((row.acceptedItems / Math.max(row.acceptedItems + row.rejectedItems, 1)) * 100).toFixed(1)
      const ratio = ((row.compensationAcceptedIdr / Math.max(row.eligibleValueIdr, 1)) * 100).toFixed(1)
      return [
        row.vendor,
        row.totalItems,
        row.acceptedItems,
        row.rejectedItems,
        row.pendingItems,
        `${acceptedRate}%`,
        `${ratio}%`,
        row.compensationAcceptedIdr,
        row.eligibleValueIdr,
        row.unresolvedValueIdr,
        row.avgDecisionDays
      ]
    })
    const csv = [headers.map(escapeCsv).join(','), ...rows.map(row => row.map(escapeCsv).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `recovery-report-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)

    toast.add({
      title: 'Export started',
      description: 'Recovery CSV sedang diunduh dengan filter saat ini.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Export failed',
      description: 'Gagal membuat file export recovery.',
      color: 'error'
    })
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="">
    <div class="mx-auto max-w-[1400px] space-y-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            Recovery <span class="text-[#B6F500]">Analytics</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Track vendor decisions, unresolved items, and financial recovery against eligible value.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-3">
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
          v-model="selectedVendor"
          :items="vendorOptions"
          icon="i-lucide-package"
          size="sm"
          variant="none"
          class="w-36"
          :ui="dashboardNeonFilterSelectUi"
        />
        <USelect
          v-model="selectedDecision"
          :items="decisionOptions"
          icon="i-lucide-circle-check"
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
          :loading="isExporting"
          :disabled="isExporting || visibleRows.length === 0"
          :ui="dashboardNeonFilterButtonUi"
          @click="handleExport"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6 xl:gap-5">
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Vendor Items
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ String(totalVendorItems).padStart(2, '0') }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Acceptance Rate
          </p>
          <div class="relative z-10 flex items-center gap-1.5">
            <CheckCircle2
              :size="14"
              class="text-[#B6F500]"
            />
            <p class="text-3xl font-black italic text-white">
              {{ acceptanceRate }}%
            </p>
          </div>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Rejection Rate
          </p>
          <div class="relative z-10 flex items-center gap-1.5">
            <XCircle
              :size="14"
              class="text-red-400"
            />
            <p class="text-3xl font-black italic text-white">
              {{ rejectionRate }}%
            </p>
          </div>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Compensation
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ formatIdr(totalCompensation) }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Recovery Ratio
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ recoveryRatio }}%
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Unresolved Items
          </p>
          <div class="relative z-10 flex items-center gap-1.5">
            <Clock
              :size="14"
              class="text-blue-400"
            />
            <p class="text-3xl font-black italic text-white">
              {{ String(pendingItems).padStart(2, '0') }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button
                v-for="tab in chartTabs"
                :key="tab.key"
                class="rounded-2xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition"
                :class="activeChart === tab.key
                  ? 'border-[#B6F500]/30 bg-[#B6F500]/10 text-[#B6F500]'
                  : 'border-white/10 bg-white/5 text-white/35 hover:text-white/60'"
                @click="activeChart = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="rounded-full border border-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
              Last 6 months
            </div>
          </div>

          <ReportsAnalyticsChart
            :title="activeChart === 'decision' ? 'Vendor Decision Mix (Last 6 Months)' : 'Compensation vs Eligible Value (M)'"
            :data="filteredTrendData"
            :series="activeSeries"
            x-key="period"
            x-label="Period"
            :y-label="activeChart === 'decision' ? 'Item Count' : 'Amount (Million IDR)'"
            :height="310"
            :show-legend="true"
          />
        </div>

        <div class="space-y-4 lg:col-span-4">
          <ReportsRankingList
            title="Top Recovery"
            subtitle="by accepted compensation (M)"
            type="vendor"
            :items="rankingItems"
          />

          <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-6">
            <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
              Decision Filter Snapshot
            </p>
            <div class="mt-4 flex items-center justify-between">
              <span
                class="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em]"
                :class="decisionBadgeClass"
              >
                {{ selectedDecision }}
              </span>
              <p class="text-xl font-black italic text-white">
                {{ String(decisionCountByFilter).padStart(2, '0') }}
              </p>
            </div>
            <p class="mt-3 text-[11px] font-medium text-white/45">
              Branch filter: <span class="text-white/70 uppercase">{{ selectedBranch }}</span>
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-5">
          <div>
            <h3 class="text-lg font-black uppercase tracking-tight">
              Vendor Recovery Breakdown
            </h3>
            <p class="mt-1 text-xs font-medium text-white/40">
              Financial values show accepted compensation against eligible value for each vendor.
            </p>
          </div>
          <div class="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white/35">
            Avg decision lead time {{ avgDecisionLeadTime }}d
          </div>
        </div>

        <div class="space-y-4">
          <div
            v-for="row in visibleRows"
            :key="row.vendor"
            class="rounded-3xl border border-white/5 bg-white/2 p-5"
          >
            <div class="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                  Vendor
                </p>
                <h4
                  class="text-2xl font-black uppercase tracking-tight"
                  :style="{ color: row.color }"
                >
                  {{ row.vendor }}
                </h4>
              </div>
              <div class="flex items-center gap-2">
                <component
                  :is="row.trend === 'down' ? ArrowDownRight : ArrowUpRight"
                  :size="12"
                  :class="row.trend === 'down' ? 'text-red-400' : 'text-emerald-400'"
                />
                <span
                  :class="['text-[11px] font-black', row.trend === 'down' ? 'text-red-400' : 'text-emerald-400']"
                >
                  {{ row.trendDelta }}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              <div class="rounded-2xl border border-white/5 bg-black/30 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Total
                </p>
                <p class="mt-1 text-base font-black italic text-white/80">
                  {{ row.totalItems }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/30 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Accepted
                </p>
                <p class="mt-1 text-base font-black italic text-[#B6F500]">
                  {{ row.acceptedItems }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/30 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Rejected
                </p>
                <p class="mt-1 text-base font-black italic text-red-400">
                  {{ row.rejectedItems }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/30 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Pending
                </p>
                <p class="mt-1 text-base font-black italic text-blue-400">
                  {{ row.pendingItems }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/30 px-3 py-2 sm:col-span-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Accepted Compensation
                </p>
                <p class="mt-1 text-base font-black italic text-emerald-400">
                  {{ formatIdr(row.compensationAcceptedIdr) }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/30 px-3 py-2 sm:col-span-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Unresolved Value
                </p>
                <p class="mt-1 text-base font-black italic text-amber-400">
                  {{ formatIdr(row.unresolvedValueIdr) }}
                </p>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Acceptance Rate
                </p>
                <p class="mt-1 text-lg font-black italic text-[#B6F500]">
                  {{ ((row.acceptedItems / Math.max(row.acceptedItems + row.rejectedItems, 1)) * 100).toFixed(1) }}%
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Recovery Ratio
                </p>
                <p
                  :class="[
                    'mt-1 text-lg font-black italic',
                    recoveryRatioColor(Number(((row.compensationAcceptedIdr / Math.max(row.eligibleValueIdr, 1)) * 100).toFixed(1)))
                  ]"
                >
                  {{ ((row.compensationAcceptedIdr / Math.max(row.eligibleValueIdr, 1)) * 100).toFixed(1) }}%
                </p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/20 px-3 py-2">
                <p class="text-[8px] font-black uppercase tracking-[0.15em] text-white/25">
                  Avg Decision Time
                </p>
                <p class="mt-1 flex items-center gap-1 text-lg font-black italic text-white/75">
                  <Package
                    :size="12"
                    class="text-white/35"
                  />
                  {{ row.avgDecisionDays }}d
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2 text-[11px] font-medium text-white/45">
            <TrendingDown
              :size="14"
              class="text-amber-400"
            />
            Unresolved value across selected vendors: <span class="font-black text-amber-400">{{ formatIdr(totalUnresolvedValue) }}</span>
          </div>
          <div class="flex items-center gap-2 text-[11px] font-medium text-white/45">
            <TrendingUp
              :size="14"
              class="text-emerald-400"
            />
            Decided items (accepted + rejected): <span class="font-black text-white/75">{{ decidedItems }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
