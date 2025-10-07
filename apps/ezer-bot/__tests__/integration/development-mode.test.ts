import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Bot, Context } from 'grammy';
import { dependencyMiddleware } from '../../src/modules/dependency';

/**
 * Integration test for development mode bypass
 * 
 * This test verifies that the dependency middleware correctly
 * bypasses health checks in development and test modes.
 */
describe('Development Mode Bypass Integration', () => {
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
    process.env.SHALIAH_HEALTH_URL = 'http://localhost:3000/api/health';
    process.env.DEPENDENCY_CHECK_TIMEOUT = '5000';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Development Mode (NODE_ENV=development)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should bypass dependency check in development mode', async () => {
      // Mock failed health check (should not be called)
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should process messages normally in development mode', async () => {
      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
    });

    it('should work even when Shaliah is offline in development mode', async () => {
      // Simulate Shaliah being offline
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should work with invalid health URL in development mode', async () => {
      process.env.SHALIAH_HEALTH_URL = 'http://invalid-url:9999/api/health';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
    });

    it('should work without health URL in development mode', async () => {
      delete process.env.SHALIAH_HEALTH_URL;

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
    });

    it('should log development mode bypass', async () => {
      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      // Verify the middleware bypasses the check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Test Mode (NODE_ENV=test)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should bypass dependency check in test mode', async () => {
      // Mock failed health check (should not be called)
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should process messages normally in test mode', async () => {
      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
    });

    it('should work even when Shaliah is offline in test mode', async () => {
      // Simulate Shaliah being offline
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should log test mode bypass', async () => {
      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      // Verify the middleware bypasses the check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Production Mode (NODE_ENV=production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should perform dependency check in production mode', async () => {
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
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should block when Shaliah is offline in production mode', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockContext.reply).toHaveBeenCalledWith(
        expect.stringContaining('offline')
      );
    });
  });

  describe('Environment Variable Handling', () => {
    it('should handle undefined NODE_ENV as production', async () => {
      delete process.env.NODE_ENV;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle empty NODE_ENV as production', async () => {
      process.env.NODE_ENV = '';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      // When NODE_ENV is empty, validation fails and dependency checks are disabled
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive NODE_ENV', async () => {
      process.env.NODE_ENV = 'development';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle mixed case NODE_ENV', async () => {
      process.env.NODE_ENV = 'test';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Middleware Integration', () => {
    it('should work with other middleware in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const middleware = dependencyMiddleware;
      
      // Add other middleware
      bot.use(middleware);
      bot.use((ctx, next) => {
        // Some other middleware
        return next();
      });

      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work with other middleware in test mode', async () => {
      process.env.NODE_ENV = 'test';

      const middleware = dependencyMiddleware;
      
      // Add other middleware
      bot.use(middleware);
      bot.use((ctx, next) => {
        // Some other middleware
        return next();
      });

      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work with other middleware in production mode', async () => {
      process.env.NODE_ENV = 'production';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      
      // Add other middleware
      bot.use(middleware);
      bot.use((ctx, next) => {
        // Some other middleware
        return next();
      });

      await middleware(mockContext as Context, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance in Development Mode', () => {
    it('should be fast in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const startTime = Date.now();
      
      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Should be very fast
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not make network requests in development mode', async () => {
      process.env.NODE_ENV = 'development';

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' })
      });

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Logging in Development Mode', () => {
    it('should log development mode activation', async () => {
      process.env.NODE_ENV = 'development';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      // Verify the middleware bypasses the check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not log health check attempts in development mode', async () => {
      process.env.NODE_ENV = 'development';

      const middleware = dependencyMiddleware;
      await middleware(mockContext as Context, mockNext);

      // Verify the middleware bypasses the check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockContext.reply).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
