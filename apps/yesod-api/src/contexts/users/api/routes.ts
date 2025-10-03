import { Hono } from 'hono';
import type { Variables } from '../../../types';

const usersApp = new Hono<{ Variables: Variables }>();

// Routes will be added by implementation tasks
// usersApp.get('/profile', ...)
// usersApp.patch('/profile', ...)

export { usersApp };