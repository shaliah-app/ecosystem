import type { Context } from 'hono';
import type { Variables } from '../../../../types';
import { GetUserProfileUseCase, NotFoundError } from '../../application/use-cases/get-user-profile.use-case';
import { UserProfileRepository } from '../../infra/repositories/user-profile.repository';

const userProfileRepository = new UserProfileRepository();
const getUserProfileUseCase = new GetUserProfileUseCase(userProfileRepository);

export async function getProfileHandler(c: Context<{ Variables: Variables }>) {
  try {
    const userId = c.get('userId');

    if (!userId) {
      return c.json({ error: 'unauthorized', message: 'Authentication required' }, 401);
    }

    const profile = await getUserProfileUseCase.execute(userId);

    return c.json({ profile }, 200);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return c.json({ error: 'profile_not_found', message: 'User profile does not exist' }, 404);
    }

    console.error('Failed to get user profile:', error);
    return c.json({ error: 'server_error', message: 'Failed to fetch profile' }, 500);
  }
}