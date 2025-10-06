// Dependency Injection Composition Root
// This file serves as the central place for wiring dependencies
// Following the Dependency Inversion Principle

// User Module Imports
import { DrizzleUserProfileRepository } from '@/modules/user/adapters/drizzle-user-profile-repository'
import { EventBus } from '@/modules/user/adapters/event-bus'
import { createGetUserProfileUseCase, GetUserProfileUseCase } from '@/modules/user/use-cases/get-user-profile'
import { createUpdateUserProfileUseCase, UpdateUserProfileUseCase } from '@/modules/user/use-cases/update-user-profile'

// User Module Services
const userProfileRepository = new DrizzleUserProfileRepository()
const eventPublisher = new EventBus()

// Use Cases
export const getUserProfileUseCase: GetUserProfileUseCase = createGetUserProfileUseCase(
  userProfileRepository
)

export const updateUserProfileUseCase: UpdateUserProfileUseCase = createUpdateUserProfileUseCase(
  userProfileRepository,
  eventPublisher
)

// Export the composition root
export const di = {
  // User module
  userProfileRepository,
  eventPublisher,
  getUserProfileUseCase,
  updateUserProfileUseCase,
} as const

// Type-safe access to the DI container
export type DIContainer = typeof di