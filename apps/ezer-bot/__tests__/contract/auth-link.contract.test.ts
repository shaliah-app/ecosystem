/**
 * Contract Test: Bot Start Command (Token Validation)
 * 
 * Feature: 005-ezer-login
 * Application: ezer-bot
 * Status: FAILING (no implementation yet)
 * 
 * Purpose: Validate bot /start command contract for token validation and account linking
 * Uses grammY mock context pattern for testing without real Telegram API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Context as BotContext } from '../../src/types/context'

const hoisted = vi.hoisted(() => ({
  supabaseMock: { from: vi.fn() },
}))
vi.mock('../../src/lib/supabase', () => ({ supabase: hoisted.supabaseMock }))

import { handleStart } from '../../src/modules/auth-link'

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
      first_name: 'Test',
      username: 'testuser',
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

describe('/start command - Contract Test', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  it('should link account and send success message in Portuguese', async () => {
    const validToken = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'
    const ctx = createMockContext({ match: validToken, from: { id: 123456789, first_name: 'João', username: 'joaosilva', language_code: 'pt', is_bot: false } as any })

    const authTokenRow = {
      id: 'token-uuid', token: validToken, user_id: 'user-uuid', is_active: true, used_at: null,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), created_at: new Date().toISOString(),
    }
    const userProfilesChain: SupabaseSelectChain & SupabaseUpdateChain = {
      select: () => userProfilesChain, eq: () => userProfilesChain, limit: () => userProfilesChain,
      maybeSingle: async () => ({ data: null, error: null }), update: () => ({ eq: async () => ({ error: null }) }),
    }
    const authTokensChain: SupabaseSelectChain & SupabaseUpdateChain = {
      select: () => authTokensChain, eq: () => authTokensChain, limit: () => authTokensChain,
      maybeSingle: async () => ({ data: authTokenRow, error: null }), update: () => ({ eq: async () => ({ error: null }) }),
    }
    ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? authTokensChain : userProfilesChain))

    await handleStart(ctx as any)

    expect(ctx.reply).toHaveBeenCalledOnce()
    const replyMessage = (ctx.reply as any).mock.calls[0][0]
    expect(replyMessage).toContain('vinculada com sucesso')
  })

  it('should link account and send success message in English', async () => {
    const validToken = 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7'
    const ctx = createMockContext({ match: validToken, from: { id: 987654321, first_name: 'John', username: 'johnsmith', language_code: 'en', is_bot: false } as any })

    const authTokenRow = {
      id: 'token-uuid-2', token: validToken, user_id: 'user-uuid-2', is_active: true, used_at: null,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), created_at: new Date().toISOString(),
    }
    const userProfilesChain: SupabaseSelectChain & SupabaseUpdateChain = {
      select: () => userProfilesChain, eq: () => userProfilesChain, limit: () => userProfilesChain,
      maybeSingle: async () => ({ data: null, error: null }), update: () => ({ eq: async () => ({ error: null }) }),
    }
    const authTokensChain: SupabaseSelectChain & SupabaseUpdateChain = {
      select: () => authTokensChain, eq: () => authTokensChain, limit: () => authTokensChain,
      maybeSingle: async () => ({ data: authTokenRow, error: null }), update: () => ({ eq: async () => ({ error: null }) }),
    }
    ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? authTokensChain : userProfilesChain))

    await handleStart(ctx as any)

    expect(ctx.reply).toHaveBeenCalledOnce()
    const replyMessage = (ctx.reply as any).mock.calls[0][0]
    expect(replyMessage).toContain('linked successfully')
  })

  it('should reject token with invalid format', async () => {
    const invalidFormatToken = 'abc123'
    const ctx = createMockContext({ match: invalidFormatToken })
    await handleStart(ctx as any)
    expect(ctx.reply).toHaveBeenCalled()
    const replyMessage = (ctx.reply as any).mock.calls[0][0]
    expect(replyMessage).toContain('inválido')
  })
})
