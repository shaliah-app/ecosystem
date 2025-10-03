import { Hono } from 'hono';
import type { Variables } from '../../../types';
import { authMiddleware } from '../../../middleware/auth';
import { getProfileHandler } from './handlers/get-profile.handler';
import { updateProfileHandler } from './handlers/update-profile.handler';

const usersApp = new Hono<{ Variables: Variables }>();

// Profile routes
usersApp.get('/profile', authMiddleware, getProfileHandler);
usersApp.patch('/profile', authMiddleware, updateProfileHandler);

export { usersApp };