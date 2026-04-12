<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const router = useRouter()
const route = useRoute()

const reportTabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Branches', value: 'branches' },
  { label: 'Vendors', value: 'vendors' },
  { label: 'Trends', value: 'trends' },
  { label: 'Aging', value: 'aging' },
  { label: 'Defects', value: 'defects' },
  { label: 'Recovery', value: 'recovery' }
]

const activeTab = ref('overview')

const routeToTab: Record<string, string> = {
  '/dashboard/reports': 'overview',
  '/dashboard/reports/branches': 'branches',
  '/dashboard/reports/vendors': 'vendors',
  '/dashboard/reports/trends': 'trends',
  '/dashboard/reports/aging': 'aging',
  '/dashboard/reports/defects': 'defects',
  '/dashboard/reports/recovery': 'recovery'
}

const tabToRoute: Record<string, string> = {
  overview: '/dashboard/reports',
  branches: '/dashboard/reports/branches',
  vendors: '/dashboard/reports/vendors',
  trends: '/dashboard/reports/trends',
  aging: '/dashboard/reports/aging',
  defects: '/dashboard/reports/defects',
  recovery: '/dashboard/reports/recovery'
}

watch(() => route.path, (path) => {
  activeTab.value = routeToTab[path] ?? 'overview'
}, { immediate: true })

watch(activeTab, (val) => {
  const targetPath = tabToRoute[val]
  if (targetPath && targetPath !== route.path) {
    router.push(targetPath)
  }
})
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-[1400px] space-y-8">
      <!-- ═══════════════════════════════════════════ -->
      <!-- Sub-report Navigation Tabs -->
      <!-- ═══════════════════════════════════════════ -->
      <UTabs
        v-model="activeTab"
        :items="reportTabs"
        :content="false"
        variant="link"
        color="primary"
        size="sm"
        :ui="{
          list: 'border-white/10',
          trigger: 'text-white/40 data-[state=active]:text-[#B6F500] font-black uppercase tracking-widest text-[10px]'
        }"
      />

      <NuxtPage />
    </div>
  </div>
</template>
