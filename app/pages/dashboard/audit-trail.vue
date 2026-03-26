<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  History,
  Search,
  FileText,
  Shield,
  Database,
  Upload,
  Camera,
  Edit3,
  Trash2,
  LogIn,
  Settings
} from 'lucide-vue-next'
import type { AuditLogEntry } from '~/utils/types'

definePageMeta({
  layout: 'dashboard'
})

// ──────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────

const auditLogs = ref<AuditLogEntry[]>([
  { id: 1, action: 'CREATE', entityType: 'Claim', entityId: 'CLM-2026-0342', userId: 'USR-001', userName: 'Zaina Riddle', userRole: 'CS', details: 'Created new RMA claim for MOKA panel', ipAddress: '192.168.1.45', createdAt: '2026-03-26T08:15:00Z' },
  { id: 2, action: 'SUBMIT', entityType: 'Claim', entityId: 'CLM-2026-0342', userId: 'USR-001', userName: 'Zaina Riddle', userRole: 'CS', details: 'Submitted claim for QRCC review', ipAddress: '192.168.1.45', createdAt: '2026-03-26T08:20:00Z' },
  { id: 3, action: 'REVIEW', entityType: 'Claim', entityId: 'CLM-2026-0342', userId: 'USR-003', userName: 'Nadia Putri', userRole: 'QRCC', details: 'Started review of claim', ipAddress: '10.0.1.22', createdAt: '2026-03-26T09:00:00Z' },
  { id: 4, action: 'APPROVE', entityType: 'Claim', entityId: 'CLM-2026-0341', userId: 'USR-003', userName: 'Nadia Putri', userRole: 'QRCC', details: 'Approved claim - all photos verified', ipAddress: '10.0.1.22', createdAt: '2026-03-26T09:15:00Z' },
  { id: 5, action: 'UPDATE', entityType: 'Vendor', entityId: 'VND-MOKA', userId: 'USR-002', userName: 'Ahmad Fauzi', userRole: 'ADMIN', details: 'Updated vendor photo rules for MOKA', ipAddress: '10.0.1.10', createdAt: '2026-03-25T17:30:00Z' },
  { id: 6, action: 'LOGIN', entityType: 'Session', entityId: 'SES-9982', userId: 'USR-004', userName: 'Budi Raharjo', userRole: 'MANAGEMENT', details: 'Successful login from Chrome/Windows', ipAddress: '192.168.2.88', createdAt: '2026-03-25T16:00:00Z' },
  { id: 7, action: 'REJECT', entityType: 'Claim', entityId: 'CLM-2026-0339', userId: 'USR-003', userName: 'Nadia Putri', userRole: 'QRCC', details: 'Rejected claim - Panel SN photo blurry', ipAddress: '10.0.1.22', createdAt: '2026-03-25T15:45:00Z' },
  { id: 8, action: 'UPLOAD_PHOTO', entityType: 'ClaimPhoto', entityId: 'CLM-2026-0340', userId: 'USR-005', userName: 'Siti Aminah', userRole: 'CS', details: 'Uploaded 4 evidence photos', ipAddress: '192.168.1.50', createdAt: '2026-03-25T14:30:00Z' },
  { id: 9, action: 'DELETE', entityType: 'Notification', entityId: 'NTF-2026-0088', userId: 'USR-002', userName: 'Ahmad Fauzi', userRole: 'ADMIN', details: 'Deleted expired notification record', ipAddress: '10.0.1.10', createdAt: '2026-03-25T12:00:00Z' },
  { id: 10, action: 'GENERATE_VENDOR_CLAIM', entityType: 'VendorClaim', entityId: 'VC-20260325-001', userId: 'USR-003', userName: 'Nadia Putri', userRole: 'QRCC', details: 'Generated vendor claim batch with 12 items for MOKA', ipAddress: '10.0.1.22', createdAt: '2026-03-25T11:00:00Z' },
  { id: 11, action: 'UPDATE', entityType: 'Setting', entityId: 'SYS-CONFIG', userId: 'USR-002', userName: 'Ahmad Fauzi', userRole: 'ADMIN', details: 'Updated system notification settings', ipAddress: '10.0.1.10', createdAt: '2026-03-25T10:00:00Z' },
  { id: 12, action: 'CREATE', entityType: 'User', entityId: 'USR-006', userId: 'USR-002', userName: 'Ahmad Fauzi', userRole: 'ADMIN', details: 'Created new CS user account for branch Makassar', ipAddress: '10.0.1.10', createdAt: '2026-03-24T16:30:00Z' }
])

const searchQuery = ref('')
const filterAction = ref('ALL')
const filterEntity = ref('ALL')
const currentPage = ref(1)
const itemsPerPage = 8

const actionOptions = ['ALL', 'CREATE', 'SUBMIT', 'REVIEW', 'APPROVE', 'REJECT', 'UPDATE', 'DELETE', 'LOGIN', 'UPLOAD_PHOTO', 'GENERATE_VENDOR_CLAIM']
const entityOptions = ['ALL', 'Claim', 'ClaimPhoto', 'Vendor', 'VendorClaim', 'Session', 'User', 'Notification', 'Setting']

const filteredLogs = computed(() => {
  return auditLogs.value.filter((log) => {
    const matchesSearch = searchQuery.value === ''
      || log.userName.toLowerCase().includes(searchQuery.value.toLowerCase())
      || log.entityId.toLowerCase().includes(searchQuery.value.toLowerCase())
      || log.details.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesAction = filterAction.value === 'ALL' || log.action === filterAction.value
    const matchesEntity = filterEntity.value === 'ALL' || log.entityType === filterEntity.value
    return matchesSearch && matchesAction && matchesEntity
  })
})

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / itemsPerPage))
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredLogs.value.slice(start, start + itemsPerPage)
})

watch([searchQuery, filterAction, filterEntity], () => {
  currentPage.value = 1
})

const actionConfig: Record<string, { color: string, icon: typeof History }> = {
  CREATE: { color: 'text-emerald-400', icon: FileText },
  SUBMIT: { color: 'text-blue-400', icon: Upload },
  REVIEW: { color: 'text-indigo-400', icon: Eye },
  APPROVE: { color: 'text-[#B6F500]', icon: Shield },
  REJECT: { color: 'text-red-400', icon: Trash2 },
  UPDATE: { color: 'text-white/60', icon: Edit3 },
  DELETE: { color: 'text-red-500', icon: Trash2 },
  LOGIN: { color: 'text-cyan-400', icon: LogIn },
  UPLOAD_PHOTO: { color: 'text-purple-400', icon: Camera },
  GENERATE_VENDOR_CLAIM: { color: 'text-amber-400', icon: Database },
  REQUEST_REVISION: { color: 'text-amber-400', icon: History }
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  MANAGEMENT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  QRCC: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  CS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActionConfig = (action: string) => {
  return actionConfig[action] || { color: 'text-white/40', icon: Settings }
}
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- Header -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
            Audit <span class="text-[#B6F500]">Trail</span>
          </h1>
          <p class="mt-2 text-sm font-medium text-white/40">
            Catatan lengkap semua aktivitas sistem dan perubahan data.
          </p>
        </div>
        <button class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white/40 transition-all hover:bg-white/10 hover:text-white">
          <Download :size="14" />
          Export Log
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="flex flex-1 items-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 transition-all focus-within:border-[#B6F500]/50 lg:max-w-md">
          <Search class="h-4.5 w-4.5 text-white/30" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari user, entity ID, atau detail..."
            class="w-full border-none bg-transparent px-4 text-sm font-medium text-white outline-none placeholder:text-white/20"
          >
        </div>
        <div class="flex gap-3">
          <div class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <Filter
              :size="14"
              class="text-white/30"
            />
            <select
              v-model="filterAction"
              class="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 outline-none appearance-none cursor-pointer"
            >
              <option
                v-for="a in actionOptions"
                :key="a"
                :value="a"
                class="bg-[#0a0a0a]"
              >
                {{ a === 'ALL' ? 'All Actions' : a.replace('_', ' ') }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
            <Database
              :size="14"
              class="text-white/30"
            />
            <select
              v-model="filterEntity"
              class="bg-transparent text-[10px] font-black uppercase tracking-widest text-white/60 outline-none appearance-none cursor-pointer"
            >
              <option
                v-for="e in entityOptions"
                :key="e"
                :value="e"
                class="bg-[#0a0a0a]"
              >
                {{ e === 'ALL' ? 'All Types' : e }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Audit Log Table -->
      <div class="overflow-hidden rounded-4xl border border-white/5 bg-[#0a0a0a]">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                <th class="px-6 py-5">
                  Timestamp
                </th>
                <th class="px-6 py-5">
                  User
                </th>
                <th class="px-6 py-5">
                  Action
                </th>
                <th class="px-6 py-5">
                  Entity
                </th>
                <th class="px-6 py-5">
                  Details
                </th>
                <th class="px-6 py-5 text-right">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <template v-if="paginatedLogs.length > 0">
                <tr
                  v-for="log in paginatedLogs"
                  :key="log.id"
                  class="group transition-colors hover:bg-white/2"
                >
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2 text-white/40">
                      <Clock
                        :size="14"
                        class="shrink-0"
                      />
                      <span class="text-xs font-bold whitespace-nowrap">{{ formatDate(log.createdAt) }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[10px] font-black uppercase">
                        {{ log.userName.split(' ').map(n => n[0]).join('') }}
                      </div>
                      <div>
                        <p class="text-sm font-bold">
                          {{ log.userName }}
                        </p>
                        <span :class="['px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border', roleColors[log.userRole] || 'border-white/10 text-white/30']">
                          {{ log.userRole }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div class="flex items-center gap-2">
                      <component
                        :is="getActionConfig(log.action).icon"
                        :size="14"
                        :class="getActionConfig(log.action).color"
                      />
                      <span :class="['text-xs font-black uppercase tracking-widest', getActionConfig(log.action).color]">
                        {{ log.action.replace(/_/g, ' ') }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-5">
                    <div>
                      <span class="text-[10px] font-bold uppercase tracking-widest text-white/30">{{ log.entityType }}</span>
                      <p class="text-xs font-black text-white/60 mt-0.5">
                        {{ log.entityId }}
                      </p>
                    </div>
                  </td>
                  <td class="px-6 py-5 max-w-[250px]">
                    <p class="text-xs font-medium text-white/40 truncate">
                      {{ log.details }}
                    </p>
                  </td>
                  <td class="px-6 py-5 text-right">
                    <span class="text-xs font-mono font-bold text-white/20">{{ log.ipAddress }}</span>
                  </td>
                </tr>
              </template>
              <tr v-else>
                <td
                  colspan="6"
                  class="px-8 py-20 text-center"
                >
                  <div class="flex flex-col items-center gap-4 text-white/20">
                    <History
                      :size="48"
                      :stroke-width="1"
                    />
                    <p class="text-xs font-black italic uppercase tracking-widest">
                      Tidak ada log yang ditemukan
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex flex-col items-center justify-between gap-4 border-t border-white/5 p-6 sm:flex-row">
          <p class="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Showing {{ paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0 }} to {{ Math.min(filteredLogs.length, currentPage * itemsPerPage) }} of {{ filteredLogs.length }} entries
          </p>
          <div class="flex items-center gap-2">
            <button
              :disabled="currentPage === 1"
              class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              @click="currentPage--"
            >
              <ChevronLeft class="h-4.5 w-4.5" />
            </button>
            <div class="flex items-center gap-1">
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
            </div>
            <button
              :disabled="currentPage === totalPages || totalPages === 0"
              class="rounded-xl border border-white/5 bg-white/5 p-2.5 text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
              @click="currentPage++"
            >
              <ChevronRight class="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
