import { beforeAll, vi } from 'vitest'

// Mock the Telegram API calls using grammY's transformer functions
beforeAll(() => {
  // Mock all API calls to prevent actual network requests during testing
  vi.mock('grammy', async () => {
    const actual = await vi.importActual('grammy')

    return {
      ...actual,
      // Mock the Bot class to prevent real API calls
      Bot: vi.fn().mockImplementation(() => ({
        api: {
          // Mock API methods that might be called
          sendMessage: vi.fn().mockResolvedValue({ message_id: 1 }),
          getMe: vi.fn().mockResolvedValue({ id: 123456789, is_bot: true, username: 'test_bot' }),
          // Add other API methods as needed
        },
        // Mock other bot methods
        on: vi.fn(),
        command: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        use: vi.fn(),
      })),
    }
  })
})