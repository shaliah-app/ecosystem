// Get User Profile Use Case
// Retrieves a user's profile information

import { UserProfileRepository } from '../domain/ports/user-profile-repository'
import { UserProfile } from '../domain/entities/user-profile'

export interface GetUserProfileRequest {
  userId: string
}

export interface GetUserProfileResponse {
  profile: UserProfile | null
}

export class GetUserProfileUseCase {
  constructor(
    private readonly userProfileRepository: UserProfileRepository
  ) {}

  async execute(request: GetUserProfileRequest): Promise<GetUserProfileResponse> {
    const profile = await this.userProfileRepository.getById(request.userId)

    return {
      profile
    }
  }
}

// Factory function for dependency injection
export function createGetUserProfileUseCase(
  userProfileRepository: UserProfileRepository
): GetUserProfileUseCase {
  return new GetUserProfileUseCase(userProfileRepository)
}