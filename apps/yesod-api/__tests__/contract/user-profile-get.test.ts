import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from 'hono/testing'
import { Hono } from 'hono'
import { usersApp } from '../../src/contexts/users/api/routes.js'
import { db } from '../../src/db/index.js'
import { userProfiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'

describe('GET /api/user/profile', () => {
  // Create a test app with mocked auth middleware
  const testApp = new Hono()

  // Mock auth middleware that sets userId in context
  testApp.use('/api/user/*', async (c, next) => {
    c.set('userId', '550e8400-e29b-41d4-a716-446655440001')
    await next()
  })

  testApp.route('/api/user', usersApp)

  const client = testClient(testApp) as any

  const mockUserId = '550e8400-e29b-41d4-a716-446655440001'

  beforeAll(async () => {
    // Insert test user profile
    await db.insert(userProfiles).values({
      id: mockUserId,
      fullName: null,
      avatarUrl: null,
      language: 'pt-BR',
      telegramUserId: null,
      activeSpaceId: null,
    })
  })

  afterAll(async () => {
    // Clean up test data
    await db.delete(userProfiles).where(eq(userProfiles.id, mockUserId))
  })

  it('should return user profile when authenticated', async () => {
    const res = await client.api.user.profile.$get()

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.profile).toMatchObject({
      id: mockUserId,
      language: 'pt-BR',
      created_at: expect.any(String),
      updated_at: expect.any(String)
    })
  })

  it('should return 401 without auth token', async () => {
    // Create a test app without auth middleware
    const unauthApp = new Hono()
    unauthApp.route('/api/user', usersApp)
    const unauthClient = testClient(unauthApp) as any

    const res = await unauthClient.api.user.profile.$get()

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toMatchObject({
      error: 'unauthorized',
      message: 'Authentication required'
    })
  })

  it('should return 401 with invalid token', async () => {
    // Create a test app with invalid auth middleware
    const invalidAuthApp = new Hono()

    invalidAuthApp.use('/api/user/*', async (c, next) => {
      c.set('userId', 'invalid-user-id')
      await next()
    })

    invalidAuthApp.route('/api/user', usersApp)
    const invalidClient = testClient(invalidAuthApp) as any

    const res = await invalidClient.api.user.profile.$get()

    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data).toMatchObject({
      error: 'unauthorized',
      message: 'Invalid authentication'
    })
  })

  it('should include null fields when not set', async () => {
    const res = await client.api.user.profile.$get()

    expect(res.status).toBe(200)
    const data = await res.json()

    // New user without onboarding completion
    expect(data.profile.full_name).toBeNull()
    expect(data.profile.avatar_url).toBeNull()
    expect(data.profile.telegram_user_id).toBeNull()
    expect(data.profile.active_space_id).toBeNull()
  })
})