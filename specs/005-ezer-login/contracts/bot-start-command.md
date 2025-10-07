# API Contract: Bot Start Command (Token Validation)

**Command**: `/start <token>`  
**Feature**: 005-ezer-login  
**Application**: ezer-bot  
**Date**: 2025-01-16

## Description

Validates an authentication token and links the Telegram user to their Shaliah account. This is triggered when a user opens a Telegram deep link or manually sends `/start <token>` to the bot.

## Authentication

**Required**: Yes  
**Method**: Telegram authentication (Telegram user context)  
**User Context**: `ctx.from.id` (Telegram user ID)

## Request

### Command Format
```
/start <token>
```

### Parameters
- `<token>`: 32-character alphanumeric authentication token

### Example Commands
```
/start a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### Telegram Context
```typescript
interface TelegramContext {
  from: {
    id: number           // Telegram user ID (e.g., 123456789)
    first_name: string   // User's first name
    username?: string    // Telegram username (optional)
    language_code?: string // User's Telegram app language (e.g., 'en', 'pt')
  }
  match: string          // Token extracted from "/start <token>"
}
```

### Example Context
```typescript
{
  from: {
    id: 123456789,
    first_name: "João",
    username: "joaosilva",
    language_code: "pt"
  },
  match: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

## Response

### Success Response

**Message Type**: Telegram text message  
**Language**: User's Shaliah language preference (from user_profiles.language)

**Example Response (Portuguese)**:
```
✅ Conta vinculada com sucesso!

Seu Telegram agora está conectado à sua conta Shaliah. Você pode começar a usar o bot.
```

**Example Response (English)**:
```
✅ Account linked successfully!

Your Telegram is now connected to your Shaliah account. You can start using the bot.
```

**Bot State Changes**:
- User marked as authenticated in bot session
- User's language preference synced from Shaliah

### Error Responses

#### Invalid Token
```
❌ Link inválido

Este link de autenticação não é válido. Por favor, gere um novo link no seu perfil em Shaliah.
```

**Causes**:
- Token does not exist in database
- Token format is invalid (not 32 characters)
- Token contains invalid characters

#### Expired Token
```
⏰ Link expirado

Este link expirou. Os links de autenticação são válidos por apenas 15 minutos.

Por favor, gere um novo link no seu perfil em Shaliah.
```

**Causes**:
- Current time > token.expires_at
- Token was created more than 15 minutes ago

#### Token Already Used
```
🔒 Link já utilizado

Este link já foi usado para vincular uma conta e não pode ser reutilizado.

Se você precisa desvincular e vincular novamente, faça logout no Shaliah e gere um novo link.
```

**Causes**:
- token.used_at is not NULL
- Token was already consumed in a previous /start command

#### Token Invalidated
```
⚠️ Link cancelado

Este link foi cancelado porque um novo link foi gerado.

Use o link mais recente do seu perfil em Shaliah.
```

**Causes**:
- token.is_active = false
- User generated a new token, invalidating this one

#### Telegram Account Already Linked
```
⚠️ Esta conta Telegram já está vinculada

Esta conta Telegram já está vinculada a outra conta Shaliah.

Se você deseja trocar a vinculação, primeiro faça logout na outra conta.
```

**Causes**:
- telegram_user_id already exists in user_profiles table
- Another Shaliah user already linked this Telegram account

#### Database Error
```
❌ Erro ao processar

Ocorreu um erro ao vincular sua conta. Por favor, tente novamente em alguns instantes.

Se o problema persistir, entre em contato com o suporte.
```

**Causes**:
- Database connection failure
- Query timeout
- Constraint violation

## Business Logic

### Pre-conditions
1. User must have opened bot via Telegram deep link or manually entered command
2. Token must be provided (not empty string)
3. Bot must have database connectivity

### Process Flow
1. Extract token from `ctx.match` (grammY provides this automatically)
2. If token is empty:
   - Send regular welcome message (not an error)
   - Exit (this is normal /start without token)
3. Query database for token:
   ```sql
   SELECT * FROM auth_tokens 
   WHERE token = $1 
   LIMIT 1
   ```
4. Validate token:
   - Check `is_active = true`
   - Check `used_at IS NULL`
   - Check `expires_at > now()`
5. Check for Telegram account collision:
   ```sql
   SELECT * FROM user_profiles 
   WHERE telegram_user_id = $2 
   LIMIT 1
   ```
6. If collision: Return error (account already linked)
7. Start database transaction:
   a. Update user_profiles:
      ```sql
      UPDATE user_profiles 
      SET telegram_user_id = $1 
      WHERE user_id = $2
      ```
   b. Mark token as used:
      ```sql
      UPDATE auth_tokens 
      SET used_at = now() 
      WHERE id = $3
      ```
   c. Commit transaction
8. Fetch user's language preference:
   ```sql
   SELECT language FROM user_profiles 
   WHERE user_id = $1
   ```
9. Sync bot language to match Shaliah:
   ```typescript
   await ctx.i18n.locale(mapShaliahToTelegramLocale(profile.language))
   ```
10. Send success message in user's language
11. Update bot session state (mark user as authenticated)

### Post-conditions
1. Token marked as used (used_at timestamp set)
2. User profile linked to Telegram account (telegram_user_id set)
3. Bot language synced to match Shaliah language preference
4. User receives confirmation message
5. Bot session updated with authenticated state

## Performance Requirements

- **Target response time**: < 500ms (p95)
- **Maximum response time**: < 2s (p99)
- **Database queries**: Maximum 4 queries (1 SELECT token, 1 SELECT collision, 2 UPDATEs)

## Security Considerations

### Authentication
- Command can only be executed by authenticated Telegram users
- Bot verifies user owns the Telegram account (ctx.from.id)

### Authorization
- Token can only be used once (one-time use)
- Token expires after 15 minutes
- User cannot link another user's token (user_id from token must match)

### Token Validation
- All validation checks performed before any state changes
- Database transaction ensures atomicity (all-or-nothing)
- No partial linking (either fully linked or not linked at all)

### Data Privacy
- Bot does not log token values (only token IDs)
- User's Telegram ID is not exposed to Shaliah frontend
- Language preference sync is one-way (Shaliah → Bot)

## Side Effects

1. **Database**:
   - Updates `user_profiles.telegram_user_id`
   - Updates `auth_tokens.used_at`

2. **Bot Session**:
   - Sets `ctx.session.isLinked = true`
   - Sets `ctx.session.shaliahUserId = <user_id>`
   - Updates `ctx.i18n.locale()` to match Shaliah language

3. **Audit Log** (future):
   - Logs account linking event with Telegram ID and Shaliah user ID

## Dependencies

### Internal
- grammY framework (command handling, context)
- @grammyjs/i18n (internationalization)
- Supabase PostgreSQL (database access)
- `@yesod/logger` (structured logging)

### External
- Telegram Bot API (message sending)
- PostgreSQL database (user_profiles, auth_tokens tables)

## Related Commands

- `/unlink` - Unlink Telegram account (future)
- `/status` - Check link status (future)

## Validation Rules

### Token Format Validation
```typescript
const tokenSchema = z.string()
  .length(32)
  .regex(/^[a-zA-Z0-9]+$/, 'Token must be alphanumeric')
```

### Telegram User ID Validation
```typescript
const telegramUserIdSchema = z.number()
  .int()
  .positive()
  .max(9223372036854775807) // Max BIGINT
```

### Language Mapping
```typescript
function mapShaliahToTelegramLocale(shaliahLocale: string): string {
  const map: Record<string, string> = {
    'pt-BR': 'pt',
    'en-US': 'en',
  }
  return map[shaliahLocale] || 'en' // Default to English
}
```

## Testing Scenarios

### Happy Path
1. User opens Telegram deep link with valid token
2. Bot validates token successfully
3. Accounts are linked
4. User receives success message in correct language

### Token Expiration
1. User generates token
2. Waits 16 minutes
3. Opens link
4. Bot returns expiration error

### Token Reuse
1. User opens link (first time)
2. Account linked successfully
3. User opens same link again
4. Bot returns "already used" error

### Account Collision
1. User A links Telegram account to Shaliah account A
2. User B tries to link same Telegram account to Shaliah account B
3. Bot returns "already linked" error

### Invalid Token Format
1. User manually types `/start abc123` (only 6 chars)
2. Bot returns invalid token error

### No Token Provided
1. User sends `/start` (no token)
2. Bot sends regular welcome message (not an error)

### Database Error
1. Database is temporarily unavailable
2. Bot returns generic error message
3. Error is logged for investigation

## Implementation Notes

### Bot Composer
```typescript
// apps/ezer-bot/src/modules/auth-link.ts
import { Composer } from 'grammy'
import type { BotContext } from '@/types/context'

export const authLinkComposer = new Composer<BotContext>()

authLinkComposer.command('start', async (ctx) => {
  const token = ctx.match.trim()
  
  // No token = regular start command
  if (!token) {
    return ctx.reply(ctx.t('welcome'))
  }
  
  try {
    // Validate and link account
    await validateAndLinkAccount(ctx, token)
  } catch (error) {
    logger.error('Token validation failed', { error, telegramUserId: ctx.from.id })
    ctx.reply(ctx.t('auth-link-error-generic'))
  }
})
```

### Transaction Handler
```typescript
async function validateAndLinkAccount(ctx: BotContext, token: string) {
  // Validate token format
  if (!isValidTokenFormat(token)) {
    return ctx.reply(ctx.t('auth-link-error-invalid'))
  }
  
  // Fetch token from database
  const authToken = await db.query.authTokens.findFirst({
    where: eq(authTokens.token, token)
  })
  
  // Validate token state
  if (!authToken) {
    return ctx.reply(ctx.t('auth-link-error-invalid'))
  }
  
  if (!authToken.isActive) {
    return ctx.reply(ctx.t('auth-link-error-invalidated'))
  }
  
  if (authToken.usedAt) {
    return ctx.reply(ctx.t('auth-link-error-used'))
  }
  
  if (new Date(authToken.expiresAt) < new Date()) {
    return ctx.reply(ctx.t('auth-link-error-expired'))
  }
  
  // Check for Telegram account collision
  const existingLink = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.telegramUserId, ctx.from.id)
  })
  
  if (existingLink) {
    return ctx.reply(ctx.t('auth-link-error-collision'))
  }
  
  // Link accounts (transaction)
  await db.transaction(async (tx) => {
    // Link Telegram account
    await tx.update(userProfiles)
      .set({ telegramUserId: ctx.from.id })
      .where(eq(userProfiles.userId, authToken.userId))
    
    // Mark token as used
    await tx.update(authTokens)
      .set({ usedAt: new Date() })
      .where(eq(authTokens.id, authToken.id))
  })
  
  // Sync language
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, authToken.userId)
  })
  
  if (profile?.language) {
    await ctx.i18n.locale(mapShaliahToTelegramLocale(profile.language))
  }
  
  // Send success message
  ctx.reply(ctx.t('auth-link-success'))
}
```

## Fluent Translation Keys

```fluent
# apps/ezer-bot/src/locales/pt-BR.ftl
auth-link-success = ✅ Conta vinculada com sucesso!\n\nSeu Telegram agora está conectado à sua conta Shaliah. Você pode começar a usar o bot.

auth-link-error-invalid = ❌ Link inválido\n\nEste link de autenticação não é válido. Por favor, gere um novo link no seu perfil em Shaliah.

auth-link-error-expired = ⏰ Link expirado\n\nEste link expirou. Os links de autenticação são válidos por apenas 15 minutos.\n\nPor favor, gere um novo link no seu perfil em Shaliah.

auth-link-error-used = 🔒 Link já utilizado\n\nEste link já foi usado para vincular uma conta e não pode ser reutilizado.\n\nSe você precisa desvincular e vincular novamente, faça logout no Shaliah e gere um novo link.

auth-link-error-invalidated = ⚠️ Link cancelado\n\nEste link foi cancelado porque um novo link foi gerado.\n\nUse o link mais recente do seu perfil em Shaliah.

auth-link-error-collision = ⚠️ Esta conta Telegram já está vinculada\n\nEsta conta Telegram já está vinculada a outra conta Shaliah.\n\nSe você deseja trocar a vinculação, primeiro faça logout na outra conta.

auth-link-error-generic = ❌ Erro ao processar\n\nOcorreu um erro ao vincular sua conta. Por favor, tente novamente em alguns instantes.\n\nSe o problema persistir, entre em contato com o suporte.

# apps/ezer-bot/src/locales/en.ftl
auth-link-success = ✅ Account linked successfully!\n\nYour Telegram is now connected to your Shaliah account. You can start using the bot.

auth-link-error-invalid = ❌ Invalid link\n\nThis authentication link is not valid. Please generate a new link in your Shaliah profile.

auth-link-error-expired = ⏰ Link expired\n\nThis link has expired. Authentication links are valid for only 15 minutes.\n\nPlease generate a new link in your Shaliah profile.

auth-link-error-used = 🔒 Link already used\n\nThis link has already been used to link an account and cannot be reused.\n\nIf you need to unlink and link again, sign out from Shaliah and generate a new link.

auth-link-error-invalidated = ⚠️ Link canceled\n\nThis link was canceled because a new link was generated.\n\nUse the most recent link from your Shaliah profile.

auth-link-error-collision = ⚠️ This Telegram account is already linked\n\nThis Telegram account is already linked to another Shaliah account.\n\nIf you want to change the link, first sign out from the other account.

auth-link-error-generic = ❌ Processing error\n\nAn error occurred while linking your account. Please try again in a few moments.\n\nIf the problem persists, contact support.
```

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-16 | 1.0.0 | Initial contract definition |

---

**Status**: Draft  
**Reviewers**: Bot team, Backend team, Security team  
**Approved By**: N/A (pending implementation)
