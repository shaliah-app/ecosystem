import { Hono } from 'hono';
import type { Variables } from '../../../types';

const authApp = new Hono<{ Variables: Variables }>();

// Auth context routes removed - magic link functionality moved to Supabase Auth directly
// Routes will be added by future implementation tasks if needed

export { authApp };