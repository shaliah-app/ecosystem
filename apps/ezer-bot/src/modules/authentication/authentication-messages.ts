import { env } from "../../lib/env";
import type { Context } from "../../types/context";

export async function noTokenMessage(ctx: Context) {
  return await ctx.reply(ctx.t("auth-link-unlinked"), {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Open Shaliah", url: `${env.shaliah.baseUrl}/profile` }],
      ],
    },
  });
}
