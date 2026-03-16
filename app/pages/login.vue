<script setup lang="ts">
import { Package } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <!-- 1. LOGIN PAGE -->
    <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <!-- Background Glow Orbs -->
      <div class="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#B6F500]/10 blur-[120px] rounded-full animate-pulse" />
      <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />

      <div class="w-full max-w-md p-10 backdrop-blur-2xl bg-white/5 border border-white/10 rounded-[40px] shadow-2xl relative z-10">
        <div class="flex flex-col items-center mb-10">
          <div class="w-16 h-16 bg-[#B6F500] rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(182,245,0,0.4)]">
            <Package
              :size="32"
              class="text-black"
            />
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight">
            RMA <span class="text-[#B6F500]">SYSTEM</span>
          </h1>
          <p class="text-white/40 mt-2 font-medium">
            Portal Operasional Internal
          </p>
        </div>

        <div class="space-y-6">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Username</label>
            <input
              type="text"
              placeholder="zaina.riddle@company.com"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#B6F500]/50 focus:ring-4 focus:ring-[#B6F500]/5 transition-all"
            >
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-white/50 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#B6F500]/50 focus:ring-4 focus:ring-[#B6F500]/5 transition-all"
            >
          </div>
          <div class="flex items-center justify-between text-xs text-white/40">
            <label class="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                class="rounded border-white/10 bg-white/5 accent-[#B6F500]"
              > Ingat Sesi
            </label>
            <a
              href="#"
              class="hover:text-[#B6F500] transition-colors"
            >Lupa Password?</a>
          </div>
          <button
            class="w-full bg-[#B6F500] text-black py-4 rounded-2xl font-black text-lg shadow-[0_10px_30px_rgba(182,245,0,0.3)] hover:shadow-[0_15px_40px_rgba(182,245,0,0.4)] hover:-translate-y-0.5 transition-all"
            @click="navigateTo('cs')"
          >
            MASUK SEKARANG
          </button>
        </div>

        <p class="mt-10 text-center text-[10px] text-white/20 uppercase tracking-[0.2em]">
          Build version 4.0.1-stable
        </p>
      </div>
    </div>
  </div>
</template>

<style>
/* Custom Scrollbar for Glassmorphism */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(182, 245, 0, 0.1);
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(182, 245, 0, 0.3);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

/* Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom-5 {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-in {
  animation-duration: 0.7s;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fade-in;
}

.slide-in-from-bottom-5 {
  animation-name: slide-in-from-bottom-5;
}
</style>
