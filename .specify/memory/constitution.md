<!--
Sync Impact Report:
- Version change: 4.3.0 → 4.4.0 (MINOR: RLS policies requirement added)
- Modified Sections:
    - **Development Workflow - Database & Schema Management**: Added RLS policies requirement for new tables and API-dependent CRUD features
- Templates requiring updates:
    - .specify/templates/plan-template.md (✅ updated - RLS policies check added to Constitution Check)
    - .specify/templates/spec-template.md (✅ updated - RLS policies check added to Constitution Alignment)
    - .specify/templates/tasks-template.md (✅ updated - RLS policies validation task added to Integration phase)
- Rationale:
    - RLS policies are critical for data security in Supabase
    - New tables and CRUD features must have proper access controls
    - MINOR version bump: new security requirement added to development workflow
-->

# Yesod Ecosystem Constitution v4.4.0

This document outlines the core principles, architectural constraints, and development workflows for the Yesod project, which includes the Shaliah Next.js full-stack application, the Ezer Telegram bot, and the poel-worker background job processor.

## Core Principles

### I. Domain-Centric Architecture

All applications MUST organize code by business domain or feature concerns, not by technical layers. Business logic MUST be independent of infrastructure details, enabling isolated testing and flexible implementation choices.

**Key Rules:**
- Code organization reflects business capabilities (e.g., `modules/onboarding/`, `modules/welcome/`), not technical roles (e.g., `controllers/`, `services/`)
- Business logic layers define interfaces; infrastructure layers implement them
- Dependencies flow inward: infrastructure depends on domain, never the reverse
- Each application follows framework-appropriate patterns (DDD-inspired modules for Next.js, composer modules for bots)

**Implementation patterns:** See Technology Stack & Architecture section for framework-specific guidance (shaliah-next: DDD-inspired layering; ezer-bot: grammY composers).

### II. Pragmatic, MVP-First Development
Features should be planned and developed in phases. The primary goal is to ship a valuable Minimum Viable Product (MVP) quickly. More complex features or optimizations should be placed on a clear roadmap and built upon a solid foundation, rather than attempting to build everything at once. This principle prioritizes delivering value to users over premature optimization.

### III. Reliability Through Comprehensive Testing

All applications MUST be accompanied by a robust testing suite to ensure correctness and reliability. Testing frameworks are standardized by application type:
- **Web Application (`shaliah-next`):** Jest + React Testing Library (for all testing: UI components, server actions, use-cases, integration tests)
- **Telegram Bot (`ezer-bot`):** Vitest
- **Background Worker (`poel-worker`):** Deno test

**Test-Driven Development (TDD):** For all new business logic (domain operations, use cases, data transformations, auth flows), tests MUST precede implementation to ensure correctness and resilience. No PR may merge without tests covering new business logic.

**MCP-Assisted Testing & Debugging:** Model Context Protocol (MCP) servers SHOULD be used during development and testing to enable introspection, debugging, and automated testing workflows when appropriate. See Technology Stack & Architecture section for available MCP servers and Development Workflow for integration patterns.

### IV. Supabase-First Integration

All backend functionality MUST leverage Supabase's built-in capabilities (auth, database, storage, realtime) as the primary backend service before considering custom implementation. Complex business logic orchestration, custom integrations with external services, or computational tasks that Supabase cannot handle directly are implemented via Next.js server actions, server components, and API routes in `shaliah-next`.

**Rationale:** Supabase provides battle-tested infrastructure for common backend needs. Maximizing its use reduces maintenance burden, improves security, and accelerates development. Custom backend logic is implemented using Next.js server-side capabilities (server actions for mutations, server components for data fetching, API routes for external integrations and webhooks) keeping all functionality within the web application.

### V. Decoupled, Asynchronous Processing
Time-consuming and resource-intensive tasks are **never** executed in the main API request-response cycle. Operations exceeding 1 second, processing files >1MB, calling external APIs, or requiring significant CPU (e.g., audio fingerprinting, stem separation, transcription) MUST be offloaded to **poel-worker** (persistent background job processor) via a robust job queue, ensuring the API remains fast and responsive.

### VI. TypeScript-First Monorepo

All packages and applications in the Yesod ecosystem MUST use TypeScript as the authoritative source language within a modular monorepo architecture. This ensures type safety, code sharing, and consistency across the entire system.
- **TypeScript Requirement:** New packages are authored in TypeScript and provide type declarations. Applications should consume packages with TypeScript typings and prefer workspace references.
- **Monorepo Structure:** All code resides in a single `pnpm` + `Turborepo` monorepo composed of independent `apps` (e.g., `shaliah-next`, `ezer-bot`, `worker`) and shared `packages` (e.g., `logger`, `db-types`). This structure promotes code sharing, consistency, and simplified dependency management.
- **Amendment Requirement:** Any deviation from TypeScript-first must be explicitly approved in a constitution amendment.

### VII. Internationalization (i18n) for User-Facing Applications

All user-facing applications (`shaliah-next`, `ezer-bot`) MUST support internationalization with strict translation discipline. Brazilian Portuguese (pt-BR) and US English (en-US) are the mandatory language pair and MUST be updated together in every feature PR—never merge with only one translated. Additional languages MUST be deferred to `specs/[###-feature]/roadmap.md`. Use `next-intl` for web apps and `@grammyjs/i18n` for bots.

**Rationale:** Mandating simultaneous pt-BR and en-US updates ensures both primary markets receive consistent feature releases. Deferring additional languages prevents translation debt and aligns with MVP-first development (Principle II).

## Technology Stack & Architecture

This section defines the non-negotiable technology stack for the ecosystem. Any deviation requires an amendment to this constitution.

- **Database:** Supabase (PostgreSQL)
- **Database Migrations & ORM:** `Drizzle ORM` (Schema defined in TypeScript)
  - **Schema Centralization**: All database schema MUST be defined in `shaliah-next/db/schema/` as single source of truth
  - **Type Sharing**: Other applications (`poel-worker`, `ezer-bot`) MUST consume types via workspace references (`@yesod/shaliah-next/db/schema`)
  - **Migration Workflow**: Schema changes in `shaliah-next` → generate migration → commit together
- **Web Application (`shaliah-next`):** `Next.js` (React framework) with `shadcn/ui` for UI components. Full-stack application with server actions (mutations), server components (data fetching), and API routes (external integrations).
- **Telegram Bot (`ezer-bot`):** `grammY` framework.
- **Job Queue:** Supabase Queues (native Supabase background job processing)
- **Testing:**
    - **`shaliah-next`:** Jest + React Testing Library (all testing: UI, server actions, use-cases, integration)
    - **`ezer-bot`:** Vitest
    - **`poel-worker`:** Deno test
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
    - **Sentry SDK Requirement:** Each application (`ezer-bot`, `worker`, `shaliah-next`) **must** include and initialize its own environment-specific Sentry SDK (e.g., `@sentry/node`, `@sentry/nextjs`) to ensure proper context is captured for all error reports.
- **Authentication:** Supabase Auth, supporting Google OAuth and Email Magic Links.
- **Code Quality:**
    - **Linting:** ESLint with shared configuration (`packages/eslint-config-custom`).
    - **Formatting:** Prettier with shared configuration.
    - **Type Checking:** TypeScript strict mode enabled across all packages and applications.

### Application-Specific Architecture Patterns

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
  - `messages/`: Feature-specific translations (`en.json`, `pt-BR.json`)
  - `config.ts`: Module-specific constants
- **Database Schema (Drizzle ORM):** All schema in `db/schema/` (single source of truth); exports types for ecosystem consumption; migrations via `drizzle-kit`
- **Dependency Injection:** Manual DI via `lib/di.ts` composition root; wire adapters into use-cases in server actions
- **State Management:** Zustand for client-side ephemeral/interactive state (minimal global stores in `src/stores/`); server state via server components/props
- **Server vs Client:** Server components fetch data and orchestrate use-cases; client components handle interactivity; server actions for mutations; API routes for external integrations
- **i18n (next-intl):** Common translations in `messages/{locale}.json`; feature translations in `modules/<feature>/messages/{locale}.json`; dynamic loader (`src/i18n/load-messages.ts`) merges with namespaces
- **Supabase & Drizzle:** Server-side Supabase client (`lib/supabase/server.ts`) for auth; Drizzle ORM (`lib/db.ts`) for type-safe queries; browser client only for realtime/uploads
- **Testing:** Jest + React Testing Library for all testing needs (unit tests for domain/validators/use-cases, integration tests for server actions, component tests, store tests)

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

**Architecture Documentation Review:**
Before planning features that modify existing applications, MUST read the application-specific architecture guide in `docs/architecture/` to understand established patterns, conventions, and best practices:
- `docs/architecture/shaliah-next.md`: Frontend and backend architecture (Next.js + DDD-inspired)
- `docs/architecture/ezer-bot.md`: Telegram bot architecture (grammY + composers)

These guides provide detailed patterns for module structure, testing strategies, middleware ordering, and integration approaches that MUST be followed to maintain consistency across the codebase.

**shaliah-next:**
- Organize by feature modules in `src/modules/{feature}/`
- Follow DDD-inspired layering: `domain/` → `ports/` → `adapters/` → `use-cases/` → `ui/`
- Wire dependencies in `lib/di.ts` composition root
- Server actions (`ui/server/actions.ts`) inject adapters into use-cases for mutations
- Server components orchestrate use-cases for data fetching; client components handle interactivity
- Zustand stores (`stores/`) for client-side ephemeral state only; keep global stores minimal
- Reference: App Router structure at `apps/shaliah-next/src/` and [next-intl setup](https://next-intl.dev/docs/getting-started/app-router)

**ezer-bot:**
- Organize by features in `src/modules/{feature}.ts`
- Each module exports a `Composer<Context>`
- Compose modules in `src/bot.ts` following middleware order
- Reference: `apps/ezer-bot/src/bot.ts` and [grammY structuring guide](https://grammy.dev/advanced/structuring)

**Configuration Management:**
- **Environment Variables:** Centralized in `lib/env.ts` (shaliah-next) with Zod validation; never use `process.env` directly in business logic
- **Domain Constants:** Per feature in `modules/{feature}/config.ts` (shaliah-next) for feature-specific values (TTLs, limits, formats, thresholds)
- **Component Reuse (shaliah-next only):** Before creating new UI components, MUST audit existing components in `src/components/` (shared) and `src/modules/*/ui/components/` (feature-scoped); reuse atomic components (shadcn/ui wrappers) and composed components when they satisfy requirements; document evaluated components explicitly in planning phase

### Planning & Specification

- Begin features with a spec document (`.specify/templates/spec-template.md`)
- Categorize requirements: "MVP" vs "Future Enhancement"
- Document only MVP scope; defer enhancements to a `specs/[###-feature]/roadmap.md` file
- Use ubiquitous language (domain terms, not tech jargon)
- Define API contracts before implementation
- **For shaliah-next features:** Audit existing components (shared and feature-scoped) during planning phase; list reusable components explicitly in plan.md to avoid duplication

### Testing Strategy

**Test-Driven Development (TDD):**
- For all new business logic: write failing test → implement → refactor
- Tests MUST precede implementation in commits
- Implementation tasks integrate iterative testing: implement → run tests → analyze failures → fix → repeat until tests pass
- Update tests only if requirements were misunderstood, not to make implementation easier
- No PR may merge without tests for new business logic

**Testing Patterns:**
- Web UI: Component testing with Jest + RTL
- shaliah-next Server-Side: Jest for server actions, use-cases, and integration tests
- ezer-bot: Vitest with mock context pattern (see `apps/ezer-bot/__tests__/welcome.test.ts`)
- poel-worker: Deno test
- See Principle III for framework requirements per application

**Code Quality Validation:**
- After implementation and testing complete, run final validation before i18n/polish:
  * ESLint for code quality violations
  * TypeScript type checker (tsc --noEmit) for type errors
  * Prettier for formatting consistency
  * Add suppression comments with documented justification for unavoidable errors
  * Verify no console.log statements remain (use logger package)

**MCP Integration (when appropriate):**
- Chrome DevTools MCP: Automate browser interactions, capture screenshots, debug frontend issues
- Supabase MCP: Inspect database state, validate data migrations, debug queries
- Shadcn MCP: Scaffold components, validate shadcn/ui integration in `shaliah-next`
- Use MCP servers to reproduce bugs, validate fixes, and create regression tests when available and applicable

### Async Work & Background Jobs

**Identification:**
- Operations >1s, large files (>1MB), external APIs, CPU-intensive tasks

**Pattern:**
1. Define job handler in `apps/poel-worker/src/jobs/`
2. Queue via Supabase Queues from API
3. Return job ID to client for polling
4. Never block API request/response cycle

### Database & Schema Management

**Centralized Schema (shaliah-next):**
- All database schema MUST be defined in `shaliah-next/db/schema/` using Drizzle ORM
- One file per table or logical grouping (e.g., `users.ts`, `user-profiles.ts`, `job-queue.ts`)
- Export all schemas from `db/schema/index.ts`
- Schema is the single source of truth for the entire ecosystem

**Migration Workflow:**
1. Define/modify schema in `shaliah-next/db/schema/*.ts`
2. Generate migration: `pnpm drizzle-kit generate:pg`
3. Review migration in `db/migrations/`
4. Apply migration: `pnpm drizzle-kit push:pg` (dev) or via Supabase migrations (prod)
5. Commit schema + migration together
6. Never apply migrations directly to production

**Type Sharing:**
- Other applications (`poel-worker`, `ezer-bot`) import via workspace reference:
  ```typescript
  import { jobQueue } from '@yesod/shaliah-next/db/schema'
  import type { InferSelectModel } from 'drizzle-orm'
  type Job = InferSelectModel<typeof jobQueue>
  ```
- Use Drizzle's `InferSelectModel` and `InferInsertModel` for type inference
- Never duplicate schema definitions in consuming apps

**Security:**
- Enable Row-Level Security (RLS) on all tables
- **RLS Policies Requirement:** RLS policies MUST be checked if new tables are going to be created or any API-dependent CRUD feature will be added
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

**shaliah-next (feature-based organization):**
- Common translations: `messages/{locale}.json` at project root (shared UI copy)
- Feature translations: `modules/<feature>/messages/{locale}.json` (feature-specific strings)
- Both pt-BR.json and en.json required for common AND each feature
- Dynamic loader: `src/i18n/load-messages.ts` merges common + feature messages
- Usage: `const t = useTranslations('featureName')` for namespaced keys

**ezer-bot:**
- `src/locales/{locale}.ftl` files (pt-BR.ftl and en.ftl required)
- Session storage as `__language_code`

### Code Quality & Observability

- ESLint + Prettier: shared configs from `packages/eslint-config-custom`
- Logging: use `packages/logger`; no `console.log`
- Error tracking: initialize Sentry SDK per-app
- TypeScript strict mode: no `any` without justification
- Secrets: env vars only; maintain `.env.example`

### Deployment & Release

- Independent deployment: `ezer-bot`, `poel-worker`, `shaliah-next` deploy separately
- Database migrations: backwards-compatible (add → migrate data → remove)
  * Schema changes managed in `shaliah-next` and applied before deploying consuming apps
- Validate in staging before production
- grammY bot: use `@grammyjs/runner` for long polling, handle SIGTERM/SIGINT gracefully
- poel-worker: Deno runtime with least-privilege permissions

## Governance

This constitution is the supreme source of truth for the project's architecture and development practices. It supersedes all other informal agreements or previous plans.
- All Pull Requests and code reviews must verify compliance with the principles and constraints outlined in this document.
- Any proposal to amend this constitution must be documented, reviewed, and approved. A clear migration plan must be provided if the change affects existing architecture.

**Version**: 4.4.0 | **Ratified**: 2025-01-15 | **Last Amended**: 2025-01-15
