import { Hono } from 'hono';
import type { Variables } from '../../../types';
import { magicLinkRequestHandler } from './handlers/magic-link-request.handler';

const authApp = new Hono<{ Variables: Variables }>();

// Routes will be added by implementation tasks
authApp.post('/magic-link/request', magicLinkRequestHandler);

export { authApp };