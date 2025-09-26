import { logger } from '../utils/logger'

export default defineNitroPlugin(() => {
  // Log server startup
  logger.info('Shaliah server initialized', {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})