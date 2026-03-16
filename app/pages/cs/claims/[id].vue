<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  FileText,
  History,
  Image as ImageIcon,
  Info,
  MapPin,
  Monitor,
  Package,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  User,
  ExternalLink
} from 'lucide-vue-next'

const route = useRoute()
const claimId = route.params.id

// State
const activeTab = ref('overview')

// Mock Data Claim
const claim = ref({
  id: claimId || '1000392',
  status: 'NEED_REVISION', // DRAFT, SUBMITTED, IN_REVIEW, NEED_REVISION, APPROVED
  createdAt: '2024-05-20 14:30',
  updatedAt: '2024-05-21 09:15',
  agent: 'Zaina Riddle',
  branch: 'Jakarta - Central Service',
  notificationCode: '10029334',
  product: {
    model: 'KD-55X7500H',
    size: '55 Inch',
    vendor: 'MOKA',
    panelSN: 'LTY550HN01-001-XJ82',
    ocSN: 'OC-9920334-ZV',
    defect: 'Vertical Line'
  },
  revisionNote: 'The Panel Serial Number photo is blurry. Please re-upload with a clearer shot focusing on the barcode.'
})

// Status Badge Config
const statusConfig = computed(() => {
  const configs: Record<string, { label: string; class: string; icon: any }> = {
    DRAFT: { label: 'Draft', class: 'bg-white/10 text-white/60', icon: FileText },
    SUBMITTED: { label: 'Submitted', class: 'bg-blue-500/10 text-blue-400', icon: Clock },
    IN_REVIEW: { label: 'In Review', class: 'bg-blue-500/10 text-blue-400', icon: ShieldCheck },
    NEED_REVISION: { label: 'Need Revision', class: 'bg-amber-500/10 text-amber-500', icon: AlertTriangle },
    APPROVED: { label: 'Approved', class: 'bg-[#B6F500]/10 text-[#B6F500]', icon: ShieldCheck },
    ARCHIVED: { label: 'Archived', class: 'bg-white/5 text-white/20', icon: History }
  }
  return configs[claim.value.status] || configs.DRAFT
})

const tabs = [
  { id: 'overview', label: 'Claim Overview', icon: Info },
  { id: 'photos', label: 'Photo Evidence', icon: ImageIcon },
  { id: 'history', label: 'Claim History', icon: History }
]
</script>

<template>
  <div class="flex flex-col bg-[#050505] text-white">
    <!-- Top Navigation Bar -->
    <nav class="sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md px-8 py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-6">
          <NuxtLink 
            to="/cs/claims" 
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-black italic tracking-tighter uppercase">{{ claim.id }}</h1>
              <div :class="['flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5', statusConfig?.class]">
                <component :is="statusConfig?.icon" class="w-3 h-3" />
                {{ statusConfig?.label }}
              </div>
            </div>
            <p class="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">Created on {{ claim.createdAt }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Action: Revise if Needed -->
          <NuxtLink 
            v-if="claim.status === 'NEED_REVISION'"
            :to="`/cs/claim/${claim.id}/edit`"
            class="flex items-center gap-2 bg-amber-500 text-black px-6 py-2.5 rounded-xl font-black text-xs transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          >
            <Edit3 class="w-4 h-4" /> REVISE CLAIM
          </NuxtLink>
          
          <button class="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl font-black text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all">
            PRINT REPORT
          </button>
        </div>
      </div>
    </nav>

    <main class="flex-1 p-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Revision Warning Banner -->
        <div 
          v-if="claim.status === 'NEED_REVISION'" 
          class="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-[24px] p-6 flex items-start gap-5 animate-in slide-in-from-top-4"
        >
          <div class="bg-amber-500 text-black p-3 rounded-2xl">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <h3 class="font-black text-amber-500 uppercase tracking-tight text-sm">Revision Required from QRCC</h3>
            <p class="text-white/70 text-sm mt-1 leading-relaxed">{{ claim.revisionNote }}</p>
          </div>
          <div class="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Ref: #QRCC-99</div>
        </div>

        <!-- Custom Tabs -->
        <div class="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit mb-8">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all',
              activeTab === tab.id ? 'bg-[#B6F500] text-black shadow-lg' : 'text-white/40 hover:text-white'
            ]"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Content Area -->
        <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          
          <!-- Column 1: Core Info -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Information Grid -->
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 overflow-hidden relative">
              <div class="absolute top-0 right-0 p-8 opacity-5">
                <FileText class="w-32 h-32 rotate-12" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section class="space-y-6">
                  <div class="space-y-1">
                    <p class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Notification Code</p>
                    <div class="flex items-center gap-2">
                      <span class="text-xl font-black text-[#B6F500]">{{ claim.notificationCode }}</span>
                      <ExternalLink class="w-4 h-4 text-white/20 cursor-pointer hover:text-white transition-colors" />
                    </div>
                  </div>

                  <div class="space-y-4 pt-4 border-t border-white/5">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2 text-white/40">
                        <User class="w-4 h-4" />
                        <span class="text-[10px] font-bold uppercase tracking-widest">CS Agent</span>
                      </div>
                      <span class="text-sm font-black">{{ claim.agent }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <div class="flex items-center gap-2 text-white/40">
                        <MapPin class="w-4 h-4" />
                        <span class="text-[10px] font-bold uppercase tracking-widest">Branch Location</span>
                      </div>
                      <span class="text-sm font-black">{{ claim.branch }}</span>
                    </div>
                  </div>
                </section>

                <section class="space-y-6">
                  <div class="space-y-1">
                    <p class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Timeline</p>
                    <div class="space-y-3">
                      <div class="flex items-center gap-3">
                        <div class="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                        <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest w-20">Created</span>
                        <span class="text-xs font-bold">{{ claim.createdAt }}</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="w-1.5 h-1.5 rounded-full bg-[#B6F500]"></div>
                        <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest w-20">Updated</span>
                        <span class="text-xs font-bold">{{ claim.updatedAt }}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <!-- Hardware Details -->
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
                <div class="bg-white/5 p-2 rounded-lg"><Monitor class="w-5 h-5 text-white/60" /></div>
                <h3 class="font-black text-lg uppercase tracking-tight">Hardware Specification</h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <p class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Model & Size</p>
                  <p class="text-lg font-black italic">{{ claim.product.model }}</p>
                  <p class="text-xs font-bold text-[#B6F500]">{{ claim.product.size }} Display</p>
                </div>
                <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <p class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Manufacturer</p>
                  <p class="text-lg font-black italic">{{ claim.product.vendor }}</p>
                  <div class="mt-2 flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span class="text-[8px] font-black uppercase tracking-widest text-white/40">In Warranty</span>
                  </div>
                </div>
                <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
                  <p class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">Primary Defect</p>
                  <p class="text-lg font-black italic text-red-400">{{ claim.product.defect }}</p>
                </div>
              </div>

              <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="group bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-[#B6F500]/30 transition-colors">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Panel Serial Number</span>
                    <button class="text-white/20 hover:text-white transition-colors text-[10px] font-black">COPY</button>
                  </div>
                  <p class="font-mono text-lg font-black tracking-wider group-hover:text-[#B6F500] transition-colors">
                    {{ claim.product.panelSN }}
                  </p>
                </div>
                <div class="group bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-[#B6F500]/30 transition-colors">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">OC Serial Number</span>
                    <button class="text-white/20 hover:text-white transition-colors text-[10px] font-black">COPY</button>
                  </div>
                  <p class="font-mono text-lg font-black tracking-wider group-hover:text-[#B6F500] transition-colors">
                    {{ claim.product.ocSN }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 2: Side Activities / QRCC -->
          <div class="space-y-6">
            <!-- QRCC Review Status Card -->
            <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
              <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-6">
                <div class="bg-white/5 p-2 rounded-lg"><ShieldCheck class="w-5 h-5 text-white/60" /></div>
                <h3 class="font-black text-lg uppercase tracking-tight">QRCC Review</h3>
              </div>
              
              <div class="space-y-6">
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Decision</span>
                  <span :class="['text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full', statusConfig?.class]">
                    {{ statusConfig?.label }}
                  </span>
                </div>

                <div class="space-y-4">
                  <p class="text-[10px] font-black text-white/20 uppercase tracking-widest">Evidence Verification</p>
                  <div class="space-y-2">
                    <div v-for="i in 4" :key="i" class="flex items-center justify-between text-xs p-3 rounded-xl bg-black/40">
                      <span class="font-bold text-white/40">Photo_00{{i}}.jpg</span>
                      <div class="flex items-center gap-2">
                        <div v-if="i === 3 && claim.status === 'NEED_REVISION'" class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        <div v-else class="w-2 h-2 rounded-full bg-[#B6F500]"></div>
                        <span class="text-[10px] font-black uppercase tracking-tight" :class="i === 3 && claim.status === 'NEED_REVISION' ? 'text-red-500' : 'text-white/40'">
                          {{ i === 3 && claim.status === 'NEED_REVISION' ? 'Rejected' : 'Verified' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button class="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all group">
                  VIEW FULL HISTORY <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            <!-- Branch Contact / Support -->
            <div class="bg-[#B6F500]/5 border border-[#B6F500]/20 rounded-4xl p-8">
              <h4 class="text-xs font-black text-[#B6F500] uppercase tracking-widest mb-4">Internal Support</h4>
              <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-2xl bg-[#B6F500] flex items-center justify-center text-black">
                  <Package class="w-6 h-6" />
                </div>
                <div>
                  <p class="text-sm font-black italic">Logistics Team - JKT</p>
                  <p class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Contact for Pickup</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fallback for other tabs -->
        <div v-else class="min-h-100 flex items-center justify-center bg-[#0a0a0a] border border-white/5 rounded-4xl border-dashed">
          <div class="text-center space-y-4">
             <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
                <component :is="tabs.find(t => t.id === activeTab)?.icon" class="w-8 h-8 text-white/20" />
             </div>
             <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Section Under Development</p>
             <p class="text-sm font-bold text-white/20">Displaying data for {{ tabs.find(t => t.id === activeTab)?.label }}</p>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
/* Scoped styles if needed */
</style>