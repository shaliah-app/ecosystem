# @yesod/logger

Shared logger package for the Yesod ecosystem, providing structured logging with Pino and error tracking with Sentry.

## Installation

```bash
pnpm add @yesod/logger
```

## Usage

```ts
import { createLogger } from '@yesod/logger'

const logger = createLogger({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV,
  sentryDsn: process.env.SENTRY_DSN, // Optional
})

logger.info('Service started', { port: 3000 })
logger.captureException(new Error('Something went wrong'))
```

## Environment Variables

- `SENTRY_DSN`: Sentry Data Source Name (optional)
- `LOG_LEVEL`: Log level (debug, info, warn, error)
- `SERVICE_NAME`: Service identifier
- `NODE_ENV`: Environment (development, production)

## API

- `createLogger(config?: LoggerConfig): Logger`
- `logger.info(message: string, context?: object)`
- `logger.warn(message: string, context?: object)`
- `logger.error(error: Error | string, context?: object)`
- `logger.captureException(error: Error, context?: object)`