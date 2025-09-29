import pino from 'pino';
import { LoggerConfig, validateConfig } from './types';

export interface Logger {
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(error: Error | string, context?: object): void;
  captureException(error: Error, context?: object): Promise<void>;
}

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const cfg = validateConfig(config || { serviceName: 'default' });

  // Create Pino logger
  const pinoLogger = pino({
    level: cfg.level || 'info',
    base: {
      service: cfg.serviceName,
      environment: cfg.environment,
    },
  });

  const logger: Logger = {
    info: (message: string, context?: object) => {
      pinoLogger.info(context || {}, message);
    },
    warn: (message: string, context?: object) => {
      pinoLogger.warn(context || {}, message);
    },
    error: (error: Error | string, context?: object) => {
      const err = error instanceof Error ? error : new Error(error);
      pinoLogger.error({ err, ...context }, err.message);
    },
    captureException: async (error: Error, context?: object) => {
      pinoLogger.error({ err: error, ...context }, error.message);
      // TODO: Integrate with Sentry when available
    },
  };

  return logger;
}