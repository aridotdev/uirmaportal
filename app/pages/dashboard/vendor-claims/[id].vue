<script setup lang="ts">
import {
  Package2,
  ArrowLeft,
  Pencil,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  X,
  AlertTriangle,
  MessageSquare,
  Check,
  Banknote
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

// ------- Types -------
type ItemDecision = 'PENDING' | 'ACCEPTED' | 'REJECTED'
type BatchStatus = 'CREATED' | 'PROCESSING' | 'COMPLETED'

interface VCItem {
  id: string
  claimId: string
  claimNumber: string
  modelName: string
  panelPartNumber: string
  ocSN: string
  defect: string
  inch: number
  branch: string
  decision: ItemDecision
  compensation?: number
  rejectReason?: string
}

interface VendorClaimBatch {
  id: string
  batchNumber: string
  vendor: string
  vendorName: string
  submittedDate: string
  status: BatchStatus
  items: VCItem[]
}

// ------- Route Param -------
const route = useRoute()
const batchId = route.params.id as string

// ------- Mock Data -------
const mockBatches: VendorClaimBatch[] = [
  {
    id: '2',
    batchNumber: 'VC-2026-002',
    vendor: 'SDP',
    vendorName: 'PT Sinar Display Prima',
    submittedDate: '2026-03-12',
    status: 'PROCESSING',
    items: [
      { id: 'i1', claimId: 'CLM-20260304-012', claimNumber: 'CLM-20260304-012', modelName: '50UHD123', panelPartNumber: 'PNL221133', ocSN: 'OC-77512', defect: 'No Backlight', inch: 50, branch: 'Medan', decision: 'ACCEPTED', compensation: 350000 },
      { id: 'i2', claimId: 'CLM-20260306-020', claimNumber: 'CLM-20260306-020', modelName: '43UHD123', panelPartNumber: 'PNL443300', ocSN: 'OC-65321', defect: 'Line Vertical', inch: 43, branch: 'Makassar', decision: 'REJECTED', rejectReason: 'Physical damage not covered by warranty.' },
      { id: 'i3', claimId: 'CLM-20260307-031', claimNumber: 'CLM-20260307-031', modelName: '32UHD123', panelPartNumber: 'PNL556622', ocSN: 'OC-33900', defect: 'Flickering', inch: 32, branch: 'Jakarta', decision: 'PENDING' },
      { id: 'i4', claimId: 'CLM-20260309-040', claimNumber: 'CLM-20260309-040', modelName: '55UHD123', panelPartNumber: 'PNL778811', ocSN: 'OC-22111', defect: 'Blank Screen', inch: 55, branch: 'Bekasi', decision: 'PENDING' },
      { id: 'i5', claimId: 'CLM-20260310-055', claimNumber: 'CLM-20260310-055', modelName: '65UHD123', panelPartNumber: 'PNL990033', ocSN: 'OC-11800', defect: 'Color Distort', inch: 65, branch: 'Surabaya', decision: 'PENDING' },
      { id: 'i6', claimId: 'CLM-20260311-060', claimNumber: 'CLM-20260311-060', modelName: '43UHD123', panelPartNumber: 'PNL112244', ocSN: 'OC-77321', defect: 'No Signal', inch: 43, branch: 'Bandung', decision: 'ACCEPTED', compensation: 275000 },
      { id: 'i7', claimId: 'CLM-20260312-072', claimNumber: 'CLM-20260312-072', modelName: '32UHD123', panelPartNumber: 'PNL334455', ocSN: 'OC-66987', defect: 'Line Vertical', inch: 32, branch: 'Solo', decision: 'PENDING' }
    ]
  }
]

const batch = ref<VendorClaimBatch>(
  mockBatches.find(b => b.id === batchId) ?? mockBatches[0]!
)

// ------- Status Configs -------
const batchStatusConfig = {
  CREATED: { label: 'Created', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  PROCESSING: { label: 'Processing', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
}

const decisionConfig = {
  PENDING: { label: 'Pending', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
}

// ------- Computed Summary -------
const pendingCount = computed(() => batch.value.items.filter(i => i.decision === 'PENDING').length)
const acceptedCount = computed(() => batch.value.items.filter(i => i.decision === 'ACCEPTED').length)
const rejectedCount = computed(() => batch.value.items.filter(i => i.decision === 'REJECTED').length)
const totalCompensation = computed(() =>
  batch.value.items
    .filter(i => i.decision === 'ACCEPTED' && i.compensation)
    .reduce((sum, i) => sum + (i.compensation ?? 0), 0)
)
const allDecided = computed(() => batch.value.items.every(i => i.decision !== 'PENDING'))

const completeBatch = () => {
  batch.value.status = 'COMPLETED'
  useToast().add({
    title: 'Batch Completed',
    description: `${batch.value.batchNumber} has been marked as completed.`,
    color: 'success'
  })
}

// ------- Decision Modal -------
const modalOpen = ref(false)
const editingItem = ref<VCItem | null>(null)
const modalDecision = ref<'ACCEPTED' | 'REJECTED' | null>(null)
const modalComp = ref<string>('')
const modalReason = ref<string>('')
const modalError = ref('')

const openModal = (item: VCItem) => {
  editingItem.value = item
  modalDecision.value = item.decision === 'PENDING' ? null : item.decision as 'ACCEPTED' | 'REJECTED'
  modalComp.value = item.compensation ? item.compensation.toString() : ''
  modalReason.value = item.rejectReason ?? ''
  modalError.value = ''
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  editingItem.value = null
}

const onModalOpenChange = (open: boolean) => {
  if (open) {
    modalOpen.value = true
    return
  }

  closeModal()
}

const saveDecision = () => {
  if (!modalDecision.value) {
    modalError.value = 'Pilih keputusan vendor.'
    return
  }
  if (modalDecision.value === 'ACCEPTED') {
    const val = parseFloat(modalComp.value)
    if (!modalComp.value || isNaN(val) || val <= 0) {
      modalError.value = 'Masukkan nominal kompensasi yang valid.'
      return
    }
  }
  if (modalDecision.value === 'REJECTED' && !modalReason.value.trim()) {
    modalError.value = 'Masukkan alasan penolakan.'
    return
  }
  if (!editingItem.value) return

  const idx = batch.value.items.findIndex(i => i.id === editingItem.value!.id)
  if (idx !== -1) {
    const item = batch.value.items[idx]
    if (item && modalDecision.value) {
      batch.value.items[idx] = {
        ...item,
        decision: modalDecision.value as ItemDecision,
        compensation: modalDecision.value === 'ACCEPTED' ? parseFloat(modalComp.value) : undefined,
        rejectReason: modalDecision.value === 'REJECTED' ? modalReason.value.trim() : undefined
      }
    }
  }
  closeModal()
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
</script>

<template>
  <div>
    <div class="p-6 lg:p-12 space-y-8">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div class="flex items-start gap-4">
          <NuxtLink
            to="/dashboard/vendor-claims"
            class="mt-1 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white shrink-0"
          >
            <ArrowLeft :size="18" />
          </NuxtLink>
          <div>
            <div class="flex items-center gap-3 mb-1">
              <Package2
                class="text-[#B6F500]"
                :size="20"
              />
              <h1 class="text-3xl font-black italic tracking-tighter uppercase">
                {{ batch.batchNumber }}
              </h1>
              <span
                :class="`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${batchStatusConfig[batch.status].color}`"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" />
                {{ batchStatusConfig[batch.status].label }}
              </span>
            </div>
            <p class="text-white/40 text-sm font-medium">
              <span class="font-black text-white/60">{{ batch.vendor }}</span> · {{ batch.vendorName }}
              &nbsp;·&nbsp; Submitted {{ formatDate(batch.submittedDate) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Complete Batch Action -->
      <div
        v-if="allDecided && batch.status !== 'COMPLETED'"
        class="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-5 py-4"
      >
        <CheckCircle2
          :size="18"
          class="shrink-0 text-emerald-400"
        />
        <p class="text-sm font-semibold text-emerald-300 flex-1">
          Semua item sudah memiliki keputusan. Batch siap di-complete.
        </p>
        <button
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          @click="completeBatch"
        >
          <Check :size="14" />
          Complete Batch
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div class="rounded-2xl border border-white/8 bg-white/2.5 p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/28 mb-2">
            Total Items
          </p>
          <div class="flex items-center gap-2">
            <Layers
              :size="18"
              class="text-[#B6F500]"
            />
            <p class="text-2xl font-black tracking-tight text-[#B6F500]">
              {{ batch.items.length }}
            </p>
          </div>
        </div>
        <div class="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400/50 mb-2">
            Pending
          </p>
          <div class="flex items-center gap-2">
            <Clock
              :size="18"
              class="text-orange-400"
            />
            <p class="text-2xl font-black tracking-tight text-orange-400">
              {{ pendingCount }}
            </p>
          </div>
          <div
            v-if="pendingCount > 0"
            class="mt-2 h-1 w-full rounded-full bg-orange-500/10 overflow-hidden"
          >
            <div
              class="h-full bg-orange-500 rounded-full transition-all"
              :style="{ width: `${(pendingCount / batch.items.length) * 100}%` }"
            />
          </div>
        </div>
        <div class="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-400/50 mb-2">
            Accepted
          </p>
          <div class="flex items-center gap-2">
            <CheckCircle2
              :size="18"
              class="text-emerald-400"
            />
            <p class="text-2xl font-black tracking-tight text-emerald-400">
              {{ acceptedCount }}
            </p>
          </div>
        </div>
        <div class="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-red-400/50 mb-2">
            Rejected
          </p>
          <div class="flex items-center gap-2">
            <XCircle
              :size="18"
              class="text-red-400"
            />
            <p class="text-2xl font-black tracking-tight text-red-400">
              {{ rejectedCount }}
            </p>
          </div>
        </div>
        <div class="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-amber-400/50 mb-2">
            Compensation
          </p>
          <div class="flex items-center gap-2">
            <Banknote
              :size="18"
              class="text-amber-400"
            />
            <p class="text-lg font-black tracking-tight text-amber-400">
              {{ formatIDR(totalCompensation) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Pending Alert -->
      <div
        v-if="pendingCount > 0"
        class="flex items-center gap-3 rounded-2xl border border-orange-500/25 bg-orange-500/8 px-5 py-4"
      >
        <AlertTriangle
          :size="18"
          class="shrink-0 text-orange-400"
        />
        <p class="text-sm font-semibold text-orange-300">
          <strong>{{ pendingCount }} item</strong> masih menunggu keputusan vendor. Klik tombol edit di baris yang bersangkutan untuk memasukkan keputusan.
        </p>
      </div>

      <!-- Items Table -->
      <div class="relative rounded-4xl border border-white/5 bg-[#0a0a0a]/50">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left min-w-200">
            <thead>
              <tr class="border-b border-white/5">
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Claim #
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Panel Part Number / OC SN
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Defect
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Decision
                </th>
                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Detail
                </th>
                <th class="px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Action
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr
                v-for="item in batch.items"
                :key="item.id"
                :class="[
                  'group transition-colors',
                  item.decision === 'PENDING' ? 'bg-orange-500/3 hover:bg-orange-500/6' : 'hover:bg-white/2'
                ]"
              >
                <!-- Claim Number -->
                <td class="px-6 py-5">
                  <div class="flex flex-col">
                    <NuxtLink
                      :to="`/dashboard/claims/${item.claimId}`"
                      class="font-black text-sm text-[#B6F500] tracking-tighter hover:underline transition-colors"
                    >
                      {{ item.claimNumber }}
                    </NuxtLink>
                    <span class="text-[10px] text-white/30 font-bold mt-0.5">{{ item.branch }} · {{ item.modelName }}</span>
                  </div>
                </td>

                <!-- Serial Numbers -->
                <td class="px-6 py-5">
                  <div class="flex flex-col gap-0.5">
                    <div class="text-[10px] text-white/50 font-bold font-mono">
                      <span class="text-white/25 mr-1">Panel Part Number</span>{{ item.panelPartNumber }}
                    </div>
                    <div class="text-[10px] text-white/50 font-bold font-mono">
                      <span class="text-white/25 mr-1">OC</span>{{ item.ocSN }}
                    </div>
                  </div>
                </td>

                <!-- Defect -->
                <td class="px-6 py-5">
                  <span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/50">
                    {{ item.defect }}
                  </span>
                </td>

                <!-- Decision Badge -->
                <td class="px-6 py-5">
                  <span
                    :class="`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${decisionConfig[item.decision].color}`"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-current" />
                    {{ decisionConfig[item.decision].label }}
                  </span>
                </td>

                <!-- Decision Detail -->
                <td class="px-6 py-5 max-w-55">
                  <template v-if="item.decision === 'ACCEPTED' && item.compensation">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-black text-emerald-400">{{ formatIDR(item.compensation) }}</span>
                    </div>
                  </template>
                  <template v-else-if="item.decision === 'REJECTED' && item.rejectReason">
                    <div class="flex items-start gap-1.5">
                      <MessageSquare
                        :size="12"
                        class="text-red-400 shrink-0 mt-0.5"
                      />
                      <span class="text-xs text-red-300/70 line-clamp-2 leading-relaxed">{{ item.rejectReason }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <span class="text-[10px] text-white/20 italic">—</span>
                  </template>
                </td>

                <!-- Action -->
                <td class="px-6 py-5">
                  <div class="flex justify-end">
                    <button
                      :class="[
                        'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all',
                        item.decision === 'PENDING'
                          ? 'bg-[#B6F500] text-black hover:scale-105 shadow-[0_4px_16px_rgba(182,245,0,0.25)]'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                      ]"
                      @click="openModal(item)"
                    >
                      <Pencil :size="12" />
                      {{ item.decision === 'PENDING' ? 'Input' : 'Edit' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ===== Decision Modal ===== -->
    <UModal
      v-model:open="modalOpen"
      :dismissible="true"
      :transition="true"
      :close="false"
      :ui="{
        content: 'bg-transparent shadow-none ring-0 border-0 p-0 max-w-lg w-full',
        overlay: 'bg-black/70 backdrop-blur-sm'
      }"
      @update:open="onModalOpenChange"
    >
      <template #content>
        <div class="relative rounded-4xl border border-white/10 bg-[#0f0f0f] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.6)] space-y-6">
          <!-- Close -->
          <button
            class="absolute right-5 top-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
            @click="closeModal"
          >
            <X :size="18" />
          </button>

          <!-- Title -->
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.28em] text-white/30 mb-1">
              Vendor Decision
            </p>
            <h2 class="text-xl font-black tracking-tighter text-white">
              {{ editingItem?.claimNumber }}
            </h2>
            <div class="flex flex-wrap gap-2 mt-2">
              <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black text-white/50 uppercase">{{ editingItem?.defect }}</span>
              <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black text-white/50 uppercase">{{ editingItem?.inch }}"</span>
              <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black text-white/50 uppercase">{{ editingItem?.branch }}</span>
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="modalError"
            class="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-300"
          >
            <AlertTriangle
              :size="14"
              class="shrink-0"
            />
            {{ modalError }}
          </div>

          <!-- Decision Pick -->
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/35 mb-3">
              Keputusan Vendor
            </p>
            <div class="grid grid-cols-2 gap-3">
              <button
                :class="[
                  'flex flex-col items-start gap-2 rounded-2xl border p-4 transition-all text-left',
                  modalDecision === 'ACCEPTED'
                    ? 'border-emerald-400/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(52,211,153,0.15)]'
                    : 'border-white/8 bg-white/2 hover:border-white/16'
                ]"
                @click="modalDecision = 'ACCEPTED'; modalError = ''"
              >
                <div
                  :class="[
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    modalDecision === 'ACCEPTED' ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30'
                  ]"
                >
                  <CheckCircle2 :size="18" />
                </div>
                <div>
                  <p class="text-sm font-black text-white/80">
                    Accepted
                  </p>
                  <p class="text-[10px] text-white/35">
                    Vendor menerima klaim
                  </p>
                </div>
              </button>
              <button
                :class="[
                  'flex flex-col items-start gap-2 rounded-2xl border p-4 transition-all text-left',
                  modalDecision === 'REJECTED'
                    ? 'border-red-400/60 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                    : 'border-white/8 bg-white/2 hover:border-white/16'
                ]"
                @click="modalDecision = 'REJECTED'; modalError = ''"
              >
                <div
                  :class="[
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    modalDecision === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-white/5 text-white/30'
                  ]"
                >
                  <XCircle :size="18" />
                </div>
                <div>
                  <p class="text-sm font-black text-white/80">
                    Rejected
                  </p>
                  <p class="text-[10px] text-white/35">
                    Vendor menolak klaim
                  </p>
                </div>
              </button>
            </div>
          </div>

          <!-- Compensation (ACCEPTED) -->
          <div
            v-if="modalDecision === 'ACCEPTED'"
            class="space-y-2"
          >
            <label class="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
              Nominal Kompensasi (IDR) <span class="text-emerald-400">*</span>
            </label>
            <div class="relative">
              <input
                v-model="modalComp"
                type="number"
                min="0"
                placeholder="Contoh: 350000"
                class="h-12 w-full rounded-2xl border border-white/8 bg-black/20 pl-10 pr-4 text-sm font-bold text-white placeholder:text-white/20 focus:border-emerald-400/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                @input="modalError = ''"
              >
            </div>
            <p
              v-if="modalComp"
              class="text-xs text-emerald-400/70 font-semibold"
            >
              {{ formatIDR(parseFloat(modalComp) || 0) }}
            </p>
          </div>

          <!-- Reject Reason (REJECTED) -->
          <div
            v-if="modalDecision === 'REJECTED'"
            class="space-y-2"
          >
            <label class="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
              Alasan Penolakan <span class="text-red-400">*</span>
            </label>
            <textarea
              v-model="modalReason"
              rows="3"
              placeholder="Jelaskan alasan penolakan vendor..."
              class="w-full rounded-2xl border border-white/8 bg-black/20 p-4 text-sm font-medium text-white placeholder:text-white/20 focus:border-red-400/50 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all resize-none"
              @input="modalError = ''"
            />
          </div>
          <!-- Footer Actions -->
          <div class="flex justify-end gap-3 pt-2">
            <button
              class="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white transition-all"
              @click="closeModal"
            >
              Batal
            </button>
            <button
              :class="[
                'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all',
                modalDecision === 'ACCEPTED'
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.3)]'
                  : modalDecision === 'REJECTED'
                    ? 'bg-red-500 text-white hover:bg-red-400 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
                    : 'bg-[#B6F500] text-black shadow-[0_5px_16px_rgba(182,245,0,0.2)] hover:scale-105'
              ]"
              @click="saveDecision"
            >
              <Check :size="14" />
              Simpan
            </button>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
button { transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease; }

textarea { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
input    { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
</style>
