<script setup lang="ts">
withDefaults(defineProps<{
  steps: number
  currentStep: number
  labels?: string[]
}>(), {
  labels: () => []
})
</script>

<template>
  <div class="flex items-center gap-4">
    <div
      v-for="step in steps"
      :key="step"
      class="flex items-center"
    >
      <div class="flex flex-col items-center gap-1">
        <div
          :class="[
            'flex h-10 w-10 items-center justify-center rounded-xl font-black transition-all duration-500',
            currentStep >= step
              ? 'bg-[#B6F500] text-black shadow-[0_0_15px_rgba(182,245,0,0.3)]'
              : 'bg-white/5 text-white/20'
          ]"
        >
          {{ step }}
        </div>
        <span
          v-if="labels[step - 1]"
          :class="[
            'text-[8px] font-black uppercase tracking-widest',
            currentStep >= step ? 'text-[#B6F500]' : 'text-white/20'
          ]"
        >
          {{ labels[step - 1] }}
        </span>
      </div>
      <div
        v-if="step < steps"
        :class="['mx-2 h-0.5 w-12 rounded-full', currentStep > step ? 'bg-[#B6F500]' : 'bg-white/5']"
      />
    </div>
  </div>
</template>
