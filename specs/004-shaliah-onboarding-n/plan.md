
# Implementation Plan: Shaliah Unified Onboarding & Authentication

**Branch**: `004-shaliah-onboarding-n` | **Date**: 2025-10-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/patrickkmatias/repos/yesod-ecosystem/specs/004-shaliah-onboarding-n/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Unified authentication flow for Shaliah Next that merges sign-in/sign-up into a single "Continue with" experience. Supports email magic links (15min validity, 60s cooldown, 10/hr rate limit) and Google OAuth. Automatically creates or links accounts by verified email. Includes conditional onboarding (only when full_name missing), language inference, optional avatar with placeholder, profile dashboard, and cross-app session with app-local logout. Session lifetime: 30 days absolute, 7 days idle.

## Technical Context
**Language/Version**: TypeScript 5.x (Next.js 14+, Node.js 20+)  
**Primary Dependencies**: Next.js, Supabase JS client, next-intl, shadcn/ui, React 18  
**Storage**: Supabase (PostgreSQL) — auth.users, public.user_profiles  
**Testing**: Jest + React Testing Library (frontend), Vitest (API endpoints if backend touched)  
**Target Platform**: Web (Chrome/Safari/Firefox modern versions), mobile-responsive  
**Project Type**: Web (frontend: shaliah-next; backend: yesod-api)  
**Performance Goals**: <2s auth UI load (3G Fast), <200ms magic-link send latency  
**Constraints**: Must use Supabase Auth for magic link & OAuth; session/cookie managed by Supabase SDK; rate-limit enforcement via API  
**Scale/Scope**: Affects login, onboarding, profile pages in shaliah-next; minor yesod-api changes for rate-limit/audit logging

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle III: Comprehensive Testing**: ✅ PASS — Plan uses Jest + RTL for shaliah-next UI components (auth, onboarding, profile). Vitest for any yesod-api endpoints touched (rate-limit logic).
- **Principle VI: TypeScript-First**: ✅ PASS — All code in TypeScript (Next.js app, React components, API client wrappers).
- **Principle VII: Supabase-First**: ✅ PASS — Feature relies on Supabase Auth for magic link & Google OAuth, Supabase DB for user_profiles table.
- **Principle VIII: MCP-Driven Development**: ✅ PASS — Chrome DevTools MCP for frontend testing, Supabase MCP for DB inspection during development.
- **Principle IX: Internationalization (i18n)**: ✅ PASS — All UI strings use next-intl; spec requires EN + PT-BR support (NFR-003). Language inference from browser/profile.

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
├── yesod-api/
│   ├── src/
│   │   ├── contexts/          # DDD bounded contexts (to be created)
│   │   │   ├── auth/
│   │   │   │   ├── domain/
│   │   │   │   ├── application/
│   │   │   │   ├── infra/
│   │   │   │   └── api/
│   │   │   └── users/
│   │   │       ├── domain/
│   │   │       ├── application/
│   │   │       ├── infra/
│   │   │       └── api/
│   │   ├── routes/            # Legacy bootstrap structure (to be removed)
│   │   └── config/
│   └── tests/
├── shaliah-next/
│   ├── src/
│   └── __tests__/
├── ezer-bot/
│   ├── src/
│   └── __tests__/
└── worker/
    ├── src/
    └── __tests__/
packages/
├── logger/
└── ...
```

**Structure Decision**: Web project (frontend + backend). Primary changes in `apps/shaliah-next/src/` (auth components, onboarding flow, profile dashboard). Backend changes in `apps/yesod-api/src/contexts/` following DDD bounded contexts per Constitution v2.5.1 Principle I. Current `routes/` structure is minimal bootstrapping code and will be replaced during this feature implementation. Shared `packages/logger` for structured logging.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base structure.
- Generate tasks from Phase 1 design artifacts:
  - **Contracts** (3 endpoints) → 3 contract test tasks [P].
  - **Data model** → 2 migration tasks (magic_link_attempts table + trigger update) [P].
  - **UI components** → 8 component tasks:
    - Auth form (email/Google)
    - Cooldown timer component
    - Onboarding form
    - Profile dashboard
    - Error overlay (storage blocked)
    - i18n translation files (EN, PT-BR)
  - **Integration tests** → 10 acceptance scenario tasks (one per quickstart scenario).
  - **API endpoint implementations** → 3 tasks (magic-link request, profile get/update).

**Ordering Strategy**:
1. **Setup Phase** (parallel):
   - [P] Create DB migrations (magic_link_attempts + trigger).
   - [P] Set up i18n structure (next-intl config, message files).
   - [P] Add Supabase Auth configuration (magic link + Google OAuth).

2. **Contract Tests** (parallel, TDD foundation):
   - [P] Write contract test: POST /api/auth/magic-link/request.
   - [P] Write contract test: GET /api/user/profile.
   - [P] Write contract test: PATCH /api/user/profile.

3. **Backend Implementation** (sequential, make tests pass):
   - Implement magic-link request handler (rate limit logic).
   - Implement profile GET handler.
   - Implement profile PATCH handler.

4. **Frontend Components** (parallel after backend):
   - [P] Auth form component (email input, provider buttons).
   - [P] Cooldown timer component.
   - [P] Onboarding form component.
   - [P] Profile dashboard component.
   - [P] Error overlay component (storage detection).

5. **Integration Tests** (sequential after components):
   - Integration test: Magic link happy path (Scenario 1).
   - Integration test: Cooldown enforcement (Scenario 2).
   - Integration test: Rate limit (Scenario 3).
   - Integration test: Google OAuth signup (Scenario 4).
   - Integration test: Account linking (Scenario 5).
   - Integration test: Conditional onboarding (Scenario 6).
   - Integration test: Language change (Scenario 7).
   - Integration test: Session expiry (Scenario 8).
   - Integration test: Storage blocked (Scenario 9).
   - Integration test: App-local logout (Scenario 10).

6. **Refinement** (final):
   - i18n translation review (EN + PT-BR completeness).
   - Accessibility audit (keyboard nav, ARIA labels).
   - Performance check (2s load time on 3G Fast).

**Estimated Output**: ~61 numbered, ordered tasks in tasks.md

**Note**: Initial estimate was 35-40 tasks. Actual count expanded due to: (1) Additional i18n languages (5 tasks: T047-T051), (2) Comprehensive test coverage per TDD (T011-T024), (3) Remediation analysis additions (T020a, T039a, T059a-b). Expansion aligns with constitutional testing and i18n requirements.

**Parallel Execution Markers**: Tasks marked [P] can run in parallel (independent files/systems).

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.5.1 - See `.specify/memory/constitution.md`*
