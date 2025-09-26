# Phase 0 — Research: Logger package ("@yesod/logger")

## Purpose
Resolve unknowns and make concrete design decisions required to implement the shared `@yesod/logger` package for the Yesod monorepo.

## Decisions

- Decision: Package name
  - Chosen: `@yesod/logger`
  - Rationale: Matches monorepo naming convention and your explicit preference.

- Decision: Language and typing
  - Chosen: TypeScript-first (author the package in TypeScript and export typings).
  - Rationale: The project constitution mandates TypeScript-first packages; all apps use TypeScript.

- Decision: Module format
  - Chosen: ESM by default (`"type":"module"` in package.json) unless a hard compatibility constraint appears.
  - Rationale: Modern TypeScript tooling and bundlers prefer ESM; this reduces friction for tree-shaking and modern builds. If a consuming app requires CommonJS, add a small compatibility build output during packaging.

- Decision: Sentry integration approach
  - Chosen: Shared package initializes server-side Sentry via `@sentry/node` when a DSN is present, but will NOT bundle framework-specific adapters. Applications choose their adapter: `@sentry/nuxt` for `apps/shaliah`, `@sentry/node` for server processes.
  - Rationale: Keeps the shared package lightweight and avoids coupling client-side SDKs into the shared library.

- Decision: Log shipping / transports
  - Chosen: MVP will emit structured JSON logs to stdout; advanced transports (HTTP shipper, ELK/Supabase integration) are deferred to a future iteration.
  - Rationale: Simpler, robust, and compatible with most log collection setups; you preferred deferring complex transports.

- Decision: Defaults for development vs production
  - Development: `pino-pretty` for readable console output; Sentry disabled by default unless `SENTRY_DSN` is provided.
  - Production: JSON logs, Sentry enabled when `SENTRY_DSN` is present, log level default `info`.

- Decision: Testing framework
  - Chosen: `vitest` for unit tests (or match monorepo test runner if there's an established choice).
  - Rationale: Fast, TypeScript-friendly, and commonly used in modern monorepos. Tests will include happy path and edge case (missing Sentry, circular context objects).


## Remaining unknowns (low-risk)

- Node version target: recommend Node LTS (>=18). If you have a firm runtime target, list it and we'll add it to the plan.
- Monorepo packaging/publishing strategy: internal workspace references via pnpm (no immediate publish required).

## Research tasks produced

1. Validate ESM compatibility with existing apps (quick audit of `package.json` in each app). (low effort)
2. Research safe serialization strategies for circular objects (use `flatted` or `fast-safe-stringify`, or use pino serializers).
3. Evaluate Sentry initialization patterns to ensure idempotency across modules (best practices: single init per process).
4. Document environment variables and default values for the README and quickstart.

## Output

Resolved: module format (ESM default), TypeScript-first requirement, Sentry per-app adapters, transports deferred. These decisions will be used in Phase 1.
