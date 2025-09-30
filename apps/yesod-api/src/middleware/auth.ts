import { createMiddleware } from 'hono/factory';
import { createLogger } from '@yesod/logger';
import { createClient } from '@supabase/supabase-js';

const logger = createLogger({
  serviceName: 'yesod-api',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
});

// Initialize Supabase client for JWT verification
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('JWT verification failed', { error: error?.message });
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Add user ID to context
    (c as any).set('userId', user.id);

    logger.info('Authenticated user', { userId: user.id });

    return next();
  } catch (error) {
    logger.captureException(error as Error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});