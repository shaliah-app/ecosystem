export interface LoggerConfig {
  serviceName: string;
  environment?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  sentryDsn?: string | undefined;
  sentryEnvironment?: string | undefined;
  sampleRate?: number | undefined;
  prettyPrint?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  context?: object;
  meta?: object;
}

export function validateConfig(cfg: Partial<LoggerConfig>): LoggerConfig {
  if (!cfg.serviceName || typeof cfg.serviceName !== 'string') {
    throw new Error('serviceName is required and must be a string');
  }
  const level = cfg.level || 'info';
  if (!['debug', 'info', 'warn', 'error'].includes(level)) {
    throw new Error('level must be one of: debug, info, warn, error');
  }
  if (cfg.sampleRate !== undefined && (cfg.sampleRate < 0 || cfg.sampleRate > 1)) {
    throw new Error('sampleRate must be between 0 and 1');
  }
  return {
    serviceName: cfg.serviceName,
    environment: cfg.environment || process.env.NODE_ENV || 'development',
    level: level as 'debug' | 'info' | 'warn' | 'error',
    sentryDsn: cfg.sentryDsn,
    sentryEnvironment: cfg.sentryEnvironment,
    sampleRate: cfg.sampleRate,
    prettyPrint: cfg.prettyPrint ?? (cfg.environment !== 'production'),
  };
}