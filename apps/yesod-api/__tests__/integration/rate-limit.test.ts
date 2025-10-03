import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { testClient } from 'hono/testing';
import { Hono } from 'hono';
import { authApp } from '../../src/contexts/auth/api/routes.js';
import { db } from '../../src/db/index.js';
import { magicLinkAttempts } from '../../src/db/schema.js';
import { sql } from 'drizzle-orm';

describe('Rate Limit Integration Test (Scenario 3)', () => {
  // Create a test app without auth middleware
  const testApp = new Hono();
  testApp.route('/api/auth', authApp);

  const client = testClient(testApp) as any;

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
    await db.delete(magicLinkAttempts);
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    // Clean up test data
    await db.delete(magicLinkAttempts);
  });

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

  it('allows 10 sends per email per hour, blocks 11th', async () => {
    const email = 'abuse@example.com';

    // Send 10 requests (should all succeed)
    for (let i = 0; i < 10; i++) {
      const res = await client.api.auth['magic-link'].request.$post({
        json: { email }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toMatchObject({
        success: true,
        cooldown_seconds: 60,
      });

      // Advance time by 61 seconds to bypass cooldown
      mockDate.setTime(mockDate.getTime() + 61000);
    }

    // 11th request should fail with rate limit
    const res = await client.api.auth['magic-link'].request.$post({
      json: { email }
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data).toMatchObject({
      error: 'rate_limit_exceeded',
      message: expect.stringContaining('Too many requests'),
      retry_after_seconds: expect.any(Number),
    });
  });

  it('allows different email to bypass limit', async () => {
    const email1 = 'user1@example.com';
    const email2 = 'user2@example.com';

    // Exhaust limit for email1
    for (let i = 0; i < 10; i++) {
      const res = await client.api.auth['magic-link'].request.$post({
        json: { email: email1 }
      });
      expect(res.status).toBe(200);
      mockDate.setTime(mockDate.getTime() + 61000);
    }

    // email1 should be blocked
    const res1 = await client.api.auth['magic-link'].request.$post({
      json: { email: email1 }
    });
    expect(res1.status).toBe(429);

    // email2 should still work
    const res2 = await client.api.auth['magic-link'].request.$post({
      json: { email: email2 }
    });
    expect(res2.status).toBe(200);
    const data = await res2.json();
    expect(data.success).toBe(true);
  });
});