/**
 * @jest-environment node
 *
 * Integration Test: Generate token and verify database state
 *
 * Feature: 005-ezer-login
 * Application: shaliah-next
 * Status: FAILING (no implementation yet)
 *
 * Purpose: Test token generation API and verify database state changes
 * Tests that tokens are properly inserted and old tokens are invalidated
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { getTestDb } from './test-db'
import { authTokens, userProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { setupTestUsers, cleanupTestUsers, TEST_USER_1 as TEST_USER_ID } from './test-helpers'

const db = getTestDb()

describe('POST /api/ezer-auth/token - Integration Test', () => {
  beforeAll(async () => {
    // Set up test users in database
    await setupTestUsers()
  })

  afterAll(async () => {
    // Clean up test users
    await cleanupTestUsers()
  })

  beforeEach(async () => {
    // Clean up any existing test tokens
    await db.delete(authTokens).where(eq(authTokens.userId, TEST_USER_ID))
  })

  afterEach(async () => {
    // Clean up test tokens after each test
    await db.delete(authTokens).where(eq(authTokens.userId, TEST_USER_ID))
  })

  describe('Token Generation and Database State', () => {
    it('should insert new token into auth_tokens table with correct data', async () => {
      // Arrange
      const endpoint = '/api/ezer-auth/token'

      // Act - Generate token via API
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication cookie for test user
        },
      })

      // Assert - API should eventually return 200 (currently fails)
      expect(response.status).toBe(200) // Will fail until implementation exists

      const data = await response.json()
      const { token } = data

      // Verify token exists in database
      const dbToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, token)
      })

      expect(dbToken).toBeDefined()
      expect(dbToken?.token).toBe(token)
      expect(dbToken?.userId).toBe(TEST_USER_ID)
      expect(dbToken?.isActive).toBe(true)
      expect(dbToken?.usedAt).toBeNull()

      // Verify expiration is approximately 15 minutes from now
      const now = new Date()
      const expiresAt = new Date(dbToken!.expiresAt)
      const timeDiff = expiresAt.getTime() - now.getTime()
      const fifteenMinutes = 15 * 60 * 1000

      expect(timeDiff).toBeGreaterThan(fifteenMinutes - 1000) // Allow 1s tolerance
      expect(timeDiff).toBeLessThan(fifteenMinutes + 1000)
    })

    it('should mark previous active tokens as inactive when generating new token', async () => {
      // Arrange - Generate first token
      const endpoint = '/api/ezer-auth/token'

      const response1 = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication cookie
        },
      })

      expect(response1.status).toBe(200)
      const data1 = await response1.json()
      const firstToken = data1.token

      // Verify first token is active
      const firstDbToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, firstToken)
      })
      expect(firstDbToken?.isActive).toBe(true)

      // Act - Generate second token
      const response2 = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication cookie
        },
      })

      expect(response2.status).toBe(200)
      const data2 = await response2.json()
      const secondToken = data2.token

      // Assert - First token should be inactive
      const updatedFirstToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, firstToken)
      })
      expect(updatedFirstToken?.isActive).toBe(false)

      // Assert - Second token should be active
      const secondDbToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, secondToken)
      })
      expect(secondDbToken?.isActive).toBe(true)

      // Assert - Only one active token per user
      const activeTokens = await db.query.authTokens.findMany({
        where: and(
          eq(authTokens.userId, TEST_USER_ID),
          eq(authTokens.isActive, true),
          isNull(authTokens.usedAt)
        )
      })
      expect(activeTokens).toHaveLength(1)
      expect(activeTokens[0].token).toBe(secondToken)
    })

    it('should generate unique tokens on each call', async () => {
      // Arrange
      const endpoint = '/api/ezer-auth/token'
      const tokens = new Set<string>()

      // Act - Generate multiple tokens
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add authentication cookie
          },
        })

        expect(response.status).toBe(200)
        const data = await response.json()
        tokens.add(data.token)
      }

      // Assert - All tokens should be unique
      expect(tokens.size).toBe(5)

      // Verify all tokens exist in database
      for (const token of tokens) {
        const dbToken = await db.query.authTokens.findFirst({
          where: eq(authTokens.token, token)
        })
        expect(dbToken).toBeDefined()
        expect(dbToken?.userId).toBe(TEST_USER_ID)
      }
    })

    it('should set correct expiration timestamp', async () => {
      // Arrange
      const endpoint = '/api/ezer-auth/token'
      const beforeGeneration = new Date()

      // Act
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication cookie
        },
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      const afterGeneration = new Date()

      // Assert - Database expiration matches API response
      const dbToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, data.token)
      })

      expect(dbToken).toBeDefined()
      const dbExpiresAt = new Date(dbToken!.expiresAt)
      const apiExpiresAt = new Date(data.expiresAt)

      // Should be within 1 second of each other
      expect(Math.abs(dbExpiresAt.getTime() - apiExpiresAt.getTime())).toBeLessThan(1000)

      // Should be 15 minutes from generation time
      const generationTime = new Date((beforeGeneration.getTime() + afterGeneration.getTime()) / 2)
      const expectedExpiry = new Date(generationTime.getTime() + 15 * 60 * 1000)
      const actualExpiry = dbExpiresAt

      expect(Math.abs(actualExpiry.getTime() - expectedExpiry.getTime())).toBeLessThan(2000) // 2s tolerance
    })
  })

  describe('Database Constraints', () => {
    it('should enforce unique token constraint', async () => {
      // This test verifies the database schema constraint
      // If implementation tries to insert duplicate token, it should fail

      // Arrange - Manually insert a token
      const testToken = 'duplicate12345678901234567890123456'
      await db.insert(authTokens).values({
        token: testToken,
        userId: TEST_USER_ID,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      })

      // Act & Assert - Attempting to insert same token should fail
      await expect(
        db.insert(authTokens).values({
          token: testToken, // Same token
          userId: 'different-user-id',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        })
      ).rejects.toThrow() // Should throw unique constraint violation
    })

    it('should enforce foreign key constraint to auth.users', async () => {
      // Arrange - Try to insert token for non-existent user
      const invalidUserId = 'non-existent-user-uuid'

      // Act & Assert
      await expect(
        db.insert(authTokens).values({
          token: 'test12345678901234567890123456789012',
          userId: invalidUserId, // Doesn't exist in auth.users
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        })
      ).rejects.toThrow() // Should throw foreign key constraint violation
    })
  })

  describe('Audit Trail Preservation', () => {
    it('should preserve inactive tokens for audit trail', async () => {
      // Arrange - Generate and then invalidate a token
      const endpoint = '/api/ezer-auth/token'

      // Generate first token
      const response1 = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication cookie
        },
      })

      expect(response1.status).toBe(200)
      const data1 = await response1.json()
      const firstToken = data1.token

      // Generate second token (invalidates first)
      const response2 = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication cookie
        },
      })

      expect(response2.status).toBe(200)

      // Assert - First token still exists but is inactive
      const oldToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, firstToken)
      })

      expect(oldToken).toBeDefined()
      expect(oldToken?.isActive).toBe(false)
      expect(oldToken?.usedAt).toBeNull() // Not used, just invalidated
    })
  })
})

/**
 * TODO: Complete test setup after implementation exists:
 *
 * 1. Set up test user authentication:
 *    - Create test user in Supabase auth
 *    - Generate valid session cookie for tests
 *    - Clean up test user after tests
 *
 * 2. Database cleanup:
 *    - Ensure test isolation (separate test database or schema)
 *    - Clean up all test data between runs
 *
 * 3. Environment setup:
 *    - Ensure DATABASE_URL points to test database
 *    - Set up Next.js test server for API calls
 *
 * 4. Test helpers:
 *    - Helper function to generate authenticated requests
 *    - Helper function to clean up test tokens
 *    - Helper function to verify token state
 */