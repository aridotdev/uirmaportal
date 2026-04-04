<script setup lang="ts">
withDefaults(defineProps<{
  steps: number
  currentStep: number
  labels?: string[]
  stepStatus?: Record<number, 'valid' | 'error' | 'default'>
}>(), {
  labels: () => [],
  stepStatus: () => ({})
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
            stepStatus[step] === 'error'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : currentStep >= step
                ? 'bg-[#B6F500] text-black shadow-[0_0_15px_rgba(182,245,0,0.3)]'
                : 'bg-white/5 text-white/20'
          ]"
        >
          <template v-if="stepStatus[step] === 'valid' && currentStep !== step">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </template>
          <template v-else>
            {{ step }}
          </template>
        </div>
        <span
          v-if="labels[step - 1]"
          :class="[
            'text-[8px] font-black uppercase tracking-widest',
            stepStatus[step] === 'error'
              ? 'text-red-400'
              : currentStep >= step ? 'text-[#B6F500]' : 'text-white/20'
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
