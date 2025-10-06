import { getTestDb, closeTestDb } from './test-db'
import { userProfiles } from '@/db/schema'
import { eq, or } from 'drizzle-orm'

// Test user IDs (valid UUID format)
export const TEST_USER_1 = '550e8400-e29b-41d4-a716-446655440000'
export const TEST_USER_2 = '550e8400-e29b-41d4-a716-446655440001'

export async function setupTestUsers() {
  // First clean up any existing test users
  await cleanupTestUsers()

  // Create fresh test users in user_profiles table
  // Note: These should reference existing auth.users records in Supabase
  // For local testing, we'll create them directly
  const db = getTestDb()

  try {
    await db.insert(userProfiles).values([
      {
        userId: TEST_USER_1,
        telegramUserId: null, // Start unlinked
      },
      {
        userId: TEST_USER_2,
        telegramUserId: null, // Start unlinked
      }
    ])
  } catch (error) {
    // If users already exist, ignore the error and continue
    // This handles race conditions between tests
    console.warn('Test users may already exist, continuing...', error)
  }
}

export async function cleanupTestUsers() {
  // Clean up test users
  const db = getTestDb()
  try {
    await db.delete(userProfiles).where(
      or(eq(userProfiles.userId, TEST_USER_1), eq(userProfiles.userId, TEST_USER_2))
    )
  } catch (error) {
    // Ignore errors during cleanup (users might not exist)
    console.warn('Error during test cleanup, continuing...', error)
  }
}

// Export function to properly close test database connections
export { closeTestDb }