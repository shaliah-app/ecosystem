// User Profile Domain Entity
// Represents a user's profile in the domain

export interface UserProfile {
  readonly id: string
  readonly fullName: string | null
  readonly avatarUrl: string | null
  readonly language: string
  readonly activeSpaceId: string | null
  readonly telegramUserId: number | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface UserProfileUpdate {
  readonly fullName?: string | null
  readonly avatarUrl?: string | null
  readonly language?: string
  readonly activeSpaceId?: string | null
  readonly telegramUserId?: number | null
}

// Factory function to create UserProfile from database data
export function createUserProfile(data: {
  id: string
  full_name: string | null
  avatar_url: string | null
  language: string
  active_space_id: string | null
  telegram_user_id: number | null
  created_at: string
  updated_at: string
}): UserProfile {
  return {
    id: data.id,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    language: data.language,
    activeSpaceId: data.active_space_id,
    telegramUserId: data.telegram_user_id,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }
}

// Factory function to create database update data from domain update
export function toDatabaseUpdate(update: UserProfileUpdate): {
  full_name?: string | null
  avatar_url?: string | null
  language?: string
  active_space_id?: string | null
  telegram_user_id?: number | null
} {
  return {
    full_name: update.fullName,
    avatar_url: update.avatarUrl,
    language: update.language,
    active_space_id: update.activeSpaceId,
    telegram_user_id: update.telegramUserId,
  }
}