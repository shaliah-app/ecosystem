import { Hono } from 'hono';
import type { Variables } from '../../../types';

const authApp = new Hono<{ Variables: Variables }>();

// Routes will be added by implementation tasks
// authApp.post('/magic-link/request', ...)

export { authApp };