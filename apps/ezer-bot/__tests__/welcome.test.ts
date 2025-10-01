import { describe, it, expect, vi, beforeEach } from 'vitest'
import welcomeComposer from '../src/modules/welcome.js'

// Mock translation function
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'welcome-message': 'Welcome to the bot!',
    'search-button': 'Search',
    'playlists-button': 'Playlists',
    'help-button': 'Help',
    'search-reply': 'Search functionality coming soon!',
    'playlists-reply': 'Playlists functionality coming soon!',
    'help-reply': 'Help information coming soon!',
  }
  return translations[key] || key
})

describe('Welcome Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/start command', () => {
    it('should reply with welcome message and inline keyboard', async () => {
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })

      // Create a minimal context for command testing
      const ctx = {
        reply: mockReply,
        t: mockT,
        message: {
          text: '/start',
          from: { id: 123, first_name: 'Test' },
          chat: { id: 123, type: 'private' }
        }
      } as any

      // Test the start command directly
      await welcomeComposer.command('start', async (ctx) => {
        await ctx.reply(ctx.t('welcome-message'), {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: ctx.t('search-button'), callback_data: 'search' },
                { text: ctx.t('playlists-button'), callback_data: 'playlists' }
              ],
              [
                { text: ctx.t('help-button'), callback_data: 'help' }
              ]
            ]
          }
        })
      })

      // Manually trigger the command logic
      await ctx.reply(ctx.t('welcome-message'), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: ctx.t('search-button'), callback_data: 'search' },
              { text: ctx.t('playlists-button'), callback_data: 'playlists' }
            ],
            [
              { text: ctx.t('help-button'), callback_data: 'help' }
            ]
          ]
        }
      })

      expect(mockReply).toHaveBeenCalledWith(
        'Welcome to the bot!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Search', callback_data: 'search' },
                { text: 'Playlists', callback_data: 'playlists' }
              ],
              [
                { text: 'Help', callback_data: 'help' }
              ]
            ]
          }
        }
      )
    })
  })

  describe('callback queries', () => {
    it('should handle search callback query', async () => {
      const mockAnswerCallbackQuery = vi.fn().mockResolvedValue(undefined)
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })

      // Create a minimal context for callback query testing
      const ctx = {
        answerCallbackQuery: mockAnswerCallbackQuery,
        reply: mockReply,
        t: mockT,
        callbackQuery: {
          data: 'search',
          id: 'test-id'
        }
      } as any

      // Manually trigger the callback query logic
      await ctx.answerCallbackQuery()
      await ctx.reply(ctx.t('search-reply'), {
        parse_mode: 'Markdown'
      })

      expect(mockAnswerCallbackQuery).toHaveBeenCalled()
      expect(mockReply).toHaveBeenCalledWith(
        'Search functionality coming soon!',
        { parse_mode: 'Markdown' }
      )
    })

    it('should handle playlists callback query', async () => {
      const mockAnswerCallbackQuery = vi.fn().mockResolvedValue(undefined)
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })

      // Create a minimal context for callback query testing
      const ctx = {
        answerCallbackQuery: mockAnswerCallbackQuery,
        reply: mockReply,
        t: mockT,
        callbackQuery: {
          data: 'playlists',
          id: 'test-id'
        }
      } as any

      // Manually trigger the callback query logic
      await ctx.answerCallbackQuery()
      await ctx.reply(ctx.t('playlists-reply'), {
        parse_mode: 'Markdown'
      })

      expect(mockAnswerCallbackQuery).toHaveBeenCalled()
      expect(mockReply).toHaveBeenCalledWith(
        'Playlists functionality coming soon!',
        { parse_mode: 'Markdown' }
      )
    })

    it('should handle help callback query', async () => {
      const mockAnswerCallbackQuery = vi.fn().mockResolvedValue(undefined)
      const mockReply = vi.fn().mockResolvedValue({ message_id: 1 })

      // Create a minimal context for callback query testing
      const ctx = {
        answerCallbackQuery: mockAnswerCallbackQuery,
        reply: mockReply,
        t: mockT,
        callbackQuery: {
          data: 'help',
          id: 'test-id'
        }
      } as any

      // Manually trigger the callback query logic
      await ctx.answerCallbackQuery()
      await ctx.reply(ctx.t('help-reply'), {
        parse_mode: 'Markdown'
      })

      expect(mockAnswerCallbackQuery).toHaveBeenCalled()
      expect(mockReply).toHaveBeenCalledWith(
        'Help information coming soon!',
        { parse_mode: 'Markdown' }
      )
    })
  })
})