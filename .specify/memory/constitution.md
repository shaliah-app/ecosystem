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

### III. Reliability Through Test-Driven Development (TDD)
For business-critical and error-prone parts of the system, a Test-Driven Development (TDD) approach is mandatory. This ensures code is correct, reliable, and resilient. TDD is applied selectively to balance reliability with MVP delivery speed.
- **Scope:** This applies primarily to the ETL data parser, asynchronous job handlers in the worker, and core authentication/permissions logic.
- **Process:** A failing test must be written to define a new feature. Code is then written to make the test pass, and finally, the code is refactored for quality.
- **MVP Balance:** For non-critical features in early development phases, comprehensive testing can be deferred to post-MVP iterations, but the identified critical areas must maintain TDD discipline.

### IV. API-First Design
All client applications (Shaliah, Ezer) are consumers of the central **Yesod API**. The API is the single source of truth and the sole gateway to the database and business logic. Clients should not contain business logic that can be centralized in the API. The API layer serves as the application service that orchestrates domain logic, while core business rules remain in domain entities and services as per DDD principles.

### V. Decoupled, Asynchronous Processing
Time-consuming and resource-intensive tasks (e.g., audio fingerprinting, stem separation, transcription) are **never** executed in the main API request-response cycle. They are offloaded to a persistent background **worker** via a robust job queue, ensuring the API remains fast and responsive.

### VI. TypeScript-First Monorepo

All packages and applications in the Yesod ecosystem MUST use TypeScript as the authoritative source language within a modular monorepo architecture. This ensures type safety, code sharing, and consistency across the entire system.
- **TypeScript Requirement:** New packages are authored in TypeScript and provide type declarations. Applications should consume packages with TypeScript typings and prefer workspace references.
- **Monorepo Structure:** All code resides in a single `pnpm` + `Turborepo` monorepo composed of independent `apps` (e.g., `yesod-api`, `ezer-bot`, `worker`) and shared `packages` (e.g., `logger`, `db-types`). This structure promotes code sharing, consistency, and simplified dependency management.
- **Amendment Requirement:** Any deviation from TypeScript-first must be explicitly approved in a constitution amendment.

## Technology Stack & Architecture

This section defines the non-negotiable technology stack for the ecosystem. Any deviation requires an amendment to this constitution.

- **Database:** Supabase (PostgreSQL)
- **Database Migrations & ORM:** `Drizzle ORM` (Schema defined in TypeScript)
- **Backend API (`yesod-api`):** `Hono` framework on a Node.js runtime.
- **Web Application (`shaliah`):** `Nuxt.js` (Vue.js framework) with `shadcn/vue` for UI components.
- **Telegram Bot (`ezer-bot`):** `grammY` framework.
- **Job Queue:** `pg-boss` with a persistent TypeScript worker.
- **Observability:**
    - **Structured Logging:** `Pino` (via a shared `packages/logger` module).
    - **Error Tracking:** `Sentry`.
    - **Sentry SDK Requirement:** Each application (`yesod-api`, `ezer-bot`, `worker`, `shaliah`) **must** include and initialize its own environment-specific Sentry SDK (e.g., `@sentry/node`, `@sentry/nuxt`) to ensure proper context is captured for all error reports.
- **Authentication:** Supabase Auth, supporting Google OAuth and Email Magic Links.
- **Code Quality:**
    - **Linting:** ESLint with shared configuration (`packages/eslint-config-custom`).
    - **Formatting:** Prettier with shared configuration (`packages/prettier-config-custom`).
    - **Type Checking:** TypeScript strict mode enabled across all packages and applications.

## Development Workflow

- **Spec-Driven Development:** All significant features must begin with a planning document (e.g., PRD, User Journey canvas) that is approved before implementation begins.
- **Standardized Logging:** All application services **must** use the shared `packages/logger` module for all logging and exception reporting. Direct use of `console.log` is forbidden. While each application must initialize its own Sentry SDK (for proper context capture), all error reporting should go through the logger module to ensure consistency and maintainability.
- **Code Quality:** All packages must use the shared ESLint and Prettier configurations defined in the `packages` directory to ensure consistent code style.
- **Database Changes:** All schema changes must be managed through Drizzle ORM migration files. Direct changes to the production database schema are strictly forbidden.
- **Secrets Management:** All sensitive credentials (API keys, bot tokens, database URLs) **must** be managed through environment variables (`.env`) and must never be committed to version control. A `.env.example` file should be maintained.
- **Deployment:** The `yesod-api`, `ezer-bot`, and `worker` are deployed as separate, independent services.

## Governance

This constitution is the supreme source of truth for the project's architecture and development practices. It supersedes all other informal agreements or previous plans.
- All Pull Requests and code reviews must verify compliance with the principles and constraints outlined in this document.
- Any proposal to amend this constitution must be documented, reviewed, and approved. A clear migration plan must be provided if the change affects existing architecture.

**Version**: 1.3.0 | **Ratified**: 2025-09-25 | **Last Amended**: 2025-09-29