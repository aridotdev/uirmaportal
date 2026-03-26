<script setup lang="ts">
import { Search, RefreshCw } from 'lucide-vue-next'

withDefaults(defineProps<{
  searchPlaceholder?: string
  showRefresh?: boolean
  showReset?: boolean
  hasActiveFilters?: boolean
}>(), {
  searchPlaceholder: 'Cari...',
  showRefresh: false,
  showReset: false,
  hasActiveFilters: false
})

const searchQuery = defineModel<string>('search', { default: '' })
const isRefreshing = defineModel<boolean>('refreshing', { default: false })

defineEmits<{
  refresh: []
  reset: []
}>()
</script>

<template>
  <section class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.10),transparent_28%),rgba(255,255,255,0.04)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl md:p-5">
    <!-- Search Row -->
    <div
      v-if="searchPlaceholder"
      class="flex flex-col gap-4 border-b border-white/6 pb-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div class="flex-1">
        <div class="group relative">
          <Search
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 transition-colors group-focus-within:text-[#B6F500]"
            :size="18"
          />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="h-14 w-full rounded-2xl border border-white/8 bg-black/20 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-white/18 transition-all focus:border-[#B6F500]/45 focus:outline-none focus:ring-4 focus:ring-[#B6F500]/10"
          >
        </div>
      </div>

      <div class="flex items-end gap-3 lg:pl-4">
        <button
          v-if="showRefresh"
          class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/45 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          :class="{ 'animate-spin': isRefreshing }"
          @click="$emit('refresh')"
        >
          <RefreshCw :size="20" />
        </button>
        <button
          v-if="showReset && hasActiveFilters"
          class="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-[11px] font-black uppercase tracking-[0.24em] text-white/65 transition-all hover:border-white/20 hover:text-white"
          @click="$emit('reset')"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <!-- Filter Pills Row -->
    <div class="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div class="min-w-0 flex-1">
        <p
          v-if="$slots.default"
          class="mb-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/30"
        >
          Filter by status
        </p>
        <div class="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          <slot />
        </div>
      </div>
      <div
        v-if="$slots.summary"
        class="shrink-0"
      >
        <slot name="summary" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
