# Tasks: Ezer Bot Dependency Fix

**Input**: Design documents from `/specs/007-ezer-fix/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/
**Application(s):** ezer-bot

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
- **Apps**: `apps/ezer-bot/src/`
- **Tests**: `apps/ezer-bot/__tests__/` (Vitest)
- **Packages**: `packages/<name>/src/`

## Phase 1: Setup
- [x] T001 Create dependency middleware module structure in apps/ezer-bot/src/modules/dependency.ts
- [x] T002 Initialize environment configuration for NODE_ENV, SHALIAH_HEALTH_URL, DEPENDENCY_CHECK_TIMEOUT
- [x] T005 [P] Setup HTTP client configuration for health checks

## Phase 2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3
**IMPORTANT GUIDELINE:**
- These tests MUST be written and MUST FAIL before ANY implementation

- [x] T006 [P] Contract test for Shaliah health check in apps/ezer-bot/__tests__/contract/shaliah-health-check.test.ts (Vitest)
- [x] T007 [P] Integration test for dependency middleware in apps/ezer-bot/__tests__/integration/dependency.test.ts (Vitest)
- [x] T008 [P] Unit test for dependency check logic in apps/ezer-bot/__tests__/modules/dependency.test.ts (Vitest)
- [x] T009 [P] Integration test for development mode bypass in apps/ezer-bot/__tests__/integration/development-mode.test.ts (Vitest)
- [x] T010 [P] Integration test for offline scenario in apps/ezer-bot/__tests__/integration/offline-scenario.test.ts (Vitest)

## Phase 3: Core Implementation + Testing (ONLY after tests are failing)
**IMPORTANT GUIDELINES:**
- Follow ezer-bot composer-based architecture
- Each implementation task includes testing iteration until tests pass

**For ezer-bot (composer-based):**
- [x] T011 [P] Dependency middleware composer in apps/ezer-bot/src/modules/dependency.ts
- [x] T012 [P] Health check service in apps/ezer-bot/src/lib/health-check.ts
- [x] T013 [P] Environment configuration service in apps/ezer-bot/src/lib/config.ts
- [x] T014 [P] i18n keys in apps/ezer-bot/src/locales/*.ftl (pt-BR and en required)
- [x] T015 Mount dependency middleware in apps/ezer-bot/src/bot.ts
- [x] T016 Setup graceful shutdown (SIGTERM/SIGINT handlers)

**Common to all:**
- [x] T017 Input validation with zod in dependency middleware
- [x] T018 Error handling and logging via packages/logger

**Testing & Validation (after implementation complete):**
- [x] T019 Run all related tests for implemented features (unit, integration)
- [x] T020 Iterate on failures: analyze → fix implementation (or test if requirements misunderstood) → retest
- [x] T021 Verify all Phase 3 implementation complete before proceeding to integration

## Phase 4: Integration
- [x] T022 Connect dependency middleware to grammY bot instance
- [x] T023 Request/response logging (consistent fields) via packages/logger
- [x] T024 HTTP client integration with timeout handling
- [x] T025 Environment variable validation and error handling

**Integration Testing & Validation:**
- [x] T026 Run integration tests for dependency middleware and health checks
- [x] T027 Test development mode bypass end-to-end
- [x] T028 Test offline scenario end-to-end
- [x] T029 Iterate on failures: analyze → fix → retest until all integration tests pass

## Phase 5: Code Quality Validation
**CRITICAL: Run after all implementation + testing complete**
- [ ] T030 Run ESLint across all modified files and fix violations
- [ ] T031 Run TypeScript type check (tsc --noEmit) and resolve type errors
- [ ] T032 For unavoidable ESLint/TS errors: add suppression comments (@ts-expect-error, eslint-disable-next-line) with detailed justification
- [ ] T033 Run Prettier to ensure consistent formatting
- [ ] T034 Verify no console.log statements remain (use logger package instead)

## Phase 6: i18n & Polishing
- [x] T035 [P] i18n (bot): Add translation keys for offline error message in both pt-BR.ftl and en.ftl in apps/ezer-bot/src/locales/ (MUST be complete before PR)
- [x] T036 [P] i18n (bot): Add translation keys for development mode logging in both pt-BR.ftl and en.ftl in apps/ezer-bot/src/locales/
- [x] T037 [P] i18n (bot): Add translation keys for health check logging in both pt-BR.ftl and en.ftl in apps/ezer-bot/src/locales/
- [ ] T038 Remove code duplication
- [ ] T039 Update README with dependency configuration instructions

## Dependencies
- Setup (Phase 1: T001-T005) before Tests (Phase 2: T006-T010)
- Tests (Phase 2: T006-T010) MUST complete before Implementation (Phase 3: T011-T021)
- Implementation (Phase 3: T011-T021) before Integration (Phase 4: T022-T029)
- Integration (Phase 4: T022-T029) before Code Quality (Phase 5: T030-T034)
- Code Quality (Phase 5: T030-T034) before i18n & Polish (Phase 6: T035-T039)
- Within phases: Tasks marked [P] can run in parallel; sequential tasks must complete in order

## Parallel Example
```
# Launch T006-T010 together (Phase 2: Tests First):
Task: "Contract test for Shaliah health check in apps/ezer-bot/__tests__/contract/shaliah-health-check.test.ts (Vitest)"
Task: "Integration test for dependency middleware in apps/ezer-bot/__tests__/integration/dependency.test.ts (Vitest)"
Task: "Unit test for dependency check logic in apps/ezer-bot/__tests__/modules/dependency.test.ts (Vitest)"
Task: "Integration test for development mode bypass in apps/ezer-bot/__tests__/integration/development-mode.test.ts (Vitest)"
Task: "Integration test for offline scenario in apps/ezer-bot/__tests__/integration/offline-scenario.test.ts (Vitest)"
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
   - Shaliah health check contract → contract test task [P]
   - Health check endpoint → implementation task
   
2. **From Data Model**:
   - Environment configuration → config service task [P]
   - Runtime state → middleware task
   
3. **From User Stories**:
   - Normal operation → integration test [P]
   - Offline scenario → integration test [P]
   - Development mode → integration test [P]

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests written first and fail before implementation (TDD)
- [x] Dedicated testing tasks included after implementation phases (Phases 3-4)
- [x] Code quality validation phase included
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TypeScript-first enforced: all new code in TypeScript, shared packages utilized (Principle VI)
- [x] i18n coverage with feature-based organization: translation keys in locales/ for pt-BR and en-US (mandatory pair)
- [x] Observability wired (logger + Sentry) in ezer-bot
- [x] No long-running operations (dependency check is synchronous and fast)

---

*Based on Constitution v4.2.0 — see `.specify/memory/constitution.md`*
