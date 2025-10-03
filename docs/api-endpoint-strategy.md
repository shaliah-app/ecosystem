# API Endpoint Strategy: Auth vs Telegram Bot Linking

**Issue**: Conflicting endpoint paths between old Telegram bot linking system and new web authentication.

**Date**: 2025-10-01  
**Related Feature**: 004-shaliah-onboarding-n  
**Analysis Finding**: H8 (HIGH priority)

---

## Old System (Telegram Bot Linking)

**Endpoints**: `/api/v1/auth/*`
- `/api/v1/auth/request-link-token` - Generate temp token for Telegram user → Shaliah account linking
- `/api/v1/auth/verify-link-token` - Verify token and link Telegram user_id to user_profiles

**Purpose**: Allow Telegram bot (Ezer) users to link their Telegram account to Shaliah account for cross-app functionality.

**Status**: **DEPRECATED** - Replaced by Supabase Auth system.

---

## New System (Web Authentication)

**Endpoints**: `/api/auth/*` (no `/v1/` prefix)
- `/api/auth/magic-link/request` - Send magic link for passwordless email auth
- `/api/user/profile` - Get/update user profile

**Purpose**: Unified authentication for web apps using Supabase Auth (magic link + Google OAuth).

**Scope**: Shaliah web application and future ecosystem apps.

---

## Migration Strategy

### Phase 1: Parallel Operation (Current)
- Old `/api/v1/auth/*` endpoints remain active for existing Telegram bot users
- New `/api/auth/*` endpoints handle web authentication
- No conflicts (different paths)

### Phase 2: Telegram Bot Migration (Future)
When Ezer bot is updated to use Supabase Auth:
1. Update ezer-bot to use `/api/auth/magic-link/request` or deep-link OAuth flow
2. Migrate existing `user_profiles.telegram_user_id` links (if needed)
3. Deprecate `/api/v1/auth/request-link-token` and `/api/v1/auth/verify-link-token`
4. Remove legacy `auth_tokens` table (migration 0006 already created)

### Phase 3: Cleanup
- Delete `/api/v1/auth/` route handlers
- Remove `auth_tokens` references from codebase
- Update Ezer bot documentation

---

## Test Strategy

**Contract Tests**:
- Old system: `apps/yesod-api/__tests__/contract/auth.test.ts` (tests `/api/v1/auth/*`)
- New system: `apps/yesod-api/__tests__/contract/magic-link-request.test.ts` (tests `/api/auth/magic-link/request`)

**No conflicts**: Tests target different endpoint paths.

**Action for Implementation**:
- Create new test file for `/api/auth/magic-link/request` (T008)
- Keep existing test for `/api/v1/auth/*` until Phase 3 cleanup
- Document parallel operation in API docs (T058)

---

## Decision: Proceed with Parallel Endpoints

✅ **Recommendation**: Implement new `/api/auth/*` endpoints without removing old `/api/v1/auth/*` system. Schedule Telegram bot migration and cleanup for post-MVP.

**Rationale**:
- Avoids breaking existing Telegram bot integration
- Allows incremental migration
- MVP can ship without blocking on Ezer bot updates
