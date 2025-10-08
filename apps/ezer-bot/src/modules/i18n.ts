import { I18n } from "@grammyjs/i18n";
import type { Context } from "../types/context";

export const i18n = new I18n<Context>({
  defaultLocale: "pt_BR",
  directory: "src/locales", // relative to the bot.ts file
  globalTranslationContext(ctx) {
    return {
      first_name: ctx.from?.first_name ?? "there",
    };
  },
});