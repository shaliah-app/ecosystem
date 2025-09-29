# @yesod/logger

Shared logger package for the Yesod ecosystem, providing structured logging with Pino.

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
})

logger.info('Service started', { port: 3000 })
logger.error('Something went wrong', { userId: 123 })
logger.captureException(new Error('Database connection failed'))
```

## Environment Variables

- `LOG_LEVEL`: Log level (debug, info, warn, error) - defaults to 'info'
- `SERVICE_NAME`: Service identifier - defaults to 'default'
- `NODE_ENV`: Environment (development, production) - used for log context

## API

- `createLogger(config?: LoggerConfig): Logger`
- `logger.info(message: string, context?: object)`
- `logger.warn(message: string, context?: object)`
- `logger.error(error: Error | string, context?: object)`
- `logger.captureException(error: Error, context?: object)` - Currently logs the error; Sentry integration planned for future

## LoggerConfig

```ts
interface LoggerConfig {
  serviceName?: string;
  environment?: string;
  level?: string;
}
```