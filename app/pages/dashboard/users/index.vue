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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Users,
  X
} from 'lucide-vue-next'
import type { UserListItem } from '~/utils/types'
import { MOCK_AUTH_USERS, mapAuthUserToUserListItem, type AuthUserMock } from '~/utils/mock-data'

definePageMeta({
  layout: 'dashboard'
})

const authUsers = ref<AuthUserMock[]>(MOCK_AUTH_USERS.map(user => ({ ...user })))
const users = computed<UserListItem[]>(() => authUsers.value.map(mapAuthUserToUserListItem))

const searchQuery = ref('')
const filterRole = ref<string>('ALL')
const pagination = ref({
  pageIndex: 0,
  pageSize: 6
})

const roleOptions = ['ALL', 'ADMIN', 'MANAGEMENT', 'QRCC', 'CS']

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
    const matchesRole = filterRole.value === 'ALL' || u.role === filterRole.value
    return matchesSearch && matchesRole
  })
})

watch([searchQuery, filterRole], () => {
  pagination.value.pageIndex = 0
})

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
const newUser = ref({
  name: '',
  email: '',
  role: 'CS' as UserListItem['role'],
  branch: ''
})

const branches = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Makassar']

const createUser = async () => {
  isCreating.value = true
  await new Promise(r => setTimeout(r, 800))

  const now = Date.now()
  authUsers.value.unshift({
    id: `USR-${String(authUsers.value.length + 1).padStart(3, '0')}`,
    name: newUser.value.name,
    email: newUser.value.email,
    emailVerified: false,
    image: null,
    createdAt: now,
    updatedAt: now,
    username: newUser.value.email.split('@')[0] ?? null,
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
  isCreateModalOpen.value = false
  newUser.value = { name: '', email: '', role: 'CS', branch: '' }
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
          src: `https://api.dicebear.com/7.x/avataaars/svg?seed=${info.getValue()}`,
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
          class: 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/35 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white',
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

const pageCount = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pagination.value.pageSize)))
const pageNumbers = computed(() => Array.from({ length: pageCount.value }, (_, index) => index + 1))
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
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            User <span class="text-[#B6F500]">Management</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Kelola akun pengguna sistem RMA Portal.
          </p>
        </div>
        <button
          class="flex items-center gap-2 bg-[#B6F500] text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:shadow-[0_10px_30px_rgba(182,245,0,0.2)] active:scale-95"
          @click="isCreateModalOpen = true"
        >
          <UserPlus :size="16" />
          Add User
        </button>
      </div>

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

      <!-- Filters -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="flex flex-1 items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 transition-all focus-within:border-[#B6F500]/50 lg:max-w-md">
          <Search class="h-4.5 w-4.5 text-white/30" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama, email, atau cabang..."
            class="w-full border-none bg-transparent px-4 text-sm font-medium text-white outline-none placeholder:text-white/20"
          >
        </div>
        <div class="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          <button
            v-for="role in roleOptions"
            :key="role"
            :class="[
              'whitespace-nowrap rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.22em] transition-all',
              filterRole === role
                ? role === 'ALL'
                  ? 'border-[#B6F500] bg-[#B6F500] text-black'
                  : (roleStyles[role] || '') + ' border-current'
                : 'border-white/6 bg-white/[0.035] text-white/55 hover:border-white/16 hover:bg-white/[0.07]'
            ]"
            @click="filterRole = role"
          >
            {{ role === 'ALL' ? 'All Roles' : role }}
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="relative overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]/50 backdrop-blur-sm">
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
                class="group cursor-pointer transition-colors hover:bg-white/2"
                @click="openUserDetail(row.original.id)"
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
              <tr v-if="table.getRowModel().rows.length === 0">
                <td
                  :colspan="columns.length"
                  class="py-20 text-center"
                >
                  <div class="flex flex-col items-center gap-4 text-white/20">
                    <Users
                      :size="48"
                      :stroke-width="1"
                    />
                    <p class="text-xs font-black italic uppercase tracking-widest">
                      Tidak ada user yang cocok
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col items-center justify-between gap-4 border-t border-white/5 bg-black/20 px-8 py-5 sm:flex-row">
          <div class="text-[10px] font-black uppercase tracking-widest text-white/30">
            Showing <span class="text-white/60">{{ visibleFrom }}-{{ visibleTo }}</span> of <span class="text-white/60">{{ filteredUsers.length }}</span> users
          </div>

          <div
            v-if="pageCount > 1"
            class="flex items-center gap-2"
          >
            <button
              :disabled="!table.getCanPreviousPage()"
              class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              @click="table.previousPage()"
            >
              <ChevronLeft class="h-4.5 w-4.5" />
            </button>
            <button
              v-for="page in pageNumbers"
              :key="page"
              :class="[
                'h-10 w-10 rounded-xl border text-[10px] font-black transition-all',
                table.getState().pagination.pageIndex + 1 === page
                  ? 'border-[#B6F500] bg-[#B6F500] text-black'
                  : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
              ]"
              @click="table.setPageIndex(page - 1)"
            >
              {{ page.toString().padStart(2, '0') }}
            </button>
            <button
              :disabled="!table.getCanNextPage()"
              class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              @click="table.nextPage()"
            >
              <ChevronRight class="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
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
            @click="isCreateModalOpen = false"
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
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#B6F500] transition-colors"
                >
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Email</label>
                <input
                  v-model="newUser.email"
                  type="email"
                  placeholder="user@sharp.co.id"
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold focus:outline-none focus:border-[#B6F500] transition-colors"
                >
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Role</label>
                  <select
                    v-model="newUser.role"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold appearance-none focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                    <option
                      v-for="r in ['CS', 'QRCC', 'MANAGEMENT', 'ADMIN'] as const"
                      :key="r"
                      :value="r"
                      class="bg-[#0a0a0a]"
                    >
                      {{ r }}
                    </option>
                  </select>
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Branch</label>
                  <select
                    v-model="newUser.branch"
                    class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm font-bold appearance-none focus:outline-none focus:border-[#B6F500] transition-colors"
                  >
                    <option
                      value=""
                      disabled
                      class="bg-[#0a0a0a]"
                    >
                      Select Branch
                    </option>
                    <option
                      v-for="b in branches"
                      :key="b"
                      :value="b"
                      class="bg-[#0a0a0a]"
                    >
                      {{ b }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs font-bold text-amber-400">
                Default password: <span class="font-mono">sharp1234</span> — User must change on first login.
              </div>

              <div class="flex gap-4 pt-4">
                <button
                  :disabled="!newUser.name || !newUser.email || !newUser.branch || isCreating"
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
                  @click="isCreateModalOpen = false"
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
