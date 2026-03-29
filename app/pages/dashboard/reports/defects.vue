<script setup lang="ts">
import {
  ArrowUpRight,
  Bug,
  Boxes,
  Factory,
  Building2
} from 'lucide-vue-next'
import type { SelectItem } from '@nuxt/ui'
import { dashboardNeonFilterSelectUi, dashboardNeonFilterButtonUi } from '~/utils/select-ui'

definePageMeta({
  layout: 'dashboard'
})

interface DefectRow {
  name: string
  count: number
}

interface DefectByVendor {
  vendor: string
  total: number
  topDefect: string
  topDefectCount: number
  repeatRate: number
}

interface DefectByBranch {
  branch: string
  total: number
  dominantDefect: string
  dominantShare: number
}

interface ModelMixRow {
  model: string
  claims: number
  topDefect: string
  defectShare: number
  vendor: string
}

// -----------------------------------------------------------------------------
// Mock dataset (FE-only foundation until API BE-4.1 is ready)
// -----------------------------------------------------------------------------

const topDefects = ref<DefectRow[]>([
  { name: 'Panel Crack', count: 89 },
  { name: 'Dead Pixel', count: 67 },
  { name: 'Backlight Bleeding', count: 52 },
  { name: 'Color Distortion', count: 41 },
  { name: 'Power Failure', count: 34 },
  { name: 'Mainboard Error', count: 26 },
  { name: 'Connector Loose', count: 18 }
])

const defectTrendData = ref([
  { period: 'Oct-25', panelCrack: 16, deadPixel: 10, backlightBleeding: 8 },
  { period: 'Nov-25', panelCrack: 19, deadPixel: 12, backlightBleeding: 9 },
  { period: 'Dec-25', panelCrack: 13, deadPixel: 9, backlightBleeding: 7 },
  { period: 'Jan-26', panelCrack: 18, deadPixel: 14, backlightBleeding: 11 },
  { period: 'Feb-26', panelCrack: 14, deadPixel: 12, backlightBleeding: 10 },
  { period: 'Mar-26', panelCrack: 9, deadPixel: 10, backlightBleeding: 7 }
])

const defectsByVendor = ref<DefectByVendor[]>([
  { vendor: 'SDP', total: 74, topDefect: 'Panel Crack', topDefectCount: 23, repeatRate: 31.1 },
  { vendor: 'MOKA', total: 156, topDefect: 'Dead Pixel', topDefectCount: 29, repeatRate: 18.6 },
  { vendor: 'MTC', total: 112, topDefect: 'Backlight Bleeding', topDefectCount: 24, repeatRate: 21.4 }
])

const defectsByBranch = ref<DefectByBranch[]>([
  { branch: 'Medan', total: 57, dominantDefect: 'Panel Crack', dominantShare: 36.8 },
  { branch: 'Bandung', total: 63, dominantDefect: 'Dead Pixel', dominantShare: 28.6 },
  { branch: 'Surabaya', total: 76, dominantDefect: 'Backlight Bleeding', dominantShare: 24.9 },
  { branch: 'Jakarta', total: 98, dominantDefect: 'Panel Crack', dominantShare: 22.4 },
  { branch: 'Makassar', total: 48, dominantDefect: 'Power Failure', dominantShare: 19.5 }
])

const modelMix = ref<ModelMixRow[]>([
  { model: 'M-LCD-240', claims: 62, topDefect: 'Panel Crack', defectShare: 40.3, vendor: 'SDP' },
  { model: 'M-LCD-180', claims: 54, topDefect: 'Dead Pixel', defectShare: 33.3, vendor: 'MOKA' },
  { model: 'M-OLED-210', claims: 48, topDefect: 'Backlight Bleeding', defectShare: 29.2, vendor: 'MTC' },
  { model: 'M-LCD-155', claims: 43, topDefect: 'Color Distortion', defectShare: 25.6, vendor: 'MOKA' },
  { model: 'M-QLED-300', claims: 39, topDefect: 'Power Failure', defectShare: 20.5, vendor: 'SDP' }
])

// -----------------------------------------------------------------------------
// Filters
// -----------------------------------------------------------------------------

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

const selectedModel = ref('all')
const modelOptions: SelectItem[] = [
  { label: 'All Models', value: 'all' },
  { label: 'M-LCD-240', value: 'm-lcd-240' },
  { label: 'M-LCD-180', value: 'm-lcd-180' },
  { label: 'M-OLED-210', value: 'm-oled-210' },
  { label: 'M-LCD-155', value: 'm-lcd-155' },
  { label: 'M-QLED-300', value: 'm-qled-300' }
]

// -----------------------------------------------------------------------------
// Computed metrics
// -----------------------------------------------------------------------------

const totalDefectClaims = computed(() =>
  topDefects.value.reduce((sum, item) => sum + item.count, 0)
)

const topDefect = computed(() => topDefects.value[0])

const topDefectShare = computed(() => {
  if (!topDefect.value || totalDefectClaims.value === 0) return 0
  return Number(((topDefect.value.count / totalDefectClaims.value) * 100).toFixed(1))
})

const repeatDefectRate = computed(() => {
  if (defectsByVendor.value.length === 0) return 0
  return Number(
    (defectsByVendor.value.reduce((sum, item) => sum + item.repeatRate, 0) / defectsByVendor.value.length).toFixed(1)
  )
})

const paretoRows = computed(() => {
  let running = 0
  const total = totalDefectClaims.value
  return topDefects.value.map((item) => {
    running += item.count
    const share = total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0
    const cumulativeShare = total > 0 ? Number(((running / total) * 100).toFixed(1)) : 0
    return {
      ...item,
      share,
      cumulativeShare
    }
  })
})

const defectTrendSeries = [
  { key: 'panelCrack', name: 'Panel Crack', color: '#B6F500' },
  { key: 'deadPixel', name: 'Dead Pixel', color: '#60a5fa' },
  { key: 'backlightBleeding', name: 'Backlight Bleeding', color: '#f59e0b' }
]

const maxParetoCount = computed(() =>
  Math.max(...topDefects.value.map(item => item.count), 1)
)

const maxModelCount = computed(() =>
  Math.max(...modelMix.value.map(item => item.claims), 1)
)

const repeatRateColor = (rate: number): string => {
  if (rate >= 30) return 'text-red-400'
  if (rate >= 22) return 'text-amber-400'
  if (rate >= 15) return 'text-[#B6F500]'
  return 'text-emerald-400'
}

const shareColor = (share: number): string => {
  if (share >= 35) return 'text-red-400'
  if (share >= 25) return 'text-amber-400'
  return 'text-[#B6F500]'
}
</script>

<template>
  <div class="">
    <div class="mx-auto max-w-[1400px] space-y-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            Defect <span class="text-[#B6F500]">Analytics</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Identify defect patterns by model, vendor, and branch to support faster root-cause analysis.
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
          v-model="selectedModel"
          :items="modelOptions"
          icon="i-lucide-box"
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
          :ui="dashboardNeonFilterButtonUi"
        />
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:gap-5">
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Total Defect Claims
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ String(totalDefectClaims).padStart(2, '0') }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Top Defect
          </p>
          <p class="relative z-10 truncate text-2xl font-black italic text-white">
            {{ topDefect?.name }}
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Top Defect Share
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ topDefectShare }}%
          </p>
        </div>
        <div class="group relative cursor-pointer overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-white/20">
          <div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5 blur-2xl opacity-20 transition-opacity group-hover:opacity-40" />
          <p class="relative z-10 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
            Repeat Defect Rate
          </p>
          <p class="relative z-10 text-3xl font-black italic text-white">
            {{ repeatDefectRate }}%
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div class="lg:col-span-4 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="mb-8 flex items-center gap-3 border-b border-white/5 pb-6">
            <div class="rounded-lg bg-white/5 p-2">
              <Bug class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Defect Pareto
              </h3>
              <p class="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/25">
                each defect's share of the total
              </p>
            </div>
          </div>

          <div class="space-y-5">
            <div
              v-for="(row, idx) in paretoRows"
              :key="row.name"
              class="group cursor-pointer"
            >
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[9px] font-black text-white/30">
                    {{ String(idx + 1).padStart(2, '0') }}
                  </span>
                  <span class="text-xs font-black uppercase tracking-tight">{{ row.name }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[9px] font-black uppercase tracking-widest text-white/35">
                    {{ row.share }}% share
                  </span>
                  <span class="text-sm font-black italic text-white/70">{{ row.count }}</span>
                </div>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-white/5">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{
                    width: `${(row.count / maxParetoCount) * 100}%`,
                    backgroundColor: idx === 0 ? '#B6F500' : idx < 3 ? '#60a5fa' : '#64748b',
                    opacity: 1 - idx * 0.1
                  }"
                />
              </div>
              <div class="mt-1.5 flex justify-end">
                <span
                  :class="[
                    'text-[9px] font-black uppercase tracking-widest',
                    row.cumulativeShare >= 80 ? 'text-emerald-400/70' : 'text-amber-400/70'
                  ]"
                >
                  cumulative {{ row.cumulativeShare }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-8 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <ReportsAnalyticsChart
            title="Top Defect Trend (Last 6 Months)"
            :data="defectTrendData"
            :series="defectTrendSeries"
            x-key="period"
            x-label="Period"
            y-label="Defect Claims"
            :height="420"
            :show-legend="true"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div class="lg:col-span-5 rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
          <div class="mb-8 flex items-center gap-3 border-b border-white/5 pb-6">
            <div class="rounded-lg bg-white/5 p-2">
              <Boxes class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Model Mix
              </h3>
              <p class="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/25">
                defect mix by model
              </p>
            </div>
          </div>

          <div class="space-y-5">
            <div
              v-for="(row, idx) in modelMix"
              :key="row.model"
              class="group cursor-pointer"
            >
              <div class="mb-2 flex items-center justify-between">
                <div>
                  <p class="text-xs font-black uppercase tracking-tight text-white/80">
                    {{ row.model }}
                  </p>
                  <p class="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/30">
                    {{ row.topDefect }} / {{ row.vendor }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-black italic text-white/70">
                    {{ row.claims }}
                  </p>
                  <p class="text-[9px] font-black uppercase tracking-widest text-amber-400/70">
                    {{ row.defectShare }}%
                  </p>
                </div>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full border border-white/5 bg-white/5">
                <div
                  class="h-full rounded-full transition-all duration-700"
                  :style="{
                    width: `${(row.claims / maxModelCount) * 100}%`,
                    backgroundColor: idx === 0 ? '#B6F500' : '#60a5fa',
                    opacity: 1 - idx * 0.1
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-7 rounded-4xl border border-white/5 bg-[#0a0a0a] overflow-hidden">
          <div class="flex items-center gap-3 border-b border-white/5 p-8 pb-6">
            <div class="rounded-lg bg-white/5 p-2">
              <Factory class="h-5 w-5 text-white/60" />
            </div>
            <div>
              <h3 class="text-sm font-black uppercase tracking-tight">
                Defect Contributor
              </h3>
              <p class="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-white/25">
                breakdown by vendor and branch
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div class="border-b border-white/5 p-6 lg:border-b-0 lg:border-r lg:border-white/5">
              <p class="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Defect by Vendor
              </p>
              <div class="space-y-4">
                <div
                  v-for="row in defectsByVendor"
                  :key="row.vendor"
                  class="rounded-2xl border border-white/5 bg-white/2 p-4"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <span class="text-sm font-black uppercase tracking-tight">{{ row.vendor }}</span>
                    <span class="text-sm font-black italic text-white/70">{{ row.total }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-white/35">
                    Top defect: <span class="text-amber-400">{{ row.topDefect }}</span> ({{ row.topDefectCount }})
                  </p>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-[9px] font-black uppercase tracking-widest text-white/30">
                      Repeat rate
                    </span>
                    <span :class="['text-[11px] font-black italic', repeatRateColor(row.repeatRate)]">
                      {{ row.repeatRate }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6">
              <p class="mb-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/25">
                Defect by Branch
              </p>
              <div class="space-y-4">
                <div
                  v-for="row in defectsByBranch"
                  :key="row.branch"
                  class="rounded-2xl border border-white/5 bg-white/2 p-4"
                >
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Building2
                        :size="13"
                        class="text-[#B6F500]/70"
                      />
                      <span class="text-sm font-black uppercase tracking-tight">{{ row.branch }}</span>
                    </div>
                    <span class="text-sm font-black italic text-white/70">{{ row.total }}</span>
                  </div>
                  <p class="text-[10px] font-black uppercase tracking-wider text-white/35">
                    Dominant: <span class="text-[#B6F500]">{{ row.dominantDefect }}</span>
                  </p>
                  <div class="mt-2 flex items-center justify-between">
                    <span class="text-[9px] font-black uppercase tracking-widest text-white/30">
                      Share
                    </span>
                    <div class="flex items-center gap-1">
                      <ArrowUpRight
                        :size="11"
                        class="text-amber-400"
                      />
                      <span :class="['text-[11px] font-black italic', shareColor(row.dominantShare)]">
                        {{ row.dominantShare }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
