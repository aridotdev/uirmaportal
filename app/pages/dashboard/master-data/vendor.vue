<script setup lang="ts">
import { Users, Search, Filter, Plus } from 'lucide-vue-next'

const vendors = [
  { id: 1, name: 'PT Multi Tekniktama', branch: 'Cirebon', status: 'Active', members: '12' },
  { id: 2, name: 'Global Service Center', branch: 'Jakarta Selatan', status: 'Active', members: '18' },
  { id: 3, name: 'Indo RMA Jaya', branch: 'Surabaya', status: 'Pending', members: '8' },
  { id: 4, name: 'Teknikalindo', branch: 'Medan', status: 'Inactive', members: '5' }
]
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-blue-400">
          <Users :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">Vendor Registry</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Vendor <span class="text-blue-400">Management</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Master data partner perbaikan dan service branch seluruh Indonesia.
        </p>
      </div>
      <div class="flex gap-4">
        <button class="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-widest italic transition-all hover:bg-white/10">
          <Filter :size="16" /> Sort
        </button>
        <button class="flex items-center gap-2 rounded-2xl bg-blue-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white italic shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
          <Plus :size="16" /> Add New Vendor
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-3 mb-10">
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Total Vendors
        </p>
        <p class="text-3xl font-black italic">
          142
        </p>
      </div>
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Active Branches
        </p>
        <p class="text-3xl font-black italic">
          86
        </p>
      </div>
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Pending Sync
        </p>
        <p class="text-3xl font-black italic">
          3
        </p>
      </div>
    </div>

    <div class="rounded-[36px] border border-white/10 bg-white/5 overflow-hidden backdrop-blur-2xl">
      <div class="p-6 border-b border-white/5">
        <div class="relative w-full max-w-md">
          <Search
            :size="18"
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
          />
          <input
            type="text"
            placeholder="Search vendor name or branch..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-blue-500/50"
          >
        </div>
      </div>
      <div class="p-6">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5">
              <th class="pb-6 px-4">
                Name
              </th>
              <th class="pb-6 px-4">
                Branch
              </th>
              <th class="pb-6 px-4">
                Members
              </th>
              <th class="pb-6 px-4">
                Status
              </th>
              <th class="pb-6 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="v in vendors"
              :key="v.id"
              class="group hover:bg-white/5 transition-colors"
            >
              <td class="py-6 px-4">
                <p class="text-sm font-black italic text-white/80 group-hover:text-white">
                  {{ v.name }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-bold text-white/40 group-hover:text-white/60 italic">
                  {{ v.branch }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-mono font-bold text-white/40">
                  {{ v.members }}
                </p>
              </td>
              <td class="py-6 px-4">
                <span :class="['inline-block rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest font-mono', v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-100']">
                  {{ v.status }}
                </span>
              </td>
              <td class="py-6 px-4 text-right">
                <button class="text-[10px] font-black uppercase tracking-widest text-blue-400 opacity-20 group-hover:opacity-100 transition-opacity underline">
                  Edit Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
