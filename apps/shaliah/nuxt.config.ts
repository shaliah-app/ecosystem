// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@sentry/nuxt/module'],
  // Enable source maps for better error tracking
  sourcemap: { client: 'hidden' },
  runtimeConfig: {
    // Private keys (only available on server-side)
    sentry: {
      dsn: process.env.SENTRY_DSN,
    },
    // Public keys that are exposed to client-side
    public: {
      sentry: {
        dsn: process.env.SENTRY_DSN,
      },
    },
  },
  // Optional: Configure Sentry for source map uploading
  // Uncomment and fill in your details when ready to upload source maps
  // sentry: {
  //   org: 'your-org-slug',
  //   project: 'your-project-slug',
  //   authToken: process.env.SENTRY_AUTH_TOKEN,
  // },
})
