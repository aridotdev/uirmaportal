<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowLeft,
  AlertTriangle,
  History,
  CheckCircle2,
  XCircle,
  Upload,
  Monitor,
  Camera,
  Trash2,
  MessageSquare,
  Send,
  Info,
  Clock,
  ShieldAlert
} from 'lucide-vue-next'

const route = useRoute()
const claimId = route.params.id

// Mock Data Claim for Revision
const claim = ref({
  id: claimId || 'CLM-2024-0891',
  status: 'NEED_REVISION',
  notificationCode: '1000392',
  model: 'KD-55X7500H',
  vendor: 'MOKA',
  branch: 'Jakarta - Central Service',
  // Editable Fields
  panelSN: 'LTY550HN01-001-XJ82',
  ocSN: 'OC-9920334-ZV',
  defectType: 'Vertical Line',
  odfNumber: 'ODF-2024-X9',
  odfVersion: '1.2',
  odfWeek: 'W20',
  // Evidence States
  evidences: [
    { id: 'CLAIM', label: 'Main Claim Photo', status: 'VERIFIED', url: null },
    { id: 'CLAIM_ZOOM', label: 'Defect Zoom', status: 'REJECTED', url: null, note: 'Photo is blurry and too dark. Barcode not readable.' },
    { id: 'PANEL_SN', label: 'Panel Serial Number', status: 'VERIFIED', url: null },
    { id: 'ODF', label: 'ODF Document', status: 'PENDING', url: null }
  ],
  // History for timeline
  history: [
    { user: 'Budi (QRCC)', action: 'Rejected Claim', date: '2024-05-21 09:15', note: 'Please re-upload the Defect Zoom photo and double check the Panel SN.' },
    { user: 'Zaina (CS)', action: 'Submitted Claim', date: '2024-05-20 14:30', note: 'New claim created.' }
  ]
})

const revisionNote = ref('')
const newUploads = ref<Record<string, File | null>>({})

const handleFileUpload = (id: string, event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    newUploads.value[id] = target.files[0]
  }
}

const removeUpload = (id: string) => {
  newUploads.value[id] = null
}

const submitRevision = () => {
  console.log('Submitting Revision...', {
    panelSN: claim.value.panelSN,
    note: revisionNote.value,
    uploads: newUploads.value
  })
}
</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#050505] text-white">
    <!-- Header -->
    <header class="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-8 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-6">
          <NuxtLink :to="`/cs/claims/${claimId}`" class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <div>
            <h1 class="text-xl font-black italic tracking-tighter uppercase flex items-center gap-3">
              REVISE CLAIM: {{ claim.id }}
              <span class="bg-amber-500 text-black px-2 py-0.5 rounded italic text-[10px]">CORRECTION</span>
            </h1>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 p-8">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Left Column: Alerts & Revision History -->
        <div class="lg:col-span-4 space-y-6">
          <!-- Critical Revision Note -->
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-4xl p-8 relative overflow-hidden">
            <div class="absolute -top-4 -right-4 opacity-10">
              <ShieldAlert class="w-32 h-32 text-amber-500" />
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="bg-amber-500 p-2 rounded-lg text-black">
                  <AlertTriangle class="w-5 h-5" />
                </div>
                <h3 class="font-black text-amber-500 uppercase tracking-tight">QRCC Feedback</h3>
              </div>
              <p class="text-white/80 text-sm leading-relaxed font-bold italic">
                "{{ claim.history[0]?.note }}"
              </p>
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
            <h3 class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <History class="w-4 h-4" /> REVISION HISTORY
            </h3>
            <div class="space-y-8 relative before:absolute before:left-1.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
              <div v-for="(log, idx) in claim.history" :key="idx" class="relative pl-8">
                <div :class="['absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#0a0a0a] z-10', idx === 0 ? 'bg-amber-500' : 'bg-white/20']"></div>
                <p class="text-[10px] font-black uppercase tracking-widest" :class="idx === 0 ? 'text-amber-500' : 'text-white/40'">{{ log.action }}</p>
                <p class="text-[8px] text-white/20 font-bold mb-1">{{ log.date }} • {{ log.user }}</p>
                <p class="text-xs text-white/60 leading-snug">{{ log.note }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Form Edit -->
        <div class="lg:col-span-8 space-y-8">
          
          <!-- Context Read-Only -->
          <div class="bg-white/5 border border-white/10 rounded-4xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div v-for="(val, label) in { 'Notification': claim.notificationCode, 'Model': claim.model, 'Vendor': claim.vendor, 'Branch': claim.branch }" :key="label">
              <p class="text-[8px] font-black uppercase tracking-widest text-white/30">{{ label }}</p>
              <p class="text-sm font-black">{{ val }}</p>
            </div>
          </div>

          <!-- Editable Fields Section -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
            <div class="flex items-center gap-3 border-b border-white/5 pb-6">
              <div class="bg-white/5 p-2 rounded-lg"><Monitor class="w-5 h-5 text-white/60" /></div>
              <h3 class="font-black text-lg uppercase tracking-tight">Defect Info Correction</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2 group">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Panel Serial Number <span class="text-amber-500">*</span></label>
                <input v-model="claim.panelSN" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono tracking-wider">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">OC Serial Number</label>
                <input v-model="claim.ocSN" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:border-white/20">
              </div>
            </div>

            <div v-if="claim.vendor === 'MOKA'" class="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">ODF Number</label>
                <input v-model="claim.odfNumber" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Version</label>
                <input v-model="claim.odfVersion" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none">
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Week</label>
                <input v-model="claim.odfWeek" type="text" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none">
              </div>
            </div>
          </div>

          <!-- Evidence Revision Section -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-8">
            <div class="flex items-center gap-3 border-b border-white/5 pb-6">
              <div class="bg-white/5 p-2 rounded-lg"><Camera class="w-5 h-5 text-white/60" /></div>
              <h3 class="font-black text-lg uppercase tracking-tight">Evidence Verification</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="ev in claim.evidences" :key="ev.id" class="relative group">
                <!-- Verified/Pending State -->
                <div v-if="ev.status !== 'REJECTED'" class="h-48 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 grayscale opacity-60">
                  <component :is="ev.status === 'VERIFIED' ? CheckCircle2 : Clock" :class="['w-8 h-8 mb-3', ev.status === 'VERIFIED' ? 'text-[#B6F500]' : 'text-white/20']" />
                  <p class="text-[10px] font-black uppercase tracking-widest text-white/40">{{ ev.label }}</p>
                  <p class="text-[8px] font-black uppercase tracking-widest mt-1" :class="ev.status === 'VERIFIED' ? 'text-[#B6F500]' : 'text-white/20'">{{ ev.status }} - NO ACTION NEEDED</p>
                </div>

                <!-- Rejected / Re-upload State -->
                <div v-else class="space-y-3">
                   <div :class="['h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center relative transition-all overflow-hidden', newUploads[ev.id] ? 'border-amber-500 bg-amber-500/5' : 'border-red-500/40 bg-red-500/5']">
                      <label v-if="!newUploads[ev.id]" :for="`file-${ev.id}`" class="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center">
                        <Upload class="w-8 h-8 text-red-500 mb-3 animate-bounce" />
                        <p class="text-xs font-black uppercase text-red-500 mb-1">RE-UPLOAD REQUIRED</p>
                        <p class="text-[8px] font-bold text-white/40 uppercase tracking-widest">{{ ev.label }}</p>
                        <input :id="`file-${ev.id}`" type="file" class="hidden" @change="(e: Event) => handleFileUpload(ev.id, e)">
                      </label>
                      <div v-else class="absolute inset-0 flex flex-col p-4">
                        <div class="flex-1 bg-black rounded-xl flex items-center justify-center">
                           <CheckCircle2 class="text-amber-500 w-10 h-10" />
                        </div>
                        <div class="mt-3 flex items-center justify-between">
                          <span class="text-[8px] font-black uppercase text-amber-500">NEW FILE READY</span>
                          <button @click="removeUpload(ev.id)" class="text-red-500"><Trash2 class="w-4 h-4" /></button>
                        </div>
                      </div>
                   </div>
                   <!-- Feedback for Rejected photo -->
                   <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-3">
                     <Info class="w-4 h-4 text-red-500 shrink-0" />
                     <p class="text-[10px] text-red-400 font-bold leading-relaxed">{{ ev.note }}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revision Note for QRCC -->
          <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 space-y-6">
             <div class="flex items-center gap-3">
              <MessageSquare class="w-5 h-5 text-white/40" />
              <h3 class="font-black text-xs uppercase tracking-widest text-white/40">Revision Note to QRCC</h3>
            </div>
            <textarea 
              v-model="revisionNote"
              placeholder="Explain the changes you made (e.g. 'Photo re-uploaded with better lighting, SN corrected as per unit label')..."
              class="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-sm font-bold min-h-30 focus:outline-none focus:border-amber-500 transition-colors"
            ></textarea>
          </div>

        </div>
      </div>
    </main>

    <!-- Footer Actions -->
    <footer class="sticky bottom-0 z-40 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md px-8 py-6">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4 text-white/40">
           <AlertTriangle class="w-4 h-4 text-amber-500" />
           <span class="text-[10px] font-black uppercase tracking-widest">Awaiting Correction Summary</span>
        </div>

        <div class="flex items-center gap-4">
          <NuxtLink :to="`/cs/claims/${claimId}`" class="px-8 py-4 rounded-2xl font-black text-sm text-white/40 hover:text-white transition-all">
            CANCEL
          </NuxtLink>
          <button 
            @click="submitRevision"
            class="bg-amber-500 text-black px-12 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-95"
          >
            SUBMIT REVISION <Send class="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Optional styling */
</style>
