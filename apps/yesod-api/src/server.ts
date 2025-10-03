import { serve } from '@hono/node-server'
import app from './index.js'
import { env } from './config/env.js'
import { createLogger } from '@yesod/logger'

const logger = createLogger({
  serviceName: 'yesod-api',
  environment: env.NODE_ENV,
  sentryDsn: env.SENTRY_DSN,
})

const port = env.PORT

logger.info('Server starting', { port })

serve({
  fetch: app.fetch,
  port,
})