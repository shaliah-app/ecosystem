
# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Constitution Version**: 4.4.0
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`
**Application(s):** [shaliah-next | ezer-bot | poel-worker]

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Identify affected applications from feature spec
   → Read corresponding architecture guides from docs/architecture/
   → For shaliah-next changes: Read docs/architecture/shaliah-next.md
   → For ezer-bot changes: Read docs/architecture/ezer-bot.md
   → For poel-worker changes: Read docs/architecture/poel-worker.md
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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-6 are executed by other commands:
- Phase 2: i18n (optional) - only if LLM determines i18n is relevant for the implementation
- Phase 3: /tasks command creates tasks.md
- Phase 4-6: Implementation execution (manual or via tools)

## Summary
[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context
**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Architecture Review
*Required for features modifying existing applications. Document patterns from architecture guides.*

**Affected Applications**: [e.g., shaliah-next, ezer-bot, poel-worker]  
**Architecture Guide(s) Read**: [e.g., docs/architecture/shaliah-next.md, docs/architecture/poel-worker.md]

**Key Architectural Patterns to Follow**:
- [Pattern 1 from guide, e.g., "DDD-inspired layering with domain → ports → adapters → use-cases → ui"]
- [Pattern 2 from guide, e.g., "Manual DI via lib/di.ts composition root"]
- [Pattern 3 from guide, e.g., "Server actions inject adapters into use-cases for mutations"]
- [Testing approach from guide, e.g., "Unit tests for domain/use-cases, integration tests for server actions"]
- [Module structure from guide, e.g., "One feature per composer in src/modules/"]

**Relevant Conventions**:
- [Convention 1, e.g., "Route chaining for RPC type inference"]
- [Convention 2, e.g., "Middleware order: sequentialize → session → i18n → modules → error handler"]
- [Convention 3, e.g., "Always answer callback queries with ctx.answerCallbackQuery()"]

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I: Domain-Centric Architecture**: Is code organized by business domain/features rather than technical layers? Does business logic remain independent of infrastructure? For shaliah-next: Does the design use DDD-inspired layering with proper dependency direction? For ezer-bot: Does the design use feature-based composer modules?
- **Principle II: Pragmatic, MVP-First Development**: Is the feature scoped as an MVP? Are complex features or optimizations deferred to a clear roadmap rather than built all at once?
- **Principle III: Comprehensive Testing**: Does the plan account for the correct testing framework for the target application (Jest+RTL for all shaliah-next testing, Vitest for ezer-bot, Deno test for poel-worker)? Is TDD applied to all new business logic? Are tests included for all new business logic (no PR may merge without tests)? Does the plan identify appropriate scenarios for MCP servers (Chrome DevTools, Supabase, Shadcn) when applicable for testing, debugging, and development workflows?
- **Principle IV: Supabase-First Integration**: Does the feature leverage Supabase's built-in capabilities (auth, database, storage, realtime) as the primary backend? Is complex business logic implemented via Next.js server actions, server components, and API routes in shaliah-next when Supabase cannot handle the requirement directly? Does the plan use Drizzle ORM for type-safe database queries?
- **Principle V: Decoupled, Asynchronous Processing**: Are time-consuming tasks (>1s, >1MB files, external APIs, CPU-intensive) offloaded to poel-worker via job queue rather than executed in the API request-response cycle?
- **Principle VI: TypeScript-First Monorepo**: Is all new code planned to be written in TypeScript within the monorepo structure? Are shared packages and workspace references properly utilized?
- **Principle VII (i18n)**: If the feature is user-facing (shaliah-next or ezer-bot), does it include plans for translation in both mandatory languages (pt-BR and en-US) using the appropriate tooling (next-intl or @grammyjs/i18n)? For shaliah-next: Does the plan account for feature-based translation organization (common translations in `messages/{locale}.json` + feature translations in `modules/<feature>/messages/{locale}.json`)? Are additional languages properly deferred to roadmap.md?
- **Database Security (RLS Policies)**: If the feature involves new tables or API-dependent CRUD operations, does the plan include RLS policies validation and implementation? Are proper access controls defined for all new database operations?

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

## Phase 2: i18n (Optional)
*This phase is OPTIONAL and should only be included if the LLM determines i18n is relevant for the given implementation. Skip this phase if the feature doesn't involve user-facing text or if i18n setup already exists.*

**i18n Strategy**:
- Determine if feature involves user-facing text that requires translation
- If yes: Include i18n setup tasks (common translations, feature-specific translations, configuration)
- If no: Skip this phase entirely
- Always defer additional languages to roadmap.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3: Task Planning Approach
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

## Phase 4+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 4**: Task execution (/tasks command creates tasks.md)  
**Phase 5**: Implementation (execute tasks.md following constitutional principles)  
**Phase 6**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: i18n planning complete (/plan command - describe approach only, optional)
- [ ] Phase 3: Task planning complete (/plan command - describe approach only)
- [ ] Phase 4: Tasks generated (/tasks command)
- [ ] Phase 5: Implementation complete
- [ ] Phase 6: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v4.4.0 - See `.specify/memory/constitution.md`*
