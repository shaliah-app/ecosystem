import { env } from "../../lib/env";
import type { Context } from "../../types/context";

const GENERATE_TOKEN_URL = `${env.shaliah.baseUrl}/profile`;

const openShaliahButtonMarkup = {
  reply_markup: {
    inline_keyboard: [[{ text: "Open Shaliah", url: GENERATE_TOKEN_URL }]],
  },
};

export async function noTokenMessage(ctx: Context) {
  return await ctx.reply(ctx.t("auth-link-unlinked"), openShaliahButtonMarkup);
}

export async function generateNewTokenMessage(ctx: Context) {
  return await ctx.reply(
    ctx.t("auth-link-generate-new"),
    openShaliahButtonMarkup
  );
}
