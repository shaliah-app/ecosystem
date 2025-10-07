import { Composer } from 'grammy'
import type { Context } from '../types/context.js'
import { supabase } from '../lib/supabase.js'
import { logger } from '../logger.js'
import { env } from '../lib/env.js'

const composer = new Composer<Context>()

// Command handler for /unlink
composer.command('unlink', async (ctx) => {
  const telegramId = ctx.from?.id
  if (!telegramId) {
    await ctx.reply(ctx.t('unlink-error-no-user'))
    return
  }

  try {
    // Check if user is linked
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('telegram_user_id', telegramId)
      .maybeSingle()

    if (fetchError) {
      logger.error('Failed to fetch user profile for unlink', { error: fetchError, telegramId })
      await ctx.reply(ctx.t('unlink-error-generic'))
      return
    }

    if (!profile) {
      await ctx.reply(ctx.t('unlink-error-not-linked'))
      return
    }

    // Perform the unlink operation
    const { error: unlinkError } = await supabase
      .from('user_profiles')
      .update({ telegram_user_id: null })
      .eq('telegram_user_id', telegramId)

    if (unlinkError) {
      logger.error('Failed to unlink account', { error: unlinkError, telegramId })
      await ctx.reply(ctx.t('unlink-error-generic'))
      return
    }

    // Clear session data
    if (ctx.session) {
      ctx.session.isLinked = false
      delete ctx.session.shaliahUserId
    }

    // Success response
    await ctx.reply(ctx.t('unlink-success'), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.t('link-account-button'),
              url: `${env.shaliah.baseUrl}/profile`
            }
          ]
        ]
      }
    })

    logger.info('Account unlinked successfully', { 
      telegramId, 
      userId: profile.user_id 
    })

  } catch (error) {
    logger.error('Unexpected error during unlink', { error, telegramId })
    await ctx.reply(ctx.t('unlink-error-generic'))
  }
})

// Callback handler for unlink confirmation
composer.callbackQuery('confirm-unlink', async (ctx) => {
  await ctx.answerCallbackQuery()
  
  const telegramId = ctx.from?.id
  if (!telegramId) {
    await ctx.reply(ctx.t('unlink-error-no-user'))
    return
  }

  try {
    // Check if user is linked
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('telegram_user_id', telegramId)
      .maybeSingle()

    if (fetchError) {
      logger.error('Failed to fetch user profile for unlink', { error: fetchError, telegramId })
      await ctx.reply(ctx.t('unlink-error-generic'))
      return
    }

    if (!profile) {
      await ctx.reply(ctx.t('unlink-error-not-linked'))
      return
    }

    // Perform the unlink operation
    const { error: unlinkError } = await supabase
      .from('user_profiles')
      .update({ telegram_user_id: null })
      .eq('telegram_user_id', telegramId)

    if (unlinkError) {
      logger.error('Failed to unlink account', { error: unlinkError, telegramId })
      await ctx.reply(ctx.t('unlink-error-generic'))
      return
    }

    // Clear session data
    if (ctx.session) {
      ctx.session.isLinked = false
      delete ctx.session.shaliahUserId
    }

    // Success response
    await ctx.reply(ctx.t('unlink-success'), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ctx.t('link-account-button'),
              url: `${env.shaliah.baseUrl}/profile`
            }
          ]
        ]
      }
    })

    logger.info('Account unlinked successfully via callback', { 
      telegramId, 
      userId: profile.user_id 
    })

  } catch (error) {
    logger.error('Unexpected error during unlink callback', { error, telegramId })
    await ctx.reply(ctx.t('unlink-error-generic'))
  }
})

// Callback handler for unlink cancellation
composer.callbackQuery('cancel-unlink', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(ctx.t('unlink-cancelled'))
})

export default composer
