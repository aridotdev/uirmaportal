// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      include: [
        'lucide-vue-next',
      ]
    }
  },
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/fonts'],

  fonts: {
    families: [
      { name: 'Plus Jakarta Sans', provider: 'google' }
    ]
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})