import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from 'hono/testing'
import { Hono } from 'hono'
import { usersApp } from '../../src/contexts/users/api/routes.js'
import { db } from '../../src/db/index.js'
import { userProfiles } from '../../src/db/schema.js'
import { eq } from 'drizzle-orm'

describe('PATCH /api/user/profile', () => {
  // Create a test app with mocked auth middleware
  const testApp = new Hono()

  // Mock auth middleware that sets userId in context
  testApp.use('/api/user/*', async (c, next) => {
    c.set('userId', '550e8400-e29b-41d4-a716-446655440002')
    await next()
  })

  testApp.route('/api/user', usersApp)

  const client = testClient(testApp) as any

  const mockUserId = '550e8400-e29b-41d4-a716-446655440002'

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

  it('should update full_name successfully', async () => {
    const res = await client.api.user.profile.$patch({
      json: {
        full_name: 'Updated Name'
      }
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.profile.full_name).toBe('Updated Name')
  })

  it('should update language successfully', async () => {
    const res = await client.api.user.profile.$patch({
      json: {
        language: 'en-US'
      }
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.profile.language).toBe('en-US')
  })

  it('should return 400 on invalid full_name length', async () => {
    const res = await client.api.user.profile.$patch({
      json: {
        full_name: 'A' // Too short
      }
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('validation_error')
  })

  it('should return 400 on unsupported language', async () => {
    const res = await client.api.user.profile.$patch({
      json: {
        language: 'xx-XX'
      }
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.details.language).toContain('Unsupported')
  })

  it('should clear avatar_url when set to null', async () => {
    const res = await client.api.user.profile.$patch({
      json: {
        avatar_url: null
      }
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.profile.avatar_url).toBeNull()
  })
})