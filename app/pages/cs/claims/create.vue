<script setup lang="ts">
import {
  Search,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileText,
  Camera,
  Check,
  Loader2,
  Package,
  Info,
  Save,
  CloudOff
} from 'lucide-vue-next'

import type { NotificationStatus, PhotoType } from '~~/shared/utils/constants'
import type { CsNotificationLookupResult } from '~/utils/cs-mock-data'

const {
  lookupNotification,
  referenceData,
  createClaim
} = useCsMockStore()

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PhotoRequirement {
  id: string
  label: string
  required: boolean
}

interface ClaimFormState {
  notificationCode: string
  model: string
  inch: string
  branch: string
  vendor: string
  panelPartNumber: string
  ocSN: string
  defectType: string
  odfNumber: string
  odfVersion: string
  odfWeek: string
}

type ClaimSubmitStatus = 'DRAFT' | 'SUBMITTED'

interface ValidationError {
  step: number
  field: string
  message: string
}

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// ──────────────────────────────────────────────
// Page Meta
// ──────────────────────────────────────────────

definePageMeta({
  layout: 'cs'
})

// ──────────────────────────────────────────────
// Route & Query Params
// ──────────────────────────────────────────────

const route = useRoute()

const getInitialNotificationCode = (): string => {
  const code = route.query.notification
  return typeof code === 'string' ? code.trim() : ''
}

// ──────────────────────────────────────────────
// Wizard State
// ──────────────────────────────────────────────

const STEP_LABELS = ['Info & Defect', 'Evidence', 'Review'] as const
const currentStep = ref<number>(1)
const isSearching = ref<boolean>(false)
const notificationFound = ref<boolean>(false)
const lookupError = ref<string>('')
const notificationStatus = ref<NotificationStatus | null>(null)

// Track apakah user sudah attempt "Continue" pada step tertentu
const stepAttempted = ref<Record<number, boolean>>({
  1: false,
  2: false,
  3: false
})

// ──────────────────────────────────────────────
// Autosave State
// ──────────────────────────────────────────────

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
    // Mock save delay
    setTimeout(() => {
      autosaveStatus.value = 'saved'
      setTimeout(() => {
        autosaveStatus.value = 'idle'
      }, 3000)
    }, 800)
  }, 1500)
}

// ──────────────────────────────────────────────
// Form State
// ──────────────────────────────────────────────

const form = ref<ClaimFormState>({
  notificationCode: getInitialNotificationCode(),
  model: '',
  inch: '',
  branch: '',
  vendor: '',
  panelPartNumber: '',
  ocSN: '',
  defectType: '',
  odfNumber: '',
  odfVersion: '',
  odfWeek: ''
})

// Watch form changes for autosave
watch(form, () => {
  triggerAutosave()
}, { deep: true })

const toast = useToast()

// ──────────────────────────────────────────────
// Reference Data
// ──────────────────────────────────────────────

const vendors: readonly string[] = referenceData.vendors.map(v => v.code)
const branches: readonly string[] = referenceData.branches

const DEFAULT_DEFECT_OPTIONS: ReadonlyArray<{ code: string, name: string }> = referenceData.defects.map(d => ({
  code: d.code,
  name: d.name
}))

const defectOptions = ref<Array<{ code: string, name: string }>>([...DEFAULT_DEFECT_OPTIONS])

const productModelOptions = referenceData.productModels.map(model => ({
  id: model.id,
  name: model.name,
  inch: model.inch
}))

const branchItems = branches.map(b => ({ label: b, value: b }))
const defectItems = computed(() => defectOptions.value.map(d => ({ label: `${d.name.toUpperCase()} — ${d.code}`, value: d.code })))
const vendorItems = vendors.map(v => ({ label: v, value: v }))

const selectMenuUi = {
  base: [
    'h-12 w-full rounded-xl bg-white/5 px-5 text-sm font-bold text-white',
    'border border-white/10 focus-within:border-[#B6F500]',
    'transition-all'
  ].join(' '),
  content: 'bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1',
  item: 'text-white/50 data-highlighted:text-black data-highlighted:before:bg-[#B6F500] font-bold text-xs py-3 transition-colors'
}

const getSelectMenuUi = (hasError: boolean) => ({
  ...selectMenuUi,
  base: [
    'h-12 w-full rounded-xl bg-white/5 px-5 text-sm font-bold text-white transition-all',
    hasError
      ? 'border border-red-500/40 focus-within:border-red-500'
      : 'border border-white/10 focus-within:border-[#B6F500]'
  ].join(' ')
})

// ──────────────────────────────────────────────
// Photo Requirements (vendor-driven)
// ──────────────────────────────────────────────

const PHOTO_LABEL_MAP = referenceData.photoLabelMap

const VENDOR_RULES_FALLBACK = referenceData.vendorRules

const vendorRequiredPhotos = ref<string[]>([])
const vendorRequiredFields = ref<Array<'odfNumber' | 'version' | 'week'>>([])
const lookupVendorCode = ref<string>('')

const activeVendorRules = computed(() => {
  const fallbackRules = VENDOR_RULES_FALLBACK[form.value.vendor]
  const usesLookupRules = lookupVendorCode.value === form.value.vendor

  return {
    requiredPhotos: usesLookupRules && vendorRequiredPhotos.value.length > 0
      ? vendorRequiredPhotos.value
      : fallbackRules?.requiredPhotos ?? ['CLAIM', 'PANEL_SN', 'WO_PANEL'],
    requiredFields: usesLookupRules && vendorRequiredFields.value.length > 0
      ? vendorRequiredFields.value
      : fallbackRules?.requiredFields ?? []
  }
})

const requiresOdfFields = computed<boolean>(() => {
  return activeVendorRules.value.requiredFields.length > 0
})

const requiresOdfVersion = computed<boolean>(() => {
  return activeVendorRules.value.requiredFields.includes('version')
})

const requiresOdfWeek = computed<boolean>(() => {
  return activeVendorRules.value.requiredFields.includes('week')
})

const photoRequirements = computed<PhotoRequirement[]>(() => {
  return activeVendorRules.value.requiredPhotos.map(photoId => ({
    id: photoId,
    label: PHOTO_LABEL_MAP[photoId] ?? photoId,
    required: true
  }))
})

const notificationStatusConfig = computed(() => {
  if (!notificationStatus.value) return null

  const configs: Record<NotificationStatus, string> = {
    NEW: 'bg-[#B6F500]/20 text-[#B6F500] border-[#B6F500]/30',
    USED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    EXPIRED: 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  return configs[notificationStatus.value]
})

const MAX_FILE_SIZE = 5 * 1024 * 1024

const asTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const uploads = ref<Record<string, File | null>>({})
const uploadErrors = ref<Record<string, string>>({})
const dragOverId = ref<string | null>(null)
const previewUrls = ref<Record<string, string>>({})

// Watch uploads for autosave
watch(uploads, () => {
  triggerAutosave()
}, { deep: true })

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

const validationErrors = computed<ValidationError[]>(() => {
  const errors: ValidationError[] = []
  const f = form.value

  // Step 1 validations
  if (!f.notificationCode.trim()) {
    errors.push({ step: 1, field: 'Notification Code', message: 'Notification code is required' })
  }
  if (!f.model.trim()) {
    errors.push({ step: 1, field: 'Product Model', message: 'Product model is required' })
  }
  if (!asTrimmedString(f.inch)) {
    errors.push({ step: 1, field: 'Display Size', message: 'Display size is required' })
  }
  if (!f.branch) {
    errors.push({ step: 1, field: 'Branch', message: 'Service branch is required' })
  }
  if (!f.vendor) {
    errors.push({ step: 1, field: 'Vendor', message: 'Vendor is required' })
  }
  if (!f.defectType) {
    errors.push({ step: 1, field: 'Defect Type', message: 'Defect type is required' })
  }
  if (requiresOdfFields.value && !f.odfNumber.trim()) {
    errors.push({ step: 1, field: 'ODF Number', message: 'ODF number is required for this vendor' })
  }
  if (requiresOdfVersion.value && !f.odfVersion.trim()) {
    errors.push({ step: 1, field: 'ODF Version', message: 'ODF version is required for this vendor' })
  }
  if (requiresOdfWeek.value && !f.odfWeek.trim()) {
    errors.push({ step: 1, field: 'ODF Week', message: 'ODF week is required for this vendor' })
  }

  // Step 2 validations
  for (const req of photoRequirements.value) {
    if (req.required && !uploads.value[req.id]) {
      errors.push({ step: 2, field: req.label, message: `${req.label} photo is required` })
    }
  }

  return errors
})

const normalizedValidationErrors = computed<ValidationError[]>(() => {
  return Array.isArray(validationErrors.value) ? validationErrors.value : []
})

const step1Errors = computed(() => normalizedValidationErrors.value.filter(e => e.step === 1))
const step2Errors = computed(() => normalizedValidationErrors.value.filter(e => e.step === 2))
const hasErrors = computed(() => normalizedValidationErrors.value.length > 0)

// Mengembalikan pesan error untuk field tertentu, atau null jika valid
const getFieldError = (fieldName: string): string | null => {
  const error = normalizedValidationErrors.value.find(e => e.field === fieldName)
  return error ? error.message : null
}

const computedStepStatus = computed<Record<number, 'valid' | 'error' | 'default'>>(() => {
  const status: Record<number, 'valid' | 'error' | 'default'> = {}
  const errors = normalizedValidationErrors.value

  for (let step = 1; step <= 3; step++) {
    if (!stepAttempted.value[step]) {
      status[step] = 'default'
    } else if (errors.filter(e => e.step === step).length > 0) {
      status[step] = 'error'
    } else {
      status[step] = 'valid'
    }
  }
  return status
})

// ──────────────────────────────────────────────
// Notification Lookup
// ──────────────────────────────────────────────

const applyLookupData = (data: CsNotificationLookupResult): void => {
  const { notification, productModel, vendor, defects } = data

  form.value.notificationCode = notification.notificationCode
  form.value.branch = notification.branch

  if (productModel) {
    form.value.model = productModel.name
    form.value.inch = String(productModel.inch)
  }

  if (vendor) {
    form.value.vendor = vendor.code
    lookupVendorCode.value = vendor.code
    vendorRequiredPhotos.value = vendor.requiredPhotos
    vendorRequiredFields.value = vendor.requiredFields
  } else {
    form.value.vendor = ''
    lookupVendorCode.value = ''
    vendorRequiredPhotos.value = []
    vendorRequiredFields.value = []
  }

  if (defects.length > 0) {
    defectOptions.value = defects.map(d => ({ code: d.code, name: d.name }))
  } else {
    defectOptions.value = [...DEFAULT_DEFECT_OPTIONS]
  }

  notificationFound.value = true
  notificationStatus.value = notification.status
  lookupError.value = ''
}

const handleLookup = async (): Promise<void> => {
  const code = form.value.notificationCode.trim()
  if (!code) return

  isSearching.value = true
  lookupError.value = ''
  notificationFound.value = false

  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const data = lookupNotification(code)

    if (!data) {
      lookupError.value = `Notifikasi "${code}" tidak ditemukan. Anda tetap bisa melanjutkan input manual.`
      lookupVendorCode.value = ''
      vendorRequiredPhotos.value = []
      vendorRequiredFields.value = []
      defectOptions.value = [...DEFAULT_DEFECT_OPTIONS]
      notificationFound.value = false
      notificationStatus.value = null
      return
    }

    if (data.notification.status !== 'NEW') {
      toast.add({
        title: 'Gagal Memproses',
        description: `Notification \`${code}\` memiliki status ${data.notification.status}. Hanya status NEW yang dapat diproses.`,
        color: 'error',
        icon: 'i-lucide-alert-circle',
        duration: 3000
      })
      notificationStatus.value = data.notification.status
      notificationFound.value = false
      return
    }

    applyLookupData(data)
  } catch {
    lookupError.value = 'Gagal mengambil data notifikasi. Silakan coba lagi.'
    lookupVendorCode.value = ''
    vendorRequiredPhotos.value = []
    vendorRequiredFields.value = []
    defectOptions.value = [...DEFAULT_DEFECT_OPTIONS]
    notificationFound.value = false
    notificationStatus.value = null
  } finally {
    isSearching.value = false
  }
}

const handleNotificationKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Enter') {
    handleLookup()
  }
}

// ──────────────────────────────────────────────
// Auto-fetch on mount if query param present
// ──────────────────────────────────────────────

onMounted(async () => {
  const code = getInitialNotificationCode()
  if (code) {
    form.value.notificationCode = code
    await handleLookup()
  }
})

// ──────────────────────────────────────────────
// File Upload
// ──────────────────────────────────────────────

const handleFileUpload = (reqId: string, event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const error = validateUploadFile(file)
  if (error) {
    uploadErrors.value[reqId] = error
    target.value = ''
    return
  }

  uploadErrors.value[reqId] = ''
  setUploadFile(reqId, file)
  target.value = ''
}

const removeFile = (reqId: string): void => {
  uploadErrors.value[reqId] = ''
  setUploadFile(reqId, null)
}

const validateUploadFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return 'File terlalu besar (maks 5MB)'
  }

  if (!file.type.startsWith('image/')) {
    return 'Hanya file gambar yang diperbolehkan'
  }

  return null
}

const setUploadFile = (reqId: string, file: File | null): void => {
  if (previewUrls.value[reqId]) {
    URL.revokeObjectURL(previewUrls.value[reqId])
    const { [reqId]: _, ...remaining } = previewUrls.value
    previewUrls.value = remaining
  }

  uploads.value[reqId] = file

  if (file) {
    previewUrls.value[reqId] = URL.createObjectURL(file)
  }
}

const getPreviewUrl = (reqId: string): string | null => {
  return previewUrls.value[reqId] ?? null
}

const onDragOver = (reqId: string): void => {
  dragOverId.value = reqId
}

const onDragLeave = (reqId: string): void => {
  if (dragOverId.value === reqId) {
    dragOverId.value = null
  }
}

const onDrop = (reqId: string, event: DragEvent): void => {
  dragOverId.value = null
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  const error = validateUploadFile(file)
  if (error) {
    uploadErrors.value[reqId] = error
    return
  }

  uploadErrors.value[reqId] = ''
  setUploadFile(reqId, file)
}

onUnmounted(() => {
  console.log('🧹 Cleaning up preview URLs...', Object.values(previewUrls.value))
  for (const url of Object.values(previewUrls.value)) {
    URL.revokeObjectURL(url)
  }
})

watch(requiresOdfFields, (isRequired) => {
  if (!isRequired) {
    form.value.odfNumber = ''
    form.value.odfVersion = ''
    form.value.odfWeek = ''
  }
})

watch(requiresOdfVersion, (isRequired) => {
  if (!isRequired) {
    form.value.odfVersion = ''
  }
})

watch(requiresOdfWeek, (isRequired) => {
  if (!isRequired) {
    form.value.odfWeek = ''
  }
})

// ──────────────────────────────────────────────
// Wizard Navigation
// ──────────────────────────────────────────────

const nextStep = (): void => {
  if (currentStep.value < 3) {
    // Tandai step ini sudah di-attempt
    stepAttempted.value[currentStep.value] = true

    // Cek apakah step ini punya error
    const currentErrors = normalizedValidationErrors.value.filter(e => e.step === currentStep.value)
    if (currentErrors.length > 0) {
      // BLOKIR navigasi — jangan increment step
      return
    }

    // Step valid, lanjut ke step berikutnya
    currentStep.value++
  }
}

const prevStep = (): void => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// ──────────────────────────────────────────────
// Submit
// ──────────────────────────────────────────────

const submitClaim = (status: ClaimSubmitStatus): void => {
  if (status === 'SUBMITTED' && hasErrors.value) {
    // Tandai semua step sebagai attempted agar inline error muncul
    stepAttempted.value[1] = true
    stepAttempted.value[2] = true
    stepAttempted.value[3] = true

    // Navigasi ke step pertama yang punya error
    const firstErrorStep = normalizedValidationErrors.value[0]?.step
    if (firstErrorStep) {
      currentStep.value = firstErrorStep
    }
    return
  }

  const selectedDefect = defectOptions.value.find(d => d.code === form.value.defectType)
  const created = createClaim({
    notificationCode: form.value.notificationCode,
    modelName: form.value.model,
    inch: Number(form.value.inch),
    branch: form.value.branch,
    vendorName: form.value.vendor,
    defectCode: form.value.defectType,
    defectName: selectedDefect?.name ?? form.value.defectType,
    panelPartNumber: form.value.panelPartNumber,
    ocSerialNo: form.value.ocSN,
    odfNumber: form.value.odfNumber || undefined,
    odfVersion: form.value.odfVersion || undefined,
    odfWeek: form.value.odfWeek || undefined,
    photos: photoRequirements.value
      .filter(req => uploads.value[req.id])
      .map(req => ({
        photoType: req.id as PhotoType,
        label: req.label,
        file: uploads.value[req.id] as File
      })),
    submitAs: status
  })

  toast.add({
    title: status === 'SUBMITTED' ? 'Claim Dikirim' : 'Draft Tersimpan',
    description: `Claim ${created.claimNumber} berhasil ${status === 'SUBMITTED' ? 'dikirim ke QRCC' : 'disimpan sebagai draft'}.`,
    color: 'success',
    icon: status === 'SUBMITTED' ? 'i-lucide-send' : 'i-lucide-save'
  })

  navigateTo(`/cs/claims/${created.claimNumber}`)
}

watch(() => form.value.model, (modelName) => {
  const model = referenceData.productModels.find(item => item.name === modelName)
  if (model) {
    form.value.inch = String(model.inch)
  }
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#050505] text-white">
    <!-- Header with Stepper -->
    <header class="cs-shell-x sticky top-0 z-30 border-b border-white/5 bg-[#050505]/80 py-6 backdrop-blur-md">
      <div class="cs-shell-container flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div class="flex items-center gap-6">
          <div>
            <h1 class="text-2xl font-black italic tracking-tighter flex items-center gap-3">
              <span class="bg-[#B6F500] text-black px-2 py-0.5 rounded italic">NEW</span>
              RMA CLAIM CREATION
            </h1>
            <div class="flex items-center gap-3 mt-1">
              <p class="text-white/40 text-xs font-bold uppercase tracking-widest">
                Buat laporan klaim RMA baru untuk panel bermasalah
              </p>
              <!-- Autosave Indicator -->
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

        <!-- Stepper -->
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
        <!-- Step 1: Info & Defect -->
        <div
          v-if="currentStep === 1"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <!-- Step 1 Error Summary -->
          <div
            v-if="stepAttempted[1] && step1Errors.length > 0"
            class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-3"
          >
            <div class="bg-red-500/10 p-1.5 rounded-lg">
              <AlertCircle class="w-4 h-4 text-red-400" />
            </div>
            <p class="text-xs font-bold text-red-400">
              {{ step1Errors.length }} field wajib belum diisi. Lengkapi sebelum melanjutkan.
            </p>
          </div>

          <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
              <!-- Notification Lookup -->
              <div class="group relative bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 overflow-hidden">
                <div class="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                  <Search class="w-32 h-32 rotate-12" />
                </div>

                <div class="flex items-center justify-between mb-4">
                  <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Initial Verification</label>
                  <div
                    v-if="notificationStatus"
                    :class="[
                      'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border animate-in fade-in zoom-in-95',
                      notificationStatusConfig
                    ]"
                  >
                    {{ notificationStatus }}
                  </div>
                </div>
                <div class="flex gap-4">
                  <div class="relative flex-1">
                    <input
                      v-model="form.notificationCode"
                      type="text"
                      placeholder="Enter Notification Code (e.g. NTF-2024003)"
                      :class="[
                        'w-full bg-white/5 border rounded-2xl px-6 py-4 font-bold focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                        stepAttempted[1] && !form.notificationCode.trim() ? 'border-red-500/40 focus:border-red-500' : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                      :disabled="notificationFound"
                      @keydown="handleNotificationKeydown"
                    >
                    <p
                      v-if="stepAttempted[1] && getFieldError('Notification Code')"
                      class="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      {{ getFieldError('Notification Code') }}
                    </p>
                  </div>
                  <button
                    :disabled="isSearching || !form.notificationCode.trim()"
                    class="bg-[#B6F500] hover:bg-[#a3db00] disabled:bg-white/10 disabled:text-white/20 text-black px-8 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95"
                    @click="handleLookup"
                  >
                    <Loader2
                      v-if="isSearching"
                      class="w-5 h-5 animate-spin"
                    />
                    <Search
                      v-else
                      class="w-5 h-5"
                    />
                    VERIFY
                  </button>
                </div>

                <div
                  v-if="notificationFound"
                  class="mt-6 flex items-center gap-3 bg-[#B6F500]/10 border border-[#B6F500]/20 rounded-xl p-4 animate-in zoom-in-95"
                >
                  <CheckCircle2 class="text-[#B6F500] w-5 h-5" />
                  <span class="text-sm font-bold text-[#B6F500]">Notifikasi ditemukan! Data produk terisi otomatis.</span>
                </div>

                <div
                  v-if="lookupError"
                  class="mt-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4"
                >
                  <AlertCircle class="text-amber-400 w-5 h-5 shrink-0" />
                  <span class="text-sm font-bold text-amber-400">{{ lookupError }}</span>
                </div>
              </div>

              <!-- Product & Defect Details -->
              <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
                <div class="flex items-center gap-3 border-b border-white/5 pb-6">
                  <div class="bg-white/5 p-2 rounded-lg">
                    <Package class="w-5 h-5 text-white/60" />
                  </div>
                  <h3 class="font-black text-lg">
                    Product Information
                  </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Product Model</label>
                    <UInputMenu
                      v-model="form.model"
                      :items="productModelOptions"
                      value-key="name"
                      label-key="name"
                      placeholder="Search or select product model..."
                      size="xl"
                      variant="none"
                      :disabled="notificationFound"
                      :ui="{
                        root: 'w-full',
                        base: [
                          'h-12 w-full rounded-xl bg-white/5 px-5 text-sm font-bold text-white',
                          'focus:ring-2 focus:ring-[#B6F500]/40 transition-all hover:bg-white/8',
                          'disabled:opacity-50 disabled:cursor-not-allowed',
                          stepAttempted[1] && !form.model
                            ? 'border border-red-500/40 focus:border-red-500'
                            : 'border border-white/10 focus:border-[#B6F500]'
                        ].join(' '),
                        content: 'bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1',
                        item: 'text-white/50 data-highlighted:text-black data-highlighted:before:bg-[#B6F500] font-bold text-xs py-3 transition-colors'
                      }"
                    />
                    <p
                      v-if="stepAttempted[1] && getFieldError('Product Model')"
                      class="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      {{ getFieldError('Product Model') }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Display Size (Inch)</label>
                    <input
                      v-model="form.inch"
                      type="number"
                      :class="[
                        'w-full bg-white/5 border rounded-xl px-5 py-3 text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
                        stepAttempted[1] && !asTrimmedString(form.inch) ? 'border-red-500/40 focus:border-red-500' : 'border-white/10 focus:border-[#B6F500]'
                      ]"
                      :disabled="notificationFound"
                    >
                    <p
                      v-if="stepAttempted[1] && getFieldError('Display Size')"
                      class="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      {{ getFieldError('Display Size') }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Panel Part Number</label>
                    <input
                      v-model="form.panelPartNumber"
                      type="text"
                      placeholder="Enter Part Number"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#B6F500]"
                    >
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">OC Serial Number</label>
                    <input
                      v-model="form.ocSN"
                      type="text"
                      placeholder="Enter SN"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#B6F500]"
                    >
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Service Branch</label>
                    <USelectMenu
                      v-model="form.branch"
                      :items="branchItems"
                      value-key="value"
                      label-key="label"
                      placeholder="Select Branch..."
                      variant="none"
                      :disabled="notificationFound"
                      :ui="getSelectMenuUi((stepAttempted[1] ?? false) && !form.branch)"
                    />
                    <p
                      v-if="stepAttempted[1] && getFieldError('Branch')"
                      class="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      {{ getFieldError('Branch') }}
                    </p>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Defect Type</label>
                    <USelectMenu
                      v-model="form.defectType"
                      :items="defectItems"
                      value-key="value"
                      label-key="label"
                      placeholder="Select Defect..."
                      variant="none"
                      :ui="getSelectMenuUi((stepAttempted[1] ?? false) && !form.defectType)"
                    />
                    <p
                      v-if="stepAttempted[1] && getFieldError('Defect Type')"
                      class="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      {{ getFieldError('Defect Type') }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Vendor Context Sidebar -->
            <div class="space-y-6">
              <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
                <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-6">
                  <div class="bg-white/5 p-2 rounded-lg">
                    <Info class="w-5 h-5 text-white/60" />
                  </div>
                  <h3 class="font-black text-lg">
                    Vendor Data
                  </h3>
                </div>

                <div class="space-y-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Assigned Vendor</label>
                    <USelectMenu
                      v-model="form.vendor"
                      :items="vendorItems"
                      value-key="value"
                      label-key="label"
                      placeholder="Select Vendor..."
                      variant="none"
                      :disabled="notificationFound"
                      :ui="getSelectMenuUi((stepAttempted[1] ?? false) && !form.vendor)"
                    />
                    <p
                      v-if="stepAttempted[1] && getFieldError('Vendor')"
                      class="mt-1.5 text-xs font-semibold text-red-400 flex items-center gap-1.5"
                    >
                      <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                      {{ getFieldError('Vendor') }}
                    </p>
                  </div>

                  <!-- Conditional Fields for MOKA -->
                  <div
                    v-if="requiresOdfFields"
                    class="space-y-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2"
                  >
                    <p class="text-[10px] font-black text-[#B6F500] uppercase tracking-widest">
                      Required ODF Data
                    </p>
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <label class="text-[10px] font-black uppercase tracking-widest text-white/40">ODF Number</label>
                        <input
                          v-model="form.odfNumber"
                          type="text"
                          :class="[
                            'w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs',
                            stepAttempted[1] && requiresOdfFields && !form.odfNumber.trim() ? 'border-red-500/40' : 'border-white/10'
                          ]"
                        >
                        <p
                          v-if="stepAttempted[1] && getFieldError('ODF Number')"
                          class="mt-1.5 text-[10px] font-semibold text-red-400 flex items-center gap-1.5"
                        >
                          <AlertCircle class="w-3 h-3 shrink-0" />
                          {{ getFieldError('ODF Number') }}
                        </p>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                          <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Version</label>
                          <input
                            v-model="form.odfVersion"
                            type="text"
                            :disabled="!requiresOdfVersion"
                            :class="[
                              'w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs',
                              stepAttempted[1] && requiresOdfVersion && !form.odfVersion.trim() ? 'border-red-500/40' : 'border-white/10'
                            ]"
                          >
                          <p
                            v-if="stepAttempted[1] && getFieldError('ODF Version')"
                            class="mt-1.5 text-[10px] font-semibold text-red-400 flex items-center gap-1.5"
                          >
                            <AlertCircle class="w-3 h-3 shrink-0" />
                            {{ getFieldError('ODF Version') }}
                          </p>
                        </div>
                        <div class="space-y-2">
                          <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Week</label>
                          <input
                            v-model="form.odfWeek"
                            type="text"
                            :disabled="!requiresOdfWeek"
                            :class="[
                              'w-full bg-white/5 border rounded-xl px-4 py-2.5 text-xs',
                              stepAttempted[1] && requiresOdfWeek && !form.odfWeek.trim() ? 'border-red-500/40' : 'border-white/10'
                            ]"
                          >
                          <p
                            v-if="stepAttempted[1] && getFieldError('ODF Week')"
                            class="mt-1.5 text-[10px] font-semibold text-red-400 flex items-center gap-1.5"
                          >
                            <AlertCircle class="w-3 h-3 shrink-0" />
                            {{ getFieldError('ODF Week') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-[#B6F500]/5 border border-[#B6F500]/20 rounded-2xl p-6">
                <div class="flex gap-4 text-sm text-[#B6F500]">
                  <AlertCircle class="w-5 h-5 shrink-0" />
                  <p class="font-bold">
                    Pastikan semua data sesuai dengan foto yang dilampirkan untuk menghindari penolakan oleh Verifikator.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Step 2: Photo Evidence -->
        <div
          v-if="currentStep === 2"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-black italic tracking-tight">
                EVIDENCE UPLOAD
              </h2>
              <p class="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                Requirements for vendor: <span class="text-white">{{ form.vendor }}</span>
              </p>
            </div>
            <div class="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <span class="text-xs font-black uppercase tracking-widest text-white/40">Progress: </span>
              <span class="text-sm font-black text-[#B6F500]">{{ Object.values(uploads).filter(v => v).length }} / {{ photoRequirements.length }}</span>
            </div>
          </div>

          <!-- Step 2 Error Summary -->
          <div
            v-if="stepAttempted[2] && step2Errors.length > 0"
            class="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-3"
          >
            <div class="bg-red-500/10 p-1.5 rounded-lg">
              <AlertCircle class="w-4 h-4 text-red-400" />
            </div>
            <p class="text-xs font-bold text-red-400">
              {{ step2Errors.length }} foto wajib belum diunggah. Lengkapi sebelum melanjutkan.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="req in photoRequirements"
              :key="req.id"
              class="space-y-2"
            >
              <div
                :class="[
                  'relative group rounded-4xl border-2 border-dashed transition-all duration-200 h-64 overflow-hidden',
                  dragOverId === req.id ? 'border-[#B6F500] scale-[1.02]' : '',
                  uploads[req.id] ? 'border-[#B6F500] bg-[#B6F500]/5' : '',
                  !uploads[req.id] && stepAttempted[2] && req.required ? 'border-red-500/40 bg-red-500/5 hover:border-red-500/60' : '',
                  !uploads[req.id] && (!stepAttempted[2] || !req.required) ? 'border-white/10 bg-white/2 hover:border-white/20' : ''
                ]"
                @dragover.prevent="onDragOver(req.id)"
                @dragleave="onDragLeave(req.id)"
                @drop.prevent="onDrop(req.id, $event)"
              >
                <!-- Dropzone / Empty State -->
                <label
                  v-if="!uploads[req.id]"
                  :for="`file-${req.id}`"
                  class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center"
                >
                  <div class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:bg-[#B6F500]/10">
                    <Camera class="w-6 h-6 text-white/40 group-hover:text-[#B6F500]" />
                  </div>
                  <p class="font-black text-sm mb-1 uppercase tracking-tight">{{ req.label }}</p>
                  <p
                    v-if="!stepAttempted[2] || !getFieldError(req.label)"
                    class="text-[10px] text-white/40 font-bold uppercase tracking-widest"
                  >
                    Click or drag image file
                  </p>
                  <p
                    v-else
                    class="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1"
                  >
                    <AlertCircle class="w-3 h-3" />
                    {{ getFieldError(req.label) }}
                  </p>
                  <div
                    v-if="req.required"
                    class="mt-4 px-2 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black rounded tracking-widest uppercase"
                  >Required</div>
                  <input
                    :id="`file-${req.id}`"
                    type="file"
                    class="hidden"
                    accept="image/*"
                    @change="(e: Event) => handleFileUpload(req.id, e)"
                  >
                </label>

                <!-- Preview State -->
                <div
                  v-else
                  class="absolute inset-0 flex flex-col"
                >
                  <div class="flex-1 min-h-0 overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
                    <img
                      :src="getPreviewUrl(req.id) || ''"
                      :alt="req.label"
                      class="w-full h-full object-cover rounded-2xl"
                    >
                  </div>
                  <div class="shrink-0 p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
                    <div class="min-w-0">
                      <p class="text-[10px] font-black uppercase tracking-tight truncate">
                        {{ uploads[req.id]?.name }}
                      </p>
                      <p class="text-[8px] text-white/40 uppercase tracking-widest">
                        {{ ((uploads[req.id]?.size || 0) / 1024 / 1024).toFixed(2) }} MB
                      </p>
                    </div>
                    <button
                      class="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                      @click="removeFile(req.id)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p
                v-if="uploadErrors[req.id]"
                class="text-xs text-red-400 font-bold"
              >
                {{ uploadErrors[req.id] }}
              </p>
            </div>
          </div>
        </div>

        <!-- Step 3: Review -->
        <div
          v-if="currentStep === 3"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl overflow-hidden">
            <div class="bg-[#B6F500] p-6 text-black flex items-center justify-between">
              <div>
                <h2 class="font-black text-lg uppercase tracking-tight">
                  Final Claim Summary
                </h2>
                <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                  Please review all data before submission
                </p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-black/10">
                <FileText class="w-6 h-6" />
              </div>
            </div>

            <div class="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
              <!-- Info Column -->
              <div class="space-y-8">
                <section>
                  <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div class="w-1 h-3 bg-[#B6F500]" /> Product & Defect
                  </h3>
                  <div class="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div
                      v-for="(val, label) in {
                        Notification: form.notificationCode,
                        Model: form.model,
                        Size: form.inch ? form.inch + ' Inch' : '',
                        Branch: form.branch,
                        Vendor: form.vendor,
                        Defect: defectOptions.find(d => d.code === form.defectType)?.name ?? form.defectType
                      }"
                      :key="label"
                    >
                      <p class="text-[8px] uppercase tracking-widest text-white/30 font-bold">
                        {{ label }}
                      </p>
                      <p
                        class="text-sm font-black"
                        :class="{ 'text-red-400/60': !val }"
                      >
                        {{ val || 'NOT PROVIDED' }}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <div class="w-1 h-3 bg-[#B6F500]" /> Hardware Identification
                  </h3>
                  <div class="space-y-3 bg-white/5 rounded-2xl p-4">
                    <div class="flex justify-between items-center border-b border-white/5 pb-2">
                      <span class="text-[10px] font-bold uppercase text-white/40">Panel Part Number</span>
                      <span
                        class="font-mono text-xs font-bold transition-colors"
                        :class="{ 'text-red-400/60': !form.panelPartNumber }"
                      >{{ form.panelPartNumber || 'NOT PROVIDED' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[10px] font-bold uppercase text-white/40">OC SN</span>
                      <span
                        class="font-mono text-xs font-bold transition-colors"
                        :class="{ 'text-red-400/60': !form.ocSN }"
                      >{{ form.ocSN || 'NOT PROVIDED' }}</span>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Photos Column -->
              <div class="space-y-6">
                <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div class="w-1 h-3 bg-[#B6F500]" /> Evidence Checklist
                </h3>
                <div class="space-y-2">
                  <div
                    v-for="req in photoRequirements"
                    :key="req.id"
                    class="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <div :class="['p-1.5 rounded-lg', uploads[req.id] ? 'bg-[#B6F500]/20 text-[#B6F500]' : 'bg-red-500/20 text-red-500']">
                      <Check
                        v-if="uploads[req.id]"
                        class="w-4 h-4"
                      />
                      <AlertCircle
                        v-else
                        class="w-4 h-4"
                      />
                    </div>
                    <span class="text-xs font-black uppercase tracking-tight flex-1">{{ req.label }}</span>
                    <span
                      v-if="uploads[req.id]"
                      class="text-[8px] font-black uppercase tracking-widest text-white/40"
                    >ATTACHED</span>
                    <span
                      v-else
                      class="text-[8px] font-black uppercase tracking-widest text-red-500"
                    >MISSING</span>
                  </div>
                </div>

                <div class="pt-6 border-t border-white/5">
                  <label class="flex items-start gap-4 cursor-pointer group">
                    <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-white/20 bg-transparent group-hover:border-[#B6F500] transition-colors">
                      <input
                        type="checkbox"
                        class="peer hidden"
                        checked
                      >
                      <Check class="w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity bg-[#B6F500]" />
                    </div>
                    <p class="text-xs font-bold text-white/40 group-hover:text-white transition-colors">
                      I hereby certify that all data entered and photos uploaded are genuine and represent the actual condition of the unit.
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Sticky Footer Actions -->
    <StickyActionBar container-class="cs-shell-container">
      <template #left>
        <button
          v-if="currentStep > 1"
          class="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm text-white/40 hover:bg-white/5 hover:text-white transition-all border border-white/10 active:scale-95"
          @click="prevStep"
        >
          <ArrowLeft class="w-4 h-4" /> BACK
        </button>
        <div v-else />
      </template>

      <button
        class="hidden md:flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm text-white/40 hover:bg-white/5 hover:text-white transition-all border border-white/10"
        @click="submitClaim('DRAFT')"
      >
        SAVE AS DRAFT
      </button>

      <button
        v-if="currentStep < 3"
        class="bg-[#B6F500] text-black px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(182,245,0,0.4)] active:scale-95"
        @click="nextStep"
      >
        CONTINUE <ArrowRight class="w-4 h-4" />
      </button>

      <button
        v-else
        class="bg-[#B6F500] text-black px-12 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(182,245,0,0.5)] active:scale-95"
        @click="submitClaim('SUBMITTED')"
      >
        SUBMIT TO QRCC <CheckCircle2 class="w-5 h-5" />
      </button>
    </StickyActionBar>
  </div>
</template>

<style scoped>
/* Custom styled select arrow - Removed after migration to USelectMenu */

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
