import { Hono } from 'hono';
import { createLogger } from '@yesod/logger';
import { db } from '../db';
import { userProfiles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const logger = createLogger({
  serviceName: 'yesod-api',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
});

const profile = new Hono();

// Update user profile (onboarding)
profile.patch('/me', async (c) => {
  try {
    // Get user ID from JWT (middleware will validate this) or test header
    const userId = (c as any).get('userId') as string | undefined || c.req.header('x-test-user-id');

    if (!userId) {
      logger.error('No user ID in request context');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const schema = z.object({
      full_name: z.string().min(1).max(100).optional(),
      avatar_url: z.string().url().optional(),
      language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/).optional(), // Allow en or en-US format
      active_space_id: z.string().uuid().optional(),
    });

    const updates = schema.parse(body);

    // Build update object, filtering out undefined values
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.full_name !== undefined) updateData.fullName = updates.full_name;
    if (updates.avatar_url !== undefined) updateData.avatarUrl = updates.avatar_url;
    if (updates.language !== undefined) updateData.language = updates.language;
    if (updates.active_space_id !== undefined) updateData.activeSpaceId = updates.active_space_id;

    // Update user profile
    const [updatedProfile] = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.id, userId))
      .returning();

    if (!updatedProfile) {
      logger.error('User profile not found for update', { userId });
      return c.json({ error: 'User profile not found' }, 404);
    }

    logger.info('Updated user profile', { userId, updates });

    // Return updated profile (exclude internal fields)
    const { id, fullName, avatarUrl, language, activeSpaceId, telegramUserId, createdAt, updatedAt } = updatedProfile;

    return c.json({
      id,
      full_name: fullName,
      avatar_url: avatarUrl,
      language,
      active_space_id: activeSpaceId,
      telegram_user_id: telegramUserId,
      created_at: createdAt,
      updated_at: updatedAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Invalid input', details: error.issues }, 400);
    }

    logger.captureException(error as Error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

export default profile;