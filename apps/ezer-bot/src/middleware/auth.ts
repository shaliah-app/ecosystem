import type { Context } from "../types/context.js";
import { isAuthenticated } from "../lib/session.js";
import { env } from "../lib/env.js";

/**
 * Global authentication middleware that checks if users are authenticated
 * before allowing access to protected commands.
 *
 * Skips authentication check for /start command to allow authentication flow.
 */
export async function authMiddleware(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  // Skip authentication check for start command (handled by authComposer)
  if (ctx.message?.text?.startsWith("/start")) {
    return next();
  }

  // Check if user is authenticated for all other commands
  const authenticated = await isAuthenticated(ctx);

  if (!authenticated) {
    // Show unlinked message for unauthenticated users
    await ctx.reply(ctx.t("auth-link-unlinked"), {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Open Shaliah", url: `${env.shaliah.baseUrl}/profile` }],
        ],
      },
    });
    return; // Block the command
  }

  await next(); // User is authenticated, continue
}
