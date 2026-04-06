<script setup lang="ts">
import { Upload, Trash2, AlertTriangle, ArrowRight, Camera } from 'lucide-vue-next'

defineProps<{
  id: string
  label: string
  oldImageUrl: string | null
  newFile: File | null
  newPreviewUrl: string | null
  rejectNote: string
}>()

const emit = defineEmits<{
  upload: [id: string, event: Event]
  remove: [id: string]
}>()
</script>

<template>
  <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-red-500/10 p-2 rounded-lg text-red-500">
          <AlertTriangle class="w-5 h-5" />
        </div>
        <div>
          <h3 class="font-black text-sm uppercase tracking-tight">
            {{ label }}
          </h3>
          <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest">
            RE-UPLOAD REQUIRED
          </p>
        </div>
      </div>
      <StatusBadge
        v-if="newFile"
        status="VERIFIED"
        variant="photo"
        size="sm"
      />
      <StatusBadge
        v-else
        status="REJECT"
        variant="photo"
        size="sm"
      />
    </div>

    <!-- Reject Note -->
    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
      <AlertTriangle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
      <p class="text-xs text-red-400 font-bold leading-relaxed italic">
        "{{ rejectNote }}"
      </p>
    </div>

    <!-- Side-by-side Compare -->
    <div class="grid grid-cols-2 gap-6">
      <!-- OLD Photo -->
      <div class="space-y-3">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">
          ORIGINAL (REJECT)
        </p>
        <div class="aspect-square rounded-2xl overflow-hidden border border-red-500/20 bg-zinc-900 relative">
          <img
            v-if="oldImageUrl"
            :src="oldImageUrl"
            :alt="`Old ${label}`"
            class="w-full h-full object-cover grayscale opacity-60"
          >
          <div
            v-else
            class="w-full h-full flex items-center justify-center"
          >
            <Camera class="w-12 h-12 text-white/10" />
          </div>
          <!-- Rejected overlay -->
          <div class="absolute inset-0 border-2 border-red-500/30 rounded-2xl pointer-events-none" />
          <div class="absolute top-3 right-3 bg-red-500/20 backdrop-blur-md px-2 py-1 rounded-lg border border-red-500/30">
            <span class="text-[8px] font-black uppercase tracking-widest text-red-500">REJECT</span>
          </div>
        </div>
      </div>

      <!-- NEW Photo / Upload Zone -->
      <div class="space-y-3">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/30 text-center">
          {{ newFile ? 'NEW UPLOAD' : 'UPLOAD REPLACEMENT' }}
        </p>
        <div
          :class="[
            'aspect-square rounded-2xl overflow-hidden border-2 border-dashed relative transition-all',
            newFile
              ? 'border-[#B6F500] bg-[#B6F500]/5'
              : 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500'
          ]"
        >
          <!-- Empty state: upload zone -->
          <label
            v-if="!newFile"
            :for="`compare-file-${id}`"
            class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center"
          >
            <Upload class="w-10 h-10 text-amber-500 mb-3" />
            <p class="text-xs font-black uppercase text-amber-500 mb-1">Click to Upload</p>
            <p class="text-[8px] font-bold text-white/30 uppercase tracking-widest">Max 5MB, image only</p>
            <input
              :id="`compare-file-${id}`"
              type="file"
              class="hidden"
              accept="image/*"
              @change="(e: Event) => emit('upload', id, e)"
            >
          </label>

          <!-- Filled state: preview -->
          <template v-else>
            <img
              v-if="newPreviewUrl"
              :src="newPreviewUrl"
              :alt="`New ${label}`"
              class="w-full h-full object-cover"
            >
            <div class="absolute top-3 right-3 bg-[#B6F500]/20 backdrop-blur-md px-2 py-1 rounded-lg border border-[#B6F500]/30">
              <span class="text-[8px] font-black uppercase tracking-widest text-[#B6F500]">NEW</span>
            </div>
            <button
              class="absolute bottom-3 right-3 p-2 bg-red-500/80 text-white rounded-xl hover:bg-red-500 transition-colors"
              type="button"
              @click="emit('remove', id)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Arrow indicator between columns -->
    <div class="flex justify-center -mt-4">
      <div class="bg-white/5 p-2 rounded-full border border-white/10">
        <ArrowRight class="w-4 h-4 text-white/30" />
      </div>
    </div>
  </div>
</template>
