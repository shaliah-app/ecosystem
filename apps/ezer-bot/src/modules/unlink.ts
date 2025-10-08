import { Composer } from 'grammy'
import type { Context } from '../types/context.js'
import { logger } from '../logger.js'
import { env } from '../lib/env.js'
import { unlinkTelegramUser } from '../lib/auth.js'
import { getTelegramUserId } from '../lib/session.js'

const composer = new Composer<Context>()

// ============================================================================
// CORE UNLINK LOGIC
// ============================================================================

async function handleUnlink(ctx: Context, telegramId: number): Promise<void> {
  try {
    const profile = await unlinkTelegramUser(telegramId);
    
    if (!profile) {
      await ctx.editMessageText(ctx.t('unlink-error-not-linked'));
      return;
    }

    // Clear session data
    if (ctx.session) {
      ctx.session.isLinked = false;
      delete ctx.session.shaliahUserId;
    }

    // Success response
    await ctx.editMessageText(ctx.t('unlink-success'), {
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
    });

    logger.info('Account unlinked successfully', { 
      telegramId, 
      userId: profile.user_id 
    });

  } catch (error) {
    logger.error('Failed to unlink account', { error, telegramId });
    await ctx.editMessageText(ctx.t('unlink-error-generic'));
  }
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

composer.command('unlink', async (ctx) => {
  const telegramUserId = getTelegramUserId(ctx);
  if (!telegramUserId) {
    await ctx.reply(ctx.t('unlink-error-no-user'));
    return;
  }

  await handleUnlink(ctx, telegramUserId);
});

// ============================================================================
// CALLBACK QUERY HANDLERS
// ============================================================================

// Show unlink confirmation dialog
composer.callbackQuery('unlink', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  await ctx.editMessageText(ctx.t('unlink-confirmation'), {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [
          { text: ctx.t('confirm-unlink-button'), callback_data: 'confirm-unlink' },
          { text: ctx.t('cancel-button'), callback_data: 'cancel-unlink' }
        ]
      ]
    }
  });
});

// Confirm unlink action
composer.callbackQuery('confirm-unlink', async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const telegramUserId = getTelegramUserId(ctx);
  if (!telegramUserId) {
    await ctx.editMessageText(ctx.t('unlink-error-no-user'));
    return;
  }

  await handleUnlink(ctx, telegramUserId);
});

// Cancel unlink action
composer.callbackQuery('cancel-unlink', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t('unlink-cancelled'));
});

export default composer
