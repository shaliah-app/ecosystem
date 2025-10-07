import { env } from './lib/env.js'
import { Bot, session } from 'grammy'
import { run, sequentialize } from '@grammyjs/runner'
import { I18n } from '@grammyjs/i18n'
import type { Context, SessionData } from './types/context.js'
import welcomeComposer from './modules/welcome.js'
import authLinkComposer, { unlinkedDetectionComposer } from './modules/auth-link.js'
import unlinkComposer from './modules/unlink.js'
import { dependencyComposer } from './modules/dependency.js'
import { logger, logBotError } from './logger.js'

// Environment configuration is validated and loaded in env.ts
// All environment variables are validated at import time

// Create the bot instance
const bot = new Bot<Context>(env.bot.token)

// Configure session management (using memory storage for now)
bot.use(
  session({
    initial: (): SessionData => ({
      // Initialize session data here
    })
  })
)

// Configure internationalization
const i18n = new I18n<Context>({
  defaultLocale: 'en',
  directory: 'src/locales', // relative to the bot.ts file
  globalTranslationContext(ctx) {
    return {
      first_name: ctx.from?.first_name ?? 'there',
    }
  },
})

bot.use(i18n)

// Sequentialize middleware to ensure updates from the same chat are processed in order
bot.use(sequentialize((ctx) => ctx.chat?.id.toString()))

// Register modules in order: sequentialize → session → i18n → dependency → auth-link → others
bot.use(dependencyComposer)
bot.use(authLinkComposer)
bot.use(unlinkedDetectionComposer)
bot.use(unlinkComposer)
bot.use(welcomeComposer)

// Global error handler
bot.catch(logBotError)

// Setup graceful shutdown handlers
const shutdown = async (signal: string) => {
  logger.info(`🛑 Received ${signal}, shutting down gracefully...`)
  
  try {
    // Stop the bot runner
    await bot.stop()
    logger.info('✅ Bot stopped successfully')
  } catch (error) {
    logger.error('❌ Error during bot shutdown', { error })
  }
  
  process.exit(0)
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught exception', { error })
  shutdown('uncaughtException')
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled promise rejection', { reason, promise })
  shutdown('unhandledRejection')
})

// Start the bot with the high-performance runner
logger.info('🤖 Starting Ezer Bot...')

run(bot)

logger.info('✅ Ezer Bot is running!')