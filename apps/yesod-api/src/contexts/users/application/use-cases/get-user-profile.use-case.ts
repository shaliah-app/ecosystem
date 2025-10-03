import { UserProfileRepository } from '../../infra/repositories/user-profile.repository';

export interface UserProfileDTO {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  language: string;
  telegram_user_id: number | null;
  active_space_id: string | null;
  created_at: string;
  updated_at: string;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class GetUserProfileUseCase {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(userId: string): Promise<UserProfileDTO> {
    const profile = await this.userProfileRepository.findById(userId);

    if (!profile) {
      throw new NotFoundError('User profile not found');
    }

    return {
      id: profile.id,
      full_name: profile.fullName ?? null,
      avatar_url: profile.avatarUrl ?? null,
      language: profile.language,
      telegram_user_id: profile.telegramUserId ?? null,
      active_space_id: profile.activeSpaceId ?? null,
      created_at: profile.createdAt.toISOString(),
      updated_at: profile.updatedAt.toISOString(),
    };
  }
}