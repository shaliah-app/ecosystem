import { createLogger } from '@yesod/logger'

export const useLogger = () => {
  // Client-side logging using the shared logger package
  // This provides structured logging with optional Sentry forwarding
  return createLogger({
    serviceName: 'shaliah-client',
    environment: process.env.NODE_ENV || 'development',
    sentryDsn: process.env.SENTRY_DSN,
  })
}