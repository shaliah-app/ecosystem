import { createLogger } from '@yesod/logger'

// Initialize the shared logger for worker operations
export const logger = createLogger({
  serviceName: 'yesod-worker',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
})