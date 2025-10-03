import { UserProfileRepository } from '../../infra/repositories/user-profile.repository';
import { profileUpdateSchema, type SupportedLanguage } from '../../domain/validation/profile-validation';
import { UserProfileDTO, NotFoundError } from './get-user-profile.use-case';
import { UserProfile } from '../../domain/entities/user-profile';

export interface UpdateUserProfileInput {
  full_name?: string;
  avatar_url?: string | null;
  language?: SupportedLanguage;
}

export class ValidationError extends Error {
  constructor(message: string, public readonly details?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UpdateUserProfileUseCase {
  constructor(private readonly userProfileRepository: UserProfileRepository) {}

  async execute(userId: string, input: UpdateUserProfileInput): Promise<UserProfileDTO> {
    // Validate input
    const validationResult = profileUpdateSchema.safeParse(input);
    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        details[path] = issue.message;
      });
      throw new ValidationError('Invalid input', details);
    }

    // Load existing profile
    const existingProfile = await this.userProfileRepository.findById(userId);
    if (!existingProfile) {
      throw new NotFoundError('User profile not found');
    }

    // Apply updates
    const updatedProfile = new UserProfile(
      existingProfile.id,
      existingProfile.fullName,
      existingProfile.avatarUrl,
      existingProfile.language,
      existingProfile.telegramUserId,
      existingProfile.activeSpaceId,
      existingProfile.createdAt,
      existingProfile.updatedAt
    );

    if (input.full_name !== undefined) {
      updatedProfile.updateFullName(input.full_name);
    }

    if (input.avatar_url !== undefined) {
      // For avatar_url, null is allowed to clear it
      updatedProfile.avatarUrl = input.avatar_url;
      updatedProfile.updatedAt = new Date();
    }

    if (input.language !== undefined) {
      updatedProfile.updateLanguage(input.language);
    }

    // Save updated profile
    const savedProfile = await this.userProfileRepository.update(updatedProfile);

    return {
      id: savedProfile.id,
      full_name: savedProfile.fullName ?? null,
      avatar_url: savedProfile.avatarUrl ?? null,
      language: savedProfile.language,
      telegram_user_id: savedProfile.telegramUserId ?? null,
      active_space_id: savedProfile.activeSpaceId ?? null,
      created_at: savedProfile.createdAt.toISOString(),
      updated_at: savedProfile.updatedAt.toISOString(),
    };
  }
}