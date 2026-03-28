<script setup lang="ts">
const router = useRouter()

const reportTabs = [
  { label: 'Overview', value: 'overview' },
  { label: 'Branches', value: 'branches' },
  { label: 'Vendors', value: 'vendors' },
  { label: 'Trends', value: 'trends', disabled: true },
  { label: 'Aging', value: 'aging', disabled: true },
  { label: 'Defects', value: 'defects', disabled: true },
  { label: 'Recovery', value: 'recovery', disabled: true }
]

const activeTab = ref('overview')

watch(activeTab, (val) => {
  if (val === 'overview') router.push('/dashboard/reports')
  if (val === 'branches') router.push('/dashboard/reports/branches')
  if (val === 'vendors') router.push('/dashboard/reports/vendors')
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
