<!--
Sync Impact Report:
- Version change: 3.1.1 → 3.2.0 (MINOR: Component reuse requirement for shaliah-next)
- Modified Sections:
    - **Application-Specific Architecture Patterns - shaliah-next**: Added Component Reuse requirement
      * MUST audit existing components in src/components/ (shared) and src/modules/*/ui/components/ (feature-scoped) before creating new ones
      * Reuse atomic components (shadcn/ui wrappers) and composed components when they satisfy requirements
      * Document evaluated components explicitly in planning phase
    - **Development Workflow - Architecture & Code Organization - shaliah-next**: Added component reuse workflow
      * Audit shared and feature-scoped components before creating new ones
      * Document evaluated components in plan.md
    - **Development Workflow - Planning & Specification**: Added shaliah-next component audit requirement
      * Audit existing components during planning phase
      * List reusable components explicitly in plan.md to avoid duplication
- Added Sections:
    - **plan-template.md Phase 1**: Added step 2 for component audit
      * Search shared components (src/components/)
      * Search feature-scoped components (src/modules/*/ui/components/)
      * Document reusable components in "Component Reuse Analysis" section
      * Identify gaps requiring new components
    - **plan-template.md Phase 1 Output**: Added component reuse analysis to output list
    - **tasks-template.md Validation Checklist**: Added component reuse validation
      * For shaliah-next: existing components audited and reusable components explicitly listed in plan.md
- Rationale:
    - Prevents component duplication and promotes code reuse
    - Leverages existing shadcn/ui atomic components and composed patterns
    - Reduces maintenance burden by centralizing shared UI logic
    - Aligns with DRY principle and monorepo benefits
    - Makes component inventory visible during planning phase
- Templates synchronized:
    - .specify/templates/plan-template.md (✅ v3.2.0 - Added Phase 1 component audit step and output)
    - .specify/templates/tasks-template.md (✅ v3.2.0 - Added component reuse validation to checklist)
    - .specify/templates/spec-template.md (⚠️ No changes needed - spec is app-agnostic, UI details handled in planning)
- Follow-up TODOs:
    - None - all relevant templates synchronized with component reuse requirement
-->

# The Yesod Ecosystem Constitution

This document outlines the core principles, architectural constraints, and development workflows for the Yesod project, which includes the Yesod API, the Shaliah application, the Ezer bot, and the asynchronous worker.

## Core Principles

### I. Domain-Centric Architecture

All applications MUST organize code by business domain or feature concerns, not by technical layers. Business logic MUST be independent of infrastructure details, enabling isolated testing and flexible implementation choices.

**Key Rules:**
- Code organization reflects business capabilities (e.g., `contexts/users/`, `modules/welcome/`), not technical roles (e.g., `controllers/`, `services/`)
- Business logic layers define interfaces; infrastructure layers implement them
- Dependencies flow inward: infrastructure depends on domain, never the reverse
- Each application follows framework-appropriate patterns (DDD for APIs, composer modules for bots)

**Implementation patterns:** See Technology Stack & Architecture section for framework-specific guidance (yesod-api: DDD layering; ezer-bot: grammY composers).

### II. Pragmatic, MVP-First Development
Features should be planned and developed in phases. The primary goal is to ship a valuable Minimum Viable Product (MVP) quickly. More complex features or optimizations should be placed on a clear roadmap and built upon a solid foundation, rather than attempting to build everything at once. This principle prioritizes delivering value to users over premature optimization.

### III. Reliability Through Comprehensive Testing

All applications MUST be accompanied by a robust testing suite to ensure correctness and reliability. Testing frameworks are standardized by application type:
- **Web Interface (`shaliah-next`):** Jest + React Testing Library
- **Backend APIs (`yesod-api`, `ezer-bot`, `worker`):** Vitest

**Test-Driven Development (TDD):** For business-critical code (ETL parsers, async job handlers, auth logic), tests MUST precede implementation to ensure resilience. No PR may merge without tests for new business logic.

**MCP-Driven Testing & Debugging:** Model Context Protocol (MCP) servers MUST be used during development and testing to enable introspection, debugging, and automated testing workflows. See Technology Stack & Architecture section for required MCP servers and Development Workflow for testing integration patterns.

### IV. Supabase-First Integration

All backend functionality MUST leverage Supabase's built-in capabilities (auth, database, storage, realtime) as the primary backend service before considering custom implementation. The Yesod API serves ONLY for complex business logic orchestration, custom integrations with external services, or computational tasks that Supabase cannot handle directly.

**Rationale:** Supabase provides battle-tested infrastructure for common backend needs. Maximizing its use reduces maintenance burden, improves security, and accelerates development while keeping the Yesod API focused on domain-specific logic.

### V. Decoupled, Asynchronous Processing
Time-consuming and resource-intensive tasks (e.g., audio fingerprinting, stem separation, transcription) are **never** executed in the main API request-response cycle. They are offloaded to a persistent background **worker** via a robust job queue, ensuring the API remains fast and responsive.

### VI. TypeScript-First Monorepo

All packages and applications in the Yesod ecosystem MUST use TypeScript as the authoritative source language within a modular monorepo architecture. This ensures type safety, code sharing, and consistency across the entire system.
- **TypeScript Requirement:** New packages are authored in TypeScript and provide type declarations. Applications should consume packages with TypeScript typings and prefer workspace references.
- **Monorepo Structure:** All code resides in a single `pnpm` + `Turborepo` monorepo composed of independent `apps` (e.g., `yesod-api`, `ezer-bot`, `worker`) and shared `packages` (e.g., `logger`, `db-types`). This structure promotes code sharing, consistency, and simplified dependency management.
- **Amendment Requirement:** Any deviation from TypeScript-first must be explicitly approved in a constitution amendment.

### VII. Internationalization (i18n) for User-Facing Applications

All user-facing applications (`shaliah-next`, `ezer-bot`) MUST support internationalization with strict translation discipline. Brazilian Portuguese (pt-BR) and US English (en-US) are the mandatory language pair and MUST be updated together in every feature PR—never merge with only one translated. Additional languages MUST be deferred to `specs/[###-feature]/roadmap.md`. Use `next-intl` for web apps and `@grammyjs/i18n` for bots.

**Rationale:** Mandating simultaneous pt-BR and en-US updates ensures both primary markets receive consistent feature releases. Deferring additional languages prevents translation debt and aligns with MVP-first development (Principle II).

## Technology Stack & Architecture

This section defines the non-negotiable technology stack for the ecosystem. Any deviation requires an amendment to this constitution.

- **Database:** Supabase (PostgreSQL)
- **Database Migrations & ORM:** `Drizzle ORM` (Schema defined in TypeScript)
- **Backend API (`yesod-api`):** `Hono` framework on a Node.js runtime.
- **Web Application (`shaliah-next`):** `Next.js` (React framework) with `shadcn/ui` for UI components.
- **Telegram Bot (`ezer-bot`):** `grammY` framework.
- **Job Queue:** `pg-boss` with a persistent TypeScript worker.
- **Testing:**
    - **Web UI:** `Jest` + `React Testing Library`
    - **Backend/API:** `Vitest`
- **Internationalization:**
    - **`shaliah-next`:** `next-intl`
    - **`ezer-bot`:** `@grammyjs/i18n`
- **Model Context Protocol (MCP) Servers:**
    - **Chrome DevTools MCP:** Frontend testing, debugging, and browser automation
    - **Supabase MCP:** Database introspection, data inspection, and query analysis
    - **Shadcn MCP:** Component scaffolding and shadcn/ui management for `shaliah-next`
- **Observability:**
    - **Structured Logging:** shared `packages/logger` module.
    - **Error Tracking:** `Sentry`.
    - **Sentry SDK Requirement:** Each application (`yesod-api`, `ezer-bot`, `worker`, `shaliah-next`) **must** include and initialize its own environment-specific Sentry SDK (e.g., `@sentry/node`, `@sentry/nextjs`) to ensure proper context is captured for all error reports.
- **Authentication:** Supabase Auth, supporting Google OAuth and Email Magic Links.
- **Code Quality:**
    - **Linting:** ESLint with shared configuration (`packages/eslint-config-custom`).
    - **Formatting:** Prettier with shared configuration.
    - **Type Checking:** TypeScript strict mode enabled across all packages and applications.

### Application-Specific Architecture Patterns

**yesod-api (Hono + DDD):**
- **Layer Structure:** `domain/` → `application/` → `infra/` → `api/`
- **Dependency Injection:** Manual DI; composable factories per bounded context when complexity justifies
- **Configuration:** 
  - Environment variables in `src/config/env.ts` (see `apps/yesod-api/src/config/env.ts`)
  - Domain constants in `src/contexts/{context}/constants.ts` (feature-specific: TTLs, limits, formats)
  - Factory pattern: Per bounded context (`factory.ts`) for environment-based implementation selection
- **Bounded Contexts:** Each context exports Hono sub-app, mounted in `server.ts`

**shaliah-next (Next.js 15 App Router + DDD-inspired):**
- **Module Structure:** Feature modules in `src/modules/{feature}/` with DDD-inspired layering
  - `domain/`: Domain types, validators, factories (framework-agnostic TypeScript)
  - `ports/`: Repository interfaces (contracts)
  - `adapters/`: Concrete implementations (e.g., `supabase-{entity}-repo.ts`)
  - `use-cases/`: Application operations orchestrating repositories and domain logic
  - `ui/components/`: Presentational components (shadcn/ui + props-based)
  - `ui/server/actions.ts`: Server actions (mutation entrypoints)
  - `ui/hooks/`: Client-side UI hooks
  - `stores/`: Zustand stores (scoped to module)
  - `config.ts`: Module-specific constants
- **Dependency Injection:** Manual DI via `lib/di.ts` composition root; wire adapters into use-cases in server actions
- **Component Reuse:** Before creating new UI components, MUST audit existing components in `src/components/` (shared) and `src/modules/*/ui/components/` (feature-scoped). Reuse atomic components (shadcn/ui wrappers) and composed components when they satisfy requirements. Document evaluated components explicitly in planning phase.
- **Environment variables:** in `src/lib/env.ts` with Zod validation (see `apps/shaliah-next/src/lib/env.ts`)
- **State Management:** Zustand for client-side ephemeral/interactive state (minimal global stores in `src/stores/`); server state via server components/props
- **Server vs Client:** Server components fetch data and orchestrate use-cases; client components handle interactivity; server actions for mutations
- **Supabase:** Server-side client (`lib/supabase-client.ts`) with service keys; browser client only for realtime/uploads
- **Testing:** Unit tests (domain, validators, use-cases), integration tests (server actions), component tests (Jest + RTL), store tests (Zustand)

**ezer-bot (grammY):**
- **Module Structure:** Feature composers in `src/modules/` ([structuring guide](https://grammy.dev/advanced/structuring))
- **Middleware Order:** `sequentialize()` → `session()` → `i18n` → feature composers
- **Reliability Patterns:** `@grammyjs/runner` for long polling, graceful shutdown on SIGTERM/SIGINT, `bot.catch()` error boundary ([reliability guide](https://grammy.dev/advanced/reliability))
- **Scaling & Rate Limits:** Never throttle artificially; use auto-retry plugin for flood control ([scaling guide](https://grammy.dev/advanced/scaling), [flood guide](https://grammy.dev/advanced/flood))
- **i18n:** Fluent-based localization with `@grammyjs/i18n` ([i18n plugin](https://grammy.dev/plugins/i18n), [Fluent syntax](https://projectfluent.org/))
- **Testing:** Mock contexts in isolation, no full bot instantiation (see `apps/ezer-bot/__tests__/welcome.test.ts`)
- **Deployment:** See [deployment guide](https://grammy.dev/advanced/deployment) for production patterns

## Development Workflow

This section defines practical workflows grouped by development concerns, not mapped 1:1 to principles. These workflows enforce constitutional principles during day-to-day development.

### Architecture & Code Organization

**yesod-api:**
- Organize by bounded contexts in `src/contexts/{context-name}/`
- Follow DDD layering: `domain/` → `application/` → `infra/` → `api/`
- Wire dependencies explicitly in `server.ts` or per-context `factory.ts`
- Each context exports a Hono sub-app mounted in main `server.ts`
- See Technology Stack & Architecture section for detailed layer structure

**shaliah-next:**
- Organize by feature modules in `src/modules/{feature}/`
- Follow DDD-inspired layering: `domain/` → `ports/` → `adapters/` → `use-cases/` → `ui/`
- Wire dependencies in `lib/di.ts` composition root
- Server actions (`ui/server/actions.ts`) inject adapters into use-cases for mutations
- Server components orchestrate use-cases for data fetching; client components handle interactivity
- Zustand stores (`stores/`) for client-side ephemeral state only; keep global stores minimal
- Environment variables: centralized in `lib/env.ts` with Zod validation
- Module constants: per feature in `modules/{feature}/config.ts` (e.g., UI limits, timeouts)
- Component reuse: Audit `src/components/` (shared) and `src/modules/*/ui/components/` (feature-scoped) before creating new components; document evaluated components in plan.md
- Reference: App Router structure at `apps/shaliah-next/src/` and [next-intl setup](https://next-intl.dev/docs/getting-started/app-router)

**ezer-bot:**
- Organize by features in `src/modules/{feature}.ts`
- Each module exports a `Composer<Context>`
- Compose modules in `src/bot.ts` following middleware order
- Reference: `apps/ezer-bot/src/bot.ts` and [grammY structuring guide](https://grammy.dev/advanced/structuring)

**Configuration Management:**
- Environment variables: centralized in `lib|config/env.ts` with validation
- Domain constants: per context in `config.ts` (e.g., TTLs, limits, formats)
- Never use `process.env` directly in business logic

### Planning & Specification

- Begin features with a spec document (`.specify/templates/spec-template.md`)
- Categorize requirements: "MVP" vs "Future Enhancement"
- Document only MVP scope; defer enhancements to a `specs/[###-feature]/roadmap.md` file
- Use ubiquitous language (domain terms, not tech jargon)
- Define API contracts before implementation
- **For shaliah-next features:** Audit existing components (shared and feature-scoped) during planning phase; list reusable components explicitly in plan.md to avoid duplication

### Testing Strategy

**Test-Driven Development (TDD):**
- For business-critical code: write failing test → implement → refactor
- Tests MUST precede implementation in commits
- No PR without tests for new business logic

**Testing Patterns:**
- Web UI: Component testing with Jest + RTL
- Backend/API: Unit and integration tests with Vitest
- grammY Bot: Mock context pattern (see `apps/ezer-bot/__tests__/welcome.test.ts`)
- See Principle III for framework requirements per application

**MCP Integration:**
- Chrome DevTools MCP: Automate browser interactions, capture screenshots, debug frontend
- Supabase MCP: Inspect database state, validate data migrations, debug queries
- Shadcn MCP: Scaffold components, validate shadcn/ui integration in `shaliah-next`
- Use MCP servers to reproduce bugs, validate fixes, and create regression tests

### Async Work & Background Jobs

**Identification:**
- Operations >1s, large files (>1MB), external APIs, CPU-intensive tasks

**Pattern:**
1. Define job handler in `apps/worker/src/handlers/`
2. Queue via `pg-boss` from API
3. Return job ID to client for polling
4. Never block API request/response cycle

### Database & Schema Management

- Author migrations as Drizzle TypeScript files
- Test locally before merging
- Never apply migrations directly to production
- Enable Row-Level Security (RLS) on all tables
- All auth flows via Supabase Auth (no custom logic)

### Internationalization (i18n)

**Workflow:**
- Brazilian Portuguese (pt-BR) and US English (en-US) MUST be updated together in every feature PR
  * Both translations must be complete before requesting code review
  * Never merge with only one language translated
- Additional languages (if planned) MUST be documented in `specs/[###-feature]/roadmap.md` under "Future Enhancements"
  * Do not include partial translations for non-mandatory languages in feature PRs
- Never hardcode user-facing strings; all text MUST use translation keys

**Implementation References:**
- shaliah-next: `messages/{locale}.json` files (pt-BR.json and en.json required)
- ezer-bot: `src/locales/{locale}.ftl` files (pt-BR.ftl and en.ftl required), session storage as `__language_code`

### Code Quality & Observability

- ESLint + Prettier: shared configs from `packages/eslint-config-custom`
- Logging: use `packages/logger`; no `console.log`
- Error tracking: initialize Sentry SDK per-app
- TypeScript strict mode: no `any` without justification
- Secrets: env vars only; maintain `.env.example`

### Deployment & Release

- Independent deployment: `yesod-api`, `ezer-bot`, `worker`, `shaliah-next` deploy separately
- Database migrations: backwards-compatible (add → migrate data → remove)
- Validate in staging before production
- grammY bot: use `@grammyjs/runner` for long polling, handle SIGTERM/SIGINT gracefully

## Governance

This constitution is the supreme source of truth for the project's architecture and development practices. It supersedes all other informal agreements or previous plans.
- All Pull Requests and code reviews must verify compliance with the principles and constraints outlined in this document.
- Any proposal to amend this constitution must be documented, reviewed, and approved. A clear migration plan must be provided if the change affects existing architecture.

**Version**: 3.2.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-10-03
