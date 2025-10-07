import { describe, it, expect, beforeEach, vi } from 'vitest'
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

describe('Bot Token Rejection - Integration Test', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  describe('Expired Token Rejection', () => {
    it('should reject token that has expired', async () => {
      const expiredToken = 'expired12345678901234567890123456789012'
      const ctx = createMockContext({ match: expiredToken })

      const expiredRow = {
        id: 'expired-token-uuid',
        token: expiredToken,
        user_id: 'user-uuid',
        is_active: true,
        used_at: null,
        expires_at: new Date(Date.now() - 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? asChain(expiredRow) : asChain(null)))

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledOnce()
      const replyMessage = (ctx.reply as any).mock.calls[0][0]
      expect(replyMessage).toContain('⏰')
      expect(replyMessage).toContain('expirado')
    })

    it('should reject token expired by exactly 1 second', async () => {
      const barelyExpiredToken = 'barelyexpired12345678901234567890123456789012'
      const ctx = createMockContext({ match: barelyExpiredToken })

      const expiredAt = new Date(Date.now() - 1000)
      const row = {
        id: 'barely-expired-token-uuid',
        token: barelyExpiredToken,
        user_id: 'user-uuid',
        is_active: true,
        used_at: null,
        expires_at: expiredAt.toISOString(),
        created_at: new Date().toISOString(),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? asChain(row) : asChain(null)))

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('expirado'))
    })

    it('should accept token that expires in future', async () => {
      const validToken = 'stillvalid12345678901234567890123456789012'
      const ctx = createMockContext({ match: validToken })

      const expiresAt = new Date(Date.now() + 1000)
      const tokenRow = {
        id: 'still-valid-token-uuid',
        token: validToken,
        user_id: 'user-uuid',
        is_active: true,
        used_at: null,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => {
        if (table === 'auth_tokens') return asChain(tokenRow)
        return asChain(null)
      })

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('vinculada com sucesso'))
    })
  })

  describe('Already Used Token Rejection', () => {
    it('should reject token that has already been used', async () => {
      const usedToken = 'used12345678901234567890123456789012'
      const ctx = createMockContext({ match: usedToken })

      const usedAt = new Date(Date.now() - 5 * 60 * 1000)
      const row = {
        id: 'used-token-uuid',
        token: usedToken,
        user_id: 'user-uuid',
        is_active: true,
        used_at: usedAt.toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? asChain(row) : asChain(null)))

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('já utilizado'))
    })
  })

  describe('Invalid Token Format Rejection', () => {
    it('should reject token that is too short', async () => {
      const shortToken = 'short123'
      const ctx = createMockContext({ match: shortToken })
      ;(supabaseMock.from as any).mockImplementation(() => asChain(null))
      await handleStart(ctx as any)
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('inválido'))
    })

    it('should reject token with invalid characters', async () => {
      const invalidToken = 'invalid@#$%^&*()1234567890123456789012'
      const ctx = createMockContext({ match: invalidToken })
      ;(supabaseMock.from as any).mockImplementation(() => asChain(null))
      await handleStart(ctx as any)
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('inválido'))
    })
  })

  describe('Telegram Account Collision Rejection', () => {
    it('should reject linking when Telegram account already linked to another user', async () => {
      const validToken = 'collision12345678901234567890123456789012'
      const ctx = createMockContext({ match: validToken })

      const tokenRow = {
        id: 'token-uuid',
        token: validToken,
        user_id: 'user-uuid-1',
        is_active: true,
        used_at: null,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      const existingProfile = {
        id: 'profile-uuid-2',
        user_id: 'user-uuid-2',
        telegram_user_id: 123456789,
        language: 'pt-BR',
      }
      let count = 0
      ;(supabaseMock.from as any).mockImplementation((table: string) => {
        if (table === 'auth_tokens') return asChain(tokenRow)
        count++
        return asChain(count === 1 ? existingProfile : null)
      })

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledOnce()
      const replyMessage = (ctx.reply as any).mock.calls[0][0]
      expect(replyMessage).toContain('⚠️')
      expect(replyMessage).toContain('já está vinculada')
    })
  })

  describe('Invalidated Token Rejection', () => {
    it('should reject token that was invalidated by new token generation', async () => {
      const invalidatedToken = 'invalidated12345678901234567890123456789012'
      const ctx = createMockContext({ match: invalidatedToken })

      const invalidatedRow = {
        id: 'invalidated-token-uuid',
        token: invalidatedToken,
        user_id: 'user-uuid',
        is_active: false,
        used_at: null,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? asChain(invalidatedRow) : asChain(null)))

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('cancelado'))
    })
  })

  describe('Non-existent Token Rejection', () => {
    it('should reject token that does not exist in database', async () => {
      const nonexistentToken = 'nonexistent12345678901234567890123456789012'
      const ctx = createMockContext({ match: nonexistentToken })
      ;(supabaseMock.from as any).mockImplementation((table: string) => (table === 'auth_tokens' ? asChain(null) : asChain(null)))
      await handleStart(ctx as any)
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('inválido'))
    })
  })

  describe('Database Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const validToken = 'dberror12345678901234567890123456789012'
      const ctx = createMockContext({ match: validToken })

      const erroringChain: SupabaseSelectChain & SupabaseUpdateChain = {
        select: () => erroringChain,
        eq: () => erroringChain,
        limit: () => erroringChain,
        maybeSingle: async () => { throw new Error('Connection timeout') },
        update: () => ({ eq: async () => ({ error: null }) }),
      }
      ;(supabaseMock.from as any).mockImplementation(() => erroringChain)

      await handleStart(ctx as any)

      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Erro ao processar'))
    })
  })
})