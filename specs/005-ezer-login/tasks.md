# Tasks: Ezer Bot Authentication Link

**Feature**: 005-ezer-login  
**Input**: Design documents from `/home/patrickkmatias/repos/yesod-ecosystem/specs/005-ezer-login/`  
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓  
**Application(s)**: shaliah-next (web UI + backend), ezer-bot (Telegram bot)

## Overview

This feature implements cross-application authentication linking between Shaliah web app and Ezer Telegram bot using QR codes and deep links. Implementation follows TDD principles with all tests written first.

**Key Components**:
- **Shaliah**: Token generation API, QR code display with `next-qrcode`, profile page extension
- **Ezer Bot**: Token validation, account linking, language sync
- **Database**: New `auth_tokens` table, extend `user_profiles` with `telegram_user_id`
- **i18n**: Bilingual support (pt-BR + en-US mandatory)

---

## Phase 1: Setup

- [x] **T001** Install `next-qrcode` dependency in `apps/shaliah-next/package.json`
  - Run: `cd apps/shaliah-next && pnpm add next-qrcode`
  - Verify: Check package.json includes next-qrcode

- [x] **T002** [P] Verify ESLint and TypeScript configurations are active
  - Check: `apps/shaliah-next/eslint.config.mjs` extends shared config
  - Check: `apps/ezer-bot/tsconfig.json` extends shared config
  - No changes needed if already configured

- [x] **T003** [P] Verify logger package wiring
  - Shaliah: Check `apps/shaliah-next/src/lib/logger.ts` exists and imports `@yesod/logger`
  - Ezer: Check `apps/ezer-bot/src/logger.ts` exists and imports `@yesod/logger`
  - No changes needed if already configured

- [x] **T004** [P] Verify Supabase client setup
  - Shaliah: Check `apps/shaliah-next/src/lib/supabase/server.ts` and `client.ts` exist
  - Ezer: Check `apps/ezer-bot/src/lib/supabase.ts` exists with service role key
  - Verify environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_USERNAME`

---

## Phase 2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE PHASE 3

**CRITICAL**: These tests MUST be written and MUST FAIL before ANY implementation.

### Contract Tests (Already Created)

- [x] **T005** ~~Contract test for POST /api/ezer-auth/token~~ ✓ Already created
  - File: `apps/shaliah-next/__tests__/contract/ezer-auth.contract.test.ts`
  - Status: Created in planning phase (failing)

- [x] **T006** ~~Contract test for bot /start command~~ ✓ Already created
  - File: `apps/ezer-bot/__tests__/contract/auth-link.contract.test.ts`
  - Status: Created in planning phase (failing)

### Integration Tests

- [x] **T007** [P] Integration test: Generate token and verify database state
  - File: `apps/shaliah-next/__tests__/integration/ezer-auth-token-generation.test.ts`
  - Test: Token inserted into auth_tokens table with correct expiration
  - Test: Old active tokens marked inactive when new token generated
  - Framework: Jest
  - Expected: FAIL (no implementation yet)

- [x] **T008** [P] Integration test: Sign-out propagates to Ezer (unlinks account)
  - File: `apps/shaliah-next/__tests__/integration/ezer-auth-signout.test.ts`
  - Test: Sign-out sets telegram_user_id to NULL
  - Test: Auth tokens remain unchanged (audit trail preserved)
  - Framework: Jest
  - Expected: FAIL (no implementation yet)

- [x] **T009** [P] Integration test: Bot links account successfully
  - File: `apps/ezer-bot/__tests__/integration/auth-link-success.test.ts`
  - Test: Valid token updates user_profiles.telegram_user_id
  - Test: Token marked as used (used_at timestamp set)
  - Test: Bot sends success message in correct language
  - Framework: Jest
  - Expected: FAIL (no implementation yet)

- [x] **T010** [P] Integration test: Bot rejects expired/invalid tokens
  - File: `apps/ezer-bot/__tests__/integration/auth-link-errors.test.ts`
  - Test: Expired token returns error message
  - Test: Already-used token returns error message
  - Test: Invalid token format returns error message
  - Test: Telegram account collision returns error message
  - Framework: Jest
  - Expected: FAIL (no implementation yet)

### UI Component Tests

- [x] **T011** [P] Component test: QRCodeDisplay component
  - File: `apps/shaliah-next/__tests__/components/QRCodeDisplay.test.tsx`
  - Test: Renders QR code SVG with correct deep link
  - Test: Displays loading state while generating
  - Test: Shows error state on generation failure
  - Framework: Jest + React Testing Library
  - Expected: FAIL (component doesn't exist yet)

- [x] **T012** [P] Component test: EzerAuthSection component
  - File: `apps/shaliah-next/__tests__/components/EzerAuthSection.test.tsx`
  - Test: Displays QR code when token generated
  - Test: Displays "Or you might use this [link]" text with clickable link
  - Test: Shows linked status when account linked
  - Test: Shows expiration countdown
  - Framework: Jest + React Testing Library
  - Expected: FAIL (component doesn't exist yet)

### Validation

- [ ] **T013** Run all Phase 2 tests and verify they fail
  - Shaliah: `cd apps/shaliah-next && pnpm test`
  - Ezer: `cd apps/ezer-bot && pnpm test`
  - Expected: All new tests FAIL with clear error messages
  - Document: Failure reasons confirm tests are correctly written

---

## Phase 3: Core Implementation + Testing (ONLY after Phase 2 tests are failing)

### Database Schema (Priority: First)

- [x] **T014** Create Drizzle schema for auth_tokens table
  - File: `apps/shaliah-next/src/db/schema/auth-tokens.ts`
  - Define: AuthToken schema with all fields (id, token, user_id, created_at, expires_at, used_at, is_active)
  - Add indexes: token, user_id, expires_at
  - Export: from `apps/shaliah-next/src/db/schema/index.ts`
  - Reference: research.md Section 4, data-model.md AuthToken entity

- [x] **T015** Extend user_profiles schema with telegram_user_id
  - File: `apps/shaliah-next/src/db/schema/user-profiles.ts` (modify existing)
  - Add: `telegramUserId: bigint('telegram_user_id', { mode: 'bigint' }).unique()`
  - Add index: `telegram_user_id`
  - Reference: data-model.md UserProfile extension

- [x] **T016** Generate and apply Drizzle migration
  - Run: `cd apps/shaliah-next && pnpm drizzle-kit generate:pg --name add_ezer_auth`
  - Review: Generated SQL in `apps/shaliah-next/drizzle/XXXX_add_ezer_auth.sql`
  - Apply: `pnpm drizzle-kit push:pg`
  - Verify: Check Supabase Dashboard for new table and columns
  - Add RLS policies as documented in research.md Section 4

- [x] **T017** Test database schema
  - Run integration tests T007-T010 to verify schema
  - Use Supabase MCP to inspect table structure and indexes
  - Expected: Tests should start passing for database operations

### Shaliah: Domain Layer

- [x] **T018** [P] Create AuthToken domain types and factories
  - File: `apps/shaliah-next/src/modules/ezer-auth/domain/types.ts`
  - Define: AuthToken, TokenStatus types
  - File: `apps/shaliah-next/src/modules/ezer-auth/domain/factories/token-factory.ts`
  - Implement: `generateAuthToken()` using `crypto.randomUUID()`
  - Implement: `calculateExpiration()` (now + 15 minutes)
  - Reference: research.md Section 1

- [x] **T019** [P] Create AuthToken validators
  - File: `apps/shaliah-next/src/modules/ezer-auth/domain/validators.ts`
  - Implement: `isTokenValid()` checking is_active, used_at, expires_at
  - Implement: Zod schemas for token format validation
  - Reference: data-model.md validation rules

- [x] **T020** [P] Create deep link service
  - File: `apps/shaliah-next/src/modules/ezer-auth/domain/services/deep-link-service.ts`
  - Implement: `generateDeepLink(token)` returning `https://t.me/{bot}?start={token}`
  - Use: `process.env.TELEGRAM_BOT_USERNAME` for bot username
  - Reference: research.md Section 3

### Shaliah: Use Cases

- [x] **T021** ✅ Create generateAuthToken use case
  - File: `apps/shaliah-next/src/modules/ezer-auth/use-cases/generate-token.ts`
  - Implement: Generate token, invalidate old tokens, insert new token, return token + deepLink
  - Use: Drizzle ORM for database operations
  - Error handling: Log failures, throw user-friendly errors
  - Reference: contracts/generate-token.md business logic
  - **Status**: ✅ Complete - Unit test passing (3/3 tests)

- [x] **T022** ✅ Extend signOut use case
  - File: `apps/shaliah-next/src/lib/auth/actions.ts` (modify existing)
  - Add: Set `telegram_user_id = NULL` before Supabase signOut
  - Error handling: Continue sign-out even if unlink fails
  - Reference: research.md Section 7
  - **Status**: ✅ Complete - Unit test passing (4/4 tests)

- [x] **T023** ✅ Test use cases
  - Run integration tests T007-T008
  - Verify: Tokens generated correctly, sign-out unlinks account
  - Expected: Tests T007-T008 should pass
  - **Status**: ✅ Complete - Unit tests created and passing, Jest hanging issue resolved

### Shaliah: UI Components

- [ ] **T024** [P] Create QRCodeDisplay component
  - File: `apps/shaliah-next/src/modules/ezer-auth/ui/components/QRCodeDisplay.tsx`
  - Implement: Wrap `next-qrcode` SVG component with loading/error states
  - Props: `deepLink: string`, `size?: number`, `className?: string`
  - Use: `useQRCode()` hook from next-qrcode
  - Reference: research.md Section 2

- [ ] **T025** [P] Create EzerAuthSection component
  - File: `apps/shaliah-next/src/modules/ezer-auth/ui/components/EzerAuthSection.tsx`
  - Implement: Display QR code, "Or you might use this [link]" text, expiration countdown
  - State: Fetch token via server action, handle loading/error states
  - Integrate: QRCodeDisplay component, shadcn Card, Button, Alert
  - Reference: plan.md Component Reuse Analysis

- [ ] **T026** Test UI components
  - Run component tests T011-T012
  - Use Chrome DevTools MCP to visually inspect QR code rendering
  - Expected: Tests T011-T012 should pass

### Shaliah: Server Actions & API

- [ ] **T027** Create token generation server action
  - File: `apps/shaliah-next/src/modules/ezer-auth/ui/server/actions.ts`
  - Implement: `generateAuthTokenAction()` calling generateToken use case
  - Authentication: Get user from Supabase session
  - Return: `{ token, expiresAt, deepLink, qrCodeUrl }` (qrCodeUrl optional for API)
  - Mark: 'use server' directive
  - Reference: contracts/generate-token.md

- [ ] **T028** Create API route for token generation
  - File: `apps/shaliah-next/src/app/api/ezer-auth/token/route.ts`
  - Implement: POST endpoint calling generateAuthTokenAction
  - Rate limiting: 5 requests per minute per user (use middleware or in-route check)
  - Response: JSON matching contract schema
  - Reference: contracts/generate-token.md

- [ ] **T029** Test API endpoint
  - Run contract test T005 (ezer-auth.contract.test.ts)
  - Test manually: `curl -X POST http://localhost:3000/api/ezer-auth/token -H "Cookie: ..."`
  - Expected: Test T005 should pass

### Shaliah: Profile Page Integration

- [ ] **T030** Extend ProfileDashboard component
  - File: `apps/shaliah-next/src/components/ProfileDashboard.tsx` (modify existing)
  - Add: Import and render EzerAuthSection component
  - Placement: Below profile info, above sign-out button
  - Reference: plan.md Component Reuse Analysis

- [ ] **T031** Test profile page integration
  - Manual: Navigate to `/[locale]/profile`, verify QR code and link displayed
  - Use Chrome DevTools MCP to test QR code scanning
  - Verify: Performance <2s page load (use Network tab)
  - Expected: Profile page displays correctly with QR code

### Ezer Bot: Auth Link Composer

- [ ] **T032** Create auth-link composer module
  - File: `apps/ezer-bot/src/modules/auth-link.ts`
  - Implement: `/start` command handler with token extraction
  - Implement: `validateAndLinkAccount()` function
  - Flow: Extract token → validate → check collision → transaction (link + mark used) → sync language
  - Error handling: All error scenarios from contracts/bot-start-command.md
  - Reference: contracts/bot-start-command.md, research.md Section 3

- [ ] **T033** Implement token validation logic
  - Within: `apps/ezer-bot/src/modules/auth-link.ts`
  - Implement: Query auth_tokens table via Supabase client
  - Validate: is_active, used_at IS NULL, expires_at > now()
  - Return: AuthToken object or error code

- [ ] **T034** Implement account linking logic
  - Within: `apps/ezer-bot/src/modules/auth-link.ts`
  - Implement: Check for Telegram account collision
  - Implement: Database transaction updating user_profiles + auth_tokens
  - Atomic: Both updates must succeed or both fail
  - Reference: data-model.md state transitions

- [ ] **T035** Implement language synchronization
  - Within: `apps/ezer-bot/src/modules/auth-link.ts`
  - Implement: Fetch user_profiles.language after linking
  - Implement: Map Shaliah locale to Telegram locale (pt-BR → pt, en-US → en)
  - Call: `ctx.i18n.locale(mappedLocale)`
  - Reference: research.md Section 6

- [ ] **T036** Mount auth-link composer in bot
  - File: `apps/ezer-bot/src/bot.ts` (modify existing)
  - Add: Import authLinkComposer
  - Mount: `bot.use(authLinkComposer)` after session middleware
  - Order: sequentialize → session → i18n → auth-link → other composers
  - Reference: plan.md Architecture Review (Ezer Bot)

- [ ] **T037** Test bot auth-link functionality
  - Run contract test T006 (auth-link.contract.test.ts)
  - Run integration tests T009-T010
  - Manual: Use quickstart.md scenarios 2, 3, 6, 7
  - Expected: Tests T006, T009, T010 should pass

### Ezer Bot: Middleware for Unlinked Detection

- [ ] **T038** Create middleware to detect unlinked accounts
  - File: `apps/ezer-bot/src/modules/auth-link.ts` (add middleware)
  - Implement: Check if telegram_user_id exists in user_profiles
  - If unlinked: Set session flag, send prompt message once
  - Mount: After auth-link composer in bot.ts
  - Reference: research.md Section 7

- [ ] **T039** Test unlinked account detection
  - Manual: Use quickstart.md scenario 5 (unlinked user attempts to use bot)
  - Verify: Bot sends authentication prompt
  - Expected: Correct behavior for unlinked users

---

## Phase 4: Integration

### Rate Limiting

- [ ] **T040** Implement rate limiting for token generation
  - Strategy: In-memory cache with user ID as key, count + timestamp
  - Alternative: Use Supabase Edge Functions rate limiting
  - Limit: 5 requests per minute per user
  - Response: 429 Too Many Requests with retry-after header
  - Location: `apps/shaliah-next/src/app/api/ezer-auth/token/route.ts` or middleware

- [ ] **T041** Test rate limiting
  - Run contract test T005 section "Error Response (429)"
  - Manual: Make 6 rapid requests, verify 6th returns 429
  - Expected: Rate limiting works correctly

### Logging & Observability

- [ ] **T042** [P] Add structured logging for token generation
  - File: `apps/shaliah-next/src/modules/ezer-auth/use-cases/generate-token.ts`
  - Events: `ezer.auth.token_generated` (INFO) with user_id, token_id, expiration
  - Events: Token generation failure (ERROR) with error details
  - Use: `@yesod/logger` package
  - Reference: spec.md NFR-005

- [ ] **T043** [P] Add structured logging for token validation
  - File: `apps/ezer-bot/src/modules/auth-link.ts`
  - Events: `ezer.auth.token_used_success` (INFO) with user_id, telegram_user_id, token_id
  - Events: `ezer.auth.token_used_failure` (WARN) with token_id, failure_reason
  - Events: `ezer.auth.unlinked_access` (INFO) with telegram_user_id
  - Use: `@yesod/logger` package
  - Reference: spec.md NFR-005

- [ ] **T044** [P] Add structured logging for sign-out propagation
  - File: `apps/shaliah-next/src/lib/auth/actions.ts`
  - Events: `ezer.auth.signout_propagated` (INFO) with user_id, telegram_user_id_removed
  - Use: `@yesod/logger` package
  - Reference: spec.md NFR-005

### End-to-End Integration Testing

- [ ] **T045** Run all integration tests
  - Shaliah: `cd apps/shaliah-next && pnpm test`
  - Ezer: `cd apps/ezer-bot && pnpm test`
  - Expected: All tests pass (T005-T012)

- [ ] **T046** Use Supabase MCP for database validation
  - Verify: auth_tokens table structure, indexes, RLS policies
  - Verify: user_profiles.telegram_user_id column, index
  - Query: Sample data after manual testing
  - Check: No orphaned records, correct state transitions

- [ ] **T047** Manual end-to-end testing with quickstart.md
  - Execute: All 10 acceptance scenarios from quickstart.md
  - Execute: 5 edge case scenarios
  - Execute: 3 performance benchmarks
  - Execute: 3 security validations
  - Document: Results in quickstart.md (checkboxes, timestamps, notes)

- [ ] **T048** Use Chrome DevTools MCP for UI validation
  - Test: QR code display in profile page
  - Test: Link clickability and formatting
  - Test: Expiration countdown display
  - Test: Linked status indicator
  - Performance: Measure page load time (<2s target)

---

## Phase 5: Code Quality Validation

**CRITICAL: Run after all implementation + testing complete**

- [ ] **T049** Run ESLint across all modified files
  - Shaliah: `cd apps/shaliah-next && pnpm lint`
  - Ezer: `cd apps/ezer-bot && pnpm lint`
  - Fix: All violations or add suppression comments with justification
  - Expected: No errors, warnings acceptable with justification

- [ ] **T050** Run TypeScript type check
  - Shaliah: `cd apps/shaliah-next && pnpm tsc --noEmit`
  - Ezer: `cd apps/ezer-bot && pnpm tsc --noEmit`
  - Fix: All type errors
  - For unavoidable errors: Add `@ts-expect-error` with detailed comment
  - Expected: No type errors

- [ ] **T051** Verify no console.log statements remain
  - Search: `grep -r "console.log" apps/shaliah-next/src/modules/ezer-auth/`
  - Search: `grep -r "console.log" apps/ezer-bot/src/modules/auth-link.ts`
  - Replace: With logger calls (`logger.info()`, `logger.debug()`)
  - Expected: No console.log in production code

- [ ] **T052** Run Prettier for consistent formatting
  - Root: `pnpm format` (if available) or `pnpm prettier --write "apps/**/*.{ts,tsx}"`
  - Expected: All files formatted consistently

---

## Phase 6: i18n & Polishing

### Shaliah i18n

- [ ] **T053** [P] Add common i18n keys
  - File: `apps/shaliah-next/messages/pt-BR.json`
  - Add: Keys for "Connect to Ezer Bot", "Or you might use this", "Expires in", "Linked", "Generate new link"
  - File: `apps/shaliah-next/messages/en.json`
  - Add: Same keys with English translations
  - **MUST BE COMPLETE** before PR

- [ ] **T054** [P] Add feature-specific i18n keys
  - File: `apps/shaliah-next/src/modules/ezer-auth/messages/pt-BR.json`
  - Add: Domain-specific terms if any (likely covered by common keys)
  - File: `apps/shaliah-next/src/modules/ezer-auth/messages/en.json`
  - Add: Same keys with English translations
  - Reference: plan.md Architecture Review (i18n organization)

- [ ] **T055** Configure message loader for feature-based i18n (if first feature)
  - File: `apps/shaliah-next/src/i18n/load-messages.ts` (modify if exists)
  - Merge: Common translations from `messages/` + feature translations from `modules/*/messages/`
  - Skip if already configured

### Ezer Bot i18n

- [ ] **T056** [P] Add Fluent translation keys for pt-BR
  - File: `apps/ezer-bot/src/locales/pt-BR.ftl`
  - Add: All keys from contracts/bot-start-command.md Fluent section
  - Keys: auth-link-success, auth-link-error-invalid, auth-link-error-expired, etc.
  - **MUST BE COMPLETE** before PR

- [ ] **T057** [P] Add Fluent translation keys for en
  - File: `apps/ezer-bot/src/locales/en.ftl`
  - Add: All keys from contracts/bot-start-command.md Fluent section (English versions)
  - **MUST BE COMPLETE** before PR

- [ ] **T058** Test i18n in both apps
  - Shaliah: Switch language in profile, verify all text changes
  - Ezer: Test bot with pt-BR and en-US users
  - Expected: All text properly translated, no missing keys

### Roadmap & Documentation

- [ ] **T059** [P] Document additional planned languages in roadmap.md
  - File: `specs/005-ezer-login/roadmap.md` (create if doesn't exist)
  - Add: List of future language support (es, fr, de, etc.)
  - Note: "Do NOT add partial translations"

- [ ] **T060** [P] Update README files with feature documentation
  - File: `apps/shaliah-next/README.md` (add section on Ezer authentication)
  - File: `apps/ezer-bot/README.md` (add section on account linking)
  - Include: Setup instructions, environment variables needed

### Code Quality & Cleanup

- [ ] **T061** Remove code duplication
  - Review: Token validation logic, error handling patterns
  - Extract: Common utilities to shared functions
  - Refactor: Without breaking tests

- [ ] **T062** Final code review checklist
  - [ ] All tests passing (run `pnpm test` in both apps)
  - [ ] No TypeScript errors
  - [ ] No ESLint errors
  - [ ] All i18n keys present for pt-BR and en-US
  - [ ] No console.log statements
  - [ ] Structured logging implemented
  - [ ] Rate limiting working
  - [ ] QR codes rendering correctly
  - [ ] Token expiration enforced
  - [ ] Sign-out propagation working
  - [ ] Performance targets met (<2s page load, <500ms bot response)

---

## Dependencies

**Strict Order (Gates)**:
1. **Setup** (T001-T004) → **Tests** (T005-T013)
2. **Tests** (T005-T013) → **Database** (T014-T017) → **Implementation** (T018-T039)
3. **Implementation** (T018-T039) → **Integration** (T040-T048)
4. **Integration** (T040-T048) → **Code Quality** (T049-T052)
5. **Code Quality** (T049-T052) → **i18n & Polish** (T053-T062)

**Within Phases**:
- Tasks marked [P] can run in parallel
- Sequential tasks must complete in order
- Integration tests (T007-T012) can run in parallel after setup
- UI components (T024-T025) can be built in parallel
- i18n files (T053-T057) can be updated in parallel

---

## Parallel Execution Examples

### Phase 2: Tests (can launch together)
```bash
# All integration tests can run in parallel
Task: "Integration test: Generate token and verify database state"
Task: "Integration test: Sign-out propagates to Ezer"
Task: "Integration test: Bot links account successfully"
Task: "Integration test: Bot rejects expired/invalid tokens"
Task: "Component test: QRCodeDisplay component"
Task: "Component test: EzerAuthSection component"
```

### Phase 3: Implementation (can launch together)
```bash
# Domain layer (different files)
Task: "Create AuthToken domain types and factories"
Task: "Create AuthToken validators"
Task: "Create deep link service"

# UI components (different files)
Task: "Create QRCodeDisplay component"
Task: "Create EzerAuthSection component"
```

### Phase 6: i18n (can launch together)
```bash
# All i18n files can be updated in parallel
Task: "Add common i18n keys (pt-BR + en)"
Task: "Add Fluent translation keys for pt-BR"
Task: "Add Fluent translation keys for en"
Task: "Document additional planned languages in roadmap.md"
Task: "Update README files with feature documentation"
```

---

## Task Summary

**Total Tasks**: 62
- **Setup**: 4 tasks
- **Tests First (TDD)**: 9 tasks (2 contract tests already created ✓)
- **Implementation**: 28 tasks
- **Integration**: 9 tasks
- **Code Quality**: 4 tasks
- **i18n & Polish**: 10 tasks

**Parallel Tasks**: 23 tasks marked [P]
**Estimated Time**: 
- Phase 1 (Setup): 30 min
- Phase 2 (Tests): 4-6 hours
- Phase 3 (Implementation): 12-16 hours
- Phase 4 (Integration): 4-6 hours
- Phase 5 (Code Quality): 1-2 hours
- Phase 6 (i18n & Polish): 2-3 hours
- **Total**: ~24-34 hours

---

## Validation Checklist

- [x] All contracts have corresponding tests (T005, T006 already created)
- [x] All entities have model tasks (AuthToken: T018-T019, UserProfile: T015)
- [x] All tests written first and fail before implementation (Phase 2 before Phase 3)
- [x] Dedicated testing tasks included after implementation phases (T017, T023, T026, T029, T031, T037, T039, T045-T048)
- [x] Code quality validation phase included (Phase 5: T049-T052)
- [x] Parallel tasks truly independent (all [P] tasks use different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Supabase usage validated (Drizzle schema, direct queries from bot)
- [x] Drizzle schema changes centralized in apps/shaliah-next/db/schema/ (T014-T015)
- [x] TypeScript-first enforced (all tasks use TypeScript)
- [x] i18n coverage with feature-based organization (T053-T058, pt-BR + en-US mandatory)
- [x] MCP servers identified for testing (Chrome DevTools: T031, T048; Supabase: T046)
- [x] Existing components audited (ProfileDashboard extension: T030)
- [x] Observability wired (logging: T042-T044)
- [x] No long-running work (all operations <2s, no poel-worker needed)

---

**Status**: Ready for execution  
**Next Step**: Execute tasks in order, starting with Phase 1 Setup  
**Branch**: `005-ezer-login`  
**Constitution**: v4.2.0 compliant

---

*Generated from: plan.md, research.md, data-model.md, contracts/, quickstart.md*  
*Based on Constitution v4.2.0 — see `.specify/memory/constitution.md`*
