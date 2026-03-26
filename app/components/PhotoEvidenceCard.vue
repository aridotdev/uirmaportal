<script setup lang="ts">
import { Camera, Trash2, Eye, ExternalLink } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  id: string
  label: string
  status?: 'PENDING' | 'VERIFIED' | 'REJECT' | null
  imageUrl?: string | null
  file?: File | null
  note?: string
  required?: boolean
  reviewMode?: boolean
}>(), {
  status: null,
  imageUrl: null,
  file: null,
  note: '',
  required: false,
  reviewMode: false
})

defineEmits<{
  upload: [id: string, event: Event]
  remove: [id: string]
  preview: [url: string]
}>()

const statusClasses = computed(() => {
  switch (props.status) {
    case 'VERIFIED':
      return 'bg-[#B6F500]/20 border-[#B6F500]/30 text-[#B6F500]'
    case 'REJECT':
      return 'bg-red-500/20 border-red-500/30 text-red-500'
    default:
      return 'bg-white/10 border-white/20 text-white/40'
  }
})

const hasImage = computed(() => !!props.imageUrl || !!props.file)
const borderClass = computed(() => {
  if (hasImage.value) return 'border-[#B6F500] bg-[#B6F500]/5'
  return 'border-white/10 bg-white/2 hover:border-white/20'
})
</script>

<template>
  <!-- Review Mode: Gallery card -->
  <div
    v-if="reviewMode"
    class="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a] transition-all hover:border-white/20"
  >
    <!-- Image -->
    <div class="relative aspect-square overflow-hidden bg-zinc-900">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="label"
        class="h-full w-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-100 scale-105"
      >
      <div
        v-else
        class="flex h-full items-center justify-center text-white/10"
      >
        <Camera :size="48" />
      </div>

      <!-- Status Overlay -->
      <div
        v-if="status"
        class="absolute right-4 top-4"
      >
        <span
          :class="[
            'rounded-xl border px-3 py-1.5 text-[8px] font-black uppercase tracking-widest backdrop-blur-md',
            statusClasses
          ]"
        >
          {{ status }}
        </span>
      </div>

      <!-- Hover Actions -->
      <div
        v-if="imageUrl"
        class="absolute inset-0 flex items-center justify-center gap-4 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <button
          class="rounded-2xl bg-white p-3 text-black transition-transform hover:scale-110"
          @click="$emit('preview', imageUrl!)"
        >
          <Eye :size="20" />
        </button>
        <button class="rounded-2xl bg-white/10 p-3 text-white backdrop-blur-md transition-transform hover:scale-110">
          <ExternalLink :size="20" />
        </button>
      </div>
    </div>

    <!-- Info Footer -->
    <div class="flex flex-col p-5">
      <p class="mb-1 text-[10px] font-black uppercase tracking-widest text-white/40">
        {{ label }}
      </p>
      <div
        v-if="status === 'REJECT' && note"
        class="mt-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3"
      >
        <p class="text-[9px] font-bold italic leading-relaxed text-red-400">
          "{{ note }}"
        </p>
      </div>
      <p
        v-else-if="note"
        class="mt-2 text-[9px] font-bold italic text-white/20"
      >
        {{ note }}
      </p>
    </div>
  </div>

  <!-- Upload Mode: Dropzone card -->
  <div
    v-else
    :class="[
      'relative h-64 overflow-hidden rounded-4xl border-2 border-dashed transition-all duration-300',
      borderClass
    ]"
  >
    <!-- Empty / dropzone -->
    <label
      v-if="!hasImage"
      :for="`file-${id}`"
      class="absolute inset-0 flex cursor-pointer flex-col items-center justify-center p-6 text-center"
    >
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 transition-transform group-hover:scale-110 group-hover:bg-[#B6F500]/10">
        <Camera class="h-6 w-6 text-white/40 group-hover:text-[#B6F500]" />
      </div>
      <p class="mb-1 text-sm font-black uppercase tracking-tight">
        {{ label }}
      </p>
      <p class="text-[10px] font-bold uppercase tracking-widest text-white/40">
        Click or drag image file
      </p>
      <div
        v-if="required"
        class="mt-4 rounded bg-red-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-red-500"
      >
        Required
      </div>
      <input
        :id="`file-${id}`"
        type="file"
        class="hidden"
        accept="image/*"
        @change="(e: Event) => $emit('upload', id, e)"
      >
    </label>

    <!-- Preview state -->
    <div
      v-else
      class="absolute inset-0 flex flex-col"
    >
      <div class="flex flex-1 items-center justify-center bg-zinc-900 p-2">
        <div class="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-black">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="label"
            class="h-full w-full object-contain"
          >
          <Camera
            v-else
            class="h-12 w-12 text-white/10"
          />
        </div>
      </div>
      <div class="flex items-center justify-between border-t border-white/5 bg-white/5 p-4">
        <div class="min-w-0">
          <p class="truncate text-[10px] font-black uppercase tracking-tight">
            {{ file?.name || label }}
          </p>
          <p
            v-if="file"
            class="text-[8px] uppercase tracking-widest text-white/40"
          >
            {{ ((file.size || 0) / 1024 / 1024).toFixed(2) }} MB
          </p>
        </div>
        <button
          class="rounded-xl bg-red-500/10 p-2 text-red-500 transition-colors hover:bg-red-500 hover:text-white"
          @click="$emit('remove', id)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
