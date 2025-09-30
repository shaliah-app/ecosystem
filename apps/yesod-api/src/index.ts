import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import { authMiddleware } from './middleware/auth.js'

const app = new Hono()

// Middleware
app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.get('/api/v1', (c) => {
  return c.json({ message: 'Yesod API v1' })
})

// Auth routes (protected)
app.use('/api/v1/auth/*', authMiddleware)
app.route('/api/v1/auth', authRoutes)

// Profile routes (protected)
app.use('/api/v1/profile/*', authMiddleware)
app.route('/api/v1/profile', profileRoutes)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error(`${err}`)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app