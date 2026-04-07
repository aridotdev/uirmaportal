<script setup lang="ts">
import { z } from 'zod'
import { Package } from 'lucide-vue-next'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({ layout: false })

const { login, getLandingPage } = useAuthSession()

const errorMessage = ref('')
const isLoading = ref(false)

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember: z.boolean().optional()
})

type LoginSchema = z.output<typeof loginSchema>

const fields: AuthFormField[] = [
  {
    name: 'username',
    type: 'text',
    label: 'Username',
    placeholder: 'Masukkan username',
    required: true
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: '••••••••',
    required: true
  },
  {
    name: 'remember',
    type: 'checkbox',
    label: 'Ingat Sesi'
  }
]

async function onSubmit(payload: FormSubmitEvent<LoginSchema>) {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await login(payload.data.username, payload.data.password)
    await navigateTo(getLandingPage(), { replace: true })
  } catch {
    errorMessage.value = 'Username atau password salah'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#B6F500] selection:text-black">
    <div class="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      <div class="absolute top-[-10%] left-[-5%] h-[40%] w-[40%] rounded-full bg-[#B6F500]/10 blur-[120px] animate-pulse" />
      <div class="absolute right-[-5%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px] animate-pulse" />

      <div class="relative z-10 w-full max-w-md rounded-[40px] border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-2xl">
        <div class="mb-10 flex flex-col items-center">
          <div class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#B6F500] shadow-[0_0_30px_rgba(182,245,0,0.4)]">
            <Package
              :size="32"
              class="text-black"
            />
          </div>
          <h1 class="text-3xl font-black tracking-tight text-white">
            RMA <span class="text-[#B6F500]">SYSTEM</span>
          </h1>
          <p class="mt-2 font-medium text-white/40">
            Portal Operasional Internal
          </p>
        </div>

        <UAuthForm
          :schema="loginSchema"
          :fields="fields"
          :loading="isLoading"
          :submit="{ label: 'MASUK SEKARANG', block: true }"
          :ui="{
            root: 'space-y-6',
            form: 'space-y-5',
            footer: 'text-center text-[10px] text-white/20 uppercase tracking-[0.2em] mt-6'
          }"
          @submit="onSubmit"
        >
          <template #validation>
            <div
              v-if="errorMessage"
              class="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400"
            >
              {{ errorMessage }}
            </div>
          </template>

          <template #password-hint>
            <span class="cursor-pointer text-xs text-white/40 transition-colors hover:text-[#B6F500]">
              Lupa Password?
            </span>
          </template>

          <template #footer>
            Build version 4.0.1-stable
          </template>
        </UAuthForm>
      </div>
    </div>
  </div>
</template>

<style>
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
</style>
