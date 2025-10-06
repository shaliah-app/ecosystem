// User Profile Repository Port
// Defines the interface for accessing user profile data

import { UserProfile, UserProfileUpdate } from '../entities/user-profile'

export interface UserProfileRepository {
  getById(userId: string): Promise<UserProfile | null>
  update(userId: string, update: UserProfileUpdate): Promise<UserProfile | null>
  create(profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<UserProfile | null>
  delete(userId: string): Promise<boolean>
}