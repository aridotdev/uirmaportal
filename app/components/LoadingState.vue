<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  variant?: 'card' | 'table' | 'detail'
}>(), {
  rows: 4,
  variant: 'card'
})
</script>

<template>
  <!-- Card/List variant -->
  <div
    v-if="variant === 'card'"
    class="space-y-4"
  >
    <div
      v-for="i in rows"
      :key="i"
      class="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-6"
    >
      <div class="flex items-center gap-6">
        <div class="h-12 w-12 shrink-0 rounded-2xl bg-white/10" />
        <div class="flex-1 space-y-3">
          <div class="h-5 w-48 rounded-lg bg-white/10" />
          <div class="h-3 w-32 rounded-lg bg-white/5" />
        </div>
        <div class="hidden items-center gap-4 sm:flex">
          <div class="h-7 w-24 rounded-full bg-white/10" />
          <div class="h-10 w-10 rounded-full border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  </div>

  <!-- Table variant -->
  <div
    v-else-if="variant === 'table'"
    class="space-y-0 divide-y divide-white/5"
  >
    <div
      v-for="i in rows"
      :key="i"
      class="flex animate-pulse items-center gap-6 px-6 py-5"
    >
      <div class="h-4 w-28 rounded bg-white/10" />
      <div class="h-4 w-20 rounded bg-white/5" />
      <div class="h-4 w-32 rounded bg-white/5" />
      <div class="flex-1" />
      <div class="h-6 w-20 rounded-full bg-white/10" />
    </div>
  </div>

  <!-- Detail/section variant -->
  <div
    v-else
    class="animate-pulse space-y-6"
  >
    <div
      v-for="i in rows"
      :key="i"
      class="flex items-center justify-between"
    >
      <div class="flex items-center gap-4">
        <div class="h-2.5 w-2.5 rounded-full bg-white/10" />
        <div class="h-4 w-24 rounded-md bg-white/10" />
      </div>
      <div class="h-6 w-8 rounded-md bg-white/10" />
    </div>
  </div>
</template>
