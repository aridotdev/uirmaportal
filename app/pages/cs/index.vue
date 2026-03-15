<script setup>
import { ref } from 'vue'
import { 
  Package, 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  Info, 
  Image as ImageIcon,
  Camera,
  AlertCircle,
  FileText,
  CheckCircle2
} from 'lucide-vue-next'

// --- State Management ---
const currentStep = ref(1) // 1: Info, 2: Foto, 3: Review

// --- Form Data State ---
const form = ref({
  notificationCode: 'NOTIF-2026-X992',
  vendor: 'MOKA',
  productModel: 'LG OLED 55" C3 Series',
  serialNumber: '',
  defectType: '',
  description: '',
  photos: {
    claim: null,
    claim_zoom: null,
    panel_sn: null,
    odf: null
  }
})

// --- Data Referensi ---
const vendors = ['MOKA', 'MTC', 'SDP']
const defects = [
  'No Display / Mati Total', 
  'Vertical Line (Garis Vertikal)', 
  'Horizontal Line', 
  'Broken Panel (Pecah)', 
  'Flicker / Berkedip'
]

// --- Fungsi Navigasi Wizard ---
const nextStep = () => { if (currentStep.value < 3) currentStep.value++ }
const prevStep = () => { if (currentStep.value > 1) currentStep.value-- }

const handleSubmit = () => {
  // Simulasi submit
  alert('Klaim RMA Berhasil Dikirim ke tim QRCC!')
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black flex justify-center overflow-x-hidden">
    
    <!-- Wrapper Utama: Fokus Lebar 1440px -->
    <div class="w-full max-w-360 flex border-x border-white/5 shadow-2xl shadow-black">
      
      <!-- SIDEBAR -->
      <aside class="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-8 sticky top-0 h-screen">
        <div class="flex items-center gap-3 px-2 mb-12">
          <div class="w-10 h-10 bg-[#B6F500] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(182,245,0,0.3)]">
            <Package :size="20" class="text-black" />
          </div>
          <span class="text-xl font-black tracking-tighter italic">HOURGLASS</span>
        </div>

        <nav class="flex-1 space-y-2">
          <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">Workspace</p>
          <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
            <LayoutDashboard :size="20" /> Dashboard
          </button>
          <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#B6F500] text-black shadow-lg font-black text-sm transition-all">
            <ClipboardList :size="20" /> Claim Operations
          </button>
          <div class="pt-10">
            <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">Support</p>
            <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white transition-all font-bold text-sm">
              <Users :size="20" /> Vendors
            </button>
            <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white transition-all font-bold text-sm">
              <Settings :size="20" /> Settings
            </button>
          </div>
        </nav>

        <div class="p-5 rounded-[24px] bg-white/5 border border-white/10 mt-auto">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full border-2 border-[#B6F500]/30 bg-white/10 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zaina" alt="User" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-black truncate">Zaina Riddle</p>
              <p class="text-[10px] text-white/40 uppercase tracking-widest font-bold">CS Jakarta</p>
            </div>
          </div>
          <button class="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
            <LogOut :size="14" /> Sign Out
          </button>
        </div>
      </aside>

      <!-- KONTEN UTAMA -->
      <main class="flex-1 flex flex-col bg-[#050505]">
        <!-- Topbar Header dengan Stepper -->
        <header class="h-24 px-12 flex items-center justify-between border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-40">
          <div class="flex items-center gap-4">
             <button class="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-[#B6F500] transition-colors">
                <ArrowLeft :size="18" />
             </button>
             <div>
                <h2 class="text-xl font-black italic tracking-tight uppercase">Buat <span class="text-[#B6F500]">Klaim RMA Baru</span></h2>
                <p class="text-[10px] text-white/30 font-bold uppercase tracking-widest">Notifikasi: {{ form.notificationCode }}</p>
             </div>
          </div>
          
          <div class="flex items-center gap-6">
             <!-- Indikator Stepper -->
             <div class="flex items-center gap-3 bg-white/5 px-6 py-2.5 rounded-2xl border border-white/10">
                <div v-for="step in 3" :key="step" class="flex items-center">
                   <div :class="[
                     'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-500',
                     currentStep === step ? 'bg-[#B6F500] text-black shadow-[0_0_15px_#B6F500]' : 
                     currentStep > step ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/20'
                   ]">
                      <Check v-if="currentStep > step" :size="14" />
                      <span v-else>{{ step }}</span>
                   </div>
                   <div v-if="step < 3" :class="['w-8 h-px mx-2', currentStep > step ? 'bg-emerald-500/30' : 'bg-white/10']"></div>
                </div>
             </div>
          </div>
        </header>

        <!-- AREA WIZARD -->
        <div class="flex-1 p-12 overflow-y-auto custom-scrollbar">
          <div class="max-w-275 mx-auto">
            
            <!-- LANGKAH 1: INFO PRODUK & DEFECT -->
            <div v-if="currentStep === 1" class="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div class="grid grid-cols-2 gap-8">
                  <!-- Section Data Perangkat -->
                  <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] p-10 space-y-8">
                     <h3 class="text-sm font-black uppercase tracking-[0.2em] text-[#B6F500] flex items-center gap-3 italic">
                        <Package :size="18" /> Informasi Perangkat
                     </h3>
                     <div class="space-y-6">
                        <div class="space-y-2">
                           <label class="text-[10px] font-black uppercase text-white/30 tracking-widest">Model Unit</label>
                           <div class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white/60">
                              {{ form.productModel }}
                           </div>
                        </div>
                        <div class="space-y-2">
                           <label class="text-[10px] font-black uppercase text-white/30 tracking-widest">Serial Number (S/N)</label>
                           <input 
                             type="text" 
                             v-model="form.serialNumber"
                             placeholder="Masukkan 15-digit S/N..."
                             class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-[#B6F500] focus:outline-none focus:border-[#B6F500]/50 focus:ring-4 focus:ring-[#B6F500]/5 transition-all"
                           />
                        </div>
                        <div class="space-y-2">
                           <label class="text-[10px] font-black uppercase text-white/30 tracking-widest">Vendor</label>
                           <div class="grid grid-cols-3 gap-3">
                              <button 
                                v-for="v in vendors" :key="v"
                                @click="form.vendor = v"
                                :class="[
                                  'py-3 rounded-xl border font-black text-xs transition-all',
                                  form.vendor === v ? 'bg-[#B6F500] text-black border-[#B6F500]' : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'
                                ]"
                              >
                                 {{ v }}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Section Data Defect -->
                  <div class="backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] p-10 space-y-8">
                     <h3 class="text-sm font-black uppercase tracking-[0.2em] text-[#B6F500] flex items-center gap-3 italic">
                        <AlertCircle :size="18" /> Detail Kerusakan
                     </h3>
                     <div class="space-y-6">
                        <div class="space-y-2">
                           <label class="text-[10px] font-black uppercase text-white/30 tracking-widest">Kategori Defect</label>
                           <select v-model="form.defectType" class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none appearance-none cursor-pointer">
                              <option value="" disabled>Pilih Kategori Defect...</option>
                              <option v-for="d in defects" :key="d" :value="d">{{ d }}</option>
                           </select>
                        </div>
                        <div class="space-y-2">
                           <label class="text-[10px] font-black uppercase text-white/30 tracking-widest">Catatan Tambahan</label>
                           <textarea 
                             v-model="form.description"
                             rows="4" 
                             placeholder="Jelaskan kondisi unit saat diterima dari pelanggan..."
                             class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:border-[#B6F500]/50 resize-none transition-all"
                           ></textarea>
                        </div>
                     </div>
                  </div>
               </div>

               <div class="flex justify-end pt-4">
                  <button @click="nextStep" class="bg-[#B6F500] text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#B6F500]/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                     Lanjut ke Foto <ArrowRight :size="18" />
                  </button>
               </div>
            </div>

            <!-- LANGKAH 2: UNGGAH FOTO (First-Class Feature) -->
            <div v-if="currentStep === 2" class="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div class="flex items-center justify-between">
                  <div>
                     <h3 class="text-2xl font-black italic uppercase tracking-tighter">Bukti <span class="text-[#B6F500]">Dokumentasi</span></h3>
                     <p class="text-xs text-white/40 font-medium italic">Sesuai standar vendor <span class="text-white font-bold">{{ form.vendor }}</span></p>
                  </div>
                  <div class="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center gap-3">
                     <Info :size="18" />
                     <span class="text-[10px] font-black uppercase tracking-widest italic leading-tight">Pastikan resolusi tinggi & Serial Number terbaca</span>
                  </div>
               </div>

               <div class="grid grid-cols-2 gap-8">
                  <div v-for="(photo, key) in [
                    { id: 'claim', title: 'Claim Photo (Unit)', desc: 'Tampak depan unit keseluruhan dalam kondisi menyala.' },
                    { id: 'claim_zoom', title: 'Defect Zoom View', desc: 'Detail area kerusakan dari jarak dekat secara fokus.' },
                    { id: 'panel_sn', title: 'Panel Serial Number', desc: 'Foto stiker S/N yang menempel langsung di panel unit.' },
                    { id: 'odf', title: 'ODF Label Photo', desc: 'Label ODF untuk verifikasi batch produksi panel.' }
                  ]" :key="key" 
                  class="group backdrop-blur-xl bg-white/5 border-2 border-dashed border-white/10 rounded-[40px] p-8 hover:border-[#B6F500]/50 transition-all cursor-pointer relative overflow-hidden h-72 flex flex-col items-center justify-center">
                     
                     <div class="absolute inset-0 bg-[#B6F500]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                     
                     <div class="flex flex-col items-center text-center space-y-5 relative z-10">
                        <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#B6F500] group-hover:text-black transition-all duration-500 shadow-inner">
                           <Camera v-if="!form.photos[photo.id]" :size="28" />
                           <Check v-else :size="28" />
                        </div>
                        <div>
                           <h4 class="font-black text-sm uppercase tracking-widest italic">{{ photo.title }}</h4>
                           <p class="text-[10px] text-white/30 font-bold mt-1 max-w-55">{{ photo.desc }}</p>
                        </div>
                        <button class="bg-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#B6F500] hover:text-black transition-all">
                           PILIH BERKAS
                        </button>
                     </div>

                     <!-- Dekorasi Background -->
                     <div class="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                        <ImageIcon :size="180" />
                     </div>
                  </div>
               </div>

               <div class="flex justify-between items-center pt-8 border-t border-white/5">
                  <button @click="prevStep" class="px-8 py-4 rounded-2xl border border-white/10 font-black uppercase tracking-widest text-white/40 hover:text-white transition-all text-xs">Kembali</button>
                  <button @click="nextStep" class="bg-[#B6F500] text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#B6F500]/10 hover:scale-105 active:scale-95 transition-all">
                     Review Ringkasan
                  </button>
               </div>
            </div>

            <!-- LANGKAH 3: REVIEW & KONFIRMASI AKHIR -->
            <div v-if="currentStep === 3" class="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
               <div class="text-center space-y-2 mb-10">
                  <div class="w-16 h-16 bg-[#B6F500]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#B6F500]/20">
                     <FileText :size="24" class="text-[#B6F500]" />
                  </div>
                  <h3 class="text-3xl font-black italic tracking-tighter uppercase">Review <span class="text-[#B6F500]">Final</span></h3>
                  <p class="text-sm text-white/40 italic">Tinjau data klaim sebelum dikirim ke tim QC/QRCC.</p>
               </div>

               <div class="grid grid-cols-12 gap-8">
                  <!-- Data Summary -->
                  <div class="col-span-7 backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] p-10 space-y-8 relative overflow-hidden">
                     <div class="absolute top-0 right-0 p-8 opacity-5">
                        <CheckCircle2 :size="100" />
                     </div>
                     
                     <div class="grid grid-cols-2 gap-10">
                        <div v-for="(val, label) in {
                          'No. Notifikasi': form.notificationCode,
                          'Vendor Terpilih': form.vendor,
                          'Serial Number': form.serialNumber || 'SN-8822910-CX',
                          'Kategori Defect': form.defectType || 'No Display'
                        }" :key="label" class="space-y-1">
                           <p class="text-[10px] font-black uppercase tracking-widest text-white/20">{{ label }}</p>
                           <p class="font-black italic text-lg tracking-tight">{{ val }}</p>
                        </div>
                     </div>

                     <div class="pt-8 border-t border-white/5">
                        <p class="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 italic">Catatan Pemeriksaan</p>
                        <p class="text-sm font-medium leading-relaxed italic text-white/60">
                           "{{ form.description || 'Unit diterima dalam kondisi tersegel dari cabang Jakarta. Backlight tidak menyala namun panel fisik tidak ditemukan keretakan.' }}"
                        </p>
                     </div>
                  </div>

                  <!-- Thumbnail Review -->
                  <div class="col-span-5 backdrop-blur-xl bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6">
                     <h4 class="text-[10px] font-black uppercase tracking-widest text-white/20">Foto Terlampir (4)</h4>
                     <div class="grid grid-cols-2 gap-4">
                        <div v-for="i in 4" :key="i" class="aspect-square rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group cursor-zoom-in">
                           <img :src="`https://picsum.photos/seed/${i + 20}/400`" class="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                           <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                              <Check :size="20" class="text-[#B6F500]" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Action Footer -->
               <div class="flex items-center justify-between p-10 rounded-[40px] border border-[#B6F500]/20 bg-[#B6F500]/5 backdrop-blur-md">
                  <div class="flex items-center gap-5">
                     <div class="w-12 h-12 rounded-full bg-[#B6F500] text-black flex items-center justify-center shadow-[0_0_15px_#B6F500]">
                        <AlertCircle :size="24" />
                     </div>
                     <div>
                        <p class="text-xs font-black uppercase tracking-widest text-black/80">Klaim Siap Diajukan</p>
                        <p class="text-[10px] font-bold text-black/50 italic">Pastikan data sudah benar. Setelah dikirim, data dikunci.</p>
                     </div>
                  </div>
                  <div class="flex gap-4">
                     <button @click="prevStep" class="px-8 py-4 rounded-2xl border border-white/10 font-black uppercase tracking-widest text-white/40 hover:text-white transition-all text-xs">Edit Kembali</button>
                     <button @click="handleSubmit" class="bg-[#B6F500] text-black px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-[#B6F500]/30 hover:scale-105 active:scale-95 transition-all italic">
                        SUBMIT KLAIM SEKARANG
                     </button>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>
    </div>

  </div>
</template>

<style>
/* Custom Scrollbar */
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

/* Animasi Nuxt 4 */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes slide-in-from-bottom-5 { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.animate-in {
  animation-duration: 0.8s;
  animation-fill-mode: both;
}
.fade-in { animation-name: fade-in; }
.slide-in-from-bottom-5 { animation-name: slide-in-from-bottom-5; }

/* Styling Input & Select */
input, select, textarea {
  color-scheme: dark;
}

select option {
  background: #0a0a0a;
  color: white;
}
</style>