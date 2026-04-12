<script setup lang="ts">
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Package,
  TrendingUp,
  Users,
  Search,
  AlertCircle,
  Download,
  FileText
} from 'lucide-vue-next'
import { h, computed } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'
import { VisXYContainer, VisLine, VisStackedBar, VisAxis, VisTooltip } from '@unovis/vue'
import { StackedBar } from '@unovis/ts'
import type { ClaimStatus } from '~~/shared/utils/constants'
import { useDashboardStore } from '~/composables/useDashboardStore'
import StatusBadge from '~/components/StatusBadge.vue'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { currentRole, roleDisplay } = useDashboardStore()

// Widget visibility berdasarkan role
const showReviewQueue = computed(() => ['QRCC', 'ADMIN'].includes(currentRole.value))
const showRecentClaims = computed(() => ['QRCC', 'ADMIN'].includes(currentRole.value))
const showSystemOverview = computed(() => currentRole.value === 'ADMIN')

interface RawClaim {
  id: number
  claimNumber: string
  notificationId: number
  inch: number
  modelName: string
  vendorName: string
  branch: string
  defectName: string
  claimStatus: ClaimStatus
  createdAt: string
  submittedBy: string
  updatedBy: string
}

interface ChartDataPoint {
  month: string
  notificationQty: number
  claimQty: number
  ratio: number
}

interface RecentClaim {
  id: string
  claimNumber: string
  name: string
  branch: string
  model: string
  serialNo: string
  defect: string
  status: ClaimStatus
  time: string
}

interface ClaimsResponse {
  success: boolean
  data: RawClaim[]
}

const { data: claimsResponse } = await useFetch<RawClaim[] | ClaimsResponse>('/api/claims')

const rawClaims = computed<RawClaim[]>(() => {
  if (Array.isArray(claimsResponse.value)) return claimsResponse.value
  return claimsResponse.value?.data ?? []
})

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMins = Math.floor(diffInMs / 60000)

  if (diffInMins < 60) return `${diffInMins} mins ago`
  const diffInHours = Math.floor(diffInMins / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`
  return `${Math.floor(diffInHours / 24)} days ago`
}

const chartData: ChartDataPoint[] = [
  { month: '10/2025', notificationQty: 150, claimQty: 20, ratio: 13.33 },
  { month: '11/2025', notificationQty: 140, claimQty: 24, ratio: 17.14 },
  { month: '12/2025', notificationQty: 173, claimQty: 21, ratio: 12.14 },
  { month: '01/2026', notificationQty: 130, claimQty: 18, ratio: 13.85 },
  { month: '02/2026', notificationQty: 170, claimQty: 35, ratio: 20.59 },
  { month: '03/2026', notificationQty: 155, claimQty: 17, ratio: 10.97 }
]

const x = (_d: ChartDataPoint, i: number) => i
const y = [
  (d: ChartDataPoint) => d.notificationQty,
  (d: ChartDataPoint) => d.claimQty
]
const yLine = (d: ChartDataPoint) => d.ratio

const kpiData = computed(() => {
  if (currentRole.value === 'MANAGEMENT') {
    return [
      { label: 'Total Claims (FH)', value: '1,842', trend: '+14%', icon: ClipboardList, color: '#B6F500' },
      { label: 'Approval Rate', value: '92.4%', trend: '+1.2%', icon: CheckCircle2, color: '#10b981' },
      { label: 'Avg Resolution', value: '3.2d', trend: '-0.5d', icon: Clock, color: '#3b82f6' },
      { label: 'Vendor Batches', value: '24', trend: '+3', icon: Package, color: '#f59e0b' }
    ]
  }

  if (currentRole.value === 'QRCC') {
    return [
      { label: 'Pending Review', value: '42', trend: '-8', icon: Clock, color: '#3b82f6' },
      { label: 'In Review', value: '7', trend: '+2', icon: Search, color: '#6366f1' },
      { label: 'Approved Today', value: '12', trend: '+4', icon: CheckCircle2, color: '#10b981' },
      { label: 'Revision Rate', value: '15.3%', trend: '-2.1%', icon: AlertCircle, color: '#f59e0b' }
    ]
  }

  // ADMIN (default)
  return [
    { label: 'Total RMA Claims', value: '1,842', trend: '+14%', icon: ClipboardList, color: '#B6F500' },
    { label: 'Active Users', value: '128', trend: '+4', icon: Users, color: '#f59e0b' },
    { label: 'Pending Review', value: '42', trend: '-8%', icon: Clock, color: '#3b82f6' },
    { label: 'Approval Rate', value: '92.4%', trend: '+1.2%', icon: CheckCircle2, color: '#10b981' }
  ]
})

const quickActions = computed(() => {
  if (currentRole.value === 'MANAGEMENT') {
    return [
      { label: 'View Reports', to: '/dashboard/reports', icon: FileText, type: 'link' },
      { label: 'Export Data', icon: Download, type: 'button' }
    ]
  }

  if (currentRole.value === 'QRCC') {
    return [
      { label: 'Review Claims', to: '/dashboard/claims', icon: ClipboardList, type: 'link' },
      { label: 'Generate Vendor Claim', to: '/dashboard/vendor-claims/create', icon: Package, type: 'link' }
    ]
  }

  // ADMIN
  return [
    { label: 'Audit Logs', to: '/dashboard/audit-trail', icon: Activity, type: 'link' },
    { label: 'Generate Report', icon: FileText, type: 'button' }
  ]
})

const recentClaims = computed(() => {
  return [...rawClaims.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(item => ({
      id: String(item.id),
      claimNumber: item.claimNumber,
      name: item.vendorName,
      branch: item.branch,
      model: item.modelName,
      serialNo: '8829-Z-2024',
      defect: item.defectName,
      status: item.claimStatus,
      time: formatTimeAgo(item.createdAt)
    }))
})

const topCS = [
  { branch: 'Cirebon', claims: 42, p: '88%', color: '#B6F500' },
  { branch: 'Purwokerto', claims: 38, p: '75%', color: '#3b82f6' },
  { branch: 'Karawang', claims: 24, p: '45%', color: '#f59e0b' }
]

// TanStack Table Setup
const columnHelper = createColumnHelper<RecentClaim>()

const columns = [
  columnHelper.accessor('claimNumber', {
    header: 'Claim Number',
    cell: info => h('div', { class: 'font-black tracking-tighter text-[#B6F500] italic' }, info.getValue())
  }),
  columnHelper.accessor('name', {
    header: 'Vendor Name',
    cell: info => h('div', { class: 'flex items-center gap-3' }, [
      h('p', { class: 'text-sm font-bold text-white/80 transition-colors group-hover:text-white' }, info.getValue())
    ])
  }),
  columnHelper.accessor('branch', {
    header: 'Branch',
    cell: info => h('p', { class: 'text-xs text-white/80 transition-colors group-hover:text-white/50 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('model', {
    header: 'Model Name',
    cell: info => h('p', { class: 'text-xs text-white/60 italic' }, info.getValue())
  }),
  columnHelper.accessor('serialNo', {
    header: 'Serial Number',
    cell: info => h('p', { class: 'font-mono text-xs whitespace-nowrap text-white/60 group-hover:text-white/70 transition-colors' }, info.getValue())
  }),
  columnHelper.accessor('defect', {
    header: 'Defect',
    cell: info => h('p', { class: 'text-xs font-bold text-red-400 italic' }, info.getValue())
  }),
  columnHelper.accessor('status', {
    header: 'Current State',
    cell: info => h(StatusBadge, {
      status: info.getValue(),
      variant: 'claim',
      size: 'sm'
    })
  }),
  columnHelper.display({
    id: 'activity',
    header: 'Activity',
    cell: info => h('div', { class: 'flex items-center justify-end relative h-10 w-full' }, [
      h('p', { class: 'text-xs font-black uppercase text-white/20 italic transition-opacity group-hover:opacity-0 duration-300' }, info.row.original.time),
      ['SUBMITTED', 'IN_REVIEW'].includes(info.row.original.status)
        ? h('button', {
            class: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-[0.15em] text-[#B6F500] underline opacity-0 transition-all group-hover:opacity-100 cursor-pointer hover:scale-110 active:scale-95 duration-300 outline-none whitespace-nowrap',
            onClick: (event: MouseEvent) => {
              event.stopPropagation()
              navigateTo(`/dashboard/claims/${info.row.original.id}`)
            }
          }, 'Review Now')
        : null
    ])
  })
]

const table = useVueTable({
  data: recentClaims,
  columns,
  getCoreRowModel: getCoreRowModel()
})
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="space-y-8 lg:space-y-10 xl:space-y-12">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
            {{ roleDisplay.dashboardTitle.split(' ')[0] }}
            <span class="text-[#B6F500]">{{ roleDisplay.dashboardTitle.split(' ').slice(1).join(' ') }}</span>
          </h2>
          <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
            {{ roleDisplay.dashboardSubtitle }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3 sm:gap-4 xl:justify-end">
          <template
            v-for="action in quickActions"
            :key="action.label"
          >
            <component
              :is="action.type === 'link' ? 'NuxtLink' : 'button'"
              :to="action.type === 'link' ? action.to : undefined"
              :class="[
                'flex items-center gap-3 rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest italic transition-all sm:px-6 sm:py-4',
                action.type === 'link'
                  ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                  : 'bg-[#B6F500] text-black shadow-xl shadow-[#B6F500]/10 hover:scale-105 active:scale-95'
              ]"
            >
              <component
                :is="action.icon"
                :size="16"
              />
              {{ action.label }}
            </component>
          </template>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 2xl:gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
        <div
          v-for="(kpi, i) in kpiData"
          :key="i"
          class="group relative cursor-pointer overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all hover:border-[#B6F500]/30 hover:bg-white/10 2xl:rounded-[40px] 2xl:p-8"
        >
          <div class="absolute right-0 top-0 p-6 opacity-5 transition-opacity group-hover:opacity-10">
            <component
              :is="kpi.icon"
              :size="80"
            />
          </div>
          <div class="relative z-10 mb-6 flex items-start justify-between 2xl:mb-8">
            <div class="rounded-2xl bg-white/5 p-3.5 transition-all group-hover:bg-[#B6F500] group-hover:text-black 2xl:p-4">
              <component
                :is="kpi.icon"
                :size="24"
                class="text-white/40 group-hover:text-black"
              />
            </div>
            <span
              :class="[
                'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest italic',
                kpi.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              ]"
            >{{ kpi.trend }}</span>
          </div>
          <p class="relative z-10 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
            {{ kpi.label }}
          </p>
          <h4 class="relative z-10 text-3xl font-black tracking-tighter italic 2xl:text-4xl">
            {{ kpi.value }}
          </h4>
        </div>
      </div>

      <!-- Review Queue Widget — QRCC & ADMIN only -->
      <div
        v-if="showReviewQueue"
        class="rounded-[36px] border border-dashed border-[#B6F500]/20 bg-[#B6F500]/5 p-12 text-center animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200"
      >
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#B6F500]/10 text-[#B6F500]">
          <ClipboardList :size="24" />
        </div>
        <h3 class="text-xl font-black uppercase tracking-tight italic">
          Review Queue
        </h3>
        <p class="mx-auto mt-2 max-w-md text-xs font-bold uppercase tracking-widest text-white/30 italic">
          You have 42 pending claims waiting for verification.
        </p>
        <NuxtLink
          to="/dashboard/claims"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B6F500] px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black italic transition-transform hover:scale-105 active:scale-95"
        >
          View All Claims
          <ArrowRight :size="14" />
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-12 2xl:gap-8 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-200">
        <div class="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl xl:col-span-8 2xl:rounded-[48px] 2xl:p-10">
          <div class="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between 2xl:mb-14">
            <div>
              <h3 class="text-xl font-black tracking-tight uppercase italic">
                Konversi <span class="text-[#B6F500]">Notifikasi ke Klaim</span>
              </h3>
              <p class="mt-1 text-xs font-bold uppercase tracking-widest text-white/20 italic">
                Konversi notifikasi menjadi klaim selama 6 bulan terakhir
              </p>
            </div>
            <div class="flex gap-4 self-start">
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-white/20" />
                <span class="text-[9px] font-black uppercase text-white/40">Notifikasi</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 w-2 rounded-full bg-[#B6F500]/50" />
                <span class="text-[9px] font-black uppercase text-[#B6F500]/60">Klaim</span>
              </div>
              <div class="flex items-center gap-2 border-l border-white/10 pl-4">
                <div class="h-[2px] w-4 bg-[#B6F500]" />
                <span class="text-[9px] font-black uppercase text-[#B6F500]">Ratio Klaim</span>
              </div>
            </div>
          </div>

          <div class="chart-container h-auto w-full mt-4">
            <VisXYContainer
              :data="chartData"
              :height="400"
              :padding="{ top: 10, bottom: 20, left: 20, right: 20 }"
            >
              <VisStackedBar
                :x="x"
                :y="y"
                :bar-padding="0.2"
                :rounded-corners="4"
                :color="['rgba(255, 255, 255, 0.1)', 'rgba(182, 245, 0, 0.5)']"
              />
              <VisLine
                :x="x"
                :y="yLine"
                color="#B6F500"
                :line-width="3"
              />
              <VisAxis
                type="x"
                :grid-line="false"
                :tick-format="(v: number) => chartData[v]?.month ?? ''"
                :num-ticks="chartData.length"
                tick-text-color="rgba(255, 255, 255, 0.3)"
              />
              <VisAxis
                type="y"
                :grid-line="false"
                tick-text-color="rgba(255, 255, 255, 0.1)"
              />
              <VisTooltip
                :triggers="{
                  [StackedBar.selectors.bar]: (d, i) => {
                    const item = chartData[Math.floor(i / 2)]
                    if (!item) return ''
                    return `
                      <div class='p-2 bg-black/80 border border-white/10 rounded-lg shadow-xl text-[10px] font-black uppercase italic'>
                        <div class='text-white/40'>${item.month}</div>
                        <div class='mt-1 flex justify-between gap-4'>
                          <span class='text-white/60'>Jumlah Notifikasi</span>
                          <span class='text-white'>${item.notificationQty}</span>
                        </div>
                        <div class='flex justify-between gap-4'>
                          <span class='text-[#B6F500]/60'>Jumlah Klaim</span>
                          <span class='text-[#B6F500]'>${item.claimQty}</span>
                        </div>
                        <div class='mt-1 border-t border-white/10 pt-1 flex justify-between gap-4'>
                          <span class='text-[#B6F500]'>Ratio Klaim</span>
                          <span class='text-[#B6F500]'>${item.ratio}%</span>
                        </div>
                      </div>
                    `
                  }
                }"
              />
            </VisXYContainer>
          </div>
        </div>

        <div class="space-y-6 2xl:space-y-8 xl:col-span-4">
          <div class="group relative flex h-64 cursor-pointer flex-col justify-between overflow-hidden rounded-[36px] bg-linear-to-br from-[#B6F500] to-[#8ac500] p-6 text-black shadow-2xl shadow-[#B6F500]/10 2xl:rounded-[48px] 2xl:p-10">
            <div class="relative z-10">
              <div class="flex items-center gap-2 opacity-60">
                <TrendingUp :size="14" />
                <span class="text-[10px] font-black uppercase tracking-widest">Market Intel</span>
              </div>
              <h4 class="mt-3 text-3xl font-black leading-tight tracking-tighter italic">
                Vendor MTC butuh perhatian khusus.
              </h4>
              <p class="mt-2 text-xs font-bold opacity-60">
                Klaim 'Rejected' meningkat 24% minggu ini.
              </p>
            </div>
            <button class="relative z-10 flex w-fit items-center gap-2 rounded-2xl bg-black px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white italic transition-transform hover:scale-110">
              Analisis <ArrowUpRight :size="14" />
            </button>
            <Package
              :size="180"
              class="absolute -bottom-10 -right-10 rotate-12 opacity-10 transition-transform duration-1000 group-hover:rotate-0"
            />
          </div>

          <div class="h-fit space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl 2xl:space-y-8 2xl:rounded-[40px] 2xl:p-10">
            <h3 class="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#B6F500] italic">
              <Users :size="16" /> Top CS Performance
            </h3>
            <div class="space-y-6">
              <div
                v-for="(v, i) in topCS"
                :key="i"
                class="group flex items-center gap-4"
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white/30 transition-colors group-hover:border-[#B6F500]/50">
                  0{{ i + 1 }}
                </div>
                <div class="flex-1 space-y-2">
                  <div class="flex justify-between text-[10px] font-black">
                    <span class="text-white/80 transition-colors group-hover:text-white italic">{{ v.branch }}</span>
                    <span class="text-white/30">{{ v.claims }} Klaim</span>
                  </div>
                  <div class="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      class="h-full rounded-full transition-all duration-1000"
                      :style="{ width: v.p, backgroundColor: v.color }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="showRecentClaims"
        class="overflow-hidden rounded-[36px] border border-white/10 bg-white/5 animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-300 2xl:rounded-[48px]"
      >
        <div class="flex flex-col gap-4 border-b border-white/5 bg-white/2 p-6 lg:flex-row lg:items-center lg:justify-between 2xl:p-10">
          <div>
            <h3 class="text-2xl font-black leading-none tracking-tighter uppercase italic">
              Daftar Klaim <span class="text-white/20">RMA Panel</span>
            </h3>
            <p class="mt-2 text-[10px] font-black uppercase tracking-widest text-white/20">
              Real-time status dari seluruh cabang
            </p>
          </div>
          <NuxtLink
            to="/dashboard/claims"
            class="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-[#B6F500] uppercase tracking-widest hover:bg-[#B6F500]/10 hover:border-[#B6F500]/30 hover:shadow-[0_0_20px_rgba(182,245,0,0.1)] transition-all duration-300 active:scale-95 group cursor-pointer"
          >
            Lihat Seluruh Database
            <ArrowRight
              :size="12"
              class="group-hover:translate-x-1 transition-transform"
            />
          </NuxtLink>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-240 text-left">
            <thead class="bg-white/5">
              <tr
                v-for="headerGroup in table.getHeaderGroups()"
                :key="headerGroup.id"
              >
                <th
                  v-for="header in headerGroup.headers"
                  :key="header.id"
                  class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 2xl:px-10"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr
                v-for="row in table.getRowModel().rows"
                :key="row.id"
                class="group cursor-pointer transition-all duration-300 hover:bg-white/5"
                @click="navigateTo(`/dashboard/claims/${row.original.id}`)"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="px-6 py-7 2xl:px-10"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="showSystemOverview"
        class="rounded-[36px] border border-dashed border-white/10 p-12 text-center"
      >
        <p class="text-sm font-bold text-white/20 uppercase tracking-widest italic">
          System Overview Widget (Sprint 4)
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom-5 {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-in {
  animation-duration: 0.8s;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fade-in;
}

.slide-in-from-bottom-5 {
  animation-name: slide-in-from-bottom-5;
}

table {
  border-collapse: separate;
  border-spacing: 0;
}

/* ── Chart hover animations ──
   Unovis uses @emotion/css which generates hashed class names
   with embedded labels like: css-1abc23-bar, css-xyz-barGroup
   We use attribute selectors [class*="-label"] to target them.
   Bars are rendered as <path> inside <g class="..barGroup..">
*/

/* Individual bar path elements */
g[class*="-barGroup"] > path[class*="-bar"] {
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              filter 0.4s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-box: fill-box;
  transform-origin: bottom center;
  cursor: pointer;
  outline: none;
}

/* Dim ALL bar groups when chart container is hovered */
.chart-container:hover g[class*="-barGroup"] > path[class*="-bar"] {
  opacity: 0.2;
  filter: saturate(0.3) brightness(0.6);
}

/* Highlight only the hovered bar group — scale up + glow */
.chart-container:hover g[class*="-barGroup"]:hover > path[class*="-bar"] {
  opacity: 1 !important;
  filter: brightness(1.4) saturate(1.3) drop-shadow(0 0 14px rgba(182, 245, 0, 0.5)) !important;
  transform: scaleY(1.04);
}

/* Line path glow on chart hover */
path[class*="-linePath"] {
  transition: filter 0.4s ease, opacity 0.4s ease;
}

.chart-container:hover path[class*="-linePath"] {
  filter: drop-shadow(0 0 8px rgba(182, 245, 0, 0.7));
}

/* Axis tick labels brighten on chart hover */
g[class*="-tick"] text {
  transition: fill 0.3s ease;
}

.chart-container:hover g[class*="-tick"] text {
  fill: rgba(255, 255, 255, 0.5) !important;
}

:root {
  --vis-axis-grid-color: rgba(255, 255, 255, 0.05);
  --vis-axis-tick-color: rgba(255, 255, 255, 0.1);
  --vis-dark-axis-grid-color: rgba(255, 255, 255, 0.05);
  --vis-dark-axis-tick-color: rgba(255, 255, 255, 0.1);
}
</style>
