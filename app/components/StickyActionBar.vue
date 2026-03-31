<script setup lang="ts">
withDefaults(defineProps<{
  align?: 'between' | 'end' | 'center'
  containerClass?: string
}>(), {
  align: 'between',
  containerClass: 'mx-auto max-w-7xl'
})
</script>

<template>
  <footer class="sticky bottom-0 z-30 border-t border-white/5 bg-[#050505]/90 px-6 py-6 backdrop-blur-md md:px-12">
    <div
      :class="[
        'flex items-center gap-4',
        align === 'between' ? 'justify-between' : '',
        align === 'end' ? 'justify-end' : '',
        align === 'center' ? 'justify-center' : '',
        containerClass
      ]"
    >
      <slot name="left">
        <div />
      </slot>
      <div class="flex items-center gap-4">
        <slot />
      </div>
    </div>
  </footer>
</template>
