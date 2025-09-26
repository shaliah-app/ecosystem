
# Feature Specification: Logger package

**Feature Branch**: `002-logger-package`  
**Created**: 2025-09-25  
**Status**: Draft  
**Input**: User description: "logger package"

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a developer or service running within the Yesod monorepo, I want a single, shared logger module so that services can emit structured logs and report exceptions consistently to an error-tracking backend, enabling reliable observability and easier troubleshooting across services.

### Acceptance Scenarios
1. **Given** a service in the monorepo, **When** it imports the shared `logger` package and calls `logger.info('message', {ctx})`, **Then** the message is logged as structured JSON to stdout/stderr with the provided context and metadata.
2. **Given** a caught exception in any service, **When** the code calls `logger.captureException(error, {ctx})`, **Then** the error is both logged locally with full stack/context and forwarded to the configured error-tracking service (Sentry) using the service's DSN.
3. **Given** the application runs in different environments (development, staging, production), **When** environment-specific configuration is set, **Then** the logger respects environment-level settings (log level, Sentry enabled/disabled, sampling rates).

### Edge Cases
- What happens when Sentry DSN is missing or invalid? → The logger should still write local structured logs and not crash the host service; Sentry calls should be no-ops with a clear warning log.
- How are large or circular context objects handled? → The logger must safely serialize context (truncate or redact very large fields) and avoid circular-structure crashes.
- What happens on transient network errors when sending to Sentry? → The capture call should not block critical paths; it should be asynchronous and implement a bounded retry/backoff or let Sentry SDK handle retries.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: The monorepo MUST include a new package at `packages/logger` exposing a stable, typed API for structured logging and error capture.
- **FR-002**: The logger MUST provide these methods: `info(message: string, context?: object)`, `warn(message: string, context?: object)`, `error(error: Error | string, context?: object)`, and `captureException(error: Error, context?: object)`.
- **FR-003**: Logs MUST be emitted as structured JSON to stdout/stderr suitable for consumption by log collectors.
- **FR-004**: `captureException` MUST both log the exception locally and send it to an external error-tracking service when configured.
- **FR-005**: The logger MUST be configurable via environment variables or a simple config object to set log level, Sentry DSN, environment name, and sampling/telemetry toggles.
- **FR-006**: The logger MUST be resilient: missing or invalid external configuration (e.g., absent Sentry DSN) MUST not cause application crashes.
-- **FR-007**: The API MUST be authored in TypeScript and include minimal tests validating behavior (happy path + at least one edge case). The monorepo constitution requires TypeScript-first packages; `@yesod/logger` must provide typings.

*Unclear/Design Decisions*:
- **FR-008**: The storage/forwarding of logs to a central log sink (e.g., Supabase Log Explorer, external log shipper) is out of scope for MVP and should be planned later.

### Key Entities *(include if feature involves data)*
- **Logger Config**: { level: string, sentryDsn?: string, environment?: string, serviceName?: string, sampleRate?: number }
- **Log Entry**: { timestamp: string, level: string, message: string, service: string, environment: string, context?: object, meta?: object }

---

## Implementation Plan (mapping to our workspace)

This section maps the attached Implementation Plan into concrete workspace changes and steps required to deliver the MVP.

1) Create package scaffolding
   - Add `packages/logger/package.json` with name `@yesod/logger`, authored in TypeScript, main/exports, and build scripts. Use the module format consistent with the repo (see constitution: TypeScript-first requirement).
   - Add `packages/logger/tsconfig.json` aligned with workspace TypeScript settings.

2) Dependencies
   - Add `pino` and `@sentry/node` (and `@sentry/types` if desired) as dependencies of `packages/logger`. Note: the shared logger will not bundle framework-specific Sentry adapters; applications choose the adapter appropriate to their runtime. For example, `apps/shaliah` (Nuxt) should use `@sentry/nuxt` while server-side apps may use `@sentry/node`.
   - Add `pino-pretty` as a dev-time optional helper for local development.

3) Core implementation
   - Implement `packages/logger/src/index.ts` exporting a typed `logger` object with methods: `info`, `warn`, `error`, `captureException`.
   - Configure Pino to emit JSON and accept an injected serializer for context; provide options to set destination (stdout) and log level.
   - Initialize Sentry conditionally when a DSN is supplied; ensure SDK init is idempotent and per-process.
   - Implement `captureException` to both `pino.error(...)` and call `Sentry.captureException(...)` asynchronously.
   - Provide a `createLogger(options?)` factory to allow per-service customization (serviceName, environment, extra context).

4) Integration in apps
   - Update `apps/yesod-api`, `apps/ezer-bot`, `apps/worker`, `apps/shaliah` to add `@yesod/logger` as a dependency (via workspace references) and initialize Sentry in their main entrypoints using env var DSN. For `apps/shaliah` use `@sentry/nuxt` to capture both client and server context; the shared logger remains responsible for structured logs and server-side capture forwarding.
   - Replace direct `console.*` calls in critical paths with `logger.*` (start with a few key places: server start, uncaughtException handlers, top-level request handling).

5) Environment & config
   - Document necessary environment variables: `SENTRY_DSN`, `LOG_LEVEL`, `SERVICE_NAME`, `NODE_ENV`, `SENTRY_ENVIRONMENT`, `SENTRY_SAMPLE_RATE`.
   - Ensure default values for development (e.g., local pretty printing, Sentry disabled by default).

6) Tests & smoke checks
   - Add unit tests in `packages/logger` verifying: formatting of log entries, `captureException` calls Sentry when initialized (mock Sentry), and safe behavior when Sentry is absent.
   - Add a small smoke-run script in each app to verify logger integration (e.g., call `logger.info` and `logger.captureException` and observe no throw).

7) CI / Release
   - Add a changelog / README for `packages/logger` with usage and env vars.
   - Ensure monorepo package manager links the package (pnpm workspace); update root workspace if necessary.

---

## Review & Acceptance Checklist

- [ ] `packages/logger` exists and is importable in workspace apps
- [ ] `logger` API methods present and typed
- [ ] Local structured JSON logs produced by `logger.info`/`warn`/`error`
- [ ] `captureException` logs locally and forwards to Sentry when DSN provided
- [ ] Missing Sentry DSN does not crash services
- [ ] Minimal unit tests exist and pass
- [ ] README with usage and env var guidance added

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---

## Open Questions / [NEEDS CLARIFICATION]

- [NEEDS CLARIFICATION: Module format] The monorepo prefers TypeScript-first. Confirm whether we should set the package to ESM (`"type":"module"`) or keep CommonJS for compatibility with any non-ESM packages. If you don't have a strong preference, I'll default to ESM to match modern TypeScript tooling.

---
