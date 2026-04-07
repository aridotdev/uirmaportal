<script setup lang="ts">
definePageMeta({ layout: false })

const { getLandingPage } = useAuthSession()

onMounted(() => {
  navigateTo(getLandingPage(), { replace: true })
})
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center overflow-hidden relative">
    <!-- BACKGROUND DECOR (Glassmorphism Neon Orbs) -->
    <div class="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#B6F500]/5 blur-[140px] rounded-full animate-pulse pointer-events-none" />
    <div class="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />

    <!-- MAIN LOADING INTERFACE -->
    <div class="relative z-10 flex flex-col items-center">
      <!-- BRAND LOGO SECTION (Group 9330.svg) -->
      <div class="relative mb-14 group">
        <!-- Glow Aura -->
        <div class="absolute inset-0 bg-[#B6F500] blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000 animate-pulse" />

        <!-- Inline SVG: Group 9330.svg (Color modified to #B6F500) -->
        <div class="relative z-10 w-32 h-32 flex items-center justify-center drop-shadow-[0_0_20px_rgba(182,245,0,0.4)]">
          <svg
            class="w-full h-auto"
            viewBox="0 0 165 153"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M127.435 25.1728C128.997 23.6109 131.538 23.6039 133.016 25.245C145.202 38.7683 152.619 56.6727 152.619 76.3096C152.619 89.4851 149.278 101.88 143.4 112.695C142.525 114.306 142.764 116.312 144.06 117.608L163.041 136.589C164.603 138.151 164.603 140.683 163.041 142.245L155.484 149.802C153.922 151.365 151.389 151.365 149.827 149.802L130.291 130.267C130.285 130.26 130.274 130.26 130.268 130.267C130.262 130.274 130.252 130.274 130.245 130.268L118.77 118.792C117.207 117.23 117.22 114.705 118.668 113.036C127.206 103.199 132.374 90.3581 132.374 76.3096C132.374 62.2636 127.209 49.4239 118.674 39.5866C117.226 37.9177 117.214 35.3936 118.776 33.8313L127.435 25.1728ZM76.3096 0C88.7703 1.82869e-05 100.533 2.98773 110.922 8.28456C113.242 9.46777 113.625 12.5541 111.783 14.396L102.474 23.7047C101.275 24.904 99.4548 25.2033 97.8896 24.55C91.2471 21.7771 83.9573 20.2451 76.3096 20.2451C45.3462 20.2451 20.2451 45.3462 20.2451 76.3096C20.2452 107.273 45.3463 132.373 76.3096 132.373C83.9541 132.373 91.2409 130.842 97.8811 128.071C99.4462 127.418 101.266 127.718 102.465 128.917L111.774 138.227C113.617 140.069 113.234 143.155 110.913 144.338C100.526 149.633 88.767 152.619 76.3096 152.619C34.2343 152.619 0.112974 118.566 0.000977863 76.5171C0.000977145 76.5168 0.000758451 76.5166 0.00048893 76.5166C0.000218901 76.5166 0 76.5164 0 76.5161V30.4746C0 28.2655 1.79086 26.4746 4 26.4746H16.6881C17.851 26.4746 18.952 25.9645 19.7327 25.1025C33.6952 9.68518 53.8711 0 76.3096 0Z"
              fill="#B6F500"
              class="animate-pulse"
            />
            <circle
              cx="76.3094"
              cy="76.3095"
              r="38.1547"
              fill="#B6F500"
            />
          </svg>
        </div>

        <!-- Rotating Loading Spinner -->
        <div class="absolute -inset-8 border border-[#B6F500]/10 rounded-[48px]" />
        <div class="absolute -inset-8 border-t-2 border-[#B6F500] rounded-[48px] animate-spin-slow shadow-[0_0_15px_#B6F500]" />
      </div>

      <!-- TEXT & STATUS SECTION -->
      <div class="text-center space-y-5">
        <div class="flex flex-col items-center">
          <h1 class="text-3xl font-black tracking-[0.25em] italic uppercase">
            RMA <span class="text-[#B6F500]">PORTAL</span>
          </h1>
          <!-- <div class="h-px w-16 bg-white/10 mt-3" /> -->
        </div>

        <div class="flex flex-col items-center gap-4">
          <p class="text-lg uppercase tracking-[0.4em] text-white/30 font-black italic animate-pulse">
            Loading...
          </p>

          <!-- Modern Minimalist Loader -->
          <div class="w-64 h-0.5 bg-white/5 rounded-full overflow-hidden relative">
            <div class="h-full bg-[#B6F500] animate-loading-slide shadow-[0_0_10px_#B6F500]" />
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER SYSTEM INFO -->
    <div class="absolute bottom-12 left-0 right-0 text-center">
      <p class="text-[9px] uppercase tracking-[0.6em] text-white/10 font-black italic">
        Operational Intelligence • Deployment v4.3.1
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes loading-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}

.animate-loading-slide {
  animation: loading-slide 2s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
