import { Composer } from "grammy";
import type { Context } from "../types/context.js";
import { supabase } from "../lib/supabase.js";
import { logger } from "../logger.js";
import { env } from "../lib/env.js";

type AuthTokenRow = {
  id: string;
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  is_active: boolean;
};

type UserProfileRow = {
  id: string;
  user_id: string;
  language: string | null;
  telegram_user_id: number | null;
};

function mapShaliahToTelegramLocale(
  shaliahLocale: string | null | undefined,
): string {
  if (!shaliahLocale) return "en";
  const map: Record<string, string> = {
    "pt-BR": "pt",
    "en-US": "en",
  };
  return map[shaliahLocale] ?? "en";
}

async function fetchValidToken(token: string): Promise<AuthTokenRow | null> {
  const { data, error } = await supabase
    .from("auth_tokens")
    .select("*")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const row = data as unknown as AuthTokenRow | null;
  if (!row) return null;

  const now = new Date();
  const expiresAt = new Date(row.expires_at);
  const isValid =
    row.is_active === true && row.used_at == null && expiresAt > now;
  return isValid ? row : { ...row, is_active: false }; // mark invalid by convention for callers
}

async function findProfileByTelegramId(
  telegramUserId: number,
): Promise<UserProfileRow | null> {
  logger.info("findProfileByTelegramId called", { telegramUserId });

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .limit(1)
    .maybeSingle();

  logger.info("findProfileByTelegramId result", {
    telegramUserId,
    data,
    error: error?.message,
    hasData: !!data,
  });

  if (error) throw error;
  return (data as unknown as UserProfileRow | null) ?? null;
}

async function findProfileByUserId(
  userId: string,
): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as UserProfileRow | null) ?? null;
}

export const authLinkComposer = new Composer<Context>();

async function replySafe(
  ctx: Context,
  text: string,
  extra?: Parameters<Context["reply"]>[1],
): Promise<boolean> {
  try {
    await ctx.reply(text, extra as any);
    return true;
  } catch (err: any) {
    logger.error("telegram.sendMessage_failed", {
      method: "sendMessage",
      error: err?.message ?? String(err),
      description: err?.description,
      parameters: err?.parameters,
    });
    return false;
  }
}

export async function handleStart(ctx: Context): Promise<void> {
  let authToken: any = null;

  try {
    const token = (ctx as any).match as string | undefined;

    // No token: let other handlers (welcome.ts) handle this case
    if (!token || token.trim().length === 0) {
      return;
    }

    // Basic token format guard (32+ alphanumeric)
    if (!/^[a-zA-Z0-9]{32,}$/.test(token)) {
      await replySafe(
        ctx,
        "❌ Link inválido. Gere um novo no seu perfil Shaliah.",
      );
      return;
    }

    // Validate token
    authToken = await fetchValidToken(token);
    if (!authToken) {
      await replySafe(
        ctx,
        "❌ Link inválido. Gere um novo no seu perfil Shaliah.",
      );
      return;
    }

    // If fetchValidToken returned a row that doesn't satisfy validity (e.g., expired/used/invalidated)
    if (
      !(
        authToken.is_active === true &&
        authToken.used_at == null &&
        new Date(authToken.expires_at) > new Date()
      )
    ) {
      const isExpired = new Date(authToken.expires_at) <= new Date();
      const isUsed = authToken.used_at != null;
      if (isExpired) {
        await replySafe(
          ctx,
          "⏰ Link expirado. O link é válido por 15 minutos. Gere um novo.",
        );
      } else if (isUsed) {
        await replySafe(
          ctx,
          "🔒 Link já utilizado. Faça logout e gere um novo link.",
        );
      } else {
        await replySafe(
          ctx,
          "⚠️ Este link foi cancelado. Gere um novo no seu perfil.",
        );
      }
      return;
    }

    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await replySafe(
        ctx,
        "❌ Erro ao processar sua solicitação. Tente novamente.",
      );
      return;
    }

    // Check if this Telegram account is already linked
    const existingByTelegram = await findProfileByTelegramId(telegramId);

    logger.info("Checking Telegram account status", {
      telegramId,
      authTokenUserId: authToken.user_id,
      existingUserId: existingByTelegram?.id,
      isLinked: !!existingByTelegram,
    });

    // If already linked to the same user, just send success message and show main menu
    if (existingByTelegram && existingByTelegram.id === authToken.user_id) {
      logger.info(
        "Telegram account already linked to same user - showing main menu",
        {
          telegramId,
          userId: authToken.user_id,
        },
      );
      // Show already linked message with main menu
      await replySafe(
        ctx,
        "✅ Sua conta já está vinculada! Você pode usar o Ezer bot normalmente.",
        {
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
        },
      );
      return;
    }

    // If linked to a different user, prevent linking
    if (existingByTelegram && existingByTelegram.id !== authToken.user_id) {
      logger.warn("Telegram account linked to different user", {
        telegramId,
        authTokenUserId: authToken.user_id,
        existingUserId: existingByTelegram.id,
      });
      await replySafe(
        ctx,
        "⚠️ Esta conta do Telegram já está vinculada a outro usuário. Faça logout primeiro.",
      );
      return;
    }

    // Perform updates (best-effort atomicity; Supabase JS lacks multi-update tx here)
    logger.info("Attempting to link Telegram account", {
      userId: authToken.user_id,
      telegramId,
      tokenId: authToken.id,
    });

    const { error: linkErr } = await supabase
      .from("user_profiles")
      .update({ telegram_user_id: telegramId })
      .eq("id", authToken.user_id);

    if (linkErr) {
      logger.error("Failed to link telegram_user_id", {
        userId: authToken.user_id,
        telegramId,
        error: linkErr.message,
        details: linkErr.details,
        hint: linkErr.hint,
        code: linkErr.code,
      });
      await replySafe(
        ctx,
        "❌ Erro ao processar sua solicitação. Tente novamente.",
      );
      return;
    }

    logger.info("Successfully linked Telegram account", {
      userId: authToken.user_id,
      telegramId,
    });

    // Mark token as used (best effort - don't fail if already used)
    try {
      await supabase
        .from("auth_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", authToken.id)
        .eq("is_active", true)
        .is("used_at", null);
    } catch (usedErr) {
      // Don't fail the flow if token marking fails
      logger.warn("Failed to mark token as used", {
        tokenId: authToken.id,
        error: usedErr instanceof Error ? usedErr.message : "Unknown error",
      });
    }

    // Language sync
    const profile = await findProfileByUserId(authToken.user_id);
    const mapped = mapShaliahToTelegramLocale(profile?.language);
    try {
      // grammY i18n uses setLocale/useLocale depending on version; try both and legacy locale()
      const anyI18n = ctx.i18n as unknown as {
        setLocale?: (l: string) => Promise<void>;
        useLocale?: (l: string) => void;
        locale?: (l: string) => void;
      };
      if (anyI18n.setLocale) {
        await anyI18n.setLocale(mapped);
      }
      if (anyI18n.useLocale) {
        anyI18n.useLocale(mapped);
      }
      if (typeof anyI18n.locale === "function") {
        anyI18n.locale(mapped);
      }
    } catch {
      // ignore locale errors and continue
    }

    // Success message (basic bilingual support until full i18n keys exist)
    const prefersPt =
      mapped === "pt" ||
      (ctx.from?.language_code?.toLowerCase().startsWith("pt") ?? false);
    const successText = prefersPt
      ? "✅ Conta vinculada com sucesso! Seu Telegram agora está conectado."
      : "✅ Account linked successfully! Your Telegram is now connected.";

    // Show success message with main menu
    await replySafe(ctx, successText, {
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

    // Optionally set session flags
    if (ctx.session) {
      (ctx.session as any).isLinked = true;
      (ctx.session as any).shaliahUserId = authToken.user_id;
    }

    logger.info("ezer.auth.token_used_success", {
      user_id: authToken.user_id,
      telegram_user_id: telegramId,
      token_id: authToken.id,
    });
  } catch (err) {
    logger.error("ezer.auth.token_used_failure", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      userId: authToken?.user_id,
      telegramId: ctx.from?.id,
    });
    try {
      await replySafe(
        ctx,
        "❌ Erro ao processar sua solicitação. Tente novamente.",
      );
    } catch {
      // already logged by replySafe
    }
  }
}

authLinkComposer.command("start", handleStart);

export default authLinkComposer;

// Middleware: Detect unlinked accounts and gently prompt once
export const unlinkedDetectionComposer = new Composer<Context>();

unlinkedDetectionComposer.use(async (ctx, next) => {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      return next();
    }

    const profile = await findProfileByTelegramId(telegramId);
    const isLinked = !!profile?.telegram_user_id;

    // Persist lightweight session flags if session is available
    if (ctx.session) {
      (ctx.session as any).isLinked = isLinked;
    }

    if (!isLinked) {
      const alreadyWarned = Boolean((ctx.session as any)?.unlinkedPromptShown);
      if (!alreadyWarned) {
        // Log unlinked access attempt
        logger.info("ezer.auth.unlinked_access", {
          telegram_user_id: telegramId,
        });

        const text = `⚠️ Sua conta Shaliah não está vinculada. Abra seu perfil no Shaliah e gere um QR para conectar.

⚠️ Your Shaliah account is not linked. Open your Shaliah profile and generate a QR to connect.`;
        await replySafe(ctx, text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Open Shaliah", url: `${env.shaliah.baseUrl}/profile` }],
            ],
          },
        });
        if (ctx.session) {
          (ctx.session as any).unlinkedPromptShown = true;
        }
      }
    } else {
      // Reset the one-time prompt flag after successful link
      if (ctx.session && (ctx.session as any).unlinkedPromptShown) {
        (ctx.session as any).unlinkedPromptShown = false;
      }
    }
  } catch (err) {
    logger.warn("ezer.auth.unlinked_detection_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  await next();
});
