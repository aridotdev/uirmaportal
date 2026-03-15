<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Reports Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;0,800;1,800&display=swap');
        
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #050505;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-in { animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
            background: rgba(182, 245, 0, 0.1);
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(182, 245, 0, 0.3); }
    </style>
</head>
<body>
    <div id="app" class="flex min-h-screen text-white selection:bg-[#B6F500] selection:text-black">
        
        <!-- SIDEBAR -->
        <aside class="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col p-8 sticky top-0 h-screen hidden lg:flex">
            <div class="flex items-center gap-3 px-2 mb-12">
                <div class="w-10 h-10 bg-[#B6F500] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(182,245,0,0.3)]">
                    <i data-lucide="package" class="text-black w-5 h-5"></i>
                </div>
                <span class="text-xl font-black tracking-tighter italic">HOURGLASS</span>
            </div>

            <nav class="flex-1 space-y-2">
                <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">Workspace</p>
                <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i> Dashboard
                </button>
                <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-[#B6F500] text-black shadow-[0_10px_20px_rgba(182,245,0,0.15)] font-bold text-sm">
                    <i data-lucide="clipboard-list" class="w-5 h-5"></i> My Reports
                </button>
                <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i> Create New
                </button>
                
                <div class="pt-10">
                    <p class="text-[10px] uppercase tracking-[0.2em] text-white/20 font-black px-4 mb-4">System</p>
                    <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
                        <i data-lucide="users" class="w-5 h-5"></i> Profile
                    </button>
                    <button class="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 transition-all font-bold text-sm">
                        <i data-lucide="settings" class="w-5 h-5"></i> Security
                    </button>
                </div>
            </nav>

            <div class="p-5 rounded-[24px] bg-white/5 border border-white/10 mt-auto">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full border-2 border-[#B6F500]/30 overflow-hidden bg-zinc-800 flex items-center justify-center">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" >
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-black truncate">Zaina Riddle</p>
                        <p class="text-[10px] text-white/40 uppercase tracking-widest">CS Agent</p>
                    </div>
                </div>
                <button class="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
                    <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Sign Out
                </button>
            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="flex-1 flex flex-col min-w-0">
            <!-- TOPBAR -->
            <header class="h-24 px-12 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-[#050505]/80">
                <div class="flex items-center gap-4">
                    <h1 class="text-2xl font-black uppercase italic tracking-tighter">My <span class="text-[#B6F500]">Reports</span></h1>
                    <div class="h-4 w-px bg-white/10 hidden md:block"></div>
                    <p class="text-white/20 text-[10px] font-bold uppercase tracking-widest hidden md:block">History Lengkap Klaim RMA</p>
                </div>

                <div class="flex items-center gap-6">
                    <div class="relative group cursor-pointer hidden sm:block">
                        <i data-lucide="bell" class="w-[22px] h-[22px] text-white/40 group-hover:text-white transition-colors"></i>
                        <div class="absolute top-0 right-0 w-2 h-2 bg-[#B6F500] rounded-full border-2 border-[#050505]"></div>
                    </div>
                    <div class="text-right hidden sm:block">
                        <p class="text-xs font-black tracking-widest text-[#B6F500]">MON, 06 OCT</p>
                        <p class="text-[10px] text-white/30 font-bold uppercase">14:45 PM SERVER</p>
                    </div>
                </div>
            </header>

            <div class="p-6 md:p-12 space-y-8 animate-in">
                
                <!-- FILTER SECTION -->
                <section class="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                    <!-- Search -->
                    <div class="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 w-full lg:w-96 focus-within:border-[#B6F500]/50 transition-all">
                        <i data-lucide="search" class="w-[18px] h-[18px] text-white/30"></i>
                        <input 
                            v-model="searchQuery"
                            type="text" 
                            placeholder="Cari Kode Notifikasi..." 
                            class="bg-transparent border-none outline-none px-4 text-sm w-full placeholder:text-white/20 font-medium text-white"
                        >
                    </div>

                    <!-- Status Tabs -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
                        <button
                            v-for="status in statusOptions"
                            :key="status"
                            @click="statusFilter = status"
                            :class="[
                                'px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border',
                                statusFilter === status 
                                ? 'bg-[#B6F500] text-black border-[#B6F500] shadow-[0_5px_15px_rgba(182,245,0,0.2)]' 
                                : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white'
                            ]"
                        >
                            {{ status.replace('_', ' ') }}
                        </button>
                    </div>
                </section>

                <!-- TABLE SECTION -->
                <div class="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b border-white/5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                    <th class="px-8 py-6">Notification Code</th>
                                    <th class="px-8 py-6">Model Name</th>
                                    <th class="px-8 py-6">Status</th>
                                    <th class="px-8 py-6">Created At</th>
                                    <th class="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-white/5">
                                <template v-if="paginatedData.length > 0">
                                    <tr v-for="(item, idx) in paginatedData" :key="idx" class="group hover:bg-white/[0.02] transition-colors">
                                        <td class="px-8 py-6">
                                            <div class="flex items-center gap-3">
                                                <div class="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#B6F500]/10 group-hover:text-[#B6F500] transition-colors">
                                                    <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                                                </div>
                                                <span class="font-black italic text-sm tracking-tight">{{ item.id }}</span>
                                            </div>
                                        </td>
                                        <td class="px-8 py-6">
                                            <span class="text-sm font-bold text-white/60">{{ item.model }}</span>
                                        </td>
                                        <td class="px-8 py-6">
                                            <span :class="['px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest', getStatusClass(item.status)]">
                                                {{ item.status.replace('_', ' ') }}
                                            </span>
                                        </td>
                                        <td class="px-8 py-6">
                                            <span class="text-xs font-medium text-white/30 uppercase tracking-tighter">{{ item.createdAt }}</span>
                                        </td>
                                        <td class="px-8 py-6 text-right">
                                            <div class="flex items-center justify-end gap-2">
                                                <button class="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#B6F500]/50 hover:text-[#B6F500] transition-all">
                                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                                </button>
                                                <button class="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                                    <i data-lucide="external-link" class="w-4 h-4"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </template>
                                <tr v-else>
                                    <td colSpan="5" class="px-8 py-20 text-center">
                                        <div class="flex flex-col items-center gap-4 text-white/20">
                                            <i data-lucide="search" class="w-12 h-12" stroke-width="1"></i>
                                            <p class="font-black uppercase tracking-widest text-xs italic">Data tidak ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- PAGINATION -->
                    <div class="p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p class="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                            Showing {{ Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1) }} to {{ Math.min(filteredData.length, currentPage * itemsPerPage) }} of {{ filteredData.length }} entries
                        </p>
                        
                        <div class="flex items-center gap-2">
                            <button 
                                @click="setPage(currentPage - 1)"
                                :disabled="currentPage === 1"
                                class="p-2.5 rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <i data-lucide="chevron-left" class="w-[18px] h-[18px]"></i>
                            </button>
                            
                            <div class="flex items-center gap-1">
                                <button
                                    v-for="p in totalPages"
                                    :key="p"
                                    @click="setPage(p)"
                                    :class="[
                                        'w-10 h-10 rounded-xl text-[10px] font-black transition-all border',
                                        currentPage === p 
                                        ? 'bg-[#B6F500] text-black border-[#B6F500]' 
                                        : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'
                                    ]"
                                >
                                    {{ p.toString().padStart(2, '0') }}
                                </button>
                            </div>

                            <button 
                                @click="setPage(currentPage + 1)"
                                :disabled="currentPage === totalPages || totalPages === 0"
                                class="p-2.5 rounded-xl border border-white/5 bg-white/5 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <i data-lucide="chevron-right" class="w-[18px] h-[18px]"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- QUICK SUMMARY CARDS -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="(stat, i) in stats" :key="i" class="p-6 rounded-[28px] bg-white/5 border border-white/10 flex flex-col gap-2">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{{ stat.label }}</span>
                        <span class="text-3xl font-black italic" :style="{ color: stat.color }">{{ stat.val.toString().padStart(2, '0') }}</span>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <script>
        const { createApp, ref, computed, watch, onMounted, nextTick } = Vue;

        createApp({
            setup() {
                const searchQuery = ref('');
                const statusFilter = ref('ALL');
                const currentPage = ref(1);
                const itemsPerPage = 8;

                const statusOptions = ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'NEED_REVISION', 'APPROVED', 'ARCHIVED'];

                const statusConfigs = {
                    'DRAFT': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                    'SUBMITTED': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    'IN_REVIEW': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                    'NEED_REVISION': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    'APPROVED': 'bg-[#B6F500]/10 text-[#B6F500] border-[#B6F500]/20',
                    'ARCHIVED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                };

                const claimsData = ref(
                    Array.from({ length: 25 }, (_, i) => ({
                        id: `NTF-2026-X${882 + i}`,
                        model: i % 2 === 0 ? 'LG OLED 55" C3' : 'Samsung S23 Ultra',
                        status: statusOptions[Math.floor(Math.random() * (statusOptions.length - 1)) + 1],
                        createdAt: `2025-10-0${(i % 9) + 1} 14:20`,
                    }))
                );

                const filteredData = computed(() => {
                    return claimsData.value.filter(item => {
                        const matchesSearch = item.id.toLowerCase().includes(searchQuery.value.toLowerCase());
                        const matchesStatus = statusFilter.value === 'ALL' || item.status === statusFilter.value;
                        return matchesSearch && matchesStatus;
                    });
                });

                const totalPages = computed(() => Math.ceil(filteredData.value.length / itemsPerPage));

                const paginatedData = computed(() => {
                    const start = (currentPage.value - 1) * itemsPerPage;
                    const end = start + itemsPerPage;
                    return filteredData.value.slice(start, end);
                });

                const stats = computed(() => [
                    { label: 'Total Claims', val: claimsData.value.length, color: 'white' },
                    { label: 'Approved', val: claimsData.value.filter(d => d.status === 'APPROVED').length, color: '#B6F500' },
                    { label: 'Pending', val: claimsData.value.filter(d => d.status === 'IN_REVIEW').length, color: '#0ea5e9' },
                    { label: 'Revision', val: claimsData.value.filter(d => d.status === 'NEED_REVISION').length, color: '#f59e0b' },
                ]);

                const setPage = (p) => {
                    if (p >= 1 && p <= totalPages.value) {
                        currentPage.value = p;
                    }
                };

                const getStatusClass = (status) => statusConfigs[status] || '';

                watch([searchQuery, statusFilter], () => {
                    currentPage.value = 1;
                    nextTick(() => lucide.createIcons());
                });

                onMounted(() => {
                    lucide.createIcons();
                });

                watch(paginatedData, () => {
                    nextTick(() => lucide.createIcons());
                });

                return {
                    searchQuery, statusFilter, currentPage, itemsPerPage,
                    statusOptions, claimsData, filteredData, totalPages,
                    paginatedData, stats, setPage, getStatusClass
                };
            }
        }).mount('#app');
    </script>
</body>
</html>