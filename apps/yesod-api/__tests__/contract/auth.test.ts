import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from 'hono/testing'
import { Hono } from 'hono'
import authRoutes from '../../src/routes/auth.js'
import profileRoutes from '../../src/routes/profile.js'
import { db } from '../../src/db/index.js'
import { authTokens, userProfiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'

describe('Auth API Contract Tests', () => {
  // Create a test app without auth middleware
  const testApp = new Hono()
  testApp.route('/api/v1/auth', authRoutes)
  testApp.route('/api/v1/profile', profileRoutes)

  const client = testClient(testApp) as any

  // Mock user ID for authenticated requests
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000'

  beforeAll(async () => {
    // Insert a test user profile
    await db.insert(userProfiles).values({
      id: mockUserId,
      fullName: 'Test User',
      language: 'en-US',
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.delete(authTokens).where(eq(authTokens.userId, mockUserId))
    await db.delete(userProfiles).where(eq(userProfiles.id, mockUserId))
  })

  describe('POST /api/v1/auth/request-link-token', () => {
    it('should generate and return a token when authenticated', async () => {
      // Mock the userId in context (simulating auth middleware)
      const res = await client.api.v1.auth['request-link-token'].$post(
        {},
        {
          headers: { 'x-test-user-id': mockUserId } // Custom header for testing
        }
      )

      // Since middleware is bypassed, we need to set context manually
      // For now, test the route directly by mocking the context

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('token')
      expect(data).toHaveProperty('expires_at')

      // Verify token was created in DB
      const [tokenRecord] = await db
        .select()
        .from(authTokens)
        .where(eq(authTokens.token, data.token))
        .limit(1)

      expect(tokenRecord).toBeDefined()
      expect(tokenRecord?.userId).toBe(mockUserId)
    })
  })

  describe('POST /api/v1/auth/verify-link-token', () => {
    it('should return 400 for invalid request body', async () => {
      const res = await client.api.v1.auth['verify-link-token'].$post({
        json: { invalid: 'data' }
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Invalid input')
    })

    it('should return 404 for non-existent token', async () => {
      const res = await client.api.v1.auth['verify-link-token'].$post({
        json: {
          token: '00000000-0000-0000-0000-000000000000',
          telegram_user_id: 123456
        }
      })

      expect(res.status).toBe(404)
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Token not found')
    })

    it('should successfully verify and link account', async () => {
      // First, create a valid token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

      await db.insert(authTokens).values({
        token,
        userId: mockUserId,
        expiresAt,
      })

      const res = await client.api.v1.auth['verify-link-token'].$post({
        json: {
          token,
          telegram_user_id: 123456789
        }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toEqual({
        success: true,
        message: 'Account linked successfully.'
      })

      // Verify token was deleted
      const [deletedToken] = await db
        .select()
        .from(authTokens)
        .where(eq(authTokens.token, token))
        .limit(1)

      expect(deletedToken).toBeUndefined()

      // Verify profile was updated
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, mockUserId))
        .limit(1)

      expect(profile?.telegramUserId).toBe(123456789)
    })

    it('should return 410 for expired token', async () => {
      const token = crypto.randomUUID()
      const expiredAt = new Date(Date.now() - 1000) // Already expired

      await db.insert(authTokens).values({
        token,
        userId: mockUserId,
        expiresAt: expiredAt,
      })

      const res = await client.api.v1.auth['verify-link-token'].$post({
        json: {
          token,
          telegram_user_id: 123456789
        }
      })

      expect(res.status).toBe(410)
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Token expired')
    })
  })
})

describe('Profile API Contract Tests', () => {
  const testApp = new Hono()
  testApp.route('/api/v1/profile', profileRoutes)
  const client = testClient(testApp) as any

  const mockUserId = '550e8400-e29b-41d4-a716-446655440001'

  beforeAll(async () => {
    await db.insert(userProfiles).values({
      id: mockUserId,
      fullName: null,
      language: 'pt-BR',
    })
  })

  afterAll(async () => {
    await db.delete(userProfiles).where(eq(userProfiles.id, mockUserId))
  })

  describe('PATCH /api/v1/profile/me', () => {
    it('should update user profile successfully', async () => {
      // Mock userId in context
      const res = await client.api.v1.profile.me.$patch({
        json: {
          full_name: 'Updated Name',
          language: 'en-US'
        }
      }, {
        headers: { 'x-test-user-id': mockUserId }
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('id', mockUserId)
      expect(data).toHaveProperty('full_name', 'Updated Name')
      expect(data).toHaveProperty('language', 'en-US')
    })

    it('should return 400 for invalid language code', async () => {
      const res = await client.api.v1.profile.me.$patch({
        json: {
          language: 'invalid-lang'
        }
      }, {
        headers: { 'x-test-user-id': mockUserId }
      })

      expect(res.status).toBe(400)
      const data = await res.json()
      expect(data).toHaveProperty('error', 'Invalid input')
    })
  })
})