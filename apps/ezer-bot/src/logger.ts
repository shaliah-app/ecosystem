import { createLogger } from '@yesod/logger'
import { GrammyError, HttpError } from 'grammy'
import type { BotError } from 'grammy'

// Initialize the shared logger for bot operations
export const logger = createLogger({
  serviceName: 'ezer-bot',
  environment: process.env.NODE_ENV || 'development',
  sentryDsn: process.env.SENTRY_DSN,
})

/**
 * Log errors caught by the bot's global error handler
 */
export function logBotError(err: BotError): void {
  const ctx = err.ctx
  const error = err.error

  // Log the basic error information
  logger.error(`Error while handling update ${ctx.update.update_id}`, {
    update: ctx.update,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
  })

  // Handle specific error types
  if (error instanceof GrammyError) {
    logger.error(`Error in request: ${error.description}`, {
      errorCode: error.error_code,
      ok: error.ok,
    })
  } else if (error instanceof HttpError) {
    logger.error(`Could not contact Telegram: ${error}`, {
      cause: error.cause,
    })
  } else {
    // Handle other errors
    if (error instanceof Error) {
      logger.captureException(error, {
        update: ctx.update,
        chatId: ctx.chat?.id,
        userId: ctx.from?.id,
      })
    } else {
      logger.error('Unknown error type', { error })
    }
  }
}