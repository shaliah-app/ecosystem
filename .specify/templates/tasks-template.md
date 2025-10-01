# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

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
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
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
- **Apps**: `apps/{yesod-api|shaliah-next|ezer-bot|worker}/src/`
- **Tests (backend)**: colocated or `apps/<app>/__tests__/` with Vitest
- **Tests (web UI)**: `apps/shaliah-next/__tests__/` with Jest + RTL
- **Packages**: `packages/<name>/src/`
- Adjust exact paths based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan (apps/*, packages/*)
- [ ] T002 Initialize TypeScript project and framework dependencies
- [ ] T003 [P] Configure ESLint (shared config) and Prettier
- [ ] T004 [P] Wire shared logger (packages/logger) and baseline Sentry setup
- [ ] T005 [P] Supabase client bootstrap (URL/keys via env) if applicable

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T006 [P] Contract test POST /api/users in apps/yesod-api/__tests__/contract/users.post.test.ts (Vitest)
- [ ] T007 [P] Contract test GET /api/users/{id} in apps/yesod-api/__tests__/contract/users.get.test.ts (Vitest)
- [ ] T008 [P] Integration test auth flow in apps/yesod-api/__tests__/integration/auth.test.ts (Vitest)
- [ ] T009 [P] Web UI component test in apps/shaliah-next/__tests__/components/Example.test.tsx (Jest+RTL)
- [ ] T010 [P] Bot command behavior test in apps/ezer-bot/__tests__/commands/start.test.ts (Vitest)

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T011 [P] User model in apps/yesod-api/src/db/models/user.ts
- [ ] T012 [P] UserService CRUD in apps/yesod-api/src/services/user-service.ts
- [ ] T013 [P] CLI command in apps/worker/src/cli/user.ts (if applicable)
- [ ] T014 POST /api/users endpoint in apps/yesod-api/src/routes/users.ts
- [ ] T015 GET /api/users/{id} endpoint in apps/yesod-api/src/routes/users.ts
- [ ] T016 Input validation with zod or validators
- [ ] T017 Error handling and logging via packages/logger

## Phase 3.4: Integration
- [ ] T018 Connect services to Supabase/DB (Drizzle schema + migrations)
- [ ] T019 Auth middleware integrated with Supabase Auth
- [ ] T020 Request/response logging (consistent fields) via packages/logger
- [ ] T021 CORS and security headers
- [ ] T022 Queue integration (pg-boss) for long-running tasks (worker)

## Phase 3.5: i18n & Polish
- [ ] T023 [P] i18n: Add/enforce keys for pt-BR and en (key langs) in apps/shaliah-next/messages/*.json
- [ ] T024 [P] i18n: Add es, fr, de, uk, ru placeholders/messages
- [ ] T025 [P] i18n: Configure next-intl in apps/shaliah-next/src/i18n/request.ts
- [ ] T026 [P] i18n (bot): Setup @grammyjs/i18n with locales/ in apps/ezer-bot/
- [ ] T027 [P] i18n (bot): Implement /language command with sessions
- [ ] T028 [P] Unit tests for validation in apps/yesod-api/__tests__/unit/validation.test.ts
- [ ] T029 Performance tests (<200ms p95 where applicable)
- [ ] T030 [P] Update docs/api.md and quickstart.md
- [ ] T031 Remove duplication
- [ ] T032 Run manual-testing.md

## Dependencies
- Tests (T004-T007) before implementation (T008-T014)
- T008 blocks T009, T015
- T016 blocks T018
- Implementation before polish (T019-T023)

## Parallel Example
```
# Launch T004-T007 together:
Task: "Contract test POST /api/users in tests/contract/test_users_post.py"
Task: "Contract test GET /api/users/{id} in tests/contract/test_users_get.py"
Task: "Integration test registration in tests/integration/test_registration.py"
Task: "Integration test auth in tests/integration/test_auth.py"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

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
- [ ] All tests come before implementation (TDD)
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Supabase usage validated for auth/db/storage where applicable
- [ ] i18n coverage for pt-BR and en (key langs); es, fr, de, uk, ru planned
- [ ] Observability wired (logger + Sentry) in every app touched
- [ ] Long-running work queued via pg-boss (no blocking API requests)

---

*Based on Constitution v2.2.0 — see `.specify/memory/constitution.md`*