import { z } from 'zod';
import { MagicLinkAttempt, EmailAddress } from '../../domain/entities/magic-link-attempt';
import { RateLimitPolicy } from '../../domain/services/rate-limit-policy';
import { MagicLinkAttemptRepository } from '../../infra/repositories/magic-link-attempt.repository';
import { SupabaseAuthService } from '../../infra/services/supabase-auth.service';
import { createLogger } from '@yesod/logger';
import { RATE_LIMIT_WINDOW_HOURS } from '../../constants';

const emailSchema = z.string().email();

export interface SendMagicLinkResult {
  success: boolean;
  retryAfterSeconds?: number;
}

export class SendMagicLinkUseCase {
  private logger = createLogger({ serviceName: 'send-magic-link-use-case' });

  constructor(
    private repository: MagicLinkAttemptRepository,
    private authService: SupabaseAuthService
  ) {}

  async execute(email: string, ipAddress: string | null): Promise<SendMagicLinkResult> {
    try {
      // 1. Validate email
      const validationResult = emailSchema.safeParse(email);
      if (!validationResult.success) {
        this.logger.warn('Invalid email format', { email });
        throw new Error('Invalid email format');
      }

      // 2. Load recent attempts
      const recentAttempts = await this.repository.findRecentByEmail(
        email,
        RATE_LIMIT_WINDOW_HOURS
      );

      // 3. Check rate limits
      const rateLimitResult = RateLimitPolicy.canSendMagicLink(recentAttempts);
      if (!rateLimitResult.allowed) {
        this.logger.warn('Rate limit exceeded', {
          email,
          retryAfterSeconds: rateLimitResult.retryAfterSeconds,
        });

        // Record failed attempt
        const failedAttempt = MagicLinkAttempt.create({
          email: EmailAddress.create(email),
          ...(ipAddress && { ipAddress }),
          success: false
        });
        await this.repository.create(failedAttempt);

        const result: SendMagicLinkResult = {
          success: false,
        };
        if (rateLimitResult.retryAfterSeconds !== undefined) {
          result.retryAfterSeconds = rateLimitResult.retryAfterSeconds;
        }
        return result;
      }

      // 4. Send magic link
      await this.authService.sendMagicLink(email);

      // 5. Record successful attempt
      const successfulAttempt = MagicLinkAttempt.create({
        email: EmailAddress.create(email),
        ...(ipAddress && { ipAddress }),
        success: true
      });
      await this.repository.create(successfulAttempt);

      this.logger.info('Magic link sent successfully', { email });

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to send magic link', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}