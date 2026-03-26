<script setup lang="ts">
import type { Component } from 'vue'

export interface TimelineItem {
  id: number | string
  date: string
  userName: string
  userRole: string
  action: string
  actionLabel?: string
  actionColor?: string
  note?: string | null
  icon?: Component
}

defineProps<{
  items: TimelineItem[]
}>()

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const defaultColors: Record<string, string> = {
  REJECT: 'text-red-500',
  REQUEST_REVISION: 'text-amber-400',
  SUBMIT: 'text-blue-400',
  REVIEW: 'text-indigo-400',
  APPROVE: 'text-emerald-400',
  ARCHIVE: 'text-white/40',
  CREATE: 'text-white/60',
  UPDATE: 'text-white/60',
  REVISION_SUBMIT: 'text-blue-400'
}

const getActionColor = (item: TimelineItem) => {
  return item.actionColor ?? defaultColors[item.action] ?? 'text-[#B6F500]'
}
</script>

<template>
  <div class="relative space-y-8 before:absolute before:bottom-2 before:left-6 before:top-2 before:w-[2px] before:bg-white/5">
    <div
      v-for="item in items"
      :key="item.id"
      class="group relative pl-16"
    >
      <!-- Icon Node -->
      <div class="absolute left-0 top-0 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0a0a0a] transition-colors group-hover:border-[#B6F500]/40">
        <component
          :is="item.icon"
          v-if="item.icon"
          :class="['h-5 w-5', getActionColor(item)]"
        />
        <div
          v-else
          :class="['h-3 w-3 rounded-full', item.action === 'REJECT' ? 'bg-red-500' : item.action === 'APPROVE' ? 'bg-emerald-500' : 'bg-white/20']"
        />
      </div>

      <!-- Content -->
      <div class="space-y-3">
        <div class="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div class="flex items-center gap-3">
            <p
              class="text-sm font-black uppercase tracking-tight"
              :class="getActionColor(item)"
            >
              {{ (item.actionLabel ?? item.action).replace(/_/g, ' ') }}
            </p>
            <span class="rounded-full border border-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
              {{ item.userRole }}
            </span>
          </div>
          <time class="text-[10px] font-bold uppercase tracking-widest text-white/20">
            {{ item.date }}
          </time>
        </div>

        <!-- Note block -->
        <div
          v-if="item.note"
          class="rounded-2xl border border-white/5 bg-white/2 p-5"
        >
          <div class="mb-3 flex items-center gap-2">
            <div class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-800 text-[8px] font-black uppercase">
              {{ getInitials(item.userName) }}
            </div>
            <span class="text-[10px] font-bold text-white/60">{{ item.userName }}</span>
          </div>
          <p class="text-xs font-medium italic leading-relaxed text-white/70">
            "{{ item.note }}"
          </p>
        </div>

        <!-- Simple user info if no note -->
        <div
          v-else
          class="flex items-center gap-2 pt-1 opacity-40"
        >
          <div class="flex h-4 w-4 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-[6px] font-black uppercase">
            {{ getInitials(item.userName) }}
          </div>
          <span class="text-[9px] font-bold uppercase tracking-widest">{{ item.userName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
