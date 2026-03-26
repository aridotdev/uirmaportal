<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  value: string | number
  trend?: string
  color?: string
}>(), {
  trend: undefined,
  color: '#B6F500'
})
</script>

<template>
  <div class="group relative cursor-pointer overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all hover:border-[#B6F500]/30 hover:bg-white/10">
    <div class="relative z-10 mb-4 flex items-start justify-between">
      <div
        v-if="$slots.icon"
        class="rounded-2xl bg-white/5 p-3.5 transition-all group-hover:bg-[#B6F500] group-hover:text-black"
      >
        <slot name="icon" />
      </div>
      <span
        v-if="trend"
        :class="[
          'rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest italic',
          trend.includes('+') || trend.includes('%') && !trend.includes('-')
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-red-500/10 text-red-400'
        ]"
      >
        {{ trend }}
      </span>
    </div>
    <p class="relative z-10 mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
      {{ label }}
    </p>
    <h4
      class="relative z-10 text-3xl font-black tracking-tighter italic"
      :style="{ color }"
    >
      {{ value }}
    </h4>
  </div>
</template>
