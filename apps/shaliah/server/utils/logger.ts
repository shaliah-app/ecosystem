import { createLogger } from '@yesod/logger'

// Initialize the shared logger for server-side use
export const logger = createLogger({
  serviceName: 'shaliah',
  environment: process.env.NODE_ENV || 'development',
  // Note: sentryDsn is optional here since @sentry/nuxt handles client-side
  // But you can still set it for server-side exception forwarding
  sentryDsn: process.env.SENTRY_DSN,
})