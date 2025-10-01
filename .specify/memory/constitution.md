<!--
Sync Impact Report:
- Version change: 2.1.0 → 2.2.0
- Modified Principles: None
- Added Sections: None
- Removed sections: None
- Expanded Sections:
    - Development Workflow: Completely restructured and expanded to include specific workflows for all 9 principles
    - Added 10 workflow subsections: DDD, MVP-First Planning, TDD, API Contract, Async Task, TypeScript Monorepo, Supabase Integration, MCP-Assisted Development, i18n, Code Quality & Observability, Deployment & Release
- Templates requiring updates:
    - .specify/templates/plan-template.md (✅ updated - version reference updated to v2.2.0)
    - .specify/templates/spec-template.md (✅ updated - version reference added as v2.2.0)
    - .specify/templates/tasks-template.md (✅ updated - version reference updated to v2.2.0)
- Follow-up TODOs:
    - Create docs/architecture/bounded-contexts.md (referenced in DDD workflow)
-->
# The Yesod Ecosystem Constitution

This document outlines the core principles, architectural constraints, and development workflows for the Yesod project, which includes the Yesod API, the Shaliah application, the Ezer bot, and the asynchronous worker.

## Core Principles

### I. Domain-Driven Design (DDD)

The system architecture and code organization must reflect the business domain and be structured around domain concepts rather than technical concerns. This foundational principle ensures maintainability, clarity, and alignment with business requirements.
- **Domain Modeling:** Core business entities, value objects, and domain services should be clearly defined and separated from infrastructure concerns.
- **Bounded Contexts:** Different functional areas (e.g., authentication, content management, bot interactions) should have clear boundaries and well-defined interfaces.
- **Ubiquitous Language:** Code, documentation, and communication should use consistent terminology that matches the business domain and the real-world problems of target users (pastors, church volunteers).
- **Domain-First Architecture:** Business logic should be independent of frameworks, databases, and external systems, making the system more testable and adaptable.

### II. Pragmatic, MVP-First Development
Features should be planned and developed in phases. The primary goal is to ship a valuable Minimum Viable Product (MVP) quickly. More complex features or optimizations should be placed on a clear roadmap and built upon a solid foundation, rather than attempting to build everything at once. This principle prioritizes delivering value to users over premature optimization.

### III. Reliability Through Comprehensive Testing
All applications must be accompanied by a robust testing suite to ensure correctness and reliability. The choice of testing technology is standardized based on the application's role.
- **Web Interface (`shaliah-next`):** All UI components and user-facing logic MUST be tested using **Jest** and **React Testing Library**.
- **Backend APIs (`yesod-api`, `ezer-bot`):** Backend services and libraries MUST be tested using **Vitest**.
- **Test-Driven Development (TDD):** For business-critical and error-prone parts of the system (e.g., ETL data parsers, asynchronous job handlers, core authentication logic), a TDD approach is mandatory to ensure resilience.

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

## Development Workflow

This section defines mandatory workflows that enforce the Core Principles in day-to-day development. Each workflow maps directly to one or more constitutional principles.

### Domain-Driven Design Workflow (Principle I)

- **Code Organization:** All code MUST be organized by domain concepts, not technical layers. Create directories like `domains/worship/`, `domains/scheduling/` rather than `controllers/`, `services/`.
- **Ubiquitous Language:** Code reviews MUST verify that class names, function names, and variable names use domain terminology (e.g., `ServiceSchedule`, `WorshipLeader`) not generic technical terms (e.g., `DataManager`, `Handler`).
- **Bounded Context Boundaries:** When introducing a new functional area, explicitly document its bounded context in `docs/architecture/bounded-contexts.md` before implementation begins.
- **Domain-First Implementation:** Business logic MUST reside in domain entities and services. Infrastructure concerns (HTTP, database, queue) MUST be isolated in separate layers that depend on the domain, never the reverse.

### MVP-First Planning Workflow (Principle II)

- **Spec-Driven Development:** All significant features MUST begin with a specification document (using `.specify/templates/spec-template.md`) that defines the MVP scope and defers non-essential features to a roadmap.
- **Feature Scoping:** During planning, explicitly categorize requirements as "MVP" vs "Future Enhancement". Only MVP items proceed to implementation.
- **Iterative Delivery:** Features MUST be merged and deployed in their MVP form first. Enhancements are treated as separate, subsequent features.
- **Roadmap Maintenance:** All deferred enhancements MUST be documented in a feature `roadmap.md` file within the spec directory.

### Test-Driven Development Workflow (Principle III)

- **Red-Green-Refactor Cycle:** For business-critical code (authentication, data parsing, job handlers), developers MUST:
  1. Write a failing test that describes the expected behavior
  2. Write the minimal code to make the test pass
  3. Refactor while keeping tests green
- **Test-First Commitment:** Tests MUST be written and committed before implementation code. PRs that introduce business logic without corresponding tests MUST be rejected.
- **Framework Compliance:** 
  - Web UI tests (`shaliah-next`) MUST use Jest + React Testing Library
  - Backend/API tests (`yesod-api`, `ezer-bot`, `worker`) MUST use Vitest
- **Coverage Quality Gates:** PRs MUST NOT reduce test coverage. Critical paths (auth, data integrity) MUST have 100% branch coverage.

### API Contract Workflow (Principle IV)

- **Contract-First Design:** Before implementing any API endpoint:
  1. Define the contract (request/response schemas) in `specs/[feature]/contracts/`
  2. Write contract tests that validate the schema
  3. Get contract review/approval
  4. Implement the endpoint to satisfy the contract
- **Client Validation:** Code reviews MUST verify that client applications (`shaliah-next`, `ezer-bot`) do NOT contain business logic. All business rules MUST be centralized in `yesod-api`.
- **Single Source of Truth:** Database access, data validation, and business rules MUST only exist in `yesod-api`. Clients are thin consumers that call the API and render results.

### Asynchronous Task Workflow (Principle V)

- **Task Identification:** During feature planning, identify any operation that:
  - Takes >1 second to complete
  - Processes large files (>1MB)
  - Makes external API calls
  - Performs CPU-intensive work (audio processing, ML inference)
- **Job Queue Pattern:** These tasks MUST be:
  1. Defined as job handlers in `apps/worker/src/handlers/`
  2. Queued via `pg-boss` from the API endpoint
  3. Processed asynchronously by the worker
  4. Return a job ID to the client for status polling
- **Never Block the API:** Code reviews MUST reject any PR that performs long-running work in an API request handler.

### TypeScript Monorepo Workflow (Principle VI)

- **TypeScript-Only Rule:** All new code MUST be written in TypeScript. JavaScript files are only permitted for configuration (e.g., `.eslintrc.js`).
- **Shared Code Extraction:** When code is duplicated across apps, it MUST be extracted to a shared package in `packages/` with proper TypeScript declarations.
- **Workspace References:** Apps MUST reference shared packages using workspace protocol (`"workspace:*"`) in `package.json`, not by publishing to npm.
- **Type Safety:** TypeScript strict mode MUST remain enabled. PRs that introduce `any` types or `@ts-ignore` comments MUST provide explicit justification.

### Supabase Integration Workflow (Principle VII)

- **Database Schema Changes:** All schema modifications MUST:
  1. Be authored as Drizzle ORM migration files in TypeScript
  2. Be tested locally against a Supabase dev branch (via MCP)
  3. Be reviewed before merging
  4. Never be applied directly to production database
- **Authentication Flow:** All user authentication MUST flow through Supabase Auth. Custom auth logic is forbidden.
- **RLS Policies:** Database tables MUST have Row-Level Security policies defined. Code reviews MUST verify RLS is enabled for new tables.

### MCP-Assisted Development Workflow (Principle VIII)

- **MCP Setup Requirement:** All developers MUST have MCP servers configured:
  - Chrome DevTools MCP for frontend debugging
  - Supabase MCP for database inspection
- **Debugging Best Practice:** When debugging, developers SHOULD:
  1. Use Supabase MCP to inspect database state (read-only)
  2. Use Chrome DevTools MCP to automate browser testing
  3. Document findings in PR descriptions or bug reports
- **Research Workflow:** When researching unknowns during planning phase, utilize MCP servers to gather live data and validate assumptions.

### Internationalization Workflow (Principle IX)

- **Translation Key Management:**
  - User-facing strings MUST NEVER be hardcoded. All text MUST use translation keys.
  - For `shaliah-next`: Define keys in `messages/en.json` and `messages/pt-BR.json`
  - For `ezer-bot`: Define keys in `src/locales/en.ftl` and `src/locales/pt-BR.ftl`
- **Primary Language Parity:** Brazilian Portuguese (pt-BR) and English (en) MUST be updated together. PRs that add English strings without pt-BR equivalents MUST be rejected.
- **Translation Review:** All new translation keys MUST be reviewed by a native speaker before release.
- **Fallback Languages:** Spanish (es), French (fr), German (de), Ukrainian (uk), and Russian (ru) translations MAY lag behind primary languages but MUST be updated before major releases.

### Code Quality & Observability Workflow

- **Linting & Formatting:** All code MUST pass ESLint and Prettier checks before commit. Use shared configs from `packages/eslint-config-custom`.
- **Structured Logging:** All logging MUST use `packages/logger` module. Direct use of `console.log`, `console.error`, etc. is strictly forbidden.
- **Error Tracking:** Each application MUST initialize its environment-specific Sentry SDK. All errors MUST be reported through the logger module for consistent context capture.
- **Secrets Management:** Sensitive credentials MUST be managed via environment variables (`.env`). A `.env.example` file with dummy values MUST be maintained. Secrets MUST NEVER be committed to version control.

### Deployment & Release Workflow

- **Independent Deployment:** The `yesod-api`, `ezer-bot`, `worker`, and `shaliah-next` MUST be deployed as independent services with separate release cycles.
- **Database Migration Safety:** Migrations MUST be backwards-compatible. Breaking schema changes MUST be deployed in phases (add new column → migrate data → remove old column).
- **Release Validation:** Before deploying to production, validate in staging environment with production-like data volume and load.

## Governance

This constitution is the supreme source of truth for the project's architecture and development practices. It supersedes all other informal agreements or previous plans.
- All Pull Requests and code reviews must verify compliance with the principles and constraints outlined in this document.
- Any proposal to amend this constitution must be documented, reviewed, and approved. A clear migration plan must be provided if the change affects existing architecture.

**Version**: 2.2.0 | **Ratified**: 2025-09-25 | **Last Amended**: 2025-10-01
