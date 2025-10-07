/**
 * Unit Test: generateAuthTokenUseCase
 *
 * Feature: 005-ezer-login
 * Application: shaliah-next
 * 
 * Purpose: Test the generateAuthTokenUseCase directly without API layer
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import { authTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { TEST_USER_1 as TEST_USER_ID } from '../../../__tests__/integration/test-helpers'
import { setupTestDatabase, cleanupTestDatabase } from '../../../__tests__/integration/test-database-setup'

describe('generateAuthTokenUseCase - Unit Test', () => {
  let db: any

  beforeAll(async () => {
    // Import the use case after mocks are set up
    const generateTokenModule = await import('@/modules/ezer-auth/use-cases/generate-token')
    generateAuthTokenUseCase = generateTokenModule.generateAuthTokenUseCase
    
    // Set up test database with dependency injection
    db = await setupTestDatabase('generate-token')
  })

  afterAll(async () => {
    // Clean up test database and reset dependency injection
    await cleanupTestDatabase('generate-token')
  })

  beforeEach(async () => {
    // Clean up any existing test tokens
    await db.delete(authTokens).where(eq(authTokens.userId, TEST_USER_ID))
  })

  afterEach(async () => {
    // Clean up test tokens after each test
    await db.delete(authTokens).where(eq(authTokens.userId, TEST_USER_ID))
  })

  describe('Token Generation', () => {
    it('should generate token and insert into database', async () => {
      // Act
      const result = await generateAuthTokenUseCase(TEST_USER_ID)

      // Assert - Check return values
      expect(result.token).toBeDefined()
      expect(result.token).toHaveLength(32)
      expect(result.expiresAt).toBeDefined()
      expect(result.deepLink).toContain('https://t.me/')
      expect(result.deepLink).toContain(result.token)

      // Assert - Check database state
      const tokenInDb = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, result.token)
      })

      expect(tokenInDb).toBeDefined()
      expect(tokenInDb?.userId).toBe(TEST_USER_ID)
      expect(tokenInDb?.isActive).toBe(true)
      expect(tokenInDb?.usedAt).toBeNull()
    })

    it('should invalidate old tokens when generating new one', async () => {
      // Arrange - Create existing token
      const firstResult = await generateAuthTokenUseCase(TEST_USER_ID)

      // Act - Generate second token
      const secondResult = await generateAuthTokenUseCase(TEST_USER_ID)

      // Assert - Check both tokens exist in database
      const firstToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, firstResult.token)
      })
      const secondToken = await db.query.authTokens.findFirst({
        where: eq(authTokens.token, secondResult.token)
      })

      expect(firstToken).toBeDefined()
      expect(secondToken).toBeDefined()

      // Assert - First token should be inactive, second should be active
      expect(firstToken?.isActive).toBe(false) // Invalidated
      expect(secondToken?.isActive).toBe(true)  // Current active token
    })

    it('should set expiration 15 minutes in future', async () => {
      // Arrange
      const beforeCall = new Date()

      // Act
      const result = await generateAuthTokenUseCase(TEST_USER_ID)

      // Assert
      const afterCall = new Date()
      const expectedMinExpiration = new Date(beforeCall.getTime() + 14 * 60 * 1000) // 14 min
      const expectedMaxExpiration = new Date(afterCall.getTime() + 16 * 60 * 1000)   // 16 min

      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.expiresAt.getTime()).toBeGreaterThan(expectedMinExpiration.getTime())
      expect(result.expiresAt.getTime()).toBeLessThan(expectedMaxExpiration.getTime())
    })
  })
})