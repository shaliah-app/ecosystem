'use server'

import { getUserProfile, createUserProfile } from '@/lib/supabase/database'

export async function checkAndCreateProfile(userId: string, userMetadata: any) {
  // Check if profile exists
  let profile = await getUserProfile(userId)

  if (!profile) {
    console.warn('Profile not found for user, creating one:', userId)
    
    const profileData = {
      userId: userId,
      fullName: userMetadata.full_name || null,
      avatarUrl: userMetadata.avatar_url || null,
      language: 'pt-BR', // Default language
    }

    profile = await createUserProfile(profileData)
    
    if (!profile) {
      console.error('Failed to create profile for user:', userId)
      return { error: 'Account setup incomplete. Please contact support or try signing in again.' }
    }
  }

  return { profile }
}