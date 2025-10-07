import { createLogger } from '@yesod/logger'
import { getEnv } from './env'

// Get server-side environment variables
const serverEnv = getEnv()

// Initialize the shared logger for web app operations
export const logger = createLogger({
  serviceName: 'shaliah-next',
  environment: serverEnv.app.environment,
  sentryDsn: serverEnv.sentry.dsn,
})