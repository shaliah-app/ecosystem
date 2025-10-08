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

export async function handleAuthentication(ctx: Context): Promise<void> {
  try {
    const tokenStr = ctx.match;

    // No tokenStr: show unlinked message with Shaliah button
    if (!tokenStr || tokenStr.trim().length === 0) {
      await ctx.reply(ctx.t("auth-link-unlinked"), {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Open Shaliah", url: `${env.shaliah.baseUrl}/profile` }],
          ],
        },
      });
      return;
    }

    // Validate token (includes format check and all validation logic)
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

    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply(ctx.t("auth-link-error"));
      return;
    }

    // Check if this Telegram account is already linked
    const linkedUserProfile = await findUserProfileByTelegramUserId(telegramId);

    // If already linked to the same user, continue to next middleware
    if (linkedUserProfile && linkedUserProfile.id === token.user_id) {
      return;
    } else if (linkedUserProfile && linkedUserProfile.id !== token.user_id) {
      await ctx.reply(ctx.t("auth-link-different-user"));
      return;
    }
    // Link Telegram user to profile
    try {
      await linkTelegramUser(token.user_id, telegramId);
      logger.info("Successfully linked Telegram account", {
        userId: token.user_id,
        telegramId,
      });
    } catch (linkErr) {
      await ctx.reply(ctx.t("auth-link-error"));
      return;
    }

    // Mark token as used (best effort - don't fail if already used)
    await markTokenAsUsed(token.id);

    await ctx.reply(ctx.t("auth-link-success"));
    return;
  } catch (err) {
    logger.error("ezer.auth.token_usage_failure", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      telegramId: ctx.from?.id,
    });
    try {
      await ctx.reply(ctx.t("auth-link-error"));
    } catch {
      // already logged
    }
  }
}

authComposer.command("start", handleAuthentication);

export default authComposer;
