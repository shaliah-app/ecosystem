import { createLogger } from '@yesod/logger'
import { env } from './env'

// Initialize the shared logger for web app operations
export const logger = createLogger({
  serviceName: 'shaliah-next',
  environment: env.app.environment,
  sentryDsn: env.sentry.dsn,
})