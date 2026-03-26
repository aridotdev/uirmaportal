<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  backTo?: string
  tag?: string
}>(), {
  description: undefined,
  backTo: undefined,
  tag: undefined
})
</script>

<template>
  <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
    <div class="flex items-start gap-4">
      <NuxtLink
        v-if="backTo"
        :to="backTo"
        class="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      </NuxtLink>
      <div>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            {{ title }}
          </h1>
          <span
            v-if="tag"
            class="rounded-lg bg-[#B6F500] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-black italic"
          >
            {{ tag }}
          </span>
          <slot name="after-title" />
        </div>
        <p
          v-if="description"
          class="mt-2 text-sm font-medium text-white/40"
        >
          {{ description }}
        </p>
      </div>
    </div>
    <div
      v-if="$slots.actions"
      class="flex flex-wrap gap-3"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
