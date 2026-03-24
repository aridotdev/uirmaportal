<script setup lang="ts">
import { AlertCircle, Search, Filter, Wrench, Settings2, Plus } from 'lucide-vue-next'

const defects = [
  { id: 1, name: 'Layar Retak / Pecah', category: 'Panel', code: 'D-001', severity: 'High' },
  { id: 2, name: 'Mati Total', category: 'Mainboard', code: 'D-002', severity: 'Critical' },
  { id: 3, name: 'Speaker Cempreng', category: 'Audio', code: 'D-003', severity: 'Medium' },
  { id: 4, name: 'Remote Tidak Berfungsi', category: 'Accessory', code: 'D-004', severity: 'Low' }
]
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-red-500">
          <AlertCircle :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">Issue Catalog</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Defect <span class="text-red-500">Master</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Katalog jenis kerusakan, kategori defect, dan standardisasi kode error.
        </p>
      </div>
      <div class="flex gap-4">
        <button class="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-widest italic transition-all hover:bg-white/10">
          <Filter :size="16" /> Category
        </button>
        <button class="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-red-500/20 transition-all hover:scale-105 active:scale-95">
          <Plus :size="16" /> Add Defect Code
        </button>
      </div>
    </div>

    <!-- Quick Tool Categories -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-4 mb-10">
      <div
        v-for="cat in [{ l: 'Panel', i: Wrench }, { l: 'Mainboard', i: Settings2 }, { l: 'Audio/Visual', i: AlertCircle }, { l: 'Power/Supply', i: Wrench }]"
        :key="cat.l"
        class="group cursor-pointer rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:border-red-500/30 transition-all hover:scale-[1.02]"
      >
        <component
          :is="cat.i"
          :size="24"
          class="mb-4 text-white/20 group-hover:text-red-500 transition-colors"
        />
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Standard Category
        </p>
        <p class="text-xl font-black italic">
          {{ cat.l }}
        </p>
      </div>
    </div>

    <div class="rounded-[36px] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl">
      <div class="p-6 border-b border-white/5 flex justify-between items-center">
        <div class="relative w-full max-w-md">
          <Search
            :size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            type="text"
            placeholder="Search defect type or error code..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-red-500/50"
          >
        </div>
      </div>
      <div class="overflow-x-auto p-6">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5">
              <th class="pb-6 px-4">
                Defect Name
              </th>
              <th class="pb-6 px-4">
                Code
              </th>
              <th class="pb-6 px-4">
                Category
              </th>
              <th class="pb-6 px-4">
                Severity
              </th>
              <th class="pb-6 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="d in defects"
              :key="d.id"
              class="group hover:bg-white/5 transition-colors"
            >
              <td class="py-6 px-4">
                <p class="text-sm font-black italic text-white/80 group-hover:text-white transition-colors">
                  {{ d.name }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-mono font-black text-red-500 italic">
                  {{ d.code }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-bold text-white/40 italic group-hover:text-white/60 transition-colors">
                  {{ d.category }}
                </p>
              </td>
              <td class="py-6 px-4">
                <span :class="['text-[9px] font-black uppercase tracking-[0.2em] italic', d.severity === 'Critical' ? 'text-red-500' : (d.severity === 'High' ? 'text-orange-400' : 'text-blue-400')]">
                  {{ d.severity }}
                </span>
              </td>
              <td class="py-6 px-4 text-right">
                <button class="text-[10px] font-black uppercase tracking-widest text-red-500 opacity-20 group-hover:opacity-100 transition-opacity underline">
                  Technical Guide
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
