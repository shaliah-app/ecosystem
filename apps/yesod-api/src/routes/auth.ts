import { Hono } from 'hono';
import { createLogger } from '@yesod/logger';

const logger = createLogger({
  serviceName: 'yesod-api',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
});

const auth = new Hono();

// TODO: Implement new auth routes if needed
// The auth_tokens table has been dropped and replaced with Supabase Auth
// Previous routes for Telegram bot linking have been removed

export default auth;