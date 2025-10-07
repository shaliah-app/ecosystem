# Data Model: Ezer Bot Authentication Link

**Feature**: 005-ezer-login  
**Date**: 2025-01-16  
**Status**: Complete

## Overview

This feature introduces two data entities:
1. **AuthToken** - New entity for time-limited authentication tokens
2. **UserProfile** - Extended entity with Telegram account linkage

## Entity Definitions

### 1. AuthToken

**Purpose**: Represents a time-limited authentication token used to link a Shaliah user account to a Telegram bot account.

**Table**: `auth_tokens`

**Schema**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the token record |
| `token` | TEXT | NOT NULL, UNIQUE | The actual authentication token (32-char alphanumeric) |
| `user_id` | UUID | NOT NULL, FOREIGN KEY → auth.users(id) ON DELETE CASCADE | Reference to the Shaliah user who owns this token |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | When the token was generated |
| `expires_at` | TIMESTAMPTZ | NOT NULL | When the token expires (15 minutes after creation) |
| `used_at` | TIMESTAMPTZ | NULL | When the token was consumed (NULL = unused) |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Soft delete flag (false = invalidated) |

**Indexes**:
- `idx_auth_tokens_token` ON `token` - Fast token lookups for validation
- `idx_auth_tokens_user_id` ON `user_id` - User-scoped queries
- `idx_auth_tokens_expires_at` ON `expires_at` WHERE `is_active = true` - Cleanup queries

**Relationships**:
- **Belongs to User** (Many-to-One): Each token belongs to exactly one user
- Cascade delete: If user is deleted, all their tokens are deleted

**Validation Rules**:

1. **Token Format**:
   - Must be exactly 32 characters
   - Alphanumeric only (a-z, A-Z, 0-9)
   - Generated via `crypto.randomUUID()` with hyphens removed

2. **Expiration**:
   - `expires_at` must be > `created_at`
   - Default: `created_at + 15 minutes`
   - Cannot be extended once created

3. **One-Time Use**:
   - `used_at` can only be set once (NULL → timestamp transition)
   - Once `used_at` is set, token cannot be reused

4. **Active State**:
   - New tokens: `is_active = true`
   - When user generates new token: old tokens set `is_active = false`
   - Soft delete: `is_active = false` prevents use but preserves audit trail

**State Transitions**:

```
CREATED (is_active=true, used_at=NULL)
   ↓
   ├─→ EXPIRED (expires_at < now()) → Terminal state
   ├─→ USED (used_at != NULL) → Terminal state
   └─→ INVALIDATED (is_active=false) → Terminal state
```

**State Transition Rules**:
- **CREATED → EXPIRED**: Automatic (time-based), no state change in DB
- **CREATED → USED**: Via bot command handler, sets `used_at = now()`
- **CREATED → INVALIDATED**: Via user generating new token, sets `is_active = false`
- All transitions are one-way (no going back)

**Business Logic**:

```typescript
// Token is valid if ALL of these are true:
function isTokenValid(token: AuthToken): boolean {
  return (
    token.is_active === true &&
    token.used_at === null &&
    new Date(token.expires_at) > new Date()
  )
}
```

**Domain Invariants**:
1. A user can have multiple tokens, but only one ACTIVE token at a time
2. Token generation invalidates all previous active tokens for that user
3. Expired tokens are never deleted (audit trail)
4. Used tokens cannot be reused (prevents replay attacks)

---

### 2. UserProfile (Extended)

**Purpose**: Links a Shaliah user to their Telegram account.

**Table**: `user_profiles` (existing table, add new column)

**New Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `telegram_user_id` | BIGINT | NULL, UNIQUE | Telegram's numeric user ID (64-bit integer) |

**Indexes**:
- `idx_user_profiles_telegram_user_id` ON `telegram_user_id` - Fast reverse lookups from bot

**Relationships**:
- **One-to-One with Telegram Account**: Each Shaliah user can link to exactly one Telegram account
- **One-to-One with User**: Each user_profile belongs to one auth.users record

**Validation Rules**:

1. **Telegram User ID Format**:
   - Must be positive 64-bit integer (Telegram IDs are always positive)
   - Range: 1 to 9,223,372,036,854,775,807 (max BIGINT)
   - Examples: `123456789`, `987654321`

2. **Uniqueness**:
   - One Telegram account can only be linked to one Shaliah account
   - Attempting to link already-linked Telegram account returns error

3. **Nullability**:
   - NULL = User has not linked their Telegram account
   - NOT NULL = User has an active link to Telegram

**State Transitions**:

```
UNLINKED (telegram_user_id = NULL)
   ↓
LINKED (telegram_user_id = <telegram_id>)
   ↓
UNLINKED (telegram_user_id = NULL)
   ↓
[cycle repeats - user can re-link after signing out]
```

**State Transition Rules**:
- **UNLINKED → LINKED**: Via bot `/start <token>` command
- **LINKED → UNLINKED**: Via Shaliah sign-out action
- Bidirectional: User can link/unlink multiple times

**Business Logic**:

```typescript
// User is linked if telegram_user_id is not null
function isUserLinkedToTelegram(profile: UserProfile): boolean {
  return profile.telegram_user_id !== null
}

// Check if Telegram account is already linked to another user
async function isTelegramAccountAlreadyLinked(telegramUserId: bigint): Promise<boolean> {
  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.telegramUserId, telegramUserId)
  })
  return existingProfile !== null
}
```

**Domain Invariants**:
1. If `telegram_user_id` is not NULL, it must reference an active Telegram account
2. No two user_profiles can have the same `telegram_user_id`
3. Setting `telegram_user_id = NULL` (unlink) is always allowed
4. User can re-link to same or different Telegram account after unlinking

---

## Relationships Diagram

```
┌─────────────────┐
│   auth.users    │
│  (Supabase)     │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐
│  auth_tokens    │
│  - token        │
│  - expires_at   │
│  - used_at      │
└─────────────────┘

         │ 1:1
         ▼
┌──────────────────────┐
│  user_profiles       │
│  - full_name         │
│  - language          │
│  - telegram_user_id  │◄─── NEW FIELD
└──────────────────────┘
```

**Key Relationships**:
1. One User → Many AuthTokens (but only one ACTIVE at a time)
2. One User → One UserProfile (1:1 via user_id foreign key)
3. One UserProfile → One Telegram Account (1:1 via telegram_user_id uniqueness)

---

## Entity Lifecycle Examples

### Example 1: Happy Path (Link Account)

```typescript
// 1. User visits profile page
const user = await getCurrentUser() // user.id = 'abc-123'

// 2. Generate token
const token = generateAuthToken() // 'def456ghi789...'
const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

await db.insert(authTokens).values({
  token,
  userId: user.id,
  expiresAt,
})
// State: CREATED (is_active=true, used_at=NULL)

// 3. User scans QR code, opens bot
// Bot receives: /start def456ghi789...

// 4. Bot validates token
const authToken = await db.query.authTokens.findFirst({
  where: eq(authTokens.token, 'def456ghi789...')
})

if (isTokenValid(authToken)) {
  // 5. Link accounts
  await db.update(userProfiles)
    .set({ telegramUserId: ctx.from.id }) // 123456789
    .where(eq(userProfiles.userId, authToken.userId))
  
  // 6. Mark token as used
  await db.update(authTokens)
    .set({ usedAt: new Date() })
    .where(eq(authTokens.id, authToken.id))
  // State: USED (used_at set)
  
  ctx.reply('✅ Account linked successfully!')
}
```

**Final State**:
- `auth_tokens`: `used_at = 2025-01-16 14:35:00`, `is_active = true`
- `user_profiles`: `telegram_user_id = 123456789`

---

### Example 2: Token Expiration

```typescript
// 1. User generates token at 14:00:00
const token = generateAuthToken()
const expiresAt = new Date('2025-01-16 14:15:00') // +15 minutes

await db.insert(authTokens).values({
  token,
  userId: user.id,
  expiresAt,
})

// 2. User tries to use token at 14:16:00 (16 minutes later)
const authToken = await db.query.authTokens.findFirst({
  where: eq(authTokens.token, token)
})

if (isTokenValid(authToken)) {
  // This block does NOT execute
} else {
  // Token expired (14:16:00 > 14:15:00)
  ctx.reply('❌ This link has expired. Please generate a new one.')
}
```

**Final State**:
- `auth_tokens`: `used_at = NULL`, `is_active = true` (but expired)
- `user_profiles`: `telegram_user_id = NULL` (not linked)

---

### Example 3: Generate New Token (Invalidate Old)

```typescript
// 1. User has existing active token
const existingToken = await db.query.authTokens.findFirst({
  where: and(
    eq(authTokens.userId, user.id),
    eq(authTokens.isActive, true),
    isNull(authTokens.usedAt),
  )
})

// 2. User clicks "Generate new QR code"
// First, invalidate old token
if (existingToken) {
  await db.update(authTokens)
    .set({ isActive: false })
    .where(eq(authTokens.id, existingToken.id))
  // Old token state: INVALIDATED (is_active=false)
}

// 3. Create new token
const newToken = generateAuthToken()
await db.insert(authTokens).values({
  token: newToken,
  userId: user.id,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
})
// New token state: CREATED (is_active=true)
```

**Final State**:
- Old token: `is_active = false`, `used_at = NULL`
- New token: `is_active = true`, `used_at = NULL`
- User can only use new token

---

### Example 4: Sign Out (Unlink)

```typescript
// 1. User is linked
const profile = await db.query.userProfiles.findFirst({
  where: eq(userProfiles.userId, user.id)
})
// profile.telegram_user_id = 123456789

// 2. User clicks "Sign Out" in Shaliah
await db.update(userProfiles)
  .set({ telegramUserId: null })
  .where(eq(userProfiles.userId, user.id))

// 3. Next bot interaction
const updatedProfile = await db.query.userProfiles.findFirst({
  where: eq(userProfiles.telegramUserId, 123456789)
})
// updatedProfile = null (no longer linked)

ctx.reply('⚠️ Your Shaliah account is no longer linked. Use /start to link again.')
```

**Final State**:
- `user_profiles`: `telegram_user_id = NULL` (unlinked)
- All auth_tokens remain unchanged (audit trail preserved)

---

## Data Integrity Constraints

### Database-Level Constraints

1. **Foreign Key Constraint**:
   ```sql
   CONSTRAINT auth_tokens_user_id_fkey 
     FOREIGN KEY (user_id) REFERENCES auth.users(id) 
     ON DELETE CASCADE
   ```

2. **Unique Constraints**:
   ```sql
   CONSTRAINT auth_tokens_token_key UNIQUE (token)
   CONSTRAINT user_profiles_telegram_user_id_key UNIQUE (telegram_user_id)
   ```

3. **Not Null Constraints**:
   ```sql
   CHECK (token IS NOT NULL)
   CHECK (user_id IS NOT NULL)
   CHECK (created_at IS NOT NULL)
   CHECK (expires_at IS NOT NULL)
   CHECK (is_active IS NOT NULL)
   ```

4. **Check Constraints** (optional, can be added):
   ```sql
   -- Ensure expiration is in the future at creation time
   CHECK (expires_at > created_at)
   
   -- Ensure used_at is between created_at and expires_at
   CHECK (used_at IS NULL OR (used_at >= created_at AND used_at <= expires_at))
   
   -- Ensure telegram_user_id is positive if set
   CHECK (telegram_user_id IS NULL OR telegram_user_id > 0)
   ```

### Application-Level Validation

```typescript
// Zod schemas for validation
import { z } from 'zod'

export const authTokenSchema = z.object({
  id: z.string().uuid(),
  token: z.string().length(32).regex(/^[a-zA-Z0-9]+$/),
  userId: z.string().uuid(),
  createdAt: z.date(),
  expiresAt: z.date().refine(
    (date) => date > new Date(),
    { message: 'Token must expire in the future' }
  ),
  usedAt: z.date().nullable(),
  isActive: z.boolean(),
})

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fullName: z.string().nullable(),
  language: z.enum(['en-US', 'pt-BR']),
  telegramUserId: z.bigint().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
```

---

## Performance Considerations

### Query Patterns

1. **Token Validation** (most frequent):
   ```sql
   SELECT * FROM auth_tokens 
   WHERE token = $1 
     AND is_active = true 
     AND used_at IS NULL 
     AND expires_at > now()
   LIMIT 1;
   ```
   - Index: `idx_auth_tokens_token` (O(log n) lookup)
   - Expected: <10ms

2. **User's Active Token** (profile page):
   ```sql
   SELECT * FROM auth_tokens 
   WHERE user_id = $1 
     AND is_active = true 
     AND used_at IS NULL
   ORDER BY created_at DESC
   LIMIT 1;
   ```
   - Index: `idx_auth_tokens_user_id` (O(log n) lookup)
   - Expected: <10ms

3. **Telegram User Lookup** (bot middleware):
   ```sql
   SELECT * FROM user_profiles 
   WHERE telegram_user_id = $1 
   LIMIT 1;
   ```
   - Index: `idx_user_profiles_telegram_user_id` (O(log n) lookup)
   - Expected: <10ms

### Scaling Considerations

- **Token table growth**: ~10 tokens/user/year → 100K users = 1M rows/year (manageable)
- **Cleanup strategy**: Hard delete tokens older than 30 days (future background job)
- **Index maintenance**: Standard B-tree indexes, no special tuning needed
- **Partition strategy**: Not needed for MVP (< 10M rows)

---

## Migration Strategy

### Step 1: Create Migration

```bash
cd apps/shaliah-next
pnpm drizzle-kit generate:pg --name add_ezer_auth
```

### Step 2: Review Generated SQL

```sql
-- drizzle/XXXX_add_ezer_auth.sql
-- (See research.md Section 4 for full SQL)
```

### Step 3: Apply Migration

```bash
pnpm drizzle-kit push:pg
```

### Step 4: Verify Schema

```sql
-- Check table exists
\dt auth_tokens

-- Check indexes
\di auth_tokens*

-- Check constraints
\d auth_tokens
```

---

## Summary

Two entities defined with complete validation rules, state transitions, and performance characteristics:

1. **AuthToken**: Time-limited tokens for secure account linking
2. **UserProfile (extended)**: Telegram account linkage

**Key Design Decisions**:
- One active token per user (UPDATE strategy, not INSERT)
- Soft delete for audit trail (`is_active` flag)
- Unique Telegram user ID (one-to-one relationship)
- Cascade delete on user deletion (data integrity)

**Next Steps**:
1. ✅ Data model complete → Proceed to contracts generation
2. Generate API contracts in `contracts/` directory
3. Generate quickstart.md with test scenarios
