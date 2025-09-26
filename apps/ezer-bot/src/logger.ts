import { createLogger } from '@yesod/logger'

// Initialize the shared logger for bot operations
export const logger = createLogger({
  serviceName: 'ezer-bot',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
})