import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server'; // Assuming this exists

describe('Rate Limit Integration Test (Scenario 3)', () => {
  // Mock time for testing rate limits
  const originalDate = Date;
  const mockDate = new Date('2025-10-01T10:00:00Z');

  beforeEach(() => {
    global.Date = class extends Date {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate);
        } else {
          super(...args);
        }
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
      const response = await request(app)
        .post('/api/auth/magic-link/request')
        .send({ email })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        cooldown_seconds: 60,
      });

      // Advance time by 61 seconds to bypass cooldown
      mockDate.setTime(mockDate.getTime() + 61000);
    }

    // 11th request should fail with rate limit
    const response = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email })
      .expect(429);

    expect(response.body).toMatchObject({
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
      await request(app)
        .post('/api/auth/magic-link/request')
        .send({ email: email1 })
        .expect(200);
      mockDate.setTime(mockDate.getTime() + 61000);
    }

    // email1 should be blocked
    await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: email1 })
      .expect(429);

    // email2 should still work
    const response = await request(app)
      .post('/api/auth/magic-link/request')
      .send({ email: email2 })
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});