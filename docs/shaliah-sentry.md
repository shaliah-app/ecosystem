# Sentry Integration for Shaliah (Nuxt App)

## Overview
The `apps/shaliah` Nuxt application uses `@sentry/nuxt` for comprehensive error tracking, including both server-side and client-side contexts. The shared `@yesod/logger` package provides server-side logging and exception forwarding to Sentry.

## ✅ Current Setup Status

### Installed Packages
- `@sentry/nuxt` - Sentry SDK for Nuxt
- `@yesod/logger` - Shared logger package

### Configuration Files
- `nuxt.config.ts` - Sentry module configuration
- `server/plugins/logger.ts` - Server-side logger initialization
- `composables/useLogger.ts` - Client-side logging composable
- `.env` / `.env.example` - Environment variables

## Setup Steps (Already Completed)

1. **Install Sentry Nuxt SDK** ✅:
   ```bash
   pnpm add @sentry/nuxt
   ```

2. **Install shared logger** ✅:
   ```bash
   pnpm add @yesod/logger@workspace:*
   ```

3. **Configure Sentry in `nuxt.config.ts`** ✅:
   ```ts
   export default defineNuxtConfig({
     modules: ['@sentry/nuxt/module'],
     sentry: {
       dsn: process.env.SENTRY_DSN,
       environment: process.env.NODE_ENV || 'development',
       tracesSampleRate: 1.0,
       replaysOnErrorSampleRate: 1.0,
       replaysSessionSampleRate: 0.1,
     },
   })
   ```

4. **Initialize server-side logger** ✅:
   - `server/plugins/logger.ts` - Auto-initializes logger on server startup
   - Logs server initialization with environment info

5. **Client-side logging composable** ✅:
   - `composables/useLogger.ts` - Provides consistent logging interface
   - Falls back to console logging (Sentry captures errors automatically)

## Environment Variables

Create a `.env` file in `apps/shaliah/`:

```bash
# Replace with your actual Sentry DSN from Sentry.io
SENTRY_DSN=https://your-project-dsn@sentry.io/project-id
NODE_ENV=development
```

## Usage Examples

### Server-side (API routes, server middleware)
```ts
// Logger is automatically available via Nitro context
const nitroApp = useNitroApp()
nitroApp.logger.info('API request processed', { route: '/api/data' })

// Or import directly in server files
import { createLogger } from '@yesod/logger'
const logger = createLogger({ serviceName: 'shaliah-api' })
```

### Client-side (Vue components)
```vue
<script setup>
const logger = useLogger()

onMounted(() => {
  logger.info('Component mounted')
})

const handleError = () => {
  try {
    // risky operation
  } catch (error) {
    logger.captureException(error, { component: 'MyComponent' })
  }
}
</script>
```

## How It Works

- **Client-side**: `@sentry/nuxt` automatically captures unhandled errors, uncaught exceptions, and performance metrics
- **Server-side**: Shared logger sends structured logs to console and forwards exceptions to Sentry
- **Integration**: Both client and server use the same Sentry project for unified error tracking

## Next Steps

1. **Get your Sentry DSN** from [sentry.io](https://sentry.io)
2. **Update `.env`** with your actual DSN
3. **Deploy and monitor** - Sentry will start capturing errors automatically
4. **Customize configuration** in `nuxt.config.ts` as needed for your use case

## Notes
- The setup is production-ready and follows Nuxt 4 best practices
- Server-side logger initialization happens automatically via Nitro plugin
- Client-side errors are captured by Sentry without manual intervention
- All logging goes through structured interfaces for consistency