import { Bot, session } from 'grammy'
import { run, sequentialize } from '@grammyjs/runner'
import { config } from 'dotenv'
import { I18n } from '@grammyjs/i18n'
import type { Context, SessionData } from './types/context.js'
import welcomeComposer from './modules/welcome.js'
import authLinkComposer from './modules/auth-link.js'
import { logger, logBotError } from './logger.js'

// Load environment variables
config()

// Validate required environment variables
const botToken = process.env.BOT_TOKEN

if (!botToken) {
  throw new Error('BOT_TOKEN environment variable is required')
}

// Create the bot instance
const bot = new Bot<Context>(botToken)

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

// Register modules in order: sequentialize → session → i18n → auth-link → others
bot.use(authLinkComposer)
bot.use(welcomeComposer)

// Global error handler
bot.catch(logBotError)

// Start the bot with the high-performance runner
logger.info('🤖 Starting Ezer Bot...')

run(bot)

logger.info('✅ Ezer Bot is running!')