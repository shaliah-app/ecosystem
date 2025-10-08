import type { Context } from "../types/context.js";

/**
 * Gets the Telegram user ID from session or context, storing it in session for future use.
 * 
 * @param ctx - The Telegram context
 * @returns The Telegram user ID, or null if not available
 */
export function getTelegramUserId(ctx: Context): number | null {
  // Try session first, then fallback to context
  const telegramUserId = ctx.session?.telegramUserId || ctx.from?.id;
  
  if (!telegramUserId) {
    return null;
  }

  // Store in session if not already there
  if (ctx.session && !ctx.session.telegramUserId) {
    ctx.session.telegramUserId = telegramUserId;
  }

  return telegramUserId;
}

/**
 * Ensures the user has a valid Telegram user ID, throwing an error if not available.
 * 
 * @param ctx - The Telegram context
 * @returns The Telegram user ID
 * @throws Error if no Telegram user ID is available
 */
export function requireTelegramUserId(ctx: Context): number {
  const telegramUserId = getTelegramUserId(ctx);
  
  if (!telegramUserId) {
    throw new Error("No Telegram user ID available");
  }

  return telegramUserId;
}
