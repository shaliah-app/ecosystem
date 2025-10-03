import type { Context } from 'hono';
import { z } from 'zod';
import type { Variables } from '../../../../types';
import { SendMagicLinkUseCase } from '../../application/use-cases/send-magic-link.use-case';
import { MagicLinkAttemptRepository } from '../../infra/repositories/magic-link-attempt.repository';
import { SupabaseAuthService } from '../../infra/services/supabase-auth.service';

const requestSchema = z.object({
  email: z.string().email(),
});

export async function magicLinkRequestHandler(c: Context<{ Variables: Variables }>) {
  try {
    // Parse request body
    const body = await c.req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return c.json({
        error: 'invalid_email',
        message: 'Email address is invalid',
      }, 400);
    }

    const { email } = validation.data;

    // Get IP address
    const ipAddress = c.req.header('x-forwarded-for') ||
                     c.req.header('x-real-ip') ||
                     '127.0.0.1';

    // Initialize dependencies
    const repository = new MagicLinkAttemptRepository();
    const authService = new SupabaseAuthService();
    const useCase = new SendMagicLinkUseCase(repository, authService);

    // Execute use case
    const result = await useCase.execute(email, ipAddress);

    if (!result.success) {
      // Rate limit exceeded
      const errorType = result.retryAfterSeconds && result.retryAfterSeconds <= 60
        ? 'rate_limit_cooldown'
        : 'rate_limit_exceeded';

      return c.json({
        error: errorType,
        message: errorType === 'rate_limit_cooldown'
          ? 'Please wait before requesting another magic link'
          : 'Too many requests. Please try again later.',
        retry_after_seconds: result.retryAfterSeconds,
      }, 429);
    }

    // Success
    return c.json({
      success: true,
      message: `Magic link sent to ${email}`,
      cooldown_seconds: 60,
    }, 200);

  } catch (error) {
    console.error('Unexpected error in magic link handler:', error);
    return c.json({
      error: 'server_error',
      message: 'Failed to send magic link',
    }, 500);
  }
}