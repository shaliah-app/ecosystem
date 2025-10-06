import { createLogger } from '@yesod/logger'

// Initialize the shared logger for web app operations
export const logger = createLogger({
  serviceName: 'shaliah-next',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
})