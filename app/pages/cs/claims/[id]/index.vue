<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { TimelineItem } from '~/components/TimelineList.vue'
import {
  ArrowLeft,
  Edit3,
  FileText,
  History,
  Image as ImageIcon,
  Info,
  MapPin,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  User,
  ExternalLink,
  Send,
  Ban,
  Circle,
  CheckCircle2
} from 'lucide-vue-next'
import type { ClaimHistoryAction } from '~~/shared/utils/constants'
import type { CsClaimDetail } from '~/utils/cs-mock-data'

definePageMeta({ layout: 'cs' })

const route = useRoute()
const claimId = typeof route.params.id === 'string' ? route.params.id : ''
const { getClaimDetail } = useCsMockStore()

const activeTab = ref('overview')
const isLoading = ref(true)
const isNotFound = ref(false)

const selectedImage = ref<string | null>(null)

const claimData = computed(() => getClaimDetail(claimId))
const hasClaim = computed(() => !!claimData.value)

const formatDateTime = (iso: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}

function toClaimView(item: CsClaimDetail) {
  return {
    id: item.claimNumber,
    status: item.claimStatus,
    createdAt: formatDateTime(item.createdAt),
    updatedAt: formatDateTime(item.updatedAt),
    agent: item.submittedByName,
    branch: item.branch,
    notificationCode: item.notificationCode,
    product: {
      model: item.modelName,
      size: `${item.inch} Inch`,
      vendor: item.vendorName,
      panelPartNumber: item.panelPartNumber,
      ocSN: item.ocSerialNo,
      defect: item.defectName
    },
    revisionNote: item.revisionNote,
    evidences: item.evidences.map(photo => ({
      id: photo.photoType,
      label: photo.label,
      status: photo.status,
      url: photo.filePath,
      note: photo.rejectReason || 'Menunggu review.'
    })),
    history: item.history
  }
}

function getEmptyClaimView(currentClaimId: string) {
  return {
    id: currentClaimId,
    status: 'DRAFT' as const,
    createdAt: '-',
    updatedAt: '-',
    agent: '-',
    branch: '-',
    notificationCode: '-',
    product: {
      model: '-',
      size: '-',
      vendor: '-',
      panelPartNumber: '-',
      ocSN: '-',
      defect: '-'
    },
    revisionNote: null,
    evidences: [],
    history: []
  }
}

const claim = computed(() => {
  if (!claimData.value) {
    return getEmptyClaimView(claimId)
  }

  return toClaimView(claimData.value)
})

const tabs = [
  { id: 'overview', label: 'Claim Overview', icon: Info },
  { id: 'photos', label: 'Photo Evidence', icon: ImageIcon },
  { id: 'history', label: 'Claim History', icon: History }
]

const hasEvidences = computed(() => claim.value.evidences.length > 0)

const getActionColor = (action: ClaimHistoryAction) => {
  if (action === 'REQUEST_REVISION' || action === 'REJECT') return 'text-red-500'
  if (action === 'APPROVE') return 'text-[#B6F500]'
  if (action === 'SUBMIT') return 'text-blue-400'
  return 'text-white/40'
}

const getActionIcon = (action: ClaimHistoryAction) => {
  if (action === 'REQUEST_REVISION' || action === 'REJECT') return Ban
  if (action === 'SUBMIT') return Send
  if (action === 'APPROVE') return CheckCircle2
  if (action === 'CREATE') return FileText
  return Circle
}

const formattedHistory = computed<TimelineItem[]>(() => {
  if (!claimData.value) return []
  return [...claimData.value.history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(log => ({
      id: log.id,
      date: formatDateTime(log.createdAt),
      userName: log.userName,
      userRole: log.userRole,
      action: log.action,
      note: log.note,
      icon: getActionIcon(log.action),
      actionColor: getActionColor(log.action)
    }))
})

const handleBackToOverview = () => {
  activeTab.value = 'overview'
}

onMounted(() => {
  setTimeout(() => {
    if (!hasClaim.value) {
      isNotFound.value = true
    }
    isLoading.value = false
  }, 500)
})
</script>

<template>
  <div class="flex flex-col bg-[#050505] text-white min-h-screen">
    <!-- Navigasi Atas -->
    <nav class="cs-shell-x sticky top-0 z-40 border-b border-white/5 bg-[#050505]/80 py-4 backdrop-blur-md">
      <div class="cs-shell-container flex items-center justify-between">
        <div class="flex items-center gap-6">
          <NuxtLink
            to="/cs/claims"
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </NuxtLink>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-black italic tracking-tighter uppercase">
                {{ claim.id }}
              </h1>
              <StatusBadge
                :status="claim.status"
                variant="claim"
                size="md"
              />
            </div>
            <p class="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">
              Created on {{ claim.createdAt }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            v-if="claim.status === 'NEED_REVISION'"
            :to="`/cs/claims/${claim.id}/edit`"
            class="flex items-center gap-2 bg-amber-500 text-black px-8 py-3 rounded-2xl font-black text-xs transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
          >
            <Edit3 class="w-4 h-4" /> REVISE CLAIM
          </NuxtLink>

          <button class="flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl font-black text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all">
            PRINT REPORT
          </button>
        </div>
      </div>
    </nav>

    <main class="cs-shell-main flex-1">
      <div class="cs-shell-container">
        <LoadingState
          v-if="isLoading"
          variant="detail"
          :rows="8"
        />

        <div
          v-else-if="isNotFound || !hasClaim"
          class="rounded-4xl border border-white/10 bg-white/5 p-10 text-center"
        >
          <h2 class="text-xl font-black uppercase tracking-tight">
            Claim tidak ditemukan
          </h2>
          <p class="mt-2 text-sm font-bold text-white/40">
            Data untuk {{ claimId }} tidak tersedia.
          </p>
          <NuxtLink
            to="/cs/claims"
            class="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#B6F500]/40 bg-[#B6F500]/10 px-5 py-3 text-xs font-black uppercase tracking-widest text-[#B6F500]"
          >
            <ArrowLeft class="h-4 w-4" />
            Kembali ke My Claims
          </NuxtLink>
        </div>

        <template v-else>
          <!-- Banner Alert jika butuh revisi -->
          <div
            v-if="claim.status === 'NEED_REVISION'"
            class="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-4xl p-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4"
          >
            <!-- Background icon decoration -->
            <div class="absolute -top-4 -right-4 opacity-5">
              <ShieldAlert class="w-24 h-24 text-amber-500" />
            </div>

            <div class="relative z-10 flex items-start gap-6">
              <div class="bg-amber-500 text-black p-3 rounded-2xl shrink-0 shadow-lg shadow-amber-500/20">
                <AlertTriangle class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="font-black text-amber-500 uppercase tracking-tight text-sm">
                    Revision Critical Feedback
                  </h3>
                  <div class="bg-amber-500/20 px-2 py-0.5 rounded text-[8px] font-black text-amber-500 uppercase tracking-widest border border-amber-500/30">
                    Awaiting Correction
                  </div>
                </div>
                <p class="text-white/80 text-sm leading-relaxed font-bold italic">
                  "{{ claim.revisionNote }}"
                </p>
              </div>
              <div class="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">
                Ref: #QRCC-99
              </div>
            </div>
          </div>

          <!-- Menu Tab -->
          <div class="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit mb-8">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all',
                activeTab === tab.id ? 'bg-[#B6F500] text-black shadow-lg' : 'text-white/40 hover:text-white'
              ]"
              @click="activeTab = tab.id"
            >
              <component
                :is="tab.icon"
                class="w-4 h-4"
              />
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab 1: Overview -->
          <div
            v-if="activeTab === 'overview'"
            class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500"
          >
            <div class="lg:col-span-2 space-y-8">
              <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8 overflow-hidden relative">
                <div class="absolute top-0 right-0 p-8 opacity-5">
                  <FileText class="w-32 h-32 rotate-12" />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section class="space-y-6">
                    <div class="space-y-1">
                      <p class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                        Notification Code
                      </p>
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
                      <p class="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                        Timeline
                      </p>
                      <div class="space-y-3">
                        <div class="flex items-center gap-3">
                          <div class="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest w-20">Created</span>
                          <span class="text-xs font-bold">{{ claim.createdAt }}</span>
                        </div>
                        <div class="flex items-center gap-3">
                          <div class="w-1.5 h-1.5 rounded-full bg-[#B6F500]" />
                          <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest w-20">Updated</span>
                          <span class="text-xs font-bold">{{ claim.updatedAt }}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
                <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-8">
                  <div class="bg-white/5 p-2 rounded-lg">
                    <Monitor class="w-5 h-5 text-white/60" />
                  </div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    Hardware Specification
                  </h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">
                      Model & Size
                    </p>
                    <p class="text-lg font-black italic">
                      {{ claim.product.model }}
                    </p>
                    <p class="text-xs font-bold text-[#B6F500]">
                      {{ claim.product.size }} Display
                    </p>
                  </div>
                  <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">
                      Manufacturer
                    </p>
                    <p class="text-lg font-black italic">
                      {{ claim.product.vendor }}
                    </p>
                    <div class="mt-2 flex items-center gap-1.5">
                      <div class="w-2 h-2 rounded-full bg-blue-500" />
                      <span class="text-[8px] font-black uppercase tracking-widest text-white/40">In Warranty</span>
                    </div>
                  </div>
                  <div class="bg-white/5 rounded-2xl p-5 border border-white/5">
                    <p class="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">
                      Primary Defect
                    </p>
                    <p class="text-lg font-black italic text-red-400">
                      {{ claim.product.defect }}
                    </p>
                  </div>
                </div>

                <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="group bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-[#B6F500]/30 transition-colors">
                    <div class="flex justify-between items-center mb-3">
                      <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Panel Part Number</span>
                      <button class="text-white/20 hover:text-white transition-colors text-[10px] font-black">
                        COPY
                      </button>
                    </div>
                    <p class="font-mono text-lg font-black tracking-wider group-hover:text-[#B6F500] transition-colors">
                      {{ claim.product.panelPartNumber }}
                    </p>
                  </div>
                  <div class="group bg-black/40 border border-white/5 rounded-2xl p-6 hover:border-[#B6F500]/30 transition-colors">
                    <div class="flex justify-between items-center mb-3">
                      <span class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">OC Serial Number</span>
                      <button class="text-white/20 hover:text-white transition-colors text-[10px] font-black">
                        COPY
                      </button>
                    </div>
                    <p class="font-mono text-lg font-black tracking-wider group-hover:text-[#B6F500] transition-colors">
                      {{ claim.product.ocSN }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sidebar Status Review (Overview) -->
            <div class="space-y-6">
              <div class="bg-[#0a0a0a] border border-white/5 rounded-4xl p-8">
                <div class="flex items-center gap-3 border-b border-white/5 pb-6 mb-6">
                  <div class="bg-white/5 p-2 rounded-lg">
                    <ShieldCheck class="w-5 h-5 text-white/60" />
                  </div>
                  <h3 class="font-black text-lg uppercase tracking-tight">
                    QRCC Review
                  </h3>
                </div>

                <div class="space-y-6">
                  <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Decision</span>
                    <StatusBadge
                      :status="claim.status"
                      variant="claim"
                    />
                  </div>

                  <div class="space-y-4">
                    <p class="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      Evidence Verification
                    </p>
                    <div class="space-y-2">
                      <div
                        v-for="(ev, idx) in claim.evidences"
                        :key="idx"
                        class="flex items-center justify-between text-xs p-3 rounded-xl bg-black/40"
                      >
                        <span class="font-bold text-white/40">{{ ev.label }}</span>
                        <StatusBadge
                          :status="ev.status"
                          variant="photo"
                          show-dot
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    class="w-full flex items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all group"
                    @click="activeTab = 'history'"
                  >
                    VIEW FULL HISTORY <ChevronRight class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 2: Photo Evidence (GALLERY) -->
          <div
            v-else-if="activeTab === 'photos'"
            class="space-y-8 animate-in fade-in duration-500"
          >
            <div class="flex items-center justify-between mb-2">
              <div>
                <h2 class="text-xl font-black italic tracking-tighter uppercase">
                  Evidence Gallery
                </h2>
                <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
                  Reviewing {{ claim.evidences.length }} captured visual assets
                </p>
              </div>
              <div class="flex gap-2">
                <div class="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <div class="w-2 h-2 rounded-full bg-[#B6F500]" />
                  <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">{{ claim.evidences.filter(ev => ev.status === 'VERIFIED').length }} Verified</span>
                </div>
                <div class="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                  <div class="w-2 h-2 rounded-full bg-red-500" />
                  <span class="text-[10px] font-black text-white/40 uppercase tracking-widest">{{ claim.evidences.filter(ev => ev.status === 'REJECT').length }} Rejected</span>
                </div>
              </div>
            </div>

            <div
              v-if="hasEvidences"
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <PhotoEvidenceCard
                v-for="ev in claim.evidences"
                :id="ev.id"
                :key="ev.id"
                :label="ev.label"
                :status="ev.status"
                :image-url="ev.url"
                :note="ev.note"
                review-mode
                @preview="(url: string) => selectedImage = url"
              />
            </div>

            <EmptyState
              v-else
              title="No Evidence Found"
              description="Belum ada bukti foto untuk klaim ini."
              action-label="BACK TO OVERVIEW"
              @action="handleBackToOverview"
            />
          </div>

          <!-- Tab 3: History (TIMELINE) -->
          <div
            v-else-if="activeTab === 'history'"
            class="max-w-4xl animate-in fade-in duration-500"
          >
            <SectionCard>
              <template #header>
                <div class="flex items-center gap-4">
                  <div class="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <History class="w-6 h-6 text-white/40" />
                  </div>
                  <div>
                    <h2 class="text-xl font-black italic tracking-tighter uppercase">
                      Claim Lifecycle
                    </h2>
                    <p class="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">
                      Audit trail of all actions taken
                    </p>
                  </div>
                </div>
              </template>

              <TimelineList
                v-if="formattedHistory.length > 0"
                :items="formattedHistory"
              />

              <EmptyState
                v-else
                title="No History Available"
                description="Belum ada aktivitas pada claim ini."
                action-label="BACK TO OVERVIEW"
                @action="handleBackToOverview"
              />
            </SectionCard>
          </div>
        </template>
      </div>
    </main>

    <PhotoLightbox
      v-if="selectedImage"
      :images="claim.evidences.map(ev => ({ url: ev.url, label: ev.label, status: ev.status }))"
      :initial-url="selectedImage"
      @close="selectedImage = null"
    />
  </div>
</template>

<style scoped>
/* Transisi Tab Content */
.animate-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
