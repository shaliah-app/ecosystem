# Sentry Integration for Shaliah (Nuxt App)

## Overview
The `apps/shaliah` Nuxt application should use `@sentry/nuxt` for comprehensive error tracking, including both server-side and client-side contexts. The shared `@yesod/logger` package provides server-side logging and exception forwarding to Sentry.

## Setup Steps

1. **Install Sentry Nuxt SDK**:
   ```bash
   cd apps/shaliah
   pnpm add @sentry/nuxt
   ```

2. **Configure Sentry in `nuxt.config.ts`**:
   ```ts
   import { defineNuxtConfig } from 'nuxt/config'

   export default defineNuxtConfig({
     modules: ['@sentry/nuxt/module'],
     sentry: {
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV,
       // Other Sentry options as needed
     },
   })
   ```

3. **Initialize the shared logger** in server-side code (e.g., server/api routes or plugins):
   ```ts
   import { createLogger } from '@yesod/logger'

   const logger = createLogger({
     serviceName: 'shaliah',
     environment: process.env.NODE_ENV,
     sentryDsn: process.env.SENTRY_DSN, // Optional, since @sentry/nuxt handles client-side
   })

   // Use logger for server-side logging
   logger.info('Server-side log', { context: 'data' })
   ```

4. **Capture exceptions server-side**:
   ```ts
   try {
     // risky code
   } catch (err) {
     logger.captureException(err, { route: '/api/example' })
   }
   ```

## Notes
- `@sentry/nuxt` automatically captures client-side errors and unhandled exceptions.
- The shared logger is used for structured server-side logs and manual exception reporting.
- Ensure `SENTRY_DSN` is set in environment variables for both client and server contexts.