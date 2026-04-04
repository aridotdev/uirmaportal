<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-vue-next'

interface LightboxImage {
  url: string
  label: string
  status?: string
}

const props = defineProps<{
  images: LightboxImage[]
  initialUrl: string
}>()

const emit = defineEmits<{
  close: []
}>()

const currentIndex = ref(props.images.findIndex(img => img.url === props.initialUrl) || 0)
const zoomLevel = ref(1)

const currentImage = computed(() => props.images[currentIndex.value])

const goNext = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    zoomLevel.value = 1
  }
}

const goPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    zoomLevel.value = 1
  }
}

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.5, 3)
}
const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.5, 0.5)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
  if (e.key === 'ArrowRight') goNext()
  if (e.key === 'ArrowLeft') goPrev()
  if (e.key === '+' || e.key === '=') zoomIn()
  if (e.key === '-') zoomOut()
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div
    class="fixed inset-0 z-100 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in"
    @click.self="emit('close')"
  >
    <!-- Top bar -->
    <div class="flex items-center justify-between p-6">
      <div class="flex items-center gap-3">
        <span class="text-[10px] font-black uppercase tracking-widest text-white/40">
          {{ currentIndex + 1 }} / {{ images.length }}
        </span>
        <span class="text-xs font-black uppercase">{{ currentImage?.label }}</span>
        <StatusBadge
          v-if="currentImage?.status"
          :status="currentImage.status"
          variant="photo"
          size="sm"
        />
      </div>
      <div class="flex items-center gap-2">
        <button
          class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          type="button"
          @click="zoomOut"
        >
          <ZoomOut class="w-5 h-5" />
        </button>
        <span class="text-xs font-black text-white/40 w-12 text-center">{{ Math.round(zoomLevel * 100) }}%</span>
        <button
          class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          type="button"
          @click="zoomIn"
        >
          <ZoomIn class="w-5 h-5" />
        </button>
        <button
          class="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ml-4"
          type="button"
          @click="emit('close')"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Image -->
    <div class="flex-1 flex items-center justify-center p-8 overflow-hidden">
      <button
        v-if="currentIndex > 0"
        class="absolute left-6 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors z-10"
        type="button"
        @click="goPrev"
      >
        <ChevronLeft class="w-6 h-6" />
      </button>

      <img
        :src="currentImage?.url"
        :alt="currentImage?.label"
        class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-200"
        :style="{ transform: `scale(${zoomLevel})` }"
      >

      <button
        v-if="currentIndex < images.length - 1"
        class="absolute right-6 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors z-10"
        type="button"
        @click="goNext"
      >
        <ChevronRight class="w-6 h-6" />
      </button>
    </div>

    <!-- Thumbnail strip -->
    <div class="flex justify-center gap-2 p-4">
      <button
        v-for="(img, idx) in images"
        :key="idx"
        :class="[
          'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
          idx === currentIndex ? 'border-[#B6F500] scale-110' : 'border-white/10 opacity-50 hover:opacity-80'
        ]"
        type="button"
        @click="currentIndex = idx; zoomLevel = 1"
      >
        <img
          :src="img.url"
          :alt="img.label"
          class="w-full h-full object-cover"
        >
      </button>
    </div>
  </div>
</template>
