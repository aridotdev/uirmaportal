<script setup lang="ts">
const props = withDefaults(defineProps<{
  pageSize: number
  pageSizeOptions: number[]
  visibleFrom: number
  visibleTo: number
  totalItems: number
  pageIndex: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
  itemLabel?: string
  accentClass?: string
  buttonClass?: string
  showPageSizeSelector?: boolean
}>(), {
  itemLabel: 'records',
  accentClass: 'text-[#B6F500]',
  buttonClass: 'text-[#B6F500]/55 hover:border-[#B6F500]/30 hover:bg-[#B6F500]/10 hover:text-[#B6F500]',
  showPageSizeSelector: true
})

const emit = defineEmits<{
  'update:pageSize': [value: number]
  'first': []
  'previous': []
  'next': []
  'last': []
}>()

const handlePageSizeChange = (value: string | number) => {
  const nextPageSize = Number(value)
  if (!Number.isFinite(nextPageSize) || nextPageSize <= 0) return

  emit('update:pageSize', nextPageSize)
}
</script>

<template>
  <div class="flex flex-col items-center justify-between gap-4 border-t border-white/5 bg-black/20 px-8 py-5 sm:flex-row">
    <div class="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
      <div
        v-if="props.showPageSizeSelector"
        class="flex items-center gap-2"
      >
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
          Rows
        </p>
        <USelect
          :model-value="props.pageSize"
          :items="props.pageSizeOptions"
          size="sm"
          variant="none"
          color="neutral"
          class="w-20"
          :ui="{
            base: 'justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/60 transition-all hover:border-white/20 data-[state=open]:border-[#B6F500]/40',
            value: 'text-xs font-black text-white/60',
            trailingIcon: 'text-white/30 transition-transform duration-200 group-data-[state=open]:rotate-180',
            content: 'border border-white/10 bg-[#080808] shadow-2xl rounded-xl overflow-hidden',
            viewport: 'p-1',
            item: 'text-xs font-black text-white/50 data-highlighted:text-black data-highlighted:before:bg-[#B6F500] rounded-lg',
            itemLabel: 'text-xs font-black'
          }"
          @update:model-value="handlePageSizeChange"
        />
      </div>
      <div
        v-if="props.showPageSizeSelector"
        class="hidden h-4 w-px bg-white/5 sm:block"
      />
      <div class="text-[10px] font-black uppercase tracking-widest text-white/30">
        Showing <span class="text-white/60">{{ props.visibleFrom }}-{{ props.visibleTo }}</span> of <span class="text-white/60">{{ props.totalItems }}</span> {{ props.itemLabel }}
      </div>
    </div>

    <div
      v-if="props.pageCount > 1"
      class="flex items-center gap-2"
    >
      <button
        :disabled="!props.canPreviousPage"
        :class="['flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/3 transition-all disabled:pointer-events-none disabled:opacity-20', props.buttonClass]"
        @click="emit('first')"
      >
        <UIcon
          name="i-lucide-chevrons-left"
          class="size-4"
        />
      </button>
      <button
        :disabled="!props.canPreviousPage"
        :class="['flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/3 transition-all disabled:pointer-events-none disabled:opacity-20', props.buttonClass]"
        @click="emit('previous')"
      >
        <UIcon
          name="i-lucide-chevron-left"
          class="size-4"
        />
      </button>
      <div class="flex items-center rounded-xl border border-white/5 bg-white/5 px-4 py-2">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
          Page <span :class="['mx-1', props.accentClass]">{{ props.pageIndex + 1 }}</span>
          of <span class="mx-1 text-white/80">{{ props.pageCount }}</span>
        </p>
      </div>
      <button
        :disabled="!props.canNextPage"
        :class="['flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/3 transition-all disabled:pointer-events-none disabled:opacity-20', props.buttonClass]"
        @click="emit('next')"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4"
        />
      </button>
      <button
        :disabled="!props.canNextPage"
        :class="['flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/3 transition-all disabled:pointer-events-none disabled:opacity-20', props.buttonClass]"
        @click="emit('last')"
      >
        <UIcon
          name="i-lucide-chevrons-right"
          class="size-4"
        />
      </button>
    </div>
  </div>
</template>
