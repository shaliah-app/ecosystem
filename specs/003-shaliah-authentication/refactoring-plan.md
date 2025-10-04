# Refactoring Plan: Remove Magic Link from Yesod API

**Created**: 2025-10-04
**Target Feature**: Authentication System (003-shaliah-authentication, 004-shaliah-onboarding-n)
**Refactoring Scope**: Remove magic link functionality from yesod-api and ensure shaliah-next uses Supabase Auth directly

## Executive Summary
- Total opportunities identified: 1 (remove magic link from yesod-api)
- Critical issues: 1 (violation of Supabase-First Integration principle)
- Estimated total effort: M (4-16 hours)
- Recommended execution order: Remove from yesod-api, verify shaliah-next integration

## Current State Analysis

### Architecture Overview
- **yesod-api**: Has implemented magic link functionality with rate limiting, database tracking, and Supabase integration
- **shaliah-next**: Already uses Supabase Auth directly for magic links and OAuth, not consuming yesod-api
- **Database**: Has `magic_link_attempts` table for rate limiting (not used by shaliah-next)

### Implementation Health
- Magic link API exists in yesod-api but is not being used by shaliah-next
- shaliah-next implements its own rate limiting and cooldown logic in the frontend
- Supabase Auth handles all authentication flows directly

### Constitution Compliance
- **VIOLATION**: Principle IV "Supabase-First Integration" - magic link should be handled by Supabase, not custom API
- **COMPLIANT**: shaliah-next already follows this principle correctly

## Refactoring Opportunities

### Critical Priority
| ID | Category | Issue | Files Affected | Effort | Risk |
|----|----------|-------|----------------|--------|------|
| R001 | Architecture | Remove custom magic link API from yesod-api (Supabase-First violation) | yesod-api/src/contexts/auth/*, migrations/0005_*, schema/magic-link-attempts.ts | M | M |

## Recommended Approach

### Phase 1: Analysis & Planning (Current)
- ✅ Analyze current implementation
- ✅ Create this refactoring plan
- ✅ Identify all files to remove/modify

### Phase 2: Remove Magic Link from Yesod API
- Remove auth context implementation
- Remove database schema and migration
- Update server routes
- Clean up unused dependencies

### Phase 3: Verification & Testing
- Verify shaliah-next works with Supabase Auth
- Run tests to ensure no regressions
- Update documentation

## Task Breakdown

### R001: Remove Magic Link API from Yesod API
**Files to remove:**
- `yesod-api/src/contexts/auth/api/handlers/magic-link-request.handler.ts`
- `yesod-api/src/contexts/auth/application/use-cases/send-magic-link.use-case.ts`
- `yesod-api/src/contexts/auth/domain/entities/magic-link-attempt.ts`
- `yesod-api/src/contexts/auth/domain/services/rate-limit-policy.ts`
- `yesod-api/src/contexts/auth/infra/repositories/magic-link-attempt.repository.ts`
- `yesod-api/src/contexts/auth/infra/services/supabase-auth.service.ts`
- `yesod-api/src/db/schema/magic-link-attempts.ts`
- `yesod-api/supabase/migrations/0005_create_magic_link_attempts.sql`

**Files to modify:**
- `yesod-api/src/contexts/auth/api/routes.ts` - remove magic link route
- `yesod-api/src/db/schema.ts` - remove magic link attempts export
- `yesod-api/src/index.ts` - remove auth context route if no other routes remain

**Database migration needed:**
- Create migration to drop `magic_link_attempts` table

## Validation Strategy
- Existing tests must pass (no regressions)
- shaliah-next authentication flow must work unchanged
- Supabase Auth integration remains functional
- No API endpoints broken

## Rollback Plan
- Git branch: refactor/remove-magic-link-api
- Checkpoint commits after each major removal
- Revert strategy: restore deleted files from git history

## Success Criteria
- All CRITICAL constitution violations resolved
- No functional regressions in shaliah-next
- yesod-api no longer exposes magic link endpoints
- Supabase Auth handles all authentication directly
- Constitution compliance: 100% for authentication flows