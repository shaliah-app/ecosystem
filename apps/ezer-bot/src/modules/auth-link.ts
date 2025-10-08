import type { Context } from "../types/context.js";
import { Composer } from "grammy";
import { logger } from "../logger.js";
import { env } from "../lib/env.js";
import {
  findUserProfileByTelegramUserId,
  validateToken,
  linkTelegramUser,
  markTokenAsUsed,
} from "../lib/auth.js";

export const authComposer = new Composer<Context>();

async function handleNoToken(ctx: Context): Promise<void> {
  await ctx.reply(ctx.t("auth-link-unlinked"), {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Open Shaliah", url: `${env.shaliah.baseUrl}/profile` }],
      ],
    },
  });
}

async function handleWithToken(ctx: Context, tokenStr: string): Promise<void> {
  try {
    const validation = await validateToken(tokenStr);
    if (!validation.success) {
      switch (validation.reason) {
        case "invalid-format":
        case "not-found":
          await ctx.reply(ctx.t("auth-link-invalid"));
          break;
        case "expired":
          await ctx.reply(ctx.t("auth-link-expired"));
          break;
        case "used":
          await ctx.reply(ctx.t("auth-link-used"));
          break;
        case "cancelled":
          await ctx.reply(ctx.t("auth-link-cancelled"));
          break;
      }
      return;
    }

    const { token } = validation;

    const telegramUserId = ctx.from?.id;
    if (!telegramUserId) {
      await ctx.reply(ctx.t("auth-link-error"));
      return;
    }

    const linkedUserProfile = await findUserProfileByTelegramUserId(
      telegramUserId
    );

    if (linkedUserProfile && linkedUserProfile.id === token.user_id) {
      return;
    } else if (linkedUserProfile && linkedUserProfile.id !== token.user_id) {
      await ctx.reply(ctx.t("auth-link-different-user"));
      return;
    }

    try {
      await linkTelegramUser(token.user_id, telegramUserId);
      logger.info("Successfully linked Telegram account", {
        userId: token.user_id,
        telegramUserId,
      });
    } catch (linkErr) {
      await ctx.reply(ctx.t("auth-link-error"));
      return;
    }

    await markTokenAsUsed(token.id);

    await ctx.reply(ctx.t("auth-link-success"));
  } catch (err) {
    logger.error("ezer.auth.token_usage_failure", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      telegramUserId: ctx.from?.id,
    });
    try {
      await ctx.reply(ctx.t("auth-link-error"));
    } catch {}
  }
}

export async function handleAuthentication(ctx: Context): Promise<void> {
  const tokenStr = ctx.match;

  if (!tokenStr || tokenStr.trim().length === 0) {
    await handleNoToken(ctx);
    return;
  }

  await handleWithToken(ctx, tokenStr);
}

authComposer.command("start", handleAuthentication);

export default authComposer;
