<script setup lang="ts">
import { FileBox, Search, PackageOpen, LayoutGrid, Plus } from 'lucide-vue-next'

const models = [
  { id: 1, name: 'QLED 4K Q80C', category: 'TV', sku: 'QE55Q80C', size: '55"', status: 'Active' },
  { id: 2, name: 'Odyssey G7', category: 'Monitor', sku: 'LS28BG702E', size: '28"', status: 'Active' },
  { id: 3, name: 'Crystal UHD CU7100', category: 'TV', sku: 'UE43CU7100', size: '43"', status: 'Active' },
  { id: 4, name: 'Neo QLED 8K QN900C', category: 'TV', sku: 'QE85QN900C', size: '85"', status: 'Active' }
]
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-[#B6F500]">
          <FileBox :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">Model Registry</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Product <span class="text-[#B6F500]">Models</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Master data unit SKU, model name, dan spesifikasi dimensi.
        </p>
      </div>
      <div class="flex gap-4">
        <button class="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-widest italic transition-all hover:bg-white/10">
          <LayoutGrid :size="16" /> View All
        </button>
        <button class="flex items-center gap-2 rounded-2xl bg-[#B6F500] px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black italic shadow-lg shadow-[#B6F500]/20 transition-all hover:scale-105 active:scale-95">
          <Plus :size="16" /> Add Product SKU
        </button>
      </div>
    </div>

    <!-- Inventory / Models Hub -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
      <div
        v-for="item in ['TV', 'Monitor', 'Audio', 'Home App']"
        :key="item"
        class="group cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:border-[#B6F500]/40 transition-all hover:bg-white/10"
      >
        <PackageOpen
          :size="32"
          class="mb-4 text-white/20 group-hover:text-[#B6F500] transition-colors"
        />
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Catalog Category
        </p>
        <p class="text-xl font-black italic">
          {{ item }} Series
        </p>
      </div>
    </div>

    <div class="rounded-[36px] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl">
      <div class="p-6 border-b border-white/5 bg-white/2 flex justify-between items-center">
        <div class="relative w-full max-w-md">
          <Search
            :size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            type="text"
            placeholder="Search SKU or Model Name..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-[#B6F500]/50"
          >
        </div>
      </div>
      <div class="overflow-x-auto p-6">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5">
              <th class="pb-6 px-4">
                Model Name
              </th>
              <th class="pb-6 px-4">
                SKU / MPN
              </th>
              <th class="pb-6 px-4">
                Category
              </th>
              <th class="pb-6 px-4">
                Spec
              </th>
              <th class="pb-6 px-4 text-right">
                State
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="m in models"
              :key="m.id"
              class="group hover:bg-white/5 transition-colors"
            >
              <td class="py-6 px-4">
                <p class="text-sm font-black italic text-white/80 group-hover:text-white">
                  {{ m.name }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-mono font-bold text-[#B6F500] group-hover:text-[#B6F500] transition-colors">
                  {{ m.sku }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-bold text-white/40 italic">
                  {{ m.category }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors italic">
                  {{ m.size }} Screen
                </p>
              </td>
              <td class="py-6 px-4 text-right">
                <span :class="['inline-block rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-black/20', m.status === 'Active' ? 'bg-[#B6F500]/20 text-[#B6F500] border border-[#B6F500]/30' : 'bg-red-500/10 text-red-100 border border-red-500/20']">
                  {{ m.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
