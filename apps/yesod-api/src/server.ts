import { serve } from '@hono/node-server'
import app from './index.js'
import { env } from './config/env.js'

const port = parseInt(env.PORT)

console.log(`🚀 Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})