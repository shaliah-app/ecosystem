import { Composer } from 'grammy'
import type { Context } from '../types/context.js'
import { supabase } from '../lib/supabase.js'
import { logger } from '../logger.js'

type AuthTokenRow = {
  id: string
  token: string
  user_id: string
  created_at: string
  expires_at: string
  used_at: string | null
  is_active: boolean
}

type UserProfileRow = {
  id: string
  user_id: string
  language: string | null
  telegram_user_id: number | null
}

function mapShaliahToTelegramLocale(shaliahLocale: string | null | undefined): string {
  if (!shaliahLocale) return 'en'
  const map: Record<string, string> = {
    'pt-BR': 'pt',
    'en-US': 'en',
  }
  return map[shaliahLocale] ?? 'en'
}

async function fetchValidToken(token: string): Promise<AuthTokenRow | null> {
  const { data, error } = await supabase
    .from('auth_tokens')
    .select('*')
    .eq('token', token)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  const row = data as unknown as AuthTokenRow | null
  if (!row) return null

  const now = new Date()
  const expiresAt = new Date(row.expires_at)
  const isValid = row.is_active === true && row.used_at == null && expiresAt > now
  return isValid ? row : { ...row, is_active: false } // mark invalid by convention for callers
}

async function findProfileByTelegramId(telegramUserId: number): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as unknown as UserProfileRow | null) ?? null
}

async function findProfileByUserId(userId: string): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as unknown as UserProfileRow | null) ?? null
}

export const authLinkComposer = new Composer<Context>()

export async function handleStart(ctx: Context): Promise<void> {
  try {
    const token = (ctx as any).match as string | undefined

    // No token: show regular welcome
    if (!token || token.trim().length === 0) {
      await ctx.reply(ctx.t('welcome-message'), { parse_mode: 'Markdown' })
      return
    }

    // Basic token format guard (32+ alphanumeric)
    if (!/^[a-zA-Z0-9]{32,}$/.test(token)) {
      await ctx.reply('❌ Link inválido. Gere um novo no seu perfil Shaliah.')
      return
    }

    // Validate token
    const authToken = await fetchValidToken(token)
    if (!authToken) {
      await ctx.reply('❌ Link inválido. Gere um novo no seu perfil Shaliah.')
      return
    }

    // If fetchValidToken returned a row that doesn't satisfy validity (e.g., expired/used/invalidated)
    if (!(authToken.is_active === true && authToken.used_at == null && new Date(authToken.expires_at) > new Date())) {
      const isExpired = new Date(authToken.expires_at) <= new Date()
      const isUsed = authToken.used_at != null
      if (isExpired) {
        await ctx.reply('⏰ Link expirado. O link é válido por 15 minutos. Gere um novo.')
      } else if (isUsed) {
        await ctx.reply('🔒 Link já utilizado. Faça logout e gere um novo link.')
      } else {
        await ctx.reply('⚠️ Este link foi cancelado. Gere um novo no seu perfil.')
      }
      return
    }

    const telegramId = ctx.from?.id
    if (!telegramId) {
      await ctx.reply('❌ Erro ao processar sua solicitação. Tente novamente.')
      return
    }

    // Collision check: is this Telegram ID linked to a different user?
    const existingByTelegram = await findProfileByTelegramId(telegramId)
    if (existingByTelegram && existingByTelegram.user_id !== authToken.user_id) {
      await ctx.reply('⚠️ Esta conta do Telegram já está vinculada a outro usuário. Faça logout primeiro.')
      return
    }

    // Perform updates (best-effort atomicity; Supabase JS lacks multi-update tx here)
    const { error: linkErr } = await supabase
      .from('user_profiles')
      .update({ telegram_user_id: telegramId })
      .eq('user_id', authToken.user_id)

    if (linkErr) {
      logger.error('Failed to link telegram_user_id', { userId: authToken.user_id, telegramId })
      await ctx.reply('❌ Erro ao processar sua solicitação. Tente novamente.')
      return
    }

    const { error: usedErr } = await supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', authToken.id)

    if (usedErr) {
      logger.error('Failed to mark token used', { tokenId: authToken.id })
      await ctx.reply('❌ Erro ao processar sua solicitação. Tente novamente.')
      return
    }

    // Language sync
    const profile = await findProfileByUserId(authToken.user_id)
    const mapped = mapShaliahToTelegramLocale(profile?.language)
    try {
      // grammY i18n uses setLocale/useLocale depending on version; try both and legacy locale()
      const anyI18n = ctx.i18n as unknown as {
        setLocale?: (l: string) => Promise<void>
        useLocale?: (l: string) => void
        locale?: (l: string) => void
      }
      if (anyI18n.setLocale) {
        await anyI18n.setLocale(mapped)
      }
      if (anyI18n.useLocale) {
        anyI18n.useLocale(mapped)
      }
      if (typeof anyI18n.locale === 'function') {
        anyI18n.locale(mapped)
      }
    } catch {
      // ignore locale errors and continue
    }

    // Success message (basic bilingual support until full i18n keys exist)
    const prefersPt = mapped === 'pt' || (ctx.from?.language_code?.toLowerCase().startsWith('pt') ?? false)
    const successText = prefersPt
      ? '✅ Conta vinculada com sucesso! Seu Telegram agora está conectado.'
      : '✅ Account linked successfully! Your Telegram is now connected.'
    await ctx.reply(successText)

    // Optionally set session flags
    if (ctx.session) {
      ;(ctx.session as any).isLinked = true
      ;(ctx.session as any).shaliahUserId = authToken.user_id
    }

    logger.info('ezer.auth.token_used_success', {
      user_id: authToken.user_id,
      telegram_user_id: telegramId,
      token_id: authToken.id,
    })
  } catch (err) {
    logger.error('ezer.auth.token_used_failure', { error: err instanceof Error ? err.message : String(err) })
    await ctx.reply('❌ Erro ao processar sua solicitação. Tente novamente.')
  }
}

authLinkComposer.command('start', handleStart)

export default authLinkComposer


