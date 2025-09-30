import { Hono } from 'hono';
import { createLogger } from '@yesod/logger';
import { db } from '../db';
import { authTokens } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const logger = createLogger({
  serviceName: 'yesod-api',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
});

const auth = new Hono();

// Request Bot Link Token
auth.post('/request-link-token', async (c) => {
  try {
    // Get user ID from JWT (middleware will validate this) or test header
    const userId = (c as any).get('userId') as string | undefined || c.req.header('x-test-user-id');

    if (!userId) {
      logger.error('No user ID in request context');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Generate token with 5-minute expiry
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Insert token into database
    await db.insert(authTokens).values({
      token,
      userId,
      expiresAt,
    });

    logger.info('Generated auth token for user', { userId, token });

    return c.json({
      token,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.captureException(error as Error);
    return c.json({ error: 'Failed to generate link token' }, 500);
  }
});

// Verify Bot Link Token
auth.post('/verify-link-token', async (c) => {
  try {
    const body = await c.req.json();
    const schema = z.object({
      token: z.string().uuid(),
      telegram_user_id: z.number(),
    });

    const { token, telegram_user_id } = schema.parse(body);

    // Find and validate token
    const [tokenRecord] = await db
      .select()
      .from(authTokens)
      .where(eq(authTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      logger.warn('Token not found', { token });
      return c.json({ error: 'Token not found' }, 404);
    }

    if (new Date() > tokenRecord.expiresAt) {
      logger.warn('Token expired', { token, expiresAt: tokenRecord.expiresAt });
      return c.json({ error: 'Token expired' }, 410);
    }

    // Update user profile with telegram_user_id
    const { userProfiles } = await import('../db/schema');
    await db
      .update(userProfiles)
      .set({ telegramUserId: telegram_user_id })
      .where(eq(userProfiles.id, tokenRecord.userId));

    // Delete the used token
    await db.delete(authTokens).where(eq(authTokens.token, token));

    logger.info('Successfully linked Telegram account', {
      userId: tokenRecord.userId,
      telegramUserId: telegram_user_id,
    });

    return c.json({
      success: true,
      message: 'Account linked successfully.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.issues }, 400);
    }

    logger.captureException(error as Error);
    return c.json({ error: 'Failed to link account' }, 500);
  }
});

export default auth;