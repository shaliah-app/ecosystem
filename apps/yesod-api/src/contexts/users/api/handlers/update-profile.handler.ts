import type { Context } from 'hono';
import type { Variables } from '../../../../types';
import { UpdateUserProfileUseCase, ValidationError, type UpdateUserProfileInput } from '../../application/use-cases/update-user-profile.use-case';
import { UserProfileRepository } from '../../infra/repositories/user-profile.repository';

const userProfileRepository = new UserProfileRepository();
const updateUserProfileUseCase = new UpdateUserProfileUseCase(userProfileRepository);

export async function updateProfileHandler(c: Context<{ Variables: Variables }>) {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401);
    }

    const body: UpdateUserProfileInput = await c.req.json();

    const profile = await updateUserProfileUseCase.execute(userId, body);

    // Note: Locale cookie setting is handled by the frontend
    // after receiving the successful response

    return c.json({ success: true, profile }, 200);
  } catch (error) {
    if (error instanceof ValidationError) {
      return c.json({
        error: 'validation_error',
        message: 'Invalid input',
        details: error.details
      }, 400);
    }

    console.error('Failed to update user profile:', error);
    return c.json({ error: 'server_error', message: 'Failed to update profile' }, 500);
  }
}