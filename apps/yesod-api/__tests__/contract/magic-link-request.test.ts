import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
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

  // Mock time for testing rate limits
  const originalDate = Date;
  const mockDate = new Date('2025-10-01T10:00:00Z');

  beforeAll(async () => {
    // Mock Supabase auth service to avoid actual email sending
    vi.mock('../../src/contexts/auth/infra/services/supabase-auth.service.ts', () => ({
      SupabaseAuthService: class {
        async sendMagicLink() {
          // Mock successful send
          return { success: true };
        }
      }
    }));

    // Clean up any existing test data
    await db.delete(magicLinkAttempts)
  })

  afterAll(async () => {
    vi.restoreAllMocks();
    // Clean up test data
    await db.delete(magicLinkAttempts)
  })

  beforeEach(async () => {
    // Reset mock date for each test
    mockDate.setTime(new Date('2025-10-01T10:00:00Z').getTime());

    // Clean up database for each test
    await db.delete(magicLinkAttempts);

    global.Date = class extends Date {
      constructor(date?: string | number | Date) {
        super(date || mockDate);
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

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
      error: 'rate_limit_cooldown',
      message: 'Please wait before requesting another magic link',
      retry_after_seconds: expect.any(Number)
    })
  })

  it('should return 429 after 10 requests in 1 hour', async () => {
    const email = 'contract-bulk@example.com'

    // Make 10 requests
    for (let i = 0; i < 10; i++) {
      await client.api.auth['magic-link'].request.$post({
        json: { email }
      })
      // Advance time by 61 seconds to bypass cooldown
      mockDate.setTime(mockDate.getTime() + 61000);
    }

    // 11th request should be rate limited
    const res = await client.api.auth['magic-link'].request.$post({
      json: { email }
    })

    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data).toMatchObject({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
      retry_after_seconds: expect.any(Number)
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
      error: 'invalid_email',
      message: 'Email address is invalid'
    })
  })
})