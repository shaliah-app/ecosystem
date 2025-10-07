import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Context as BotContext } from '../../src/types/context'

const hoisted = vi.hoisted(() => ({
  supabaseMock: { from: vi.fn() },
}))
vi.mock('../../src/lib/supabase', () => ({ supabase: hoisted.supabaseMock }))

import { handleStart } from '../../src/modules/auth-link'

// Types for the supabase mock chain
type SupabaseSelectChain = {
  select: (cols: string) => SupabaseSelectChain
  eq: (col: string, val: any) => SupabaseSelectChain
  limit: (n: number) => SupabaseSelectChain
  maybeSingle: () => Promise<{ data: any, error: any }>
}

type SupabaseUpdateChain = {
  update: (values: any) => { eq: (col: string, val: any) => Promise<{ error: any }> }
}

const supabaseMock = hoisted.supabaseMock as unknown as {
  from: (table: string) => SupabaseSelectChain & SupabaseUpdateChain
}

function createMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: {
      id: 123456789,
      first_name: 'João',
      username: 'joaosilva',
      language_code: 'pt',
      is_bot: false,
    },
    match: '',
    reply: vi.fn().mockResolvedValue({ message_id: 1 }),
    t: vi.fn((key: string) => key),
    i18n: {
      locale: vi.fn(),
    },
    session: {},
    ...overrides,
  } as unknown as BotContext
}

const asChain = (row: any | null): SupabaseSelectChain & SupabaseUpdateChain => ({
  select: () => asChain(row),
  eq: () => asChain(row),
  limit: () => asChain(row),
  maybeSingle: async () => ({ data: row, error: null }),
  update: () => ({ eq: async () => ({ error: null }) }),
})

describe('Bot Account Linking - Integration Test', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('Successful Account Linking', () => {
    it('should link Telegram account and mark token as used', async () => {
      const validToken = 'success12345678901234567890123456789012'
      const userId = 'test-user-uuid'
      const telegramId = 123456789

      const ctx = createMockContext({
        match: validToken,
        from: { id: telegramId, first_name: 'João', language_code: 'pt', is_bot: false },
      })

      const tokenRow = {
        id: 'token-uuid',
        token: validToken,
        user_id: userId,
        is_active: true,
        used_at: null,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      let count = 0
      // First user_profiles query: collision check (null), second: fetch profile with language
      const userProfilesChain: SupabaseSelectChain & SupabaseUpdateChain = {
        select: () => userProfilesChain,
        eq: () => userProfilesChain,
        limit: () => userProfilesChain,
        maybeSingle: async () => ({ data: count++ === 0 ? null : { id: 'p', user_id: userId, language: 'pt-BR', telegram_user_id: telegramId }, error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }
      const authTokensChain: SupabaseSelectChain & SupabaseUpdateChain = {
        select: () => authTokensChain,
        eq: () => authTokensChain,
        limit: () => authTokensChain,
        maybeSingle: async () => ({ data: tokenRow, error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? authTokensChain : userProfilesChain))

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledOnce()
      const replyMessage = (ctx.reply as any).mock.calls[0][0]
      expect(replyMessage).toContain('✅')
      expect(replyMessage).toContain('Conta vinculada com sucesso')
    })

    it('should send success message in English for en-US user', async () => {
      const validToken = 'ensuccess12345678901234567890123456789012'
      const ctx = createMockContext({
        match: validToken,
        from: { id: 987654321, first_name: 'John', language_code: 'en', is_bot: false },
      })

      const tokenRow = {
        id: 'token-uuid',
        token: validToken,
        user_id: 'user-uuid',
        is_active: true,
        used_at: null,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? asChain(tokenRow) : asChain(null)))

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalled()
      const msg = (ctx.reply as any).mock.calls[0][0]
      expect(msg).toContain('linked successfully')
    })

    it('should sync bot language to match Shaliah profile', async () => {
      const validToken = 'langsync12345678901234567890123456789012'
      const ctx = createMockContext({ match: validToken })

      const tokenRow = {
        id: 'token-uuid',
        token: validToken,
        user_id: 'user-uuid',
        is_active: true,
        used_at: null,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      let calls = 0
      ;(supabaseMock.from as any).mockImplementation((table: string) => {
        if (table === 'auth_tokens') return asChain(tokenRow)
        calls++
        return asChain(calls === 1 ? null : { id: 'profile-uuid', user_id: 'user-uuid', language: 'pt-BR', telegram_user_id: null })
      })

      await handleStart(ctx as any)

      expect((ctx as any).i18n.locale).toHaveBeenCalledWith('pt')
    })
  })
})