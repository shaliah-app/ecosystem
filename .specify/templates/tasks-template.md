# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/
**Application(s):** [shaliah-next | ezer-bot | worker]

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
- **Apps**: `apps/{shaliah-next|ezer-bot|worker}/src/`
- **Tests (backend)**: colocated or `apps/<app>/__tests__/` with Vitest
- **Tests (web UI)**: `apps/shaliah-next/__tests__/` with Jest + RTL
- **Packages**: `packages/<name>/src/`
- Adjust exact paths based on plan.md structure

## Phase 1: Setup
- [ ] T001 Create project structure per implementation plan (apps/*, packages/*)
- [ ] T002 Initialize TypeScript project and framework dependencies
- [ ] T003 [P] Configure ESLint (shared config) and Prettier
- [ ] T004 [P] Wire shared logger (packages/logger) and baseline Sentry setup
- [ ] T005 [P] Supabase client bootstrap (URL/keys via env) if applicable

## Phase 2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3
**IMPORTANT GUIDELINE:**
- These tests MUST be written and MUST FAIL before ANY implementation

- [ ] T006 [P] Contract test POST /api/users in apps/shaliah-next/__tests__/contract/users.post.test.ts (Vitest)
- [ ] T007 [P] Contract test GET /api/users/{id} in apps/shaliah-next/__tests__/contract/users.get.test.ts (Vitest)
- [ ] T008 [P] Integration test auth flow in apps/shaliah-next/__tests__/integration/auth.test.ts (Vitest)
- [ ] T009 [P] Web UI component test in apps/shaliah-next/__tests__/components/Example.test.tsx (Jest+RTL)
- [ ] T010 [P] Bot command behavior test in apps/ezer-bot/__tests__/commands/start.test.ts (Vitest)

## Phase 3: Core Implementation + Testing (ONLY after tests are failing)
**IMPORTANT GUIDELINES:**
- Follow architecture pattern for target app
- Each implementation task includes testing iteration until tests pass

**For shaliah-next (DDD-inspired modules):**
- [ ] T011 [P] Domain types and validators in apps/shaliah-next/src/modules/{feature}/domain/
- [ ] T012 [P] Repository interfaces (ports) in apps/shaliah-next/src/modules/{feature}/ports/
- [ ] T013 [P] Supabase adapters in apps/shaliah-next/src/modules/{feature}/adapters/
- [ ] T014 [P] Use cases in apps/shaliah-next/src/modules/{feature}/use-cases/
- [ ] T015 Composition root wiring in apps/shaliah-next/src/lib/di.ts
- [ ] T016 [P] Server actions in apps/shaliah-next/src/modules/{feature}/ui/server/actions.ts
- [ ] T017 [P] Presentational components in apps/shaliah-next/src/modules/{feature}/ui/components/
- [ ] T018 [P] Client-side hooks in apps/shaliah-next/src/modules/{feature}/ui/hooks/
- [ ] T019 [P] Zustand stores (scoped) in apps/shaliah-next/src/modules/{feature}/stores/ (if needed)
- [ ] T020 Wire components in Next.js App Router pages/layouts

**For ezer-bot (composer-based):**
- [ ] T011 [P] Feature composer in apps/ezer-bot/src/modules/{feature}.ts
- [ ] T012 [P] i18n keys in apps/ezer-bot/src/locales/*.ftl (pt-BR and en required)
- [ ] T013 Install sequentialize before session if using state
- [ ] T014 Install auto-retry plugin: bot.api.config.use(autoRetry())
- [ ] T015 Mount composer in apps/ezer-bot/src/bot.ts
- [ ] T016 Setup graceful shutdown (SIGTERM/SIGINT handlers)

**Common to all:**
- [ ] T021 Input validation with zod in API/bot/server action layer
- [ ] T022 Error handling and logging via packages/logger

**Testing & Validation (after implementation complete):**
- [ ] T023 Run all related tests for implemented features (unit, integration, component)
- [ ] T024 [when appropriate] Use Supabase MCP to inspect DB state and validate data operations (shaliah-next adapters, worker)
- [ ] T025 [when appropriate] Use Chrome DevTools MCP for browser testing and UI validation (shaliah-next components/pages)
- [ ] T026 Iterate on failures: analyze → fix implementation (or test if requirements misunderstood) → retest
- [ ] T027 Verify all Phase 3 implementation complete before proceeding to integration

## Phase 4: Integration
- [ ] T028 Connect services to Supabase/DB (Drizzle schema + migrations)
- [ ] T029 Auth middleware integrated with Supabase Auth
- [ ] T030 Request/response logging (consistent fields) via packages/logger
- [ ] T031 CORS and security headers
- [ ] T032 Queue integration (pg-boss) for long-running tasks (worker)

**Integration Testing & Validation:**
- [ ] T033 Run integration tests for database connections and Supabase operations
- [ ] T034 Use Supabase MCP to validate schema, migrations, and RLS policies
- [ ] T035 Test auth flows end-to-end (login, session, permissions)
- [ ] T036 Iterate on failures: analyze → fix → retest until all integration tests pass

## Phase 5: Code Quality Validation
**CRITICAL: Run after all implementation + testing complete**
- [ ] T037 Run ESLint across all modified files and fix violations
- [ ] T038 Run TypeScript type check (tsc --noEmit) and resolve type errors
- [ ] T039 For unavoidable ESLint/TS errors: add suppression comments (@ts-expect-error, eslint-disable-next-line) with detailed justification
- [ ] T040 Run Prettier to ensure consistent formatting
- [ ] T041 Verify no console.log statements remain (use logger package instead)

## Phase 6: i18n & Polishing
- [ ] T042 [P] i18n: Add translation keys for ALL user-facing text in both pt-BR and en-US (mandatory pair) in apps/shaliah-next/messages/*.json (MUST be complete before PR)
- [ ] T043 [P] i18n: Document additional planned languages in specs/[###-feature]/roadmap.md (do NOT add partial translations)
- [ ] T044 [P] i18n: Configure next-intl in apps/shaliah-next/src/i18n/request.ts (if first i18n setup)
- [ ] T045 [P] i18n (bot): Add translation keys for ALL user-facing text in both pt-BR.ftl and en.ftl in apps/ezer-bot/src/locales/ (MUST be complete before PR)
- [ ] T046 [P] i18n (bot): Implement /language command with sessions (if first i18n setup)
- [ ] T047 Remove code duplication

## Dependencies
- Setup (Phase 1: T001-T005) before Tests (Phase 2: T006-T010)
- Tests (Phase 2: T006-T010) MUST complete before Implementation (Phase 3: T011-T027)
- Implementation (Phase 3: T011-T027) before Integration (Phase 4: T028-T036)
- Integration (Phase 4: T028-T036) before Code Quality (Phase 5: T037-T041)
- Code Quality (Phase 5: T037-T041) before i18n & Polish (Phase 6: T042-T047)
- Within phases: Tasks marked [P] can run in parallel; sequential tasks must complete in order

## Parallel Example
```
# Launch T006-T009 together (Phase 2: Tests First):
Task: "Contract test POST /api/users in apps/shaliah-next/__tests__/contract/users.post.test.ts (Vitest)"
Task: "Contract test GET /api/users/{id} in apps/shaliah-next/__tests__/contract/users.get.test.ts (Vitest)"
Task: "Integration test auth flow in apps/shaliah-next/__tests__/integration/auth.test.ts (Vitest)"
Task: "Web UI component test in apps/shaliah-next/__tests__/components/UserProfile.test.tsx (Jest+RTL)"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Implementation tasks focus on code; dedicated testing tasks handle refactoring
- Integration tasks focus on wiring; dedicated testing tasks validate integration
- Update tests only if requirements were misunderstood, not to make implementation easier
- Code quality validation catches linting/type errors after all testing complete
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
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests written first and fail before implementation (TDD)
- [ ] Dedicated testing tasks included after implementation phases (Phases 3-4)
- [ ] Code quality validation phase included
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Supabase usage validated for auth/db/storage where applicable
- [ ] TypeScript-first enforced: all new code in TypeScript, shared packages utilized (Principle VI)
- [ ] i18n coverage for pt-BR and en-US (mandatory pair); additional languages deferred to roadmap.md
- [ ] MCP servers (Chrome DevTools, Supabase, Shadcn) identified for use in testing tasks when appropriate and available
- [ ] For shaliah-next: existing components audited and reusable components explicitly listed in plan.md
- [ ] Observability wired (logger + Sentry) in every app touched
- [ ] Long-running work queued via pg-boss (no blocking API requests)

---

*Based on Constitution v4.0.0 — see `.specify/memory/constitution.md`*
````