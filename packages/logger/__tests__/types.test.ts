import { describe, it, expect } from 'vitest';
import { validateConfig, type LoggerConfig } from '../src/types';

describe('validateConfig', () => {
  it('should validate a minimal config', () => {
    const cfg = validateConfig({ serviceName: 'test' });
    expect(cfg.serviceName).toBe('test');
    expect(cfg.level).toBe('info');
    expect(cfg.environment).toBe('test'); // vitest sets NODE_ENV to 'test'
    expect(cfg.prettyPrint).toBe(true);
  });

  it('should throw if serviceName is missing', () => {
    expect(() => validateConfig({})).toThrow('serviceName is required');
  });

  it('should throw if level is invalid', () => {
    expect(() => validateConfig({ serviceName: 'test', level: 'invalid' as any })).toThrow('level must be one of');
  });

  it('should throw if sampleRate is out of range', () => {
    expect(() => validateConfig({ serviceName: 'test', sampleRate: 1.5 })).toThrow('sampleRate must be between 0 and 1');
  });

  it('should set prettyPrint to false in production', () => {
    const cfg = validateConfig({ serviceName: 'test', environment: 'production' });
    expect(cfg.prettyPrint).toBe(false);
  });
});