import { Bot, session } from 'grammy'
import { run, sequentialize } from '@grammyjs/runner'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { Context, SessionData } from './types/context.js'
import welcomeComposer from './modules/welcome.js'
import { logger } from './logger.js'

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

// Sequentialize middleware to ensure updates from the same chat are processed in order
bot.use(sequentialize((ctx) => ctx.chat?.id.toString()))

// Register modules
bot.use(welcomeComposer)

// Global error handler
bot.catch((err: any) => {
  logger.captureException(err.error, {
    update: err.ctx?.update,
    chatId: err.ctx?.chat?.id,
    userId: err.ctx?.from?.id,
  })
  // In production, you might want to send this to a logging service
})

// Start the bot with the high-performance runner
logger.info('🤖 Starting Ezer Bot...')

run(bot)

logger.info('✅ Ezer Bot is running!')