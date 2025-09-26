import pino from 'pino';
import * as Sentry from '@sentry/node';
import { LoggerConfig, validateConfig } from './types';
import { safeSerialize } from './serializers';

export interface Logger {
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(error: Error | string, context?: object): void;
  captureException(error: Error, context?: object): Promise<void>;
}

let sentryInitialized = false;

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const cfg = validateConfig(config || { serviceName: 'default' });

  // Initialize Sentry if DSN provided and not already done
  if (cfg.sentryDsn && !sentryInitialized) {
    Sentry.init({
      dsn: cfg.sentryDsn,
      environment: cfg.sentryEnvironment || cfg.environment || 'development',
      sampleRate: cfg.sampleRate || 1.0,
    });
    sentryInitialized = true;
  }

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
      if (cfg.sentryDsn) {
        Sentry.captureException(error, { extra: context as any });
      }
    },
  };

  return logger;
}