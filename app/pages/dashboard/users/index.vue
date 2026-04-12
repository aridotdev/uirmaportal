<script setup lang="ts">
import { h } from 'vue'
import {
  createColumnHelper,
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useVueTable
} from '@tanstack/vue-table'
import {
  Loader2,
  Eye,
  Plus,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  X
} from 'lucide-vue-next'
import type { UserListItem } from '~/utils/types'
import { MOCK_AUTH_USERS, mapAuthUserToUserListItem, type AuthUserMock } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard', middleware: 'auth'
})

const authUsers = ref<AuthUserMock[]>(MOCK_AUTH_USERS.map(user => ({ ...user })))
const users = computed<UserListItem[]>(() => authUsers.value.map(mapAuthUserToUserListItem))

const searchQuery = ref('')
const isRefreshing = ref(false)
type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE'
const statusFilter = ref<StatusFilterType>('ALL')
const roleFilter = ref<string>('ALL')
const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const roleOptions = ['ALL', 'ADMIN', 'MANAGEMENT', 'QRCC', 'CS']
const pageSizeOptions = [5, 10, 25]

const roleStyles: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  MANAGEMENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  QRCC: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  CS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const matchesSearch = searchQuery.value === ''
      || u.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      || u.email.toLowerCase().includes(searchQuery.value.toLowerCase())
      || u.branch.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus = statusFilter.value === 'ALL'
      || (statusFilter.value === 'ACTIVE' ? u.isActive : !u.isActive)

    const matchesRole = roleFilter.value === 'ALL' || u.role === roleFilter.value

    return matchesSearch && matchesStatus && matchesRole
  })
})

const hasActiveFilters = computed(() => searchQuery.value.trim().length > 0 || statusFilter.value !== 'ALL' || roleFilter.value !== 'ALL')

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'ALL'
  roleFilter.value = 'ALL'
}

const handleRefresh = async () => {
  isRefreshing.value = true
  await new Promise(resolve => setTimeout(resolve, 600))
  isRefreshing.value = false
}

watch([searchQuery, statusFilter, roleFilter], () => {
  pagination.value.pageIndex = 0
})

watch(() => pagination.value.pageSize, () => {
  pagination.value.pageIndex = 0
})

const handlePageSizeChange = (nextPageSize: number) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: 0,
    pageSize: nextPageSize
  }
}

watch(filteredUsers, (list) => {
  const maxPageIndex = Math.max(0, Math.ceil(list.length / pagination.value.pageSize) - 1)
  if (pagination.value.pageIndex > maxPageIndex) {
    pagination.value.pageIndex = maxPageIndex
  }
})

const stats = computed(() => {
  return [
    { label: 'Total Users', value: users.value.length, color: 'text-white' },
    { label: 'Active', value: users.value.filter(u => u.isActive).length, color: 'text-[#B6F500]' },
    { label: 'Inactive', value: users.value.filter(u => !u.isActive).length, color: 'text-red-400' },
    { label: 'CS Agents', value: users.value.filter(u => u.role === 'CS').length, color: 'text-emerald-400' }
  ]
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ──────────────────────────────────────────────
// Modal state
// ──────────────────────────────────────────────

const isCreateModalOpen = ref(false)
const isCreating = ref(false)
const createFormTouched = ref(false)
const newUser = ref({
  name: '',
  email: '',
  role: 'CS' as UserListItem['role'],
  branch: ''
})

const branches = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar']

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const createFormErrors = computed(() => {
  const errors: Record<string, string> = {}
  const { name, email, role, branch } = newUser.value
  if (!name.trim()) {
    errors.name = 'Full name is required'
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  }
  if (!email.trim()) {
    errors.email = 'Email is required'
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (role === 'CS' && !branch) {
    errors.branch = 'Branch is required for CS role'
  }
  return errors
})

const isCreateFormValid = computed(() => Object.keys(createFormErrors.value).length === 0)

const closeCreateModal = () => {
  isCreateModalOpen.value = false
  createFormTouched.value = false
  newUser.value = { name: '', email: '', role: 'CS', branch: '' }
}

const createUser = async () => {
  createFormTouched.value = true
  if (!isCreateFormValid.value) return

  isCreating.value = true
  await new Promise(r => setTimeout(r, 800))

  const now = Date.now()
  authUsers.value.unshift({
    id: `USR-${String(authUsers.value.length + 1).padStart(3, '0')}`,
    name: newUser.value.name.trim(),
    email: newUser.value.email.trim(),
    emailVerified: false,
    image: null,
    createdAt: now,
    updatedAt: now,
    username: newUser.value.email.trim().split('@')[0] ?? null,
    displayUsername: null,
    role: newUser.value.role,
    banned: false,
    banReason: null,
    banExpires: null,
    branch: newUser.value.branch,
    isActive: true,
    lastLoginAt: null
  })

  isCreating.value = false
  closeCreateModal()
}

const toggleUserStatus = (userId: string) => {
  authUsers.value = authUsers.value.map(user =>
    user.id === userId
      ? {
          ...user,
          isActive: !user.isActive,
          updatedAt: Date.now()
        }
      : user
  )
}

const openUserDetail = (userId: string) => {
  navigateTo(`/dashboard/users/${userId}`)
}

const handleActionViewDetail = (event: MouseEvent, userId: string) => {
  event.stopPropagation()
  openUserDetail(userId)
}

const columnHelper = createColumnHelper<UserListItem>()

const columns = [
  columnHelper.accessor('name', {
    header: 'User',
    cell: info => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-800' }, [
        h('img', {
          src: `https://api.dicebear.com/9.x/avataaars/svg?seed=${info.getValue()}`,
          alt: info.getValue(),
          class: 'h-full w-full object-cover'
        })
      ]),
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'truncate text-sm font-black italic tracking-tight text-white/85' }, info.getValue()),
        h('p', { class: 'text-[10px] font-bold uppercase tracking-[0.2em] text-white/35' }, info.row.original.id)
      ])
    ])
  }),
  columnHelper.accessor('email', {
    header: 'Email',
    cell: info => h('p', { class: 'truncate text-sm font-semibold text-white/60' }, info.getValue())
  }),
  columnHelper.accessor('role', {
    header: 'Role',
    cell: info => h('span', {
      class: ['inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest', roleStyles[info.getValue()]]
    }, info.getValue())
  }),
  columnHelper.accessor('branch', {
    header: 'Branch',
    cell: info => h('p', { class: 'text-sm font-bold text-white/60' }, info.getValue())
  }),
  columnHelper.accessor('lastLoginAt', {
    header: 'Last Login',
    cell: info => h('p', { class: 'text-xs font-semibold text-white/45' }, formatDate(info.getValue()))
  }),
  columnHelper.accessor('isActive', {
    header: 'Status',
    cell: info => h('button', {
      class: [
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all',
        info.getValue()
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-400/40 hover:bg-emerald-500/15'
          : 'border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-400/40 hover:bg-red-500/15'
      ],
      onClick: (event: MouseEvent) => {
        event.stopPropagation()
        toggleUserStatus(info.row.original.id)
      }
    }, [
      h(info.getValue() ? ToggleRight : ToggleLeft, { size: 14 }),
      info.getValue() ? 'Active' : 'Inactive'
    ])
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    cell: (info) => {
      const userId = info.row.original.id

      return h('div', {
        class: 'flex justify-end',
        onClick: (event: MouseEvent) => event.stopPropagation()
      }, [
        h('button', {
          class: 'cursor-pointer inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/35 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white',
          title: 'View Detail',
          onClick: (event: MouseEvent) => handleActionViewDetail(event, userId)
        }, [
          h(Eye, { size: 15 })
        ])
      ])
    }
  })
]

const table = useVueTable({
  get data() {
    return filteredUsers.value
  },
  columns,
  state: {
    get pagination() {
      return pagination.value
    }
  },
  onPaginationChange: (updater) => {
    pagination.value = typeof updater === 'function'
      ? updater(pagination.value)
      : updater
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel()
})

const visibleFrom = computed(() => {
  if (!filteredUsers.value.length) return 0
  return pagination.value.pageIndex * pagination.value.pageSize + 1
})
const visibleTo = computed(() => {
  if (!filteredUsers.value.length) return 0
  return Math.min(filteredUsers.value.length, (pagination.value.pageIndex + 1) * pagination.value.pageSize)
})
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- Header -->
      <PageHeader
        title="User Management"
        description="Kelola akun pengguna sistem RMA Portal."
      >
        <template #actions>
          <button
            class="flex items-center gap-2 bg-[#B6F500] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_10px_30px_rgba(182,245,0,0.2)] active:scale-95"
            @click="isCreateModalOpen = true"
          >
            <UserPlus :size="16" />
            Add User
          </button>
        </template>
      </PageHeader>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div
          v-for="(stat, idx) in stats"
          :key="idx"
          class="rounded-[24px] border border-white/10 bg-white/5 p-5"
        >
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
            {{ stat.label }}
          </p>
          <p :class="['mt-1 text-2xl font-black italic', stat.color]">
            {{ String(stat.value).padStart(2, '0') }}
          </p>
        </div>
      </div>

      <FilterBar
        v-model:search="searchQuery"
        v-model:refreshing="isRefreshing"
        search-placeholder="Cari nama, email, atau cabang..."
        :show-refresh="true"
        :show-reset="true"
        :has-active-filters="hasActiveFilters"
        @refresh="handleRefresh"
        @reset="resetFilters"
      >
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Status</span>
            <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                v-for="status in (['ALL', 'ACTIVE', 'INACTIVE'] as const)"
                :key="status"
                :class="[
                  'whitespace-nowrap rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition-all',
                  statusFilter === status
                    ? status === 'ALL'
                      ? 'border-[#B6F500] bg-[#B6F500] text-black'
                      : status === 'ACTIVE'
                        ? 'border-emerald-400 bg-emerald-400 text-black'
                        : 'border-red-400 bg-red-400 text-black'
                    : 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07]'
                ]"
                @click="statusFilter = status"
              >
                {{ status === 'ALL' ? 'All Status' : status }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase tracking-widest text-white/20">Role</span>
            <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                v-for="role in roleOptions"
                :key="role"
                :class="[
                  'whitespace-nowrap rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition-all',
                  roleFilter === role
                    ? role === 'ALL'
                      ? 'border-[#B6F500] bg-[#B6F500] text-black'
                      : (roleStyles[role] || '') + ' border-current'
                    : 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07]'
                ]"
                @click="roleFilter = role"
              >
                {{ role === 'ALL' ? 'All Roles' : role }}
              </button>
            </div>
          </div>
        </div>
      </FilterBar>

      <!-- Users Table -->
      <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
        <LoadingState
          v-if="isRefreshing"
          variant="table"
          :rows="5"
        />
        <EmptyState
          v-else-if="filteredUsers.length === 0 && hasActiveFilters"
          title="Tidak ada data ditemukan"
          description="Coba ubah filter atau kata kunci pencarian."
          action-label="Reset Filter"
          @action="resetFilters"
        />
        <EmptyState
          v-else-if="users.length === 0"
          title="Belum ada data"
          description="Data akan muncul saat sudah tersedia."
        />
        <div
          v-else
          class="overflow-x-auto overflow-y-visible"
        >
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
                  class="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/50"
                >
                  <FlexRender
                    v-if="!header.isPlaceholder"
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
                class="group transition-colors hover:bg-white/2"
              >
                <td
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  class="px-6 py-4 align-middle text-sm"
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

        <DashboardTablePagination
          v-if="!isRefreshing && filteredUsers.length > 0"
          :page-size="pagination.pageSize"
          :page-size-options="pageSizeOptions"
          :visible-from="visibleFrom"
          :visible-to="visibleTo"
          :total-items="filteredUsers.length"
          :page-index="table.getState().pagination.pageIndex"
          :page-count="table.getPageCount()"
          :can-previous-page="table.getCanPreviousPage()"
          :can-next-page="table.getCanNextPage()"
          item-label="users"
          @update:page-size="handlePageSizeChange"
          @first="table.setPageIndex(0)"
          @previous="table.previousPage()"
          @next="table.nextPage()"
          @last="table.setPageIndex(table.getPageCount() - 1)"
        />
      </div>
    </div>

    <!-- Create User Modal -->
    <UModal
      v-model:open="isCreateModalOpen"
      :ui="{ content: 'bg-transparent shadow-none border-none ring-0 overflow-visible', overlay: 'bg-black/55 backdrop-blur-md' }"
      :dismissible="false"
    >
      <template #content>
        <div class="p-10 bg-[#0a0a0a] rounded-4xl relative overflow-hidden shadow-2xl border border-white/5">
          <!-- Close Button -->
          <button
            class="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all z-20 group"
            @click="closeCreateModal"
          >
            <X
              :size="18"
              class="group-hover:rotate-90 transition-transform"
            />
          </button>

          <div class="absolute -top-20 -right-20 w-40 h-40 bg-[#B6F500]/5 rounded-full blur-3xl pointer-events-none" />

          <div class="relative z-10">
            <div class="flex items-center gap-5 mb-8">
              <div class="w-16 h-16 rounded-2xl bg-[#B6F500]/10 flex items-center justify-center text-[#B6F500]">
                <UserPlus :size="32" />
              </div>
              <div>
                <h3 class="text-3xl font-black italic uppercase tracking-tighter leading-none">
                  Add New User
                </h3>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">
                  Create Account
                </p>
              </div>
            </div>

            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Full Name</label>
                <input
                  v-model="newUser.name"
                  type="text"
                  placeholder="Enter full name"
                  :class="[
                    'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm font-bold focus:outline-none transition-colors',
                    createFormTouched && createFormErrors.name
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/10 focus:border-[#B6F500]'
                  ]"
                >
                <p
                  v-if="createFormTouched && createFormErrors.name"
                  class="text-[10px] font-bold text-red-400 ml-2"
                >
                  {{ createFormErrors.name }}
                </p>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Email</label>
                <input
                  v-model="newUser.email"
                  type="email"
                  placeholder="user@sharp.co.id"
                  :class="[
                    'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm font-bold focus:outline-none transition-colors',
                    createFormTouched && createFormErrors.email
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/10 focus:border-[#B6F500]'
                  ]"
                >
                <p
                  v-if="createFormTouched && createFormErrors.email"
                  class="text-[10px] font-bold text-red-400 ml-2"
                >
                  {{ createFormErrors.email }}
                </p>
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Role</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    v-for="r in ['CS', 'QRCC', 'MANAGEMENT', 'ADMIN'] as const"
                    :key="r"
                    type="button"
                    :class="[
                      'rounded-xl border px-3 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all text-center flex items-center justify-center',
                      newUser.role === r
                        ? 'border-[#B6F500] bg-[#B6F500] text-black shadow-[0_0_20px_rgba(182,245,0,0.2)]'
                        : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10 hover:text-white'
                    ]"
                    @click="newUser.role = r"
                  >
                    {{ r }}
                  </button>
                </div>
              </div>
              <div
                v-if="newUser.role === 'CS'"
                class="space-y-2"
              >
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Branch</label>
                <UInputMenu
                  v-model="newUser.branch"
                  :items="branches"
                  placeholder="Select Branch"
                  size="xl"
                  variant="none"
                  :ui="{
                    root: 'w-full',
                    base: 'w-full bg-white/5 border border-white/10 rounded-xl px-5 text-sm font-bold focus:border-[#B6F500] transition-colors text-white shadow-none h-[46px] ring-0 focus:ring-0',
                    content: 'bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1',
                    item: 'text-white/50 data-highlighted:text-black data-highlighted:before:bg-[#B6F500] font-bold text-xs py-2.5 transition-colors'
                  }"
                />
                <p
                  v-if="createFormTouched && createFormErrors.branch"
                  class="text-[10px] font-bold text-red-400 ml-2"
                >
                  {{ createFormErrors.branch }}
                </p>
              </div>

              <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs font-bold text-amber-400">
                Default password ditentukan server config (env) — User must change on first login.
              </div>

              <div class="flex gap-4 pt-4">
                <button
                  :disabled="isCreating"
                  class="flex-1 bg-[#B6F500] text-black h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-[#B6F500]/20 hover:scale-[1.02] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  @click="createUser"
                >
                  <Loader2
                    v-if="isCreating"
                    :size="16"
                    class="animate-spin"
                  />
                  <Plus
                    v-else
                    :size="16"
                  />
                  {{ isCreating ? 'Creating...' : 'Create User' }}
                </button>
                <button
                  class="flex-1 bg-white/5 border border-white/10 text-white/40 h-14 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white/8 hover:text-white transition-all text-xs"
                  @click="closeCreateModal"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
