/**
 * Unit Test: signOutAction
 *
 * Feature: 005-ezer-login
 * Application: shaliah-next
 * 
 * Purpose: Test the signOutAction directly to verify Telegram unlinking
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals'
import { userProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TEST_USER_1 as TEST_USER_ID } from './test-helpers'
import { setupTestDatabase, cleanupTestDatabase } from './test-database-setup'

// Mock the Supabase server client
const mockGetUser = jest.fn()
const mockSignOut = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
    },
  }),
}))

// Mock redirect to prevent actual navigation during tests
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

// Import after mocking - use dynamic import to ensure mocks are applied
let signOutAction: () => Promise<void>

describe('signOutAction - Unit Test', () => {
  let db: any

  beforeAll(async () => {
    // Import the action after mocks are set up
    const authActions = await import('@/lib/auth/actions')
    signOutAction = authActions.signOutAction
    
    // Set up test database with dependency injection
    db = await setupTestDatabase('sign-out')
  })

  afterAll(async () => {
    // Clean up test database and reset dependency injection
    await cleanupTestDatabase('sign-out')
  })

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Set up default mock responses
    mockGetUser.mockResolvedValue({
      data: { user: { id: TEST_USER_ID } },
      error: null,
    })
    mockSignOut.mockResolvedValue({ error: null })
  })

  afterEach(async () => {
    // Reset any telegram_user_id changes
    await db.update(userProfiles)
      .set({ telegramUserId: null })
      .where(eq(userProfiles.userId, TEST_USER_ID))
  })

  describe('Sign Out with Telegram Unlinking', () => {
    it('should unlink telegram account when user signs out', async () => {
      // Arrange - Set up linked Telegram account
      const telegramUserId = 123456789
      await db.update(userProfiles)
        .set({ telegramUserId })
        .where(eq(userProfiles.userId, TEST_USER_ID))

      // Verify initial state
      const profileBefore = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, TEST_USER_ID)
      })
      expect(profileBefore?.telegramUserId).toBe(telegramUserId)

      // Act
      await signOutAction()

      // Assert - Telegram account should be unlinked
      const profileAfter = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, TEST_USER_ID)
      })
      expect(profileAfter?.telegramUserId).toBeNull()

      // Assert - Supabase signOut should have been called
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should handle sign-out when account is not linked', async () => {
      // Arrange - Ensure account is not linked
      await db.update(userProfiles)
        .set({ telegramUserId: null })
        .where(eq(userProfiles.userId, TEST_USER_ID))

      // Act
      await signOutAction()

      // Assert - Should not error and still be null
      const profileAfter = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, TEST_USER_ID)
      })
      expect(profileAfter?.telegramUserId).toBeNull()

      // Assert - Supabase signOut should still be called
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should continue sign-out even if telegram unlinking fails', async () => {
      // Arrange - Set up linked account
      const telegramUserId = 987654321
      await db.update(userProfiles)
        .set({ telegramUserId })
        .where(eq(userProfiles.userId, TEST_USER_ID))

      // Mock database error on update (simulate connection failure)
      const originalUpdate = db.update
      const mockUpdate = jest.fn(() => {
        throw new Error('Database connection failed')
      })
      // Type assertion for the mock
      ;(db as any).update = mockUpdate

      // Act - Should not throw error
      await expect(signOutAction()).resolves.not.toThrow()

      // Assert - Supabase signOut should still be called
      expect(mockSignOut).toHaveBeenCalledTimes(1)

      // Clean up
      db.update = originalUpdate
    })

    it('should handle unauthenticated user gracefully', async () => {
      // Arrange - Mock no user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      // Act
      await signOutAction()

      // Assert - Should still call signOut
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })
  })
})