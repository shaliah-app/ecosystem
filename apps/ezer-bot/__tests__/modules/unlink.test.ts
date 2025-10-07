import { describe, it, expect, vi, beforeEach } from 'vitest'
import unlinkComposer from '../../src/modules/unlink.js'

// Mock the dependencies
vi.mock('../../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

vi.mock('../../src/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}))

vi.mock('../../src/lib/env.js', () => ({
  env: {
    shaliah: {
      baseUrl: 'https://shaliah.app'
    }
  }
}))

const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'unlink-success': 'Account unlinked successfully!',
    'unlink-error-not-linked': 'Account not linked',
    'unlink-error-no-user': 'Unable to identify user',
    'unlink-error-generic': 'Unlink failed',
    'link-account-button': 'Link Account',
    'unlink-cancelled': 'Unlink cancelled'
  }
  return translations[key] || key
})

describe('Unlink Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/unlink command', () => {
    it('should handle unlink command successfully', async () => {
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })
      const mockSupabase = await import('../../src/lib/supabase.js')
      
      // Mock successful profile fetch and unlink
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user123', user_id: 'shaliah123', telegram_user_id: 123456 },
              error: null
            })
          }))
        }))
      }))
      
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))

      mockSupabase.supabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockFrom })
        .mockReturnValueOnce({ update: mockUpdate })

      const ctx = {
        reply: mockReply,
        t: mockT,
        from: { id: 123456 },
        session: { isLinked: true, shaliahUserId: 'shaliah123' }
      } as any

      // Manually trigger the command handler
      const commandHandler = unlinkComposer.handlers.find(h => h.trigger === 'command:unlink')
      if (commandHandler) {
        await commandHandler.handler(ctx)
      }

      expect(mockReply).toHaveBeenCalledWith(
        'Account unlinked successfully!',
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: 'Link Account',
                  url: 'https://shaliah.app/profile'
                })
              ])
            ])
          })
        })
      )
    })

    it('should handle case when user is not linked', async () => {
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })
      const mockSupabase = await import('../../src/lib/supabase.js')
      
      // Mock no profile found
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }))
        }))
      }))

      mockSupabase.supabase.from = vi.fn().mockReturnValue({ select: mockFrom })

      const ctx = {
        reply: mockReply,
        t: mockT,
        from: { id: 123456 },
        session: {}
      } as any

      // Manually trigger the command handler
      const commandHandler = unlinkComposer.handlers.find(h => h.trigger === 'command:unlink')
      if (commandHandler) {
        await commandHandler.handler(ctx)
      }

      expect(mockReply).toHaveBeenCalledWith('Account not linked')
    })

    it('should handle case when user ID is missing', async () => {
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })

      const ctx = {
        reply: mockReply,
        t: mockT,
        from: undefined,
        session: {}
      } as any

      // Manually trigger the command handler
      const commandHandler = unlinkComposer.handlers.find(h => h.trigger === 'command:unlink')
      if (commandHandler) {
        await commandHandler.handler(ctx)
      }

      expect(mockReply).toHaveBeenCalledWith('Unable to identify user')
    })
  })

  describe('callback queries', () => {
    it('should handle confirm-unlink callback successfully', async () => {
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })
      const mockAnswerCallbackQuery = vi.fn().mockResolvedValue(undefined)
      const mockSupabase = await import('../../src/lib/supabase.js')
      
      // Mock successful profile fetch and unlink
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'user123', user_id: 'shaliah123', telegram_user_id: 123456 },
              error: null
            })
          }))
        }))
      }))
      
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))

      mockSupabase.supabase.from = vi.fn()
        .mockReturnValueOnce({ select: mockFrom })
        .mockReturnValueOnce({ update: mockUpdate })

      const ctx = {
        reply: mockReply,
        answerCallbackQuery: mockAnswerCallbackQuery,
        t: mockT,
        from: { id: 123456 },
        session: { isLinked: true, shaliahUserId: 'shaliah123' }
      } as any

      // Manually trigger the callback handler
      const callbackHandler = unlinkComposer.handlers.find(h => h.trigger === 'callback_query:confirm-unlink')
      if (callbackHandler) {
        await callbackHandler.handler(ctx)
      }

      expect(mockAnswerCallbackQuery).toHaveBeenCalled()
      expect(mockReply).toHaveBeenCalledWith(
        'Account unlinked successfully!',
        expect.objectContaining({
          parse_mode: 'Markdown',
          reply_markup: expect.objectContaining({
            inline_keyboard: expect.arrayContaining([
              expect.arrayContaining([
                expect.objectContaining({
                  text: 'Link Account',
                  url: 'https://shaliah.app/profile'
                })
              ])
            ])
          })
        })
      )
    })

    it('should handle cancel-unlink callback', async () => {
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })
      const mockAnswerCallbackQuery = vi.fn().mockResolvedValue(undefined)

      const ctx = {
        reply: mockReply,
        answerCallbackQuery: mockAnswerCallbackQuery,
        t: mockT,
        from: { id: 123456 },
        session: {}
      } as any

      // Manually trigger the callback handler
      const callbackHandler = unlinkComposer.handlers.find(h => h.trigger === 'callback_query:cancel-unlink')
      if (callbackHandler) {
        await callbackHandler.handler(ctx)
      }

      expect(mockAnswerCallbackQuery).toHaveBeenCalled()
      expect(mockReply).toHaveBeenCalledWith('Unlink cancelled')
    })
  })
})
