import { Update } from '@grammyjs/types'
import { beforeAll, beforeEach, expect, test, vi } from 'vitest'
import { bot } from '../../src/bot.js'

// Mock Supabase
vi.mock('../../src/lib/supabase.js', () => ({
  supabase: {
    from: vi.fn()
  }
}))

// Mock logger
vi.mock('../../src/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock env
vi.mock('../../src/lib/env.js', () => ({
  env: {
    shaliah: {
      baseUrl: 'https://shaliah.app'
    }
  }
}))

// Track outgoing API requests
let outgoingRequests: {
  method: string
  payload: any
}[] = []

beforeAll(async () => {
  // Install transformer to mock API calls
  bot.api.config.use(async (prev, method, payload) => {
    outgoingRequests.push({ method, payload })
    
    // Return appropriate mock response based on method
    if (method === 'sendMessage') {
      return {
        ok: true,
        result: {
          message_id: Math.floor(Math.random() * 1000000),
          date: Math.floor(Date.now() / 1000),
          chat: payload.chat_id,
          text: payload.text,
        },
      }
    }
    
    if (method === 'answerCallbackQuery') {
      return {
        ok: true,
        result: true
      }
    }
    
    return { ok: true, result: true }
  })

  // Set bot info to avoid getMe call
  bot.botInfo = {
    id: 42,
    first_name: 'Test Bot',
    is_bot: true,
    username: 'test_bot',
    can_join_groups: true,
    can_read_all_group_messages: true,
    supports_inline_queries: false,
  }

  await bot.init()
}, 5000)

beforeEach(() => {
  outgoingRequests = []
  vi.clearAllMocks()
})

// Helper functions to generate update objects
function generateTextMessage(text: string, chatId = 1111111): Update {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    message: {
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: chatId,
        type: 'private',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
      },
      message_id: Math.floor(Math.random() * 1000000),
      from: {
        id: chatId,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_bot: false,
      },
      text,
    },
  }
}

function generateCallbackQuery(data: string, chatId = 1111111): Update {
  return {
    update_id: Math.floor(Math.random() * 1000000),
    callback_query: {
      id: Math.random().toString(36).substring(7),
      from: {
        id: chatId,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        is_bot: false,
      },
      message: {
        date: Math.floor(Date.now() / 1000),
        chat: {
          id: chatId,
          type: 'private',
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
        },
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: 42,
          first_name: 'Test Bot',
          is_bot: true,
          username: 'test_bot',
        },
        text: 'Previous message',
      },
      chat_instance: Math.random().toString(),
      data,
    },
  }
}

describe('Unlink Flow Integration Tests', () => {
  test('should handle /unlink command when user is linked', async () => {
    // Mock user profile exists
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user123', user_id: 'shaliah123', telegram_user_id: 1111111 },
          error: null
        })
      }))
    }))
    
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }))

    const { supabase } = await import('../../src/lib/supabase.js')
    supabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ update: mockUpdate })

    await bot.handleUpdate(generateTextMessage('/unlink'))

    expect(outgoingRequests.length).toBeGreaterThan(0)
    
    const sendMessageRequest = outgoingRequests.find(req => req.method === 'sendMessage')
    expect(sendMessageRequest).toBeDefined()
    
    if (sendMessageRequest) {
      expect(sendMessageRequest.payload.text).toContain('Account unlinked successfully')
      expect(sendMessageRequest.payload.reply_markup).toBeDefined()
      expect(sendMessageRequest.payload.reply_markup.inline_keyboard).toBeDefined()
    }
  })

  test('should handle /unlink command when user is not linked', async () => {
    // Mock no user profile found
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))
    }))

    const { supabase } = await import('../../src/lib/supabase.js')
    supabase.from.mockReturnValue({ select: mockSelect })

    await bot.handleUpdate(generateTextMessage('/unlink'))

    expect(outgoingRequests.length).toBeGreaterThan(0)
    
    const sendMessageRequest = outgoingRequests.find(req => req.method === 'sendMessage')
    expect(sendMessageRequest).toBeDefined()
    
    if (sendMessageRequest) {
      expect(sendMessageRequest.payload.text).toContain('Account not linked')
    }
  })

  test('should handle unlink button callback with confirmation', async () => {
    await bot.handleUpdate(generateCallbackQuery('unlink'))

    expect(outgoingRequests.length).toBeGreaterThan(0)
    
    // Verify answerCallbackQuery was called
    const answerCallback = outgoingRequests.find(req => req.method === 'answerCallbackQuery')
    expect(answerCallback).toBeDefined()
    
    // Verify confirmation message was sent
    const confirmationMessage = outgoingRequests.find(req => req.method === 'sendMessage')
    expect(confirmationMessage).toBeDefined()
    
    if (confirmationMessage) {
      expect(confirmationMessage.payload.text).toContain('Confirm Account Unlink')
      expect(confirmationMessage.payload.reply_markup).toBeDefined()
      expect(confirmationMessage.payload.reply_markup.inline_keyboard).toBeDefined()
    }
  })

  test('should handle confirm-unlink callback successfully', async () => {
    // Mock user profile exists and unlink succeeds
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'user123', user_id: 'shaliah123', telegram_user_id: 1111111 },
          error: null
        })
      }))
    }))
    
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null })
    }))

    const { supabase } = await import('../../src/lib/supabase.js')
    supabase.from
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ update: mockUpdate })

    await bot.handleUpdate(generateCallbackQuery('confirm-unlink'))

    expect(outgoingRequests.length).toBeGreaterThan(0)
    
    // Verify answerCallbackQuery was called
    const answerCallback = outgoingRequests.find(req => req.method === 'answerCallbackQuery')
    expect(answerCallback).toBeDefined()
    
    // Verify success message was sent
    const successMessage = outgoingRequests.find(req => req.method === 'sendMessage')
    expect(successMessage).toBeDefined()
    
    if (successMessage) {
      expect(successMessage.payload.text).toContain('Account unlinked successfully')
      expect(successMessage.payload.reply_markup).toBeDefined()
    }
  })

  test('should handle cancel-unlink callback', async () => {
    await bot.handleUpdate(generateCallbackQuery('cancel-unlink'))

    expect(outgoingRequests.length).toBeGreaterThan(0)
    
    // Verify answerCallbackQuery was called
    const answerCallback = outgoingRequests.find(req => req.method === 'answerCallbackQuery')
    expect(answerCallback).toBeDefined()
    
    // Verify cancellation message was sent
    const cancelMessage = outgoingRequests.find(req => req.method === 'sendMessage')
    expect(cancelMessage).toBeDefined()
    
    if (cancelMessage) {
      expect(cancelMessage.payload.text).toContain('Unlink cancelled')
    }
  })

  test('should handle unlink command with database error', async () => {
    // Mock database error
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      }))
    }))

    const { supabase } = await import('../../src/lib/supabase.js')
    supabase.from.mockReturnValue({ select: mockSelect })

    await bot.handleUpdate(generateTextMessage('/unlink'))

    expect(outgoingRequests.length).toBeGreaterThan(0)
    
    const sendMessageRequest = outgoingRequests.find(req => req.method === 'sendMessage')
    expect(sendMessageRequest).toBeDefined()
    
    if (sendMessageRequest) {
      expect(sendMessageRequest.payload.text).toContain('Unlink failed')
    }
  })
})
