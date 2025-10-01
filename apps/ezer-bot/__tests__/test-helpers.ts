import { vi } from 'vitest'
import { Context } from 'grammy'

// Helper to create a mock context for testing
export function createMockContext(update: any = {}): Context {
  const mockApi = {
    sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
    getMe: vi.fn().mockResolvedValue({ id: 123456789, is_bot: true, username: 'test_bot' }),
  }

  const mockContext = {
    api: mockApi,
    update,
    from: update.message?.from || { id: 123456789, is_bot: false, first_name: 'Test User' },
    chat: update.message?.chat || { id: 123456789, type: 'private' },
    message: update.message,
    reply: vi.fn().mockResolvedValue({ message_id: 1 }),
    // Add other context properties as needed
  } as any

  return mockContext
}

// Helper to create a message update
export function createMessageUpdate(text: string, userId: number = 123456789): any {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      from: {
        id: userId,
        is_bot: false,
        first_name: 'Test User',
        username: 'testuser',
      },
      chat: {
        id: userId,
        type: 'private',
      },
      date: Date.now(),
      text,
    },
  }
}

// Helper to create a command update
export function createCommandUpdate(command: string, userId: number = 123456789): any {
  return createMessageUpdate(`/${command}`, userId)
}