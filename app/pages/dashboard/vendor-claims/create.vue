<script setup lang="ts">
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Package2,
  Sparkles,
  X,
  AlertTriangle,
  Check,
  Loader2,
  Save
} from 'lucide-vue-next'

definePageMeta({ layout: 'dashboard' })

// ------- Types -------
interface Vendor {
  code: string
  name: string
  isActive: boolean
  pendingClaims: number
}

interface EligibleClaim {
  id: string
  claimNumber: string
  modelName: string
  panelPartNumber: string
  ocSN: string
  defect: string
  branch?: string
  odf?: string
  version?: string
  week?: string
}

// ------- Step State -------
const currentStep = ref<1 | 2 | 3>(1)

// ------- Step 1: Vendor -------
const vendors = ref<Vendor[]>([
  { code: 'MOKA', name: 'PT Moka Elektronik Indonesia', isActive: true, pendingClaims: 12 },
  { code: 'SDP', name: 'PT Sinar Display Prima', isActive: true, pendingClaims: 7 },
  { code: 'MTC', name: 'PT Mitra Teknologi Cemerlang', isActive: true, pendingClaims: 5 },
  { code: 'KNP', name: 'PT Karya Nusa Prima', isActive: true, pendingClaims: 8 },
  { code: 'ARC', name: 'PT Arcadia Display Systems', isActive: false, pendingClaims: 0 }
])
const selectedVendor = ref<string | null>(null)
const activeVendors = computed(() => vendors.value.filter(v => v.isActive))

// ------- Step 2: Eligible Claims -------
const eligibleClaimsMap: Record<string, EligibleClaim[]> = {
  MOKA: [
    { id: 'c1', claimNumber: 'CLM-20260301-001', modelName: '4T-C43HJ6000I', panelPartNumber: 'PNL001122', ocSN: 'OC-88712', defect: 'Blank Screen', branch: 'Jakarta', odf: 'ODF-A1', version: 'v2.3', week: 'W10' },
    { id: 'c2', claimNumber: 'CLM-20260302-010', modelName: '4T-C55HJ6000I', panelPartNumber: 'PNL334411', ocSN: 'OC-92100', defect: 'Line Vertical', branch: 'Surabaya', version: 'v2.1' },
    { id: 'c3', claimNumber: 'CLM-20260305-022', modelName: '4T-C65HJ6000I', panelPartNumber: 'PNL556677', ocSN: 'OC-10322', defect: 'Flickering', branch: 'Bandung', odf: 'ODF-B3' },
    { id: 'c4', claimNumber: 'CLM-20260307-033', modelName: '4T-C75HJ6000I', panelPartNumber: 'PNL778899', ocSN: 'OC-55001', defect: 'Blank Screen', branch: 'Medan', version: 'v2.3', week: 'W09' },
    { id: 'c5', claimNumber: 'CLM-20260310-044', modelName: '4T-C43HJ6000I', panelPartNumber: 'PNL990011', ocSN: 'OC-44223', defect: 'Color Distort', branch: 'Jakarta', odf: 'ODF-A2' }
  ],
  SDP: [
    { id: 'c6', claimNumber: 'CLM-20260304-012', modelName: '2T-C42FD1I', panelPartNumber: 'PNL221133', ocSN: 'OC-77512', defect: 'No Backlight', branch: 'Makassar' },
    { id: 'c7', claimNumber: 'CLM-20260306-020', modelName: '4T-C42FG1I', panelPartNumber: 'PNL443300', ocSN: 'OC-65321', defect: 'Line Vertical', branch: 'Solo', version: 'v1.8', week: 'W11' }
  ],
  MTC: [
    { id: 'c8', claimNumber: 'CLM-20260308-031', modelName: '4T-C55FJ1I', panelPartNumber: 'PNL112244', ocSN: 'OC-33111', defect: 'Flickering', branch: 'Bekasi' },
    { id: 'c9', claimNumber: 'CLM-20260309-040', modelName: '4T-C65FJ1I', panelPartNumber: 'PNL334455', ocSN: 'OC-22987', defect: 'Blank Screen', branch: 'Jakarta', odf: 'ODF-C1', version: 'v3.0' },
    { id: 'c10', claimNumber: 'CLM-20260311-052', modelName: '4T-C75FJ1I', panelPartNumber: 'PNL556600', ocSN: 'OC-11200', defect: 'No Signal', branch: 'Bandung', week: 'W10' }
  ],
  KNP: [
    { id: 'c11', claimNumber: 'CLM-20260312-060', modelName: '4T-C43ARI000I', panelPartNumber: 'PNL778811', ocSN: 'OC-66112', defect: 'Line Horizontal', branch: 'Surabaya', odf: 'ODF-D2' },
    { id: 'c12', claimNumber: 'CLM-20260313-072', modelName: '4T-C55ARI000I', panelPartNumber: 'PNL990022', ocSN: 'OC-55999', defect: 'Blank Screen', branch: 'Medan' },
    { id: 'c13', claimNumber: 'CLM-20260314-080', modelName: '4T-C65ARI000I', panelPartNumber: 'PNL112233', ocSN: 'OC-44876', defect: 'Color Distort', branch: 'Jakarta', version: 'v2.0', week: 'W12' }
  ]
}

const eligibleClaims = computed<EligibleClaim[]>(() =>
  selectedVendor.value ? (eligibleClaimsMap[selectedVendor.value] ?? []) : []
)

const selectedClaimIds = ref<Set<string>>(new Set())

const toggleClaim = (id: string) => {
  const s = new Set(selectedClaimIds.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  selectedClaimIds.value = s
}

const allSelected = computed(() =>
  eligibleClaims.value.length > 0
  && eligibleClaims.value.every(c => selectedClaimIds.value.has(c.id))
)

const toggleAll = () => {
  if (allSelected.value) {
    selectedClaimIds.value = new Set()
  } else {
    selectedClaimIds.value = new Set(eligibleClaims.value.map(c => c.id))
  }
}

// ------- Computed Summary -------
const selectedClaims = computed(() =>
  eligibleClaims.value.filter(c => selectedClaimIds.value.has(c.id))
)

const uniqueModel = computed(() => new Set(selectedClaims.value.map(c => c.modelName)).size)
const uniqueDefects = computed(() => new Set(selectedClaims.value.map(c => c.defect)).size)
const uniqueBranches = computed(() => new Set(selectedClaims.value.map(c => c.branch).filter(Boolean)).size)
const selectedVendorObj = computed(() => vendors.value.find(v => v.code === selectedVendor.value))

// ------- Output Estimasi -------
const currentYYYYMM = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
})

// ------- Navigation -------
const stepError = ref('')

const goToStep2 = () => {
  if (!selectedVendor.value) {
    stepError.value = 'Pilih vendor terlebih dahulu.'
    return
  }
  stepError.value = ''
  currentStep.value = 2
}

const goToStep3 = () => {
  if (selectedClaimIds.value.size === 0) {
    stepError.value = 'Pilih minimal 1 klaim.'
    return
  }
  stepError.value = ''
  currentStep.value = 3
}

const isGenerating = ref(false)

const generate = async () => {
  isGenerating.value = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  isGenerating.value = false
  // After generate: redirect to detail with a mock new ID
  await navigateTo('/dashboard/vendor-claims/new-001')
}

const saveAsDraft = () => {
  useToast().add({
    title: 'Draft Saved',
    description: `Vendor claim draft for ${selectedVendor.value} with ${selectedClaimIds.value.size} items saved.`,
    color: 'success'
  })
}

// Reset step 2 selection when vendor changes
watch(selectedVendor, () => {
  selectedClaimIds.value = new Set()
})
</script>

<template>
  <div class="p-6 lg:p-12 space-y-8">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/dashboard/vendor-claims"
        class="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white"
      >
        <X :size="18" />
      </NuxtLink>
      <div>
        <div class="flex items-center gap-3 mb-1">
          <Package2
            class="text-[#B6F500]"
            :size="20"
          />
          <h1 class="text-3xl font-black italic tracking-tighter uppercase">
            Buat Vendor Claim
          </h1>
        </div>
        <p class="text-white/40 text-sm font-medium">
          Pilih vendor dan klaim yang akan di-batch.
        </p>
      </div>
    </div>

    <!-- Step Indicator -->
    <WorkflowStepper
      :steps="3"
      :current-step="currentStep"
      :labels="['Pilih Vendor', 'Pilih Klaim', 'Review & Generate']"
    />

    <!-- Error Banner -->
    <div
      v-if="stepError"
      class="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300"
    >
      <AlertTriangle
        :size="18"
        class="shrink-0 text-amber-400"
      />
      <span class="font-semibold">{{ stepError }}</span>
    </div>

    <!-- ===== STEP 1: SELECT VENDOR ===== -->
    <div
      v-if="currentStep === 1"
      class="space-y-6"
    >
      <section class="rounded-4xl border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(182,245,0,0.07),transparent_30%),rgba(255,255,255,0.03)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <p class="mb-5 text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
          Active Vendors
        </p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="vendor in activeVendors"
            :key="vendor.code"
            :class="[
              'group relative flex flex-col items-start gap-1 rounded-2xl border p-5 text-left transition-all',
              selectedVendor === vendor.code
                ? 'border-[#B6F500]/60 bg-[#B6F500]/10 shadow-[0_0_24px_rgba(182,245,0,0.15)]'
                : 'border-white/8 bg-white/2.5 hover:border-white/16 hover:bg-white/5'
            ]"
            @click="selectedVendor = vendor.code; stepError = ''"
          >
            <div class="flex w-full items-start justify-between">
              <span
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest',
                  selectedVendor === vendor.code ? 'bg-[#B6F500] text-black' : 'bg-white/5 border border-white/10 text-white/60'
                ]"
              >
                {{ vendor.code }}
              </span>
              <div
                v-if="selectedVendor === vendor.code"
                class="h-5 w-5 rounded-full bg-[#B6F500] flex items-center justify-center"
              >
                <Check
                  :size="12"
                  class="text-black"
                />
              </div>
            </div>
            <p class="mt-2 text-sm font-bold text-white/80 group-hover:text-white transition-colors">
              {{ vendor.name }}
            </p>
            <p class="text-[10px] font-black uppercase tracking-widest text-white/30">
              {{ vendor.pendingClaims }} klaim tersedia
            </p>
          </button>
        </div>
      </section>

      <div class="flex justify-end">
        <button
          class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          :disabled="!selectedVendor"
          @click="goToStep2"
        >
          Pilih Klaim <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- ===== STEP 2: SELECT CLAIMS ===== -->
    <div
      v-else-if="currentStep === 2"
      class="space-y-6"
    >
      <!-- Vendor info banner -->
      <div class="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/2.5 px-5 py-4">
        <span class="px-3 py-1.5 rounded-lg bg-[#B6F500]/15 border border-[#B6F500]/30 text-sm font-black text-[#B6F500] uppercase tracking-widest">
          {{ selectedVendor }}
        </span>
        <div>
          <p class="text-sm font-bold text-white/80">
            {{ selectedVendorObj?.name }}
          </p>
          <p class="text-[10px] font-black uppercase tracking-widest text-white/30">
            {{ eligibleClaims.length }} klaim eligible
          </p>
        </div>
        <button
          class="ml-auto text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white underline transition-colors"
          @click="currentStep = 1; selectedClaimIds = new Set()"
        >
          Ganti Vendor
        </button>
      </div>

      <!-- Select all bar -->
      <div class="flex items-center justify-between rounded-2xl border border-white/8 bg-white/2.5 px-5 py-4">
        <div class="flex items-center gap-3">
          <button
            :class="[
              'h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
              allSelected ? 'bg-[#B6F500] border-[#B6F500]' : 'border-white/20 hover:border-white/40'
            ]"
            @click="toggleAll"
          >
            <Check
              v-if="allSelected"
              :size="12"
              class="text-black"
            />
          </button>
          <span class="text-xs font-bold text-white/60">Select All</span>
        </div>
        <div class="text-[10px] font-black uppercase tracking-widest text-white/40">
          <span class="text-[#B6F500]">{{ selectedClaimIds.size }}</span> / {{ eligibleClaims.length }} selected
        </div>
      </div>

      <!-- Selection Summary Bar -->
      <div
        v-if="selectedClaimIds.size > 0"
        class="flex flex-wrap items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/8"
      >
        <div class="text-xs text-white/60">
          Selected: <strong class="text-[#B6F500]">{{ selectedClaimIds.size }}</strong> / {{ eligibleClaims.length }}
        </div>
        <div class="h-4 w-px bg-white/10" />
        <div class="text-xs text-white/60">
          Unique Models: <strong class="text-white/80">{{ uniqueModel }}</strong>
        </div>
        <div class="h-4 w-px bg-white/10" />
        <div class="text-xs text-white/60">
          Unique Defects: <strong class="text-white/80">{{ uniqueDefects }}</strong>
        </div>
        <div class="h-4 w-px bg-white/10" />
        <div class="text-xs text-white/60">
          Branches: <strong class="text-white/80">{{ uniqueBranches }}</strong>
        </div>
      </div>

      <!-- Claims List -->
      <div class="space-y-2">
        <button
          v-for="claim in eligibleClaims"
          :key="claim.id"
          :class="[
            'group w-full flex items-start gap-4 rounded-2xl border p-4 text-left transition-all',
            selectedClaimIds.has(claim.id)
              ? 'border-[#B6F500]/30 bg-[#B6F500]/5'
              : 'border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/4'
          ]"
          @click="toggleClaim(claim.id); stepError = ''"
        >
          <!-- Checkbox -->
          <div
            :class="[
              'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
              selectedClaimIds.has(claim.id) ? 'bg-[#B6F500] border-[#B6F500]' : 'border-white/20 group-hover:border-white/40'
            ]"
          >
            <Check
              v-if="selectedClaimIds.has(claim.id)"
              :size="12"
              class="text-black"
            />
          </div>

          <!-- Claim Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="font-black text-sm text-[#B6F500] tracking-tighter">{{ claim.claimNumber }}</span>
              <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/50">{{ claim.modelName }}</span>
              <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/50">{{ claim.defect }}</span>
              <!-- <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/50">{{ claim.branch }}</span> -->
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1">
              <div class="text-[10px] text-white/40 font-bold">
                <span class="text-white/20">Panel Part Number</span> {{ claim.panelPartNumber }}
              </div>
              <div class="text-[10px] text-white/40 font-bold">
                <span class="text-white/20">OC SN</span> {{ claim.ocSN }}
              </div>
              <template v-if="claim.odf">
                <div class="text-[10px] text-white/40 font-bold">
                  <span class="text-white/20">ODF</span> {{ claim.odf }}
                </div>
              </template>
              <template v-if="claim.version">
                <div class="text-[10px] text-white/40 font-bold">
                  <span class="text-white/20">Ver</span> {{ claim.version }}
                </div>
              </template>
              <template v-if="claim.week">
                <div class="text-[10px] text-white/40 font-bold">
                  <span class="text-white/20">Week</span> {{ claim.week }}
                </div>
              </template>
            </div>
          </div>
        </button>

        <!-- No claims for vendor -->
        <div
          v-if="eligibleClaims.length === 0"
          class="py-20 text-center"
        >
          <div class="flex flex-col items-center gap-4">
            <div class="p-6 rounded-full bg-white/5">
              <FileText
                :size="40"
                class="text-white/10"
              />
            </div>
            <p class="text-white/20 font-bold uppercase tracking-widest text-sm">
              Tidak ada klaim eligible untuk vendor ini
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-between gap-4">
        <button
          class="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/10 hover:text-white"
          @click="currentStep = 1"
        >
          Kembali
        </button>
        <button
          class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
          :disabled="selectedClaimIds.size === 0"
          @click="goToStep3"
        >
          Review <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- ===== STEP 3: REVIEW & GENERATE ===== -->
    <div
      v-else-if="currentStep === 3"
      class="space-y-6"
    >
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          v-for="(stat, i) in [
            { label: 'Vendor', value: selectedVendor, sub: selectedVendorObj?.name },
            { label: 'Total Klaim', value: selectedClaimIds.size, sub: 'klaim terpilih' },
            { label: 'Unique Model', value: uniqueModel, sub: 'model berbeda' },
            { label: 'Unique Defect', value: uniqueDefects, sub: 'tipe kerusakan' }
          ]"
          :key="i"
          class="rounded-2xl border border-white/8 bg-white/2.5 p-5"
        >
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/28 mb-2">
            {{ stat.label }}
          </p>
          <p class="text-2xl font-black tracking-tight text-[#B6F500]">
            {{ stat.value }}
          </p>
          <p class="text-[10px] text-white/35 font-semibold mt-1 truncate">
            {{ stat.sub }}
          </p>
        </div>
      </div>

      <!-- Selected Claims Table -->
      <section class="rounded-4xl border border-white/8 bg-[rgba(255,255,255,0.03)] overflow-hidden">
        <div class="px-6 py-5 border-b border-white/6">
          <p class="text-[11px] font-black uppercase tracking-[0.26em] text-white/40">
            Klaim Yang Akan Di-Batch
          </p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-left min-w-150">
            <thead>
              <tr class="border-b border-white/5">
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Claim #
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Model Name
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Defect
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Panel Part Number
                </th>
                <th class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  OC SN
                </th>
                <!-- <th class="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  Inch
                </th> -->
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr
                v-for="claim in selectedClaims"
                :key="claim.id"
                class="hover:bg-white/2 transition-colors"
              >
                <td class="px-6 py-4 font-black text-sm text-[#B6F500] tracking-tighter">
                  {{ claim.claimNumber }}
                </td>
                <td class="px-6 py-4 text-xs text-white/70 font-bold">
                  {{ claim.modelName }}
                </td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white/50">
                    {{ claim.defect }}
                  </span>
                </td>
                <td class="px-6 py-4 text-xs text-white/50 font-mono">
                  {{ claim.panelPartNumber }}
                </td>
                <td class="px-6 py-4 text-xs text-white/50 font-mono">
                  {{ claim.ocSN }}
                </td>
                <!-- <td class="px-6 py-4 text-xs text-white/50 font-bold">
                  {{ claim.inch }}"
                </td> -->
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Confirmation Note -->
      <div class="flex items-start gap-3 rounded-2xl border border-[#B6F500]/20 bg-[#B6F500]/5 px-5 py-4">
        <CheckCircle2
          :size="18"
          class="shrink-0 text-[#B6F500] mt-0.5"
        />
        <div>
          <p class="text-sm font-bold text-[#B6F500]">
            Siap untuk di-generate
          </p>
          <p class="text-xs text-white/50 mt-0.5">
            Batch baru akan dibuat dengan status <strong class="text-white/70">CREATED</strong>. Setiap klaim akan menjadi VC item dengan keputusan awal <strong class="text-white/70">PENDING</strong>.
          </p>
        </div>
      </div>

      <!-- Output Estimasi -->
      <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 class="text-blue-400 font-semibold text-sm mb-2">
          Output Estimasi
        </h4>
        <ul class="text-sm text-white/60 space-y-1">
          <li>Vendor Claim Number: <strong class="text-white/80">VC-{{ currentYYYYMM }}-XXX</strong> (auto-generated)</li>
          <li>Total items: <strong class="text-white/80">{{ selectedClaims.length }}</strong></li>
          <li>File Excel akan otomatis di-generate setelah batch dibuat</li>
        </ul>
      </div>

      <StickyActionBar>
        <template #left>
          <div class="flex items-center gap-3">
            <button
              class="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/10 hover:text-white"
              :disabled="isGenerating"
              @click="currentStep = 2"
            >
              Kembali
            </button>
            <button
              class="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 transition-all hover:bg-white/10 hover:text-white"
              :disabled="isGenerating"
              @click="saveAsDraft"
            >
              <Save :size="14" />
              Save as Draft
            </button>
          </div>
        </template>
        <button
          class="inline-flex items-center gap-2 rounded-2xl bg-[#B6F500] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-[#B6F500]/10 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          :disabled="isGenerating"
          @click="generate"
        >
          <Loader2
            v-if="isGenerating"
            :size="16"
            class="animate-spin"
          />
          <Sparkles
            v-else
            :size="16"
          />
          {{ isGenerating ? 'Generating...' : 'Generate Batch' }}
        </button>
      </StickyActionBar>
    </div>
  </div>
</template>

<style scoped>
button { transition: transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease; }
</style>
