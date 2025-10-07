
# Implementation Plan: Ezer Bot Dependency Fix

**Branch**: `007-ezer-fix` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Constitution Version**: 4.2.0
**Input**: Feature specification from `/specs/007-ezer-fix/spec.md`

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
Ezer bot must enforce dependency on Shaliah application availability. When Shaliah is offline, Ezer bot should respond with a friendly error message. The feature includes a testing mode to bypass this dependency check for development purposes.

## Technical Context
**Language/Version**: TypeScript (Deno)  
**Primary Dependencies**: grammY framework, @yesod/logger package  
**Storage**: N/A (no persistent data required)  
**Testing**: Vitest (per constitution for ezer-bot)  
**Target Platform**: Deno server (Telegram bot)  
**Project Type**: single (ezer-bot application only)  
**Performance Goals**: Shaliah availability check completes within 5 seconds  
**Constraints**: Simple implementation, minimal complexity, testing mode support  
**Scale/Scope**: Single bot application, dependency check on every user interaction

## Architecture Review
*Required for features modifying existing applications. Document patterns from architecture guides.*

**Affected Applications**: ezer-bot  
**Architecture Guide(s) Read**: docs/architecture/ezer-bot.md

**Key Architectural Patterns to Follow**:
- Feature-focused modules: Organize by user features, not technical layers
- Composer pattern: Each feature is a self-contained grammY Composer
- Direct integration: Bot logic directly uses external services—no repository abstraction layers
- Simple state: Session data and context extensions handle state needs
- Minimal indirection: Avoid unnecessary abstractions that add complexity without value

**Relevant Conventions**:
- Middleware order: sequentialize → session → i18n → modules → error handler
- Always answer callback queries with ctx.answerCallbackQuery()
- Use grammY runner for long polling with graceful shutdown
- Global error boundary with bot.catch() for all error handling
- Structured logging with @yesod/logger package

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Domain-Centric Architecture**: ✅ YES - Feature uses ezer-bot composer modules for dependency checking. Business logic (dependency enforcement) remains independent of infrastructure details.
- **Principle II: Pragmatic, MVP-First Development**: ✅ YES - Feature is minimal: dependency check + error message + testing mode. No complex monitoring or advanced features.
- **Principle III: Comprehensive Testing**: ✅ YES - Uses Vitest for ezer-bot testing. TDD applied to dependency check logic. Tests for offline/online scenarios and testing mode.
- **Principle IV: Supabase-First Integration**: ✅ N/A - No database requirements for this feature. Simple HTTP health check to Shaliah.
- **Principle V: Decoupled, Asynchronous Processing**: ✅ YES - Dependency check is synchronous and fast (<5s). No long-running operations.
- **Principle VI: TypeScript-First Monorepo**: ✅ YES - All code in TypeScript within ezer-bot app. Uses shared logger package.
- **Principle VII (i18n)**: ✅ YES - Error messages need translation in pt-BR and en-US using @grammyjs/i18n with Fluent syntax.

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

**Structure Decision**: Primary changes in ezer-bot for Telegram bot dependency enforcement. The feature adds a new middleware module for Shaliah dependency checking and updates existing modules to respect the dependency. No database schema changes required.

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

2. **For shaliah-next features: Audit existing components**:
   - Search `apps/shaliah-next/src/components/` for shared components (atomic shadcn/ui wrappers, composed components)
   - Search `apps/shaliah-next/src/modules/*/ui/components/` for feature-scoped components
   - **Document findings**: Create "Component Reuse Analysis" section in this plan.md listing each evaluated component, whether it will be reused or why it doesn't fit requirements
   - Identify gaps requiring new components

3. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

4. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

5. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

6. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, component reuse analysis (in plan.md for shaliah-next), /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass
- Translation tasks for error messages

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Configuration → Middleware → Tests → Translations
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

**Task Categories**:
1. **Configuration Setup**: Environment variables, health check configuration
2. **Dependency Middleware**: Create Shaliah health check middleware
3. **Testing**: Vitest tests for all scenarios (online, offline, testing mode)
4. **Translations**: Error messages in pt-BR and en-US
5. **Integration**: Update bot.ts to register middleware
6. **Documentation**: Update README with configuration instructions

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
- [x] Complexity deviations documented

---
*Based on Constitution v4.2.0 - See `.specify/memory/constitution.md`*
