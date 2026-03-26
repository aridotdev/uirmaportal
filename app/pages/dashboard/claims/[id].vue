<script setup lang="ts">
// --- IMPORTS ---
import { computed, ref, watch, type Component } from 'vue'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Edit3,
  FileText,
  History,
  Image as ImageIcon,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Monitor,
  Save,
  ShieldCheck,
  ShieldX,
  XCircle
} from 'lucide-vue-next'
import type { ClaimPhotoStatus, ClaimStatus } from '~~/shared/utils/constants'

// --- PAGE CONFIGURATION ---
definePageMeta({ layout: 'dashboard' })

// --- COMPOSABLE ---
const { isReviewable, isReadOnly, shouldAutoStartReview, canFinalizeReview, determineFinalStatus } = useClaimReview()

// --- TYPE INTERFACES ---
type ReviewTab = 'info' | 'photos' | 'history'

interface ClaimPhotoItem {
  id: number
  claimId: number
  photoType: string
  label: string
  status: ClaimPhotoStatus
  filePath: string
  rejectReason: string | null
  note: string
}

interface ClaimHistoryItem {
  id: number
  claimId: number
  action: string
  fromStatus: string
  toStatus: string
  userId: string
  userName: string
  userRole: string
  note: string | null
  createdAt: string
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

// Loading / action states
const isStartingReview = ref(false)
const isSubmittingReview = ref(false)
const isSavingFields = ref(false)
const actionError = ref<string | null>(null)
const actionSuccess = ref<string | null>(null)

// Claim data
const claimStatus = ref<ClaimStatus>('SUBMITTED')
const claimPhotos = ref<ClaimPhotoItem[]>([])
const claimHistory = ref<ClaimHistoryItem[]>([])

// Editable field drafts
const editableFields = ref({
  panelSerialNo: '',
  ocSerialNo: '',
  defectName: '',
  odfNumber: '' as string | null,
  version: '' as string | null,
  week: '' as string | null
})
const fieldsModified = ref(false)

// --- FETCH CLAIM DATA ---
const { data: claimRecord, pending: isLoading } = await useFetch<ClaimApiItem>(
  () => `/api/claims/${claimId.value}`,
  { watch: [claimId] }
)

// --- HELPER FUNCTIONS ---
const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const clearMessages = () => {
  actionError.value = null
  actionSuccess.value = null
}

// --- FETCH PHOTOS & HISTORY ---
async function fetchPhotos() {
  try {
    const data = await $fetch<Array<{
      id: number
      claimId: number
      photoType: string
      label: string
      status: ClaimPhotoStatus
      filePath: string
      rejectReason: string | null
    }>>(`/api/claims/${claimId.value}/photos`)
    claimPhotos.value = data.map(p => ({
      ...p,
      note: p.rejectReason ?? ''
    }))
  } catch {
    claimPhotos.value = []
  }
}

async function fetchHistory() {
  try {
    const data = await $fetch<ClaimHistoryItem[]>(`/api/claims/${claimId.value}/history`)
    claimHistory.value = data
  } catch {
    claimHistory.value = []
  }
}

// --- AUTO START REVIEW ---
async function triggerStartReview() {
  if (!claimRecord.value) return
  if (!shouldAutoStartReview(claimRecord.value.claimStatus)) return

  isStartingReview.value = true
  clearMessages()

  try {
    const result = await $fetch<{
      success: boolean
      claim: ClaimApiItem
      alreadyInReview: boolean
    }>(`/api/claims/${claimId.value}/start-review`, { method: 'POST' })

    claimStatus.value = result.claim.claimStatus
    // Also update the raw record to keep it in sync
    if (claimRecord.value) {
      claimRecord.value.claimStatus = result.claim.claimStatus
      claimRecord.value.updatedAt = result.claim.updatedAt
    }

    if (!result.alreadyInReview) {
      actionSuccess.value = 'Review dimulai. Status berubah ke IN_REVIEW.'
    }
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string } }
    actionError.value = error.data?.statusMessage ?? 'Gagal memulai review.'
  } finally {
    isStartingReview.value = false
    await fetchHistory()
  }
}

// --- INITIALIZE WHEN DATA LOADS ---
watch(claimRecord, async (record) => {
  if (!record) return

  claimStatus.value = record.claimStatus

  // Populate editable fields
  editableFields.value = {
    panelSerialNo: record.panelSerialNo,
    ocSerialNo: record.ocSerialNo,
    defectName: record.defectName,
    odfNumber: record.odfNumber,
    version: record.version,
    week: record.week
  }
  fieldsModified.value = false

  // Fetch photos and history from API
  await Promise.all([fetchPhotos(), fetchHistory()])

  // Auto-start review if SUBMITTED
  if (shouldAutoStartReview(record.claimStatus)) {
    await triggerStartReview()
    // Refresh photos after start-review in case status changed
    await fetchPhotos()
  }
}, { immediate: true })

// Track field modifications
watch(editableFields, () => {
  if (!claimRecord.value) return
  const r = claimRecord.value
  fieldsModified.value = (
    editableFields.value.panelSerialNo !== r.panelSerialNo
    || editableFields.value.ocSerialNo !== r.ocSerialNo
    || editableFields.value.defectName !== r.defectName
    || editableFields.value.odfNumber !== r.odfNumber
    || editableFields.value.version !== r.version
    || editableFields.value.week !== r.week
  )
}, { deep: true })

// --- COMPUTED PROPERTIES ---
const reviewable = computed(() => isReviewable(claimStatus.value))
const readOnly = computed(() => isReadOnly(claimStatus.value))

const statusConfig = computed(() => {
  const configs: Record<ClaimStatus, { label: string, class: string, icon: Component }> = {
    DRAFT: { label: 'Draft', class: 'bg-white/10 text-white/60 border-white/10', icon: Clock3 },
    SUBMITTED: { label: 'Submitted', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: Clock3 },
    IN_REVIEW: { label: 'In Review', class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: ShieldCheck },
    NEED_REVISION: { label: 'Need Revision', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
    APPROVED: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    ARCHIVED: { label: 'Archived', class: 'bg-white/10 text-white/40 border-white/10', icon: History }
  }
  return configs[claimStatus.value]
})

const photoStatusConfig: Record<ClaimPhotoStatus, { label: string, class: string, icon: Component }> = {
  PENDING: { label: 'Pending', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Clock3 },
  VERIFIED: { label: 'Verified', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  REJECT: { label: 'Reject', class: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
}

const stats = computed(() => {
  const photos = claimPhotos.value
  const verified = photos.filter(p => p.status === 'VERIFIED').length
  const pending = photos.filter(p => p.status === 'PENDING').length
  const rejected = photos.filter(p => p.status === 'REJECT').length
  return { verified, pending, rejected, total: photos.length }
})

const finalizeCheck = computed(() => {
  return canFinalizeReview(claimPhotos.value.map(p => ({
    status: p.status,
    note: p.note
  })))
})

const projectedOutcome = computed(() => {
  if (stats.value.pending > 0) return null
  return determineFinalStatus(claimPhotos.value.map(p => p.status))
})

// --- PHOTO REVIEW ACTIONS (local draft) ---
const verifyPhoto = (photoId: number) => {
  if (!reviewable.value) return
  claimPhotos.value = claimPhotos.value.map((photo) => {
    if (photo.id !== photoId) return photo
    return { ...photo, status: 'VERIFIED' as const, note: 'Foto diverifikasi oleh QRCC.' }
  })
}

const rejectPhoto = (photoId: number) => {
  if (!reviewable.value) return
  claimPhotos.value = claimPhotos.value.map((photo) => {
    if (photo.id !== photoId) return photo
    return {
      ...photo,
      status: 'REJECT' as const,
      note: photo.note && photo.note !== 'Foto diverifikasi oleh QRCC.' ? photo.note : ''
    }
  })
}

const updateRejectNote = (photoId: number, value: string) => {
  claimPhotos.value = claimPhotos.value.map((photo) => {
    if (photo.id !== photoId) return photo
    return { ...photo, note: value }
  })
}

// --- SAVE EDITABLE FIELDS ---
async function saveFields() {
  if (!reviewable.value || !fieldsModified.value) return

  isSavingFields.value = true
  clearMessages()

  try {
    const result = await $fetch<{ success: boolean, claim: ClaimApiItem }>(
      `/api/claims/${claimId.value}`,
      {
        method: 'PATCH',
        body: {
          panelSerialNo: editableFields.value.panelSerialNo,
          ocSerialNo: editableFields.value.ocSerialNo,
          defectName: editableFields.value.defectName,
          odfNumber: editableFields.value.odfNumber || null,
          version: editableFields.value.version || null,
          week: editableFields.value.week || null
        }
      }
    )

    if (claimRecord.value) {
      Object.assign(claimRecord.value, result.claim)
    }
    fieldsModified.value = false
    actionSuccess.value = 'Perubahan field berhasil disimpan.'
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string } }
    actionError.value = error.data?.statusMessage ?? 'Gagal menyimpan perubahan.'
  } finally {
    isSavingFields.value = false
  }
}

// --- SUBMIT FINAL REVIEW ---
async function submitReview() {
  if (!reviewable.value || !finalizeCheck.value.ready) return

  isSubmittingReview.value = true
  clearMessages()

  try {
    const result = await $fetch<{
      success: boolean
      claim: ClaimApiItem
      finalStatus: ClaimStatus
    }>(
      `/api/claims/${claimId.value}/review`,
      {
        method: 'POST',
        body: {
          photos: claimPhotos.value.map(p => ({
            photoId: p.id,
            status: p.status,
            note: p.status === 'REJECT' ? p.note : undefined
          }))
        }
      }
    )

    claimStatus.value = result.finalStatus
    if (claimRecord.value) {
      claimRecord.value.claimStatus = result.finalStatus
      claimRecord.value.updatedAt = result.claim.updatedAt
    }

    const isApproved = result.finalStatus === 'APPROVED'
    actionSuccess.value = isApproved
      ? 'Review selesai. Claim telah disetujui.'
      : 'Review selesai. Claim memerlukan revisi dari CS.'

    await fetchHistory()
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string } }
    actionError.value = error.data?.statusMessage ?? 'Gagal mengirim review.'
  } finally {
    isSubmittingReview.value = false
  }
}

// --- DISPLAY HELPERS ---
const claim = computed(() => {
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
    odfNumber: record?.odfNumber ?? null,
    version: record?.version ?? null,
    week: record?.week ?? null,
    submittedBy: record?.submittedBy ?? '-',
    qrccAssignee: 'Nadia Putri'
  }
})

const tabs = [
  { id: 'info' as const, label: 'Claim Info', icon: Info },
  { id: 'photos' as const, label: 'Photo Review', icon: ImageIcon },
  { id: 'history' as const, label: 'Claim History', icon: History }
]

const historyActionLabels: Record<string, { label: string, color: string }> = {
  SUBMIT: { label: 'SUBMIT', color: 'text-blue-400' },
  REVIEW: { label: 'START REVIEW', color: 'text-indigo-400' },
  REVIEW_PHOTO: { label: 'REVIEW PHOTO', color: 'text-white/70' },
  APPROVE: { label: 'APPROVED', color: 'text-emerald-400' },
  REJECT: { label: 'NEED REVISION', color: 'text-amber-400' },
  ARCHIVE: { label: 'ARCHIVED', color: 'text-white/40' },
  UPDATE: { label: 'UPDATE', color: 'text-white/60' },
  CREATE: { label: 'CREATE', color: 'text-white/60' },
  REQUEST_REVISION: { label: 'REQUEST REVISION', color: 'text-amber-400' },
  REVISION_SUBMIT: { label: 'REVISION SUBMIT', color: 'text-blue-400' }
}
</script>

<template>
  <div class="p-6 lg:p-12">
    <div class="mx-auto max-w-7xl space-y-8">
      <!-- LOADING STATE -->
      <div
        v-if="isLoading || isStartingReview"
        class="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-4xl border border-white/8 bg-white/5"
      >
        <div class="h-10 w-10 rounded-full border-4 border-[#B6F500]/20 border-t-[#B6F500] animate-spin" />
        <p class="text-sm text-white/40">
          {{ isStartingReview ? 'Memulai review...' : 'Memuat data claim...' }}
        </p>
      </div>

      <template v-else>
        <!-- READ-ONLY BANNER -->
        <div
          v-if="readOnly"
          class="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4"
        >
          <Lock
            :size="18"
            class="shrink-0 text-white/40"
          />
          <div>
            <p class="text-sm font-bold text-white/60">
              Mode Read-Only
            </p>
            <p class="text-xs text-white/35">
              Claim dengan status {{ statusConfig.label }} tidak dapat diedit oleh QRCC.
            </p>
          </div>
        </div>

        <!-- SUCCESS / ERROR MESSAGES -->
        <div
          v-if="actionSuccess"
          class="flex items-center gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/8 px-5 py-4"
        >
          <CheckCircle2
            :size="18"
            class="shrink-0 text-emerald-400"
          />
          <p class="text-sm text-emerald-300">
            {{ actionSuccess }}
          </p>
        </div>
        <div
          v-if="actionError"
          class="flex items-center gap-3 rounded-3xl border border-red-500/20 bg-red-500/8 px-5 py-4"
        >
          <XCircle
            :size="18"
            class="shrink-0 text-red-400"
          />
          <p class="text-sm text-red-300">
            {{ actionError }}
          </p>
        </div>

        <!-- HEADER SECTION -->
        <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
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
                <!-- Photo review indicator badge -->
                <span
                  v-if="tab.id === 'photos' && stats.pending > 0 && reviewable"
                  class="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-black"
                >
                  {{ stats.pending }}
                </span>
              </button>
            </div>

            <!-- ============================================ -->
            <!-- INFO TAB SECTION -->
            <!-- ============================================ -->
            <section
              v-if="activeTab === 'info'"
              class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.08),transparent_26%),rgba(255,255,255,0.03)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
            >
              <div class="grid gap-6 lg:grid-cols-2">
                <!-- Left: Notification + Read-only fields -->
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
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-white/35">Model</span>
                      <span class="font-bold text-white/85">{{ claim.model }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-white/35">Size</span>
                      <span class="font-bold text-white/85">{{ claim.inch }} inch</span>
                    </div>
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-white/35">Vendor</span>
                      <span class="font-bold text-white/85">{{ claim.vendor }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-white/35">Branch</span>
                      <span class="font-bold text-white/85">{{ claim.branch }}</span>
                    </div>
                  </div>
                </div>

                <!-- Right: Editable fields (or read-only if not reviewable) -->
                <div class="rounded-3xl border border-white/6 bg-black/20 p-5">
                  <div class="flex items-center justify-between">
                    <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/25">
                      {{ reviewable ? 'Editable Fields' : 'Claim Details' }}
                    </p>
                    <Edit3
                      v-if="reviewable"
                      :size="14"
                      class="text-[#B6F500]/50"
                    />
                    <Lock
                      v-else
                      :size="14"
                      class="text-white/20"
                    />
                  </div>

                  <div class="mt-5 space-y-4">
                    <!-- Panel Serial No -->
                    <div>
                      <label class="text-xs text-white/30">Panel Serial No</label>
                      <input
                        v-if="reviewable"
                        v-model="editableFields.panelSerialNo"
                        type="text"
                        class="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm text-white outline-none transition-all focus:border-[#B6F500]/50"
                      >
                      <p
                        v-else
                        class="mt-1 font-mono text-sm font-bold text-white/85"
                      >
                        {{ claim.panelSerialNo }}
                      </p>
                    </div>

                    <!-- OC Serial No -->
                    <div>
                      <label class="text-xs text-white/30">OC Serial No</label>
                      <input
                        v-if="reviewable"
                        v-model="editableFields.ocSerialNo"
                        type="text"
                        class="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 font-mono text-sm text-white outline-none transition-all focus:border-[#B6F500]/50"
                      >
                      <p
                        v-else
                        class="mt-1 font-mono text-sm font-bold text-white/85"
                      >
                        {{ claim.ocSerialNo }}
                      </p>
                    </div>

                    <!-- Defect -->
                    <div>
                      <label class="text-xs text-white/30">Defect</label>
                      <input
                        v-if="reviewable"
                        v-model="editableFields.defectName"
                        type="text"
                        class="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-[#B6F500]/50"
                      >
                      <div
                        v-else
                        class="mt-1 rounded-2xl border border-red-500/15 bg-red-500/5 p-3"
                      >
                        <p class="text-sm font-black text-red-400">
                          {{ claim.defectName }}
                        </p>
                      </div>
                    </div>

                    <!-- ODF Number -->
                    <div>
                      <label class="text-xs text-white/30">ODF Number</label>
                      <input
                        v-if="reviewable"
                        v-model="editableFields.odfNumber"
                        type="text"
                        placeholder="Opsional"
                        class="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-[#B6F500]/50"
                      >
                      <p
                        v-else
                        class="mt-1 text-sm font-bold text-white/85"
                      >
                        {{ claim.odfNumber ?? '-' }}
                      </p>
                    </div>

                    <!-- Version -->
                    <div>
                      <label class="text-xs text-white/30">Version</label>
                      <input
                        v-if="reviewable"
                        v-model="editableFields.version"
                        type="text"
                        placeholder="Opsional"
                        class="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-[#B6F500]/50"
                      >
                      <p
                        v-else
                        class="mt-1 text-sm font-bold text-white/85"
                      >
                        {{ claim.version ?? '-' }}
                      </p>
                    </div>

                    <!-- Week -->
                    <div>
                      <label class="text-xs text-white/30">Week</label>
                      <input
                        v-if="reviewable"
                        v-model="editableFields.week"
                        type="text"
                        placeholder="Opsional"
                        class="mt-1 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-[#B6F500]/50"
                      >
                      <p
                        v-else
                        class="mt-1 text-sm font-bold text-white/85"
                      >
                        {{ claim.week ?? '-' }}
                      </p>
                    </div>
                  </div>

                  <!-- Save Changes Button -->
                  <button
                    v-if="reviewable && fieldsModified"
                    :disabled="isSavingFields"
                    class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B6F500] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                    @click="saveFields"
                  >
                    <Loader2
                      v-if="isSavingFields"
                      :size="16"
                      class="animate-spin"
                    />
                    <Save
                      v-else
                      :size="16"
                    />
                    {{ isSavingFields ? 'Menyimpan...' : 'Save Changes' }}
                  </button>
                </div>
              </div>
            </section>

            <!-- ============================================ -->
            <!-- PHOTOS TAB SECTION -->
            <!-- ============================================ -->
            <section
              v-else-if="activeTab === 'photos'"
              class="space-y-5"
            >
              <!-- No photos message -->
              <div
                v-if="claimPhotos.length === 0"
                class="flex min-h-[200px] items-center justify-center rounded-4xl border border-white/8 bg-[#0a0a0a]/70 p-6"
              >
                <p class="text-sm text-white/35">
                  Belum ada foto untuk claim ini.
                </p>
              </div>

              <div
                v-for="photo in claimPhotos"
                :key="photo.id"
                class="overflow-hidden rounded-4xl border border-white/8 bg-[#0a0a0a]/70"
              >
                <div class="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
                  <div class="border-b border-white/6 bg-black/20 lg:border-b-0 lg:border-r lg:border-white/6">
                    <img
                      :src="photo.filePath"
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
                            {{ photo.photoType }}
                          </span>
                        </div>
                        <p class="mt-2 text-sm text-white/45">
                          {{ reviewable ? 'Review evidence dan tentukan status final untuk foto ini.' : 'Status review untuk foto ini.' }}
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

                    <!-- Review Note -->
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
                          <!-- Editable reject note -->
                          <textarea
                            v-if="reviewable && photo.status === 'REJECT'"
                            :value="photo.note"
                            rows="3"
                            class="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all focus:border-red-400/50"
                            placeholder="Tulis alasan reject (wajib)..."
                            @input="updateRejectNote(photo.id, ($event.target as HTMLTextAreaElement).value)"
                          />
                          <!-- Reject note warning -->
                          <p
                            v-if="reviewable && photo.status === 'REJECT' && !photo.note.trim()"
                            class="mt-2 text-xs text-red-400"
                          >
                            Catatan reject wajib diisi sebelum mengirim review.
                          </p>
                          <!-- Display note (read-only or verified) -->
                          <p
                            v-if="!reviewable || photo.status !== 'REJECT'"
                            class="mt-3 text-sm text-white/70"
                          >
                            {{ photo.note || (photo.status === 'PENDING' ? 'Belum direview.' : '-') }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Photo Action Buttons (only when reviewable) -->
                    <div
                      v-if="reviewable"
                      class="mt-6 flex flex-wrap gap-3"
                    >
                      <button
                        :class="[
                          'inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all',
                          photo.status === 'VERIFIED'
                            ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                            : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                        ]"
                        @click="verifyPhoto(photo.id)"
                      >
                        <CheckCircle2 :size="16" />
                        {{ photo.status === 'VERIFIED' ? 'Verified' : 'Verify Photo' }}
                      </button>
                      <button
                        :class="[
                          'inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all',
                          photo.status === 'REJECT'
                            ? 'border-red-400/40 bg-red-500/20 text-red-300 ring-1 ring-red-400/30'
                            : 'border-red-400/20 bg-red-500/10 text-red-400 hover:bg-red-500/15'
                        ]"
                        @click="rejectPhoto(photo.id)"
                      >
                        <ShieldX :size="16" />
                        {{ photo.status === 'REJECT' ? 'Rejected' : 'Reject Photo' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <!-- ============================================ -->
            <!-- HISTORY TAB SECTION -->
            <!-- ============================================ -->
            <section
              v-else
              class="rounded-4xl border border-white/8 bg-[#0a0a0a]/70 p-6"
            >
              <div
                v-if="claimHistory.length === 0"
                class="flex min-h-[200px] items-center justify-center"
              >
                <p class="text-sm text-white/35">
                  Belum ada history untuk claim ini.
                </p>
              </div>
              <div class="space-y-4">
                <article
                  v-for="item in claimHistory"
                  :key="item.id"
                  class="rounded-3xl border border-white/6 bg-white/3 p-5"
                >
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div class="flex items-center gap-3">
                        <p :class="['text-sm font-black uppercase tracking-[0.16em]', historyActionLabels[item.action]?.color ?? 'text-[#B6F500]']">
                          {{ historyActionLabels[item.action]?.label ?? item.action }}
                        </p>
                        <span class="rounded-lg border border-white/6 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/30">
                          {{ item.fromStatus }} &rarr; {{ item.toStatus }}
                        </span>
                      </div>
                      <p
                        v-if="item.note"
                        class="mt-2 text-sm text-white/75"
                      >
                        {{ item.note }}
                      </p>
                    </div>
                    <div class="shrink-0 text-right text-xs text-white/35">
                      <p>{{ formatDateTime(item.createdAt) }}</p>
                      <p class="mt-1 font-bold text-white/60">
                        {{ item.userName }} &middot; {{ item.userRole }}
                      </p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <!-- ============================================ -->
            <!-- DECISION BAR (BOTTOM) -->
            <!-- ============================================ -->
            <div
              v-if="reviewable"
              class="sticky bottom-0 z-20 rounded-4xl border border-white/10 bg-[#050505]/92 p-4 backdrop-blur-xl"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-white/28">
                    Finalize Review
                  </p>
                  <p
                    v-if="!finalizeCheck.ready"
                    class="mt-2 text-sm text-amber-300/80"
                  >
                    <AlertTriangle
                      :size="14"
                      class="mr-1 inline"
                    />
                    {{ finalizeCheck.reason }}
                  </p>
                  <p
                    v-else
                    class="mt-2 text-sm text-white/65"
                  >
                    Semua foto sudah direview. Outcome:
                    <span
                      :class="projectedOutcome === 'APPROVED' ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'"
                    >
                      {{ projectedOutcome === 'APPROVED' ? 'APPROVED' : 'NEED REVISION' }}
                    </span>
                  </p>
                </div>
                <button
                  :disabled="!finalizeCheck.ready || isSubmittingReview"
                  class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  @click="submitReview"
                >
                  <Loader2
                    v-if="isSubmittingReview"
                    :size="16"
                    class="animate-spin"
                  />
                  <ShieldCheck
                    v-else
                    :size="16"
                  />
                  {{ isSubmittingReview ? 'Mengirim Review...' : 'Selesai Review' }}
                </button>
              </div>
            </div>
          </div>

          <!-- ============================================ -->
          <!-- SIDEBAR SECTION -->
          <!-- ============================================ -->
          <aside class="space-y-5 xl:sticky xl:top-28 xl:self-start">
            <!-- Review Summary -->
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
                  <span class="text-white/35">Total Photos</span>
                  <span class="font-bold text-white/85">{{ stats.total }}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="text-white/35">Pending</span>
                  <span :class="stats.pending > 0 ? 'font-bold text-amber-400' : 'font-bold text-white/40'">{{ stats.pending }}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="text-white/35">Rejected</span>
                  <span :class="stats.rejected > 0 ? 'font-bold text-red-400' : 'font-bold text-white/40'">{{ stats.rejected }}</span>
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="text-white/35">Verified</span>
                  <span :class="stats.verified > 0 ? 'font-bold text-emerald-400' : 'font-bold text-white/40'">{{ stats.verified }}</span>
                </div>
              </div>

              <!-- Progress bar -->
              <div
                v-if="stats.total > 0"
                class="mt-5"
              >
                <div class="flex h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    class="bg-emerald-500 transition-all duration-300"
                    :style="{ width: `${(stats.verified / stats.total) * 100}%` }"
                  />
                  <div
                    class="bg-red-500 transition-all duration-300"
                    :style="{ width: `${(stats.rejected / stats.total) * 100}%` }"
                  />
                  <div
                    class="bg-amber-500/50 transition-all duration-300"
                    :style="{ width: `${(stats.pending / stats.total) * 100}%` }"
                  />
                </div>
              </div>
            </div>

            <!-- Claim Snapshot -->
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
                  <p
                    v-if="readOnly"
                    class="mt-1 font-bold text-white/50"
                  >
                    Claim {{ statusConfig.label }}. Read-only.
                  </p>
                  <p
                    v-else-if="!finalizeCheck.ready"
                    class="mt-1 font-bold text-amber-300/80"
                  >
                    {{ finalizeCheck.reason }}
                  </p>
                  <p
                    v-else
                    class="mt-1 font-bold text-emerald-400"
                  >
                    Review siap untuk dikirim.
                  </p>
                </div>
              </div>
            </div>

            <!-- Defect highlight -->
            <div class="rounded-4xl border border-red-500/15 bg-red-500/5 p-5">
              <div class="flex items-start gap-3">
                <FileText
                  :size="18"
                  class="mt-0.5 shrink-0 text-red-400"
                />
                <div>
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-red-400/60">
                    Defect
                  </p>
                  <p class="mt-2 text-lg font-black text-red-400">
                    {{ claim.defectName }}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </template>
    </div>
  </div>
</template>
