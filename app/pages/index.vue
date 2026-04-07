<script setup lang="ts">
definePageMeta({ layout: false })

const { getLandingPage } = useAuthSession()

onMounted(() => {
  navigateTo(getLandingPage(), { replace: true })
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#050505]">
    <div class="animate-pulse text-sm text-white/50">
      Redirecting...
    </div>
  </div>
</template>
