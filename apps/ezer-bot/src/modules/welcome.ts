import { Composer } from "grammy";
import type { Context } from "../types/context.js";

const composer = new Composer<Context>();

// Handle the /start command
composer.command("start", async (ctx) => {
  // Check if user is linked (from session or database)
  const isLinked = (ctx.session as any)?.isLinked;

  if (isLinked) {
    // Show main menu for authenticated users
    await ctx.reply(ctx.t("welcome-message"), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: ctx.t("search-button"), callback_data: "search" },
            { text: ctx.t("playlists-button"), callback_data: "playlists" },
          ],
          [{ text: ctx.t("help-button"), callback_data: "help" }],
        ],
      },
    });
  } else {
    // Show unlinked message for unauthenticated users
    const text = `⚠️ Sua conta Shaliah não está vinculada. Abra seu perfil no Shaliah e gere um QR para conectar.

⚠️ Your Shaliah account is not linked. Open your Shaliah profile and generate a QR to connect.`;

    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Shaliah",
              url: `${process.env.SHALIAH_BASE_URL || "https://shaliah.app"}/profile`,
            },
          ],
        ],
      },
    });
  }
});

// Handle callback queries from the welcome menu
composer.callbackQuery("search", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(ctx.t("search-reply"), {
    parse_mode: "Markdown",
  });
});

composer.callbackQuery("playlists", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(ctx.t("playlists-reply"), {
    parse_mode: "Markdown",
  });
});

composer.callbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(ctx.t("help-reply"), {
    parse_mode: "Markdown",
  });
});

// Fallback handler for unrecognized messages
composer.on("message", async (ctx) => {
  // Check if user is linked (from session or database)
  const isLinked = (ctx.session as any)?.isLinked;

  if (isLinked) {
    // Show main menu for authenticated users
    await ctx.reply(ctx.t("welcome-message"), {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: ctx.t("search-button"), callback_data: "search" },
            { text: ctx.t("playlists-button"), callback_data: "playlists" },
          ],
          [{ text: ctx.t("help-button"), callback_data: "help" }],
        ],
      },
    });
  } else {
    // Show unlinked message for unauthenticated users
    const text = `⚠️ Sua conta Shaliah não está vinculada. Abra seu perfil no Shaliah e gere um QR para conectar.

⚠️ Your Shaliah account is not linked. Open your Shaliah profile and generate a QR to connect.`;

    await ctx.reply(text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open Shaliah",
              url: `${process.env.SHALIAH_BASE_URL || "https://shaliah.app"}/profile`,
            },
          ],
        ],
      },
    });
  }
});

export default composer;
