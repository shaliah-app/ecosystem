import { describe, it, expect } from 'vitest';
import { createLogger } from '../src/index';

describe('createLogger contract', () => {
  it('should return a logger object with required methods', () => {
    const logger = createLogger({ serviceName: 'test' });
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.captureException).toBe('function');
  });
});