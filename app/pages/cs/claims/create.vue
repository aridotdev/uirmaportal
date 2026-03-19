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
  Monitor,
  Info
} from 'lucide-vue-next'

import type { NotificationStatus } from '~~/shared/utils/constants'
import { INITIAL_VENDORS } from '~~/shared/utils/constants'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface NotificationLookupResponse {
  notification: {
    id: number
    notificationCode: string
    notificationDate: number
    branch: string
    status: NotificationStatus
  }
  productModel: {
    id: number
    name: string
    inch: number
  } | null
  vendor: {
    id: number
    code: string
    name: string
    requiredPhotos: string[]
    requiredFields: Array<'odfNumber' | 'version' | 'week'>
  } | null
  defects: Array<{
    id: number
    code: string
    name: string
  }>
}

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
  panelSN: string
  ocSN: string
  defectType: string
  odfNumber: string
  odfVersion: string
  odfWeek: string
}

type ClaimSubmitStatus = 'DRAFT' | 'SUBMITTED'

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

/**
 * Extract notification code from query string.
 * Uses a plain function (not computed) to avoid reactivity timing issues
 * where computed may not be settled when ref() initializer runs.
 */
const getInitialNotificationCode = (): string => {
  const code = route.query.notification
  return typeof code === 'string' ? code.trim() : ''
}

// ──────────────────────────────────────────────
// Wizard State
// ──────────────────────────────────────────────

const currentStep = ref<number>(1)
const isSearching = ref<boolean>(false)
const notificationFound = ref<boolean>(false)
const lookupError = ref<string>('')

// ──────────────────────────────────────────────
// Form State
// ──────────────────────────────────────────────

const form = ref<ClaimFormState>({
  notificationCode: getInitialNotificationCode(),
  model: '',
  inch: '',
  branch: '',
  vendor: '',
  panelSN: '',
  ocSN: '',
  defectType: '',
  odfNumber: '',
  odfVersion: '',
  odfWeek: ''
})

// ──────────────────────────────────────────────
// Reference Data
// ──────────────────────────────────────────────

const vendors: readonly string[] = INITIAL_VENDORS
const branches: readonly string[] = ['JAKARTA', 'SURABAYA', 'MEDAN', 'BANDUNG', 'MAKASSAR'] as const

/**
 * Default defect options used as fallback when no lookup has been performed.
 * After a successful lookup, these get replaced by the API response.
 */
const DEFAULT_DEFECT_OPTIONS: ReadonlyArray<{ code: string, name: string }> = [
  { code: 'DEF-001', name: 'No Display' },
  { code: 'DEF-002', name: 'Vertical Line' },
  { code: 'DEF-003', name: 'Horizontal Line' },
  { code: 'DEF-004', name: 'Broken Panel' },
  { code: 'DEF-005', name: 'Flicker' },
  { code: 'DEF-006', name: 'Dark Spot' },
  { code: 'DEF-007', name: 'Backlight Bleed' }
] as const

const defectOptions = ref<Array<{ code: string, name: string }>>([...DEFAULT_DEFECT_OPTIONS])

// ──────────────────────────────────────────────
// Photo Requirements (vendor-driven)
// ──────────────────────────────────────────────

const PHOTO_LABEL_MAP: Record<string, string> = {
  CLAIM: 'Main Claim Photo',
  CLAIM_ZOOM: 'Defect Zoom',
  PANEL_SN: 'Panel Serial Number',
  ODF: 'ODF Document',
  WO_PANEL: 'Work Order Panel',
  WO_PANEL_SN: 'Work Order Panel SN'
} as const

const VENDOR_RULES_FALLBACK: Record<string, {
  requiredPhotos: string[]
  requiredFields: Array<'odfNumber' | 'version' | 'week'>
}> = {
  MOKA: {
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'],
    requiredFields: ['odfNumber', 'version', 'week']
  },
  MTC: {
    requiredPhotos: ['CLAIM', 'PANEL_SN', 'WO_PANEL'],
    requiredFields: []
  },
  SDP: {
    requiredPhotos: ['CLAIM', 'PANEL_SN'],
    requiredFields: []
  }
} as const

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

const uploads = ref<Record<string, File | null>>({})

// ──────────────────────────────────────────────
// Notification Lookup
// ──────────────────────────────────────────────

const applyLookupData = (data: NotificationLookupResponse): void => {
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
  lookupError.value = ''
}

const handleLookup = async (): Promise<void> => {
  const code = form.value.notificationCode.trim()
  if (!code) return

  isSearching.value = true
  lookupError.value = ''
  notificationFound.value = false

  try {
    const data = await $fetch<NotificationLookupResponse>(
      `/api/notifications/${encodeURIComponent(code)}`
    )
    applyLookupData(data)
  } catch (error: unknown) {
    const fetchError = error as { statusCode?: number, statusMessage?: string }
    if (fetchError.statusCode === 404) {
      lookupError.value = `Notifikasi "${code}" tidak ditemukan. Anda tetap bisa melanjutkan input manual.`
    } else {
      lookupError.value = 'Gagal mengambil data notifikasi. Silakan coba lagi.'
    }
    lookupVendorCode.value = ''
    vendorRequiredPhotos.value = []
    vendorRequiredFields.value = []
    defectOptions.value = [...DEFAULT_DEFECT_OPTIONS]
    notificationFound.value = false
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
    // Ensure form has the notification code before lookup
    form.value.notificationCode = code
    await handleLookup()
  }
})

// ──────────────────────────────────────────────
// File Upload
// ──────────────────────────────────────────────

const handleFileUpload = (reqId: string, event: Event): void => {
  const target = event.target as HTMLInputElement
  if (target.files?.[0]) {
    uploads.value[reqId] = target.files[0]
  }
}

const removeFile = (reqId: string): void => {
  uploads.value[reqId] = null
}

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
  console.log(`Submitting claim as ${status}`, { ...form.value, photos: uploads.value })
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#050505] text-white">
    <!-- Header with Stepper -->
    <header class="sticky top-0 z-30 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-8 py-6">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-2xl font-black italic tracking-tighter flex items-center gap-3">
            <span class="bg-[#B6F500] text-black px-2 py-0.5 rounded italic">NEW</span>
            RMA CLAIM CREATION
          </h1>
          <p class="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
            Create a new service report for defective panels
          </p>
        </div>

        <!-- Stepper Visual -->
        <div class="flex items-center gap-4">
          <div
            v-for="step in 3"
            :key="step"
            class="flex items-center"
          >
            <div
              :class="[
                'flex h-10 w-10 items-center justify-center rounded-xl font-black transition-all duration-500',
                currentStep >= step ? 'bg-[#B6F500] text-black shadow-[0_0_15px_rgba(182,245,0,0.3)]' : 'bg-white/5 text-white/20'
              ]"
            >
              {{ step }}
            </div>
            <div
              v-if="step < 3"
              :class="['w-12 h-0.5 mx-2 rounded-full', currentStep > step ? 'bg-[#B6F500]' : 'bg-white/5']"
            />
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 p-8">
      <div class="max-w-6xl mx-auto">
        <!-- Step 1: Info & Defect -->
        <div
          v-if="currentStep === 1"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
              <!-- Notification Lookup -->
              <div class="group relative bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 overflow-hidden">
                <div class="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                  <Search class="w-32 h-32 rotate-12" />
                </div>

                <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">Initial Verification</label>
                <div class="flex gap-4">
                  <div class="relative flex-1">
                    <input
                      v-model="form.notificationCode"
                      type="text"
                      placeholder="Enter Notification Code (e.g. NTF-2024003)"
                      class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-[#B6F500] transition-colors"
                      @keydown="handleNotificationKeydown"
                    >
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
                  <span class="text-sm font-bold text-[#B6F500]">Notification found! Product data has been auto-filled.</span>
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
                    <input
                      v-model="form.model"
                      type="text"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#B6F500]"
                    >
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Display Size (Inch)</label>
                    <input
                      v-model="form.inch"
                      type="number"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-[#B6F500]"
                    >
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Panel Serial Number</label>
                    <input
                      v-model="form.panelSN"
                      type="text"
                      placeholder="Enter SN"
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
                    <select
                      v-model="form.branch"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm appearance-none focus:outline-none focus:border-[#B6F500]"
                    >
                      <option
                        value=""
                        disabled
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
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Defect Type</label>
                    <select
                      v-model="form.defectType"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm appearance-none focus:outline-none focus:border-[#B6F500]"
                    >
                      <option
                        value=""
                        disabled
                      >
                        Select Defect
                      </option>
                      <option
                        v-for="d in defectOptions"
                        :key="d.code"
                        :value="d.code"
                        class="bg-[#0a0a0a]"
                      >
                        {{ d.name }} ({{ d.code }})
                      </option>
                    </select>
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
                    Vendor Rules
                  </h3>
                </div>

                <div class="space-y-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Assigned Vendor</label>
                    <select
                      v-model="form.vendor"
                      class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm appearance-none focus:outline-none focus:border-[#B6F500]"
                    >
                      <option
                        v-for="v in vendors"
                        :key="v"
                        :value="v"
                        class="bg-[#0a0a0a]"
                      >
                        {{ v }}
                      </option>
                    </select>
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
                          class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs"
                        >
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                          <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Version</label>
                          <input
                            v-model="form.odfVersion"
                            type="text"
                            :disabled="!requiresOdfVersion"
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs"
                          >
                        </div>
                        <div class="space-y-2">
                          <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Week</label>
                          <input
                            v-model="form.odfWeek"
                            type="text"
                            :disabled="!requiresOdfWeek"
                            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs"
                          >
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
                    Ensure all Serial Numbers match the photo evidence to avoid rejection by QRCC.
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

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="req in photoRequirements"
              :key="req.id"
              :class="[
                'relative group rounded-4xl border-2 border-dashed transition-all duration-300 h-64 overflow-hidden',
                uploads[req.id] ? 'border-[#B6F500] bg-[#B6F500]/5' : 'border-white/10 bg-white/2 hover:border-white/20'
              ]"
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
                <p class="text-[10px] text-white/40 font-bold uppercase tracking-widest">Click or drag image file</p>
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
                <div class="flex-1 bg-zinc-900 flex items-center justify-center p-2">
                  <div class="w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                    <Monitor class="w-12 h-12 text-white/10" />
                    <!-- In real app: <img :src="URL.createObjectURL(uploads[req.id])" class="object-contain w-full h-full" /> -->
                  </div>
                </div>
                <div class="p-4 bg-white/5 border-t border-white/5 flex items-center justify-between">
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
                      <p class="text-sm font-black">
                        {{ val || '-' }}
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
                      <span class="text-[10px] font-bold uppercase text-white/40">Panel SN</span>
                      <span class="font-mono text-xs font-bold">{{ form.panelSN || 'NOT PROVIDED' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[10px] font-bold uppercase text-white/40">OC SN</span>
                      <span class="font-mono text-xs font-bold">{{ form.ocSN || 'NOT PROVIDED' }}</span>
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
    <footer class="sticky bottom-0 z-30 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md px-8 py-6">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <button
          v-if="currentStep > 1"
          class="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm text-white/60 hover:text-white transition-all"
          @click="prevStep"
        >
          <ArrowLeft class="w-4 h-4" /> BACK
        </button>
        <div v-else />

        <div class="flex items-center gap-4">
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
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Custom styled select arrow */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' opacity='0.4'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1.25rem center;
  background-size: 1rem;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
