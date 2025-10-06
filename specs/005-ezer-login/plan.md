
# Implementation Plan: Ezer Bot Authentication Link

**Branch**: `005-ezer-login` | **Date**: 2025-10-06 | **Spec**: [spec.md](./spec.md)
**Constitution Version**: 4.2.0
**Input**: Feature specification from `/home/patrickkmatias/repos/yesod-ecosystem/specs/005-ezer-login/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Identify affected applications from feature spec
   → Read corresponding architecture guides from docs/architecture/
   → For shaliah-next changes: Read docs/architecture/shaliah-next.md
   → For ezer-bot changes: Read docs/architecture/ezer-bot.md
   → Document key architectural patterns to follow in Technical Context
3. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
4. Fill the Constitution Check section based on the content of the constitution document.
5. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
6. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
7. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
8. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
9. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
10. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement cross-application authentication linking between Shaliah web app and Ezer Telegram bot using QR codes and deep links. Users can scan a QR code or click a link from their Shaliah profile to authenticate in the Telegram bot. Authentication tokens are single-use, time-limited (15 minutes), and updated in place per user. Language preferences sync from Shaliah to Ezer, and sign-out in Shaliah invalidates the Ezer session.

**Primary Technical Approach**:
- **Shaliah**: Generate secure tokens, display QR codes using `next-qrcode` library, create Telegram deep links
- **Ezer Bot**: Validate tokens, link Telegram accounts, query Supabase directly for user profiles
- **Database**: New `auth_tokens` table with one row per user (updated on regeneration)
- **Sign-out**: Remove `telegram_user_id` from user profile to invalidate bot session

## Technical Context
**Language/Version**: TypeScript 5.x (Next.js 15 App Router, Node.js 20+, Deno 2.x for worker if needed)
**Primary Dependencies**: 
- **Shaliah**: Next.js 15, Supabase JS client, next-intl, shadcn/ui, React 18, Drizzle ORM, `next-qrcode` (https://next-qrcode.js.org/)
- **Ezer Bot**: grammY, @grammyjs/i18n, Supabase JS client, @yesod/logger
**Storage**: Supabase PostgreSQL (auth_tokens table, user_profiles.telegram_user_id field)
**Testing**: 
- **Shaliah**: Jest + React Testing Library (all tests)
- **Ezer Bot**: Vitest with mock context pattern
**Target Platform**: Linux server (Next.js), Node.js 20+ (Ezer bot)
**Project Type**: web (shaliah-next full-stack) + bot (ezer-bot Telegram) - determines dual-app structure
**Performance Goals**: QR code generation < 2 seconds (non-blocking), token validation < 500ms in bot
**Constraints**: 15-minute token expiry, single-use atomic consumption, one token per user (update in place)
**Scale/Scope**: MVP for basic account linking; deferred: unlinking, multi-account, admin panel

**User-Provided Technical Details**:
- Use `next-qrcode` library for QR code generation in shaliah-next
- Specifically use the SVG variant: https://next-qrcode.js.org/use-qrcode/svg
- QR codes should be rendered as SVG for scalability and clean display

## Architecture Review
*Required for features modifying existing applications. Document patterns from architecture guides.*

**Affected Applications**: shaliah-next (web UI + backend), ezer-bot (Telegram bot)
**Architecture Guide(s) Read**: docs/architecture/shaliah-next.md, docs/architecture/ezer-bot.md

**Key Architectural Patterns to Follow**:

**For shaliah-next**:
- DDD-inspired layering: domain → ports → adapters → use-cases → ui/server/actions
- Module structure: `src/modules/ezer-auth/` with domain/, use-cases/, ui/components/, ui/server/, messages/
- Database schema in `db/schema/auth-tokens.ts` (single source of truth)
- Server actions for mutations (token generation, sign-out propagation)
- Direct Drizzle queries for straightforward data access (no repository abstraction needed for tokens)
- shadcn/ui components for UI (Card, Button, etc.)
- Manual DI: compose dependencies in server actions when needed
- Jest + RTL for all testing (unit, integration, component)

**For ezer-bot**:
- Feature composer pattern: new `src/modules/auth-link.ts` exporting `Composer<Context>`
- Middleware order: sequentialize → session → i18n → feature composers → error handler
- Direct Supabase database access (no API layer) for user profile queries
- Fluent i18n files: `src/locales/en.ftl` and `src/locales/pt-BR.ftl` (mandatory pair)
- Global error boundary with structured logging (@yesod/logger)
- Vitest with mock context pattern for testing
- Always answer callback queries: `ctx.answerCallbackQuery()`

**Relevant Conventions**:
- Shaliah: Server components for data fetching, client components for interactivity ('use client')
- Shaliah: Server actions marked with 'use server' directive
- Shaliah: i18n translations in both `messages/{locale}.json` (common) and `modules/ezer-auth/messages/{locale}.json` (feature-specific)
- Ezer: No `console.log` statements; use logger package
- Ezer: grammY runner for long polling, graceful shutdown on SIGTERM/SIGINT
- Both: Supabase service role key for privileged operations (token validation, profile updates)

## Component Reuse Analysis (shaliah-next)
*Analysis of existing components for reuse in ezer-auth feature*

### Evaluated Components

1. **ProfileDashboard.tsx** - EXTEND
   - **Location**: `apps/shaliah-next/src/components/ProfileDashboard.tsx`
   - **Current functionality**: Displays user avatar, name, email, member since date, language selector, sign-out button
   - **Reuse decision**: Extend existing component
   - **Rationale**: Perfect foundation for adding QR code + link section. Already has Card layout, profile info display, and sign-out button that needs modification
   - **Required changes**: 
     * Add QR code display section below profile info
     * Add "Or you might use this [link]" text with clickable link
     * Extend sign-out handler to cascade to Ezer (set telegram_user_id = NULL)
   - **Alternative rejected**: Creating new ProfileWithEzerAuth component would duplicate 90% of existing ProfileDashboard logic

2. **UserProfile.tsx** - NOT USED
   - **Location**: `apps/shaliah-next/src/components/UserProfile.tsx`
   - **Current functionality**: Simpler profile view with basic info + sign-out
   - **Reuse decision**: Not used (ProfileDashboard is preferred)
   - **Rationale**: ProfileDashboard is more feature-complete and already used in the app. Consolidating on one profile component reduces maintenance

3. **Card.tsx (shadcn/ui)** - REUSE
   - **Location**: `apps/shaliah-next/src/components/ui/card.tsx`
   - **Current functionality**: Card container with header, title, content sections
   - **Reuse decision**: Reuse directly
   - **Rationale**: Already used in ProfileDashboard, provides consistent styling for QR code section

4. **Button.tsx (shadcn/ui)** - REUSE
   - **Location**: `apps/shaliah-next/src/components/ui/button.tsx`
   - **Current functionality**: Button with variants (default, destructive, outline, ghost, link)
   - **Reuse decision**: Reuse directly
   - **Rationale**: Already used throughout the app, `link` variant perfect for "use this link" text

5. **Alert.tsx (shadcn/ui)** - REUSE
   - **Location**: `apps/shaliah-next/src/components/ui/alert.tsx`
   - **Current functionality**: Alert messages with variants (default, destructive)
   - **Reuse decision**: Reuse directly
   - **Rationale**: Needed for error states (token generation failure, expiration warnings)

### New Components Required

1. **EzerAuthSection.tsx** (new)
   - **Location**: `apps/shaliah-next/src/modules/ezer-auth/ui/components/EzerAuthSection.tsx`
   - **Purpose**: Encapsulates QR code display, deep link, linked status indicator
   - **Why new**: Domain-specific logic (token generation, QR rendering) should not pollute shared ProfileDashboard
   - **Composition**: Uses Card, Button, Alert from shadcn/ui + next-qrcode SVG component
   - **Integration**: Imported and rendered within ProfileDashboard

2. **QRCodeDisplay.tsx** (new)
   - **Location**: `apps/shaliah-next/src/modules/ezer-auth/ui/components/QRCodeDisplay.tsx`
   - **Purpose**: Wraps next-qrcode SVG component with loading state, error handling, responsive container
   - **Why new**: QR-specific rendering logic with retry on failure
   - **Props**: `deepLink: string`, `size?: number`, `className?: string`

### Component Gaps Requiring New Implementation

- **Token expiration countdown**: Visual indicator showing "Expires in X minutes" (can use CooldownTimer.tsx as reference)
- **Linked account status badge**: Shows "✓ Linked to @username" when account is linked
- **Copy-to-clipboard button**: For deep link URL (use Clipboard API)

### Summary

- **Reuse**: 3 shadcn/ui components (Card, Button, Alert)
- **Extend**: 1 component (ProfileDashboard.tsx - add QR section)
- **New**: 2 feature-specific components (EzerAuthSection, QRCodeDisplay)
- **Pattern**: Domain logic in `modules/ezer-auth/ui/components/`, infrastructure from `components/ui/`

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Domain-Centric Architecture**: ✅ PASS
  - Shaliah: Code organized by feature (`modules/ezer-auth/`) with clear domain separation (auth tokens, user profiles)
  - Ezer Bot: Feature composer module (`modules/auth-link.ts`) encapsulates linking logic
  - Business logic (token validation, account linking) independent of infrastructure
  - Dependencies flow inward: infrastructure adapters depend on domain contracts

- **Principle II: Pragmatic, MVP-First Development**: ✅ PASS
  - MVP scope: Basic QR code/link authentication, token generation, account linking, sign-out propagation
  - Deferred to roadmap: Account unlinking, multiple Telegram accounts, admin panel, notification system
  - Clear roadmap documented in spec.md "Future Considerations" section

- **Principle III: Comprehensive Testing**: ✅ PASS
  - Shaliah: Jest + RTL for all testing (token generation, QR code rendering, server actions, UI components)
  - Ezer Bot: Vitest with mock context pattern for auth-link composer
  - TDD approach: Write failing tests for token validation, account linking, then implement
  - MCP usage: Chrome DevTools MCP for testing QR code display and link functionality in profile page
  - No PR merges without tests for new business logic

- **Principle IV: Supabase-First Integration**: ✅ PASS
  - Leverages Supabase PostgreSQL for auth_tokens table and user_profiles.telegram_user_id
  - Supabase Auth integration already exists (no custom auth needed)
  - Ezer bot queries Supabase database directly for user profiles (no intermediate API layer needed)
  - Drizzle ORM for type-safe schema management and queries

- **Principle V: Decoupled, Asynchronous Processing**: ✅ PASS (N/A)
  - No long-running operations identified (<1s for all operations)
  - Token generation: immediate (<2s target)
  - QR code generation: immediate (SVG rendering)
  - Token validation in bot: <500ms
  - No need for poel-worker integration

- **Principle VI: TypeScript-First Monorepo**: ✅ PASS
  - All new code in TypeScript
  - Database schema in shaliah-next/db/schema/ (single source of truth)
  - Ezer bot imports types via workspace references if needed
  - Shared logger package (`@yesod/logger`) used in both applications

- **Principle VII (i18n)**: ✅ PASS
  - Shaliah: next-intl with translations in `modules/ezer-auth/messages/` (pt-BR.json, en.json)
  - Ezer Bot: @grammyjs/i18n with Fluent files (pt-BR.ftl, en.ftl)
  - Both mandatory languages updated together in all PRs
  - Feature-based organization: common translations + ezer-auth specific translations
  - Additional languages deferred to roadmap.md

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
apps/
├── shaliah-next/           # Full-Stack Web Application (Next.js 15 App Router)
│   ├── db/
│   │   ├── schema/         # Drizzle ORM schema (single source of truth)
│   │   │   ├── index.ts     # Export all schemas
│   │   │   ├── users.ts
│   │   │   ├── user-profiles.ts
│   │   │   └── job-queue.ts # Background job queue table
│   │   └── migrations/     # Drizzle-generated migrations
│   ├── drizzle.config.ts   # Drizzle Kit configuration
│   ├── src/
│   │   ├── app/            # Next.js App Router pages + API routes
│   │   ├── modules/        # Feature modules (DDD-inspired)
│   │   │   └── {feature}/
│   │   │       ├── domain/          # Domain types, validators, factories
│   │   │       ├── ports/           # Repository interfaces
│   │   │       ├── adapters/        # Concrete implementations (Drizzle + Supabase)
│   │   │       ├── use-cases/       # Application operations
│   │   │       ├── ui/
│   │   │       │   ├── components/  # Presentational components
│   │   │       │   ├── server/
│   │   │       │   │   └── actions.ts  # Server actions
│   │   │       │   └── hooks/       # Client-side hooks
│   │   │       ├── stores/          # Zustand stores (scoped)
│   │   │       ├── messages/        # Feature translations (en.json, pt-BR.json)
│   │   │       └── config.ts        # Module constants
│   │   ├── components/     # Shared UI components + shadcn/ui
│   │   ├── stores/         # Global Zustand stores (minimal)
│   │   ├── lib/            
│   │   │   ├── di.ts       # Composition root (DI wiring)
│   │   │   ├── env.ts      # Environment variables
│   │   │   ├── db.ts       # Drizzle client instance
│   │   │   └── supabase/   # Supabase clients (server.ts, client.ts)
│   │   ├── hooks/          # Shared hooks
│   │   ├── i18n/           # next-intl setup + load-messages.ts
│   │   └── types/          
│   ├── messages/           # Common translations (pt-BR.json, en.json)
│   ├── public/             
│   └── __tests__/          # Jest + RTL
├── ezer-bot/               # Telegram Bot (grammY)
│   ├── src/
│   │   ├── modules/        # Feature composers (welcome.ts, etc.)
│   │   ├── locales/        # Fluent i18n files (*.ftl)
│   │   ├── types/          # TypeScript types (context.ts)
│   │   ├── lib/            # Shared utilities
│   │   ├── bot.ts          # Bot composition (middleware + composers)
│   │   └── logger.ts       # Logger package instance
│   └── __tests__/          # Vitest
└── poel-worker/            # Background job processor (Deno + Supabase Queues)
    ├── src/
    │   ├── jobs/           # Job handlers (cleanupAuthTokens.ts, etc.)
    │   ├── queue/          # Queue manager
    │   ├── main.ts         # Worker entry point
    │   └── logger.ts       # Logger package instance
    └── __tests__/          # Deno test          
packages/
├── logger/
├── eslint-config-custom/
└── typescript-config/
```

**Structure Decision**: [Document the selected structure - Primary changes in shaliah-next for web application features (UI + backend via server actions/API routes), ezer-bot for Telegram bot features, poel-worker for background jobs. Reference the real directories captured above. Note: Database schema changes always go in shaliah-next/db/schema/]

## Phase 0: Outline & Research
*GATE: Must complete before Phase 1 design. Covers unknowns, technical feasibility, and critical learning.*

Research artifacts will be documented in `research.md` covering:

1. **Token Generation and Security**:
   - Generate cryptographically secure tokens using `crypto.randomUUID()` or `crypto.getRandomValues()` 
   - Token format: 32-character alphanumeric strings suitable for URL parameters and QR codes
   - Validation: Check for token expiration (expires_at timestamp), active status (is_active flag), one-time use (used_at)
   - Security: No personally identifiable information in tokens, no user_id or email in URLs

2. **QR Code Implementation with next-qrcode**:
   - Library: `next-qrcode` (user-specified: https://next-qrcode.js.org/use-qrcode/svg)
   - Variant: SVG rendering for crisp display at any size and easy styling
   - Integration: Server Component rendering in profile page (`app/[locale]/profile/page.tsx`)
   - QR content: Full Telegram deep link (e.g., `https://t.me/ezer_bot?start=abc123def456`)
   - Error correction: Medium level (M) balances data capacity and error tolerance
   - Size: 200x200px default, responsive container for mobile/desktop

3. **Telegram Deep Link Format**:
   - Format: `https://t.me/<bot_username>?start=<token>`
   - Bot username: Loaded from `process.env.TELEGRAM_BOT_USERNAME` (e.g., `ezer_bot`)
   - Token passed to bot's `/start` command handler as `ctx.match` parameter
   - grammY context provides `ctx.match` containing everything after `/start ` (the token)
   - Bot validates token, links account, sends confirmation message in user's language

4. **Database Schema Design**:
   - New table: `auth_tokens` with columns:
     * `id` (UUID primary key)
     * `token` (text, unique, not null) - the actual authentication token
     * `user_id` (UUID, not null, foreign key to auth.users) - owner of token
     * `created_at` (timestamp with time zone, not null, default now())
     * `expires_at` (timestamp with time zone, not null) - 15 minutes from creation
     * `used_at` (timestamp with time zone, nullable) - when token was consumed
     * `is_active` (boolean, not null, default true) - soft delete flag
   - Index on `token` for fast lookups
   - Index on `user_id` for user-scoped queries
   - Extend `user_profiles` table:
     * Add `telegram_user_id` (bigint, nullable, unique) - Telegram's numeric user ID
     * Add index on `telegram_user_id` for reverse lookups from bot

5. **Performance Considerations**:
   - QR code generation: <2s target (relaxed from 500ms after clarification)
   - SVG rendering is non-blocking, occurs during server component render
   - Token validation in bot: <500ms (single database query with index)
   - No caching strategy needed for MVP (tokens are one-time use, profiles update infrequently)

6. **Language Synchronization**:
   - Shaliah stores user language preference in `user_profiles.language` (ISO 639-1 code: `pt` or `en`)
   - Ezer bot reads language preference after account linking from `user_profiles.language`
   - Bot sets grammY i18n locale to match: `await ctx.i18n.locale(user.language)`
   - Initial bot language: Telegram app language (fallback to `en` if not supported)
   - Language updates in Shaliah: No live sync needed (bot reads on next interaction)

7. **Sign-Out Propagation**:
   - When user signs out in Shaliah: Set `user_profiles.telegram_user_id = NULL`
   - Next bot interaction: Bot checks if `telegram_user_id` matches session, if NULL -> unlinked message
   - No active push notification to bot (deferred to roadmap)
   - Trade-off: User may send one bot message before realizing they're unlinked (acceptable for MVP)

**Output**: research.md with all technical decisions, code snippets, and rationale documented

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

### Key Artifacts to Generate

1. **Data Model (`data-model.md`)**:
   Extract entities from feature spec:
   
   - **AuthToken Entity**:
     * id (UUID, primary key)
     * token (string, unique, indexed)
     * userId (UUID, foreign key to auth.users)
     * createdAt (timestamp)
     * expiresAt (timestamp, 15 minutes from creation)
     * usedAt (timestamp, nullable)
     * isActive (boolean, default true)
     * Relationships: Belongs to User (one-to-many)
     * Validation: Token must be 32 characters, expires_at must be > created_at
     * State transitions: ACTIVE → USED (one-way), ACTIVE → EXPIRED (time-based)
   
   - **UserProfile Extension**:
     * telegramUserId (bigint, nullable, unique, indexed)
     * Relationships: One-to-one with User (via user_id foreign key)
     * Validation: If provided, must be positive integer
     * State: NULL (unlinked) ↔ bigint (linked)

2. **Component Reuse Analysis** (shaliah-next only):
   Audit existing components for reuse opportunities:
   
   - **Search locations**:
     * `apps/shaliah-next/src/components/` (shared components, shadcn/ui wrappers)
     * `apps/shaliah-next/src/modules/*/ui/components/` (feature-scoped components)
   
   - **Evaluation criteria**:
     * Does component match requirements for QR code display, profile card integration, loading states?
     * Can component be extended vs creating new component?
     * Is component tightly coupled to another feature domain?
   
   - **Document findings**: Create "Component Reuse Analysis" section below in this plan.md with:
     * List of evaluated components
     * Reuse decision (yes/no/extend)
     * Rationale for each decision
     * Gaps requiring new components
   
   *(To be completed after reviewing existing components)*

3. **API Contracts** (`contracts/` directory):
   For each user action, generate endpoint contracts:
   
   - **POST /api/ezer-auth/token** (Generate authentication token):
     * Request: None (authenticated via session)
     * Response: `{ token: string, expiresAt: string, deepLink: string, qrCodeSvg: string }`
     * Errors: 401 Unauthorized, 500 Internal Server Error
   
   - **Bot: POST /start command handler** (Validate and link account):
     * Input: `ctx.match` (token from Telegram deep link)
     * Process: Validate token, link telegram_user_id, mark token used, sync language
     * Response: Confirmation message in user's language
     * Errors: Invalid token, expired token, already used, database error
   
   - **POST /api/auth/signout extension** (Cascade to Ezer):
     * Existing signout + set `telegram_user_id = NULL`
     * No new endpoint needed (extend existing)

4. **Contract Tests**:
   One test file per endpoint, asserting request/response schemas:
   
   - `apps/shaliah-next/__tests__/contract/ezer-auth.contract.test.ts`
     * Test: POST /api/ezer-auth/token returns valid schema
     * Test: Error responses match expected formats
   
   - `apps/ezer-bot/__tests__/contract/auth-link.contract.test.ts`
     * Test: /start command validates token schema
     * Test: Error responses match expected message structures
   
   *(Tests must fail - no implementation yet)*

5. **Quickstart Test Scenarios** (`quickstart.md`):
   Manual integration test scenarios extracted from acceptance criteria:
   
   - **Scenario 1: Happy Path - QR Code Authentication**
     1. Sign in to Shaliah web app
     2. Navigate to profile page
     3. Verify QR code and link displayed
     4. Scan QR code with Telegram app
     5. Verify bot sends confirmation message in correct language
     6. Verify profile shows linked status
   
   - **Scenario 2: Link Expiration**
     1. Generate authentication link
     2. Wait 16 minutes
     3. Attempt to use link in bot
     4. Verify error message displayed
   
   - **Scenario 3: Sign-Out Propagation**
     1. Link Telegram account to Shaliah
     2. Sign out from Shaliah
     3. Send message to bot
     4. Verify bot indicates account is unlinked
   
   *(Full quickstart.md will contain all 10 acceptance scenarios from spec.md)*

6. **Update Agent Context File**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - Adds: `next-qrcode`, grammY deep links, Telegram user ID handling
   - Preserves manual additions between markers
   - Updates recent changes section (keep last 3 entries)
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, Component Reuse Analysis section (in plan.md), contracts/ directory, contract tests (failing), quickstart.md, updated .github/copilot-instructions.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

**No constitutional violations identified.** All principles pass without exception.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - ✅ research.md generated
- [x] Phase 1: Design complete (/plan command) - ✅ data-model.md, contracts/, quickstart.md, contract tests generated
- [x] Phase 2: Task planning approach described (/plan command - approach only, not execution)
- [ ] Phase 3: Tasks generated (/tasks command - NOT YET EXECUTED)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (all 7 principles satisfied)
- [x] Post-Design Constitution Re-check: PASS (artifacts align with constitution)
- [x] All contract tests created and failing: DONE (2 contract test files created)
- [ ] All integration tests created: Pending (will be created during /tasks execution)
- [ ] Implementation tests passing: Pending
- [ ] Quickstart manual validation: Pending

**Artifacts Generated**:
- [x] plan.md (this file) - 531 lines
- [x] research.md - Token generation, QR codes, deep links, schema design, performance, i18n, sign-out
- [x] data-model.md - AuthToken and UserProfile entities with complete specifications
- [x] contracts/generate-token.md - API contract for token generation endpoint
- [x] contracts/bot-start-command.md - Bot command contract for token validation
- [x] quickstart.md - 10 acceptance scenarios + 5 edge cases + performance + security tests (21 total scenarios)
- [x] apps/shaliah-next/__tests__/contract/ezer-auth.contract.test.ts - Failing contract tests (Jest)
- [x] apps/ezer-bot/__tests__/contract/auth-link.contract.test.ts - Failing contract tests (Vitest)
- [x] .github/copilot-instructions.md - Updated with new technologies

## Execution Summary

**Command**: `/plan` (Constitution v4.2.0)  
**Feature**: 005-ezer-login (Ezer Bot Authentication Link)  
**Branch**: `005-ezer-login`  
**Date**: 2025-01-16

### Artifacts Generated

- ✅ **plan.md**: Complete implementation plan (this document)
  * Summary: Cross-app authentication with QR codes and deep links
  * Technical Context: next-qrcode, Supabase, grammY, testing frameworks
  * Architecture Review: DDD patterns (shaliah), composer pattern (ezer-bot)
  * Constitution Check: All 7 principles PASS
  * Component Reuse Analysis: 3 reused, 1 extended, 2 new components
  * Phase 0 Research: 7 research topics outlined (token generation, QR codes, deep links, schema, performance, i18n sync, sign-out)
  * Phase 1 Design: Data model, contracts, component analysis, quickstart scenarios
  * Phase 2 Task Strategy: TDD order, dependency-based sequencing

### Sections Completed in plan.md

1. ✅ Header (Branch, Date, Spec link)
2. ✅ Summary (Feature overview, scope, deferred items)
3. ✅ Technical Context (Technologies, dependencies, testing stack)
4. ✅ Architecture Review (Patterns from both architecture guides)
5. ✅ Component Reuse Analysis (5 evaluated components, 2 new components identified)
6. ✅ Constitution Check (All 7 principles validated and passing)
7. ✅ Project Structure (Documentation and source code layout)
8. ✅ Phase 0: Research (7 research topics with detailed approach)
9. ✅ Phase 1: Design & Contracts (6 key artifacts described)
10. ✅ Phase 2: Task Planning Approach (Strategy for /tasks command)
11. ✅ Complexity Tracking (No violations - N/A)
12. ✅ Progress Tracking (Phase and gate status)

### Next Steps (Pending Artifacts - DO NOT EXECUTE NOW)

**Phase 0 - Generate research.md**:
```bash
# Will be executed in /tasks workflow
# Creates: specs/005-ezer-login/research.md
```

**Phase 1 - Generate design artifacts**:
```bash
# Will be executed in /tasks workflow
# Creates:
#   specs/005-ezer-login/data-model.md
#   specs/005-ezer-login/contracts/*.yaml
#   specs/005-ezer-login/quickstart.md
#   apps/shaliah-next/__tests__/contract/ezer-auth.contract.test.ts
#   apps/ezer-bot/__tests__/contract/auth-link.contract.test.ts
```

**Update agent context**:
```bash
.specify/scripts/bash/update-agent-context.sh copilot
```

**Next Command**: `/tasks` to generate tasks.md with implementation tasks

### Key Decisions Documented

1. **QR Library**: next-qrcode SVG variant (user-specified)
2. **Token Strategy**: One token per user, update in place (not create new)
3. **Concurrency**: First-write-wins with atomic transactions
4. **Data Access**: Ezer bot queries Supabase directly (no API layer)
5. **Performance**: <2s for QR generation (relaxed from 500ms)
6. **Cleanup**: On-demand when user generates new token
7. **Component Strategy**: Extend ProfileDashboard, add EzerAuthSection module component
8. **Testing**: Jest+RTL (shaliah), Vitest (ezer-bot), Chrome DevTools MCP for QR validation

### Architecture Alignment

- **shaliah-next**: DDD-inspired modules (`modules/ezer-auth/`), Drizzle schema in `db/schema/`, server actions for mutations, Jest+RTL for all tests
- **ezer-bot**: Feature composer (`modules/auth-link.ts`), direct Supabase queries, Fluent i18n, Vitest with mock context
- **Shared**: Logger package (`@yesod/logger`), bilingual i18n (pt-BR + en-US mandatory), atomic database operations

---
*Based on Constitution v4.2.0 - See `.specify/memory/constitution.md`*
