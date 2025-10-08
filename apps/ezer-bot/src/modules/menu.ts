import type { Context } from "../types/context.js";
import { Composer } from "grammy";

const composer = new Composer<Context>();

composer.on("message", async (ctx) => {
  await ctx.reply(ctx.t("welcome-message"), {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: ctx.t("search-button"), callback_data: "search" },
          { text: ctx.t("playlists-button"), callback_data: "playlists" },
        ],
        [
          { text: ctx.t("help-button"), callback_data: "help" },
          { text: ctx.t("unlink-button"), callback_data: "unlink" },
        ],
      ],
    },
  });
});

// Handle callback queries from the welcome menu
composer.callbackQuery("search", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t("search-reply"), {
    parse_mode: "Markdown",
  });
});

composer.callbackQuery("playlists", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t("playlists-reply"), {
    parse_mode: "Markdown",
  });
});

composer.callbackQuery("help", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(ctx.t("help-reply"), {
    parse_mode: "Markdown",
  });
});

export default composer;
