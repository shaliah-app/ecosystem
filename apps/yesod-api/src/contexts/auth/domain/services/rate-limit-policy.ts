import { MagicLinkAttempt } from '../entities/magic-link-attempt';
import {
  MAGIC_LINK_COOLDOWN_SECONDS,
  MAGIC_LINK_HOURLY_LIMIT,
  RATE_LIMIT_WINDOW_HOURS,
} from '../../constants';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export class RateLimitPolicy {
  /**
   * Determines if a magic link can be sent based on rate limiting rules
   * @param attempts Recent attempts for the email within the window
   * @param currentTime Current time (defaults to Date.now())
   * @returns Whether sending is allowed and retry delay if not
   */
  static canSendMagicLink(attempts: MagicLinkAttempt[], currentTime: number = Date.now()): RateLimitResult {
    // Check cooldown: cannot send if last attempt was within cooldown period
    const lastAttempt = attempts
      .filter(attempt => attempt.success)
      .sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime())[0];

    if (lastAttempt) {
      const timeSinceLastAttempt = currentTime - lastAttempt.attemptedAt.getTime();
      if (timeSinceLastAttempt < MAGIC_LINK_COOLDOWN_SECONDS * 1000) {
        const remainingCooldown = MAGIC_LINK_COOLDOWN_SECONDS * 1000 - timeSinceLastAttempt;
        const retryAfterSeconds = Math.ceil(remainingCooldown / 1000);

        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, retryAfterSeconds),
        };
      }
    }

    // Check hourly limit: cannot send if >= 10 successful attempts in last hour
    const recentAttempts = attempts.filter(attempt =>
      attempt.success && attempt.isWithinLastHour(currentTime)
    );

    if (recentAttempts.length >= MAGIC_LINK_HOURLY_LIMIT) {
      // Calculate when the oldest attempt in the window will expire
      const sortedAttempts = recentAttempts
        .sort((a, b) => a.attemptedAt.getTime() - b.attemptedAt.getTime());
      const oldestAttempt = sortedAttempts[0];

      if (!oldestAttempt) {
        // This should never happen since we checked length >= limit
        return { allowed: false, retryAfterSeconds: MAGIC_LINK_COOLDOWN_SECONDS };
      }

      const timeUntilWindowExpires = (RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000) -
        (currentTime - oldestAttempt.attemptedAt.getTime());

      const retryAfterSeconds = Math.ceil(timeUntilWindowExpires / 1000);

      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }

    return { allowed: true };
  }
}