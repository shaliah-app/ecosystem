// Update User Profile Use Case
// Updates a user's profile information

import { UserProfileRepository } from '../domain/ports/user-profile-repository'
import { EventPublisher } from '../domain/ports/event-publisher'
import { UserProfile, UserProfileUpdate } from '../domain/entities/user-profile'
import { ProfileUpdatedEvent } from '../domain/events/profile-updated'

export interface UpdateUserProfileRequest {
  userId: string
  update: UserProfileUpdate
}

export interface UpdateUserProfileResponse {
  success: boolean
  profile: UserProfile | null
  error?: string
}

export class UpdateUserProfileUseCase {
  constructor(
    private readonly userProfileRepository: UserProfileRepository,
    private readonly eventPublisher: EventPublisher
  ) {}

  async execute(request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    try {
      // Get current profile for event
      const currentProfile = await this.userProfileRepository.getById(request.userId)
      if (!currentProfile) {
        return {
          success: false,
          profile: null,
          error: 'User profile not found'
        }
      }

      // Update the profile
      const updatedProfile = await this.userProfileRepository.update(request.userId, request.update)
      if (!updatedProfile) {
        return {
          success: false,
          profile: null,
          error: 'Failed to update profile'
        }
      }

      // Publish domain event
      const event = new ProfileUpdatedEvent(
        request.userId,
        new Date(),
        {
          language: currentProfile.language,
          fullName: currentProfile.fullName
        },
        {
          language: updatedProfile.language,
          fullName: updatedProfile.fullName
        }
      )

      await this.eventPublisher.publish(event)

      return {
        success: true,
        profile: updatedProfile
      }
    } catch (error) {
      return {
        success: false,
        profile: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Factory function for dependency injection
export function createUpdateUserProfileUseCase(
  userProfileRepository: UserProfileRepository,
  eventPublisher: EventPublisher
): UpdateUserProfileUseCase {
  return new UpdateUserProfileUseCase(userProfileRepository, eventPublisher)
}