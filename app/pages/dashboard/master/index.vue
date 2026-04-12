<script setup lang="ts">
import {
  Users,
  FileBox,
  Bell,
  AlertCircle,
  ArrowRight,
  Database
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const masterCards = [
  {
    title: 'Vendor Master',
    desc: 'Kelola data partner vendor dan service branch',
    icon: Users,
    to: '/dashboard/master/vendor',
    count: '24',
    color: '#B6F500'
  },
  {
    title: 'Product Model',
    desc: 'Database SKU, model name, dan spesifikasi unit',
    icon: FileBox,
    to: '/dashboard/master/product-model',
    count: '142',
    color: '#3b82f6'
  },
  {
    title: 'Notification Master',
    desc: 'Master data kode notifikasi dan status voucher',
    icon: Bell,
    to: '/dashboard/master/notification',
    count: '1.2k',
    color: '#f59e0b'
  },
  {
    title: 'Defect Master',
    desc: 'Katalog jenis kerusakan dan kategori defect',
    icon: AlertCircle,
    to: '/dashboard/master/defect',
    count: '48',
    color: '#ef4444'
  }
]
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-[#B6F500]">
          <Database :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">System Registry</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Master <span class="text-[#B6F500]">Data</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Central management for all core system entities and configurations.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
      <NuxtLink
        v-for="card in masterCards"
        :key="card.title"
        :to="card.to"
        class="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 transition-all hover:border-white/20 hover:bg-white/10"
      >
        <div
          class="absolute -right-4 -top-4 opacity-5 transition-all group-hover:opacity-10 group-hover:scale-110"
          :style="{ color: card.color }"
        >
          <component
            :is="card.icon"
            :size="120"
          />
        </div>

        <div class="relative z-10">
          <div
            class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 transition-all group-hover:scale-110"
            :style="{ color: card.color, borderColor: card.color + '33', border: '1px solid' }"
          >
            <component
              :is="card.icon"
              :size="24"
            />
          </div>

          <div class="mb-2 flex items-baseline gap-3">
            <h3 class="text-xl font-black italic text-white/90 group-hover:text-white transition-colors">
              {{ card.title }}
            </h3>
            <span class="text-[10px] font-black opacity-30">{{ card.count }} items</span>
          </div>

          <p class="mb-8 text-sm font-medium leading-relaxed text-white/40 italic">
            {{ card.desc }}
          </p>

          <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#B6F500] opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
            Open Registry <ArrowRight :size="12" />
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
