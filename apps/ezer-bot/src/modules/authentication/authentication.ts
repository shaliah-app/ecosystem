import type { Context } from "../../types/context.js";
import { Composer } from "grammy";
import { logger } from "../../logger.js";
import {
  findUserProfileByTelegramUserId,
  validateToken,
  linkTelegramUser,
  markTokenAsUsed,
} from "./authentication-service.js";
import {
  getTelegramUserId,
  setAuthenticated,
} from "../../lib/session.js";
import { noTokenMessage } from "./authentication-messages.js";
import { authMiddleware } from "./authentication-middleware.js";

export const authComposer = new Composer<Context>();

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

    const telegramUserId = getTelegramUserId(ctx);
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

    // Automatically authenticate the user in session
    setAuthenticated(ctx, token.user_id);

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

export async function authenticate(ctx: Context): Promise<void> {
  const tokenStr = ctx.match;

  if (!tokenStr || tokenStr.trim().length === 0) {
    await noTokenMessage(ctx);
    return;
  }

  await handleWithToken(ctx, tokenStr);
}

authComposer.use(authMiddleware);
authComposer.command("start", authenticate);

export default authComposer;
