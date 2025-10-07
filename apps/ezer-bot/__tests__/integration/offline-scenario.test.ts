import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Bot, Context } from 'grammy';
import { dependencyMiddleware } from '../../src/modules/dependency';

/**
 * Integration test for offline scenario
 * 
 * This test verifies that the dependency middleware correctly
 * handles various offline scenarios and shows appropriate error messages.
 */
describe('Offline Scenario Integration', () => {
  let bot: Bot;
  let mockContext: Partial<Context>;
  let mockNext: vi.MockedFunction<() => Promise<void>>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Create mock bot
    bot = new Bot('mock-token');
    
    // Create mock context
    mockContext = {
      message: {
        text: '/start',
        from: {
          id: 123,
          first_name: 'Test',
          is_bot: false
        },
        chat: {
          id: 123,
          type: 'private'
        }
      },
      reply: vi.fn(),
      answerCallbackQuery: vi.fn()
    };
    
    // Create mock next function
    mockNext = vi.fn().mockResolvedValue(undefined);
    
    // Reset environment
    process.env.NODE_ENV = 'production';
    process.env.SHALIAH_HEALTH_URL = 'http://localhost:3000/api/health';
    process.env.DEPENDENCY_CHECK_TIMEOUT = '5000';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Network Errors', () => {
    it('should handle connection refused errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle DNS resolution errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle network unreachable errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ENETUNREACH'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle timeout errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle SSL/TLS errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('SSL certificate problem'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('HTTP Error Responses', () => {
    it('should handle 500 Internal Server Error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service unavailable' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle 404 Not Found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle 502 Bad Gateway', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ error: 'Bad gateway' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle 504 Gateway Timeout', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 504,
        json: () => Promise.resolve({ error: 'Gateway timeout' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('Response Parsing Errors', () => {
    it('should handle invalid JSON responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle empty responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null)
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle malformed responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ wrongField: 'value' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('Configuration Errors', () => {
    it('should handle missing health URL', async () => {
      delete process.env.SHALIAH_HEALTH_URL;

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle invalid health URL', async () => {
      process.env.SHALIAH_HEALTH_URL = 'not-a-valid-url';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle invalid timeout configuration', async () => {
      process.env.DEPENDENCY_CHECK_TIMEOUT = 'invalid';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('Error Message Consistency', () => {
    it('should show same error message for all offline scenarios', async () => {
      const scenarios = [
        () => global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        () => global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }),
        () => global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }),
        () => global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 }),
        () => global.fetch = vi.fn().mockRejectedValue(new Error('Timeout'))
      ];

      const errorMessages: string[] = [];

      for (const setupScenario of scenarios) {
        setupScenario();
        
        const middleware = dependencyMiddleware;
        await middleware(mockContext as Context, mockNext);

        expect(mockContext.reply).toHaveBeenCalled();
        const callArgs = (mockContext.reply as vi.MockedFunction<any>).mock.calls[0];
        errorMessages.push(callArgs[0]);

        // Reset mocks
        vi.clearAllMocks();
        mockNext = vi.fn().mockResolvedValue(undefined);
        mockContext.reply = vi.fn();
      }

      // All error messages should be the same
      const uniqueMessages = new Set(errorMessages);
      expect(uniqueMessages.size).toBe(1);
    });

    it('should show user-friendly error message', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.not.stringContaining('ECONNREFUSED')
      );
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.not.stringContaining('error')
      );
    });
  });

  describe('Performance in Offline Scenarios', () => {
    it('should fail fast on network errors', async () => {
      const startTime = Date.now();
      
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should fail fast
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should respect timeout configuration', async () => {
      process.env.DEPENDENCY_CHECK_TIMEOUT = '1000';

      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const startTime = Date.now();
      
      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(2000); // Should respect timeout
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Logging in Offline Scenarios', () => {
    it('should log offline events', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );

      consoleSpy.mockRestore();
    });

    it('should log error details', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Recovery Scenarios', () => {
    it('should work when Shaliah comes back online', async () => {
      // First request: offline
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );

      // Reset mocks
      vi.clearAllMocks();
      mockNext = vi.fn().mockResolvedValue(undefined);
      mockContext.reply = vi.fn();

      // Second request: online
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
    });

    it('should handle intermittent failures', async () => {
      // Mock intermittent failures
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) {
          return Promise.reject(new Error('ECONNREFUSED'));
        } else {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ status: 'healthy' })
          });
        }
      });

      const middleware = dependencyMiddleware;

      // First request: should fail
      await middleware(mockContext as Context, mockNext);
      expect(mockNext).not.toHaveBeenCalled();

      // Reset mocks
      vi.clearAllMocks();
      mockNext = vi.fn().mockResolvedValue(undefined);
      mockContext.reply = vi.fn();

      // Second request: should succeed
      await middleware(mockContext as Context, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
