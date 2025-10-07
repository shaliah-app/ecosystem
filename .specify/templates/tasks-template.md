# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/
**Application(s):** [shaliah-next | ezer-bot | poel-worker]

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: initialize, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: domains, adapters, CLI commands + test iteration
   → Integration: DB, middleware, logging + test iteration
   → i18n & Polishing: translations, linting, type checking
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions (TypeScript Monorepo)
- **Apps**: `apps/{shaliah-next|ezer-bot|poel-worker}/src/`
- **Tests (backend)**: colocated or `apps/<app>/__tests__/` (shaliah-next: Jest, ezer-bot: Vitest, poel-worker: Deno test)
- **Tests (web UI)**: `apps/shaliah-next/__tests__/` with Jest + RTL
- **Packages**: `packages/<name>/src/`
- Adjust exact paths based on plan.md structure

## Phase 1: Setup
- [ ] T001 Create project structure per implementation plan (apps/*, packages/*)
- [ ] T002 Initialize TypeScript project and framework dependencies
- [ ] T003 [P] Configure ESLint (shared config) and Prettier
- [ ] T004 [P] Wire shared logger (packages/logger) and baseline Sentry setup
- [ ] T005 [P] Supabase client bootstrap (URL/keys via env) if applicable

## Phase 2: i18n (Optional) 
**IMPORTANT**: This phase is OPTIONAL and should only be included if the LLM determines i18n is relevant for the given implementation. Skip this phase if the feature doesn't involve user-facing text or if i18n setup already exists.

- [ ] T006 [P] i18n: Add common translation keys in apps/shaliah-next/messages/{pt-BR,en}.json (MUST be complete before PR)
- [ ] T007 [P] i18n: Add feature-specific translation keys in apps/shaliah-next/src/modules/{feature}/messages/{pt-BR,en}.json if feature has domain-specific terms
- [ ] T008 [P] i18n: Configure dynamic message loader in apps/shaliah-next/src/i18n/load-messages.ts to merge common and feature translations (if first feature-based i18n setup)
- [ ] T009 [P] i18n: Configure next-intl in apps/shaliah-next/src/i18n/request.ts (if first i18n setup)
- [ ] T010 [P] i18n (bot): Add translation keys for ALL user-facing text in both pt-BR.ftl and en.ftl in apps/ezer-bot/src/locales/ (MUST be complete before PR)
- [ ] T011 [P] i18n (bot): Implement /language command with sessions (if first i18n setup)
- [ ] T012 [P] i18n: Document additional planned languages in specs/[###-feature]/roadmap.md (do NOT add partial translations)

## Phase 3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 4
**IMPORTANT GUIDELINE:**
- These tests MUST be written and MUST FAIL before ANY implementation

- [ ] T013 [P] Contract test POST /api/users in apps/shaliah-next/__tests__/contract/users.post.test.ts (Jest)
- [ ] T014 [P] Contract test GET /api/users/{id} in apps/shaliah-next/__tests__/contract/users.get.test.ts (Jest)
- [ ] T015 [P] Integration test auth flow in apps/shaliah-next/__tests__/integration/auth.test.ts (Jest)
- [ ] T016 [P] Web UI component test in apps/shaliah-next/__tests__/components/Example.test.tsx (Jest+RTL)
- [ ] T017 [P] Bot command behavior test in apps/ezer-bot/__tests__/commands/start.test.ts (Vitest)

## Phase 4: Core Implementation + Testing (ONLY after tests are failing)
**IMPORTANT GUIDELINES:**
- Follow architecture pattern for target app
- Each implementation task includes testing iteration until tests pass

**For shaliah-next (DDD-inspired modules):**
- [ ] T018 [P] Domain types and validators in apps/shaliah-next/src/modules/{feature}/domain/
- [ ] T019 [P] Repository interfaces (ports) in apps/shaliah-next/src/modules/{feature}/ports/
- [ ] T020 [P] Supabase adapters in apps/shaliah-next/src/modules/{feature}/adapters/
- [ ] T021 [P] Use cases in apps/shaliah-next/src/modules/{feature}/use-cases/
- [ ] T022 Composition root wiring in apps/shaliah-next/src/lib/di.ts
- [ ] T023 [P] Server actions in apps/shaliah-next/src/modules/{feature}/ui/server/actions.ts
- [ ] T024 [P] Presentational components in apps/shaliah-next/src/modules/{feature}/ui/components/
- [ ] T025 [P] Client-side hooks in apps/shaliah-next/src/modules/{feature}/ui/hooks/
- [ ] T026 [P] Zustand stores (scoped) in apps/shaliah-next/src/modules/{feature}/stores/ (if needed)
- [ ] T027 Wire components in Next.js App Router pages/layouts

**For ezer-bot (composer-based):**
- [ ] T018 [P] Feature composer in apps/ezer-bot/src/modules/{feature}.ts
- [ ] T019 [P] i18n keys in apps/ezer-bot/src/locales/*.ftl (pt-BR and en required)
- [ ] T020 Install sequentialize before session if using state
- [ ] T021 Install auto-retry plugin: bot.api.config.use(autoRetry())
- [ ] T022 Mount composer in apps/ezer-bot/src/bot.ts
- [ ] T023 Setup graceful shutdown (SIGTERM/SIGINT handlers)

**Common to all:**
- [ ] T024 Input validation with zod in API/bot/server action layer
- [ ] T025 Error handling and logging via packages/logger

**Testing & Validation (after implementation complete):**
- [ ] T028 Run all related tests for implemented features (unit, integration, component)
- [ ] T029 [when appropriate] Use Supabase MCP to inspect DB state and validate data operations (shaliah-next adapters, worker)
- [ ] T030 [when appropriate] Use Chrome DevTools MCP for browser testing and UI validation (shaliah-next components/pages)
- [ ] T031 Iterate on failures: analyze → fix implementation (or test if requirements misunderstood) → retest
- [ ] T032 Verify all Phase 4 implementation complete before proceeding to integration

## Phase 5: Integration
- [ ] T033 Drizzle schema definition in apps/shaliah-next/db/schema/ (single source of truth)
- [ ] T034 Generate Drizzle migration in apps/shaliah-next/db/migrations/ and apply to Supabase
- [ ] T035 Type imports via workspace references (e.g., from '@yesod/shaliah-next/db/schema') if consumed by poel-worker
- [ ] T036 Connect services to Supabase/DB using Drizzle ORM
- [ ] T037 Auth middleware integrated with Supabase Auth
- [ ] T038 Request/response logging (consistent fields) via packages/logger
- [ ] T039 CORS and security headers
- [ ] T040 Queue integration (Supabase Queues) for long-running tasks (poel-worker)

**Integration Testing & Validation:**
- [ ] T041 Run integration tests for database connections and Supabase operations
- [ ] T042 Use Supabase MCP to validate schema, migrations, and RLS policies
- [ ] T043 Test auth flows end-to-end (login, session, permissions)
- [ ] T044 Iterate on failures: analyze → fix → retest until all integration tests pass

## Phase 6: Code Quality Validation & Polish
**CRITICAL: Run after all implementation + testing complete**

**Code Quality:**
- [ ] T045 Run ESLint across all modified files and fix violations
- [ ] T046 Run TypeScript type check (tsc --noEmit) and resolve type errors
- [ ] T047 For unavoidable ESLint/TS errors: add suppression comments (@ts-expect-error, eslint-disable-next-line) with detailed justification
- [ ] T048 Run Prettier to ensure consistent formatting
- [ ] T049 Verify no console.log statements remain (use logger package instead)

**Polish & Final Cleanup:**
- [ ] T050 Remove code duplication
- [ ] T051 Review and optimize performance where applicable
- [ ] T052 Final code review and documentation updates

## Dependencies
- Setup (Phase 1: T001-T005) before i18n (Phase 2: T006-T012, optional)
- i18n (Phase 2: T006-T012, optional) before Tests (Phase 3: T013-T017)
- Tests (Phase 3: T013-T017) MUST complete before Implementation (Phase 4: T018-T032)
- Implementation (Phase 4: T018-T032) before Integration (Phase 5: T033-T044)
- Integration (Phase 5: T033-T044) before Code Quality & Polish (Phase 6: T045-T052)
- Within phases: Tasks marked [P] can run in parallel; sequential tasks must complete in order

## Parallel Example
```
# Launch T013-T017 together (Phase 3: Tests First):
Task: "Contract test POST /api/users in apps/shaliah-next/__tests__/contract/users.post.test.ts (Jest)"
Task: "Contract test GET /api/users/{id} in apps/shaliah-next/__tests__/contract/users.get.test.ts (Jest)"
Task: "Integration test auth flow in apps/shaliah-next/__tests__/integration/auth.test.ts (Jest)"
Task: "Web UI component test in apps/shaliah-next/__tests__/components/UserProfile.test.tsx (Jest+RTL)"
```

## Notes
- [P] tasks = different files, no dependencies
- i18n phase (Phase 2) is OPTIONAL - only include if LLM determines i18n is relevant for the implementation
- Verify tests fail before implementing
- Implementation tasks focus on code; dedicated testing tasks handle refactoring
- Integration tasks focus on wiring; dedicated testing tasks validate integration
- Update tests only if requirements were misunderstood, not to make implementation easier
- Code quality validation catches linting/type errors after all testing complete
- Polish tasks merged into Phase 6 (Code Quality & Polish)
- Avoid: vague tasks, same file conflicts, skipping dedicated testing phases

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
   
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
   
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → i18n (optional) → Tests → Models → Services → Endpoints → Integration → Code Quality & Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests written first and fail before implementation (TDD)
- [ ] Dedicated testing tasks included after implementation phases (Phases 4-5)
- [ ] Code quality validation phase included
- [ ] i18n phase (Phase 2) included only if LLM determines it's relevant for the implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Supabase usage validated for auth/db/storage where applicable
- [ ] Drizzle schema changes centralized in apps/shaliah-next/db/schema/ with proper migrations
- [ ] Type sharing via workspace references when schema consumed by poel-worker
- [ ] TypeScript-first enforced: all new code in TypeScript, shared packages utilized (Principle VI)
- [ ] i18n coverage with feature-based organization: common translations in messages/ and feature-specific in modules/<feature>/messages/ for pt-BR and en-US (mandatory pair); additional languages deferred to roadmap.md
- [ ] MCP servers (Chrome DevTools, Supabase, Shadcn) identified for use in testing tasks when appropriate and available
- [ ] For shaliah-next: existing components audited and reusable components explicitly listed in plan.md
- [ ] Observability wired (logger + Sentry) in every app touched
- [ ] Long-running work queued via Supabase Queues to poel-worker (no blocking API requests)

---

*Based on Constitution v4.3.0 — see `.specify/memory/constitution.md`*
````