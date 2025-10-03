<!--
Sync Impact Report:
- Version change: 2.5.1 (all templates synchronized with constitution)
- Modified Principles:
    - **Principle I**: "Domain-Centric Architecture" with concrete, testable rules
    - **Principle III**: Condensed with "no PR without tests" enforcement
- Clarified Sections:
    - **Development Workflow / i18n**: All 7 languages before merge, pt-BR+en-US in every PR
    - **Governance dates**: Fixed ratification date consistency
- Templates synchronized:
    - .specify/templates/plan-template.md (✅ v2.5.1 - Updated Principle I, accurate folder structures for all apps)
    - .specify/templates/spec-template.md (✅ v2.5.1 - Updated Principle I, i18n clarification)
    - .specify/templates/tasks-template.md (✅ v2.5.1 - Already correct, version synced)
- All folder structures validated against actual codebase:
    - yesod-api: Current routes/ + Future contexts/ DDD structure documented
    - ezer-bot: modules/ + locales/ structure accurate
    - worker: handlers/ structure accurate
    - shaliah-next: app/ + components/ + lib/ structure accurate
- Follow-up TODOs:
    - None - all templates and structures synchronized
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

### IV. API-First Design
All client applications (Shaliah, Ezer) are consumers of the central **Yesod API**. The API is the single source of truth and the sole gateway to the database and business logic. Clients should not contain business logic that can be centralized in the API. The API layer serves as the application service that orchestrates domain logic, while core business rules remain in domain entities and services as per DDD principles.

### V. Decoupled, Asynchronous Processing
Time-consuming and resource-intensive tasks (e.g., audio fingerprinting, stem separation, transcription) are **never** executed in the main API request-response cycle. They are offloaded to a persistent background **worker** via a robust job queue, ensuring the API remains fast and responsive.

### VI. TypeScript-First Monorepo

All packages and applications in the Yesod ecosystem MUST use TypeScript as the authoritative source language within a modular monorepo architecture. This ensures type safety, code sharing, and consistency across the entire system.
- **TypeScript Requirement:** New packages are authored in TypeScript and provide type declarations. Applications should consume packages with TypeScript typings and prefer workspace references.
- **Monorepo Structure:** All code resides in a single `pnpm` + `Turborepo` monorepo composed of independent `apps` (e.g., `yesod-api`, `ezer-bot`, `worker`) and shared `packages` (e.g., `logger`, `db-types`). This structure promotes code sharing, consistency, and simplified dependency management.
- **Amendment Requirement:** Any deviation from TypeScript-first must be explicitly approved in a constitution amendment.

### VII. Supabase-First Integration
All applications that require database access, authentication, or storage MUST integrate with Supabase as the primary backend service. This ensures a unified data source and consistent authentication flow across the ecosystem.
- **Database Interaction:** Direct database access is managed through Supabase clients.
- **Authentication:** User identity and access control are handled by Supabase Auth.
- **Rationale:** Centralizing on Supabase simplifies infrastructure, reduces redundant logic, and provides a consistent data access layer for all parts of the system.

### VIII. MCP-Driven Development & Debugging
The use of Model-Context-Protocol (MCP) servers is strongly encouraged during development, debugging, and research to enhance productivity and introspection capabilities.
- **Standard MCP Servers:** The following MCP servers should be configured and available during development:
    - **Chrome DevTools MCP:** For frontend testing, debugging, and browser automation.
    - **Supabase MCP:** For a read-only interface to the database, enabling data inspection and query analysis.
- **Rationale:** MCP servers provide a standardized, tool-agnostic way to interact with and control development services, improving debugging efficiency and enabling advanced automation workflows.

### IX. Internationalization (i18n) for User-Facing Applications
All user-facing applications must be internationalized to support a global user base.
- **Target Applications:** This principle applies to `shaliah-next` and `ezer-bot`.
- **Supported Languages:** The applications will support Brazilian Portuguese (pt-BR), English (en-US), Spanish (es), French (fr), German (de), Ukrainian (uk), and Russian (ru).
- **Key Languages:** Brazilian Portuguese and English are the primary languages and must always be fully supported and up-to-date.
- **Tooling:**
    - `shaliah-next` MUST use `next-intl`.
    - `ezer-bot` MUST use the `@grammyjs/i18n` plugin. Any questions regarding its implementation should refer to the official documentation at `https://grammy.dev/plugins/i18n`.

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
- **Observability:**
    - **Structured Logging:** `Pino` (via a shared `packages/logger` module).
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

**ezer-bot:**
- Organize by features in `src/modules/{feature}.ts`
- Each module exports a `Composer<Context>`
- Compose modules in `src/bot.ts` following middleware order
- Reference: `apps/ezer-bot/src/bot.ts` and [grammY structuring guide](https://grammy.dev/advanced/structuring)

**Configuration Management:**
- Environment variables: centralized in `config/env.ts` per app with validation
- Domain constants (yesod-api only): per context in `constants.ts` (e.g., TTLs, limits, formats)
- Never use `process.env` directly in business logic

### Planning & Specification

- Begin features with a spec document (`.specify/templates/spec-template.md`)
- Categorize requirements: "MVP" vs "Future Enhancement"
- Document only MVP scope; defer enhancements to roadmap
- Use ubiquitous language (domain terms, not tech jargon)
- Define API contracts before implementation

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
- Brazilian Portuguese (pt-BR) and English (en-US) are primary languages and MUST be updated together in every PR
- All 7 supported languages (pt-BR, en-US, es, fr, de, uk, ru) should be updated before merging to main
- Never hardcode user-facing strings
- See Principle IX for tooling requirements per application

**Implementation References:**
- shaliah-next: `messages/{locale}.json` files
- ezer-bot: `src/locales/{locale}.ftl` files, session storage as `__language_code`

### Code Quality & Observability

- ESLint + Prettier: shared configs from `packages/eslint-config-custom`
- Logging: use `packages/logger` (Pino); no `console.log`
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

**Version**: 2.5.1 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-10-02
