<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: object
  actionLabel?: string
  actionTo?: string
}>(), {
  title: 'Data tidak ditemukan',
  description: 'Belum ada data yang tersedia untuk ditampilkan.',
  icon: undefined,
  actionLabel: undefined,
  actionTo: undefined
})

defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-16 text-center">
    <div class="rounded-full bg-white/5 p-6">
      <component
        :is="icon || Inbox"
        :size="48"
        class="text-white/10"
      />
    </div>
    <div class="max-w-xs">
      <h5 class="text-sm font-black uppercase tracking-widest text-white/20">
        {{ title }}
      </h5>
      <p
        v-if="description"
        class="mt-2 text-xs text-white/15 uppercase tracking-wider leading-relaxed"
      >
        {{ description }}
      </p>
    </div>
    <NuxtLink
      v-if="actionTo"
      :to="actionTo"
      class="mt-2 rounded-xl bg-[#B6F500] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] text-black transition-all hover:scale-105"
    >
      {{ actionLabel || 'Action' }}
    </NuxtLink>
    <button
      v-else-if="actionLabel"
      class="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition-all hover:border-white/20 hover:text-white"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
