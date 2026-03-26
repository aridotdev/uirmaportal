<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Users,
  X
} from 'lucide-vue-next'
import type { UserListItem } from '~/utils/types'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Mock Users
// ──────────────────────────────────────────────

const users = ref<UserListItem[]>([
  { id: 'USR-001', name: 'Zaina Riddle', email: 'zaina@sharp.co.id', role: 'CS', branch: 'Jakarta', isActive: true, lastLoginAt: '2026-03-26T08:15:00Z', createdAt: '2023-01-15' },
  { id: 'USR-002', name: 'Ahmad Fauzi', email: 'ahmad.fauzi@sharp.co.id', role: 'ADMIN', branch: 'Jakarta', isActive: true, lastLoginAt: '2026-03-26T07:00:00Z', createdAt: '2022-06-01' },
  { id: 'USR-003', name: 'Nadia Putri', email: 'nadia.putri@sharp.co.id', role: 'QRCC', branch: 'Jakarta', isActive: true, lastLoginAt: '2026-03-25T16:30:00Z', createdAt: '2023-03-10' },
  { id: 'USR-004', name: 'Budi Raharjo', email: 'budi.raharjo@sharp.co.id', role: 'MANAGEMENT', branch: 'Jakarta', isActive: true, lastLoginAt: '2026-03-25T12:00:00Z', createdAt: '2022-01-01' },
  { id: 'USR-005', name: 'Siti Aminah', email: 'siti.aminah@sharp.co.id', role: 'CS', branch: 'Surabaya', isActive: true, lastLoginAt: '2026-03-24T09:00:00Z', createdAt: '2023-08-20' },
  { id: 'USR-006', name: 'Rizky Pratama', email: 'rizky.pratama@sharp.co.id', role: 'CS', branch: 'Bandung', isActive: false, lastLoginAt: '2026-02-15T10:00:00Z', createdAt: '2024-01-05' },
  { id: 'USR-007', name: 'Dewi Lestari', email: 'dewi.lestari@sharp.co.id', role: 'QRCC', branch: 'Surabaya', isActive: true, lastLoginAt: '2026-03-25T14:00:00Z', createdAt: '2023-05-12' },
  { id: 'USR-008', name: 'Hendra Wijaya', email: 'hendra.wijaya@sharp.co.id', role: 'CS', branch: 'Medan', isActive: true, lastLoginAt: '2026-03-23T11:00:00Z', createdAt: '2024-03-01' },
  { id: 'USR-009', name: 'Fitri Handayani', email: 'fitri.handayani@sharp.co.id', role: 'CS', branch: 'Makassar', isActive: false, lastLoginAt: null, createdAt: '2024-09-15' },
  { id: 'USR-010', name: 'Andi Setiawan', email: 'andi.setiawan@sharp.co.id', role: 'MANAGEMENT', branch: 'Jakarta', isActive: true, lastLoginAt: '2026-03-24T08:00:00Z', createdAt: '2023-11-01' }
])

const searchQuery = ref('')
const filterRole = ref<string>('ALL')
const currentPage = ref(1)
const itemsPerPage = 6

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

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredUsers.value.slice(start, start + itemsPerPage)
})

watch([searchQuery, filterRole], () => {
  currentPage.value = 1
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

  users.value.unshift({
    id: `USR-${String(users.value.length + 1).padStart(3, '0')}`,
    name: newUser.value.name,
    email: newUser.value.email,
    role: newUser.value.role,
    branch: newUser.value.branch,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString()
  })

  isCreating.value = false
  isCreateModalOpen.value = false
  newUser.value = { name: '', email: '', role: 'CS', branch: '' }
}

const toggleUserStatus = (userId: string) => {
  users.value = users.value.map(u =>
    u.id === userId ? { ...u, isActive: !u.isActive } : u
  )
}
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

      <!-- Users Grid -->
      <div
        v-if="paginatedUsers.length > 0"
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="u in paginatedUsers"
          :key="u.id"
          class="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:border-white/15 transition-all overflow-hidden"
        >
          <!-- Status dot -->
          <div
            :class="[
              'absolute top-5 right-5 w-2.5 h-2.5 rounded-full',
              u.isActive ? 'bg-[#B6F500] shadow-[0_0_8px_#B6F500]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
            ]"
          />

          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 bg-zinc-800 shrink-0">
              <img
                :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`"
                :alt="u.name"
                class="w-full h-full object-cover"
              >
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-lg font-black italic tracking-tight truncate">
                {{ u.name }}
              </h3>
              <span :class="['inline-block mt-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border', roleStyles[u.role]]">
                {{ u.role }}
              </span>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div class="flex items-center gap-2 text-xs text-white/40">
              <Mail
                :size="13"
                class="shrink-0"
              />
              <span class="truncate font-bold">{{ u.email }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-white/40">
              <MapPin
                :size="13"
                class="shrink-0"
              />
              <span class="font-bold">{{ u.branch }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-white/30">
              <Shield
                :size="13"
                class="shrink-0"
              />
              <span class="font-bold">Last login: {{ formatDate(u.lastLoginAt) }}</span>
            </div>
          </div>

          <div class="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
            <button
              class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
              :class="u.isActive ? 'text-[#B6F500] hover:text-emerald-300' : 'text-red-400 hover:text-red-300'"
              @click="toggleUserStatus(u.id)"
            >
              <component
                :is="u.isActive ? ToggleRight : ToggleLeft"
                :size="18"
              />
              {{ u.isActive ? 'Active' : 'Inactive' }}
            </button>
            <button class="p-2 rounded-xl bg-white/5 border border-white/5 text-white/30 hover:text-white hover:bg-white/10 transition-all">
              <MoreHorizontal :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-col items-center gap-4 py-20 text-white/20"
      >
        <Users
          :size="48"
          :stroke-width="1"
        />
        <p class="text-xs font-black italic uppercase tracking-widest">
          Tidak ada user yang cocok
        </p>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-center gap-2"
      >
        <button
          :disabled="currentPage === 1"
          class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
          @click="currentPage--"
        >
          <ChevronLeft class="h-4.5 w-4.5" />
        </button>
        <button
          v-for="page in totalPages"
          :key="page"
          :class="[
            'h-10 w-10 rounded-xl border text-[10px] font-black transition-all',
            currentPage === page
              ? 'border-[#B6F500] bg-[#B6F500] text-black'
              : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20'
          ]"
          @click="currentPage = page"
        >
          {{ page.toString().padStart(2, '0') }}
        </button>
        <button
          :disabled="currentPage === totalPages"
          class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
          @click="currentPage++"
        >
          <ChevronRight class="h-4.5 w-4.5" />
        </button>
      </div>
    </div>

    <!-- Create User Modal -->
    <UModal
      v-model:open="isCreateModalOpen"
      :ui="{ content: 'bg-transparent shadow-none border-none ring-0 overflow-visible' }"
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
