<script setup lang="ts">
import { Users, Search, Filter, Plus, MoreHorizontal, Camera, ClipboardCheck } from 'lucide-vue-next'
import { h } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'

import { PHOTO_TYPES, FIELD_NAMES } from '~~/shared/utils/constants'

interface Vendor {
  id: number
  code: string
  name: string
  requiredPhotos: string[]
  requiredFields: string[]
  isActive: boolean
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt?: number
}

const vendorList = ref<Vendor[]>([
  {
    id: 1,
    code: 'VND-MK-001',
    name: 'MOKA',
    requiredPhotos: [...PHOTO_TYPES], // All 6
    requiredFields: [...FIELD_NAMES],
    isActive: true,
    createdBy: 'System',
    updatedBy: 'System',
    createdAt: Date.now() - 10000000
  },
  {
    id: 2,
    code: 'VND-MC-002',
    name: 'MTC',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN'],
    requiredFields: [], // Tidak butuh field
    isActive: true,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 20000000
  },
  {
    id: 3,
    code: 'VND-SP-003',
    name: 'SDP',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'ODF', 'PANEL_SN'],
    requiredFields: [], // Tidak butuh field
    isActive: true,
    createdBy: 'Admin',
    updatedBy: 'Admin',
    createdAt: Date.now() - 30000000
  }
])

const columnHelper = createColumnHelper<Vendor>()

const columns = [
  columnHelper.accessor('code', {
    header: 'Vendor Code',
    cell: info => h('p', { class: 'text-xs font-mono font-black tracking-widest text-[#B6F500] italic uppercase' }, info.getValue())
  }),
  columnHelper.accessor('name', {
    header: 'Vendor Name',
    cell: info => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] font-black text-white/20 transition-all group-hover:border-blue-500/30 group-hover:text-blue-400' }, info.getValue().charAt(0)),
      h('p', { class: 'text-sm font-black italic text-white/80 group-hover:text-white transition-colors' }, info.getValue())
    ])
  }),
  columnHelper.accessor('requiredPhotos', {
    header: 'Required Config',
    cell: info => h('div', { class: 'flex items-center gap-4' }, [
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(Camera, { size: 12, class: 'text-white/20' }),
        h('span', { class: 'text-[10px] font-black text-white/40' }, info.getValue().length)
      ]),
      h('div', { class: 'flex items-center gap-1.5' }, [
        h(ClipboardCheck, { size: 12, class: 'text-white/20' }),
        h('span', { class: 'text-[10px] font-black text-white/40' }, info.row.original.requiredFields.length)
      ])
    ])
  }),
  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: info => h('span', {
      class: [
        'inline-block rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest font-mono shadow-lg transition-all group-hover:scale-105',
        info.getValue() ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
      ]
    }, info.getValue() ? 'ACTIVE' : 'INACTIVE')
  }),
  columnHelper.accessor('createdAt', {
    header: 'Registered',
    cell: info => h('p', { class: 'text-[10px] font-bold text-white/30 italic' }, new Date(info.getValue()).toLocaleDateString('id-ID'))
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: () => h('button', { class: 'text-white/20 hover:text-white transition-colors p-2' }, [
      h(MoreHorizontal, { size: 16 })
    ])
  })
]

const table = useVueTable({
  data: vendorList,
  columns,
  getCoreRowModel: getCoreRowModel()
})
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
          {{ vendorList.length }}
        </p>
      </div>
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Active Branches
        </p>
        <p class="text-3xl font-black italic">
          {{ vendorList.filter(v => v.isActive).length }}
        </p>
      </div>
      <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">
          Configured Fields
        </p>
        <p class="text-3xl font-black italic">
          {{ vendorList.reduce((acc, v) => acc + v.requiredFields.length, 0) }}
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
            placeholder="Search by vendor code or name..."
            class="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:border-blue-500/50"
          >
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 border-b border-white/5"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="px-6 py-6 2xl:px-10"
              >
                <FlexRender
                  :render="header.column.columnDef.header"
                  :props="header.getContext()"
                />
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="group hover:bg-white/5 transition-all duration-300"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-6 py-7 2xl:px-10"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
