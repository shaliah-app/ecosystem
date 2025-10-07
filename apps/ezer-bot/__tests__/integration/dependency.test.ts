import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Bot, Context } from 'grammy';
import { dependencyMiddleware } from '../../src/modules/dependency';

/**
 * Integration test for dependency middleware
 * 
 * This test verifies that the dependency middleware correctly
 * integrates with grammY bot and handles Shaliah availability.
 */
describe('Dependency Middleware Integration', () => {
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

  describe('Middleware Registration', () => {
    it('should register dependency middleware without errors', () => {
      expect(() => {
        bot.use(dependencyMiddleware);
      }).not.toThrow();
    });

    it('should be compatible with other middleware', () => {
      expect(() => {
        bot.use(dependencyMiddleware);
        // Add other middleware
        bot.use((ctx, next) => next());
      }).not.toThrow();
    });
  });

  describe('Health Check Integration', () => {
    it('should pass through when Shaliah is online', async () => {
      // Mock successful health check
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy', timestamp: '2025-01-27T10:30:00Z' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
    });

    it('should block when Shaliah is offline', async () => {
      // Mock failed health check
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle timeout errors', async () => {
      // Mock timeout
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

    it('should handle non-200 responses', async () => {
      // Mock 500 error response
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
  });

  describe('Development Mode Integration', () => {
    it('should bypass dependency check in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should bypass dependency check in test mode', async () => {
      process.env.NODE_ENV = 'test';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should perform dependency check in production mode', async () => {
      process.env.NODE_ENV = 'production';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(global.fetch).toHaveBeenCalledWith(
        process.env.SHALIAH_HEALTH_URL,
        expect.objectContaining({
          method: 'GET',
          signal: expect.any(AbortSignal)
        })
      );
    });
  });

  describe('Configuration Integration', () => {
    it('should use configured health URL', async () => {
      const customUrl = 'http://custom-shaliah:8080/api/health';
      process.env.SHALIAH_HEALTH_URL = customUrl;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(global.fetch).toHaveBeenCalledWith(
        customUrl,
        expect.any(Object)
      );
    });

    it('should use configured timeout', async () => {
      process.env.DEPENDENCY_CHECK_TIMEOUT = '2000';

      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );
    });

    it('should handle missing configuration gracefully', async () => {
      delete process.env.SHALIAH_HEALTH_URL;

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });

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

    it('should handle DNS resolution errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('Performance Integration', () => {
    it('should complete health check within timeout', async () => {
      const startTime = Date.now();
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not block on concurrent requests', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      
      // Simulate concurrent requests
      const promises = Array.from({ length: 5 }, () => 
        middleware(mockContext as Context, mockNext)
      );

      await Promise.all(promises);

      expect(mockNext).toHaveBeenCalledTimes(5);
    });
  });

  describe('Logging Integration', () => {
    it('should log dependency check attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('dependency check')
      );

      consoleSpy.mockRestore();
    });

    it('should log development mode bypass', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      process.env.NODE_ENV = 'development';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('development mode')
      );

      consoleSpy.mockRestore();
    });
  });
});
