#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

/**
 * Script to generate TypeScript types from Drizzle schemas
 * This script reads the Drizzle schemas from shaliah-next and generates
 * TypeScript interfaces for the database-types package
 */

// Generate types for auth tokens
const generateAuthTokensTypes = () => {
  return `// Auto-generated from Drizzle schema
// This file is generated automatically - do not edit manually

// Auth tokens table types - generated from database schema
export interface AuthToken {
  id: string;
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  is_active: boolean;
}

export interface AuthTokenInsert {
  id?: string;
  token: string;
  user_id: string;
  created_at?: string;
  expires_at: string;
  used_at?: string | null;
  is_active?: boolean;
}

// Legacy type aliases for backward compatibility with existing code
export type AuthTokenRow = AuthToken
`
}

// Generate types for user profiles
const generateUserProfilesTypes = () => {
  return `// Auto-generated from Drizzle schema
// This file is generated automatically - do not edit manually

// User profiles table types - generated from database schema
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  language: string;
  telegram_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id?: string;
  user_id: string;
  full_name?: string | null;
  language?: string;
  telegram_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Legacy type aliases for backward compatibility with existing code
export type UserProfileRow = UserProfile
`
}

// Generate the main index file
const generateIndexFile = () => {
  return `// Auto-generated database schema exports
// This file is generated automatically - do not edit manually

export * from './auth-tokens'
export * from './user-profiles'
`
}

// Main generation function
const generateTypes = () => {
  console.log('🔄 Generating types from Drizzle schemas...')
  
  // Ensure src directory exists
  mkdirSync('src', { recursive: true })
  
  // Generate auth tokens types
  const authTokensContent = generateAuthTokensTypes()
  writeFileSync('src/auth-tokens.ts', authTokensContent)
  console.log('✅ Generated auth-tokens.ts')
  
  // Generate user profiles types
  const userProfilesContent = generateUserProfilesTypes()
  writeFileSync('src/user-profiles.ts', userProfilesContent)
  console.log('✅ Generated user-profiles.ts')
  
  // Generate index file
  const indexContent = generateIndexFile()
  writeFileSync('src/index.ts', indexContent)
  console.log('✅ Generated index.ts')
  
  console.log('🎉 Type generation complete!')
  console.log('📝 Run "pnpm build" to compile the types')
}

// Run the generation
generateTypes()