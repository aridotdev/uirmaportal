<script setup lang="ts">
// --- IMPORTS ---
import { computed, ref, watch, type Component } from 'vue'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Monitor,
  ShieldCheck,
  ShieldX,
  XCircle
} from 'lucide-vue-next'
import type { ClaimPhotoStatus, ClaimStatus } from '~~/shared/utils/constants'

// --- PAGE CONFIGURATION ---
definePageMeta({ layout: 'dashboard' })

// --- TYPE INTERFACES ---
type ReviewTab = 'info' | 'photos' | 'history'

interface ClaimPhotoItem {
  id: string
  type: string
  label: string
  status: ClaimPhotoStatus
  imageUrl: string
  note: string
}

interface ClaimHistoryItem {
  id: number
  date: string
  action: string
  actor: string
  role: string
  note: string
}

interface ClaimDetail {
  id: string
  claimNumber: string
  status: ClaimStatus
  createdAt: string
  updatedAt: string
  notificationCode: string
  vendor: string
  model: string
  inch: number
  branch: string
  panelSerialNo: string
  ocSerialNo: string
  defectName: string
  submittedBy: string
  qrccAssignee: string
  revisionNote?: string
  photos: ClaimPhotoItem[]
  history: ClaimHistoryItem[]
}

interface ClaimApiItem {
  id: number
  claimNumber: string
  notificationId: number
  modelName: string
  vendorName: string
  inch: number
  branch: string
  odfNumber: string | null
  panelSerialNo: string
  ocSerialNo: string
  defectName: string
  version: string | null
  week: string | null
  claimStatus: ClaimStatus
  submittedBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

// --- STATE VARIABLES ---
const route = useRoute()
const claimId = computed(() => String(route.params.id || ''))
const activeTab = ref<ReviewTab>('info')
const selectedRejectPhotoId = ref<string | null>(null)

const { data: claimRecord, pending: isLoading } = await useFetch<ClaimApiItem>(
  () => `/api/claims/${claimId.value}`,
  {
    watch: [claimId]
  }
)

// --- MOCK DATA ---
const defaultPhotos: ClaimPhotoItem[] = [
  {
    id: 'photo-1',
    type: 'CLAIM',
    label: 'Main Claim Photo',
    status: 'VERIFIED',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1200',
    note: 'Unit dan area defect terlihat jelas.'
  },
  {
    id: 'photo-2',
    type: 'CLAIM_ZOOM',
    label: 'Defect Zoom',
    status: 'PENDING',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200',
    note: 'Belum direview oleh QRCC.'
  },
  {
    id: 'photo-3',
    type: 'PANEL_SN',
    label: 'Panel Serial Number',
    status: 'PENDING',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200',
    note: 'Barcode terlihat, perlu validasi akhir.'
  },
  {
    id: 'photo-4',
    type: 'ODF',
    label: 'ODF Document',
    status: 'REJECT',
    imageUrl: 'https://images.unsplash.com/photo-1618044733300-9472154093ee?auto=format&fit=crop&q=80&w=1200',
    note: 'Dokumen kurang fokus pada bagian nomor ODF.'
  }
]

const claimStatusLabels: Record<ClaimStatus, string> = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  IN_REVIEW: 'review',
  NEED_REVISION: 'need revision',
  APPROVED: 'approved',
  ARCHIVED: 'archived'
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const claimStatus = ref<ClaimStatus>('IN_REVIEW')
const claimPhotos = ref<ClaimPhotoItem[]>([])
const claimHistory = ref<ClaimHistoryItem[]>([])

watch(claimRecord, (record) => {
  if (!record) {
    return
  }

  claimStatus.value = record.claimStatus
  claimPhotos.value = defaultPhotos.map(photo => ({ ...photo }))
  claimHistory.value = [
    {
      id: 1,
      date: formatDateTime(record.updatedAt),
      action: 'REVIEW',
      actor: 'System',
      role: 'SYSTEM',
      note: `Claim status saat ini ${claimStatusLabels[record.claimStatus]}.`
    },
    {
      id: 2,
      date: formatDateTime(record.createdAt),
      action: 'SUBMIT',
      actor: record.submittedBy,
      role: 'CS',
      note: `Claim ${record.claimNumber} diajukan untuk defect ${record.defectName}.`
    }
  ]
  selectedRejectPhotoId.value = null
}, { immediate: true })

const claim = computed<ClaimDetail>(() => {
  const record = claimRecord.value

  return {
    id: String(record?.id ?? claimId.value),
    claimNumber: record?.claimNumber ?? '-',
    status: claimStatus.value,
    createdAt: formatDateTime(record?.createdAt),
    updatedAt: formatDateTime(record?.updatedAt),
    notificationCode: `NTF-${String(record?.notificationId ?? '-').padStart(4, '0')}`,
    vendor: record?.vendorName ?? '-',
    model: record?.modelName ?? '-',
    inch: record?.inch ?? 0,
    branch: record?.branch ?? '-',
    panelSerialNo: record?.panelSerialNo ?? '-',
    ocSerialNo: record?.ocSerialNo ?? '-',
    defectName: record?.defectName ?? '-',
    submittedBy: record?.submittedBy ?? '-',
    qrccAssignee: 'Nadia Putri',
    revisionNote: 'Pastikan semua foto pendukung diverifikasi sebelum keputusan akhir.',
    photos: claimPhotos.value,
    history: claimHistory.value
  }
})

// --- UI CONFIGURATION (Tabs & Status) ---
const tabs = [
  { id: 'info' as const, label: 'Claim Info', icon: Info },
  { id: 'photos' as const, label: 'Photo Review', icon: ImageIcon },
  { id: 'history' as const, label: 'Claim History', icon: History }
]

const statusConfig = computed(() => {
  const configs: Record<ClaimStatus, { label: string, class: string, icon: Component }> = {
    DRAFT: { label: 'Draft', class: 'bg-white/10 text-white/60 border-white/10', icon: Clock3 },
    SUBMITTED: { label: 'Submitted', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock3 },
    IN_REVIEW: { label: 'In Review', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: ShieldCheck },
    NEED_REVISION: { label: 'Need Revision', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
    APPROVED: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    ARCHIVED: { label: 'Archived', class: 'bg-white/10 text-white/40 border-white/10', icon: History }
  }

  return configs[claim.value.status]
})

const photoStatusConfig: Record<ClaimPhotoStatus, { label: string, class: string, icon: Component }> = {
  PENDING: { label: 'Pending', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock3 },
  VERIFIED: { label: 'Verified', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  REJECT: { label: 'Reject', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
}

// --- COMPUTED PROPERTIES ---
const stats = computed(() => {
  const photos = claim.value.photos
  const verified = photos.filter(photo => photo.status === 'VERIFIED').length
  const pending = photos.filter(photo => photo.status === 'PENDING').length
  const rejected = photos.filter(photo => photo.status === 'REJECT').length

  return { verified, pending, rejected, total: photos.length }
})

const canApprove = computed(() => stats.value.pending === 0)

// --- ACTION METHODS ---
const verifyPhoto = (photoId: string) => {
  claimPhotos.value = claimPhotos.value.map((photo) => {
    if (photo.id !== photoId) {
      return photo
    }

    return {
      ...photo,
      status: 'VERIFIED',
      note: 'Foto diverifikasi oleh QRCC.'
    }
  })

  if (selectedRejectPhotoId.value === photoId) {
    selectedRejectPhotoId.value = null
  }
}

const rejectPhoto = (photoId: string) => {
  selectedRejectPhotoId.value = photoId

  claimPhotos.value = claimPhotos.value.map((photo) => {
    if (photo.id !== photoId) {
      return photo
    }

    return {
      ...photo,
      status: 'REJECT',
      note: photo.note && photo.note !== 'Belum direview oleh QRCC.' ? photo.note : ''
    }
  })
}

const updateRejectNote = (photoId: string, value: string) => {
  claimPhotos.value = claimPhotos.value.map((photo) => {
    if (photo.id !== photoId) {
      return photo
    }

    return {
      ...photo,
      note: value
    }
  })
}

const requestRevision = () => {
  claimStatus.value = 'NEED_REVISION'
}

const approveClaim = () => {
  if (!canApprove.value) {
    return
  }

  claimStatus.value = 'APPROVED'
}
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <div
        v-if="isLoading"
        class="flex min-h-[320px] items-center justify-center rounded-4xl border border-white/8 bg-white/5"
      >
        <div class="h-10 w-10 rounded-full border-4 border-[#B6F500]/20 border-t-[#B6F500] animate-spin" />
      </div>

      <!-- HEADER SECTION -->
      <div
        v-else
        class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"
      >
        <div class="flex items-start gap-4">
          <NuxtLink
            to="/dashboard/claims"
            class="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft :size="18" />
          </NuxtLink>

          <div>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-3xl font-black uppercase tracking-tighter italic sm:text-4xl">
                {{ claim.claimNumber }}
              </h1>
              <span :class="['inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]', statusConfig.class]">
                <component
                  :is="statusConfig.icon"
                  :size="12"
                />
                {{ statusConfig.label }}
              </span>
            </div>
            <p class="mt-2 text-sm font-medium text-white/40">
              Review claim dari {{ claim.branch }} untuk vendor {{ claim.vendor }}. Update terakhir {{ claim.updatedAt }}.
            </p>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT WRAPPER -->
      <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div class="space-y-6">
          <!-- TAB NAVIGATION -->
          <div class="flex flex-wrap gap-2 rounded-3xl border border-white/8 bg-white/5 p-2">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] transition-all',
                activeTab === tab.id ? 'bg-[#B6F500] text-black shadow-[0_10px_24px_rgba(182,245,0,0.2)]' : 'text-white/45 hover:text-white'
              ]"
              @click="activeTab = tab.id"
            >
              <component
                :is="tab.icon"
                :size="15"
              />
              {{ tab.label }}
            </button>
          </div>

          <!-- INFO TAB SECTION -->
          <section
            v-if="activeTab === 'info'"
            class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.08),transparent_26%),rgba(255,255,255,0.03)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
          >
            <div class="grid gap-6 lg:grid-cols-2">
              <div class="rounded-3xl border border-white/6 bg-black/20 p-5">
                <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/25">
                  Notification
                </p>
                <p class="mt-3 text-2xl font-black tracking-tight text-[#B6F500]">
                  {{ claim.notificationCode }}
                </p>
                <div class="mt-5 space-y-4 border-t border-white/6 pt-5 text-sm">
                  <div class="flex items-center justify-between gap-4">
                    <span class="text-white/35">Submitted By</span>
                    <span class="font-bold text-white/85">{{ claim.submittedBy }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span class="text-white/35">QRCC Assignee</span>
                    <span class="font-bold text-white/85">{{ claim.qrccAssignee }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <span class="text-white/35">Created At</span>
                    <span class="font-bold text-white/85">{{ claim.createdAt }}</span>
                  </div>
                </div>
              </div>

              <div class="rounded-3xl border border-white/6 bg-black/20 p-5">
                <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/25">
                  Defect Context
                </p>
                <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p class="text-white/30">
                      Model
                    </p>
                    <p class="mt-1 font-bold text-white/85">
                      {{ claim.model }}
                    </p>
                  </div>
                  <div>
                    <p class="text-white/30">
                      Size
                    </p>
                    <p class="mt-1 font-bold text-white/85">
                      {{ claim.inch }} inch
                    </p>
                  </div>
                  <div>
                    <p class="text-white/30">
                      Panel SN
                    </p>
                    <p class="mt-1 font-mono font-bold text-white/85">
                      {{ claim.panelSerialNo }}
                    </p>
                  </div>
                  <div>
                    <p class="text-white/30">
                      OC SN
                    </p>
                    <p class="mt-1 font-mono font-bold text-white/85">
                      {{ claim.ocSerialNo }}
                    </p>
                  </div>
                  <div>
                    <p class="text-white/30">
                      Vendor
                    </p>
                    <p class="mt-1 font-bold text-white/85">
                      {{ claim.vendor }}
                    </p>
                  </div>
                  <div>
                    <p class="text-white/30">
                      Branch
                    </p>
                    <p class="mt-1 font-bold text-white/85">
                      {{ claim.branch }}
                    </p>
                  </div>
                </div>

                <div class="mt-5 rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-red-400/60">
                    Defect Name
                  </p>
                  <p class="mt-2 text-lg font-black text-red-400">
                    {{ claim.defectName }}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- PHOTOS TAB SECTION -->
          <section
            v-else-if="activeTab === 'photos'"
            class="space-y-5"
          >
            <div
              v-for="photo in claim.photos"
              :key="photo.id"
              class="overflow-hidden rounded-4xl border border-white/8 bg-[#0a0a0a]/70"
            >
              <div class="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div class="border-b border-white/6 bg-black/20 lg:border-b-0 lg:border-r lg:border-white/6">
                  <img
                    :src="photo.imageUrl"
                    :alt="photo.label"
                    class="h-full min-h-[250px] w-full object-cover"
                  >
                </div>

                <div class="p-6">
                  <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div class="flex flex-wrap items-center gap-3">
                        <h3 class="text-xl font-black tracking-tight text-white">
                          {{ photo.label }}
                        </h3>
                        <span class="rounded-xl border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                          {{ photo.type }}
                        </span>
                      </div>
                      <p class="mt-2 text-sm text-white/45">
                        Review evidence dan tentukan status final untuk foto ini.
                      </p>
                    </div>

                    <span :class="['inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]', photoStatusConfig[photo.status].class]">
                      <component
                        :is="photoStatusConfig[photo.status].icon"
                        :size="12"
                      />
                      {{ photoStatusConfig[photo.status].label }}
                    </span>
                  </div>

                  <div class="mt-6 rounded-2xl border border-white/6 bg-white/3 p-4">
                    <div class="flex items-start gap-3">
                      <MessageSquare
                        :size="16"
                        class="mt-0.5 shrink-0 text-white/35"
                      />
                      <div class="w-full">
                        <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/28">
                          Review Note
                        </p>
                        <textarea
                          v-if="selectedRejectPhotoId === photo.id || photo.status === 'REJECT'"
                          :value="photo.note"
                          rows="3"
                          class="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-400/50"
                          placeholder="Tulis alasan reject atau catatan review..."
                          @input="updateRejectNote(photo.id, ($event.target as HTMLTextAreaElement).value)"
                        />
                        <p
                          v-else
                          class="mt-3 text-sm text-white/70"
                        >
                          {{ photo.note }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 flex flex-wrap gap-3">
                    <button
                      class="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 transition-all hover:bg-emerald-500/15"
                      @click="verifyPhoto(photo.id)"
                    >
                      <CheckCircle2 :size="16" />
                      Verify Photo
                    </button>
                    <button
                      class="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-red-400 transition-all hover:bg-red-500/15"
                      @click="rejectPhoto(photo.id)"
                    >
                      <ShieldX :size="16" />
                      Reject Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- HISTORY TAB SECTION -->
          <section
            v-else
            class="rounded-4xl border border-white/8 bg-[#0a0a0a]/70 p-6"
          >
            <div class="space-y-4">
              <article
                v-for="item in claim.history"
                :key="item.id"
                class="rounded-3xl border border-white/6 bg-white/3 p-5"
              >
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-sm font-black uppercase tracking-[0.16em] text-[#B6F500]">
                      {{ item.action }}
                    </p>
                    <p class="mt-2 text-sm text-white/75">
                      {{ item.note }}
                    </p>
                  </div>
                  <div class="shrink-0 text-right text-xs text-white/35">
                    <p>{{ item.date }}</p>
                    <p class="mt-1 font-bold text-white/60">
                      {{ item.actor }} · {{ item.role }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <!-- DECISION BAR (BOTTOM) -->
          <div class="sticky bottom-0 z-20 rounded-4xl border border-white/10 bg-[#050505]/92 p-4 backdrop-blur-xl">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">
                  Decision Bar
                </p>
                <p class="mt-2 text-sm text-white/65">
                  Approve claim hanya tersedia setelah semua foto sudah direview. Jika masih ada evidence yang bermasalah, minta revisi ke CS.
                </p>
              </div>
              <div class="flex flex-wrap gap-3">
                <button
                  class="inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300 transition-all hover:bg-amber-500/15"
                  @click="requestRevision"
                >
                  <AlertTriangle :size="16" />
                  Need Revision
                </button>
                <button
                  :disabled="!canApprove"
                  class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  @click="approveClaim"
                >
                  <ShieldCheck :size="16" />
                  Approve Claim
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SIDEBAR SECTION -->
        <aside class="space-y-5 xl:sticky xl:top-28 xl:self-start">
          <div class="rounded-4xl border border-white/8 bg-white/5 p-5">
            <p class="text-[10px] font-black uppercase tracking-[0.24em] text-[#B6F500]">
              Review Summary
            </p>
            <div class="mt-5 space-y-4 text-sm">
              <div class="flex items-center justify-between gap-4">
                <span class="text-white/35">Current Status</span>
                <span class="font-bold text-white/85">{{ statusConfig.label }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-white/35">Pending Photos</span>
                <span class="font-bold text-amber-400">{{ stats.pending }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-white/35">Rejected Photos</span>
                <span class="font-bold text-red-400">{{ stats.rejected }}</span>
              </div>
              <div class="flex items-center justify-between gap-4">
                <span class="text-white/35">Verified Photos</span>
                <span class="font-bold text-emerald-400">{{ stats.verified }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.08),transparent_30%),rgba(255,255,255,0.03)] p-5">
            <div class="flex items-center gap-3">
              <Monitor
                :size="18"
                class="text-[#B6F500]"
              />
              <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                Claim Snapshot
              </p>
            </div>
            <div class="mt-5 space-y-3 text-sm">
              <div class="rounded-2xl border border-white/6 bg-black/20 p-4">
                <p class="text-white/30">
                  Model
                </p>
                <p class="mt-1 font-bold text-white/85">
                  {{ claim.model }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/6 bg-black/20 p-4">
                <p class="text-white/30">
                  Serial Pair
                </p>
                <p class="mt-1 font-mono font-bold text-white/85">
                  {{ claim.panelSerialNo }}
                </p>
                <p class="mt-1 font-mono text-white/60">
                  {{ claim.ocSerialNo }}
                </p>
              </div>
              <div class="rounded-2xl border border-white/6 bg-black/20 p-4">
                <p class="text-white/30">
                  Next Action
                </p>
                <p class="mt-1 font-bold text-white/85">
                  {{ canApprove ? 'Claim can be approved.' : 'Complete photo review first.' }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="claim.revisionNote"
            class="rounded-4xl border border-amber-500/20 bg-amber-500/8 p-5"
          >
            <div class="flex items-start gap-3">
              <FileText
                :size="18"
                class="mt-0.5 shrink-0 text-amber-400"
              />
              <div>
                <p class="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/75">
                  QRCC Note
                </p>
                <p class="mt-2 text-sm leading-relaxed text-amber-100/80">
                  {{ claim.revisionNote }}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
