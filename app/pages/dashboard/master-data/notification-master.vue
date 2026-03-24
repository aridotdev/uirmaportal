<script setup lang="ts">
import { Bell, Search, History, CheckCircle2, XCircle, Plus } from 'lucide-vue-next'

const notifications = [
  { id: 1, code: 'N2024-88219', type: 'Voucher', status: 'Available', created: '2024-03-24' },
  { id: 2, code: 'N2024-88220', type: 'Voucher', status: 'Used', created: '2024-03-23' },
  { id: 3, code: 'N2024-88221', type: 'System', status: 'Expired', created: '2024-03-22' },
  { id: 4, code: 'N2024-88222', type: 'Voucher', status: 'Available', created: '2024-03-21' }
]
</script>

<template>
  <div class="px-5 py-6 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 2xl:py-8">
    <div class="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <div class="mb-3 flex items-center gap-2 text-amber-400">
          <Bell :size="20" />
          <span class="text-[10px] font-black uppercase tracking-[0.3em] italic">Code Registry</span>
        </div>
        <h2 class="text-4xl font-black leading-none tracking-tighter uppercase italic sm:text-5xl 2xl:text-6xl">
          Notification <span class="text-amber-400">Master</span>
        </h2>
        <p class="mt-3 max-w-3xl text-base font-medium tracking-tight text-white/30 italic sm:text-lg">
          Master data kode notifikasi, registrasi voucher, dan tracking status penggunaan.
        </p>
      </div>
      <div class="flex gap-4">
        <button class="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-[10px] font-black uppercase tracking-widest italic transition-all hover:bg-white/10">
          <History :size="16" /> Usage Log
        </button>
        <button class="flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-black italic shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95">
          <Plus :size="16" /> Register New Codes
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-4 mb-10">
      <div
        v-for="stat in [{ l: 'Total Codes', v: '1.2k', c: 'text-white/40' }, { l: 'Available', v: '842', c: 'text-emerald-400' }, { l: 'Used', v: '320', c: 'text-white/40' }, { l: 'Expired', v: '38', c: 'text-red-400' }]"
        :key="stat.l"
        class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
      >
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          {{ stat.l }}
        </p>
        <p :class="['text-3xl font-black italic', stat.c]">
          {{ stat.v }}
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
            placeholder="Search Notification Code / Voucher ID..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-amber-500/50"
          >
        </div>
      </div>
      <div class="overflow-x-auto p-6">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] font-black uppercase tracking-widest text-white/20 border-b border-white/5">
              <th class="pb-6 px-4">
                Notification Code
              </th>
              <th class="pb-6 px-4">
                Voucher Type
              </th>
              <th class="pb-6 px-4">
                Created Date
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
              v-for="n in notifications"
              :key="n.id"
              class="group hover:bg-white/5 transition-colors"
            >
              <td class="py-6 px-4">
                <p class="text-xs font-mono font-black tracking-widest text-white/80 group-hover:text-amber-400 transition-colors uppercase italic">
                  {{ n.code }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-[10px] font-black uppercase tracking-widest text-white/30 italic">
                  {{ n.type }}
                </p>
              </td>
              <td class="py-6 px-4">
                <p class="text-xs font-bold text-white/40 italic">
                  {{ n.created }}
                </p>
              </td>
              <td class="py-6 px-4">
                <div class="flex items-center gap-2">
                  <component
                    :is="n.status === 'Available' ? CheckCircle2 : (n.status === 'Used' ? History : XCircle)"
                    :size="14"
                    :class="[n.status === 'Available' ? 'text-emerald-400' : (n.status === 'Used' ? 'text-white/20' : 'text-red-400')]"
                  />
                  <span :class="['text-[9px] font-black uppercase tracking-widest italic font-mono', n.status === 'Available' ? 'text-emerald-400' : 'text-white/20']">
                    {{ n.status }}
                  </span>
                </div>
              </td>
              <td class="py-6 px-4 text-right">
                <button class="text-[10px] font-black uppercase tracking-widest text-amber-400 opacity-20 group-hover:opacity-100 transition-opacity underline">
                  View History
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
