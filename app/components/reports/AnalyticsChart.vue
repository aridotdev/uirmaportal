<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next'

export interface ChartSeries {
  key: string
  name: string
  color: string
}

const props = defineProps<{
  data: Record<string, unknown>[]
  series: ChartSeries[]
  xKey: string
  height?: number
  title?: string
  showLegend?: boolean
}>()

const height = computed(() => props.height ?? 280)

// Build categories object expected by LineChart
const categories = computed(() => {
  return Object.fromEntries(
    props.series.map(s => [s.key, { name: s.name, color: s.color }])
  )
})

const xFormatter = (tick: number) => {
  const row = props.data[tick]
  return row ? String(row[props.xKey]) : ''
}
</script>

<template>
  <div>
    <div
      v-if="title || showLegend"
      class="flex items-center justify-between mb-6"
    >
      <div
        v-if="title"
        class="flex items-center gap-3"
      >
        <div class="rounded-lg bg-white/5 p-2">
          <TrendingUp class="h-4 w-4 text-white/60" />
        </div>
        <h3 class="text-sm font-black uppercase tracking-tight">
          {{ title }}
        </h3>
      </div>
      <div
        v-if="showLegend"
        class="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest"
      >
        <div
          v-for="s in series"
          :key="s.key"
          class="flex items-center gap-2"
        >
          <div
            class="h-2 w-2 rounded-full"
            :style="{ backgroundColor: s.color }"
          />
          <span class="text-white/30">{{ s.name }}</span>
        </div>
      </div>
    </div>

    <ClientOnly>
      <LineChart
        :data="data"
        :categories="categories"
        :height="height"
        :x-formatter="xFormatter"
        :line-width="3"
        :hide-legend="true"
        :y-grid-line="false"
        :x-grid-line="false"
        :x-domain-line="false"
        :y-domain-line="false"
        :x-tick-line="false"
        :y-tick-line="false"
        :x-num-ticks="6"
        :y-num-ticks="5"
        :x-axis-config="{
          tickTextColor: 'rgba(255,255,255,0.35)',
          tickTextFontSize: '10px'
        }"
        :y-axis-config="{
          tickTextColor: 'rgba(255,255,255,0.35)',
          tickTextFontSize: '10px'
        }"
        :tooltip="{ followCursor: true }"
        class="rounded-3xl border border-white/5 bg-white/2 p-4"
      />
      <template #fallback>
        <div
          class="animate-pulse rounded-3xl border border-white/5 bg-white/2"
          :style="{ height: `${height}px` }"
        />
      </template>
    </ClientOnly>
  </div>
</template>
