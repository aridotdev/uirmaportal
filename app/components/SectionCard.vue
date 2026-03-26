<script setup lang="ts">
withDefaults(defineProps<{
  padded?: boolean
  gradient?: boolean
}>(), {
  padded: true,
  gradient: false
})
</script>

<template>
  <div
    :class="[
      'rounded-4xl border border-white/5 overflow-hidden',
      gradient
        ? 'bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.08),transparent_26%),rgba(255,255,255,0.03)]'
        : 'bg-[#0a0a0a]',
      padded ? 'p-6 lg:p-8' : ''
    ]"
  >
    <!-- Optional header slot -->
    <div
      v-if="$slots.header"
      :class="['flex items-center gap-3 border-b border-white/5 pb-6', padded ? 'mb-8' : 'px-6 py-6 lg:px-8 mb-0']"
    >
      <slot name="header" />
    </div>
    <!-- Content -->
    <div :class="!padded && $slots.header ? 'p-6 lg:p-8' : ''">
      <slot />
    </div>
  </div>
</template>
