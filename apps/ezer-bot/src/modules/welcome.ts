import { Composer } from 'grammy'
import type { Context } from '../types/context.js'

const composer = new Composer<Context>()

// Handle the /start command
composer.command('start', async (ctx) => {
  const user = ctx.from

  const welcomeMessage = `
🎵 *Welcome to Ezer Bot!* 🎵

Hello ${user?.first_name || 'there'}! I'm your musical companion for the Kinnor ecosystem.

I can help you with:
• Song search and discovery
• Audio matching and identification
• Playlist management
• And much more!

Use /help to see all available commands.
`

  await ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🎵 Search Songs', callback_data: 'search' },
          { text: '📋 My Playlists', callback_data: 'playlists' }
        ],
        [
          { text: '❓ Help', callback_data: 'help' }
        ]
      ]
    }
  })
})

// Handle callback queries from the welcome menu
composer.callbackQuery('search', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('🎵 *Song Search*\n\nSearch functionality coming soon!', {
    parse_mode: 'Markdown'
  })
})

composer.callbackQuery('playlists', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('📋 *My Playlists*\n\nPlaylist management coming soon!', {
    parse_mode: 'Markdown'
  })
})

composer.callbackQuery('help', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('❓ *Help*\n\nAvailable commands:\n/start - Welcome message\n/help - This help message', {
    parse_mode: 'Markdown'
  })
})

export default composer