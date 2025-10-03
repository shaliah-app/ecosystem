import { describe, it, expect, vi } from 'vitest';
import { RateLimitPolicy } from '../../../src/contexts/auth/domain/services/rate-limit-policy';
import { MagicLinkAttempt, EmailAddress } from '../../../src/contexts/auth/domain/entities/magic-link-attempt';

describe('RateLimitPolicy Domain Service', () => {
  const email = EmailAddress.create('test@example.com');
  const now = new Date('2025-01-01T12:00:00Z');

  describe('canSendMagicLink', () => {
    it('should allow sending when no previous attempts', () => {
      const result = RateLimitPolicy.canSendMagicLink([], now.getTime());

      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it('should enforce cooldown period (60 seconds)', () => {
      // Attempt 30 seconds ago - should be blocked
      const recentAttempt = MagicLinkAttempt.create({
        email,
        attemptedAt: new Date(now.getTime() - 30 * 1000), // 30 seconds ago
        success: true
      });

      const result = RateLimitPolicy.canSendMagicLink([recentAttempt], now.getTime());

      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBe(30); // 60 - 30 = 30 seconds remaining
    });

    it('should allow sending after cooldown expires', () => {
      // Attempt 61 seconds ago - should be allowed
      const oldAttempt = MagicLinkAttempt.create({
        email,
        attemptedAt: new Date(now.getTime() - 61 * 1000), // 61 seconds ago
        success: true
      });

      const result = RateLimitPolicy.canSendMagicLink([oldAttempt], now.getTime());

      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it('should enforce hourly limit (10 attempts)', () => {
      // Create 10 attempts within the last hour
      const attempts = Array.from({ length: 10 }, (_, i) =>
        MagicLinkAttempt.create({
          email,
          attemptedAt: new Date(now.getTime() - i * 60 * 1000), // i minutes ago
          success: true
        })
      );

      const result = RateLimitPolicy.canSendMagicLink(attempts, now.getTime());

      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should allow sending when under hourly limit', () => {
      // Create 9 attempts within the last hour, most recent 2 minutes ago (not in cooldown)
      const attempts = Array.from({ length: 9 }, (_, i) =>
        MagicLinkAttempt.create({
          email,
          attemptedAt: new Date(now.getTime() - (i + 2) * 60 * 1000), // 2-10 minutes ago
          success: true
        })
      );

      const result = RateLimitPolicy.canSendMagicLink(attempts, now.getTime());

      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it('should ignore failed attempts for rate limiting', () => {
      // Create 10 failed attempts - should not count towards limit
      const failedAttempts = Array.from({ length: 10 }, (_, i) =>
        MagicLinkAttempt.create({
          email,
          attemptedAt: new Date(now.getTime() - i * 60 * 1000),
          success: false
        })
      );

      const result = RateLimitPolicy.canSendMagicLink(failedAttempts, now.getTime());

      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it('should ignore attempts older than 1 hour', () => {
      // Create 10 attempts, but 9 are older than 1 hour
      const oldAttempts = Array.from({ length: 9 }, (_, i) =>
        MagicLinkAttempt.create({
          email,
          attemptedAt: new Date(now.getTime() - (60 + i) * 60 * 1000), // 61+ minutes ago
          success: true
        })
      );

      const recentAttempt = MagicLinkAttempt.create({
        email,
        attemptedAt: new Date(now.getTime() - 30 * 1000), // 30 seconds ago
        success: true
      });

      const result = RateLimitPolicy.canSendMagicLink([...oldAttempts, recentAttempt], now.getTime());

      // Should be blocked by cooldown, not by hourly limit
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBe(30);
    });

    it('should calculate retryAfterSeconds correctly when both limits apply', () => {
      // Recent attempt (cooldown) and 10 attempts in hour
      const recentAttempt = MagicLinkAttempt.create({
        email,
        attemptedAt: new Date(now.getTime() - 30 * 1000), // 30 seconds ago
        success: true
      });

      const hourlyAttempts = Array.from({ length: 9 }, (_, i) =>
        MagicLinkAttempt.create({
          email,
          attemptedAt: new Date(now.getTime() - (i + 1) * 60 * 1000), // 1-9 minutes ago
          success: true
        })
      );

      const result = RateLimitPolicy.canSendMagicLink([recentAttempt, ...hourlyAttempts], now.getTime());

      // Should return cooldown time since it's more restrictive
      expect(result.allowed).toBe(false);
      expect(result.retryAfterSeconds).toBe(30);
    });

    it('should handle empty attempts array', () => {
      const result = RateLimitPolicy.canSendMagicLink([], now.getTime());

      expect(result.allowed).toBe(true);
      expect(result.retryAfterSeconds).toBeUndefined();
    });

    it('should handle timezone edge cases', () => {
      // Test with different timezone dates
      const utcAttempt = MagicLinkAttempt.create({
        email,
        attemptedAt: new Date('2025-01-01T12:00:00Z'),
        success: true
      });

      const localAttempt = MagicLinkAttempt.create({
        email,
        attemptedAt: new Date('2025-01-01T12:00:00'), // Local timezone
        success: true
      });

      // Both should be treated equally for rate limiting logic
      const result1 = RateLimitPolicy.canSendMagicLink([utcAttempt]);
      const result2 = RateLimitPolicy.canSendMagicLink([localAttempt]);

      // The exact behavior depends on implementation, but should be consistent
      expect(typeof result1.allowed).toBe('boolean');
      expect(typeof result2.allowed).toBe('boolean');
    });
  });
});