<script setup lang="ts">
withDefaults(defineProps<{
  align?: 'between' | 'end' | 'center'
}>(), {
  align: 'between'
})
</script>

<template>
  <footer class="sticky bottom-0 z-30 border-t border-white/5 bg-[#050505]/90 px-8 py-6 backdrop-blur-md">
    <div
      :class="[
        'mx-auto flex max-w-7xl items-center gap-4',
        align === 'between' ? 'justify-between' : '',
        align === 'end' ? 'justify-end' : '',
        align === 'center' ? 'justify-center' : ''
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
