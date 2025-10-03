import { eq, and, gte, desc } from 'drizzle-orm';
import { db } from '../../../../db';
import { magicLinkAttempts } from '../../../../db/schema/magic-link-attempts';
import { MagicLinkAttempt } from '../../domain/entities/magic-link-attempt';
import { createLogger } from '@yesod/logger';

export class MagicLinkAttemptRepository {
  private logger = createLogger({ serviceName: 'auth-repository' });

  async create(attempt: MagicLinkAttempt): Promise<void> {
    try {
      await db.insert(magicLinkAttempts).values({
        email: attempt.getEmail(),
        attemptedAt: attempt.attemptedAt,
        ipAddress: attempt.ipAddress,
        success: attempt.success,
      });

      this.logger.info('Magic link attempt recorded', {
        email: attempt.getEmail(),
        success: attempt.success,
      });
    } catch (error) {
      this.logger.error('Failed to record magic link attempt', {
        email: attempt.getEmail(),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async findRecentByEmail(email: string, windowHours: number): Promise<MagicLinkAttempt[]> {
    try {
      const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000);

      const rows = await db
        .select()
        .from(magicLinkAttempts)
        .where(
          and(
            eq(magicLinkAttempts.email, email),
            gte(magicLinkAttempts.attemptedAt, windowStart)
          )
        )
        .orderBy(desc(magicLinkAttempts.attemptedAt));

      const attempts = rows.map((row: typeof magicLinkAttempts.$inferSelect) =>
        MagicLinkAttempt.fromPersistence(
          row.id,
          row.email,
          row.attemptedAt,
          row.ipAddress,
          row.success
        )
      );

      this.logger.info('Retrieved recent magic link attempts', {
        email,
        count: attempts.length,
        windowHours,
      });

      return attempts;
    } catch (error) {
      this.logger.error('Failed to retrieve recent magic link attempts', {
        email,
        windowHours,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}