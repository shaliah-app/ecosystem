/**
 * Integration Test: Bot links account successfully
 *
 * Feature: 005-ezer-login
 * Application: ezer-bot
 * Status: FAILING (no implementation yet)
 *
 * Purpose: Test successful account linking flow in bot
 * Tests database updates and message sending when valid token is used
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Bot } from 'grammy'
import type { BotContext } from '../../src/types/context'
import { db } from '../../src/supabase' // Assuming this is the database client
import { authTokens, userProfiles } from '../../src/db/schema' // Assuming schema is shared
import { eq, and, isNull } from 'drizzle-orm'

// Mock context factory for testing
function createMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: {
      id: 123456789,
      first_name: 'João',
      username: 'joaosilva',
      language_code: 'pt',
      is_bot: false,
    },
    match: '', // Token will be set in individual tests
    reply: vi.fn().mockResolvedValue({ message_id: 1 }),
    t: vi.fn((key: string) => key), // Mock translation function
    i18n: {
      locale: vi.fn(),
    },
    session: {},
    ...overrides,
  } as unknown as BotContext
}

// Mock database client
vi.mock('../../src/supabase', () => ({
  db: {
    query: {
      authTokens: {
        findFirst: vi.fn(),
      },
      userProfiles: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
    update: vi.fn(),
    transaction: vi.fn(),
  },
}))

const mockDb = db as any

describe('Bot Account Linking - Integration Test', () => {
  let mockAuthLinkComposer: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock successful database operations
    mockDb.transaction.mockImplementation(async (callback: any) => {
      return callback(mockDb)
    })

    // TODO: Import and mock the actual auth-link composer
    // mockAuthLinkComposer = (await import('../../src/modules/auth-link')).authLinkComposer
  })

  afterEach(async () => {
    // TODO: Clean up test data in database
  })

  describe('Successful Account Linking', () => {
    it('should link Telegram account and mark token as used', async () => {
      // Arrange
      const validToken = 'success12345678901234567890123456789012'
      const userId = 'test-user-uuid'
      const telegramId = 123456789

      const ctx = createMockContext({
        match: validToken,
        from: { id: telegramId, first_name: 'João', language_code: 'pt', is_bot: false },
      })

      // Mock valid token in database
      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: userId,
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })

      // Mock no existing Telegram link
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)

      // Mock successful updates
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call the auth-link composer handler
      // await mockAuthLinkComposer.middleware()(ctx, vi.fn())

      // Assert
      expect(ctx.reply).toHaveBeenCalledOnce()

      const replyMessage = (ctx.reply as any).mock.calls[0][0]
      expect(replyMessage).toContain('✅')
      expect(replyMessage).toContain('Conta vinculada com sucesso')

      // Verify database transaction was called
      expect(mockDb.transaction).toHaveBeenCalledOnce()

      // Verify user profile was updated
      expect(mockDb.update).toHaveBeenCalledWith(
        userProfiles,
        { telegramUserId: telegramId },
        { userId: userId }
      )

      // Verify token was marked as used
      expect(mockDb.update).toHaveBeenCalledWith(
        authTokens,
        { usedAt: expect.any(Date) },
        { id: 'token-uuid' }
      )
    })

    it('should send success message in Portuguese for pt-BR user', async () => {
      // Arrange
      const validToken = 'ptsuccess12345678901234567890123456789012'
      const ctx = createMockContext({
        match: validToken,
        from: { id: 123456789, first_name: 'João', language_code: 'pt', is_bot: false },
      })

      // Mock database
      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Conta vinculada com sucesso')
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Telegram agora está conectado')
      )
    })

    it('should send success message in English for en-US user', async () => {
      // Arrange
      const validToken = 'ensuccess12345678901234567890123456789012'
      const ctx = createMockContext({
        match: validToken,
        from: { id: 987654321, first_name: 'John', language_code: 'en', is_bot: false },
      })

      // Mock database
      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Account linked successfully')
      )
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Your Telegram is now connected')
      )
    })

    it('should sync bot language to match Shaliah profile', async () => {
      // Arrange
      const validToken = 'langsync12345678901234567890123456789012'
      const ctx = createMockContext({
        match: validToken,
        from: { id: 123456789, first_name: 'João', language_code: 'pt', is_bot: false },
      })

      // Mock database - user has pt-BR language preference
      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst
        .mockResolvedValueOnce(null) // Collision check
        .mockResolvedValueOnce({
          id: 'profile-uuid',
          userId: 'user-uuid',
          language: 'pt-BR',
        })
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      expect(ctx.i18n.locale).toHaveBeenCalledWith('pt') // Mapped to Telegram locale
    })

    it('should handle language mapping correctly', async () => {
      // Test various language mappings
      const testCases = [
        { shaliahLang: 'pt-BR', telegramLang: 'pt' },
        { shaliahLang: 'en-US', telegramLang: 'en' },
        { shaliahLang: 'fr-FR', telegramLang: 'en' }, // Fallback
        { shaliahLang: null, telegramLang: 'en' }, // Default
      ]

      for (const { shaliahLang, telegramLang } of testCases) {
        // Arrange
        const token = `lang${shaliahLang}12345678901234567890123456789012`
        const ctx = createMockContext({ match: token })

        mockDb.query.authTokens.findFirst.mockResolvedValue({
          id: 'token-uuid',
          token: token,
          userId: 'user-uuid',
          isActive: true,
          usedAt: null,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        })
        mockDb.query.userProfiles.findFirst
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'profile-uuid',
            userId: 'user-uuid',
            language: shaliahLang,
          })
        mockDb.update.mockResolvedValue({})

        // Act
        // TODO: Call auth-link handler

        // Assert
        expect(ctx.i18n.locale).toHaveBeenCalledWith(telegramLang)
      }
    })
  })

  describe('Database State Verification', () => {
    it('should update user_profiles with correct telegram_user_id', async () => {
      // Arrange
      const validToken = 'dbtest12345678901234567890123456789012'
      const userId = 'test-user-uuid'
      const telegramId = 555666777

      const ctx = createMockContext({
        match: validToken,
        from: { id: telegramId, first_name: 'Test', language_code: 'en', is_bot: false },
      })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: userId,
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(
        userProfiles,
        { telegramUserId: telegramId },
        { userId: userId }
      )
    })

    it('should mark token as used with current timestamp', async () => {
      // Arrange
      const validToken = 'usetest12345678901234567890123456789012'
      const tokenId = 'test-token-uuid'
      const beforeCall = new Date()

      const ctx = createMockContext({ match: validToken })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: tokenId,
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler
      const afterCall = new Date()

      // Assert
      expect(mockDb.update).toHaveBeenCalledWith(
        authTokens,
        { usedAt: expect.any(Date) },
        { id: tokenId }
      )

      const usedAtCall = (mockDb.update as any).mock.calls.find(
        (call: any) => call[0] === authTokens && call[1].usedAt
      )
      const usedAt = usedAtCall[1].usedAt

      expect(usedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
      expect(usedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime())
    })

    it('should perform both updates in a single transaction', async () => {
      // Arrange
      const validToken = 'txn12345678901234567890123456789012'
      const ctx = createMockContext({ match: validToken })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      expect(mockDb.transaction).toHaveBeenCalledOnce()

      // Verify transaction callback was called
      const transactionCallback = mockDb.transaction.mock.calls[0][0]
      expect(typeof transactionCallback).toBe('function')
    })
  })

  describe('Bot Session Updates', () => {
    it('should update bot session after successful linking', async () => {
      // Arrange
      const validToken = 'session12345678901234567890123456789012'
      const ctx = createMockContext({
        match: validToken,
        session: {}, // Start with empty session
      })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      // TODO: Verify session updates
      // expect(ctx.session.isLinked).toBe(true)
      // expect(ctx.session.shaliahUserId).toBe('user-uuid')
    })
  })

  describe('Edge Cases', () => {
    it('should handle token with special characters in database', async () => {
      // Arrange - Token that might cause SQL injection or encoding issues
      const specialToken = 'special!@#$%^&*()1234567890123456789012'
      const ctx = createMockContext({ match: specialToken })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: specialToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('vinculada com sucesso')
      )
    })

    it('should handle very long Telegram first names', async () => {
      // Arrange
      const longName = 'A'.repeat(100) // Very long name
      const ctx = createMockContext({
        match: 'longname12345678901234567890123456789012',
        from: { id: 123456789, first_name: longName, language_code: 'pt', is_bot: false },
      })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: 'longname12345678901234567890123456789012',
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      // TODO: Call auth-link handler

      // Assert - Should succeed regardless of name length
      expect(ctx.reply).toHaveBeenCalledWith(
        expect.stringContaining('vinculada com sucesso')
      )
    })
  })

  describe('Performance', () => {
    it('should complete linking within 500ms', async () => {
      // Arrange
      const validToken = 'perf12345678901234567890123456789012'
      const ctx = createMockContext({ match: validToken })

      mockDb.query.authTokens.findFirst.mockResolvedValue({
        id: 'token-uuid',
        token: validToken,
        userId: 'user-uuid',
        isActive: true,
        usedAt: null,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      mockDb.query.userProfiles.findFirst.mockResolvedValue(null)
      mockDb.update.mockResolvedValue({})

      // Act
      const startTime = Date.now()
      // TODO: Call auth-link handler
      const endTime = Date.now()

      // Assert
      const duration = endTime - startTime
      expect(duration).toBeLessThan(500) // Contract target
    })
  })
})

/**
 * TODO: Complete test implementation after auth-link composer exists:
 *
 * 1. Import actual composer:
 *    - Import authLinkComposer from '../../src/modules/auth-link'
 *    - Call its middleware with proper context
 *
 * 2. Real database testing:
 *    - Set up test database with real data
 *    - Verify actual database state changes
 *    - Clean up test data properly
 *
 * 3. Session verification:
 *    - Test that ctx.session is updated correctly
 *    - Verify session persistence across commands
 *
 * 4. Fluent i18n testing:
 *    - Test actual translation keys from .ftl files
 *    - Verify language switching works
 *
 * 5. Error handling:
 *    - Test transaction rollback on partial failures
 *    - Test concurrent linking attempts
 */