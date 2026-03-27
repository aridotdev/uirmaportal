<script setup lang="ts">
import { h, useTemplateRef } from 'vue'
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useVueTable,
  FlexRender
} from '@tanstack/vue-table'
import {
  Search,
  ArrowUpDown,
  History,
  ArrowRight,
  Eye
} from 'lucide-vue-next'
import { CalendarDate } from '@internationalized/date'
import type { AuditTrailTableRow } from '~/utils/types'
import type { SelectMenuItem } from '@nuxt/ui'
import type { UserRole } from '~~/shared/utils/constants'
import {
  getActionConfig,
  getActionLabel,
  getRoleBadgeConfig,
  getStatusBadgeConfig,
  isStatusChangeEvent,
  formatAuditTimestamp,
  ROLE_FILTER_OPTIONS
} from '~/utils/audit-trail-config'
import { useAuditTrail } from '~/composables/useAuditTrail'

definePageMeta({ layout: 'dashboard' })

// ──────────────────────────────────────────────
// State from composable
// ──────────────────────────────────────────────

const {
  filteredRows,
  isLoading,
  searchQuery,
  filterAction,
  filterRole,
  filterDateFrom,
  filterDateTo,
  hasActiveFilters,
  activeFilterSummary,
  pagination,
  pageSizeOptions,
  visibleFrom,
  visibleTo,
  totalServerRecords,
  fetchAuditTrail,
  resetFilters,
  handlePageSizeChange
} = useAuditTrail({ pageSize: 10, sortOrder: 'desc' })

// Fetch data on mount
await fetchAuditTrail()

// ──────────────────────────────────────────────
// Date filter: CalendarDate <-> string (YYYY-MM-DD)
// ──────────────────────────────────────────────

function stringToCalendarDate(str: string): CalendarDate | undefined {
  if (!str) return undefined
  const [y, m, d] = str.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new CalendarDate(y, m, d)
}

function calendarDateToString(val: CalendarDate): string {
  return `${val.year}-${String(val.month).padStart(2, '0')}-${String(val.day).padStart(2, '0')}`
}

const calendarDateFrom = computed({
  get: () => stringToCalendarDate(filterDateFrom.value),
  set: (val) => { filterDateFrom.value = val ? calendarDateToString(val) : '' }
})

const calendarDateTo = computed({
  get: () => stringToCalendarDate(filterDateTo.value),
  set: (val) => { filterDateTo.value = val ? calendarDateToString(val) : '' }
})

const dateFromRef = useTemplateRef('dateFromInput')
const dateToRef = useTemplateRef('dateToInput')

// ──────────────────────────────────────────────
// Action Filter Items (official Nuxt UI v4 SelectMenu pattern)
// ──────────────────────────────────────────────

const actionFilterItems = ref([
  { label: 'All Actions', value: 'ALL', icon: 'i-lucide-filter' },
  { label: 'Create', value: 'CREATE', icon: 'i-lucide-file-text' },
  { label: 'Submit', value: 'SUBMIT', icon: 'i-lucide-send' },
  { label: 'Review', value: 'REVIEW', icon: 'i-lucide-search' },
  { label: 'Approve', value: 'APPROVE', icon: 'i-lucide-shield-check' },
  { label: 'Reject', value: 'REJECT', icon: 'i-lucide-triangle-alert' },
  { label: 'Request Revision', value: 'REQUEST_REVISION', icon: 'i-lucide-triangle-alert' },
  { label: 'Archive', value: 'ARCHIVE', icon: 'i-lucide-archive' },
  { label: 'Update', value: 'UPDATE', icon: 'i-lucide-square-pen' },
  { label: 'Upload Photo', value: 'UPLOAD_PHOTO', icon: 'i-lucide-upload' },
  { label: 'Review Photo', value: 'REVIEW_PHOTO', icon: 'i-lucide-camera' },
  { label: 'Vendor Batch', value: 'GENERATE_VENDOR_CLAIM', icon: 'i-lucide-package' },
  { label: 'Vendor Decision', value: 'UPDATE_VENDOR_DECISION', icon: 'i-lucide-gavel' }
] satisfies SelectMenuItem[])

const selectedActionIcon = computed(() => {
  return actionFilterItems.value.find(i => i.value === filterAction.value)?.icon
})

// ──────────────────────────────────────────────
// TanStack Table
// ──────────────────────────────────────────────

const sorting = ref<SortingState>([{ id: 'createdAt', desc: true }])

watch(sorting, () => {
  pagination.value.pageIndex = 0
}, { deep: true })

const columnHelper = createColumnHelper<AuditTrailTableRow>()

const columns = [
  // Timestamp
  columnHelper.accessor('createdAt', {
    enableSorting: true,
    header: 'Timestamp',
    cell: (info) => {
      return h('span', {
        class: 'text-xs font-bold text-white/45 whitespace-nowrap tabular-nums'
      }, formatAuditTimestamp(info.getValue()))
    }
  }),

  // Claim Reference
  columnHelper.display({
    id: 'claimReference',
    header: 'Claim',
    cell: (info) => {
      const row = info.row.original
      return h('div', { class: 'min-w-0' }, [
        h('p', { class: 'text-sm font-black tracking-tight text-[#B6F500]' }, row.claimNumber),
        h('p', { class: 'text-[10px] font-bold text-white/25 mt-0.5' }, `ID ${row.claimId}`)
      ])
    }
  }),

  // Action
  columnHelper.accessor('action', {
    enableSorting: true,
    header: 'Action',
    cell: (info) => {
      const action = info.getValue()
      const config = getActionConfig(action)
      return h('div', {
        class: `inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${config.bgColor} ${config.borderColor}`
      }, [
        h(config.icon, { size: 12, class: config.color }),
        h('span', {
          class: `text-[10px] font-black uppercase tracking-widest ${config.color}`
        }, getActionLabel(action))
      ])
    }
  }),

  // Status Transition
  columnHelper.display({
    id: 'statusTransition',
    header: 'Status',
    cell: (info) => {
      const row = info.row.original
      const isChange = isStatusChangeEvent(row.fromStatus, row.toStatus)
      const fromConfig = getStatusBadgeConfig(row.fromStatus)
      const toConfig = getStatusBadgeConfig(row.toStatus)

      if (!isChange) {
        // Non-status event: show single muted badge
        return h('span', {
          class: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest opacity-50 ${fromConfig.classes}`
        }, fromConfig.label)
      }

      // Status change: from -> to with arrow
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h('span', {
          class: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${fromConfig.classes}`
        }, fromConfig.label),
        h(ArrowRight, { size: 10, class: 'text-white/25 shrink-0' }),
        h('span', {
          class: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${toConfig.classes}`
        }, toConfig.label)
      ])
    }
  }),

  // Actor
  columnHelper.display({
    id: 'actor',
    header: 'Actor',
    cell: (info) => {
      const row = info.row.original
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h('div', {
          class: 'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[9px] font-black uppercase text-white/50'
        }, row.actorInitials),
        h('div', { class: 'min-w-0' }, [
          h('p', { class: 'text-xs font-bold text-white/70 truncate' }, row.actorName),
          h('p', { class: 'text-[10px] font-bold text-white/20 mt-0.5' }, row.userId)
        ])
      ])
    }
  }),

  // Role
  columnHelper.accessor('userRole', {
    enableSorting: false,
    header: 'Role',
    cell: (info) => {
      const role = info.getValue()
      const config = getRoleBadgeConfig(role)
      return h('span', {
        class: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${config.classes}`
      }, config.label)
    }
  }),

  // Note
  columnHelper.accessor('note', {
    enableSorting: false,
    header: 'Note',
    cell: (info) => {
      const note = info.getValue()
      return h('p', {
        class: 'text-xs font-medium text-white/35 max-w-[220px] truncate',
        title: note ?? ''
      }, note ?? '-')
    }
  }),

  // Actions column (view claim)
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: (info) => {
      const row = info.row.original
      return h('div', { class: 'flex justify-end' }, [
        h('button', {
          class: 'p-2 rounded-xl bg-white/5 hover:bg-[#B6F500] hover:text-black transition-all opacity-0 group-hover:opacity-100',
          title: `View claim ${row.claimNumber}`,
          onClick: (event: MouseEvent) => {
            event.stopPropagation()
            navigateTo(`/dashboard/claims/${row.claimId}`)
          }
        }, [h(Eye, { size: 14 })])
      ])
    }
  })
]

const table = useVueTable({
  get data() { return filteredRows.value },
  columns,
  state: {
    get pagination() { return pagination.value },
    get sorting() { return sorting.value }
  },
  onPaginationChange: (updater) => {
    pagination.value = typeof updater === 'function'
      ? updater(pagination.value)
      : updater
  },
  onSortingChange: (updater) => {
    sorting.value = typeof updater === 'function'
      ? updater(sorting.value)
      : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel()
})
</script>

<template>
  <div class="p-6 lg:p-12 space-y-8">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="p-2 rounded-lg bg-white/5 border border-white/10">
            <History
              class="text-[#B6F500]"
              :size="20"
            />
          </div>
          <h1 class="text-3xl font-black italic tracking-tighter uppercase">
            Audit <span class="text-[#B6F500]">Trail</span>
          </h1>
        </div>
        <p class="text-white/40 text-sm font-medium">
          Catatan lengkap event bisnis per claim sesuai kontrak audit trail MVP.
        </p>
      </div>
    </div>

    <!-- Filter Panel -->
    <section class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.10),transparent_28%),rgba(255,255,255,0.04)] p-4 md:p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <!-- Search + Date Range + Reset -->
      <div class="flex flex-col gap-4 border-b border-white/6 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex-1">
          <div class="mb-3 text-[11px] font-bold tracking-[0.18em] text-white/28 uppercase">
            Search claim number, claim ID, note, user ID, or actor name.
          </div>
          <div class="group relative">
            <Search
              class="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 group-focus-within:text-[#B6F500] transition-colors"
              :size="18"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari claim number, ID, note, user ID, atau nama aktor..."
              class="h-14 w-full rounded-2xl border border-white/8 bg-black/20 pl-12 pr-4 text-sm font-semibold text-white placeholder:text-white/18 focus:border-[#B6F500]/45 focus:outline-none focus:ring-4 focus:ring-[#B6F500]/10 transition-all"
            >
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3 lg:pl-4">
          <!-- Date Range -->
          <div class="flex items-center gap-2">
            <UInputDate
              ref="dateFromInput"
              v-model="calendarDateFrom"
              locale="id-ID"
              variant="none"
              :ui="{
                base: 'h-14 rounded-2xl border border-white/8 bg-black/20 px-4 text-xs font-bold text-[#B6F500] focus-within:border-[#B6F500]/45 transition-all cursor-pointer',
                segment: 'text-[#B6F500] data-placeholder:text-[#B6F500] data-[focused]:bg-black/60 data-[focused]:text-black/20 data-[focused]:rounded'
              }"
            >
              <template #trailing>
                <UPopover :reference="dateFromRef?.inputsRef?.[3]?.$el">
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar-days"
                    aria-label="Open date picker"
                    class="px-0 text-white/25 hover:text-[#B6F500]"
                  />
                  <template #content>
                    <UCalendar
                      v-model="calendarDateFrom"
                      class="p-2"
                    />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
            <span class="text-white/20 text-xs font-bold">to</span>
            <UInputDate
              ref="dateToInput"
              v-model="calendarDateTo"
              locale="id-ID"
              variant="none"
              :ui="{
                base: 'h-14 rounded-2xl border border-white/8 bg-black/20 px-4 text-xs font-bold text-white/60 focus-within:border-[#B6F500]/45 transition-all cursor-pointer',
                segment: 'text-[#B6F500] data-placeholder:text-[#B6F500] data-[focused]:bg-black/60 data-[focused]:text-black/20 data-[focused]:rounded'
              }"
            >
              <template #trailing>
                <UPopover :reference="dateToRef?.inputsRef?.[3]?.$el">
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar-days"
                    aria-label="Open date picker"
                    class="px-0 text-white/25 hover:text-[#B6F500]"
                  />
                  <template #content>
                    <UCalendar
                      v-model="calendarDateTo"
                      class="p-2"
                    />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </div>

          <!-- Reset -->
          <button
            v-if="hasActiveFilters"
            class="inline-flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-[11px] font-black uppercase tracking-[0.24em] text-white/65 transition-all hover:border-white/20 hover:text-white"
            @click="resetFilters"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Action filter pills + Role filter + Summary -->
      <div class="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div class="min-w-0 flex-1 flex gap-4">
          <!-- Action filter -->
          <div>
            <p class="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
              Filter by action
            </p>
            <USelectMenu
              v-model="filterAction"
              :icon="selectedActionIcon"
              :items="actionFilterItems"
              value-key="value"
              :search-input="true"
              variant="none"
              class="w-56"
              :ui="{
                // Tambahkan 'flex items-center' di base untuk mencegah penumpukan
                base: 'relative flex items-center h-10 rounded-full border border-[#B6F500]/25 bg-[#B6F500]/8 px-4 gap-2.5 transition-all hover:border-[#B6F500]/40 hover:bg-[#B6F500]/15 data-[state=open]:border-[#B6F500]/50 data-[state=open]:bg-[#B6F500]/15 data-[state=open]:shadow-[0_0_24px_rgba(182,245,0,0.08)]',

                // Pastikan leading (kontainer icon) memiliki layout yang benar
                leading: 'flex items-center shrink-0',
                leadingIcon: 'text-[#B6F500] size-4',

                // Trailing icon (chevron) didorong ke kanan
                trailing: 'ms-auto flex items-center',
                trailingIcon: 'text-[#B6F500]/40 size-3 transition-transform duration-200',

                // Value/Teks
                value: 'text-[11px] font-bold uppercase tracking-[0.14em] text-[#B6F500]/90 truncate',

                // Dropdown content
                content: 'bg-[#0a0a0a] ring-1 ring-[#B6F500]/12 rounded-xl p-1 shadow-2xl shadow-black/60',
                item: 'rounded-lg data-[highlighted]:bg-[#B6F500]/8 py-1.5 gap-2.5',
                itemLeadingIcon: 'text-[#B6F500]/50',
                itemLabel: 'text-xs font-semibold text-white/65',
                itemTrailingIcon: 'text-[#B6F500]',
                input: 'border-b border-[#B6F500]/10 text-xs placeholder:text-white/20'
              }"
            />
          </div>

          <!-- Role filter -->
          <div>
            <p class="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
              Filter by role
            </p>
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-for="opt in ROLE_FILTER_OPTIONS"
                :key="opt.value"
                :class="[
                  'group inline-flex h-10 items-center whitespace-nowrap rounded-2xl border px-5 text-left transition-all',
                  filterRole === opt.value
                    ? (opt.value === 'ALL'
                      ? 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_10px_28px_rgba(182,245,0,0.28)]'
                      : getRoleBadgeConfig(opt.value as UserRole).classes)
                    : 'border-white/6 bg-white/[0.035] text-white/35 hover:border-white/16 hover:bg-white/[0.07] hover:text-white/55'
                ]"
                @click="filterRole = opt.value"
              >
                <span class="text-[10px] font-black uppercase tracking-[0.18em] leading-none">{{ opt.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Summary card -->
        <div class="rounded-2xl flex justify-between border border-white/8 bg-black/20 px-4 py-3 xl:w-[320px] xl:shrink-0">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.26em] text-white/28">
              Current View
            </p>
            <p class="mt-2 text-sm font-semibold text-white/78">
              {{ activeFilterSummary }}
            </p>
          </div>
          <div class="flex items-end justify-between">
            <p class="text-xl font-black tracking-tight text-[#B6F500]">
              {{ filteredRows.length.toString().padStart(2, '0') }}
            </p>
            <p class="text-xl font-semibold text-white/40 px-2">
              /
            </p>
            <p class="text-xl font-semibold text-white/40">
              {{ totalServerRecords.toString().padStart(2, '0') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Data Table -->
    <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
      <!-- Loading overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
      >
        <div class="h-10 w-10 border-4 border-[#B6F500]/20 border-t-[#B6F500] rounded-full animate-spin" />
      </div>

      <div class="overflow-x-auto overflow-y-visible">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr
              v-for="headerGroup in table.getHeaderGroups()"
              :key="headerGroup.id"
              class="border-b border-white/5"
            >
              <th
                v-for="header in headerGroup.headers"
                :key="header.id"
                class="px-5 py-5 text-[10px] font-black tracking-[0.2em] text-white/50"
              >
                <button
                  v-if="header.column.getCanSort()"
                  class="group flex items-center gap-2 text-left uppercase transition-colors hover:text-white/75"
                  @click="header.column.toggleSorting(header.column.getIsSorted() === 'asc')"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                  <ArrowUpDown
                    :size="10"
                    :class="[
                      'transition-all',
                      header.column.getIsSorted()
                        ? 'text-[#B6F500] opacity-100'
                        : 'opacity-35 group-hover:opacity-100'
                    ]"
                  />
                  <span
                    v-if="header.column.getIsSorted()"
                    class="text-[9px] tracking-[0.2em] text-[#B6F500]"
                  >
                    {{ header.column.getIsSorted() === 'asc' ? 'ASC' : 'DESC' }}
                  </span>
                </button>
                <div
                  v-else
                  class="flex items-center gap-2 uppercase"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <tr
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="group cursor-pointer transition-colors hover:bg-white/2"
              :class="{
                'bg-white/2': row.original.fromStatus !== row.original.toStatus
              }"
              @click="navigateTo(`/dashboard/claims/${row.original.claimId}`)"
            >
              <td
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-5 py-4 text-sm"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="table.getRowModel().rows.length === 0 && !isLoading">
              <td
                :colspan="columns.length"
                class="py-32 text-center"
              >
                <div class="flex flex-col items-center gap-4">
                  <div class="p-6 rounded-full bg-white/5">
                    <History
                      :size="48"
                      class="text-white/10"
                    />
                  </div>
                  <div>
                    <p class="text-white/20 font-bold uppercase tracking-widest text-sm">
                      Tidak ada event yang cocok dengan filter
                    </p>
                    <p class="text-white/10 text-xs mt-1">
                      Coba ubah kata kunci pencarian, filter action, role, atau rentang tanggal.
                    </p>
                  </div>
                  <button
                    v-if="hasActiveFilters"
                    class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/60 transition-all hover:border-white/20 hover:text-white"
                    @click="resetFilters"
                  >
                    Reset Filters
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <DashboardTablePagination
        :page-size="pagination.pageSize"
        :page-size-options="pageSizeOptions"
        :visible-from="visibleFrom"
        :visible-to="visibleTo"
        :total-items="filteredRows.length"
        :page-index="table.getState().pagination.pageIndex"
        :page-count="table.getPageCount()"
        :can-previous-page="table.getCanPreviousPage()"
        :can-next-page="table.getCanNextPage()"
        item-label="events"
        show-page-size-selector
        @update:page-size="handlePageSizeChange"
        @first="table.setPageIndex(0)"
        @previous="table.previousPage()"
        @next="table.nextPage()"
        @last="table.setPageIndex(table.getPageCount() - 1)"
      />
    </div>
  </div>
</template>

<style scoped>
tr {
  transition: all 0.2s ease;
}

input {
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

button {
  transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
