<script setup lang="ts">
import { Building2, Package } from 'lucide-vue-next'

export interface RankingItem {
  name: string
  count: number
  approvalRate?: number
  revisionRate?: number
  color?: string
}

const props = defineProps<{
  title: string
  subtitle?: string
  items: RankingItem[]
  type?: 'branch' | 'vendor'
}>()

const maxCount = computed(() => Math.max(...props.items.map(i => i.count), 1))

const titleIcon = computed(() => props.type === 'vendor' ? Package : Building2)

const barColor = (item: RankingItem) => {
  if (item.color) return item.color
  if (props.type === 'vendor') return '#B6F500'
  return '#B6F500'
}
</script>

<template>
  <div class="rounded-4xl border border-white/5 bg-[#0a0a0a] p-8">
    <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
      <div class="rounded-lg bg-white/5 p-2">
        <component
          :is="titleIcon"
          class="h-5 w-5 text-white/60"
        />
      </div>
      <div>
        <h3 class="text-sm font-black uppercase tracking-tight">
          {{ title }}
        </h3>
        <p
          v-if="subtitle"
          class="text-[9px] font-bold uppercase tracking-widest text-white/25 mt-0.5"
        >
          {{ subtitle }}
        </p>
      </div>
    </div>

    <div class="space-y-5">
      <div
        v-for="(item, idx) in items"
        :key="item.name"
        class="group cursor-pointer"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-[9px] font-black text-white/30">
              {{ String(idx + 1).padStart(2, '0') }}
            </span>
            <span class="text-xs font-black uppercase tracking-tight">{{ item.name }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span
              v-if="item.approvalRate !== undefined"
              class="text-[9px] font-black uppercase tracking-widest text-emerald-400/60"
            >
              {{ item.approvalRate }}%
            </span>
            <span class="text-sm font-black italic text-white/70">{{ item.count }}</span>
          </div>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/5">
          <div
            class="h-full rounded-full transition-all duration-700"
            :style="{
              width: `${(item.count / maxCount) * 100}%`,
              backgroundColor: barColor(item),
              opacity: 1 - idx * 0.12
            }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
