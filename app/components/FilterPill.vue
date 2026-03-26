<script setup lang="ts">
defineProps<{
  label: string
  active: boolean
  activeClass: string
  idleClass: string
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    :class="[
      'group whitespace-nowrap rounded-2xl border px-4 py-3 text-left transition-all',
      active ? activeClass : idleClass
    ]"
    @click="$emit('click')"
  >
    <div class="flex items-center gap-2">
      <span
        :class="[
          'h-2 w-2 rounded-full bg-current transition-opacity',
          active ? 'opacity-90' : 'opacity-55 group-hover:opacity-80'
        ]"
      />
      <span class="text-[10px] font-black uppercase tracking-[0.22em] leading-none">
        {{ label }}
      </span>
    </div>
  </button>
</template>
