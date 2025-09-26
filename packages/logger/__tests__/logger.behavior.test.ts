import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger } from '../src/index';

// Mock pino and Sentry
var pinoMock: any;
var captureExceptionMock: any;

vi.mock('pino', () => {
  pinoMock = vi.fn();
  return { default: pinoMock };
});

vi.mock('@sentry/node', () => {
  captureExceptionMock = vi.fn();
  return { init: vi.fn(), captureException: captureExceptionMock };
});

beforeEach(() => {
  vi.clearAllMocks();
  pinoMock.mockReturnValue({ info: vi.fn(), warn: vi.fn(), error: vi.fn() });
});

describe('logger behavior', () => {
  it('should emit JSON log for info', () => {
    const mockLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    pinoMock.mockReturnValue(mockLogger);

    const logger = createLogger({ serviceName: 'test', prettyPrint: false });
    logger.info('test message', { key: 'value' });
    expect(mockLogger.info).toHaveBeenCalledWith({ key: 'value' }, 'test message');
  });

  it('should call Sentry.captureException when DSN is set', () => {
    const logger = createLogger({ serviceName: 'test', sentryDsn: 'https://test@sentry.io/test' });
    const err = new Error('test');
    logger.captureException(err, { context: 'test' });
    expect(captureExceptionMock).toHaveBeenCalledWith(err, { extra: { context: 'test' } });
  });

  it('should not throw when Sentry DSN is absent', () => {
    const logger = createLogger({ serviceName: 'test' });
    const err = new Error('test');
    expect(() => logger.captureException(err)).not.toThrow();
  });
});