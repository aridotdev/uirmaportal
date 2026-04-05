<script setup lang="ts">
import {
  ArrowLeft,
  AlertTriangle,
  History,
  Monitor,
  MessageSquare,
  Send,
  ShieldAlert,
  ArrowRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  CloudOff
} from 'lucide-vue-next'
import type { TimelineItem } from '~/components/TimelineList.vue'
import type { ClaimPhotoStatus, PhotoType } from '~~/shared/utils/constants'

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type EditableFieldKey = 'panelPartNumber' | 'ocSN' | 'defectType' | 'odfNumber' | 'odfVersion' | 'odfWeek'

interface EvidenceItem {
  id: string
  label: string
  status: ClaimPhotoStatus
  url: string | null
  note?: string
}

interface HistoryItem {
  id: string
  userName: string
  userRole: string
  action: string
  actionLabel: string
  date: string
  note: string
  icon?: unknown
}

interface ClaimState {
  id: string
  status: string
  notificationCode: string
  model: string
  vendor: string
  branch: string
  panelPartNumber: string
  ocSN: string
  defectType: string
  odfNumber: string
  odfVersion: string
  odfWeek: string
  evidences: EvidenceItem[]
  history: HistoryItem[]
}

interface ValidationError {
  step: number
  field: string
  message: string
}

definePageMeta({
  layout: 'cs'
})

const route = useRoute()
const toast = useToast()
const { getClaimDetail, submitRevision: submitRevisionToStore } = useCsMockStore()
const claimId = typeof route.params.id === 'string' ? route.params.id : ''

const STEP_LABELS = ['Review Info', 'Fix Evidence', 'Confirm'] as const
const currentStep = ref<number>(1)
const stepAttempted = ref<Record<number, boolean>>({
  1: false,
  2: false,
  3: false
})

const claim = ref<ClaimState>({
  id: claimId,
  status: 'NEED_REVISION',
  notificationCode: '',
  model: '',
  vendor: '',
  branch: '',
  panelPartNumber: '',
  ocSN: '',
  defectType: '',
  odfNumber: '',
  odfVersion: '',
  odfWeek: '',
  evidences: [],
  history: []
})

const originalValues = ref<Record<EditableFieldKey, string>>({
  panelPartNumber: '',
  ocSN: '',
  defectType: '',
  odfNumber: '',
  odfVersion: '',
  odfWeek: ''
})

const claimData = computed(() => getClaimDetail(claimId))

watch(claimData, (c) => {
  if (!c) {
    navigateTo('/cs/claims')
    return
  }

  if (c.claimStatus !== 'NEED_REVISION') {
    navigateTo(`/cs/claims/${claimId}`)
    return
  }

  claim.value = {
    id: c.claimNumber,
    status: c.claimStatus,
    notificationCode: c.notificationCode,
    model: c.modelName,
    vendor: c.vendorName,
    branch: c.branch,
    panelPartNumber: c.panelPartNumber,
    ocSN: c.ocSerialNo,
    defectType: c.defectName,
    odfNumber: c.odfNumber ?? '',
    odfVersion: c.odfVersion ?? '',
    odfWeek: c.odfWeek ?? '',
    evidences: c.evidences.map(photo => ({
      id: photo.photoType,
      label: photo.label,
      status: photo.status,
      url: photo.filePath,
      note: photo.rejectReason ?? ''
    })),
    history: c.history.map(item => ({
      id: String(item.id),
      userName: item.userName,
      userRole: item.userRole,
      action: item.action,
      actionLabel: item.action.replaceAll('_', ' '),
      date: new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(item.createdAt)),
      note: item.note ?? '-',
      icon: item.action === 'REQUEST_REVISION' ? AlertTriangle : Send
    }))
  }

  originalValues.value = {
    panelPartNumber: claim.value.panelPartNumber,
    ocSN: claim.value.ocSN,
    defectType: claim.value.defectType,
    odfNumber: claim.value.odfNumber,
    odfVersion: claim.value.odfVersion,
    odfWeek: claim.value.odfWeek
  }
}, { immediate: true })

const revisionNote = ref('')
const newUploads = ref<Record<string, File | null>>({})
const previewUrls = ref<Record<string, string>>({})

const MAX_FILE_SIZE = 5 * 1024 * 1024

const validateUploadFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) return 'File terlalu besar (maks 5MB)'
  if (!file.type.startsWith('image/')) return 'Hanya file gambar yang diperbolehkan'
  return null
}

const handleFileUpload = (id: string, event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const error = validateUploadFile(file)
  if (error) {
    toast.add({
      title: 'Upload gagal',
      description: error,
      color: 'error'
    })
    target.value = ''
    return
  }

  if (previewUrls.value[id]) {
    URL.revokeObjectURL(previewUrls.value[id])
  }

  newUploads.value[id] = file
  previewUrls.value[id] = URL.createObjectURL(file)
  target.value = ''
}

const removeUpload = (id: string): void => {
  if (previewUrls.value[id]) {
    URL.revokeObjectURL(previewUrls.value[id])
    const { [id]: _removed, ...rest } = previewUrls.value
    previewUrls.value = rest
  }
  newUploads.value[id] = null
}

const isFieldRevised = (field: EditableFieldKey): boolean => {
  return claim.value[field] !== originalValues.value[field]
}

const formattedHistory = computed<TimelineItem[]>(() =>
  claim.value.history.map(log => ({
    id: log.id,
    date: log.date,
    userName: log.userName,
    userRole: log.userRole,
    action: log.action,
    actionLabel: log.actionLabel,
    note: log.note,
    icon: log.icon as TimelineItem['icon']
  }))
)

const rejectedEvidences = computed(() =>
  claim.value.evidences.filter(ev => ev.status === 'REJECT')
)

const nonRejectedEvidences = computed(() =>
  claim.value.evidences.filter(ev => ev.status !== 'REJECT')
)

const rejectedCount = computed(() => rejectedEvidences.value.length)
const fixedCount = computed(() =>
  rejectedEvidences.value.filter(ev => newUploads.value[ev.id]).length
)
const allRejectedFixed = computed(() => fixedCount.value === rejectedCount.value)

const rejectedNotFixed = computed(() =>
  rejectedEvidences.value.filter(ev => !newUploads.value[ev.id])
)

const revisedFields = computed(() => {
  const fields: Array<{ key: EditableFieldKey, label: string }> = [
    { key: 'panelPartNumber', label: 'Panel Part Number' },
    { key: 'ocSN', label: 'OC Serial Number' },
    { key: 'defectType', label: 'Defect Type' },
    { key: 'odfNumber', label: 'ODF Number' },
    { key: 'odfVersion', label: 'ODF Version' },
    { key: 'odfWeek', label: 'ODF Week' }
  ]

  return fields
    .filter(field => isFieldRevised(field.key))
    .map(field => ({
      ...field,
      oldValue: originalValues.value[field.key],
      newValue: claim.value[field.key]
    }))
})

const validationErrors = computed<ValidationError[]>(() => {
  const errors: ValidationError[] = []

  for (const ev of rejectedEvidences.value) {
    if (!newUploads.value[ev.id]) {
      errors.push({
        step: 2,
        field: ev.label,
        message: `${ev.label} yang ditolak wajib di-upload ulang`
      })
    }
  }

  return errors
})

const canSubmitRevision = computed(() => validationErrors.value.length === 0)

const computedStepStatus = computed<Record<number, 'valid' | 'error' | 'default'>>(() => {
  const status: Record<number, 'valid' | 'error' | 'default'> = {}
  for (let step = 1; step <= 3; step++) {
    if (!stepAttempted.value[step]) {
      status[step] = 'default'
      continue
    }

    const hasStepError = validationErrors.value.some(error => error.step === step)
    status[step] = hasStepError ? 'error' : 'valid'
  }
  return status
})

const nextStep = (): void => {
  if (currentStep.value < 3) {
    stepAttempted.value[currentStep.value] = true
    const currentErrors = validationErrors.value.filter(error => error.step === currentStep.value)
    if (currentErrors.length > 0) return
    currentStep.value++
  }
}

const prevStep = (): void => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const submitRevision = (): void => {
  stepAttempted.value[1] = true
  stepAttempted.value[2] = true
  stepAttempted.value[3] = true

  if (!canSubmitRevision.value) {
    const firstErrorStep = validationErrors.value[0]?.step
    if (firstErrorStep) currentStep.value = firstErrorStep
    return
  }

  const changedFields: Record<string, string> = {}
  for (const field of revisedFields.value) {
    if (field.key === 'ocSN') {
      changedFields.ocSerialNo = field.newValue
      continue
    }
    if (field.key === 'defectType') {
      changedFields.defectName = field.newValue
      continue
    }
    changedFields[field.key] = field.newValue
  }

  const replacedPhotos = Object.entries(newUploads.value)
    .filter((entry): entry is [string, File] => !!entry[1])
    .map(([photoType, file]) => ({
      photoType: photoType as PhotoType,
      file
    }))

  const success = submitRevisionToStore({
    claimId: claim.value.id,
    revisedFields: changedFields,
    replacedPhotos,
    revisionNote: revisionNote.value
  })

  if (success) {
    toast.add({
      title: 'Revision submitted',
      description: 'Revisi claim berhasil dikirim ke QRCC.',
      color: 'success'
    })
    navigateTo(`/cs/claims/${claim.value.id}`)
  }
}

const autosaveStatus = ref<AutosaveStatus>('idle')
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

const autosaveLabel = computed(() => {
  const labels: Record<AutosaveStatus, string> = {
    idle: '',
    saving: 'Saving draft…',
    saved: 'Draft saved',
    error: 'Save failed'
  }

  return labels[autosaveStatus.value]
})

const triggerAutosave = (): void => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => {
    autosaveStatus.value = 'saving'
    setTimeout(() => {
      autosaveStatus.value = 'saved'
      setTimeout(() => {
        autosaveStatus.value = 'idle'
      }, 3000)
    }, 800)
  }, 1500)
}

watch(() => claim.value.panelPartNumber, triggerAutosave)
watch(() => claim.value.ocSN, triggerAutosave)
watch(() => claim.value.defectType, triggerAutosave)
watch(() => claim.value.odfNumber, triggerAutosave)
watch(() => claim.value.odfVersion, triggerAutosave)
watch(() => claim.value.odfWeek, triggerAutosave)
watch(newUploads, triggerAutosave, { deep: true })
watch(revisionNote, triggerAutosave)

onUnmounted(() => {
  if (autosaveTimer) clearTimeout(autosaveTimer)
  for (const url of Object.values(previewUrls.value)) {
    URL.revokeObjectURL(url)
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#050505] text-white">
    <header class="cs-shell-x sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 py-4 backdrop-blur-md">
      <div class="cs-shell-container flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div class="flex items-center gap-6">
          <NuxtLink
            :to="`/cs/claims/${claimId}`"
            class="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
          >
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <div>
            <h1 class="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
              REVISE CLAIM: {{ claim.id }}
              <span class="bg-amber-500 text-black px-2 py-0.5 rounded italic text-[10px]">CORRECTION</span>
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <p class="text-white/40 text-xs font-bold uppercase tracking-widest">
                Follow QRCC feedback and submit corrected claim
              </p>
              <Transition
                enter-active-class="transition-all duration-300"
                enter-from-class="opacity-0 translate-x-2"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-300"
                leave-from-class="opacity-100 translate-x-0"
                leave-to-class="opacity-0 translate-x-2"
              >
                <span
                  v-if="autosaveStatus !== 'idle'"
                  :class="[
                    'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest',
                    autosaveStatus === 'saving' ? 'text-white/30' : '',
                    autosaveStatus === 'saved' ? 'text-[#B6F500]/60' : '',
                    autosaveStatus === 'error' ? 'text-red-400/60' : ''
                  ]"
                >
                  <Loader2
                    v-if="autosaveStatus === 'saving'"
                    class="w-3 h-3 animate-spin"
                  />
                  <Save
                    v-else-if="autosaveStatus === 'saved'"
                    class="w-3 h-3"
                  />
                  <CloudOff
                    v-else-if="autosaveStatus === 'error'"
                    class="w-3 h-3"
                  />
                  {{ autosaveLabel }}
                </span>
              </Transition>
            </div>
          </div>
        </div>

        <WorkflowStepper
          :steps="3"
          :current-step="currentStep"
          :labels="[...STEP_LABELS]"
          :step-status="computedStepStatus"
        />
      </div>
    </header>

    <main class="cs-shell-main flex-1">
      <div class="cs-shell-container">
        <div
          v-if="currentStep === 1"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-4xl p-8 relative overflow-hidden">
            <div class="absolute -top-4 -right-4 opacity-10">
              <ShieldAlert class="w-32 h-32 text-amber-500" />
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-amber-500 p-2 rounded-lg text-black">
                  <AlertTriangle class="w-5 h-5" />
                </div>
                <h3 class="font-black text-amber-500 uppercase tracking-tight">
                  QRCC Feedback
                </h3>
              </div>
              <p class="text-white/80 text-sm leading-relaxed font-bold italic">
                "{{ claim.history[0]?.note }}"
              </p>
            </div>
          </div>

          <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-8">
              <SectionCard>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div
                    v-for="(val, label) in {
                      Notification: claim.notificationCode,
                      Model: claim.model,
                      Vendor: claim.vendor,
                      Branch: claim.branch
                    }"
                    :key="label"
                  >
                    <p class="text-[8px] font-black uppercase tracking-widest text-white/30">
                      {{ label }}
                    </p>
                    <p class="text-sm font-black">
                      {{ val }}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard>
                <template #header>
                  <div class="flex items-center gap-3">
                    <div class="bg-white/5 p-2 rounded-lg">
                      <Monitor class="w-5 h-5 text-white/60" />
                    </div>
                    <h3 class="font-black text-lg uppercase tracking-tight">
                      Defect Info Correction
                    </h3>
                  </div>
                </template>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2 group relative">
                    <div
                      v-if="isFieldRevised('panelPartNumber')"
                      class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full"
                    />
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      Panel Part Number
                      <span
                        v-if="isFieldRevised('panelPartNumber')"
                        class="text-amber-500 ml-2"
                      >
                        REVISED
                      </span>
                    </label>
                    <input
                      v-model="claim.panelPartNumber"
                      type="text"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm focus:outline-none transition-colors font-mono tracking-wider',
                        isFieldRevised('panelPartNumber')
                          ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
                          : 'border-white/10 focus:border-amber-500'
                      ]"
                    >
                  </div>

                  <div class="space-y-2 group relative">
                    <div
                      v-if="isFieldRevised('ocSN')"
                      class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full"
                    />
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      OC Serial Number
                      <span
                        v-if="isFieldRevised('ocSN')"
                        class="text-amber-500 ml-2"
                      >
                        REVISED
                      </span>
                    </label>
                    <input
                      v-model="claim.ocSN"
                      type="text"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm focus:outline-none transition-colors font-mono tracking-wider',
                        isFieldRevised('ocSN')
                          ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
                          : 'border-white/10 focus:border-amber-500'
                      ]"
                    >
                  </div>

                  <div class="space-y-2 group relative md:col-span-2">
                    <div
                      v-if="isFieldRevised('defectType')"
                      class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full"
                    />
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      Defect Type
                      <span
                        v-if="isFieldRevised('defectType')"
                        class="text-amber-500 ml-2"
                      >
                        REVISED
                      </span>
                    </label>
                    <input
                      v-model="claim.defectType"
                      type="text"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm focus:outline-none transition-colors font-mono tracking-wider',
                        isFieldRevised('defectType')
                          ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
                          : 'border-white/10 focus:border-amber-500'
                      ]"
                    >
                  </div>
                </div>

                <div class="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                  <div class="space-y-2 group relative">
                    <div
                      v-if="isFieldRevised('odfNumber')"
                      class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full"
                    />
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      ODF Number
                      <span
                        v-if="isFieldRevised('odfNumber')"
                        class="text-amber-500 ml-2"
                      >
                        REVISED
                      </span>
                    </label>
                    <input
                      v-model="claim.odfNumber"
                      type="text"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors font-mono tracking-wider',
                        isFieldRevised('odfNumber')
                          ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
                          : 'border-white/10 focus:border-amber-500'
                      ]"
                    >
                  </div>

                  <div class="space-y-2 group relative">
                    <div
                      v-if="isFieldRevised('odfVersion')"
                      class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full"
                    />
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      ODF Version
                      <span
                        v-if="isFieldRevised('odfVersion')"
                        class="text-amber-500 ml-2"
                      >
                        REVISED
                      </span>
                    </label>
                    <input
                      v-model="claim.odfVersion"
                      type="text"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors font-mono tracking-wider',
                        isFieldRevised('odfVersion')
                          ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
                          : 'border-white/10 focus:border-amber-500'
                      ]"
                    >
                  </div>

                  <div class="space-y-2 group relative">
                    <div
                      v-if="isFieldRevised('odfWeek')"
                      class="absolute -left-3 top-0 bottom-0 w-1 bg-amber-500 rounded-full"
                    />
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">
                      ODF Week
                      <span
                        v-if="isFieldRevised('odfWeek')"
                        class="text-amber-500 ml-2"
                      >
                        REVISED
                      </span>
                    </label>
                    <input
                      v-model="claim.odfWeek"
                      type="text"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-4 py-3 text-xs focus:outline-none transition-colors font-mono tracking-wider',
                        isFieldRevised('odfWeek')
                          ? 'border-amber-500/40 focus:border-amber-500 bg-amber-500/5'
                          : 'border-white/10 focus:border-amber-500'
                      ]"
                    >
                  </div>
                </div>
              </SectionCard>
            </div>

            <div class="space-y-6">
              <SectionCard>
                <template #header>
                  <div class="flex items-center gap-2">
                    <History class="w-4 h-4 text-white/40" />
                    <span class="font-black text-sm uppercase tracking-tight">Revision History</span>
                  </div>
                </template>
                <TimelineList :items="formattedHistory" />
              </SectionCard>
            </div>
          </section>
        </div>

        <div
          v-if="currentStep === 2"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-black italic tracking-tight">
                FIX EVIDENCE
              </h2>
              <p class="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                Replace rejected photos and verify corrections
              </p>
            </div>
            <div class="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <span class="text-xs font-black uppercase tracking-widest text-white/40">Fixed: </span>
              <span
                class="text-sm font-black"
                :class="allRejectedFixed ? 'text-[#B6F500]' : 'text-amber-500'"
              >
                {{ fixedCount }} / {{ rejectedCount }}
              </span>
            </div>
          </div>

          <div
            v-if="stepAttempted[2] && rejectedNotFixed.length > 0"
            class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-3"
          >
            <AlertCircle class="w-4 h-4 text-red-400" />
            <p class="text-xs font-bold text-red-400">
              {{ rejectedNotFixed.length }} rejected photo(s) belum di-upload ulang.
            </p>
          </div>

          <div class="space-y-6">
            <PhotoCompareCard
              v-for="ev in rejectedEvidences"
              :id="ev.id"
              :key="ev.id"
              :label="ev.label"
              :old-image-url="ev.url"
              :new-file="newUploads[ev.id] ?? null"
              :new-preview-url="previewUrls[ev.id] ?? null"
              :reject-note="ev.note ?? ''"
              @upload="handleFileUpload"
              @remove="removeUpload"
            />
          </div>

          <div v-if="nonRejectedEvidences.length > 0">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
              NO ACTION NEEDED
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="ev in nonRejectedEvidences"
                :key="ev.id"
                class="bg-white/5 border border-white/10 rounded-2xl p-4 opacity-60"
              >
                <div class="flex items-center gap-2 mb-2">
                  <StatusBadge
                    :status="ev.status"
                    variant="photo"
                    size="sm"
                    show-dot
                  />
                </div>
                <p class="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {{ ev.label }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="currentStep === 3"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl overflow-hidden">
            <div class="bg-amber-500 p-6 text-black flex items-center justify-between">
              <div>
                <h2 class="font-black text-lg uppercase tracking-tight">
                  Revision Summary
                </h2>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                  Review all changes before submitting
                </p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-black/10">
                <FileText class="w-6 h-6" />
              </div>
            </div>

            <div class="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div class="space-y-6">
                <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div class="w-1 h-3 bg-amber-500" /> Field Changes
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="field in revisedFields"
                    :key="field.key"
                    class="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-amber-500/20"
                  >
                    <span class="text-[10px] font-bold uppercase text-white/40">{{ field.label }}</span>
                    <div class="text-right">
                      <p class="text-[9px] text-white/30 line-through">
                        {{ field.oldValue }}
                      </p>
                      <p class="text-xs font-black text-amber-500">
                        {{ field.newValue }}
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="revisedFields.length === 0"
                    class="text-xs text-white/30 italic"
                  >
                    No field changes made
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <div class="w-1 h-3 bg-amber-500" /> Evidence Replacements
                </h3>
                <div class="space-y-3">
                  <div
                    v-for="ev in rejectedEvidences"
                    :key="ev.id"
                    class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div
                      :class="[
                        'p-1.5 rounded-lg',
                        newUploads[ev.id] ? 'bg-[#B6F500]/20 text-[#B6F500]' : 'bg-red-500/20 text-red-500'
                      ]"
                    >
                      <CheckCircle2
                        v-if="newUploads[ev.id]"
                        class="w-4 h-4"
                      />
                      <AlertCircle
                        v-else
                        class="w-4 h-4"
                      />
                    </div>
                    <span class="text-xs font-black uppercase tracking-tight flex-1">{{ ev.label }}</span>
                    <span
                      v-if="newUploads[ev.id]"
                      class="text-[8px] font-black uppercase tracking-widest text-[#B6F500]"
                    >
                      REPLACED
                    </span>
                    <span
                      v-else
                      class="text-[8px] font-black uppercase tracking-widest text-red-500"
                    >
                      MISSING
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SectionCard>
            <template #header>
              <div class="flex items-center gap-3">
                <MessageSquare class="w-5 h-5 text-white/40" />
                <h3 class="font-black text-xs uppercase tracking-widest text-white/40">
                  Revision Note to QRCC
                </h3>
              </div>
            </template>
            <textarea
              v-model="revisionNote"
              placeholder="Explain the changes you made (e.g. 'Photo re-uploaded with better lighting, SN corrected')..."
              class="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold min-h-30 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </SectionCard>
        </div>
      </div>
    </main>

    <StickyActionBar container-class="cs-shell-container">
      <template #left>
        <button
          v-if="currentStep > 1"
          class="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 font-black text-sm text-white/40 transition-all hover:bg-white/5 hover:text-white"
          type="button"
          @click="prevStep"
        >
          <ArrowLeft class="w-4 h-4" /> BACK
        </button>
        <div
          v-else
          class="flex items-center gap-4 text-white/40"
        >
          <AlertTriangle class="w-4 h-4 text-amber-500" />
          <span class="text-[10px] font-black uppercase tracking-widest">Awaiting Correction</span>
        </div>
      </template>

      <NuxtLink
        :to="`/cs/claims/${claimId}`"
        class="px-8 py-4 rounded-2xl font-black text-sm text-white/40 transition-all hover:text-white"
      >
        CANCEL
      </NuxtLink>

      <button
        v-if="currentStep < 3"
        class="bg-amber-500 text-black px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        type="button"
        @click="nextStep"
      >
        CONTINUE <ArrowRight class="w-4 h-4" />
      </button>

      <button
        v-else
        :disabled="!canSubmitRevision"
        class="bg-amber-500 text-black px-12 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-40 disabled:cursor-not-allowed"
        type="button"
        @click="submitRevision"
      >
        SUBMIT REVISION <Send class="w-4 h-4" />
      </button>
    </StickyActionBar>
  </div>
</template>
