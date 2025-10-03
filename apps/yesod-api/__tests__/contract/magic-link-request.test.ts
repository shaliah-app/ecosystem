import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { testClient } from 'hono/testing'
import { Hono } from 'hono'
import { authApp } from '../../src/contexts/auth/api/routes.js'
import { db } from '../../src/db/index.js'
import { magicLinkAttempts } from '../../src/db/schema.js'
import { sql } from 'drizzle-orm'

describe('POST /api/auth/magic-link/request', () => {
  // Create a test app without auth middleware
  const testApp = new Hono()
  testApp.route('/api/auth', authApp)

  const client = testClient(testApp) as any

  beforeAll(async () => {
    // Clean up any existing test data
    await db.delete(magicLinkAttempts).where(sql`${magicLinkAttempts.attemptedAt} >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}`)
  })

  afterAll(async () => {
    // Clean up test data
    await db.delete(magicLinkAttempts).where(sql`${magicLinkAttempts.attemptedAt} >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}`)
  })

  it('should return 200 and cooldown on valid email', async () => {
    const res = await client.api.auth['magic-link'].request.$post({
      json: {
        email: 'test@example.com'
      }
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({
      success: true,
      cooldown_seconds: 60
    })
  })

  it('should return 429 if request within 60s cooldown', async () => {
    // First request
    await client.api.auth['magic-link'].request.$post({
      json: {
        email: 'test@example.com'
      }
    })

    // Second request immediately (should be rate limited)
    const res = await client.api.auth['magic-link'].request.$post({
      json: {
        email: 'test@example.com'
      }
    })

    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data).toMatchObject({
      error: 'rate_limited',
      message: 'Too many requests. Please wait before requesting another magic link.',
      cooldown_seconds: expect.any(Number)
    })
  })

  it('should return 429 after 10 requests in 1 hour', async () => {
    const email = 'bulk-test@example.com'

    // Make 10 requests
    for (let i = 0; i < 10; i++) {
      await client.api.auth['magic-link'].request.$post({
        json: { email }
      })
    }

    // 11th request should be rate limited
    const res = await client.api.auth['magic-link'].request.$post({
      json: { email }
    })

    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data).toMatchObject({
      error: 'rate_limited',
      message: 'Too many requests. Please wait before requesting another magic link.',
      cooldown_seconds: expect.any(Number)
    })
  })

  it('should return 400 on invalid email', async () => {
    const res = await client.api.auth['magic-link'].request.$post({
      json: {
        email: 'invalid-email'
      }
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toMatchObject({
      error: 'validation_error',
      message: 'Invalid input',
      details: {
        email: expect.stringContaining('Invalid email')
      }
    })
  })
})